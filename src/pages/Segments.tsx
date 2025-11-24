import React, { useState } from 'react';
import { Users, TrendingUp, ArrowDownUp, User, Activity } from 'lucide-react';

const Segments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'user-type' | 'transaction-type'>('user-type');

  const userTypeSegments = [
    { name: 'New', count: 1240, percentage: 28, trend: '+15%', color: 'bg-blue-500' },
    { name: 'Returning', count: 2180, percentage: 49, trend: '+8%', color: 'bg-green-500' },
    { name: 'Power Users', count: 340, percentage: 8, trend: '+22%', color: 'bg-purple-500' },
    { name: 'Lapsing', count: 420, percentage: 9, trend: '-5%', color: 'bg-yellow-500' },
    { name: 'Churned', count: 180, percentage: 4, trend: '-12%', color: 'bg-red-500' },
    { name: 'High-frequency', count: 95, percentage: 2, trend: '+18%', color: 'bg-indigo-500' },
  ];

  const transactionTypeSegments = [
    { name: 'Swappers', count: 1850, percentage: 42, trend: '+12%', color: 'bg-cyan-500' },
    { name: 'Tippers', count: 620, percentage: 14, trend: '+6%', color: 'bg-pink-500' },
    { name: 'Bridges', count: 980, percentage: 22, trend: '+25%', color: 'bg-orange-500' },
    { name: 'Large Transfers', count: 440, percentage: 10, trend: '+8%', color: 'bg-emerald-500' },
    { name: 'Micro Transactions', count: 530, percentage: 12, trend: '-3%', color: 'bg-lime-500' },
  ];

  const segments = activeTab === 'user-type' ? userTypeSegments : transactionTypeSegments;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Segments</h1>
          <p className="text-gray-500">Categorize and analyze wallets by behavior and transaction patterns</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Export Segments
        </button>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('user-type')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'user-type'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          User Type
        </button>
        <button
          onClick={() => setActiveTab('transaction-type')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transaction-type'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Transaction Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-3 h-3 rounded-full ${segment.color}`}></div>
              <span className={`text-sm font-medium ${segment.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {segment.trend}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{segment.name}</h3>
            <div className="flex items-baseline space-x-2 mb-3">
              <span className="text-3xl font-bold text-gray-900">{segment.count.toLocaleString()}</span>
              <span className="text-sm text-gray-500">wallets</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${segment.color}`}
                style={{ width: `${segment.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{segment.percentage}% of total</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Segment Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Wallets</th>
                <th className="px-6 py-4">Avg Tx/Week</th>
                <th className="px-6 py-4">Retention</th>
                <th className="px-6 py-4">Productivity</th>
                <th className="px-6 py-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {segments.map((segment, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${segment.color} mr-3`}></div>
                      <span className="font-medium text-gray-900">{segment.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{segment.count.toLocaleString()}</td>
                  <td className="px-6 py-4">{(Math.random() * 10 + 2).toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${(80 + i * 3) > 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {80 + i * 3}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                      {70 + i * 4}/100
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${segment.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {segment.trend}
                    </span>
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

export default Segments;
