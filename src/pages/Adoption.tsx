import React from 'react';
import FunnelChart from '../components/adoption/FunnelChart';
import MetricCard from '../components/dashboard/MetricCard';
import { UserPlus, MousePointer, Repeat, Star } from 'lucide-react';

const Adoption: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adoption Funnel</h1>
          <p className="text-gray-500">Track conversion from first exposure to high-value engagement</p>
        </div>
        <div className="flex space-x-3">
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black">
            <option>All Cohorts</option>
            <option>This Week</option>
            <option>Last Month</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="New Wallets"
          value="1,240"
          change="+12%"
          trend="up"
          icon={<UserPlus className="w-5 h-5" />}
        />
        <MetricCard
          title="Activation Rate"
          value="75%"
          change="+5%"
          trend="up"
          icon={<MousePointer className="w-5 h-5" />}
        />
        <MetricCard
          title="Retention Rate"
          value="35%"
          change="-2%"
          trend="down"
          icon={<Repeat className="w-5 h-5" />}
        />
        <MetricCard
          title="High Value %"
          value="10%"
          change="+1%"
          trend="up"
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Drop-off Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <h4 className="text-sm font-bold text-red-800 mb-1">30% Drop-off at Feature Usage</h4>
              <p className="text-xs text-red-600 mb-3">
                Users are connecting wallets but not using features. Consider adding a tooltip tour.
              </p>
              <button className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                View Affected Wallets
              </button>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">Slow Activation Time</h4>
              <p className="text-xs text-yellow-600">
                Avg time to first tx increased to 45 mins. Check network congestion or UI friction.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Conversion Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Wallets</th>
                <th className="px-6 py-4">Conversion</th>
                <th className="px-6 py-4">Drop-off</th>
                <th className="px-6 py-4">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { stage: 'Wallet Created', count: 1000, conv: '-', drop: '-', time: '-' },
                { stage: 'First Transaction', count: 750, conv: '75%', drop: '25%', time: '10m' },
                { stage: 'Feature Usage', count: 500, conv: '66%', drop: '33%', time: '2h' },
                { stage: 'Recurring Tx', count: 350, conv: '70%', drop: '30%', time: '3d' },
                { stage: 'Active Weekly', count: 250, conv: '71%', drop: '29%', time: '7d' },
                { stage: 'High-Value', count: 100, conv: '40%', drop: '60%', time: '30d' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.stage}</td>
                  <td className="px-6 py-4">{row.count}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{row.conv}</td>
                  <td className="px-6 py-4 text-red-500">{row.drop}</td>
                  <td className="px-6 py-4 text-gray-400">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Adoption;
