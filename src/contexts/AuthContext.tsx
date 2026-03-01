import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(loadingTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Load cached profile immediately for instant UI
        const cachedProfile = localStorage.getItem(`profile_${session.user.id}`);
        if (cachedProfile) {
          try {
            setProfile(JSON.parse(cachedProfile));
          } catch (e) {
            // Invalid cache, ignore
          }
        }
        // Then fetch fresh data
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      clearTimeout(loadingTimeout);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Load cached profile immediately
          const cachedProfile = localStorage.getItem(`profile_${session.user.id}`);
          if (cachedProfile) {
            try {
              setProfile(JSON.parse(cachedProfile));
            } catch (e) {
              // Invalid cache, ignore
            }
          }
          await fetchProfile(session.user.id);
        } else {
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error || error.code === 'PGRST116') {
        setProfile(data);
        // Cache profile for instant load next time
        if (data) {
          localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        }
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    return data;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      // Re-throw with better error message
      if (error.message?.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Immediately clear UI state for instant feedback
      const userId = user?.id;
      setProfile(null);
      setUser(null);
      setSession(null);
      
      // Clear profile cache
      if (userId) {
        localStorage.removeItem(`profile_${userId}`);
      }
      
      // Sign out from Supabase in background (don't wait)
      supabase.auth.signOut().catch((error) => {
        console.error('Background signout error:', error);
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    await fetchProfile(user.id);
    
    // Update cache immediately
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
