import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, ChevronLeft, ExternalLink, Search } from 'lucide-react';
import { chatbotAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState('main');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [questionType, setQuestionType] = useState('all');
  const [syllabusCategory, setSyllabusCategory] = useState('all');

  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Play notification sound
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load companies and jobs on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesRes, jobsRes] = await Promise.all([
          chatbotAPI.getCompanies(),
          chatbotAPI.getJobs()
        ]);
        setCompanies(companiesRes.data.companies || []);
        setJobs(jobsRes.data.jobs || []);
      } catch (error) {
        console.error('Failed to load chatbot data:', error);
      }
    };
    loadData();
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    playSound();
    if (messages.length === 0) {
      addMessage('bot', 'Hello! 👋 I\'m your placement assistant. How can I help you today?', 'text');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const addMessage = (sender, content, type = 'text', data = null) => {
    setMessages(prev => [...prev, { 
      sender, 
      content, 
      type, 
      data,
      timestamp: new Date() 
    }]);
  };

  const goBack = () => {
    setCurrentMenu('main');
    setSelectedJob(null);
    setSelectedCompany(null);
    addMessage('bot', 'Back to main menu. What would you like to do?');
  };

  // Menu Handlers
  const handleMenuSelect = (option) => {
    switch (option) {
      case 'eligibility':
        setCurrentMenu('eligibility');
        addMessage('user', 'Check Eligibility');
        addMessage('bot', 'Please select a job to check your eligibility:', 'job-select');
        break;
      
      case 'interview':
        setCurrentMenu('interview');
        addMessage('user', 'Interview Preparation');
        addMessage('bot', 'Select a company and question type:', 'interview-select');
        break;
      
      case 'syllabus':
        setCurrentMenu('syllabus');
        addMessage('user', 'Aptitude & Coding Syllabus');
        addMessage('bot', 'Select a category:', 'syllabus-select');
        break;
      
      case 'company':
        setCurrentMenu('company');
        addMessage('user', 'Company Details');
        addMessage('bot', 'Select a company:', 'company-select');
        break;
    }
  };

  const checkEligibility = async (jobId) => {
    setLoading(true);
    setSelectedJob(jobId);
    
    try {
      const response = await chatbotAPI.checkEligibility(jobId);
      const data = response.data;

      if (data.success) {
        const job = jobs.find(j => j.id === parseInt(jobId));
        addMessage('user', `Check eligibility for ${job?.title || 'job'} at ${job?.company_name || 'company'}`);
        
        let message = `**${data.job.company}** - ${data.job.title}\n\n`;
        message += `${data.recommendation}\n\n`;
        message += data.issues.join('\n');
        
        addMessage('bot', message, 'eligibility-result');
      } else {
        addMessage('bot', data.message);
      }
    } catch (error) {
      toast.error('Failed to check eligibility');
      addMessage('bot', 'Sorry, I couldn\'t check your eligibility. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInterviewQuestions = async () => {
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    setLoading(true);
    
    try {
      const response = await chatbotAPI.getInterviewQuestions(selectedCompany, questionType);
      const data = response.data;

      if (data.success && data.questions.length > 0) {
        addMessage('user', `Show ${questionType} questions for ${selectedCompany}`);
        addMessage('bot', `Here are ${data.count} interview questions:`, 'questions-list', { questions: data.questions });
      } else {
        addMessage('bot', 'No questions found. Would you like to search Google?', 'google-search', {
          query: `${selectedCompany} interview questions ${questionType}`
        });
      }
    } catch (error) {
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const getSyllabus = async () => {
    setLoading(true);
    
    try {
      const response = await chatbotAPI.getSyllabus(syllabusCategory);
      const data = response.data;

      if (data.success) {
        addMessage('user', `Show ${syllabusCategory} syllabus`);
        addMessage('bot', 'Here are the topics:', 'syllabus-list', { topics: data.topics });
      }
    } catch (error) {
      toast.error('Failed to fetch syllabus');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyDetails = async () => {
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    setLoading(true);
    
    try {
      const response = await chatbotAPI.getCompanyDetails(selectedCompany);
      const data = response.data;

      addMessage('user', `Show details for ${selectedCompany}`);

      if (data.source === 'database') {
        addMessage('bot', 'Here are the company details:', 'company-details', { company: data.company });
      } else {
        addMessage('bot', data.message, 'google-search', { query: data.searchQuery });
      }
    } catch (error) {
      toast.error('Failed to fetch company details');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleSearch = (query) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    addMessage('bot', '🔍 Opened Google search in new tab!');
  };

  return (
    <>
      {/* Audio element */}
      <audio ref={audioRef} src="../public/sounds/pop-up.mp3" preload="auto" />

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50 animate-pulse"
          aria-label="Open chatbot"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 animate-slideIn">
          {/* Header */}
          <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentMenu !== 'main' && (
                <button onClick={goBack} className="p-1 hover:bg-primary-700 rounded">
                  <ChevronLeft size={20} />
                </button>
              )}
              <MessageCircle size={24} />
              <span className="font-semibold">Placement Assistant</span>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-primary-700 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg}
                jobs={jobs}
                companies={companies}
                selectedJob={selectedJob}
                selectedCompany={selectedCompany}
                setSelectedJob={setSelectedJob}
                setSelectedCompany={setSelectedCompany}
                questionType={questionType}
                setQuestionType={setQuestionType}
                syllabusCategory={syllabusCategory}
                setSyllabusCategory={setSyllabusCategory}
                checkEligibility={checkEligibility}
                getInterviewQuestions={getInterviewQuestions}
                getSyllabus={getSyllabus}
                getCompanyDetails={getCompanyDetails}
                openGoogleSearch={openGoogleSearch}
              />
            ))}
            {loading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Menu Buttons */}
          {currentMenu === 'main' && (
            <div className="p-4 border-t dark:border-gray-700 space-y-2 bg-white dark:bg-gray-800">
              <MenuButton 
                onClick={() => handleMenuSelect('eligibility')}
                text="📋 Check Eligibility"
              />
              <MenuButton 
                onClick={() => handleMenuSelect('interview')}
                text="💼 Interview Preparation"
              />
              <MenuButton 
                onClick={() => handleMenuSelect('syllabus')}
                text="📚 Aptitude & Coding Syllabus"
              />
              <MenuButton 
                onClick={() => handleMenuSelect('company')}
                text="🏢 Company Details"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Menu Button Component
const MenuButton = ({ onClick, text }) => (
  <button
    onClick={onClick}
    className="w-full p-3 bg-primary-50 dark:bg-gray-700 hover:bg-primary-100 dark:hover:bg-gray-600 rounded-lg text-left font-medium text-primary-700 dark:text-primary-400 transition-colors"
  >
    {text}
  </button>
);

// Message Bubble Component
const MessageBubble = ({ 
  message, 
  jobs, 
  companies,
  selectedJob,
  selectedCompany,
  setSelectedJob,
  setSelectedCompany,
  questionType,
  setQuestionType,
  syllabusCategory,
  setSyllabusCategory,
  checkEligibility,
  getInterviewQuestions,
  getSyllabus,
  getCompanyDetails,
  openGoogleSearch
}) => {
  const isBot = message.sender === 'bot';

  // Main text message
  if (message.type === 'text') {
    return (
      <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[80%] p-3 rounded-lg ${
          isBot 
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' 
            : 'bg-primary-600 text-white'
        }`}>
          <p className="whitespace-pre-line text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  // Job selection dropdown
  if (message.type === 'job-select') {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
        <select
          value={selectedJob || ''}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg mb-2"
        >
          <option value="">Select a job...</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.company_name} - {job.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => selectedJob && checkEligibility(selectedJob)}
          disabled={!selectedJob}
          className="w-full bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Eligibility
        </button>
      </div>
    );
  }

  // Interview questions selection
  if (message.type === 'interview-select') {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
        
        <select
          value={selectedCompany || ''}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
        >
          <option value="">Select company...</option>
          <option value="All Companies">All Companies</option>
          {companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>

        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="technical">Technical</option>
          <option value="behavioral">Behavioral</option>
          <option value="aptitude">Aptitude</option>
        </select>

        <button
          onClick={getInterviewQuestions}
          disabled={!selectedCompany}
          className="w-full bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Questions
        </button>
      </div>
    );
  }

  // Syllabus selection
  if (message.type === 'syllabus-select') {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
        
        <select
          value={syllabusCategory}
          onChange={(e) => setSyllabusCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="aptitude">Aptitude</option>
          <option value="coding">Coding</option>
          <option value="technical">Technical</option>
        </select>

        <button
          onClick={getSyllabus}
          className="w-full bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
        >
          Show Syllabus
        </button>
      </div>
    );
  }

  // Company selection
  if (message.type === 'company-select') {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
        
        <select
          value={selectedCompany || ''}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
        >
          <option value="">Select company...</option>
          {companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>

        <button
          onClick={getCompanyDetails}
          disabled={!selectedCompany}
          className="w-full bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Show Details
        </button>
      </div>
    );
  }

  // Eligibility result
  if (message.type === 'eligibility-result') {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="whitespace-pre-line text-sm dark:text-gray-300">{message.content}</p>
      </div>
    );
  }

  // Questions list
  if (message.type === 'questions-list' && message.data?.questions) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="mb-3 font-medium dark:text-white">{message.content}</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {message.data.questions.map((q, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded border-l-4 border-primary-600">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase">{q.question_type}</span>
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">{q.difficulty}</span>
              </div>
              <p className="text-sm dark:text-gray-200 mb-2">{q.question}</p>
              {q.company_name && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Company: {q.company_name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Syllabus list
  if (message.type === 'syllabus-list' && message.data?.topics) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="mb-3 font-medium dark:text-white">{message.content}</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {message.data.topics.map((topic, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold dark:text-white">{topic.topic_name}</h4>
                <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                  {topic.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{topic.description}</p>
              {topic.subtopics && (
                <div className="mb-2">
                  <p className="text-xs font-medium mb-1 dark:text-gray-300">Topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {topic.subtopics.map((sub, i) => (
                      <span key={i} className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-2 py-1 rounded">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {topic.resources && topic.resources.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1 dark:text-gray-300">Resources:</p>
                  <div className="space-y-1">
                    {topic.resources.map((resource, i) => (
                      <a
                        key={i}
                        href={resource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Resource {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Company details
  if (message.type === 'company-details' && message.data?.company) {
    const company = message.data.company;
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="mb-3 font-medium dark:text-white">{message.content}</p>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-3">
          <h3 className="text-lg font-bold dark:text-white">{company.company_name}</h3>
          
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Package Range</p>
            <p className="text-sm dark:text-gray-200">{company.package_range}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Work Culture</p>
            <p className="text-sm dark:text-gray-200">{company.work_culture}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Process</p>
            <p className="text-sm dark:text-gray-200">{company.application_process}</p>
          </div>

          {company.interview_rounds && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interview Rounds</p>
              <ul className="text-sm list-disc list-inside dark:text-gray-200">
                {company.interview_rounds.map((round, i) => (
                  <li key={i}>{round}</li>
                ))}
              </ul>
            </div>
          )}

          {company.tech_stack && (
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tech Stack</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {company.tech_stack.map((tech, i) => (
                  <span key={i} className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hiring Criteria</p>
            <p className="text-sm dark:text-gray-200">{company.hiring_criteria}</p>
          </div>
        </div>
      </div>
    );
  }

  // Google search button
  if (message.type === 'google-search' && message.data?.query) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="mb-3 text-sm dark:text-gray-300">{message.content}</p>
        <button
          onClick={() => openGoogleSearch(message.data.query)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full justify-center"
        >
          <Search size={16} />
          Search on Google
        </button>
      </div>
    );
  }

  return null;
};

export default Chatbot;