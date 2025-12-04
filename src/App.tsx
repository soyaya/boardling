import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useTokenValidation } from './hooks/useAuthError';
import { useAuthContext } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Retention from './pages/Retention';
import Adoption from './pages/Adoption';
import ShieldedPool from './pages/ShieldedPool';
import Comparison from './pages/Comparison';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Productivity from './pages/Productivity';
import Segments from './pages/Segments';
import ProjectHealth from './pages/ProjectHealth';
import Projects from './pages/Projects';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Features from './pages/Features';
import Testimonials from './pages/Testimonials';
import PricingPage from './pages/Pricing';

// App content component with token validation
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Enable automatic token validation
  useTokenValidation();

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    const authPages = ['/signin', '/signup'];
    if (isAuthenticated && authPages.includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Show loading screen during initial auth check
  if (loading && location.pathname !== '/' && location.pathname !== '/signin' && location.pathname !== '/signup') {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/features" element={<Features />} />
      <Route path="/testimonials" element={<Testimonials />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* Semi-protected onboarding (requires registration but not full auth) */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Protected Routes - wrapped with ProtectedRoute */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="retention" element={<Retention />} />
        <Route path="adoption" element={<Adoption />} />
        <Route path="shielded" element={<ShieldedPool />} />
        <Route path="comparison" element={<Comparison />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="productivity" element={<Productivity />} />
        <Route path="segments" element={<Segments />} />
        <Route path="project-health" element={<ProjectHealth />} />
        <Route path="projects" element={<Projects />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider position="top-right">
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
