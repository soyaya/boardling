import React from 'react';
import { TrendingUp, TrendingDown, Activity, Target, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { ProductivityScore } from '../../services/analyticsService';

interface MetricItemProps {
  label: string;
  value: number | string;
  threshold?: number;
  isPercentage?: boolean;
  reverseColors?: boolean; // For metrics where lower is better (churn, risk)
  icon: React.ReactNode;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, threshold = 50, isPercentage = false, reverseColors = false, icon }) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isGood = reverseColors ? numValue < threshold : numValue >= threshold;
  const colorClass = isGood ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  const borderClass = isGood ? 'border-green-200' : 'border-red-200';

  return (
    <div className={`p-4 rounded-lg border ${borderClass} ${colorClass} bg-opacity-50`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <div className="opacity-60">{icon}</div>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold">{Math.round(numValue)}</span>
        {isPercentage && <span className="text-lg ml-1">%</span>}
      </div>
      <div className="flex items-center mt-1">
        {isGood ? (
          <TrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-1" />
        )}
        <span className="text-xs font-medium">{isGood ? 'Good' : 'Needs Attention'}</span>
      </div>
    </div>
  );
};

interface ProductivityPanelProps {
  score: ProductivityScore | null;
  averageScore: number;
}

const ProductivityPanel: React.FC<ProductivityPanelProps> = ({ score, averageScore }) => {
  // Use provided score or fallback to average
  const displayScore = score || {
    totalScore: averageScore,
    retentionScore: 0,
    adoptionScore: 0,
    activityScore: 0,
    diversityScore: 0,
    status: 'healthy' as const,
    riskLevel: 'low' as const,
    pendingTasks: [],
    completedTasks: [],
  };

  const totalScore = Math.round(displayScore.totalScore);
  const circumference = 2 * Math.PI * 56; // radius = 56
  const strokeDashoffset = circumference - (circumference * totalScore) / 100;

  // Get status badge
  const getStatusBadge = () => {
    switch (displayScore.status) {
      case 'healthy':
        return { text: 'High Performance', color: 'bg-green-100 text-green-700' };
      case 'at_risk':
        return { text: 'At Risk', color: 'bg-yellow-100 text-yellow-700' };
      case 'churn':
        return { text: 'Churn Risk', color: 'bg-red-100 text-red-700' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusBadge = getStatusBadge();

  // Get circle color based on score
  const getCircleColor = () => {
    if (totalScore >= 80) return '#10b981'; // green
    if (totalScore >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Get insight message
  const getInsightMessage = () => {
    if (displayScore.status === 'healthy') {
      return {
        icon: <TrendingUp className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />,
        title: 'Strong productivity performance',
        message: 'Wallet engagement and retention metrics are performing well.',
        color: 'bg-blue-50 border-blue-100 text-blue-900',
        textColor: 'text-blue-700',
      };
    } else if (displayScore.status === 'at_risk') {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />,
        title: 'Attention needed',
        message: 'Some metrics are below target. Review pending tasks to improve performance.',
        color: 'bg-yellow-50 border-yellow-100 text-yellow-900',
        textColor: 'text-yellow-700',
      };
    } else {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />,
        title: 'Immediate action required',
        message: 'Critical productivity issues detected. Address high-priority tasks immediately.',
        color: 'bg-red-50 border-red-100 text-red-900',
        textColor: 'text-red-700',
      };
    }
  };

  const insight = getInsightMessage();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Productivity Breakdown</h3>
        <span className={`px-3 py-1 ${statusBadge.color} rounded-full text-xs font-medium`}>
          {statusBadge.text}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricItem
          label="Activity Score"
          value={displayScore.activityScore}
          icon={<Activity className="w-4 h-4" />}
        />
        <MetricItem
          label="Retention Score"
          value={displayScore.retentionScore}
          icon={<Target className="w-4 h-4" />}
        />
        <MetricItem
          label="Adoption Score"
          value={displayScore.adoptionScore}
          icon={<Users className="w-4 h-4" />}
        />
        <MetricItem
          label="Diversity Score"
          value={displayScore.diversityScore}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricItem
          label="Risk Level"
          value={displayScore.riskLevel === 'low' ? 'Low' : displayScore.riskLevel === 'medium' ? 'Med' : 'High'}
          threshold={0}
          reverseColors
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <MetricItem
          label="Status"
          value={displayScore.status === 'healthy' ? 'Good' : displayScore.status === 'at_risk' ? 'Risk' : 'Churn'}
          threshold={0}
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </div>

      <div className="flex items-center justify-center mb-6 pt-4 border-t border-gray-100">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#f3f4f6"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={getCircleColor()}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-bold text-gray-900">{totalScore}</span>
            <span className="block text-xs text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`flex items-start p-3 ${insight.color} rounded-lg border`}>
          {insight.icon}
          <div>
            <p className={`text-sm font-medium ${insight.color.split(' ')[2]}`}>{insight.title}</p>
            <p className={`text-xs ${insight.textColor} mt-1`}>
              {insight.message}
            </p>
          </div>
        </div>

        {/* Tasks Summary */}
        {(displayScore.pendingTasks.length > 0 || displayScore.completedTasks.length > 0) && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {displayScore.pendingTasks.length} Pending
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  {displayScore.completedTasks.length} Completed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* High Priority Tasks */}
        {displayScore.pendingTasks.filter(t => t.priority === 'high').length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {displayScore.pendingTasks.filter(t => t.priority === 'high').length} High Priority Tasks
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Address these tasks to improve productivity score
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductivityPanel;
