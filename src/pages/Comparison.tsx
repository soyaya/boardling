import React from 'react';
import ComparisonTable from '../components/comparison/ComparisonTable';
import MetricCard from '../components/dashboard/MetricCard';
import { TrendingUp, Activity, Users, Zap } from 'lucide-react';

const Comparison: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Comparison</h1>
          <p className="text-gray-500">Benchmark your performance against market leaders</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Add Competitor
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Market Share"
          value="0.8%"
          change="+0.2%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Growth Velocity"
          value="92/100"
          change="+4pts"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="User Quality"
          value="High"
          change="Stable"
          trend="up"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Health Score"
          value="A+"
          change="Top 5%"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <ComparisonTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Competitive Advantages</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Higher Retention Rate</p>
                <p className="text-xs text-gray-500">Your retention (88.5%) is 12% higher than sector avg.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Privacy Feature Adoption</p>
                <p className="text-xs text-gray-500">Shielded pool usage is driving 40% of new user growth.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Areas for Improvement</h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                <span className="text-yellow-600 text-xs font-bold">!</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Onboarding Friction</p>
                <p className="text-xs text-gray-500">Time-to-first-tx is 2x slower than Uniswap.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
