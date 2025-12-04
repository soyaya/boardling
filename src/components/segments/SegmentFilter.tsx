import React from 'react';
import { Filter } from 'lucide-react';

interface SegmentFilterProps {
  statusFilter: string;
  riskFilter: string;
  onStatusChange: (status: string) => void;
  onRiskChange: (risk: string) => void;
}

const SegmentFilter: React.FC<SegmentFilterProps> = ({
  statusFilter,
  riskFilter,
  onStatusChange,
  onRiskChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center space-x-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="at_risk">At Risk</option>
            <option value="churn">Churn</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Risk Level:</label>
          <select
            value={riskFilter}
            onChange={(e) => onRiskChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        {(statusFilter !== 'all' || riskFilter !== 'all') && (
          <button
            onClick={() => {
              onStatusChange('all');
              onRiskChange('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentFilter;
