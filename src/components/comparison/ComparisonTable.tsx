import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { ComparisonMetric } from '../../services/analyticsService';

interface ComparisonTableProps {
  metrics: ComparisonMetric[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ metrics }) => {
  // Helper to get trend icon
  const getTrendIcon = (yourValue: number, industryAverage: number) => {
    const diff = yourValue - industryAverage;
    const percentDiff = (diff / industryAverage) * 100;
    
    if (Math.abs(percentDiff) < 5) {
      return <Minus className="w-3 h-3 text-gray-500" />;
    }
    
    return percentDiff > 0 ? (
      <ArrowUpRight className="w-3 h-3 text-green-600" />
    ) : (
      <ArrowDownRight className="w-3 h-3 text-red-600" />
    );
  };

  // Helper to get trend color
  const getTrendColor = (yourValue: number, industryAverage: number) => {
    const diff = yourValue - industryAverage;
    const percentDiff = (diff / industryAverage) * 100;
    
    if (Math.abs(percentDiff) < 5) {
      return 'text-gray-600';
    }
    
    return percentDiff > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Helper to get percentile badge color
  const getPercentileBadgeColor = (percentile: number) => {
    if (percentile >= 90) return 'bg-green-100 text-green-800';
    if (percentile >= 75) return 'bg-blue-100 text-blue-800';
    if (percentile >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Competitive Benchmarks</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200">
            Sort by Metric
          </button>
          <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200">
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Metric</th>
              <th className="px-6 py-4">Your Value</th>
              <th className="px-6 py-4">Industry Average</th>
              <th className="px-6 py-4">Difference</th>
              <th className="px-6 py-4">Percentile</th>
              <th className="px-6 py-4">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {metrics.map((metric, index) => {
              const diff = metric.yourValue - metric.industryAverage;
              const percentDiff = ((diff / metric.industryAverage) * 100).toFixed(1);
              const isPositive = diff > 0;
              
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{metric.metric}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{metric.yourValue.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{metric.industryAverage.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center ${getTrendColor(metric.yourValue, metric.industryAverage)}`}>
                      {getTrendIcon(metric.yourValue, metric.industryAverage)}
                      <span className="ml-1 font-medium">
                        {isPositive ? '+' : ''}{percentDiff}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPercentileBadgeColor(metric.percentile)}`}>
                      {metric.percentile}th
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.percentile >= 90 ? 'bg-green-500' : 
                            metric.percentile >= 75 ? 'bg-blue-500' : 
                            metric.percentile >= 50 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${metric.percentile}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{metric.percentile}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
