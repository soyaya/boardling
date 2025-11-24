import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

const data = {
  nodes: [
    { name: 'Wallet Funding' },
    { name: 'Swap (DEX)' },
    { name: 'Bridge' },
    { name: 'Shielded Pool' },
    { name: 'NFT Mint' },
    { name: 'Staking' },
    { name: 'Exit' },
  ],
  links: [
    { source: 0, target: 1, value: 500 },
    { source: 0, target: 2, value: 300 },
    { source: 1, target: 3, value: 200 },
    { source: 1, target: 4, value: 150 },
    { source: 2, target: 3, value: 100 },
    { source: 2, target: 5, value: 100 },
    { source: 3, target: 6, value: 50 },
    { source: 3, target: 5, value: 150 },
  ],
};

const BehaviorFlow: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
      <h3 className="text-lg font-bold text-gray-900 mb-4">User Behavior Flow</h3>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={{ stroke: '#000', strokeWidth: 0 }}
          nodePadding={50}
          margin={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
          link={{ stroke: '#e5e7eb' }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default BehaviorFlow;
