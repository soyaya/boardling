import React from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar, Repeat, Target, Users, AlertTriangle } from 'lucide-react';

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
        <span className="text-2xl font-bold">{numValue}</span>
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

const ProductivityPanel: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Productivity Breakdown</h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          High Performance
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <MetricItem
          label="Tx Score"
          value={85}
          icon={<Activity className="w-4 h-4" />}
        />
        <MetricItem
          label="Days Active"
          value={78}
          icon={<Calendar className="w-4 h-4" />}
        />
        <MetricItem
          label="Recurring Patterns"
          value={12}
          threshold={5}
          icon={<Repeat className="w-4 h-4" />}
        />
        <MetricItem
          label="Retention %"
          value={88}
          isPercentage
          icon={<Target className="w-4 h-4" />}
        />
        <MetricItem
          label="Adoption %"
          value={75}
          isPercentage
          icon={<Users className="w-4 h-4" />}
        />
        <MetricItem
          label="Churn %"
          value={12}
          isPercentage
          reverseColors
          icon={<AlertTriangle className="w-4 h-4" />}
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
              stroke="#10b981"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="352"
              strokeDashoffset="35" // 90% filled
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-3xl font-bold text-gray-900">90</span>
            <span className="block text-xs text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Productivity increased by +12%</p>
            <p className="text-xs text-blue-700 mt-1">
              Your wallet retention strategies are working effectively this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityPanel;
