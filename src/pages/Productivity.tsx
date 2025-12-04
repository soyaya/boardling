import React, { useEffect, useState } from 'react';
import ProductivityPanel from '../components/dashboard/ProductivityPanel';
import MetricCard from '../components/dashboard/MetricCard';
import { Activity, TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';
import { Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useCurrentProject } from '../store/useProjectStore';
import { analyticsService, type ProductivityAnalytics } from '../services/analyticsService';

const Productivity: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [productivityData, setProductivityData] = useState<ProductivityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductivityData = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await analyticsService.getProductivity(currentProject.id);

        if (response.success && response.data) {
          setProductivityData(response.data);
        } else {
          setError(response.error || 'Failed to load productivity data');
        }
      } catch (err) {
        console.error('Error fetching productivity data:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProductivityData();
  }, [currentProject?.id]);

  // Calculate metrics from productivity data
  const averageScore = productivityData?.averageScore || 0;
  const distribution = productivityData?.distribution || { healthy: 0, atRisk: 0, churn: 0 };
  const scores = productivityData?.scores || [];

  // Calculate average scores for radar chart
  const radarData = scores.length > 0 ? [
    { metric: 'Retention', value: Math.round(scores.reduce((sum, s) => sum + s.retentionScore, 0) / scores.length) },
    { metric: 'Adoption', value: Math.round(scores.reduce((sum, s) => sum + s.adoptionScore, 0) / scores.length) },
    { metric: 'Activity', value: Math.round(scores.reduce((sum, s) => sum + s.activityScore, 0) / scores.length) },
    { metric: 'Diversity', value: Math.round(scores.reduce((sum, s) => sum + s.diversityScore, 0) / scores.length) },
  ] : [
    { metric: 'Retention', value: 0 },
    { metric: 'Adoption', value: 0 },
    { metric: 'Activity', value: 0 },
    { metric: 'Diversity', value: 0 },
  ];

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'churn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get risk level color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a project to view productivity analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading productivity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading productivity data</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productivity Score</h1>
          <p className="text-gray-500">Comprehensive wallet efficiency and engagement metrics</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Average Score"
          value={`${Math.round(averageScore)}/100`}
          change={averageScore >= 70 ? '+Good' : 'Needs Work'}
          trend={averageScore >= 70 ? 'up' : 'down'}
          icon={<Target className="w-5 h-5" />}
        />
        <MetricCard
          title="Healthy Wallets"
          value={distribution.healthy.toString()}
          change={`${Math.round((distribution.healthy / (distribution.healthy + distribution.atRisk + distribution.churn || 1)) * 100)}%`}
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="At Risk"
          value={distribution.atRisk.toString()}
          change="Monitor"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="Churn Risk"
          value={distribution.churn.toString()}
          change="Action Needed"
          trend={distribution.churn > 0 ? 'down' : 'up'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityPanel 
            score={scores[0] || null}
            averageScore={averageScore}
          />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#000000" fill="#000000" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {scores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Wallet Productivity Scores</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Total Score</th>
                  <th className="px-6 py-4">Retention</th>
                  <th className="px-6 py-4">Adoption</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Diversity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map((score, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-black text-white">
                        {Math.round(score.totalScore)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{Math.round(score.retentionScore)}</td>
                    <td className="px-6 py-4 font-medium">{Math.round(score.adoptionScore)}</td>
                    <td className="px-6 py-4 font-medium">{Math.round(score.activityScore)}</td>
                    <td className="px-6 py-4 font-medium">{Math.round(score.diversityScore)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(score.status)}`}>
                        {score.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${getRiskColor(score.riskLevel)}`}>
                      {score.riskLevel}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{score.pendingTasks.length}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-green-600">{score.completedTasks.length}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scores.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Productivity Data Available</h3>
            <p className="text-gray-600">
              Productivity scores will appear here once wallet activity is tracked.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productivity;
