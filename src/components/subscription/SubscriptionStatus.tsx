/**
 * Subscription Status Component
 * 
 * Displays current subscription status, expiration, and upgrade options.
 */

import React, { useEffect } from 'react';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';

interface SubscriptionStatusProps {
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  onUpgradeClick,
  compact = false 
}) => {
  const { subscription, loading, error, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (loading && !subscription) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusColor = () => {
    if (subscription.isExpired) return 'red';
    if (subscription.daysRemaining <= 7) return 'yellow';
    if (subscription.isPremium) return 'green';
    return 'blue';
  };

  const getStatusText = () => {
    if (subscription.isExpired) return 'Expired';
    if (subscription.isPremium) return 'Premium';
    return 'Free Trial';
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {statusText}
        </span>
        {!subscription.isExpired && subscription.daysRemaining > 0 && (
          <span className="text-xs text-gray-500">
            {subscription.daysRemaining} days left
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 bg-${statusColor}-50 border-${statusColor}-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {statusText}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
              {subscription.status.toUpperCase()}
            </span>
          </div>

          {subscription.isExpired ? (
            <p className="text-sm text-red-600 mb-4">
              Your subscription has expired. Upgrade to continue accessing premium features.
            </p>
          ) : subscription.daysRemaining <= 7 && !subscription.isPremium ? (
            <p className="text-sm text-yellow-600 mb-4">
              Your free trial expires in {subscription.daysRemaining} days. Upgrade now to keep your analytics.
            </p>
          ) : subscription.isPremium ? (
            <p className="text-sm text-gray-600 mb-4">
              You have full access to all premium features.
              {subscription.expiresAt && (
                <> Renews on {new Date(subscription.expiresAt).toLocaleDateString()}.</>
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-600 mb-4">
              You have {subscription.daysRemaining} days remaining in your free trial.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Member since:</span>
              <p className="font-medium text-gray-900">
                {new Date(subscription.memberSince).toLocaleDateString()}
              </p>
            </div>
            {subscription.balance > 0 && (
              <div>
                <span className="text-gray-500">Balance:</span>
                <p className="font-medium text-gray-900">
                  {subscription.balance.toFixed(8)} ZEC
                </p>
              </div>
            )}
          </div>
        </div>

        {(subscription.isExpired || !subscription.isPremium) && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Upgrade Now
          </button>
        )}
      </div>

      {/* Progress bar for trial */}
      {!subscription.isPremium && !subscription.isExpired && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Trial Progress</span>
            <span>{30 - subscription.daysRemaining} / 30 days used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all bg-${statusColor}-500`}
              style={{ width: `${((30 - subscription.daysRemaining) / 30) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
