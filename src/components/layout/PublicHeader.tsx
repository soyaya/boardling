import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center space-x-2">
          <img src="/logo.png" alt="Boardling" className="w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">Boardling</span>
        </button>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => navigate('/features')} className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Features
          </button>
          <button onClick={() => navigate('/testimonials')} className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Testimonials
          </button>
          <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Pricing
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/signin')}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
