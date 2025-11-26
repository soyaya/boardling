/**
 * Loading Screen Component
 * 
 * Displays a loading indicator while the app initializes
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Boardling</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;