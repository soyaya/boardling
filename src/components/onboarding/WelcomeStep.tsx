import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const WelcomeStep: React.FC = () => {
  const navigate = useNavigate();
  const setStep = useOnboardingStore((state) => state.setStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Boardling
        </h1>
        <p className="text-xl text-gray-600 font-light">
          Understand Your Users. Grow Your Zcash Product.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => navigate('/signup')}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-black rounded-full overflow-hidden transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <span className="mr-2">Get Started</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-4">
          <button
            onClick={() => navigate('/signin')}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeStep;
