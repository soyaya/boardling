/**
 * Subscription Panel Component
 * 
 * Complete subscription management panel with status, upgrade, and history.
 */

import React, { useState, useEffect } from 'react';
import { SubscriptionStatus } from './SubscriptionStatus';
import { UpgradeModal } from './UpgradeModal';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { subscriptionService } from '../../services/subscriptionService';

export const SubscriptionPanel: React.FC = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const { subscription, cancel, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const data = await subscriptionService.getHistory();
    setHistory(data);
    setLoadingHistory(false);
  };

  const handleCancelSubscription = async () => {
    const success = await cancel();
    if (success) {
      setShowCancelConfirm(false);
      await fetchSubscription();
    }
  };

  const handleUpgradeSuccess = async () => {
    await fetchSubscription();
    await loadHistory();
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Subscription
        </h3>
        <SubscriptionStatus 
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      </div>

      {/* Subscription Actions */}
      {subscription && subscription.isPremium && !subscription.isExpired && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Manage Subscription
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Cancel Subscription
                </h4>
                <p className="text-sm text-gray-600">
                  Your subscription will remain active until the end of the current billing period.
                </p>
              </div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment History
        </h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loadingHistory ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No payment history yet</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.amount.toFixed(8)} ZEC
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgradeSuccess}
      />

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowCancelConfirm(false)}
            />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your subscription? You'll lose access to premium features 
                at the end of your current billing period.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPanel;
