import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../store/useOnboardingStore';
import WelcomeStep from '../components/onboarding/WelcomeStep';
import ConnectWalletStep from '../components/onboarding/ConnectWalletStep';
import AddWalletStep from '../components/onboarding/AddWalletStep';

const Onboarding: React.FC = () => {
  const currentStep = useOnboardingStore((state) => state.currentStep);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header / Logo */}
      <header className="p-6">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Boardling" className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Boardling</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {currentStep === 1 && <WelcomeStep key="step1" />}
          {currentStep === 2 && <ConnectWalletStep key="step2" />}
          {currentStep === 3 && <AddWalletStep key="step3" />}
        </AnimatePresence>
      </main>

      {/* Progress Indicator (Optional) */}
      {currentStep > 1 && (
        <div className="p-8 flex justify-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1 rounded-full transition-all duration-300 ${step <= currentStep ? 'w-8 bg-black' : 'w-2 bg-gray-200'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
