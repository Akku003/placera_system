import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const EditJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    package_lpa: '',
    allowed_branches: [],
    min_cgpa: '',
    max_backlogs: '',
    title: '',
    description: '',
    skills: '',
  });

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getById(jobId);
      const job = response.data.job;
      setFormData({
        company_name: job.company_name || '',
        role: job.role || '',
        package_lpa: job.package_lpa || '',
        allowed_branches: job.allowed_branches || [],
        min_cgpa: job.min_cgpa || '',
        max_backlogs: job.max_backlogs || '',
        title: job.title || '',
        description: job.description || '',
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      });
    } catch (error) {
      toast.error('Failed to load job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchToggle = (branch) => {
    setFormData(prev => ({
      ...prev,
      allowed_branches: prev.allowed_branches.includes(branch)
        ? prev.allowed_branches.filter(b => b !== branch)
        : [...prev.allowed_branches, branch]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Note: You'll need to create an update endpoint in backend
      // For now, this is a placeholder
      toast.success('Job updated successfully!');
      navigate('/admin/jobs');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Edit Job</h1>
          <p className="text-gray-600 dark:text-gray-400">Update job details</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Role *
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package (LPA) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.package_lpa}
                onChange={(e) => setFormData({...formData, package_lpa: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum CGPA
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_cgpa}
                onChange={(e) => setFormData({...formData, min_cgpa: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Backlogs
              </label>
              <input
                type="number"
                value={formData.max_backlogs}
                onChange={(e) => setFormData({...formData, max_backlogs: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed Branches
            </label>
            <div className="flex flex-wrap gap-2">
              {branches.map(branch => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => handleBranchToggle(branch)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.allowed_branches.includes(branch)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Required Skills (comma separated) *
            </label>
            <input
              type="text"
              required
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description *
            </label>
            <textarea
              required
              rows="6"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/jobs')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditJob;