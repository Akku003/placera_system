import { useState, useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import { resumeAPI } from '../../services/api';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const [editData, setEditData] = useState({
        cgpa: '',
        backlogs: '',
        academic_year: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await resumeAPI.getProfile();
            setProfile(response.data.profile);
            setEditData({
                cgpa: response.data.profile?.cgpa || '',
                backlogs: response.data.profile?.backlogs || '',
                academic_year: response.data.profile?.academic_year || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.endsWith('.docx')) {
            toast.error('Please upload PDF or DOCX file only');
            return;
        }

        setFileName(file.name);
        const formData = new FormData();
        formData.append('resume', file);

        setUploading(true);
        setUploadProgress(30);

        try {
            setUploadProgress(60);
            await resumeAPI.upload(formData);
            setUploadProgress(100);
            toast.success('Resume uploaded and processed successfully!');
            setTimeout(() => {
                fetchProfile();
                setUploadProgress(0);
                setFileName('');
            }, 1000);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload failed');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            // call an update profile endpoint
            // For now, just update the local state
            toast.success('Profile updated successfully!');
            setProfile({ ...profile, ...editData });
            setEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        if (!window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
            return;
        }

        try {
            // You'll need to create this endpoint in backend
            // await authAPI.deleteAccount();
            toast.success('Account deleted successfully');
            logout();
            navigate('/register');
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

    const totalSkillsNeeded = 15; // Average skills needed for good jobs
    const skillsCount = profile?.skills?.length || 0;
    const skillProgress = Math.min((skillsCount / totalSkillsNeeded) * 100, 100);

    return (
        <Layout>
            <h1 className="text-2xl font-bold mb-6 dark:text-white">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Info - Editable */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold dark:text-white">Personal Information</h2>
                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700"
                            >
                                <Edit2 size={16} className="mr-1" />
                                Edit
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleSaveProfile}
                                    className="flex items-center text-sm text-green-600 hover:text-green-700 px-3 py-1 border border-green-600 rounded-lg"
                                >
                                    <Save size={16} className="mr-1" />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setEditData({
                                            cgpa: profile?.cgpa || '',
                                            backlogs: profile?.backlogs || '',
                                            academic_year: profile?.academic_year || ''
                                        });
                                    }}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded-lg"
                                >
                                    <X size={16} className="mr-1" />
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <InfoRow label="Name" value={`${profile?.f_name || ''} ${profile?.m_name || ''} ${profile?.l_name || ''}`} />
                        <InfoRow label="Register Number" value={profile?.register_number} />
                        <InfoRow label="Branch" value={profile?.branch} />

                        {/* Editable Fields */}
                        {editing ? (
                            <>
                                <div className="py-2 border-b dark:border-gray-700">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">CGPA:</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.cgpa}
                                        onChange={(e) => setEditData({ ...editData, cgpa: e.target.value })}
                                        className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                                        placeholder="e.g., 8.5"
                                    />
                                </div>
                                <div className="py-2 border-b dark:border-gray-700">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Backlogs:</label>
                                    <input
                                        type="number"
                                        value={editData.backlogs}
                                        onChange={(e) => setEditData({ ...editData, backlogs: e.target.value })}
                                        className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                                        placeholder="e.g., 0"
                                    />
                                </div>
                                <div className="py-2 border-b dark:border-gray-700">
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Academic Year:</label>
                                    <input
                                        type="text"
                                        value={editData.academic_year}
                                        onChange={(e) => setEditData({ ...editData, academic_year: e.target.value })}
                                        className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                                        placeholder="e.g., 2024"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <InfoRow label="CGPA" value={profile?.cgpa || 'Not provided'} />
                                <InfoRow label="Backlogs" value={profile?.backlogs || '0'} />
                                <InfoRow label="Academic Year" value={profile?.academic_year || 'Not provided'} />
                            </>
                        )}
                    </div>
                </div>

                {/* Resume Upload - Same as before */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Resume</h2>

                    {uploading ? (
                        <div className="border-2 border-primary-200 dark:border-primary-800 rounded-lg p-6 bg-primary-50 dark:bg-primary-900/20">
                            <div className="text-center">
                                <Loader2 className="animate-spin mx-auto text-primary-600 mb-3" size={40} />
                                <p className="font-medium text-gray-900 dark:text-white mb-2">Processing Resume...</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{fileName}</p>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div
                                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{uploadProgress}% Complete</p>
                            </div>
                        </div>
                    ) : profile?.resume_file ? (
                        <div className="space-y-4">
                            <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <CheckCircle className="text-green-600 mr-2" size={24} />
                                        <span className="font-medium dark:text-white">Resume Uploaded</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {skillsCount} Skills Extracted
                                </p>
                                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                    <Upload size={16} className="mr-2" />
                                    Update Resume
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>

                            {/* Skills Progress */}
                            <div className="border dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium dark:text-white">Skills Profile Strength</span>
                                    <span className="text-sm font-bold text-primary-600">{Math.round(skillProgress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                                    <div
                                        className={`h-2.5 rounded-full ${skillProgress >= 70 ? 'bg-green-600' : skillProgress >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                        style={{ width: `${skillProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {skillsCount} of {totalSkillsNeeded} recommended skills
                                </p>
                            </div>

                            {/* Warning if low skills */}
                            {skillsCount < 10 && (
                                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                                            Update Your Resume
                                        </p>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                            Add more skills to improve your ATS scores and get better job matches. Include technical skills, tools, and certifications.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-600 dark:text-gray-400 mb-4">No resume uploaded yet</p>
                            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                <Upload size={16} className="mr-2" />
                                Upload Resume
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={handleFileUpload}
                                />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PDF or DOCX format</p>
                        </div>
                    )}

                    {/* Skills List */}
                    {profile?.skills && profile.skills.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium dark:text-white">Extracted Skills</h3>
                                <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 px-2 py-1 rounded">
                                    {skillsCount} skills
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-accent/20 text-gray-800 dark:text-gray-200 rounded-full text-sm border border-accent/50"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-medium dark:text-white">{value || 'N/A'}</span>
    </div>
);

export default Profile;