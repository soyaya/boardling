import React, { useEffect, useState } from 'react';
import CohortHeatmap from '../components/retention/CohortHeatmap';
import MetricCard from '../components/dashboard/MetricCard';
import { Users, UserMinus, Repeat, TrendingDown, AlertCircle } from 'lucide-react';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type RetentionAnalytics } from '../services/analyticsService';

const Retention: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [retentionData, setRetentionData] = useState<RetentionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRetentionData = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await analyticsService.getRetention(currentProject.id);

        if (response.success && response.data) {
          setRetentionData(response.data);
        } else {
          setError(response.error || 'Failed to load retention data');
        }
      } catch (err) {
        console.error('Retention data fetch error:', err);
        setError('Failed to load retention data');
      } finally {
        setLoading(false);
      }
    };

    fetchRetentionData();
  }, [currentProject?.id]);

  // Calculate metrics from retention data
  const avgRetentionWeek4 = retentionData?.cohorts.length
    ? (retentionData.cohorts.reduce((sum, c) => sum + c.retentionWeek4, 0) / retentionData.cohorts.length).toFixed(1)
    : '0';

  const churnRate = retentionData?.cohorts.length
    ? (100 - parseFloat(avgRetentionWeek4)).toFixed(1)
    : '0';

  const totalWallets = retentionData?.cohorts.reduce((sum, c) => sum + c.walletCount, 0) || 0;

  const activeWallets = retentionData?.cohorts.length
    ? Math.round(totalWallets * (parseFloat(avgRetentionWeek4) / 100))
    : 0;

  const atRiskWallets = retentionData?.cohorts.length
    ? Math.round(totalWallets * 0.15) // Estimate 15% at risk
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retention & Cohorts</h1>
          <p className="text-gray-500">Track user retention and identify churn risks</p>
        </div>
        <button 
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !retentionData}
        >
          Export Analysis
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading retention data</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!currentProject && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">No project selected</h3>
            <p className="text-sm text-yellow-600 mt-1">Please select a project to view retention analytics.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Retention (W4)"
          value={loading ? '...' : `${avgRetentionWeek4}%`}
          change="+2.4%"
          trend="up"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Churn Rate"
          value={loading ? '...' : `${churnRate}%`}
          change="-0.5%"
          trend="up"
          icon={<UserMinus className="w-5 h-5" />}
        />
        <MetricCard
          title="Active Wallets"
          value={loading ? '...' : activeWallets.toString()}
          change="+15%"
          trend="up"
          icon={<Repeat className="w-5 h-5" />}
        />
        <MetricCard
          title="At Risk"
          value={loading ? '...' : atRiskWallets.toString()}
          change="+5%"
          trend="down"
          icon={<TrendingDown className="w-5 h-5" />}
        />
      </div>

      <CohortHeatmap 
        cohorts={retentionData?.cohorts || []} 
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Active vs Churn Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Wallets</span>
              <span className="text-lg font-bold text-green-600">820 (68%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-8 bg-green-500 rounded-l-full flex items-center justify-end pr-2">
                <span className="text-xs text-white font-medium">Active</span>
              </div>
              <div className="flex-1 h-8 bg-red-500 rounded-r-full flex items-center pl-2">
                <span className="text-xs text-white font-medium">Churned</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Churned Wallets</span>
              <span className="text-lg font-bold text-red-600">385 (32%)</span>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">At-Risk Wallets</h4>
              {[
                { label: 'Low Recurring Txs', count: 85, color: 'red' },
                { label: 'Declining Activity', count: 62, color: 'yellow' },
                { label: 'Long Inactivity', count: 43, color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500 mr-2`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recurring Transaction Frequency</h3>
          <div className="space-y-3">
            {[
              { wallet: 'zs1abc...def', txs: 45, type: 'Swap', lastActive: '2h ago', status: 'high' },
              { wallet: 'zs1ghi...jkl', txs: 38, type: 'Bridge', lastActive: '5h ago', status: 'high' },
              { wallet: 'zs1mno...pqr', txs: 24, type: 'Transfer', lastActive: '1d ago', status: 'medium' },
              { wallet: 'zs1stu...vwx', txs: 12, type: 'Swap', lastActive: '3d ago', status: 'low' },
              { wallet: 'zs1yza...bcd', txs: 8, type: 'Transfer', lastActive: '5d ago', status: 'at-risk' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${item.status === 'high' ? 'bg-green-50 border-green-100' :
                  item.status === 'at-risk' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full mr-3 ${item.status === 'high' ? 'bg-green-200' :
                      item.status === 'at-risk' ? 'bg-red-200' : 'bg-gray-200'
                    }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.wallet}</p>
                    <p className="text-xs text-gray-500">{item.type} • {item.lastActive}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{item.txs} Tx</p>
                  <p className={`text-xs font-medium ${item.status === 'high' ? 'text-green-700' :
                      item.status === 'at-risk' ? 'text-red-700' : 'text-gray-600'
                    }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Retention;
