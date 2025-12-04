import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, TrendingUp, Shield, BarChart3 } from 'lucide-react';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSubscription().finally(() => setIsLoading(false));
    }
  }, [isOpen, fetchSubscription]);

  if (!isOpen) return null;

  const features = [
    {
      icon: BarChart3,
      title: 'Unlimited Wallet Tracking',
      description: 'Monitor all your Zcash wallets in one place'
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Deep insights into transaction patterns and user behavior'
    },
    {
      icon: Shield,
      title: 'Privacy-First Encryption',
      description: 'Your data is secured with FHE encryption'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome to Boardling!
                  </h2>
                  <p className="text-indigo-100 text-lg">
                    Your analytics platform is ready to go
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Trial Status */}
                {!isLoading && subscription && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Your 30-Day Free Trial Has Started
                        </h3>
                        <p className="text-gray-700 mb-3">
                          You have <span className="font-bold text-green-600">{subscription.daysRemaining} days</span> of full access to all premium features. No credit card required.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Trial expires on:</span>
                          <span className="font-medium text-gray-900">
                            {subscription.expiresAt 
                              ? new Date(subscription.expiresAt).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    What you get with your trial:
                  </h3>
                  <div className="space-y-4">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{feature.title}</h4>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">💡 Pro tip:</span> Your blockchain data is being synced in the background. 
                    It may take a few moments for all your analytics to appear.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Explore Dashboard
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      // Navigate to settings/subscription page
                      window.location.href = '/settings';
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    View Subscription
                  </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                  You can upgrade to a paid plan anytime from Settings
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
