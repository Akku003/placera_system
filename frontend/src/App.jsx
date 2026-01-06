import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminRegister from './pages/auth/AdminRegister';

// Student
import StudentDashboard from './pages/student/Dashboard';
import BrowseJobs from './pages/student/BrowseJobs';
import MyApplications from './pages/student/MyApplications';
import StudentProfile from './pages/student/Profile';
import ApplyJob from './pages/student/ApplyJob';


// Admin
import AdminDashboard from './pages/admin/Dashboard';
import JobManagement from './pages/admin/JobManagement';
import CreateJob from './pages/admin/CreateJob';
import ViewApplications from './pages/admin/ViewApplications';
import Candidates from './pages/admin/Candidates';
import EditJob from './pages/admin/EditJob';

//landing page and company reg form
import LandingPage from './pages/public/LandingPage';
import CompanyRegister from './pages/public/CompanyRegister';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/*Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/register" element={<AdminRegister />} />

            {/* student routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/jobs" element={<ProtectedRoute><BrowseJobs /></ProtectedRoute>} />
            <Route path="/student/jobs/:jobId/apply" element={<ProtectedRoute><ApplyJob /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />

            {/* admin routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/jobs" element={<ProtectedRoute requireAdmin><JobManagement /></ProtectedRoute>} />
            <Route path="/admin/create-job" element={<ProtectedRoute requireAdmin><CreateJob /></ProtectedRoute>} />
            <Route path="/admin/jobs/:jobId/applications" element={<ProtectedRoute requireAdmin><ViewApplications /></ProtectedRoute>} />
            <Route path="/admin/candidates" element={<ProtectedRoute requireAdmin><Candidates /></ProtectedRoute>} />
            <Route path="/admin/jobs/:jobId/edit" element={<ProtectedRoute requireAdmin><EditJob /></ProtectedRoute>} />

            {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
            <Route path="/" element={<LandingPage />} />  {/* Change this */}
            <Route path="/company/register" element={<CompanyRegister />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;