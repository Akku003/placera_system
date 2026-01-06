import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
};

// RESUME
export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getProfile: () => api.get('/resume/profile'),
};

// JOBS
export const jobsAPI = {
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (formData) => api.post('/jobs/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  apply: (jobId, data) => api.post(`/jobs/${jobId}/apply`, data),
  getMatchPreview: (jobId) => api.get(`/jobs/${jobId}/match-preview`),
  getMyApplications: () => api.get('/jobs/applications/me'),
  getJobApplications: (jobId, params) => api.get(`/jobs/${jobId}/applications`, { params }),
  updateApplicationStatus: (jobId, applicationId, data) =>
    api.patch(`/jobs/${jobId}/applications/${applicationId}/status`, data),
  bulkShortlist: (jobId, data) => api.post(`/jobs/${jobId}/bulk-shortlist`, data),
};

// DASHBOARD
export const dashboardAPI = {
  getStudentDashboard: () => api.get('/dashboard/student'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getJobAnalytics: (jobId) => api.get(`/dashboard/admin/job/${jobId}/analytics`),
};

// NOTIFICATIONS
export const notificationsAPI = {
  getAll: (unreadOnly = false) => api.get('/notifications', { 
    params: { unread_only: unreadOnly } 
  }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export default api;