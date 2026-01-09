// src/components/admin/ResumeViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ResumeViewer = ({ candidateId }) => {
  const [resumeUrl, setResumeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResume();
  }, [candidateId]);

  const fetchResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/resumes/view/${candidateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResumeUrl(response.data.resumeUrl);
    } catch (err) {
      setError('Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/resumes/download/${candidateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume_${candidateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Resume Preview</h3>
        <button
          onClick={downloadResume}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height: '800px' }}>
        <iframe
          src={`http://localhost:5000${resumeUrl}`}
          className="w-full h-full"
          title="Resume Preview"
        />
      </div>
    </div>
  );
};

export default ResumeViewer;