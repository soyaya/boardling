import React from 'react';
import { TrendingUp, Activity, Users, DollarSign, Shield, AlertTriangle, Target, Zap, BarChart } from 'lucide-react';

interface HealthMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: string;
  icon: React.ReactNode;
}

const ProjectHealth: React.FC = () => {
  const healthMetrics: HealthMetric[] = [
    { name: 'Adoption', score: 88, status: 'excellent', trend: '+12%', icon: <Users className="w-5 h-5" /> },
    { name: 'Activation', score: 82, status: 'good', trend: '+8%', icon: <Zap className="w-5 h-5" /> },
    { name: 'Retention', score: 76, status: 'good', trend: '+5%', icon: <Target className="w-5 h-5" /> },
    { name: 'Revenue Growth', score: 91, status: 'excellent', trend: '+18%', icon: <DollarSign className="w-5 h-5" /> },
    { name: 'Shielded Privacy Health', score: 85, status: 'excellent', trend: '+10%', icon: <Shield className="w-5 h-5" /> },
    { name: 'Migration Score', score: 45, status: 'warning', trend: '-8%', icon: <AlertTriangle className="w-5 h-5" /> },
    { name: 'Churn Risk', score: 38, status: 'warning', trend: '+5%', icon: <AlertTriangle className="w-5 h-5" /> },
    { name: 'Productivity', score: 92, status: 'excellent', trend: '+15%', icon: <Activity className="w-5 h-5" /> },
    { name: 'Engagement Consistency', score: 79, status: 'good', trend: '+6%', icon: <BarChart className="w-5 h-5" /> },
  ];

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

  const overallScore = Math.round(healthMetrics.reduce((acc, m) => acc + m.score, 0) / healthMetrics.length);

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
            <p className="mt-2 text-sm font-medium text-green-600">Healthy Project</p>
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

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Health Insights & Recommendations</h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-green-800">Strong Revenue Growth</p>
                <p className="text-xs text-green-700 mt-1">
                  Revenue increased 18% - continue current monetization strategy
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-yellow-800">Migration Score Needs Attention</p>
                <p className="text-xs text-yellow-700 mt-1">
                  8% increase in wallets leaving. Consider re-engagement campaigns or feature improvements.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-yellow-800">Churn Risk Increasing</p>
                <p className="text-xs text-yellow-700 mt-1">
                  5% rise in churn risk. Target at-risk wallets with personalized notifications and incentives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHealth;
