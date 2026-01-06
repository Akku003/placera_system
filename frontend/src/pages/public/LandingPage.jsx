import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Briefcase, Users, TrendingUp, Award, Moon, Sun, Mail, Phone, MapPin } from 'lucide-react';
import Lottie from "lottie-react";
import bannerAnimation from "/public/student.json";

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="Placera" className="h-10" />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('about')} className="text-gray-700 dark:text-gray-300 hover:text-primary-600">
                About
              </button>
              <button onClick={() => scrollToSection('features')} className="text-gray-700 dark:text-gray-300 hover:text-primary-600">
                Features
              </button>
              <button onClick={() => scrollToSection('companies')} className="text-gray-700 dark:text-gray-300 hover:text-primary-600">
                For Companies
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 dark:text-gray-300 hover:text-primary-600">
                Contact
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
              </button>
              <Link to="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Smart Placement Management System
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Streamline your campus placement process with AI-powered ATS scoring, automated matching, and comprehensive analytics.
              </p>
              <div className="flex space-x-4">
                <Link to="/register" className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-semibold">
                  Get Started
                </Link>
                <button onClick={() => scrollToSection('features')} className="px-8 py-3 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-lg font-semibold">
                  Learn More
                </button>
              </div>
            </div>
            <div>
              {/* <img src="/banner_img.jpg" alt="Placement" className="rounded-lg shadow-2xl" /> */}
              <Lottie
                animationData={bannerAnimation}
                loop
                autoplay
                className="rounded-lg shadow-2xl max-w-md mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Everything you need for successful placements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Briefcase className="text-primary-600" size={40} />}
              title="ATS Resume Scoring"
              description="AI-powered resume analysis with skill matching and eligibility checking"
            />
            <FeatureCard
              icon={<Users className="text-green-600" size={40} />}
              title="Student Management"
              description="Comprehensive student profiles with placement tracking"
            />
            <FeatureCard
              icon={<TrendingUp className="text-blue-600" size={40} />}
              title="Analytics Dashboard"
              description="Real-time insights into placement statistics and trends"
            />
            <FeatureCard
              icon={<Award className="text-yellow-600" size={40} />}
              title="Smart Matching"
              description="Automatic job-candidate matching based on skills and eligibility"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">About Placera</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Placera is a modern campus placement management system designed to simplify and automate the entire placement process for educational institutions.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                With advanced ATS scoring, real-time analytics, and intelligent matching algorithms, we help placement officers make data-driven decisions while providing students with personalized job recommendations.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <StatBox number="1000+" label="Students Placed" />
                <StatBox number="500+" label="Companies" />
                <StatBox number="95%" label="Success Rate" />
                <StatBox number="24/7" label="Support" />
              </div>
            </div>
            <div className="bg-primary-100 dark:bg-primary-900/20 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Placera?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="dark:text-gray-300">Automated ATS resume screening</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="dark:text-gray-300">Real-time placement analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="dark:text-gray-300">Smart job-student matching</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="dark:text-gray-300">Comprehensive reporting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="dark:text-gray-300">Easy-to-use interface</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* For Companies Section */}
      <section id="companies" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">For Companies</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
            Post your job openings and find the best talent from top institutions
          </p>
          <Link
            to="/company/register"
            className="inline-block px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-semibold"
          >
            Register Your Company
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Get in touch with our team</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ContactCard
              icon={<Mail className="text-primary-600" size={32} />}
              title="Email"
              content="support@placera.com"
            />
            <ContactCard
              icon={<Phone className="text-green-600" size={32} />}
              title="Phone"
              content="+91 1234567890"
            />
            <ContactCard
              icon={<MapPin className="text-blue-600" size={32} />}
              title="Address"
              content="123 Campus Road, University District"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/logo.png" alt="Placera" className="h-10 mb-4" />
              <p className="text-gray-400">Smart placement management for modern institutions</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white">About</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
                <li><Link to="/register" className="hover:text-white">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Companies</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/company/register" className="hover:text-white">Register Company</Link></li>
                <li><button onClick={() => scrollToSection('companies')} className="hover:text-white">Post Jobs</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white">Contact</button></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Placera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const StatBox = ({ number, label }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{number}</div>
    <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);

const ContactCard = ({ icon, title, content }) => (
  <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{content}</p>
  </div>
);

export default LandingPage;