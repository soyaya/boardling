import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const projects = [
  { name: 'Uniswap V3', chain: 'Ethereum', users: '234K', revenue: '$2.4M', growth: 94, retention: 89.2, trend: 'up' },
  { name: 'Aave V3', chain: 'Polygon', users: '120K', revenue: '$1.1M', growth: 88, retention: 85.4, trend: 'up' },
  { name: 'Curve', chain: 'Ethereum', users: '98K', revenue: '$900K', growth: 76, retention: 91.0, trend: 'down' },
  { name: 'Compound', chain: 'Ethereum', users: '45K', revenue: '$450K', growth: 65, retention: 78.2, trend: 'stable' },
  { name: 'Zcash DeFi', chain: 'Zcash', users: '12K', revenue: '$120K', growth: 92, retention: 88.5, trend: 'up' },
];

const ComparisonTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Market Comparison</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200">Filter by Chain</button>
          <button className="px-3 py-1 text-xs font-medium bg-gray-100 rounded-lg hover:bg-gray-200">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Chain</th>
              <th className="px-6 py-4">Users</th>
              <th className="px-6 py-4">Revenue (7d)</th>
              <th className="px-6 py-4">Growth Score</th>
              <th className="px-6 py-4">Retention</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project, i) => (
              <tr key={i} className={`hover:bg-gray-50 transition-colors ${project.name === 'Zcash DeFi' ? 'bg-blue-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mr-3"></div>
                    <div>
                      <p className="font-bold text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500">Protocol</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {project.chain}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{project.users}</div>
                  <div className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{project.revenue}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                      <div
                        className={`h-1.5 rounded-full ${project.growth >= 90 ? 'bg-green-500' : project.growth >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${project.growth}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold">{project.growth}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{project.retention}%</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Compare</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
