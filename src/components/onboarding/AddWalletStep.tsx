import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, Shield, Eye, EyeOff, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useOnboardingStore, type PrivacyMode } from '../../store/useOnboardingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/apiClient';

const AddWalletStep: React.FC = () => {
  const navigate = useNavigate();
  const { createdProjectId, walletData, updateWalletData, setCreatedWalletId, setIsCompleting, reset } = useOnboardingStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    address: walletData.address || '',
    label: walletData.label || '',
    privacy_mode: walletData.privacy_mode || 'private' as PrivacyMode,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    type: string | null;
    message: string;
  }>({ isValid: false, type: null, message: '' });

  const privacyModes: { 
    value: PrivacyMode; 
    label: string; 
    description: string;
    icon: any;
  }[] = [
    { 
      value: 'private', 
      label: 'Private', 
      description: 'Your data is completely private and not shared',
      icon: EyeOff 
    },
    { 
      value: 'public', 
      label: 'Public', 
      description: 'Anonymized data shared for aggregate statistics',
      icon: Eye 
    },
    { 
      value: 'monetizable', 
      label: 'Monetizable', 
      description: 'Allow others to purchase access to your analytics data',
      icon: DollarSign 
    },
  ];

  const validateZcashAddress = (address: string) => {
    if (!address) {
      setAddressValidation({ isValid: false, type: null, message: '' });
      return;
    }

    // Basic Zcash address validation
    if (address.startsWith('t1') && address.length >= 34) {
      setAddressValidation({ 
        isValid: true, 
        type: 'transparent', 
        message: 'Valid transparent address' 
      });
    } else if (address.startsWith('zs1') && address.length >= 78) {
      setAddressValidation({ 
        isValid: true, 
        type: 'shielded', 
        message: 'Valid shielded address' 
      });
    } else if (address.startsWith('u1') && address.length >= 100) {
      setAddressValidation({ 
        isValid: true, 
        type: 'unified', 
        message: 'Valid unified address' 
      });
    } else {
      setAddressValidation({ 
        isValid: false, 
        type: null, 
        message: 'Invalid Zcash address format' 
      });
    }
  };

  const handleAddressChange = (address: string) => {
    setFormData(prev => ({ ...prev, address }));
    validateZcashAddress(address);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.address.trim()) {
      errors.address = 'Wallet address is required';
    } else if (!addressValidation.isValid) {
      errors.address = 'Please enter a valid Zcash address';
    }

    if (!formData.label.trim()) {
      errors.label = 'Wallet label is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!createdProjectId) {
      setError('No project found. Please go back and create a project first.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update onboarding store
      updateWalletData(formData);

      // Add wallet via API
      const response = await api.wallets.add({
        project_id: createdProjectId,
        address: formData.address,
        label: formData.label,
        privacy_mode: formData.privacy_mode,
      });

      if (response.success && response.data) {
        // Store wallet ID
        setCreatedWalletId(response.data.id);
        
        // Trigger completion step
        setIsCompleting(true);
      } else {
        setError(response.error || 'Failed to add wallet');
      }
    } catch (err) {
      console.error('Wallet addition error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Try to mark onboarding as complete (optional - backend endpoint may not exist yet)
      if (user) {
        try {
          await api.users.updateProfile({ onboarding_completed: true });
        } catch (err) {
          console.warn('Could not update onboarding status:', err);
          // Continue anyway - this is not critical
        }
      }
      
      // Clear onboarding data and redirect
      reset();
      navigate('/dashboard');
    } catch (err) {
      console.error('Skip onboarding error:', err);
      // Still navigate even if update fails
      reset();
      navigate('/dashboard');
    }
  };

  if (!createdProjectId) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center"
      >
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Required</h2>
        <p className="text-gray-600 mb-6">
          You need to create a project first before adding wallets.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back to Project Creation
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Add Your First Wallet</h2>
        <p className="text-gray-600 text-lg">
          Add a Zcash wallet to start tracking your analytics
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Wallet Addition Failed</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address *
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                formErrors.address 
                  ? 'border-red-300 focus:ring-red-500' 
                  : addressValidation.isValid
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-200 focus:ring-black'
              }`}
              placeholder="t1abc123... or zs1xyz789... or u1def456..."
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Address Validation Feedback */}
          {formData.address && (
            <div className="mt-2">
              {addressValidation.isValid ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{addressValidation.message}</span>
                </div>
              ) : addressValidation.message ? (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{addressValidation.message}</span>
                </div>
              ) : null}
            </div>
          )}
          
          {formErrors.address && (
            <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
          )}
        </div>

        {/* Wallet Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Label *
          </label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
              formErrors.label 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-black'
            }`}
            placeholder="Main Wallet, Treasury, User Deposits, etc."
            required
            disabled={isSubmitting}
          />
          {formErrors.label && (
            <p className="mt-1 text-sm text-red-600">{formErrors.label}</p>
          )}
        </div>

        {/* Privacy Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Privacy Mode *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {privacyModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <label
                  key={mode.value}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.privacy_mode === mode.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="privacy_mode"
                    value={mode.value}
                    checked={formData.privacy_mode === mode.value}
                    onChange={(e) => setFormData({ ...formData, privacy_mode: e.target.value as PrivacyMode })}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <Icon className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{mode.label}</div>
                    <div className="text-sm text-gray-500">{mode.description}</div>
                  </div>
                  {formData.privacy_mode === mode.value && (
                    <CheckCircle className="w-5 h-5 text-black flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Privacy Notice</h4>
              <p className="text-sm text-blue-700 mt-1">
                We only analyze on-chain transaction patterns and never access private transaction details. 
                Your wallet's privacy is maintained while providing valuable analytics insights.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !addressValidation.isValid}
            className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Adding wallet...</span>
              </>
            ) : (
              <>
                <span>Add Wallet & Complete Setup</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
        </div>

        <p className="text-xs text-center text-gray-500">
          You can always add more wallets later from your dashboard
        </p>
      </form>
    </motion.div>
  );
};

export default AddWalletStep;
