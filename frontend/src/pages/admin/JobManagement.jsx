import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { Plus, Edit, Eye, Briefcase, DollarSign, Users } from 'lucide-react';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getAll();
      setJobs(response.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Job Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all job postings</p>
        </div>
        <Link
          to="/admin/create-job"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Create Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Briefcase className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Jobs Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Start by creating your first job posting</p>
          <Link
            to="/admin/create-job"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} className="mr-2" />
            Create First Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <p className="text-primary-600 dark:text-primary-400 font-semibold mb-2">
                      {job.company_name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <DollarSign size={16} className="mr-1" />
                        ₹{job.package_lpa} LPA
                      </span>
                      <span className="flex items-center">
                        <Briefcase size={16} className="mr-1" />
                        {job.role}
                      </span>
                      <span className="flex items-center">
                        <Users size={16} className="mr-1" />
                        {job.application_count || 0} Applications
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/admin/jobs/${job.id}/applications`}
                      className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="View Applications"
                    >
                      <Eye size={20} />
                    </Link>
                    <Link
                      to={`/admin/jobs/${job.id}/edit`}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit Job"
                    >
                      <Edit size={20} />
                    </Link>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Eligibility */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.min_cgpa && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                      Min CGPA: {job.min_cgpa}
                    </span>
                  )}
                  {job.max_backlogs !== null && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs">
                      Max Backlogs: {job.max_backlogs}
                    </span>
                  )}
                  {job.allowed_branches && job.allowed_branches.length > 0 && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                      {job.allowed_branches.join(', ')}
                    </span>
                  )}
                </div>

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        +{job.skills.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default JobManagement;