import React from 'react';
import { AlertTriangle, TrendingDown, Zap, Shield, ArrowRight } from 'lucide-react';

interface AlertCardProps {
  type: 'retention' | 'revenue' | 'shielded' | 'feature';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: string;
}

const AlertCard: React.FC<AlertCardProps> = ({ type, severity, title, description, time }) => {
  const getIcon = () => {
    switch (type) {
      case 'retention': return <TrendingDown className="w-5 h-5" />;
      case 'revenue': return <Zap className="w-5 h-5" />;
      case 'shielded': return <Shield className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-100 text-red-700 icon-red-600';
      case 'medium': return 'bg-yellow-50 border-yellow-100 text-yellow-700 icon-yellow-600';
      case 'low': return 'bg-blue-50 border-blue-100 text-blue-700 icon-blue-600';
    }
  };

  const colors = getColors();

  return (
    <div className={`p-4 rounded-xl border ${colors.split(' ')[1]} ${colors.split(' ')[0]} flex items-start transition-all hover:shadow-sm`}>
      <div className={`p-2 rounded-full bg-white bg-opacity-60 mr-4 ${colors.split(' ')[2]}`}>
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`text-sm font-bold ${colors.split(' ')[2]}`}>{title}</h4>
          <span className="text-xs opacity-70">{time}</span>
        </div>
        <p className={`text-sm opacity-90 mb-3 ${colors.split(' ')[2]}`}>{description}</p>
        <button className={`text-xs font-bold flex items-center hover:underline ${colors.split(' ')[2]}`}>
          View Analysis <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default AlertCard;
