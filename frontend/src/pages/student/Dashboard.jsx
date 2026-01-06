import { useEffect, useState } from 'react';
import Layout from '../../components/shared/Layout';
import { dashboardAPI } from '../../services/api';
import { Briefcase, FileText, TrendingUp, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await dashboardAPI.getStudentDashboard();
            console.log('Dashboard Data:', response.data); // DEBUG
            setDashboard(response.data.dashboard);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

    const stats = dashboard?.application_stats || {};

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard icon={Briefcase} title="Total Applications" value={stats.total || 0} color="blue" />
                <StatCard icon={FileText} title="Pending" value={stats.pending || 0} color="yellow" />
                <StatCard icon={CheckCircle} title="Shortlisted" value={stats.shortlisted || 0} color="green" />
                <StatCard icon={TrendingUp} title="Avg ATS Score" value={stats.avg_ats_score || 0} color="purple" />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
                {dashboard?.recent_applications?.length > 0 ? (
                    <div className="space-y-3">
                        {dashboard.recent_applications.map((app) => (
                            <div key={app.id} className="flex justify-between items-center p-3 border rounded">
                                <div>
                                    <p className="font-medium">{app.job_title}</p>
                                    <p className="text-sm text-gray-600">{app.company_name}</p>
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
                <Icon size={24} className={`text-${color}-600`} />
            </div>
            <div className="ml-4">
                <p className="text-sm text-gray-600">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    </div>
);

export default Dashboard;