/**
 * Wallet List Component
 * 
 * Displays a list of wallets in a project with management options
 */

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Settings, Trash2, Calendar, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/apiClient';

interface WalletItem {
  id: string;
  address: string;
  label: string;
  wallet_type: 'transparent' | 'shielded' | 'unified';
  created_at: string;
  balance?: number;
}

interface WalletListProps {
  projectId: string;
  onAddWallet?: () => void;
  className?: string;
}

const WalletList: React.FC<WalletListProps> = ({ 
  projectId, 
  onAddWallet, 
  className = '' 
}) => {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddresses, setShowAddresses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (projectId) {
      loadWallets();
    }
  }, [projectId]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await api.wallets.list(projectId);
      
      if (response.success && response.data) {
        setWallets(response.data);
      } else {
        setError(response.error || 'Failed to load wallets');
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddressVisibility = (walletId: string) => {
    setShowAddresses(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  const formatAddress = (address: string, show: boolean) => {
    if (show) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case 'transparent': return 'bg-blue-100 text-blue-800';
      case 'shielded': return 'bg-green-100 text-green-800';
      case 'unified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">
              <Wallet className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Wallets</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadWallets}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project Wallets</h2>
            <p className="text-gray-600 text-sm">Manage wallets being tracked in this project</p>
          </div>
          <button
            onClick={onAddWallet}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Wallet</span>
          </button>
        </div>

        {wallets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Wallet className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallets Added</h3>
            <p className="text-gray-600 mb-6">Add your first wallet to start tracking analytics</p>
            <button
              onClick={onAddWallet}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Wallet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{wallet.label}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWalletTypeColor(wallet.wallet_type)}`}>
                          {wallet.wallet_type}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-sm text-gray-600 font-mono">
                          {formatAddress(wallet.address, showAddresses[wallet.id] || false)}
                        </code>
                        <button
                          onClick={() => toggleAddressVisibility(wallet.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showAddresses[wallet.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Added {formatDate(wallet.created_at)}</span>
                        </span>
                        {wallet.balance !== undefined && (
                          <span>Balance: {wallet.balance} ZEC</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletList;