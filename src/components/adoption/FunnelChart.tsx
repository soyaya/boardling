import React from 'react';
import { ResponsiveContainer, FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip } from 'recharts';

const data = [
  {
    "value": 1000,
    "name": "Wallet Created",
    "fill": "#000000"
  },
  {
    "value": 750,
    "name": "First Transaction",
    "fill": "#333333"
  },
  {
    "value": 500,
    "name": "Feature Usage",
    "fill": "#555555"
  },
  {
    "value": 350,
    "name": "Recurring Tx",
    "fill": "#777777"
  },
  {
    "value": 250,
    "name": "Active Weekly",
    "fill": "#999999"
  },
  {
    "value": 100,
    "name": "High-Value",
    "fill": "#bbbbbb"
  }
];

const FunnelChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Adoption Funnel</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
          >
            <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
