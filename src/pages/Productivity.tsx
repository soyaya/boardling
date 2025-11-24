import React from 'react';
import ProductivityPanel from '../components/dashboard/ProductivityPanel';
import MetricCard from '../components/dashboard/MetricCard';
import { Activity, TrendingUp, Zap, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const productivityData = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 72 },
  { name: 'Mar', score: 78 },
  { name: 'Apr', score: 82 },
  { name: 'May', score: 88 },
  { name: 'Jun', score: 92 },
];

const radarData = [
  { metric: 'Frequency', value: 92 },
  { metric: 'Diversity', value: 85 },
  { metric: 'Size', value: 78 },
  { metric: 'Consistency', value: 88 },
  { metric: 'Engagement', value: 90 },
  { metric: 'Retention', value: 86 },
];

const Productivity: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productivity Score</h1>
          <p className="text-gray-500">Comprehensive wallet efficiency and engagement metrics</p>
        </div>
        <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Overall Score"
          value="92/100"
          change="+4pts"
          trend="up"
          icon={<Target className="w-5 h-5" />}
        />
        <MetricCard
          title="Tx Frequency"
          value="8.4/day"
          change="+12%"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
        <MetricCard
          title="Feature Usage"
          value="6.2/10"
          change="+0.8"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="Engagement Rate"
          value="89%"
          change="+5%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityPanel />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#000000" fill="#000000" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productivityData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#000000" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Top Productive Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Transactions</th>
                <th className="px-6 py-4">Features Used</th>
                <th className="px-6 py-4">Consistency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { wallet: 'zs1abc...def', score: 98, txs: 1240, features: '9/10', consistency: '95%' },
                { wallet: 'zs1ghi...jkl', score: 96, txs: 1105, features: '8/10', consistency: '92%' },
                { wallet: 'zs1mno...pqr', score: 94, txs: 980, features: '9/10', consistency: '89%' },
                { wallet: 'zs1stu...vwx', score: 91, txs: 875, features: '7/10', consistency: '91%' },
                { wallet: 'zs1yza...bcd', score: 88, txs: 820, features: '8/10', consistency: '87%' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{row.wallet}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                      {row.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{row.txs}</td>
                  <td className="px-6 py-4">{row.features}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{row.consistency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Productivity;
