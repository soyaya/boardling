import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useAuthStore } from '../store/useAuthStore';
import WelcomeStep from '../components/onboarding/WelcomeStep';
import ConnectWalletStep from '../components/onboarding/ConnectWalletStep';
import AddWalletStep from '../components/onboarding/AddWalletStep';
import CompletionStep from '../components/onboarding/CompletionStep';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, previousStep, createdProjectId, createdWalletId, isCompleting, setStep } = useOnboardingStore();
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin?redirect=/onboarding');
    }
  }, [isAuthenticated, navigate]);

  // If user has already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (user?.onboarding_completed === true) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Restore onboarding progress on mount
  useEffect(() => {
    const restoreOnboardingState = async () => {
      if (isAuthenticated && user && !user.onboarding_completed) {
        // Determine the correct step based on backend data
        if (user.has_project && user.has_wallet) {
          // Both exist but onboarding not marked complete - trigger completion
          // This shouldn't normally happen, but handle it gracefully
          setStep(3);
        } else if (user.has_project && !user.has_wallet) {
          // Project exists but no wallet - fetch project ID and go to step 3
          console.log('Resuming onboarding: Project exists, need to add wallet');
          
          // Fetch the existing project ID
          try {
            const { api } = await import('../services/apiClient');
            const projectsResponse = await api.projects.list();
            if (projectsResponse.success && projectsResponse.data && projectsResponse.data.length > 0) {
              const { setCreatedProjectId } = useOnboardingStore.getState();
              setCreatedProjectId(projectsResponse.data[0].id);
            }
          } catch (error) {
            console.error('Failed to fetch existing project:', error);
          }
          
          setStep(3);
        } else if (!user.has_project) {
          // No project yet - check if we have project data in store
          const state = useOnboardingStore.getState();
          if (state.projectData && Object.keys(state.projectData).length > 1) {
            // Has project data saved - go to step 2 (project form)
            console.log('Resuming onboarding: Project data saved, showing project form');
            setStep(2);
          } else {
            // Fresh start - go to step 1 (welcome)
            console.log('Starting onboarding from beginning');
            setStep(1);
          }
        }
      }
    };

    restoreOnboardingState();
  }, [isAuthenticated, user, setStep]);

  const handleBack = () => {
    if (currentStep > 1) {
      previousStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Header / Logo */}
      <header className="p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Boardling" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">Boardling</span>
          </div>
          
          {/* Back button for steps 2 and 3 */}
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && <WelcomeStep key="step1" />}
          {currentStep === 2 && <ConnectWalletStep key="step2" />}
          {currentStep === 3 && !isCompleting && <AddWalletStep key="step3" />}
          {isCompleting && <CompletionStep key="completion" />}
        </AnimatePresence>
      </main>

      {/* Progress Indicator */}
      {currentStep > 1 && !isCompleting && (
        <div className="p-8">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Step {currentStep} of 3</span>
              <span className="text-xs text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    step <= currentStep ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
