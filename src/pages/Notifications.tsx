import React from 'react';
import AlertCard from '../components/notifications/AlertCard';
import { Bell, Filter, Settings } from 'lucide-react';

const Notifications: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
          <p className="text-gray-500">Stay updated on critical changes in your ecosystem</p>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Filter className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center">
            <Bell className="w-4 h-4 mr-2" /> Mark all read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Today</h3>
          <AlertCard
            type="retention"
            severity="high"
            title="Retention Drop Detected"
            description="Cohort 'Nov 06' retention dropped by 15% in the last 24 hours. 12 high-value wallets affected."
            time="2h ago"
          />
          <AlertCard
            type="shielded"
            severity="medium"
            title="Shielded Pool Spike"
            description="Sudden increase in shielded transactions (+45%). Check for new privacy campaign effectiveness."
            time="5h ago"
          />

          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 mt-8">Yesterday</h3>
          <AlertCard
            type="revenue"
            severity="low"
            title="Fee Revenue Milestone"
            description="Daily fee revenue crossed $5,000 for the first time this month."
            time="1d ago"
          />
          <AlertCard
            type="feature"
            severity="medium"
            title="Feature Usage Dip"
            description="Bridge usage is down 20% compared to last week's average."
            time="1d ago"
          />
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs font-bold text-purple-800 mb-1">RECOMMENDATION</p>
                <p className="text-sm text-purple-900 mb-2">
                  To fix the retention drop, consider sending a push notification to the 'Nov 06' cohort with a gas rebate offer.
                </p>
                <button className="text-xs bg-white text-purple-700 px-2 py-1 rounded border border-purple-200 font-medium">
                  Apply Action
                </button>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-1">PREDICTION</p>
                <p className="text-sm text-blue-900">
                  Based on current trends, shielded pool usage will overtake transparent usage by next Tuesday.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
