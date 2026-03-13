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

async function fetchOrCreateProfile(userId: string, displayName?: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (data) return data as UserProfile;

  // Profile missing (trigger may not have fired) — create it
  if (error?.code === 'PGRST116' /* no rows */) {
    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .insert({ user_id: userId, display_name: displayName ?? '' })
      .select()
      .single();
    if (!insertErr && created) return created as UserProfile;
    console.error('Failed to create profile:', insertErr);
  } else if (error) {
    console.error('Failed to fetch profile:', error);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Real Supabase auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          avatar_url: session.user.user_metadata?.avatar_url,
        });
        const p = await fetchOrCreateProfile(session.user.id, session.user.user_metadata?.full_name ?? session.user.user_metadata?.name);
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
          const p = await fetchOrCreateProfile(session.user.id, session.user.user_metadata?.full_name ?? session.user.user_metadata?.name);
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
    if (!supabase) return;
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
