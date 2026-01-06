import { useState, useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await jobsAPI.getMyApplications();
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  const filteredApps = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold dark:text-white mb-6">My Applications</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} color="blue" active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatCard label="Pending" value={stats.pending} color="yellow" active={filter === 'pending'} onClick={() => setFilter('pending')} />
        <StatCard label="Shortlisted" value={stats.shortlisted} color="blue" active={filter === 'shortlisted'} onClick={() => setFilter('shortlisted')} />
        <StatCard label="Selected" value={stats.selected} color="green" active={filter === 'selected'} onClick={() => setFilter('selected')} />
        <StatCard label="Rejected" value={stats.rejected} color="red" active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
      </div>

      {/* Applications */}
      {filteredApps.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold dark:text-white mb-1">{app.job_title}</h3>
                  <p className="text-primary-600 dark:text-primary-400 font-semibold mb-2">{app.company_name}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp size={14} className="mr-1" />
                      {Math.round(app.ats_score)}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {Math.round(app.ats_score)}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ATS Score</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </div>

              {app.notes && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Admin Notes:</strong> {app.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

const StatCard = ({ label, value, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-lg text-center transition-all ${
      active 
        ? `bg-${color}-100 dark:bg-${color}-900/30 border-2 border-${color}-500` 
        : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
    }`}
  >
    <div className={`text-2xl font-bold ${active ? `text-${color}-600` : 'dark:text-white'}`}>
      {value}
    </div>
    <div className={`text-sm ${active ? `text-${color}-600` : 'text-gray-600 dark:text-gray-400'}`}>
      {label}
    </div>
  </button>
);

const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: Clock, bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
    shortlisted: { icon: CheckCircle, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
    rejected: { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
    selected: { icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
  };

  const { icon: Icon, bg, text } = config[status] || config.pending;

  return (
    <div className={`px-3 py-1 ${bg} ${text} rounded-full text-xs font-medium flex items-center`}>
      <Icon size={14} className="mr-1" />
      {status}
    </div>
  );
};

export default MyApplications;