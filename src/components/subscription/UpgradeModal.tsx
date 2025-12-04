/**
 * Upgrade Modal Component
 * 
 * Modal for selecting subscription plan and initiating payment.
 */

import React, { useState } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('biannual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { upgrade } = useSubscriptionStore();

  const plans = subscriptionService.getPlans();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setLoading(true);
    setError(null);

    try {
      const success = await upgrade(plan.duration);
      
      if (success) {
        onSuccess?.();
        onClose();
      } else {
        setError('Failed to upgrade subscription. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Upgrade to Premium
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                  selectedPlan === plan.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
                
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  {plan.discount > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      Save {plan.discount}%
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.price.toFixed(4)} ZEC
                  </div>
                  <div className="text-xs text-gray-500">
                    {plan.pricePerMonth.toFixed(4)} ZEC/month
                  </div>
                </div>

                <ul className="space-y-1">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Selected Plan Summary */}
          {selectedPlanDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Selected Plan: {selectedPlanDetails.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium text-gray-900">
                    {selectedPlanDetails.duration} month{selectedPlanDetails.duration > 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Price:</span>
                  <p className="font-medium text-gray-900">
                    {selectedPlanDetails.price.toFixed(8)} ZEC
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  All Features:
                </h4>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedPlanDetails.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Payment Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Payment Information</p>
                <p>
                  After clicking "Proceed to Payment", you'll receive a Zcash payment address. 
                  Send the exact amount to activate your subscription immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
