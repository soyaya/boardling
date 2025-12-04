import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SegmentCardProps {
  segment: {
    status: string;
    risk_level: string;
    wallet_count: number;
    avg_score: number;
    avg_retention: number;
    avg_adoption: number;
    avg_activity: number;
  };
  totalWallets: number;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment, totalWallets }) => {
  const percentage = totalWallets > 0 ? (segment.wallet_count / totalWallets) * 100 : 0;

  // Determine color based on status and risk level
  const getSegmentColor = () => {
    if (segment.status === 'healthy') return 'bg-green-500';
    if (segment.status === 'at_risk') return 'bg-yellow-500';
    if (segment.status === 'churn') return 'bg-red-500';
    return 'bg-gray-500';
  };

  // Get display name for segment
  const getSegmentName = () => {
    const statusName = segment.status.charAt(0).toUpperCase() + segment.status.slice(1).replace('_', ' ');
    const riskName = segment.risk_level.charAt(0).toUpperCase() + segment.risk_level.slice(1);
    return `${statusName} - ${riskName} Risk`;
  };

  // Get trend indicator based on score
  const getTrendIcon = () => {
    if (segment.avg_score >= 75) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (segment.avg_score >= 50) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-3 h-3 rounded-full ${getSegmentColor()}`}></div>
        {getTrendIcon()}
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-1">{getSegmentName()}</h3>
      
      <div className="flex items-baseline space-x-2 mb-3">
        <span className="text-3xl font-bold text-gray-900">{segment.wallet_count.toLocaleString()}</span>
        <span className="text-sm text-gray-500">wallets</span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${getSegmentColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      
      <p className="text-xs text-gray-500 mb-4">{percentage.toFixed(1)}% of total</p>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Avg Score:</span>
          <span className="font-medium text-gray-900">{segment.avg_score.toFixed(1)}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Retention:</span>
          <span className="font-medium text-gray-900">{segment.avg_retention.toFixed(1)}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Activity:</span>
          <span className="font-medium text-gray-900">{segment.avg_activity.toFixed(1)}/100</span>
        </div>
      </div>
    </div>
  );
};

export default SegmentCard;
