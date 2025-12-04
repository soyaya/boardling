import React, { useState, useEffect } from 'react';
import { CreditCard, Mail, DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { userService, type PaymentPreferences as PaymentPrefsType } from '../../services/userService';

export const PaymentPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<PaymentPrefsType>({
    preferred_address_type: 'unified',
    auto_withdraw_enabled: false,
    auto_withdraw_threshold: 1.0,
    notification_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const prefs = await userService.getPaymentPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (err) {
      setError('Failed to load payment preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PaymentPrefsType, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userService.updatePaymentPreferences(preferences);

      if (response.success) {
        setSuccess('Payment preferences updated successfully');
        setHasChanges(false);
      } else {
        setError(response.error || 'Failed to update preferences');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Preferences</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 inline mr-1" />
            Preferred Address Type
          </label>
          <select
            value={preferences.preferred_address_type}
            onChange={(e) => handleChange('preferred_address_type', e.target.value as 'transparent' | 'shielded' | 'unified')}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="transparent">Transparent (t-address)</option>
            <option value="shielded">Shielded (z-address)</option>
            <option value="unified">Unified (u-address)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Default address type for receiving payments
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Notification Email
          </label>
          <input
            type="email"
            value={preferences.notification_email}
            onChange={(e) => handleChange('notification_email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="notifications@example.com"
          />
          <p className="mt-1 text-xs text-gray-500">
            Receive payment notifications at this email
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">Auto-Withdraw</p>
              <p className="text-sm text-gray-500">Automatically withdraw when balance reaches threshold</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('auto_withdraw_enabled', !preferences.auto_withdraw_enabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences.auto_withdraw_enabled ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <span
                className={`${
                  preferences.auto_withdraw_enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          {preferences.auto_withdraw_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Auto-Withdraw Threshold (ZEC)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={preferences.auto_withdraw_threshold}
                onChange={(e) => handleChange('auto_withdraw_threshold', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="1.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum balance to trigger automatic withdrawal
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center ${
              saving || !hasChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
