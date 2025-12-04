import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Shield, Zap, Repeat, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { TransactionData } from '../../services/analyticsService';
import { formatDateTime, formatZecAmount } from '../../services/analyticsService';

interface TransactionTableProps {
  transactions: TransactionData[];
  loading?: boolean;
}

type SortField = 'timestamp' | 'amount' | 'fee' | 'type';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'transfer' | 'swap' | 'bridge' | 'shielded' | 'other';

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, loading = false }) => {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showAll, setShowAll] = useState(false);

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter(tx => tx.type === filterType);
  }, [transactions, filterType]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'fee':
          comparison = a.fee - b.fee;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return showAll ? sorted : sorted.slice(0, 10);
  }, [filteredTransactions, sortField, sortDirection, showAll]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <ArrowUpRight className="w-4 h-4 mr-2 text-blue-500" />;
      case 'shielded':
        return <Shield className="w-4 h-4 mr-2 text-gray-900" />;
      case 'bridge':
        return <ArrowDownRight className="w-4 h-4 mr-2 text-purple-500" />;
      case 'transfer':
        return <Zap className="w-4 h-4 mr-2 text-yellow-500" />;
      default:
        return <Repeat className="w-4 h-4 mr-2 text-green-500" />;
    }
  };

  const getFeatureLabel = (type: string) => {
    switch (type) {
      case 'swap':
        return 'DEX';
      case 'shielded':
        return 'Privacy';
      case 'bridge':
        return 'Bridge';
      case 'transfer':
        return 'Wallet';
      default:
        return 'Other';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const txTime = new Date(timestamp);
    const diffMs = now.getTime() - txTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 ml-1 text-gray-900" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 text-gray-900" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-sm text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="p-12 text-center">
          <p className="text-sm text-gray-500">No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'transfer', 'swap', 'bridge', 'shielded', 'other'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('fee')}
              >
                <div className="flex items-center">
                  Fee
                  <SortIcon field="fee" />
                </div>
              </th>
              <th className="px-6 py-4">Feature</th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center">
                  Time
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">TX ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center font-medium text-gray-900">
                    {getTypeIcon(tx.type)}
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatZecAmount(tx.amount)} ZEC
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {formatZecAmount(tx.fee)} ZEC
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                    {getFeatureLabel(tx.type)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400" title={formatDateTime(tx.timestamp)}>
                  {getRelativeTime(tx.timestamp)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-gray-400">
                    {tx.txid.substring(0, 8)}...{tx.txid.substring(tx.txid.length - 6)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length > 10 && !showAll && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Show {filteredTransactions.length - 10} more transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
