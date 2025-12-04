import React, { useEffect, useState } from 'react';
import { Activity, Users, DollarSign, Shield, AlertTriangle, Target, Zap, BarChart, Loader2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { analyticsService } from '../services/analyticsService';
import type { ProjectHealthAnalytics } from '../services/analyticsService';

interface HealthMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: string;
  icon: React.ReactNode;
}

const ProjectHealth: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [healthData, setHealthData] = useState<ProjectHealthAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!currentProject?.id) {
        setError('No project selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await analyticsService.getHealth(currentProject.id);

        if (response.success && response.data) {
          setHealthData(response.data);
        } else {
          setError(response.error || 'Failed to fetch health data');
        }
      } catch (err) {
        console.error('Error fetching health data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [currentProject?.id]);

  // Map health indicators to display metrics
  const healthMetrics: HealthMetric[] = healthData?.indicators.map(indicator => {
    // Determine icon based on indicator name
    let icon: React.ReactNode;
    const name = indicator.name.toLowerCase();
    
    if (name.includes('adoption') || name.includes('wallet')) {
      icon = <Users className="w-5 h-5" />;
    } else if (name.includes('activation') || name.includes('active')) {
      icon = <Zap className="w-5 h-5" />;
    } else if (name.includes('retention')) {
      icon = <Target className="w-5 h-5" />;
    } else if (name.includes('revenue') || name.includes('transaction')) {
      icon = <DollarSign className="w-5 h-5" />;
    } else if (name.includes('shield') || name.includes('privacy')) {
      icon = <Shield className="w-5 h-5" />;
    } else if (name.includes('churn') || name.includes('risk')) {
      icon = <AlertTriangle className="w-5 h-5" />;
    } else if (name.includes('productivity')) {
      icon = <Activity className="w-5 h-5" />;
    } else {
      icon = <BarChart className="w-5 h-5" />;
    }

    // Map status to our display status
    let displayStatus: 'excellent' | 'good' | 'warning' | 'critical';
    if (indicator.status === 'good') {
      displayStatus = indicator.value >= 80 ? 'excellent' : 'good';
    } else if (indicator.status === 'warning') {
      displayStatus = 'warning';
    } else {
      displayStatus = 'critical';
    }

    // Format trend
    const trendSymbol = indicator.trend === 'up' ? '+' : indicator.trend === 'down' ? '-' : '';
    const trendValue = Math.abs(Math.round((indicator.value - 50) / 5)); // Simplified trend calculation
    const trend = indicator.trend === 'stable' ? '0%' : `${trendSymbol}${trendValue}%`;

    return {
      name: indicator.name,
      score: Math.round(indicator.value),
      status: displayStatus,
      trend,
      icon,
    };
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const overallScore = healthData?.overallHealth || 0;
  const healthStatus = overallScore >= 80 ? 'Excellent Health' : 
                       overallScore >= 60 ? 'Good Health' : 
                       overallScore >= 40 ? 'Fair Health' : 
                       overallScore >= 20 ? 'Poor Health' : 'Critical';

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading health analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Health Data</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!healthData || healthMetrics.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <BarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data Available</h3>
        <p className="text-gray-600">
          Health metrics will appear here once your project has wallet activity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Health</h1>
          <p className="text-gray-500">Comprehensive health assessment across 9 key metrics</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Download Health Report
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">Overall Health Score</h2>
            <p className="text-sm text-gray-500">Combined assessment of all metrics</p>
          </div>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#000000"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{overallScore}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-green-600">{healthStatus}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthMetrics.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getStatusColor(metric.status)} bg-opacity-10`}>
                <div className={getStatusTextColor(metric.status)}>
                  {metric.icon}
                </div>
              </div>
              <span className={`text-sm font-medium ${metric.trend.startsWith('+') && !metric.name.includes('Risk') && !metric.name.includes('Migration') ? 'text-green-600' : metric.trend.startsWith('-') && !metric.name.includes('Risk') && !metric.name.includes('Migration') ? 'text-red-600' : 'text-gray-600'}`}>
                {metric.trend}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.name}</h3>
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-3xl font-bold text-gray-900">{metric.score}</span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getStatusColor(metric.status)}`}
                style={{ width: `${metric.score}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 capitalize">{metric.status}</p>
          </div>
        ))}
      </div>

      {healthData.alerts && healthData.alerts.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Health Insights & Recommendations</h3>
          <div className="space-y-3">
            {healthData.alerts.map((alert, index) => {
              const bgColor = alert.severity === 'critical' ? 'bg-red-50 border-red-100' :
                             alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                             'bg-green-50 border-green-100';
              
              const iconBg = alert.severity === 'critical' ? 'bg-red-500' :
                            alert.severity === 'warning' ? 'bg-yellow-500' :
                            'bg-green-500';
              
              const textColor = alert.severity === 'critical' ? 'text-red-800' :
                               alert.severity === 'warning' ? 'text-yellow-800' :
                               'text-green-800';
              
              const textColorLight = alert.severity === 'critical' ? 'text-red-700' :
                                    alert.severity === 'warning' ? 'text-yellow-700' :
                                    'text-green-700';
              
              const icon = alert.severity === 'critical' ? '✕' :
                          alert.severity === 'warning' ? '!' :
                          '✓';

              return (
                <div key={index} className={`p-4 rounded-lg border ${bgColor}`}>
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full ${iconBg} flex items-center justify-center mt-0.5`}>
                      <span className="text-white text-xs font-bold">{icon}</span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`text-sm font-bold ${textColor}`}>{alert.message}</p>
                      <p className={`text-xs ${textColorLight} mt-1`}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!healthData.alerts || healthData.alerts.length === 0) && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Health Insights & Recommendations</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">No alerts or recommendations at this time.</p>
            <p className="text-sm text-gray-400 mt-2">Your project health is being monitored continuously.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHealth;
