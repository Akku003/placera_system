const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const JDParser = require('../parsers/jdParser');

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

module.exports = router;