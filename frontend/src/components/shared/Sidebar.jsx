import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Users,
  Plus,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/jobs', icon: Briefcase, label: 'Browse Jobs' },
    { to: '/student/applications', icon: FileText, label: 'My Applications' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/jobs', icon: Briefcase, label: 'All Jobs' },
    { to: '/admin/create-job', icon: Plus, label: 'Create Job' },
    { to: '/admin/candidates', icon: Users, label: 'Candidates' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="lg:hidden p-4 flex justify-end border-b dark:border-gray-700">
            <button onClick={onClose} className="text-gray-600 dark:text-gray-400">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;