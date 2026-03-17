import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

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
    const loadingTimeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(loadingTimeout);
      if (session?.user) {
        // Check blacklist before setting state on initial load
        isUserBlacklisted(session.user.id).then(async (blacklisted) => {
          if (blacklisted) {
            await forceSignOut(session.user.id);
            return;
          }
          setSession(session);
          setUser(session.user);
          const cached = localStorage.getItem(`profile_${session.user.id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (!parsed?.is_blacklisted) setProfile(parsed);
            } catch { /* ignore */ }
          }
          fetchProfile(session.user.id);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If we triggered this event by force-signing out a blacklisted user, ignore it
      if (blockingRef.current) return;

      (async () => {
        if (session?.user) {
          // FIRST: check blacklist before setting any state
          const blacklisted = await isUserBlacklisted(session.user.id);
          if (blacklisted) {
            await forceSignOut(session.user.id);
            window.location.replace('/auth?blocked=1');
            return;
          }

          // Also check profile's is_blacklisted field
          const { data: pd } = await supabase
            .from('profiles')
            .select('is_blacklisted')
            .eq('id', session.user.id)
            .maybeSingle();
          if (pd?.is_blacklisted) {
            await forceSignOut(session.user.id);
            window.location.replace('/auth?blocked=1');
            return;
          }

          // Only set user/session AFTER blacklist check passes
          setSession(session);
          setUser(session.user);

          // Load cached profile
          const cached = localStorage.getItem(`profile_${session.user.id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (!parsed?.is_blacklisted) setProfile(parsed);
            } catch { /* ignore */ }
          }
          await fetchProfile(session.user.id);
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
    await fetchProfile(user.id);
    if (profile) {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify({ ...profile, ...updates }));
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
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
