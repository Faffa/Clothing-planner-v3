import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { WardrobePage } from '@/pages/WardrobePage';
import { PlannerPage } from '@/pages/PlannerPage';
import { MatchingPage } from '@/pages/MatchingPage';
import { RulesPage } from '@/pages/RulesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { LoginPage } from '@/pages/LoginPage';
import { OnboardingPage } from '@/pages/OnboardingPage';

const basename = import.meta.env.PROD ? '/Clothing-planner-v3' : '/';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-gold tracking-[0.2em] uppercase animate-pulse">
            Maison
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  // Profile still loading (null) — don't redirect yet
  if (profile === null) return null;

  if (!profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/onboarding"
        element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        }
      />
      <Route
        element={
          <AuthGuard>
            <OnboardingGuard>
              <AppLayout />
            </OnboardingGuard>
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="wardrobe" element={<WardrobePage />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="matching" element={<MatchingPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
