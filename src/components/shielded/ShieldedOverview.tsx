import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const trendData = [
  { name: 'Mon', shielded: 400, transparent: 240 },
  { name: 'Tue', shielded: 300, transparent: 139 },
  { name: 'Wed', shielded: 200, transparent: 980 },
  { name: 'Thu', shielded: 278, transparent: 390 },
  { name: 'Fri', shielded: 189, transparent: 480 },
  { name: 'Sat', shielded: 239, transparent: 380 },
  { name: 'Sun', shielded: 349, transparent: 430 },
];

const pieData = [
  { name: 'Fully Shielded', value: 400 },
  { name: 'Mixed', value: 300 },
  { name: 'Transparent', value: 300 },
];

const COLORS = ['#000000', '#666666', '#cccccc'];

const ShieldedOverview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Shielded vs Transparent Usage</h3>
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
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <Tooltip />
            <Area type="monotone" dataKey="shielded" stroke="#000000" fillOpacity={1} fill="url(#colorShielded)" />
            <Area type="monotone" dataKey="transparent" stroke="#cccccc" fillOpacity={1} fill="url(#colorTransparent)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Privacy Distribution</h3>
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
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ShieldedOverview;
