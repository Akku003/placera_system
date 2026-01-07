import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Building2, Award, DollarSign, Target } from 'lucide-react';
import axios from 'axios';
import StatsCard from './StatsCard';

const StatisticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/statistics/stats');
        console.log('Statistics API Response:', response.data);
        
        if (response.data && response.data.data) {
          setStats(response.data.data);
        } else {
          setError('Invalid data format received from API');
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
          ⚠️ {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats || !stats.summary) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No statistics available</div>;
  }

  // Safely prepare data for charts
  const yearlyData = stats.yearly_stats ? Object.entries(stats.yearly_stats).map(([year, data]) => ({
    year,
    placements: data.total_placements || 0,
    companies: data.num_companies || 0
  })) : [];

  const topRecruitersData = stats.top_recruiters ? stats.top_recruiters.slice(0, 8) : [];

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  // Safely get insights with defaults
  const insights = stats.insights || {
    highest_package: 'N/A',
    average_package: 'N/A',
    most_consistent_recruiter: 'N/A',
    peak_recruitment_year: 'N/A',
    total_job_offers: 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Users size={24} />}
          title="Total Students Placed"
          value={stats.summary.total_students_placed?.toLocaleString() || '0'}
          subtitle="From 2020-2022"
          color="primary"
        />
        <StatsCard
          icon={<Building2 size={24} />}
          title="Company Visits"
          value={stats.summary.total_company_visits || '0'}
          subtitle="Unique recruiters"
          color="blue"
        />
        <StatsCard
          icon={<Target size={24} />}
          title="Placement Rate"
          value={`${stats.summary.estimated_success_rate || 0}%`}
          subtitle="Success rate"
          color="green"
        />
        <StatsCard
          icon={<Award size={24} />}
          title="Average per Year"
          value={Math.round(stats.summary.average_per_year || 0)}
          subtitle="Students/year"
          color="yellow"
        />
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={<DollarSign size={24} />}
          title="Highest Package"
          value={insights.highest_package}
          subtitle="Maximum offered"
          color="purple"
        />
        <StatsCard
          icon={<DollarSign size={24} />}
          title="Average Package"
          value={insights.average_package}
          subtitle="Mean salary"
          color="orange"
        />
        <StatsCard
          icon={<TrendingUp size={24} />}
          title="Total Job Offers"
          value={insights.total_job_offers?.toLocaleString() || '0'}
          subtitle="Across all years"
          color="green"
        />
      </div>

      {/* Charts Section */}
      {yearlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Year-wise Placements Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📈 Year-wise Placement Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="placements" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Students Placed"
                  dot={{ fill: '#8b5cf6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="companies" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Companies Visited"
                  dot={{ fill: '#3b82f6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Recruiters Bar Chart */}
          {topRecruitersData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏆 Top Recruiting Companies
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topRecruitersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Bar 
                    dataKey="total_placements" 
                    name="Placements" 
                    radius={[8, 8, 0, 0]}
                    fill="#8b5cf6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Top Recruiters Detailed List */}
      {topRecruitersData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            💼 Top Recruiting Companies (2020-2022)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.top_recruiters.map((company, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      #{index + 1}
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {company.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {company.years_recruited} {company.years_recruited === 1 ? 'year' : 'years'} recruiting
                  </p>
                  {company.avg_package && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                      Avg: {company.avg_package}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {company.total_placements}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year-wise Breakdown */}
      {stats.yearly_stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            📅 Year-wise Company Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(stats.yearly_stats).map(([year, data]) => (
              <div key={year} className="border dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-3">
                  {year}
                </h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Placements:</span>
                    <span className="text-sm font-semibold dark:text-white">{data.total_placements || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Companies:</span>
                    <span className="text-sm font-semibold dark:text-white">{data.num_companies || 0}</span>
                  </div>
                </div>
                {data.top_companies && data.top_companies.length > 0 && (
                  <div className="border-t dark:border-gray-700 pt-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Top Recruiters:
                    </p>
                    <div className="space-y-1">
                      {data.top_companies.slice(0, 3).map((company, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{company.name}</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {company.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">🎯 Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-90">Most Consistent Recruiter</p>
            <p className="text-2xl font-bold">{insights.most_consistent_recruiter}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Peak Recruitment Year</p>
            <p className="text-2xl font-bold">{insights.peak_recruitment_year}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;