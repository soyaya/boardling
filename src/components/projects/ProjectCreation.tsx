/**
 * Project Creation Component
 * 
 * Handles the creation of new analytics projects for users
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building, Globe, Github, Image, Tag, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../services/apiClient';

interface ProjectFormData {
  name: string;
  description: string;
  category: string;
  website_url: string;
  github_url: string;
  logo_url: string;
  tags: string[];
}

interface ProjectCreationProps {
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
}

const ProjectCreation: React.FC<ProjectCreationProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    category: 'defi',
    website_url: '',
    github_url: '',
    logo_url: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'defi', label: 'DeFi Protocol' },
    { value: 'wallet', label: 'Wallet Application' },
    { value: 'exchange', label: 'Exchange/Trading' },
    { value: 'payment', label: 'Payment System' },
    { value: 'privacy', label: 'Privacy Tool' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Project description is required';
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (formData.website_url && !urlPattern.test(formData.website_url)) {
      errors.website_url = 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (formData.github_url && !urlPattern.test(formData.github_url)) {
      errors.github_url = 'Please enter a valid URL (starting with http:// or https://)';
    }
    if (formData.logo_url && !urlPattern.test(formData.logo_url)) {
      errors.logo_url = 'Please enter a valid URL (starting with http:// or https://)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.projects.create(formData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Project creation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h2>
        <p className="text-gray-600">
          Set up a new analytics project to start tracking your Zcash application's performance.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                formErrors.name 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-black'
              }`}
              placeholder="My Zcash DeFi Protocol"
              required
              disabled={isSubmitting}
            />
          </div>
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
              formErrors.description 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-black'
            }`}
            placeholder="A privacy-focused DeFi protocol built on Zcash..."
            rows={3}
            required
            disabled={isSubmitting}
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            disabled={isSubmitting}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                formErrors.website_url 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-black'
              }`}
              placeholder="https://myproject.com"
              disabled={isSubmitting}
            />
          </div>
          {formErrors.website_url && (
            <p className="mt-1 text-sm text-red-600">{formErrors.website_url}</p>
          )}
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Repository
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                formErrors.github_url 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-black'
              }`}
              placeholder="https://github.com/username/project"
              disabled={isSubmitting}
            />
          </div>
          {formErrors.github_url && (
            <p className="mt-1 text-sm text-red-600">{formErrors.github_url}</p>
          )}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL
          </label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                formErrors.logo_url 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 focus:ring-black'
              }`}
              placeholder="https://myproject.com/logo.png"
              disabled={isSubmitting}
            />
          </div>
          {formErrors.logo_url && (
            <p className="mt-1 text-sm text-red-600">{formErrors.logo_url}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Add a tag (e.g., defi, privacy, zec)"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Add
              </button>
            </div>
            
            {/* Tag Display */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-black text-white text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-white hover:text-gray-300"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Creating project...</span>
              </>
            ) : (
              <>
                <span className="mr-2">Create Project</span>
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

export default ProjectCreation;