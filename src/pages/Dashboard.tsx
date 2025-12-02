import React, { useEffect, useState } from 'react';
import OverviewMetrics from '../components/dashboard/OverviewMetrics';
import ProductivityPanel from '../components/dashboard/ProductivityPanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService, type AnalyticsData } from '../services/analyticsService';
import { useCurrentProject } from '../store/useProjectStore';
import { AlertCircle, Download, FileText } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentProject } = useCurrentProject();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentProject?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await analyticsService.getAnalytics(currentProject.id);

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError(response.error || 'Failed to load analytics data');
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [currentProject?.id]);

  const handleExport = async () => {
    if (!currentProject?.id) return;

    setExporting(true);
    const response = await analyticsService.exportReport(currentProject.id, 'json');
    
    if (response.success && response.data) {
      // Create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${currentProject.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert(response.error || 'Failed to export data');
    }
    
    setExporting(false);
  };

  // Prepare chart data from transactions
  const prepareChartData = () => {
    if (!analyticsData?.transactions || analyticsData.transactions.length === 0) {
      return [];
    }

    // Group transactions by day
    const groupedByDay = analyticsData.transactions.reduce((acc, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!acc[date]) {
        acc[date] = { name: date, transactions: 0, volume: 0 };
      }
      
      acc[date].transactions += 1;
      acc[date].volume += tx.amount;
      
      return acc;
    }, {} as Record<string, { name: string; transactions: number; volume: number }>);

    return Object.values(groupedByDay).slice(-7); // Last 7 days
  };

  const chartData = prepareChartData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            {currentProject 
              ? `Real-time analysis for ${currentProject.name}` 
              : 'Select a project to view analytics'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            disabled={!currentProject || exporting}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </button>
          <button 
            disabled={!currentProject}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Create Report
          </button>
        </div>
      </div>

      <OverviewMetrics />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-medium text-sm">Error Loading Analytics</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Transaction Activity</h3>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-black">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }}
                    cursor={{ fill: '#f9fafb' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'volume') {
                        return [(value / 100000000).toFixed(4) + ' ZEC', 'Volume'];
                      }
                      return [value, 'Transactions'];
                    }}
                  />
                  <Bar 
                    dataKey="transactions" 
                    fill="#000000" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">No transaction data available</p>
                <p className="text-gray-400 text-xs mt-1">Add wallets to start tracking activity</p>
              </div>
            </div>
          )}
        </div>

        {/* Productivity Panel */}
        <div className="lg:col-span-1">
          <ProductivityPanel />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>
        
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : analyticsData?.transactions && analyticsData.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analyticsData.transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mr-3 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">
                            {tx.type.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono text-xs">
                          {tx.txid.substring(0, 8)}...{tx.txid.substring(tx.txid.length - 6)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {(tx.amount / 100000000).toFixed(4)} ZEC
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tx.status === 'confirmed' 
                          ? 'bg-green-100 text-green-700' 
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No transactions found</p>
            <p className="text-gray-400 text-xs mt-1">Transactions will appear here once wallets are active</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
