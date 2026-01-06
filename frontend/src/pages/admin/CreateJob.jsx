import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { Briefcase, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const [jdFile, setJdFile] = useState(null);

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

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
    
    if (!jdFile) {
      toast.error('Please upload Job Description PDF');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('company_name', formData.company_name);
      submitData.append('role', formData.role);
      submitData.append('package_lpa', formData.package_lpa);
      submitData.append('allowed_branches', JSON.stringify(formData.allowed_branches));
      submitData.append('min_cgpa', formData.min_cgpa || '0');
      submitData.append('max_backlogs', formData.max_backlogs || '0');
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('skills', formData.skills);
      submitData.append('jd', jdFile);

      await jobsAPI.create(submitData);
      toast.success('Job created successfully!');
      navigate('/admin/jobs');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Create New Job</h1>
          <p className="text-gray-600 dark:text-gray-400">Post a new job opportunity</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          {/* Company Info */}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Google"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Software Engineer"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 12.5"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Full Stack Developer"
              />
            </div>
          </div>

          {/* Eligibility */}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 7.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Backlogs Allowed
              </label>
              <input
                type="number"
                value={formData.max_backlogs}
                onChange={(e) => setFormData({...formData, max_backlogs: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 0"
              />
            </div>
          </div>

          {/* Allowed Branches */}
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
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Required Skills (comma separated) *
            </label>
            <input
              type="text"
              required
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Python, React, Node.js, AWS"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description *
            </label>
            <textarea
              required
              rows="6"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the role, responsibilities, and requirements..."
            />
          </div>

          {/* JD Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Description PDF *
            </label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Upload size={16} className="mr-2" />
                {jdFile ? jdFile.name : 'Upload PDF'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => setJdFile(e.target.files[0])}
                />
              </label>
              {jdFile && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <Briefcase size={16} className="mr-1" />
                  File selected
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
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
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateJob;