import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { jobsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Briefcase, DollarSign, MapPin, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

const BrowseJobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [atsPreview, setAtsPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await jobsAPI.getAll();
            setJobs(response.data.jobs);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJobClick = async (job) => {
        setSelectedJob(job);
        setAtsPreview(null);
        setPreviewLoading(true);

        try {
            const response = await jobsAPI.getMatchPreview(job.id);
            console.log('Raw API Response:', response.data);

            const data = response.data;

            // The data should already be in the right format from backend
            const fixedData = {
                ats_score: parseFloat(data.ats_score) || 0,
                match_report: {
                    skills_score: parseFloat(data.match_report?.skills_score) || 0,
                    profile_score: parseFloat(data.match_report?.profile_score) || 0,
                    academic_score: parseFloat(data.match_report?.academic_score) || 0,
                    eligible: data.match_report?.eligible || false,
                    matched_skills: data.match_report?.matched_skills || [],
                    missing_skills: data.match_report?.missing_skills || [],
                    total_required_skills: parseInt(data.match_report?.total_required_skills) || 0,
                    eligibility_reasons: data.match_report?.eligibility_reasons || []
                },
                job_details: data.job_details,
                already_applied: data.already_applied,
                can_apply: data.can_apply
            };

            console.log('Fixed ATS Data:', fixedData);
            setAtsPreview(fixedData);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to load ATS preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white">Browse Jobs</h1>
                <p className="text-gray-600 dark:text-gray-400">{jobs.length} opportunities available</p>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <Briefcase className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
                    <p className="text-gray-600 dark:text-gray-400">No jobs available at the moment</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Jobs List */}
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => handleJobClick(job)}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all cursor-pointer p-6 ${selectedJob?.id === job.id ? 'ring-2 ring-primary-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            {job.title}
                                        </h3>
                                        <p className="text-primary-600 dark:text-primary-400 font-semibold">
                                            {job.company_name}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
                                        ₹{job.package_lpa} LPA
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    <span className="flex items-center">
                                        <Briefcase size={14} className="mr-1" />
                                        {job.role}
                                    </span>
                                    <span className="flex items-center">
                                        <Clock size={14} className="mr-1" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Skills Preview */}
                                {job.skills && job.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.slice(0, 4).map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {job.skills.length > 4 && (
                                            <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                                                +{job.skills.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Job Details & ATS Preview */}
                    <div className="lg:sticky lg:top-6 h-fit">
                        {selectedJob ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                <h2 className="text-2xl font-bold dark:text-white mb-2">{selectedJob.title}</h2>
                                <p className="text-xl text-primary-600 dark:text-primary-400 font-semibold mb-4">
                                    {selectedJob.company_name}
                                </p>

                                {/* ATS Score */}
                                {previewLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="spinner"></div>
                                    </div>
                                ) : atsPreview && (
                                    <div className="mb-6">
                                        <div className={`p-6 rounded-lg ${atsPreview.match_report.eligible
                                            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
                                            }`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold dark:text-white">Your ATS Match</h3>
                                                {atsPreview.match_report.eligible ? (
                                                    <CheckCircle className="text-green-600" size={24} />
                                                ) : (
                                                    <AlertCircle className="text-red-600" size={24} />
                                                )}
                                            </div>

                                            <div className="text-center mb-4">
                                                <div className="text-5xl font-bold text-primary-600 mb-2">
                                                    {Math.round(atsPreview.ats_score)}%
                                                </div>
                                                <p className={`text-sm font-medium ${atsPreview.match_report.eligible
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-red-700 dark:text-red-300'
                                                    }`}>
                                                    {atsPreview.match_report.eligible ? 'You are eligible!' : 'Not eligible'}
                                                </p>
                                            </div>

                                            {/* Score Breakdown */}
                                            <div className="space-y-3 mb-4">
                                                <ScoreBar
                                                    label="Skills Match"
                                                    score={atsPreview.match_report.skills_score}
                                                    matched={atsPreview.match_report.matched_skills?.length || 0}
                                                    total={atsPreview.match_report.total_required_skills || 0}
                                                />
                                                <ScoreBar
                                                    label="Profile Completeness"
                                                    score={atsPreview.match_report.profile_score}
                                                />
                                                <ScoreBar
                                                    label="Academic Performance"
                                                    score={atsPreview.match_report.academic_score}
                                                />
                                            </div>

                                            {/* Missing Skills */}
                                            {atsPreview.match_report.missing_skills?.length > 0 && (
                                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center">
                                                        <AlertCircle size={16} className="mr-2" />
                                                        Missing Skills ({atsPreview.match_report.missing_skills.length})
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {atsPreview.match_report.missing_skills.map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded text-xs"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                                                        💡 Update your resume to include these skills to improve your match score
                                                    </p>
                                                </div>
                                            )}

                                            {/* Eligibility Issues */}
                                            {!atsPreview.match_report.eligible && atsPreview.match_report.eligibility_reasons && (
                                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                                                        Eligibility Issues:
                                                    </h4>
                                                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                                        {atsPreview.match_report.eligibility_reasons.map((reason, idx) => (
                                                            <li key={idx}>• {reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {atsPreview.match_report.eligible && (
                                                <button
                                                    onClick={() => navigate(`/student/jobs/${selectedJob.id}/apply`)}
                                                    className="w-full mt-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                                                >
                                                    Apply Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Job Description */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold dark:text-white mb-2">About the Role</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {selectedJob.description}
                                        </p>
                                    </div>

                                    {/* Eligibility */}
                                    <div>
                                        <h4 className="font-semibold dark:text-white mb-2">Eligibility Criteria</h4>
                                        <div className="space-y-2 text-sm">
                                            {selectedJob.min_cgpa && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                    <CheckCircle size={16} className="mr-2 text-green-600" />
                                                    Minimum CGPA: {selectedJob.min_cgpa}
                                                </div>
                                            )}
                                            {selectedJob.max_backlogs !== null && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                    <CheckCircle size={16} className="mr-2 text-green-600" />
                                                    Maximum Backlogs: {selectedJob.max_backlogs}
                                                </div>
                                            )}
                                            {selectedJob.allowed_branches?.length > 0 && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                    <CheckCircle size={16} className="mr-2 text-green-600" />
                                                    Branches: {selectedJob.allowed_branches.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Required Skills */}
                                    {selectedJob.skills?.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold dark:text-white mb-2">Required Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedJob.skills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                                <TrendingUp className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={64} />
                                <p className="text-gray-600 dark:text-gray-400">Select a job to see your ATS match score</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

const ScoreBar = ({ label, score, matched, total }) => (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="dark:text-white">{label}</span>
            <span className="font-semibold dark:text-white">
                {Math.round(score)}%
                {matched !== undefined && ` (${matched}/${total})`}
            </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
                className={`h-2 rounded-full transition-all ${score >= 70 ? 'bg-green-600' : score >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                style={{ width: `${score}%` }}
            ></div>
        </div>
    </div>
);

export default BrowseJobs;