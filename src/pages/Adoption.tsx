import React, { useEffect, useState } from 'react';
import FunnelChart from '../components/adoption/FunnelChart';
import MetricCard from '../components/dashboard/MetricCard';
import { UserPlus, MousePointer, Repeat, Star, AlertCircle } from 'lucide-react';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type AdoptionFunnelData } from '../services/analyticsService';

// Stage name mapping for display
const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'created': 'Wallet Created',
  'first_tx': 'First Transaction',
  'feature_usage': 'Feature Usage',
  'recurring': 'Recurring Tx',
  'high_value': 'High-Value',
};

// Helper to format time duration
const formatTimeDuration = (hours: number | undefined): string => {
  if (!hours) return '-';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
};

const Adoption: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [adoptionData, setAdoptionData] = useState<AdoptionFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdoptionData = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await analyticsService.getAdoption(currentProject.id);

        if (response.success && response.data) {
          setAdoptionData(response.data);
        } else {
          setError(response.error || 'Failed to load adoption analytics');
        }
      } catch (err) {
        console.error('Error fetching adoption data:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdoptionData();
  }, [currentProject?.id]);

  // Calculate metrics from adoption data
  const calculateMetrics = () => {
    if (!adoptionData || adoptionData.stages.length === 0) {
      return {
        newWallets: 0,
        activationRate: 0,
        retentionRate: 0,
        highValueRate: 0,
      };
    }

    const createdStage = adoptionData.stages.find(s => s.stage === 'created');
    const firstTxStage = adoptionData.stages.find(s => s.stage === 'first_tx');
    const recurringStage = adoptionData.stages.find(s => s.stage === 'recurring');
    const highValueStage = adoptionData.stages.find(s => s.stage === 'high_value');

    const totalWallets = createdStage?.walletCount || adoptionData.totalWallets || 0;

    return {
      newWallets: totalWallets,
      activationRate: firstTxStage?.conversionRate || 0,
      retentionRate: recurringStage?.conversionRate || 0,
      highValueRate: highValueStage ? (highValueStage.walletCount / totalWallets) * 100 : 0,
    };
  };

  // Identify significant drop-offs
  const identifyDropOffs = () => {
    if (!adoptionData || adoptionData.stages.length < 2) return [];

    const dropOffs: Array<{ stage: string; dropOffRate: number; message: string }> = [];

    for (let i = 1; i < adoptionData.stages.length; i++) {
      const currentStage = adoptionData.stages[i];

      const dropOffRate = 100 - (currentStage.conversionRate || 0);

      // Flag significant drop-offs (>30%)
      if (dropOffRate > 30) {
        dropOffs.push({
          stage: STAGE_DISPLAY_NAMES[currentStage.stage] || currentStage.stage,
          dropOffRate,
          message: `${Math.round(dropOffRate)}% drop-off at ${STAGE_DISPLAY_NAMES[currentStage.stage]}`,
        });
      }
    }

    return dropOffs;
  };

  const metrics = calculateMetrics();
  const dropOffs = identifyDropOffs();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adoption Funnel</h1>
            <p className="text-gray-500">Track conversion from first exposure to high-value engagement</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading adoption analytics...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Adoption Funnel</h1>
            <p className="text-gray-500">Track conversion from first exposure to high-value engagement</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Adoption Funnel</h1>
            <p className="text-gray-500">Track conversion from first exposure to high-value engagement</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">No Project Selected</h3>
              <p className="text-sm text-yellow-600 mt-1">Please select a project to view adoption analytics.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Adoption Funnel</h1>
          <p className="text-gray-500">Track conversion from first exposure to high-value engagement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="New Wallets"
          value={metrics.newWallets.toLocaleString()}
          change=""
          trend="up"
          icon={<UserPlus className="w-5 h-5" />}
        />
        <MetricCard
          title="Activation Rate"
          value={`${Math.round(metrics.activationRate)}%`}
          change=""
          trend={metrics.activationRate >= 60 ? 'up' : 'down'}
          icon={<MousePointer className="w-5 h-5" />}
        />
        <MetricCard
          title="Retention Rate"
          value={`${Math.round(metrics.retentionRate)}%`}
          change=""
          trend={metrics.retentionRate >= 50 ? 'up' : 'down'}
          icon={<Repeat className="w-5 h-5" />}
        />
        <MetricCard
          title="High Value %"
          value={`${Math.round(metrics.highValueRate)}%`}
          change=""
          trend={metrics.highValueRate >= 10 ? 'up' : 'down'}
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart data={adoptionData} />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Drop-off Insights</h3>
          <div className="space-y-4">
            {dropOffs.length > 0 ? (
              dropOffs.map((dropOff, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="text-sm font-bold text-red-800 mb-1">{dropOff.message}</h4>
                  <p className="text-xs text-red-600">
                    Users are dropping off at this stage. Consider improving the user experience or adding guidance.
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h4 className="text-sm font-bold text-green-800 mb-1">Healthy Conversion</h4>
                <p className="text-xs text-green-600">
                  No significant drop-offs detected. Your funnel is performing well!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Conversion Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Wallets</th>
                <th className="px-6 py-4">Conversion</th>
                <th className="px-6 py-4">Drop-off</th>
                <th className="px-6 py-4">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adoptionData && adoptionData.stages.length > 0 ? (
                adoptionData.stages.map((stage, i) => {
                  const conversionRate = stage.conversionRate || 0;
                  const dropOffRate = i > 0 ? 100 - conversionRate : 0;

                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {STAGE_DISPLAY_NAMES[stage.stage] || stage.stage}
                      </td>
                      <td className="px-6 py-4">{stage.walletCount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">
                        {i === 0 ? '-' : `${Math.round(conversionRate)}%`}
                      </td>
                      <td className="px-6 py-4 text-red-500">
                        {i === 0 ? '-' : `${Math.round(dropOffRate)}%`}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatTimeDuration(stage.averageTimeToAchieve)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No adoption data available yet. Add wallets to your project to start tracking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Adoption;
