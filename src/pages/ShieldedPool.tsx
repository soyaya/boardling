import React from 'react';
import ShieldedOverview from '../components/shielded/ShieldedOverview';
import ShieldedFlow from '../components/shielded/ShieldedFlow';
import MetricCard from '../components/dashboard/MetricCard';
import { Shield, Lock, EyeOff, Activity } from 'lucide-react';

const ShieldedPool: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shielded Pool Analytics</h1>
          <p className="text-gray-500">Insights into privacy-focused usage and behavior</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Generate Privacy Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Shielded TVL"
          value="$4.2M"
          change="+8%"
          trend="up"
          icon={<Lock className="w-5 h-5" />}
        />
        <MetricCard
          title="% Transactions Shielded"
          value="42%"
          change="+5%"
          trend="up"
          icon={<Shield className="w-5 h-5" />}
        />
        <MetricCard
          title="Anonymity Set"
          value="15k"
          change="+12%"
          trend="up"
          icon={<EyeOff className="w-5 h-5" />}
        />
        <MetricCard
          title="Pool Velocity"
          value="High"
          change="Stable"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <ShieldedOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ShieldedFlow />
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Productivity</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <span className="text-5xl font-bold text-gray-900">88</span>
              <span className="text-gray-400 text-xl">/100</span>
              <p className="mt-2 text-sm text-gray-500">Excellent Privacy Health</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Consistency</span>
              <span className="font-medium">92%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-black h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Internal Hops</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-black h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShieldedPool;
