import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useProjectStore } from '../../store/useProjectStore';
import type { ProjectCategory } from '../../services/projectService';

const ConnectWalletStep: React.FC = () => {
  const { projectData, createdProjectId, updateProjectData, setCreatedProjectId, setCreatedWalletId, setIsCompleting } = useOnboardingStore();
  const { createProject } = useProjectStore();
  
  const [formData, setFormData] = useState({
    name: projectData.name || '',
    description: projectData.description || '',
    category: projectData.category || 'other' as ProjectCategory,
    website_url: projectData.website_url || '',
    wallet_address: projectData.wallet_address || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories: { value: ProjectCategory; label: string }[] = [
    { value: 'defi', label: 'DeFi' },
    { value: 'social_fi', label: 'Social Fi' },
    { value: 'gamefi', label: 'GameFi' },
    { value: 'nft', label: 'NFT' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'governance', label: 'Governance' },
    { value: 'dao', label: 'DAO' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    } else if (formData.name.length > 255) {
      errors.name = 'Project name must be less than 255 characters';
    }

    if (formData.website_url && formData.website_url.trim()) {
      try {
        new URL(formData.website_url);
      } catch {
        errors.website_url = 'Please enter a valid URL';
      }
    }

    // Validate wallet address
    if (!formData.wallet_address || !formData.wallet_address.trim()) {
      errors.wallet_address = 'Wallet address is required';
    } else {
      const address = formData.wallet_address.trim();
      // Basic Zcash address validation
      const isValid = 
        (address.startsWith('t1') && address.length >= 34) ||
        (address.startsWith('zs1') && address.length >= 78) ||
        (address.startsWith('u1') && address.length >= 100);
      
      if (!isValid) {
        errors.wallet_address = 'Please enter a valid Zcash address (t1..., zs1..., or u1...)';
      }
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
      // Update onboarding store with project data
      updateProjectData(formData);

      // Check if project already exists (from previous session)
      let projectId = createdProjectId;

      // Create project if it doesn't exist
      if (!projectId) {
        console.log('Creating new project...');
        const project = await createProject({
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          website_url: formData.website_url || undefined,
        });

        console.log('Project creation response:', project);

        if (!project) {
          console.error('Project creation failed - no project returned');
          setError('Failed to create project. Please try again.');
          return;
        }

        // Extract project ID - handle both direct project object and wrapped response
        projectId = project.data.id;
        
        if (!projectId) {
          console.error('Project ID not found in response:', project);
          setError('Project created but ID is missing. Please try again.');
          return;
        }

        console.log('Project created with ID:', projectId);
        setCreatedProjectId(projectId);
      } else {
        console.log('Using existing project ID:', projectId);
      }

      // Verify we have a project ID
      if (!projectId) {
        setError('Project ID is missing. Please try again.');
        console.error('Project ID is undefined after creation');
        return;
      }

      // Now create the wallet for this project
      const { api } = await import('../../services/apiClient');
      
      const walletData = {
        project_id: projectId,
        address: formData.wallet_address.trim(),
        label: 'Main Wallet',
        privacy_mode: 'private',
      };
      
      console.log('Creating wallet with project_id:', projectId);
      console.log('Wallet data:', { ...walletData, address: walletData.address.substring(0, 10) + '...' });
      
      const walletResponse = await api.wallets.add(walletData);

      if (!walletResponse.success || !walletResponse.data) {
        console.error('Wallet creation failed:', walletResponse);
        // Show both error code and message for better debugging
        // Response structure: { success: false, error: "ERROR_CODE", message: "Error message" }
        const errorCode = walletResponse.error;
        const errorMessage = walletResponse.message || 'Failed to add wallet. Please try again.';
        const fullError = errorCode && errorMessage ? `${errorMessage}` : (errorMessage || errorCode || 'Failed to add wallet');
        setError(fullError);
        return;
      }
      
      console.log('Wallet created successfully:', walletResponse.data);

      // Store wallet ID - the response structure is { success: true, data: wallet }
      const walletId = walletResponse.data?.id;
      if (!walletId) {
        console.error('Wallet ID not found in response:', walletResponse);
        setError('Wallet created but ID not returned. Please refresh and try again.');
        return;
      }
      
      setCreatedWalletId(walletId);

      // Trigger completion step (which will sync and encrypt data)
      setIsCompleting(true);

    } catch (err) {
      console.error('Project/Wallet creation error:', err);
      setError(err instanceof Error ? err.message : 'Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Your Project</h2>
        <p className="text-gray-600 text-lg">
          Tell us about your Zcash project to get started with analytics
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Project Creation Failed</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
              formErrors.name 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-black'
            }`}
            placeholder="My Awesome Zcash Project"
            required
            disabled={isSubmitting}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            placeholder="Brief description of your project..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Project Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            required
            disabled={isSubmitting}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL (Optional)
          </label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
              formErrors.website_url 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-black'
            }`}
            placeholder="https://myproject.com"
            disabled={isSubmitting}
          />
          {formErrors.website_url && (
            <p className="mt-1 text-sm text-red-600">{formErrors.website_url}</p>
          )}
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zcash Wallet Address *
          </label>
          <input
            type="text"
            value={formData.wallet_address}
            onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-mono text-sm ${
              formErrors.wallet_address 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-black'
            }`}
            placeholder="t1abc123... or zs1xyz789..."
            required
            disabled={isSubmitting}
          />
          {formErrors.wallet_address && (
            <p className="mt-1 text-sm text-red-600">{formErrors.wallet_address}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We'll track transactions for this wallet address
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Creating project...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5 mr-2" />
                <span>Create Project</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ConnectWalletStep;
