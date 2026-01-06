import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ApplyJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [atsPreview, setAtsPreview] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const [jobRes, matchRes] = await Promise.all([
        jobsAPI.getById(jobId),
        jobsAPI.getMatchPreview(jobId)
      ]);
      setJob(jobRes.data.job);
      setAtsPreview(matchRes.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      await jobsAPI.apply(jobId, { cover_letter: coverLetter });
      toast.success('Application submitted successfully!');
      navigate('/student/applications');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Application failed');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  if (!atsPreview?.match_report?.eligible) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-red-600 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-2">Not Eligible</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              You don't meet the eligibility criteria for this position
            </p>
            {atsPreview?.match_report?.eligibility_reasons && (
              <ul className="text-left text-sm text-red-700 dark:text-red-300 mb-4">
                {atsPreview.match_report.eligibility_reasons.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            )}
            <button
              onClick={() => navigate('/student/jobs')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold dark:text-white mb-2">Apply for {job?.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{job?.company_name}</p>

          {/* ATS Score Display */}
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold dark:text-white">Your ATS Match</h3>
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-primary-600">
                {Math.round(atsPreview.ats_score)}%
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">Excellent Match!</p>
            </div>

            {/* Missing Skills Warning */}
            {atsPreview.match_report.missing_skills?.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-900 dark:text-yellow-200 mb-2 font-medium">
                  💡 Tip: You're missing {atsPreview.match_report.missing_skills.length} skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {atsPreview.match_report.missing_skills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Application Form */}
          <form onSubmit={handleApply} className="space-y-6">
            <div>
              <label className="block text-sm font-medium dark:text-white mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                rows="8"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tell us why you're a great fit for this role..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/student/jobs')}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applying}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-semibold flex items-center justify-center"
              >
                {applying ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ApplyJob;