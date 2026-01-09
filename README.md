# 🎓 Placement Management System

A comprehensive placement management system for **LBS Institute of Technology for Women** with features for students, admins, and companies.

## ✨ Features

### For Students
- ✅ Resume Upload with ATS Scoring
- ✅ Job Applications & Tracking
- ✅ Eligibility Checking
- ✅ Placement Statistics Dashboard
- ✅ AI Chatbot Assistant
- ✅ Profile Management

### For Admins
- ✅ Candidate Management
- ✅ Job Posting & Management
- ✅ Application Tracking
- ✅ Resume Viewer
- ✅ Job Description Upload
- ✅ Bulk Operations
- ✅ Statistics & Analytics
- ✅ Data Export (Excel)

### For Companies (Future)
- ✅ Job Posting Portal
- ✅ Candidate Search
- ✅ Application Management

## 🏗️ Tech Stack

### Frontend
- React 18.3
- React Router 6
- Tailwind CSS
- Recharts (Data Visualization)
- Axios

### Backend
- Node.js 20.x
- Express.js 4.21
- PostgreSQL 14.x
- JWT Authentication
- Multer (File Upload)
- Natural (NLP for Resume Parsing)
- PDF-Parse / Tesseract.js (OCR)

### Additional Services
- Code Executor API (Docker-based)
- Redis Queue System

## 📋 Prerequisites

- Node.js 18.x or 20.x
- PostgreSQL 14.x or higher
- Redis (for code execution)
- Docker (for code execution sandbox)

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/Akku003/placera-system.git
cd placera-system
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb placement_system

# Or using psql:
psql -U postgres
CREATE DATABASE placement_system;
\q

# Run schema
psql -U postgres -d placement_system -f database/schema.sql

# (Optional) Load sample data
psql -U postgres -d placement_system -f database/seed.sql
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env
# Fill in your database credentials and secrets

# Create upload directories
mkdir -p uploads/resumes uploads/photos uploads/job-descriptions

# Start backend
npm start
# Backend runs on http://localhost:5000
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Default values work for local development

# Start frontend
npm start
# Frontend runs on http://localhost:3000
```

### 5. Code Executor Setup (Optional)

For coding assessment features:
```bash
# Follow setup instructions in code-executor repository
# https://github.com/Akku003/code-executer-api
```

## 🔐 Security Configuration

### Generate Secure Secrets
```bash
# Generate JWT secret (use in .env)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Important Security Notes

- Never commit `.env` file to Git
- Change default secrets in production
- Use HTTPS in production
- Implement rate limiting
- Regular security updates

## 📊 Database Schema

### Key Tables
- `users` - User accounts (students, admins)
- `candidates` - Student profiles
- `resumes` - Resume storage & parsing
- `jobs` - Job postings
- `applications` - Job applications
- `eligibility_criteria` - Job requirements
- `placement_statistics` - Historical data

See `database/schema.sql` for complete schema.

## 🧪 Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Resumes
```bash
POST /api/resumes/upload
GET  /api/resumes/view/:candidateId
GET  /api/resumes/download/:candidateId
```

### Jobs
```bash
GET  /api/jobs
POST /api/jobs (admin)
PUT  /api/jobs/:id (admin)
POST /api/jobs/upload-jd/:jobId (admin)
```

### Applications
```bash
POST /api/applications
GET  /api/applications/candidate/:candidateId
PUT  /api/applications/:id/status (admin)
```

For complete API documentation, see [API.md](docs/API.md)

## 🎨 Screenshots

[Add screenshots here]

## 📞 Contact Information

**Career Guidance & Placement Unit (CGPU)**

**Dr. Anilkumar E. N.**  
Training & Placement Officer (TPO)  
Professor and Head, Department of Mechanical Engineering

**LBS Institute of Technology for Women**  
Poojappura, Thiruvananthapuram  
Kerala - 695012

- 📱 Mobile: 9495838477
- ☎️ Office: 0471-2349262
- 🌐 Website: www.lbsitw.ac.in

## 👥 Team

- **Project Lead**: [Your Name]
- **Developers**: [Team Members]
- **Institution**: LBS Institute of Technology for Women

## 📄 License

This project is developed for **LBS Institute of Technology for Women** and is intended for educational and institutional use.

## 🤝 Contributing

This is an institutional project. For contributions or suggestions, please contact the development team.

## 📚 Additional Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [User Manual](docs/USER_MANUAL.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [API Documentation](docs/API.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---
