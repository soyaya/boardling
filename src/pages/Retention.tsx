import React from 'react';
import CohortHeatmap from '../components/retention/CohortHeatmap';
import MetricCard from '../components/dashboard/MetricCard';
import { Users, UserMinus, Repeat, TrendingDown } from 'lucide-react';

const Retention: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retention & Cohorts</h1>
          <p className="text-gray-500">Track user retention and identify churn risks</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Export Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Retention (W4)"
          value="32%"
          change="+2.4%"
          trend="up"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Churn Rate"
          value="12%"
          change="-0.5%"
          trend="up" // Good that it's down, but trend direction visually
          icon={<UserMinus className="w-5 h-5" />}
        />
        <MetricCard
          title="Recurring Users"
          value="450"
          change="+15%"
          trend="up"
          icon={<Repeat className="w-5 h-5" />}
        />
        <MetricCard
          title="At Risk"
          value="85"
          change="+5%"
          trend="down" // Bad
          icon={<TrendingDown className="w-5 h-5" />}
        />
      </div>

      <CohortHeatmap />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Active vs Churn Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Wallets</span>
              <span className="text-lg font-bold text-green-600">820 (68%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 h-8 bg-green-500 rounded-l-full flex items-center justify-end pr-2">
                <span className="text-xs text-white font-medium">Active</span>
              </div>
              <div className="flex-1 h-8 bg-red-500 rounded-r-full flex items-center pl-2">
                <span className="text-xs text-white font-medium">Churned</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Churned Wallets</span>
              <span className="text-lg font-bold text-red-600">385 (32%)</span>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-3">At-Risk Wallets</h4>
              {[
                { label: 'Low Recurring Txs', count: 85, color: 'red' },
                { label: 'Declining Activity', count: 62, color: 'yellow' },
                { label: 'Long Inactivity', count: 43, color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500 mr-2`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recurring Transaction Frequency</h3>
          <div className="space-y-3">
            {[
              { wallet: 'zs1abc...def', txs: 45, type: 'Swap', lastActive: '2h ago', status: 'high' },
              { wallet: 'zs1ghi...jkl', txs: 38, type: 'Bridge', lastActive: '5h ago', status: 'high' },
              { wallet: 'zs1mno...pqr', txs: 24, type: 'Transfer', lastActive: '1d ago', status: 'medium' },
              { wallet: 'zs1stu...vwx', txs: 12, type: 'Swap', lastActive: '3d ago', status: 'low' },
              { wallet: 'zs1yza...bcd', txs: 8, type: 'Transfer', lastActive: '5d ago', status: 'at-risk' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${item.status === 'high' ? 'bg-green-50 border-green-100' :
                  item.status === 'at-risk' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full mr-3 ${item.status === 'high' ? 'bg-green-200' :
                      item.status === 'at-risk' ? 'bg-red-200' : 'bg-gray-200'
                    }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.wallet}</p>
                    <p className="text-xs text-gray-500">{item.type} • {item.lastActive}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{item.txs} Tx</p>
                  <p className={`text-xs font-medium ${item.status === 'high' ? 'text-green-700' :
                      item.status === 'at-risk' ? 'text-red-700' : 'text-gray-600'
                    }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Retention;
