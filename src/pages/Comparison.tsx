import React, { useEffect, useState } from 'react';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type ComparisonAnalytics } from '../services/analyticsService';
import ComparisonTable from '../components/comparison/ComparisonTable';
import MetricCard from '../components/dashboard/MetricCard';
import { TrendingUp, Activity, Users, Zap, Lock, AlertCircle } from 'lucide-react';

const Comparison: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [comparisonData, setComparisonData] = useState<ComparisonAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privacyGated, setPrivacyGated] = useState(false);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPrivacyGated(false);

      try {
        const response = await analyticsService.getComparison(currentProject.id);

        if (response.success && response.data) {
          setComparisonData(response.data);
        } else {
          // Check if error is privacy-related
          if (response.error?.includes('privacy') || response.error?.includes('permission')) {
            setPrivacyGated(true);
            setError(response.error || 'Comparison analytics require public or monetizable privacy mode');
          } else {
            setError(response.error || 'Failed to load comparison data');
          }
        }
      } catch (err) {
        console.error('Comparison fetch error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [currentProject?.id]);

  // Privacy gate UI
  if (privacyGated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">Benchmark your performance against market leaders</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Mode Restriction</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comparison analytics require your project to have public or monetizable privacy mode. 
            This allows you to benchmark against other projects while contributing to the ecosystem.
          </p>
          <div className="flex justify-center space-x-3">
            <button className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Update Privacy Settings
            </button>
            <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">Benchmark your performance against market leaders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  // Error state (non-privacy)
  if (error && !privacyGated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">Benchmark your performance against market leaders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!comparisonData || !comparisonData.metrics || comparisonData.metrics.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">Benchmark your performance against market leaders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-600">No comparison data available yet. Check back later.</p>
        </div>
      </div>
    );
  }

  // Calculate summary metrics from comparison data
  const getMetricValue = (metricName: string) => {
    const metric = comparisonData.metrics.find(m => 
      m.metric.toLowerCase().includes(metricName.toLowerCase())
    );
    return metric || null;
  };

  const retentionMetric = getMetricValue('retention');
  const growthMetric = getMetricValue('growth');
  const activeUsersMetric = getMetricValue('active') || getMetricValue('users');
  const healthMetric = getMetricValue('health');

  // Calculate advantages and improvements
  const advantages = comparisonData.metrics.filter(m => m.yourValue > m.industryAverage);
  const improvements = comparisonData.metrics.filter(m => m.yourValue <= m.industryAverage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">
            Benchmark your performance against {comparisonData.sampleSize} projects in {comparisonData.category}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Filter Category
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {retentionMetric && (
          <MetricCard
            title="Retention Rate"
            value={`${retentionMetric.yourValue.toFixed(1)}%`}
            change={`${retentionMetric.percentile}th percentile`}
            trend={retentionMetric.yourValue > retentionMetric.industryAverage ? 'up' : 'down'}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        )}
        {growthMetric && (
          <MetricCard
            title="Growth Score"
            value={`${growthMetric.yourValue.toFixed(0)}/100`}
            change={`Avg: ${growthMetric.industryAverage.toFixed(0)}`}
            trend={growthMetric.yourValue > growthMetric.industryAverage ? 'up' : 'down'}
            icon={<Zap className="w-5 h-5" />}
          />
        )}
        {activeUsersMetric && (
          <MetricCard
            title="Active Users"
            value={activeUsersMetric.yourValue.toLocaleString()}
            change={`Avg: ${activeUsersMetric.industryAverage.toLocaleString()}`}
            trend={activeUsersMetric.yourValue > activeUsersMetric.industryAverage ? 'up' : 'down'}
            icon={<Users className="w-5 h-5" />}
          />
        )}
        {healthMetric && (
          <MetricCard
            title="Health Score"
            value={`${healthMetric.yourValue.toFixed(0)}/100`}
            change={`${healthMetric.percentile}th percentile`}
            trend={healthMetric.yourValue > healthMetric.industryAverage ? 'up' : 'down'}
            icon={<Activity className="w-5 h-5" />}
          />
        )}
      </div>

      <ComparisonTable metrics={comparisonData.metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Competitive Advantages</h3>
          {advantages.length > 0 ? (
            <ul className="space-y-3">
              {advantages.slice(0, 5).map((metric, index) => {
                const improvement = ((metric.yourValue - metric.industryAverage) / metric.industryAverage * 100).toFixed(1);
                return (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                      <p className="text-xs text-gray-500">
                        Your {metric.metric.toLowerCase()} ({metric.yourValue.toFixed(1)}) is {improvement}% higher than industry average ({metric.industryAverage.toFixed(1)})
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No competitive advantages identified yet. Keep building!</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Areas for Improvement</h3>
          {improvements.length > 0 ? (
            <ul className="space-y-3">
              {improvements.slice(0, 5).map((metric, index) => {
                const gap = ((metric.industryAverage - metric.yourValue) / metric.industryAverage * 100).toFixed(1);
                return (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                      <span className="text-yellow-600 text-xs font-bold">!</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                      <p className="text-xs text-gray-500">
                        Your {metric.metric.toLowerCase()} ({metric.yourValue.toFixed(1)}) is {gap}% below industry average ({metric.industryAverage.toFixed(1)})
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">You're performing above average in all metrics!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comparison;
