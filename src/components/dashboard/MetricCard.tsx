import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, trend, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900 block mb-1">{value}</span>
          <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
