const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const JDParser = require('../parsers/jdParser');
const ATSScorer = require('../utils/atsScorer');
const { createNotification } = require('./notifications');

// Configure multer for JD upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/jds';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'jd-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files allowed for JD!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Create job (Admin only)
router.post('/create', authenticateToken, isAdmin, upload.single('jd_file'), async (req, res) => {
  try {
    const { title, company_name, description } = req.body;

    // Validate required fields
    if (!title || !company_name) {
      return res.status(400).json({ error: 'Title and company name are required' });
    }

    // Get or create company
    let companyResult = await pool.query('SELECT id FROM companies WHERE name = $1', [company_name]);
    let company_id;

    if (companyResult.rows.length === 0) {
      const newCompany = await pool.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [company_name]
      );
      company_id = newCompany.rows[0].id;
      console.log(`✅ Created new company: ${company_name}`);
    } else {
      company_id = companyResult.rows[0].id;
    }

    let parsedJD = {
      skills: [],
      min_cgpa: null,
      max_backlogs: null,
      allowed_branches: null,
      package_lpa: null
    };

    // Parse JD file if uploaded
    if (req.file) {
      console.log('📄 JD file uploaded:', req.file.filename);
      const jdParser = new JDParser();
      parsedJD = await jdParser.parseJD(req.file.path);
    }

    // Manual overrides from request body (if provided)
    const skills = req.body.skills ? JSON.parse(req.body.skills) : parsedJD.skills;
    const min_cgpa = req.body.min_cgpa ? parseFloat(req.body.min_cgpa) : parsedJD.min_cgpa;
    const max_backlogs = req.body.max_backlogs !== undefined ? parseInt(req.body.max_backlogs) : parsedJD.max_backlogs;
    const allowed_branches = req.body.allowed_branches ? JSON.parse(req.body.allowed_branches) : parsedJD.allowed_branches;
    const package_lpa = req.body.package_lpa ? parseFloat(req.body.package_lpa) : parsedJD.package_lpa;

    // Create job
    const jobQuery = `
      INSERT INTO jobs 
      (title, description, skills, company_id, package_lpa, min_cgpa, max_backlogs, allowed_branches, jd_file_path, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const jobResult = await pool.query(jobQuery, [
      title,
      description || parsedJD.description,
      skills,
      company_id,
      package_lpa,
      min_cgpa,
      max_backlogs,
      allowed_branches,
      req.file ? req.file.path : null,
      req.user.id
    ]);

    // Store company JD skills
    if (skills && skills.length > 0) {
      for (let skill of skills) {
        await pool.query(
          'INSERT INTO company_jd_skills (company_id, skill) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [company_id, skill]
        );
      }
      console.log(`✅ Stored ${skills.length} skills for company`);
    }

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: jobResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Job creation error:', error);
    res.status(500).json({
      error: 'Failed to create job',
      details: error.message
    });
  }
});

// Get all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*, c.name as company_name 
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY j.created_at DESC
    `);

    res.json({
      success: true,
      jobs: result.rows
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT j.*, c.name as company_name 
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      job: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});


// Apply to a job
router.post('/:id/apply', authenticateToken, async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists
    const jobResult = await pool.query(`
      SELECT j.*, c.name as company_name 
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    // Check if already applied
    const existingApplication = await pool.query(
      'SELECT * FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [jobId, userId]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({
        error: 'You have already applied to this job',
        application: existingApplication.rows[0]
      });
    }

    // Get candidate profile and skills
    const profileResult = await pool.query(
      'SELECT * FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Please complete your profile before applying',
        message: 'Upload your resume to create a profile'
      });
    }

    const profile = profileResult.rows[0];

    // Get candidate skills
    const skillsResult = await pool.query(
      'SELECT skill FROM candidate_skills WHERE user_id = $1',
      [userId]
    );
    const candidateSkills = skillsResult.rows.map(row => row.skill);

    // Calculate ATS score
    const atsScorer = new ATSScorer();
    const matchReport = atsScorer.calculateJobMatch(profile, candidateSkills, job);

    // Check eligibility
    if (!matchReport.eligible) {
      return res.status(400).json({
        error: 'You do not meet the eligibility criteria for this job',
        eligibility_checks: matchReport.eligibility_checks,
        recommendations: matchReport.recommendations
      });
    }

    // Create application
    const coverLetter = req.body.cover_letter || null;
    const applicationResult = await pool.query(`
      INSERT INTO job_applications 
      (job_id, user_id, ats_score, status, cover_letter)
      VALUES ($1, $2, $3, 'pending', $4)
      RETURNING *
    `, [jobId, userId, matchReport.overall_score, coverLetter]);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: applicationResult.rows[0],
      ats_report: matchReport
    });

  } catch (error) {
    console.error('❌ Application error:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      details: error.message
    });
  }
});

// Get user's applications
router.get('/applications/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        ja.*,
        j.title as job_title,
        j.description as job_description,
        j.package_lpa,
        c.name as company_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE ja.user_id = $1
      ORDER BY ja.applied_at DESC
    `, [userId]);

    res.json({
      success: true,
      applications: result.rows,
      total_count: result.rows.length,
      status_summary: {
        pending: result.rows.filter(a => a.status === 'pending').length,
        shortlisted: result.rows.filter(a => a.status === 'shortlisted').length,
        rejected: result.rows.filter(a => a.status === 'rejected').length
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get applications for a job (Admin only)
router.get('/:id/applications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { status, min_score, sort_by = 'ats_score', order = 'DESC' } = req.query;

    let query = `
      SELECT 
        ja.*,
        cp.f_name,
        cp.l_name,
       u.email,
        cp.register_number,
        cp.cgpa,
        cp.branch,
        cp.academic_year,
        cp.backlogs,
        (
          SELECT json_agg(cs.skill)
          FROM candidate_skills cs
          WHERE cs.user_id = ja.user_id
        ) as skills
      FROM job_applications ja
  JOIN users u ON ja.user_id = u.id                      
  JOIN candidate_profiles cp ON ja.user_id = cp.user_id
  WHERE ja.job_id = $1
`;

    const params = [jobId];
    let paramIndex = 2;

    // Filter by status
    if (status) {
      query += ` AND ja.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filter by minimum ATS score
    if (min_score) {
      query += ` AND ja.ats_score >= $${paramIndex}`;
      params.push(parseFloat(min_score));
      paramIndex++;
    }

    // Sort
    const allowedSortFields = ['ats_score', 'applied_at', 'cgpa'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'ats_score';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortField === 'cgpa') {
      query += ` ORDER BY cp.cgpa ${sortOrder}`;
    } else {
      query += ` ORDER BY ja.${sortField} ${sortOrder}`;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      applications: result.rows,
      total_count: result.rows.length,
      statistics: {
        average_ats_score: result.rows.length > 0
          ? Math.round(result.rows.reduce((sum, app) => sum + (app.ats_score || 0), 0) / result.rows.length)
          : 0,
        status_breakdown: {
          pending: result.rows.filter(a => a.status === 'pending').length,
          shortlisted: result.rows.filter(a => a.status === 'shortlisted').length,
          rejected: result.rows.filter(a => a.status === 'rejected').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status (Admin only)
router.patch('/:jobId/applications/:applicationId/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ['pending', 'shortlisted', 'rejected', 'interviewed', 'selected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed_statuses: allowedStatuses
      });
    }

    const result = await pool.query(`
      UPDATE job_applications 
      SET 
        status = $1,
        notes = COALESCE($2, notes),
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = $3
      WHERE id = $4 AND job_id = $5
      RETURNING *
    `, [status, notes, req.user.id, applicationId, jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = result.rows[0];

    // Get job details for notification
    const jobResult = await pool.query(`
      SELECT j.title, c.name as company_name 
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      WHERE j.id = $1
    `, [jobId]);

    const job = jobResult.rows[0];

    // Send notification to candidate
    const notificationMessages = {
      'shortlisted': `Congratulations! You've been shortlisted for ${job.title} at ${job.company_name}`,
      'rejected': `Unfortunately, your application for ${job.title} at ${job.company_name} was not successful`,
      'interviewed': `Your interview has been scheduled for ${job.title} at ${job.company_name}`,
      'selected': `🎉 Congratulations! You've been selected for ${job.title} at ${job.company_name}!`
    };

    if (notificationMessages[status]) {
      await createNotification(
        application.user_id,
        'Application Status Update',
        notificationMessages[status],
        status === 'selected' ? 'success' : status === 'rejected' ? 'error' : 'info',
        `/applications/${applicationId}`
      );
    }
    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      application: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Calculate ATS match for a job (without applying)
router.get('/:id/match-preview', authenticateToken, async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    // Get job details
    const jobResult = await pool.query(`
      SELECT j.*, c.name as company_name 
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    // Get candidate profile and skills
    const profileResult = await pool.query(
      'SELECT * FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Profile not found',
        message: 'Please upload your resume to create a profile'
      });
    }

    const profile = profileResult.rows[0];

    const skillsResult = await pool.query(
      'SELECT skill FROM candidate_skills WHERE user_id = $1',
      [userId]
    );
    const candidateSkills = skillsResult.rows.map(row => row.skill);

    // Calculate ATS match
    const atsScorer = new ATSScorer();
    const matchReport = atsScorer.calculateJobMatch(profile, candidateSkills, job);

    // Check if already applied
    const applicationResult = await pool.query(
      'SELECT * FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [jobId, userId]
    );

    res.json({
      success: true,
      match_report: matchReport,
      job_details: {
        title: job.title,
        company: job.company_name,
        package_lpa: job.package_lpa,
        required_skills: job.skills,
        min_cgpa: job.min_cgpa,
        max_backlogs: job.max_backlogs,
        allowed_branches: job.allowed_branches
      },
      already_applied: applicationResult.rows.length > 0,
      can_apply: matchReport.eligible && applicationResult.rows.length === 0
    });
  } catch (error) {
    console.error('Error calculating match preview:', error);
    res.status(500).json({ error: 'Failed to calculate match' });
  }
});

// Bulk shortlist candidates (Admin only)
router.post('/:id/bulk-shortlist', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { application_ids, status = 'shortlisted' } = req.body;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return res.status(400).json({ error: 'application_ids array is required' });
    }

    const result = await pool.query(`
      UPDATE job_applications 
      SET 
        status = $1,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = $2
      WHERE id = ANY($3) AND job_id = $4
      RETURNING *
    `, [status, req.user.id, application_ids, jobId]);

    res.json({
      success: true,
      message: `${result.rows.length} applications updated to ${status}`,
      updated_applications: result.rows
    });
  } catch (error) {
    console.error('Error bulk updating applications:', error);
    res.status(500).json({ error: 'Failed to update applications' });
  }
});



module.exports = router;