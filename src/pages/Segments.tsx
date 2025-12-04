import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Download } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { apiClient } from '../services/apiClient';
import LoadingScreen from '../components/LoadingScreen';
import SegmentCard from '../components/segments/SegmentCard';
import SegmentFilter from '../components/segments/SegmentFilter';
import SegmentTable from '../components/segments/SegmentTable';

// Backend response structure
interface Segment {
  status: string;
  risk_level: string;
  wallet_count: number;
  avg_score: number;
  avg_retention: number;
  avg_adoption: number;
  avg_activity: number;
}

const Segments: React.FC = () => {
  const { currentProject } = useProjectStore();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [filteredSegments, setFilteredSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [totalWallets, setTotalWallets] = useState(0);

  // Fetch segment data
  useEffect(() => {
    const fetchSegments = async () => {
      if (!currentProject?.id) {
        setError('No project selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call the backend API directly since the response structure is different
        const response = await apiClient.get(`/api/analytics/segments/${currentProject.id}`);

        if (response.success && response.data) {
          const segmentData = response.data.segments || [];
          setSegments(segmentData);
          
          // Calculate total wallets
          const total = segmentData.reduce(
            (sum: number, seg: Segment) => sum + seg.wallet_count,
            0
          );
          setTotalWallets(total);
        } else {
          setError(response.error || 'Failed to load segment data');
        }
      } catch (err) {
        console.error('Error fetching segments:', err);
        setError('An error occurred while loading segment data');
      } finally {
        setLoading(false);
      }
    };

    fetchSegments();
  }, [currentProject?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...segments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(seg => seg.status === statusFilter);
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(seg => seg.risk_level === riskFilter);
    }

    setFilteredSegments(filtered);
  }, [segments, statusFilter, riskFilter]);

  const handleExport = () => {
    // Create CSV content
    const headers = ['Segment', 'Status', 'Risk Level', 'Wallet Count', 'Avg Score', 'Avg Retention', 'Avg Adoption', 'Avg Activity'];
    const rows = filteredSegments.map(seg => [
      `${seg.status}-${seg.risk_level}`,
      seg.status,
      seg.risk_level,
      seg.wallet_count,
      seg.avg_score.toFixed(2),
      seg.avg_retention.toFixed(2),
      seg.avg_adoption.toFixed(2),
      seg.avg_activity.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segments-${currentProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Segments</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Segments</h1>
          <p className="text-gray-500">
            Categorize and analyze wallets by status and risk level
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredSegments.length === 0}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Segments</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Wallets</p>
              <p className="text-2xl font-bold text-gray-900">{totalWallets.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Segments</p>
              <p className="text-2xl font-bold text-gray-900">{segments.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Healthy Wallets</p>
              <p className="text-2xl font-bold text-green-600">
                {segments
                  .filter(s => s.status === 'healthy')
                  .reduce((sum, s) => sum + s.wallet_count, 0)
                  .toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At Risk</p>
              <p className="text-2xl font-bold text-yellow-600">
                {segments
                  .filter(s => s.status === 'at_risk')
                  .reduce((sum, s) => sum + s.wallet_count, 0)
                  .toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <SegmentFilter
        statusFilter={statusFilter}
        riskFilter={riskFilter}
        onStatusChange={setStatusFilter}
        onRiskChange={setRiskFilter}
      />

      {/* Segment Cards */}
      {filteredSegments.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Segments Found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' || riskFilter !== 'all'
              ? 'Try adjusting your filters to see more segments.'
              : 'No wallet segments available for this project yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSegments.map((segment, i) => (
              <SegmentCard key={i} segment={segment} totalWallets={totalWallets} />
            ))}
          </div>

          {/* Detailed Table */}
          <SegmentTable segments={filteredSegments} totalWallets={totalWallets} />
        </>
      )}
    </div>
  );
};

export default Segments;
