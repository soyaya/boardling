import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useTokenValidation } from './hooks/useAuthError';
import ErrorBoundary from './components/ErrorBoundary';
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
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Features from './pages/Features';
import Testimonials from './pages/Testimonials';
import PricingPage from './pages/Pricing';

// App content component with token validation
const AppContent: React.FC = () => {
  // Enable automatic token validation
  useTokenValidation();

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
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
