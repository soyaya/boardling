import React from 'react';
import { Users, Wallet, Activity, DollarSign } from 'lucide-react';
import MetricCard from './MetricCard';

const OverviewMetrics: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Wallets"
        value="1,247"
        change="+12% vs last week"
        trend="up"
        icon={<Wallet className="w-5 h-5" />}
      />
      <MetricCard
        title="Active Users"
        value="892"
        change="+5% vs last week"
        trend="up"
        icon={<Users className="w-5 h-5" />}
      />
      <MetricCard
        title="Total Volume"
        value="$2.4M"
        change="+18% vs last week"
        trend="up"
        icon={<Activity className="w-5 h-5" />}
      />
      <MetricCard
        title="Avg Growth Score"
        value="94"
        change="+2% vs last week"
        trend="up"
        icon={<DollarSign className="w-5 h-5" />}
      />
    </div>
  );
};

export default OverviewMetrics;
