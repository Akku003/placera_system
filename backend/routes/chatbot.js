const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Log interaction
const logInteraction = async (userId, menuOption, queryDetails, responseType) => {
  try {
    await pool.query(
      'INSERT INTO chatbot_interactions (user_id, menu_option, query_details, response_type) VALUES ($1, $2, $3, $4)',
      [userId, menuOption, JSON.stringify(queryDetails), responseType]
    );
  } catch (error) {
    console.error('Error logging chatbot interaction:', error);
  }
};

//Eligibility Checker
router.post('/check-eligibility', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.userId;

    // Get user profile
    const profileResult = await pool.query(
      'SELECT * FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Please complete your profile first'
      });
    }

    const profile = profileResult.rows[0];

    // Get job details
    const jobResult = await pool.query(`
      SELECT j.*, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Job not found'
      });
    }

    const job = jobResult.rows[0];

    // Check eligibility
    const issues = [];
    let eligible = true;

    if (profile.placement_status === 'placed') {
      eligible = false;
      issues.push('❌ You are already placed and cannot apply for more positions');
    }

    if (job.min_cgpa && profile.cgpa < job.min_cgpa) {
      eligible = false;
      issues.push(`❌ CGPA: Your CGPA (${profile.cgpa}) is below required (${job.min_cgpa})`);
    } else {
      issues.push(`✅ CGPA: Meets requirement (${job.min_cgpa})`);
    }

    if (job.max_backlogs !== null && profile.backlogs > job.max_backlogs) {
      eligible = false;
      issues.push(`❌ Backlogs: You have ${profile.backlogs} backlog(s), maximum allowed is ${job.max_backlogs}`);
    } else {
      issues.push(`✅ Backlogs: Meets requirement (max ${job.max_backlogs})`);
    }

    if (job.allowed_branches && job.allowed_branches.length > 0) {
      if (!job.allowed_branches.includes(profile.branch)) {
        eligible = false;
        issues.push(`❌ Branch: Your branch (${profile.branch}) is not in allowed list: ${job.allowed_branches.join(', ')}`);
      } else {
        issues.push(`✅ Branch: ${profile.branch} is allowed`);
      }
    }

    // Check skills
    const skillsResult = await pool.query(
      'SELECT skill FROM candidate_skills WHERE user_id = $1',
      [userId]
    );
    const userSkills = skillsResult.rows.map(r => r.skill.toLowerCase());
    const requiredSkills = job.skills || [];
    const matchedSkills = requiredSkills.filter(s => 
      userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );
    const missingSkills = requiredSkills.filter(s => 
      !userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );

    if (missingSkills.length > 0) {
      issues.push(`⚠️ Missing Skills: ${missingSkills.join(', ')}`);
    }
    if (matchedSkills.length > 0) {
      issues.push(`✅ Matched Skills: ${matchedSkills.join(', ')}`);
    }

    await logInteraction(userId, 'eligibility_check', { jobId }, 'database');

    res.json({
      success: true,
      eligible,
      job: {
        title: job.title,
        company: job.company_name
      },
      issues,
      recommendation: eligible 
        ? '🎉 You are eligible to apply for this position!' 
        : '⚠️ You do not meet all eligibility criteria'
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

// Get Interview Questions
router.post('/interview-questions', authenticateToken, async (req, res) => {
  try {
    const { companyName, questionType } = req.body;
    const userId = req.user.userId;

    let query = 'SELECT * FROM interview_questions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (companyName && companyName !== 'All Companies') {
      query += ` AND (company_name = $${paramCount} OR company_name = 'General')`;
      params.push(companyName);
      paramCount++;
    }

    if (questionType && questionType !== 'all') {
      query += ` AND question_type = $${paramCount}`;
      params.push(questionType);
      paramCount++;
    }

    query += ' ORDER BY RANDOM() LIMIT 10';

    const result = await pool.query(query, params);

    await logInteraction(userId, 'interview_questions', { companyName, questionType }, 'database');

    res.json({
      success: true,
      questions: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Interview questions error:', error);
    res.status(500).json({ error: 'Failed to fetch interview questions' });
  }
});

// Get Syllabus Topics
router.post('/syllabus', authenticateToken, async (req, res) => {
  try {
    const { category } = req.body;
    const userId = req.user.userId;

    let query = 'SELECT * FROM syllabus_topics';
    const params = [];

    if (category && category !== 'all') {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY difficulty, topic_name';

    const result = await pool.query(query, params);

    await logInteraction(userId, 'syllabus', { category }, 'database');

    res.json({
      success: true,
      topics: result.rows
    });

  } catch (error) {
    console.error('Syllabus error:', error);
    res.status(500).json({ error: 'Failed to fetch syllabus' });
  }
});

//Get Company Details
router.post('/company-details', authenticateToken, async (req, res) => {
  try {
    const { companyName } = req.body;
    const userId = req.user.userId;

    // Try database first
    const result = await pool.query(
      'SELECT * FROM company_info WHERE LOWER(company_name) = LOWER($1)',
      [companyName]
    );

    if (result.rows.length > 0) {
      await logInteraction(userId, 'company_details', { companyName }, 'database');
      
      return res.json({
        success: true,
        source: 'database',
        company: result.rows[0]
      });
    }

    // If not in database, suggest Google search
    await logInteraction(userId, 'company_details', { companyName }, 'google_search');

    res.json({
      success: true,
      source: 'google_search',
      message: `No detailed information found in database. Would you like to search Google for "${companyName}"?`,
      searchQuery: `${companyName} company reviews careers interview process`
    });

  } catch (error) {
    console.error('Company details error:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});

//Get Available Companies (for dropdowns)
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT name FROM companies ORDER BY name'
    );

    res.json({
      success: true,
      companies: result.rows.map(r => r.name)
    });

  } catch (error) {
    console.error('Companies list error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

//Get Available Jobs (for eligibility checker)
router.get('/jobs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.id, j.title, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      ORDER BY c.name, j.title
    `);

    res.json({
      success: true,
      jobs: result.rows
    });

  } catch (error) {
    console.error('Jobs list error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

module.exports = router;