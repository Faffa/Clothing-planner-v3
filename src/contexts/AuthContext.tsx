import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '@/types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Initialize Supabase auth listener
    // For now, simulate a demo user for development
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
  }, []);

  const signInWithGoogle = async () => {
    // TODO: Implement Supabase Google OAuth
    console.log('Sign in with Google');
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
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
