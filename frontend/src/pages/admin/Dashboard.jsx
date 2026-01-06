import { useEffect, useState } from 'react';
import Layout from '../../components/shared/Layout';
import { dashboardAPI } from '../../services/api';
import { Briefcase, Users, TrendingUp, Award } from 'lucide-react';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  const overview = dashboard?.overview || {};

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Briefcase} title="Total Jobs" value={overview.total_jobs || 0} color="blue" />
        <StatCard icon={Users} title="Total Students" value={overview.total_students || 0} color="green" />
        <StatCard icon={TrendingUp} title="Applications" value={overview.total_applications || 0} color="purple" />
        <StatCard icon={Award} title="Placement Rate" value={`${overview.placement_rate || 0}%`} color="orange" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
        {dashboard?.recent_applications?.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recent_applications.map((app) => (
              <div key={app.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{app.f_name} {app.l_name}</p>
                  <p className="text-sm text-gray-600">{app.job_title} - {app.company_name}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No applications yet</p>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon size={24} />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;