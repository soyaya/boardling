import React from 'react';

const ShieldedFlow: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Shielded Behavior Flow</h3>
      <div className="relative h-64 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-around opacity-50">
          {/* Simple visualization of t -> z -> z -> t */}
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold">t-addr</div>
          <div className="h-1 w-24 bg-gray-300"></div>
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-bold">z-pool</div>
          <div className="h-1 w-24 bg-gray-300"></div>
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center font-bold">z-pool</div>
          <div className="h-1 w-24 bg-gray-300"></div>
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold">t-addr</div>
        </div>
        <span className="relative z-10 bg-white px-4 py-2 rounded-full shadow-sm font-medium text-gray-600">
          Flow Visualization Placeholder
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Avg Hops</p>
          <p className="text-lg font-bold">2.4</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Time Shielded</p>
          <p className="text-lg font-bold">4.5 Days</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Retention Lift</p>
          <p className="text-lg font-bold text-green-600">+15%</p>
        </div>
      </div>
    </div>
  );
};

export default ShieldedFlow;
