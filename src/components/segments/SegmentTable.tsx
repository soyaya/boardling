import React from 'react';

interface Segment {
  status: string;
  risk_level: string;
  wallet_count: number;
  avg_score: number;
  avg_retention: number;
  avg_adoption: number;
  avg_activity: number;
}

interface SegmentTableProps {
  segments: Segment[];
  totalWallets: number;
}

const SegmentTable: React.FC<SegmentTableProps> = ({ segments, totalWallets }) => {
  const getSegmentColor = (status: string) => {
    if (status === 'healthy') return 'bg-green-500';
    if (status === 'at_risk') return 'bg-yellow-500';
    if (status === 'churn') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      churn: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Segment Details</h3>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive breakdown of wallet segments by status and risk level
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Segment</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Risk Level</th>
              <th className="px-6 py-4">Wallets</th>
              <th className="px-6 py-4">% of Total</th>
              <th className="px-6 py-4">Avg Score</th>
              <th className="px-6 py-4">Retention</th>
              <th className="px-6 py-4">Adoption</th>
              <th className="px-6 py-4">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {segments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No segment data available
                </td>
              </tr>
            ) : (
              segments.map((segment, i) => {
                const percentage = totalWallets > 0 ? (segment.wallet_count / totalWallets) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${getSegmentColor(segment.status)} mr-3`}></div>
                        <span className="font-medium text-gray-900">
                          {segment.status.charAt(0).toUpperCase() + segment.status.slice(1).replace('_', ' ')} - {segment.risk_level.charAt(0).toUpperCase() + segment.risk_level.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(segment.status)}`}>
                        {segment.status.charAt(0).toUpperCase() + segment.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(segment.risk_level)}`}>
                        {segment.risk_level.charAt(0).toUpperCase() + segment.risk_level.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{segment.wallet_count.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${segment.avg_score >= 75 ? 'text-green-600' : segment.avg_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {segment.avg_score.toFixed(1)}/100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{segment.avg_retention.toFixed(1)}/100</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{segment.avg_adoption.toFixed(1)}/100</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{segment.avg_activity.toFixed(1)}/100</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SegmentTable;
