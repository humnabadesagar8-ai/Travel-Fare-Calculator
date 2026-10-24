import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { InterviewPrefillProvider } from '@/context/InterviewPrefillContext';
import { RouterProvider, useRouter } from '@/components/Router';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { DashboardLayout } from '@/components/DashboardLayout';
import { OverviewPage } from '@/pages/dashboard/OverviewPage';
import { ResumePage } from '@/pages/dashboard/ResumePage';
import { MockInterviewPage } from '@/pages/dashboard/MockInterviewPage';
import { VoicePage } from '@/pages/dashboard/VoicePage';
import { SandboxPage } from '@/pages/dashboard/SandboxPage';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { AdminPage } from '@/pages/dashboard/AdminPage';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';
import type { DashboardRoute } from '@/lib/nav';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse-glow" />
          <Loader2 className="h-5 w-5 animate-spin text-ink-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { path } = useRouter();
  const segments = path.replace(/^\/dashboard\/?/, '').split('/');
  const route = (segments[0] || 'overview') as DashboardRoute;

  const pages: Record<DashboardRoute, React.ReactNode> = {
    overview: <OverviewPage />,
    resume: <ResumePage />,
    mock: <MockInterviewPage />,
    voice: <VoicePage />,
    sandbox: <SandboxPage />,
    analytics: <AnalyticsPage />,
    admin: <AdminPage />,
    profile: <ProfilePage />,
    settings: <ProfilePage />,
  };

  return (
    <DashboardLayout active={route}>
      {pages[route] ?? <OverviewPage />}
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { path } = useRouter();

  if (path === '/' || path === '') return <LandingPage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/register') return <RegisterPage />;
  if (path.startsWith('/dashboard')) {
    return (
      <ProtectedRoute>
        <DashboardRouter />
      </ProtectedRoute>
    );
  }

  return <LandingPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InterviewPrefillProvider>
          <RouterProvider>
            <AppRoutes />
          </RouterProvider>
        </InterviewPrefillProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
