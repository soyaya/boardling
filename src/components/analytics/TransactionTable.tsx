import React from 'react';
import { ArrowUpRight, ArrowDownRight, Shield, Zap, Repeat } from 'lucide-react';

const transactions = [
  { id: 'tx_1', type: 'Swap', amount: '150 ZEC', fee: '0.001', time: '2 mins ago', feature: 'DEX', status: 'completed' },
  { id: 'tx_2', type: 'Shield', amount: '500 ZEC', fee: '0.002', time: '15 mins ago', feature: 'Privacy', status: 'completed' },
  { id: 'tx_3', type: 'Bridge', amount: '1000 USDC', fee: '5.00', time: '1 hour ago', feature: 'Bridge', status: 'pending' },
  { id: 'tx_4', type: 'Transfer', amount: '25 ZEC', fee: '0.001', time: '3 hours ago', feature: 'Wallet', status: 'completed' },
  { id: 'tx_5', type: 'Recurring', amount: '10 ZEC', fee: '0.001', time: '1 day ago', feature: 'Subscription', status: 'completed' },
];

const TransactionTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        <button className="text-sm text-gray-500 hover:text-gray-900">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Fee</th>
              <th className="px-6 py-4">Feature</th>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center font-medium text-gray-900">
                    {tx.type === 'Swap' && <ArrowUpRight className="w-4 h-4 mr-2 text-blue-500" />}
                    {tx.type === 'Shield' && <Shield className="w-4 h-4 mr-2 text-gray-900" />}
                    {tx.type === 'Bridge' && <ArrowDownRight className="w-4 h-4 mr-2 text-purple-500" />}
                    {tx.type === 'Recurring' && <Repeat className="w-4 h-4 mr-2 text-green-500" />}
                    {tx.type === 'Transfer' && <Zap className="w-4 h-4 mr-2 text-yellow-500" />}
                    {tx.type}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">{tx.amount}</td>
                <td className="px-6 py-4 text-gray-400">{tx.fee}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                    {tx.feature}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{tx.time}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
