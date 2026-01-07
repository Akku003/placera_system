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
                {/* Placement Insights */}
                <div className="bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mt-6">
                    <h2 className="text-2xl font-bold mb-4">📊 Placement Insights</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
                            <div className="text-4xl font-bold mb-1">956+</div>
                            <div className="text-sm opacity-90">Students Placed</div>
                            <div className="text-xs opacity-75 mt-1">2020-2022</div>
                        </div>
                        <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
                            <div className="text-4xl font-bold mb-1">74+</div>
                            <div className="text-sm opacity-90">Companies Visit</div>
                            <div className="text-xs opacity-75 mt-1">Annually</div>
                        </div>
                        <div className="text-center p-4 bg-white/10 backdrop-blur rounded-lg">
                            <div className="text-4xl font-bold mb-1">79.8%</div>
                            <div className="text-sm opacity-90">Success Rate</div>
                            <div className="text-xs opacity-75 mt-1">Placement rate</div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold mb-3">🏆 Top Recruiting Companies:</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                'Accenture (119)', 'Infosys (118)', 'Cognizant (107)',
                                'DXC (55)', 'EY (49)', 'TCS (46)'
                            ].map((company) => (
                                <span
                                    key={company}
                                    className="px-3 py-1 bg-white/20 backdrop-blur text-xs rounded-full font-medium"
                                >
                                    {company}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-yellow-400/20 backdrop-blur rounded-lg p-4">
                        <p className="text-sm">
                            💡 <strong>Pro Tip:</strong> Companies like Accenture, Infosys, and Cognizant recruit
                            consistently every year. Focus on building skills they require for better chances!
                        </p>
                    </div>
                </div>
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