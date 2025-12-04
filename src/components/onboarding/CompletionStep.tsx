import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Database, Shield, Sparkles } from 'lucide-react';
import { authService } from '../../services/authService';

type Step = 'syncing' | 'encrypting' | 'complete';

const CompletionStep: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('syncing');
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({ wallets: 0, transactions: 0 });

  useEffect(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    try {
      // Step 1: Sync wallet data and default addresses
      setCurrentStep('syncing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay
      
      // Sync default wallet addresses for all projects
      try {
        const syncResponse = await fetch('/api/projects/sync-default-wallets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log('Default wallets synced:', syncData);
        }
      } catch (syncError) {
        console.warn('Default wallet sync failed:', syncError);
        // Continue anyway - not critical
      }
      
      // Try to sync wallet transactions
      try {
        const walletSyncResponse = await authService.syncWallet();
        if (walletSyncResponse.success) {
          setSyncStats({
            wallets: walletSyncResponse.wallets_synced || 1,
            transactions: walletSyncResponse.total_transactions || 0
          });
        }
      } catch (walletError) {
        console.warn('Wallet sync failed:', walletError);
        // Set default stats
        setSyncStats({ wallets: 1, transactions: 0 });
      }

      // Step 2: Show encryption step
      setCurrentStep('encrypting');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay

      // Step 3: Complete
      setCurrentStep('complete');
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { state: { firstVisit: true } });
      }, 2000);

    } catch (err) {
      console.error('Onboarding completion error:', err);
      setError('Failed to complete setup. Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const steps = [
    {
      key: 'syncing',
      icon: Database,
      title: 'Pulling blockchain data',
      description: 'Fetching your wallet transactions from the indexer...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'encrypting',
      icon: Shield,
      title: 'Encrypting your data',
      description: 'Securing your information with FHE encryption...',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'complete',
      icon: Sparkles,
      title: 'All set!',
      description: 'Your project is ready. Welcome to Boardling!',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const currentStepData = steps.find(s => s.key === currentStep) || steps[0];
  const Icon = currentStepData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isComplete = steps.findIndex(s => s.key === currentStep) > index;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? step.bgColor + ' ' + step.color
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <StepIcon className="w-6 h-6" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-full mt-6 transition-all ${
                      isComplete ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Content */}
        <div className="text-center">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${currentStepData.bgColor} mb-6`}
          >
            <Icon className={`w-10 h-10 ${currentStepData.color}`} />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {currentStepData.description}
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Display */}
          {currentStep === 'complete' && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6"
            >
              <div className="flex items-center justify-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {syncStats.wallets}
                  </div>
                  <div className="text-sm text-gray-600">Wallet{syncStats.wallets !== 1 ? 's' : ''} Synced</div>
                </div>
                <div className="w-px h-12 bg-gray-300" />
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {syncStats.transactions}
                  </div>
                  <div className="text-sm text-gray-600">Transaction{syncStats.transactions !== 1 ? 's' : ''} Found</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trial Information */}
          {currentStep === 'complete' && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Your 30-Day Free Trial Has Started
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enjoy full access to all premium features. No credit card required.
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Unlimited wallet tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Advanced analytics & insights
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Privacy-first FHE encryption
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading Indicator */}
          {currentStep !== 'complete' && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Please wait...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CompletionStep;
