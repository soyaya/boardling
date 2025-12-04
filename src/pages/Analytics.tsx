import React, { useEffect, useState } from 'react';
import BehaviorFlow from '../components/analytics/BehaviorFlow';
import TransactionTable from '../components/analytics/TransactionTable';
import MetricCard from '../components/dashboard/MetricCard';
import { Activity, ArrowRightLeft, Shield, Zap, AlertCircle } from 'lucide-react';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type AnalyticsData } from '../services/analyticsService';

const Analytics: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<'all' | 'shielded' | 'high_value'>('all');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await analyticsService.getAnalytics(currentProject.id);

        if (response.success && response.data) {
          setAnalyticsData(response.data);
        } else {
          setError(response.error || 'Failed to load analytics data');
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [currentProject?.id]);

  const handleDownloadReport = async () => {
    if (!currentProject?.id) return;

    try {
      const response = await analyticsService.exportReport(currentProject.id, 'json');
      
      if (response.success && response.data) {
        // Create a download link
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${currentProject.id}-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Calculate metrics from analytics data
  const metrics = React.useMemo(() => {
    if (!analyticsData) {
      return {
        txFrequency: '0/day',
        shieldedRatio: '0%',
        avgTxValue: '0 ZEC',
        bridgeVolume: '0 ZEC',
      };
    }

    const totalTx = analyticsData.totalTransactions;
    const shieldedTx = analyticsData.transactions.filter(tx => tx.type === 'shielded').length;
    const bridgeTx = analyticsData.transactions.filter(tx => tx.type === 'bridge');
    
    const totalAmount = analyticsData.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const bridgeVolume = bridgeTx.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate daily frequency (assuming data is for last 30 days)
    const daysDiff = Math.max(1, 30);
    const txPerDay = (totalTx / daysDiff).toFixed(1);
    
    const shieldedPercentage = totalTx > 0 ? ((shieldedTx / totalTx) * 100).toFixed(1) : '0';
    const avgValue = totalTx > 0 ? (totalAmount / totalTx / 100000000).toFixed(2) : '0';
    const bridgeVol = (bridgeVolume / 100000000).toFixed(2);

    return {
      txFrequency: `${txPerDay}/day`,
      shieldedRatio: `${shieldedPercentage}%`,
      avgTxValue: `${avgValue} ZEC`,
      bridgeVolume: `${bridgeVol} ZEC`,
    };
  }, [analyticsData]);

  // Get top behavior patterns
  const topPatterns = React.useMemo(() => {
    if (!analyticsData?.behaviorPatterns) return [];
    return analyticsData.behaviorPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
  }, [analyticsData]);

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Please select a project to view analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500">Deep dive into wallet behavior and transaction flows</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Deep dive into wallet behavior and transaction flows</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value as any)}
            className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="all">All Wallets</option>
            <option value="shielded">Shielded Only</option>
            <option value="high_value">High Value</option>
          </select>
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Tx Frequency"
          value={metrics.txFrequency}
          change="+5%"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Shielded Ratio"
          value={metrics.shieldedRatio}
          change="+2.1%"
          trend="up"
          icon={<Shield className="w-5 h-5" />}
        />
        <MetricCard
          title="Avg Tx Value"
          value={metrics.avgTxValue}
          change="-1.2%"
          trend="down"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="Bridge Volume"
          value={metrics.bridgeVolume}
          change="+8%"
          trend="up"
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BehaviorFlow />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Behavior Patterns</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : topPatterns.length > 0 ? (
            <div className="space-y-3">
              {topPatterns.map((pattern, index) => {
                const colors = [
                  { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-800', bar: 'bg-green-500' },
                  { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-800', bar: 'bg-blue-500' },
                  { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-800', bar: 'bg-purple-500' },
                ];
                const color = colors[index] || colors[0];
                const maxFrequency = Math.max(...topPatterns.map(p => p.frequency));
                const percentage = (pattern.frequency / maxFrequency) * 100;

                return (
                  <div key={pattern.pattern} className={`p-3 ${color.bg} rounded-lg border ${color.border}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-medium ${color.text}`}>{pattern.pattern}</span>
                      <span className={`text-xs font-bold ${color.text}`}>{pattern.frequency}x</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${color.bar} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className={`text-xs ${color.text} mt-1`}>
                      Last: {new Date(pattern.lastOccurrence).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No behavior patterns detected yet</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Alerts & Insights</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsData && analyticsData.transactions.length > 0 ? (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-bold text-blue-800">Transaction Activity</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {analyticsData.totalTransactions} transactions recorded in the current period.
                      </p>
                    </div>
                  </div>
                </div>

                {topPatterns.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-green-800">Top Pattern Detected</p>
                        <p className="text-xs text-green-700 mt-1">
                          {topPatterns[0].pattern} appears {topPatterns[0].frequency} times.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-600 text-center">
                  No alerts or insights available yet. Start tracking wallets to see analytics.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <TransactionTable
        transactions={analyticsData?.transactions || []}
        loading={loading}
      />
    </div>
  );
};

export default Analytics;
