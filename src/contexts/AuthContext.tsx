import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { trackSignup } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // useRef so the flag is always current inside closures/event listeners
  const blockingRef = useRef(false);

  // Check blacklist table directly — profiles RLS blocks blacklisted users so we can't rely on that
  const isUserBlacklisted = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('blacklist')
      .select('id')
      .eq('entity_id', userId)
      .eq('entity_type', 'customer')
      .eq('is_active', true)
      .maybeSingle();
    return !!data;
  };

  // Single query: fetch profile and check blacklist together
  const fetchProfileAndCheckBlacklist = async (userId: string): Promise<{ blacklisted: boolean; profile: Profile | null }> => {
    const [blacklistRes, profileRes] = await Promise.all([
      supabase.from('blacklist').select('id').eq('entity_id', userId).eq('entity_type', 'customer').eq('is_active', true).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    ]);
    const blacklisted = !!blacklistRes.data || !!profileRes.data?.is_blacklisted;
    return { blacklisted, profile: profileRes.data ?? null };
  };

  const forceSignOut = async (userId: string) => {
    blockingRef.current = true;
    localStorage.removeItem(`profile_${userId}`);
    setProfile(null);
    setUser(null);
    setSession(null);
    setLoading(false);
    await supabase.auth.signOut();
    // Reset after supabase signOut fires onAuthStateChange
    setTimeout(() => { blockingRef.current = false; }, 1500);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error || error.code === 'PGRST116') {
        if (data) {
          setProfile(data);
          localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        }
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadingTimeout = setTimeout(() => setLoading(false), 2000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(loadingTimeout);

      if (session?.user) {
        // Load cached profile instantly & show UI
        const cached = localStorage.getItem(`profile_${session.user.id}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!parsed?.is_blacklisted) setProfile(parsed);
          } catch { /* ignore */ }
        }
        setSession(session);
        setUser(session.user);
        setLoading(false);

        // Single combined query: blacklist + profile in background
        fetchProfileAndCheckBlacklist(session.user.id).then(async ({ blacklisted, profile: p }) => {
          if (blacklisted) {
            await forceSignOut(session.user.id);
            return;
          }
          if (p) {
            setProfile(p);
            localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(p));
          }
        }).catch(() => { /* silently ignore */ });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (blockingRef.current) return;

      (async () => {
        if (session?.user) {
          // Single combined query: blacklist + profile
          const { blacklisted, profile: p } = await fetchProfileAndCheckBlacklist(session.user.id);
          if (blacklisted) {
            await forceSignOut(session.user.id);
            window.location.replace('/auth?blocked=1');
            return;
          }

          setSession(session);
          setUser(session.user);

          if (p) {
            setProfile(p);
            localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(p));
          }
          setLoading(false);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: undefined },
    });
    if (error) throw error;
    if (data?.user) {
      trackSignup(data.user.id, 'email');
    }
    return data as any;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message?.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }

    // Block blacklisted users on email/password login
    if (data.user) {
      const blacklisted = await isUserBlacklisted(data.user.id);
      if (blacklisted) {
        await forceSignOut(data.user.id);
        throw new Error('BLACKLISTED');
      }
    }
  };

  const signOut = async () => {
    const userId = user?.id;
    setProfile(null);
    setUser(null);
    setSession(null);
    if (userId) localStorage.removeItem(`profile_${userId}`);
    supabase.auth.signOut().catch(console.error);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
    const { profile: p } = await fetchProfileAndCheckBlacklist(user.id);
    if (p) {
      setProfile(p);
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(p));
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const { profile: p } = await fetchProfileAndCheckBlacklist(user.id);
    if (p) {
      setProfile(p);
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(p));
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
