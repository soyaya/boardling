import React from 'react';
import { ResponsiveContainer, FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';
import type { AdoptionFunnelData } from '../../services/analyticsService';

interface FunnelChartProps {
  data: AdoptionFunnelData | null;
}

// Stage name mapping for display
const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'created': 'Wallet Created',
  'first_tx': 'First Transaction',
  'feature_usage': 'Feature Usage',
  'recurring': 'Recurring Tx',
  'high_value': 'High-Value',
};

// Color gradient for funnel stages (darker to lighter)
const STAGE_COLORS = [
  '#000000', // Wallet Created - Black
  '#1a1a1a', // First Transaction - Very Dark Gray
  '#333333', // Feature Usage - Dark Gray
  '#4d4d4d', // Recurring Tx - Medium Dark Gray
  '#666666', // High-Value - Medium Gray
];

const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  // Transform adoption data to funnel chart format
  const chartData = React.useMemo(() => {
    if (!data || !data.stages || data.stages.length === 0) {
      return [];
    }

    return data.stages.map((stage, index) => ({
      value: stage.walletCount,
      name: STAGE_DISPLAY_NAMES[stage.stage] || stage.stage,
      fill: STAGE_COLORS[index] || '#999999',
      percentage: stage.percentage,
      conversionRate: stage.conversionRate,
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            Wallets: <span className="font-medium">{data.value.toLocaleString()}</span>
          </p>
          {data.percentage !== undefined && (
            <p className="text-sm text-gray-600">
              Of Total: <span className="font-medium">{Math.round(data.percentage)}%</span>
            </p>
          )}
          {data.conversionRate !== undefined && data.conversionRate > 0 && (
            <p className="text-sm text-green-600">
              Conversion: <span className="font-medium">{Math.round(data.conversionRate)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, name, percentage } = props;
    
    return (
      <g>
        <text
          x={x + width + 10}
          y={y + height / 2}
          fill="#000"
          textAnchor="start"
          dominantBaseline="middle"
          className="text-sm font-medium"
        >
          {name}
        </text>
        <text
          x={x + width + 10}
          y={y + height / 2 + 16}
          fill="#666"
          textAnchor="start"
          dominantBaseline="middle"
          className="text-xs"
        >
          {value.toLocaleString()} ({Math.round(percentage)}%)
        </text>
      </g>
    );
  };

  if (!data || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold mb-2">No Funnel Data</p>
          <p className="text-sm">Add wallets to your project to see the adoption funnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Adoption Funnel</h3>
        <div className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-900">{data.totalWallets.toLocaleString()}</span> wallets
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList content={renderCustomLabel} />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
