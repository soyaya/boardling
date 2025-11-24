import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const ConnectWalletStep: React.FC = () => {
  const { setStep, setWalletConnected } = useOnboardingStore();

  const handleConnect = () => {
    // Simulate wallet connection
    setTimeout(() => {
      setWalletConnected(true);
      setStep(3);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center max-w-md mx-auto"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Connect your wallet</h2>
      <p className="text-gray-500 mb-8">
        Connect your wallet to verify ownership and start tracking your Zcash analytics.
      </p>

      <button
        onClick={handleConnect}
        className="w-full flex items-center justify-center px-6 py-4 border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition-all group"
      >
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all">
          <Wallet className="w-6 h-6 text-gray-700" />
        </div>
        <span className="text-lg font-medium text-gray-900">Connect Wallet</span>
      </button>
    </motion.div>
  );
};

export default ConnectWalletStep;
