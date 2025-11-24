import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';

const AddWalletStep: React.FC = () => {
  const navigate = useNavigate();
  const {
    startupName, description, tAddress, zAddress, isPrivate,
    setStartupDetails
  } = useOnboardingStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save this data
    navigate('/dashboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add your startup details</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name</label>
          <input
            type="text"
            value={startupName}
            onChange={(e) => setStartupDetails({ startupName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            placeholder="e.g. Zcash DeFi Protocol"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setStartupDetails({ description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
            placeholder="Briefly describe your project..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transparent Address (t-addr)</label>
          <input
            type="text"
            value={tAddress}
            onChange={(e) => setStartupDetails({ tAddress: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm"
            placeholder="t1..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shielded Address (z-addr)</label>
          <input
            type="text"
            value={zAddress}
            onChange={(e) => setStartupDetails({ zAddress: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-mono text-sm"
            placeholder="zs1..."
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-gray-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Private Mode</p>
              <p className="text-xs text-gray-500">Data encrypted & only shared with paid users</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStartupDetails({ isPrivate: !isPrivate })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPrivate ? 'bg-black' : 'bg-gray-200'
              } `}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPrivate ? 'translate-x-5' : 'translate-x-0'
                } `}
            />
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          Complete Setup
        </button>
      </form>
    </motion.div>
  );
};

export default AddWalletStep;
