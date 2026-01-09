import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { TrendingUp, Mail, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ResumeViewer from './ResumeViewer';


const ViewApplications = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      const response = await jobsAPI.getJobApplications(jobId, { sort_by: 'ats_score' });
      setApplications(response.data.applications);
      if (response.data.applications.length > 0) {
        setJob({
          title: response.data.applications[0].job_title,
          company_name: response.data.applications[0].company_name
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await jobsAPI.updateApplicationStatus(jobId, applicationId, { status });
      toast.success(`Status updated to ${status}`);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const [viewingResume, setViewingResume] = useState(null);
  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">{job?.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{job?.company_name} - {applications.length} Applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold dark:text-white">
                      {app.candidate_name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                      <span className="flex items-center">
                        <Mail size={14} className="mr-1" />
                        {app.email}
                      </span>
                      <span>{app.branch}</span>
                      {app.cgpa && <span>CGPA: {app.cgpa}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end mb-2">
                    <TrendingUp size={20} className="text-primary-600 mr-2" />
                    <span className="text-2xl font-bold text-primary-600">
                      {Math.round(app.ats_score)}%
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                    app.status === 'shortlisted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                      app.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                    {app.status}
                  </span>
                </div>
              </div>

              {/* Match Details */}
              {app.match_report && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium dark:text-white mb-2">Match Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Skills Match</p>
                      <p className="font-semibold dark:text-white">{app.match_report.skills_score}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Profile</p>
                      <p className="font-semibold dark:text-white">{app.match_report.profile_score}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Academic</p>
                      <p className="font-semibold dark:text-white">{app.match_report.academic_score}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Eligible</p>
                      <p className="font-semibold dark:text-white">
                        {app.match_report.eligible ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStatus(app.id, 'shortlisted')}
                  disabled={app.status === 'shortlisted'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => updateStatus(app.id, 'rejected')}
                  disabled={app.status === 'rejected'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus(app.id, 'selected')}
                  disabled={app.status === 'selected'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Select
                </button>
                {/* NEW: View Resume Button */}
                <button
                  onClick={() => setViewingResume(app.user_id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                  title="View Resume"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Resume
                </button>
              </div>
            </div>
          ))}
          {viewingResume && (
            <ResumeViewer
              candidateId={viewingResume}
              onClose={() => setViewingResume(null)}
            />
          )}
        </div>
      )}
    </Layout>
  );
};

export default ViewApplications;