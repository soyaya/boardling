import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../services/userService';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('User not found');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userService.updateProfile(user.id, {
        name: formData.name,
        email: formData.email,
        company: formData.company
      });

      if (response.success && response.data) {
        updateUser(response.data);
        setSuccess('Profile updated successfully');
        setHasChanges(false);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
      
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-1" />
            Company (Optional)
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Your company name"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center ${
              loading || !hasChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
