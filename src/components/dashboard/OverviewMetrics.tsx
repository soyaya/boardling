import React, { useEffect, useState } from 'react';
import { Users, Wallet, Activity, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import { analyticsService, type DashboardMetrics } from '../../services/analyticsService';
import { useCurrentProject } from '../../store/useProjectStore';

const OverviewMetrics: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await analyticsService.getDashboard(currentProject.id);

      if (response.success && response.data) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to load metrics');
      }

      setLoading(false);
    };

    fetchMetrics();
  }, [currentProject?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <p className="text-red-800 text-sm">
          <strong>Error loading metrics:</strong> {error}
        </p>
      </div>
    );
  }

  // No project selected
  if (!currentProject) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <p className="text-blue-800 text-sm">
          Please select a project to view analytics metrics.
        </p>
      </div>
    );
  }

  // No data available
  if (!metrics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <p className="text-gray-600 text-sm">
          No metrics available for this project yet. Add wallets to start tracking analytics.
        </p>
      </div>
    );
  }

  // Format values for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatZec = (zatoshi: number): string => {
    const zec = zatoshi / 100000000;
    if (zec >= 1000) {
      return `${(zec / 1000).toFixed(2)}K ZEC`;
    }
    return `${zec.toFixed(2)} ZEC`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Wallets"
        value={formatNumber(metrics.totalWallets)}
        change={`${metrics.activeWallets} active`}
        trend="up"
        icon={<Wallet className="w-5 h-5" />}
      />
      <MetricCard
        title="Total Transactions"
        value={formatNumber(metrics.totalTransactions)}
        change={`Avg: ${formatZec(metrics.averageTransactionValue)}`}
        trend="up"
        icon={<Activity className="w-5 h-5" />}
      />
      <MetricCard
        title="Total Volume"
        value={formatZec(metrics.totalVolume)}
        change={`${formatPercentage(metrics.retentionRate)} retention`}
        trend="up"
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <MetricCard
        title="Health Score"
        value={metrics.healthScore.toFixed(0)}
        change={`${formatPercentage(metrics.adoptionRate)} adoption`}
        trend={metrics.healthScore >= 70 ? 'up' : 'down'}
        icon={<Users className="w-5 h-5" />}
      />
    </div>
  );
};

export default OverviewMetrics;
