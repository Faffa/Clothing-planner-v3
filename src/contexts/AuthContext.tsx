import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as UserProfile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      // Demo mode fallback
      const timer = setTimeout(() => {
        setUser({
          id: 'demo-user-1',
          email: 'demo@maison.app',
          avatar_url: undefined,
        });
        setProfile({
          id: 'profile-1',
          user_id: 'demo-user-1',
          display_name: 'Sarah',
          location: 'Helsinki, Finland',
          temp_unit: 'celsius',
          week_start_day: 'monday',
          onboarding_completed: true,
          created_at: new Date().toISOString(),
        });
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Real Supabase auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          avatar_url: session.user.user_metadata?.avatar_url,
        });
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            avatar_url: session.user.user_metadata?.avatar_url,
          });
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      // Demo mode: just set the demo user
      setUser({ id: 'demo-user-1', email: 'demo@maison.app' });
      setProfile({
        id: 'profile-1',
        user_id: 'demo-user-1',
        display_name: 'Sarah',
        location: 'Helsinki, Finland',
        temp_unit: 'celsius',
        week_start_day: 'monday',
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      });
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (supabase && user) {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id)
        .select()
        .single();
      if (!error && updated) {
        setProfile(updated as UserProfile);
        return;
      }
    }
    // Fallback: local-only update
    if (profile) {
      setProfile({ ...profile, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
