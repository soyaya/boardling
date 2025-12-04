import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ShieldedAnalytics } from '../../services/analyticsService';

interface ShieldedOverviewProps {
  data: ShieldedAnalytics | null;
}

const COLORS = ['#000000', '#666666', '#cccccc'];

const ShieldedOverview: React.FC<ShieldedOverviewProps> = ({ data }) => {
  // Prepare trend data from API response
  const prepareTrendData = () => {
    if (!data || !data.trends || data.trends.length === 0) {
      // Return empty data if no trends available
      return [];
    }

    // Format trend data for the chart
    return data.trends.map(trend => ({
      name: new Date(trend.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      shielded: trend.shieldedCount,
      transparent: trend.transparentCount,
    }));
  };

  // Prepare pie chart data from metrics
  const preparePieData = () => {
    if (!data || !data.metrics) {
      return [
        { name: 'Fully Shielded', value: 0 },
        { name: 'Mixed', value: 0 },
        { name: 'Transparent', value: 0 },
      ];
    }

    const totalTx = data.metrics.totalShieldedTransactions;
    const shieldedPct = data.metrics.shieldedPercentage;
    
    // Calculate approximate distribution
    // This is a simplified model - in reality you'd get this from the backend
    const fullyShielded = Math.round(totalTx * (shieldedPct / 100) * 0.7);
    const mixed = Math.round(totalTx * (shieldedPct / 100) * 0.3);
    const transparent = totalTx - fullyShielded - mixed;

    return [
      { name: 'Fully Shielded', value: fullyShielded },
      { name: 'Mixed', value: mixed },
      { name: 'Transparent', value: Math.max(0, transparent) },
    ];
  };

  const trendData = prepareTrendData();
  const pieData = preparePieData();

  // Custom tooltip for area chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900 mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <span className="text-xs text-gray-600">Shielded:</span>
              <span className="text-xs font-medium text-gray-900">{payload[0].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Transparent:</span>
              <span className="text-xs font-medium text-gray-900">{payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-xs text-gray-600 mt-1">{payload[0].value.toLocaleString()} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Shielded vs Transparent Usage</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorShielded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTransparent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cccccc" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#cccccc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="shielded" 
                stroke="#000000" 
                fillOpacity={1} 
                fill="url(#colorShielded)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="transparent" 
                stroke="#cccccc" 
                fillOpacity={1} 
                fill="url(#colorTransparent)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No trend data available</p>
              <p className="text-gray-400 text-xs mt-1">Data will appear as transactions are processed</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Distribution</h3>
        {pieData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No distribution data available</p>
              <p className="text-gray-400 text-xs mt-1">Data will appear as transactions are processed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShieldedOverview;
