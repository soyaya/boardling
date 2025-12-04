import React, { useEffect, useState } from 'react';
import ShieldedOverview from '../components/shielded/ShieldedOverview';
import ShieldedFlow from '../components/shielded/ShieldedFlow';
import MetricCard from '../components/dashboard/MetricCard';
import { Shield, Lock, EyeOff, Activity, AlertCircle, Download } from 'lucide-react';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type ShieldedAnalytics, formatPercentage } from '../services/analyticsService';

const ShieldedPool: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [shieldedData, setShieldedData] = useState<ShieldedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShieldedData = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await analyticsService.getShielded(currentProject.id);

        if (response.success && response.data) {
          setShieldedData(response.data);
        } else {
          setError(response.error || 'Failed to load shielded analytics');
        }
      } catch (err) {
        console.error('Error fetching shielded data:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShieldedData();
  }, [currentProject?.id]);

  // Calculate privacy score display
  const calculatePrivacyScore = () => {
    if (!shieldedData) return { score: 0, status: 'Unknown' };
    
    const score = shieldedData.metrics.privacyScore;
    let status = 'Poor';
    
    if (score >= 80) status = 'Excellent';
    else if (score >= 60) status = 'Good';
    else if (score >= 40) status = 'Fair';
    
    return { score: Math.round(score), status };
  };

  // Format volume for display
  const formatVolume = (zatoshi: number): string => {
    const zec = zatoshi / 100000000;
    if (zec >= 1000000) return `${(zec / 1000000).toFixed(2)}M ZEC`;
    if (zec >= 1000) return `${(zec / 1000).toFixed(2)}K ZEC`;
    return `${zec.toFixed(2)} ZEC`;
  };

  const privacyScore = calculatePrivacyScore();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shielded Pool Analytics</h1>
            <p className="text-gray-500">Insights into privacy-focused usage and behavior</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading shielded analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shielded Pool Analytics</h1>
            <p className="text-gray-500">Insights into privacy-focused usage and behavior</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Loading Analytics</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No project selected
  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shielded Pool Analytics</h1>
            <p className="text-gray-500">Insights into privacy-focused usage and behavior</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">No Project Selected</h3>
              <p className="text-sm text-yellow-600 mt-1">Please select a project to view shielded analytics.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shielded Pool Analytics</h1>
          <p className="text-gray-500">Insights into privacy-focused usage and behavior</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Generate Privacy Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Shielded Volume"
          value={shieldedData ? formatVolume(shieldedData.metrics.shieldedVolume) : '-'}
          change=""
          trend="up"
          icon={<Lock className="w-5 h-5" />}
        />
        <MetricCard
          title="% Transactions Shielded"
          value={shieldedData ? formatPercentage(shieldedData.metrics.shieldedPercentage, 1) : '-'}
          change=""
          trend={shieldedData && shieldedData.metrics.shieldedPercentage >= 40 ? 'up' : 'down'}
          icon={<Shield className="w-5 h-5" />}
        />
        <MetricCard
          title="Shielded Wallets"
          value={shieldedData ? shieldedData.metrics.shieldedWallets.toLocaleString() : '-'}
          change=""
          trend="up"
          icon={<EyeOff className="w-5 h-5" />}
        />
        <MetricCard
          title="Privacy Score"
          value={`${privacyScore.score}/100`}
          change={privacyScore.status}
          trend={privacyScore.score >= 60 ? 'up' : 'down'}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <ShieldedOverview data={shieldedData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShieldedFlow />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Health</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <span className="text-5xl font-bold text-gray-900">{privacyScore.score}</span>
              <span className="text-gray-400 text-xl">/100</span>
              <p className="mt-2 text-sm text-gray-500">{privacyScore.status} Privacy Health</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shielded Usage</span>
              <span className="font-medium">
                {shieldedData ? `${Math.round(shieldedData.metrics.shieldedPercentage)}%` : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full" 
                style={{ width: shieldedData ? `${shieldedData.metrics.shieldedPercentage}%` : '0%' }}
              ></div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-medium">
                {shieldedData ? shieldedData.metrics.totalShieldedTransactions.toLocaleString() : '-'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-black h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShieldedPool;
