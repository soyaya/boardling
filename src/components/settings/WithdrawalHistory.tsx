import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { userService } from '../../services/userService';

interface Withdrawal {
  id: string;
  amount_zec: number;
  fee_zec: number;
  net_zec: number;
  to_address: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  txid: string | null;
  requested_at: string;
  processed_at: string | null;
}

export const WithdrawalHistory: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.getWithdrawalHistory({
        limit: 50,
        offset: 0,
        status: filter === 'all' ? undefined : filter
      });
      setWithdrawals(data);
    } catch (err) {
      setError('Failed to load withdrawal history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Withdrawal History</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <ArrowUpRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No withdrawals found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter !== 'all' ? 'Try changing the filter' : 'Your withdrawal history will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(withdrawal.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {withdrawal.net_zec.toFixed(4)} ZEC
                      </p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      To: {truncateAddress(withdrawal.to_address)}
                    </p>
                    {withdrawal.fee_zec > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Fee: {withdrawal.fee_zec.toFixed(4)} ZEC
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDate(withdrawal.requested_at)}
                  </p>
                  {withdrawal.processed_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Processed: {formatDate(withdrawal.processed_at)}
                    </p>
                  )}
                </div>
              </div>

              {withdrawal.txid && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={`https://explorer.zcha.in/transactions/${withdrawal.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Transaction
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {withdrawals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Withdrawals:</span>
            <span className="font-medium text-gray-900">{withdrawals.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium text-gray-900">
              {withdrawals.reduce((sum, w) => sum + w.net_zec, 0).toFixed(4)} ZEC
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
