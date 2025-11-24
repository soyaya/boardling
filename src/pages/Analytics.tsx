import React from 'react';
import BehaviorFlow from '../components/analytics/BehaviorFlow';
import TransactionTable from '../components/analytics/TransactionTable';
import MetricCard from '../components/dashboard/MetricCard';
import { Activity, ArrowRightLeft, Shield, Zap } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Deep dive into wallet behavior and transaction flows</p>
        </div>
        <div className="flex space-x-3">
          <select className="bg-white border border-gray-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black">
            <option>All Wallets</option>
            <option>Shielded Only</option>
            <option>High Value</option>
          </select>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Tx Frequency"
          value="12.5/day"
          change="+5%"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Shielded Ratio"
          value="34%"
          change="+2.1%"
          trend="up"
          icon={<Shield className="w-5 h-5" />}
        />
        <MetricCard
          title="Avg Tx Value"
          value="$450"
          change="-1.2%"
          trend="down"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="Bridge Volume"
          value="$1.2M"
          change="+8%"
          trend="up"
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BehaviorFlow />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ridge / Flow Map</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-green-800">Inflow → App</span>
                <span className="text-xs font-bold text-green-700">$2.4M</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-green-700 mt-1">External → In-app retention: 75%</p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-yellow-800">Outflow → Exchanges</span>
                <span className="text-xs font-bold text-yellow-700">$850K</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
              <p className="text-xs text-yellow-700 mt-1">Potential revenue leakage</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-blue-800">Bridge Volume</span>
                <span className="text-xs font-bold text-blue-700">$1.1M</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-blue-700 mt-1">Cross-chain activity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Alerts & Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-red-800">Spike in Outflow Detected</p>
                <p className="text-xs text-red-700 mt-1">
                  Outflow to exchanges increased 45% in last 24h. Monitor for potential churn.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-yellow-800">Low Recurring Transactions</p>
                <p className="text-xs text-yellow-700 mt-1">
                  15% of wallets show decreased transaction frequency this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionTable />
    </div>
  );
};

export default Analytics;
