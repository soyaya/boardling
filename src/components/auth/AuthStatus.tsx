/**
 * Authentication Status Component
 * 
 * Displays current authentication status and user information
 */

import React from 'react';
import { useAuth, useAuthActions } from '../../store/useAuthStore';
import { User, LogOut, Settings } from 'lucide-react';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
}

const AuthStatus: React.FC<AuthStatusProps> = ({ 
  showDetails = true, 
  className = '' 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { logout } = useAuthActions();

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex space-x-2">
          <div className="rounded-full bg-gray-300 h-8 w-8"></div>
          {showDetails && (
            <div className="space-y-1">
              <div className="h-3 bg-gray-300 rounded w-20"></div>
              <div className="h-2 bg-gray-300 rounded w-16"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <User className="w-5 h-5" />
        {showDetails && <span className="text-sm">Not signed in</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* User Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">
            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* User Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {/* Navigate to settings */}}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AuthStatus;