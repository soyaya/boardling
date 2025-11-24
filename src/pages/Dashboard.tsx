import React from 'react';
import OverviewMetrics from '../components/dashboard/OverviewMetrics';
import ProductivityPanel from '../components/dashboard/ProductivityPanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', users: 4000, revenue: 2400 },
  { name: 'Tue', users: 3000, revenue: 1398 },
  { name: 'Wed', users: 2000, revenue: 9800 },
  { name: 'Thu', users: 2780, revenue: 3908 },
  { name: 'Fri', users: 1890, revenue: 4800 },
  { name: 'Sat', users: 2390, revenue: 3800 },
  { name: 'Sun', users: 3490, revenue: 4300 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Real-time analysis across your Zcash project</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Export Data
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Create Report
          </button>
        </div>
      </div>

      <OverviewMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">User Growth Trend</h3>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-black">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="users" fill="#000000" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Panel */}
        <div className="lg:col-span-1">
          <ProductivityPanel />
        </div>
      </div>

      {/* Recent Activity / Top Projects Table Placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Top Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mr-3"></div>
                      0x1234...5678
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                  </td>
                  <td className="px-6 py-4">$12,400</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mr-2">
                        <div className="h-1.5 bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-xs font-medium">85</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
