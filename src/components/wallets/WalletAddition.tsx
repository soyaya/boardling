/**
 * Wallet Addition Component
 * 
 * Handles adding Zcash wallets to projects for analytics tracking
 */

import React, { useState } from 'react';
import { Wallet, Shield, Eye, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/apiClient';

interface WalletFormData {
  address: string;
  label: string;
  wallet_type: 'transparent' | 'shielded' | 'unified';
  project_id: string;
}

interface WalletAdditionProps {
  projectId: string;
  onSuccess?: (wallet: any) => void;
  onCancel?: () => void;
}

const WalletAddition: React.FC<WalletAdditionProps> = ({ projectId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<WalletFormData>({
    address: '',
    label: '',
    wallet_type: 'transparent',
    project_id: projectId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    type: string | null;
    message: string;
  }>({ isValid: false, type: null, message: '' });

  const walletTypes = [
    { 
      value: 'transparent', 
      label: 'Transparent Address', 
      description: 'Standard Zcash address (starts with t1)',
      icon: Eye 
    },
    { 
      value: 'shielded', 
      label: 'Shielded Address', 
      description: 'Private Zcash address (starts with zs1)',
      icon: Shield 
    },
    { 
      value: 'unified', 
      label: 'Unified Address', 
      description: 'Multi-pool address (starts with u1)',
      icon: Wallet 
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
      setFormData(prev => ({ ...prev, wallet_type: 'transparent' }));
    } else if (address.startsWith('zs1') && address.length >= 78) {
      setAddressValidation({ 
        isValid: true, 
        type: 'shielded', 
        message: 'Valid shielded address' 
      });
      setFormData(prev => ({ ...prev, wallet_type: 'shielded' }));
    } else if (address.startsWith('u1') && address.length >= 100) {
      setAddressValidation({ 
        isValid: true, 
        type: 'unified', 
        message: 'Valid unified address' 
      });
      setFormData(prev => ({ ...prev, wallet_type: 'unified' }));
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

    setIsSubmitting(true);

    try {
      const response = await api.wallets.add(formData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error || 'Failed to add wallet');
      }
    } catch (error) {
      console.error('Wallet addition error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Wallet to Project</h2>
        <p className="text-gray-600">
          Add a Zcash wallet address to start tracking its analytics and performance metrics.
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

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Wallet Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Wallet Type
          </label>
          <div className="grid grid-cols-1 gap-3">
            {walletTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.wallet_type === type.value
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="wallet_type"
                    value={type.value}
                    checked={formData.wallet_type === type.value}
                    onChange={(e) => setFormData({ ...formData, wallet_type: e.target.value as any })}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <Icon className="w-5 h-5 text-gray-600 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                  {formData.wallet_type === type.value && (
                    <CheckCircle className="w-5 h-5 text-black" />
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
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || !addressValidation.isValid}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Adding wallet...</span>
              </>
            ) : (
              <>
                <span className="mr-2">Add Wallet</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WalletAddition;