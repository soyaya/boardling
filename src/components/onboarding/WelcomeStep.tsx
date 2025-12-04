import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const WelcomeStep: React.FC = () => {
  const { nextStep } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Welcome to Boardling
        </h1>
        <p className="text-xl text-gray-600 font-light">
          Let's set up your project and start tracking your Zcash analytics
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Wallets</h3>
            <p className="text-sm text-gray-600">Monitor all your Zcash wallets in one place</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Privacy First</h3>
            <p className="text-sm text-gray-600">Your data is encrypted with FHE technology</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Deep Insights</h3>
            <p className="text-sm text-gray-600">Understand user behavior and grow faster</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={nextStep}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-black rounded-full overflow-hidden transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <span className="mr-2">Get Started</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="text-sm text-gray-500">
          Takes less than 2 minutes to set up
        </p>
      </div>
    </motion.div>
  );
};

export default WelcomeStep;
