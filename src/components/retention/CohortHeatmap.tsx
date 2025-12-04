import React from 'react';
import { type CohortData } from '../../services/analyticsService';

interface CohortHeatmapProps {
  cohorts: CohortData[];
  loading?: boolean;
}

const CohortHeatmap: React.FC<CohortHeatmapProps> = ({ cohorts, loading = false }) => {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-green-300';
    if (value >= 20) return 'bg-green-200';
    return 'bg-green-100';
  };

  const formatCohortPeriod = (period: string) => {
    try {
      const date = new Date(period);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return period;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Retention Cohorts</h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Retention Cohorts</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">No cohort data available yet.</p>
          <p className="text-sm text-gray-400 mt-2">Cohort data will appear as wallets become active over time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Retention Cohorts</h3>

      <table className="w-full min-w-max text-sm text-left">
        <thead>
          <tr>
            <th className="py-3 px-4 text-gray-500 font-medium">Cohort</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Wallets</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 0</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 1</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 2</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 3</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 4</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cohorts.map((cohort, i) => {
            // Build retention array with Week 0 always being 100%
            const retentionValues = [
              100,
              cohort.retentionWeek1,
              cohort.retentionWeek2,
              cohort.retentionWeek3,
              cohort.retentionWeek4,
            ];

            return (
              <tr key={i}>
                <td className="py-3 px-4 font-medium text-gray-900">
                  {formatCohortPeriod(cohort.cohortPeriod)}
                </td>
                <td className="py-3 px-4 text-gray-600">{cohort.walletCount}</td>
                {retentionValues.map((val, j) => {
                  // Determine if this week has data (cohort is old enough)
                  const hasData = j === 0 || val > 0;
                  
                  return (
                    <td key={j} className="py-3 px-4">
                      {hasData ? (
                        <div
                          className={`${getColor(val)} text-white text-xs font-bold py-1 px-2 rounded text-center w-12`}
                          title={`${val.toFixed(1)}% Retention`}
                        >
                          {val.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="bg-gray-50 text-gray-300 text-xs font-bold py-1 px-2 rounded text-center w-12">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Retention Scale:</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-500">80%+</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span className="text-xs text-gray-500">60-79%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-300 rounded"></div>
                <span className="text-xs text-gray-500">40-59%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <span className="text-xs text-gray-500">20-39%</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-xs text-gray-500">&lt;20%</span>
              </div>
            </div>
          </div>
          <div className="text-gray-500">
            Total Cohorts: <span className="font-medium text-gray-900">{cohorts.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CohortHeatmap;
