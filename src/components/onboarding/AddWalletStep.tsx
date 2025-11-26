import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WalletAddition } from '../wallets';

const AddWalletStep: React.FC = () => {
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Get project ID from onboarding store or URL params
  React.useEffect(() => {
    // In a real implementation, this would come from the previous step
    // For now, we'll use a placeholder or get from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('project') || localStorage.getItem('onboarding_project_id');
    setProjectId(pid);
  }, []);

  const handleWalletAdded = (wallet: any) => {
    console.log('Wallet added:', wallet);
  };

  const handleSkipOrContinue = () => {
    navigate('/dashboard');
  };

  if (!projectId) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Required</h2>
        <p className="text-gray-600 mb-6">
          You need to create a project first before adding wallets.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back to Project Creation
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Add Your First Wallet</h2>
        <p className="text-gray-600 text-lg">
          Add a Zcash wallet to start tracking your analytics
        </p>
      </div>

      <WalletAddition
        projectId={projectId}
        onSuccess={handleWalletAdded}
      />

      {/* Skip or Continue Options */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleSkipOrContinue}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={handleSkipOrContinue}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          You can always add more wallets later from your dashboard
        </p>
      </div>
    </motion.div>
  );
};

export default AddWalletStep;
