import React from 'react';

const cohorts = [
  { week: 'Oct 23', users: 200, retention: [100, 70, 50, 32, 18] },
  { week: 'Oct 30', users: 245, retention: [100, 68, 48, 30] },
  { week: 'Nov 06', users: 310, retention: [100, 72, 55] },
  { week: 'Nov 13', users: 280, retention: [100, 75] },
  { week: 'Nov 20', users: 350, retention: [100] },
];

const CohortHeatmap: React.FC = () => {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 40) return 'bg-green-300';
    if (value >= 20) return 'bg-green-200';
    return 'bg-green-100';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Retention Cohorts</h3>

      <table className="w-full min-w-max text-sm text-left">
        <thead>
          <tr>
            <th className="py-3 px-4 text-gray-500 font-medium">Cohort</th>
            <th className="py-3 px-4 text-gray-500 font-medium">New Users</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 0</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 1</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 2</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 3</th>
            <th className="py-3 px-4 text-gray-500 font-medium">Week 4</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cohorts.map((cohort, i) => (
            <tr key={i}>
              <td className="py-3 px-4 font-medium text-gray-900">{cohort.week}</td>
              <td className="py-3 px-4 text-gray-600">{cohort.users}</td>
              {cohort.retention.map((val, j) => (
                <td key={j} className="py-3 px-4">
                  <div
                    className={`${getColor(val)} text-white text-xs font-bold py-1 px-2 rounded text-center w-12`}
                    title={`${val}% Retention`}
                  >
                    {val}%
                  </div>
                </td>
              ))}
              {/* Fill empty cells */}
              {[...Array(5 - cohort.retention.length)].map((_, k) => (
                <td key={`empty-${k}`} className="py-3 px-4">
                  <div className="bg-gray-50 text-gray-300 text-xs font-bold py-1 px-2 rounded text-center w-12">
                    -
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CohortHeatmap;
