const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// STUDENT DASHBOARD
// ============================================

// Get student dashboard data
router.get('/student', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get profile completion status
    const profileResult = await pool.query(`
      SELECT 
        user_id,
        CASE WHEN f_name IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN l_name IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN register_number IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN cgpa IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN branch IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN academic_year IS NOT NULL THEN 1 ELSE 0 END as filled_fields,
        6 as total_fields
      FROM candidate_profiles
      WHERE user_id = $1
    `, [userId]);

    const profileData = profileResult.rows[0] || { filled_fields: 0, total_fields: 6 };
    const profileCompletion = Math.round((profileData.filled_fields / profileData.total_fields) * 100);

    // 2. Get application statistics
    const applicationsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'selected' THEN 1 END) as selected,
        AVG(ats_score) as avg_ats_score
      FROM job_applications
      WHERE user_id = $1
    `, [userId]);

    const appStats = applicationsResult.rows[0];

    // 3. Get recent applications (last 5)
    const recentAppsResult = await pool.query(`
      SELECT 
        ja.id,
        ja.status,
        ja.ats_score,
        ja.applied_at,
        j.title as job_title,
        c.name as company_name,
        j.package_lpa
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE ja.user_id = $1
      ORDER BY ja.applied_at DESC
      LIMIT 5
    `, [userId]);

    // 4. Get candidate skills count
    const skillsResult = await pool.query(`
      SELECT COUNT(*) as skills_count FROM candidate_skills WHERE user_id = $1
    `, [userId]);

    // 5. Get recommended jobs (not applied, eligible)
    const profileForMatch = await pool.query(`
      SELECT * FROM candidate_profiles WHERE user_id = $1
    `, [userId]);

    const profile = profileForMatch.rows[0];

    const recommendedJobsResult = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.skills,
        j.package_lpa,
        j.min_cgpa,
        j.max_backlogs,
        j.allowed_branches,
        j.created_at,
        c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE NOT EXISTS (
        SELECT 1 FROM job_applications 
        WHERE job_id = j.id AND user_id = $1
      )
      AND (
        j.min_cgpa IS NULL 
        OR j.min_cgpa <= $2::numeric
        OR $2 IS NULL
      )
      AND (
        j.max_backlogs IS NULL 
        OR j.max_backlogs >= $3
        OR $3 IS NULL
      )
      AND (
        j.allowed_branches IS NULL 
        OR array_length(j.allowed_branches, 1) IS NULL
        OR $4 = ANY(j.allowed_branches)
        OR $4 IS NULL
      )
      ORDER BY j.created_at DESC
      LIMIT 5
    `, [userId, profile?.cgpa, profile?.backlogs || 0, profile?.branch]);

    res.json({
      success: true,
      dashboard: {
        profile_completion: {
          percentage: profileCompletion,
          filled_fields: profileData.filled_fields,
          total_fields: profileData.total_fields,
          is_complete: profileCompletion === 100
        },
        application_stats: {
          total: parseInt(appStats.total_applications) || 0,
          pending: parseInt(appStats.pending) || 0,
          shortlisted: parseInt(appStats.shortlisted) || 0,
          rejected: parseInt(appStats.rejected) || 0,
          selected: parseInt(appStats.selected) || 0,
          avg_ats_score: appStats.avg_ats_score ? Math.round(parseFloat(appStats.avg_ats_score)) : 0
        },
        recent_applications: recentAppsResult.rows,
        recommended_jobs: recommendedJobsResult.rows,
        skills_count: parseInt(skillsResult.rows[0].skills_count) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============================================
// ADMIN DASHBOARD
// ============================================

// Get admin dashboard data
router.get('/admin', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Get job statistics
    const jobStatsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT j.company_id) as total_companies,
        COUNT(ja.id) as total_applications,
        AVG(ja.ats_score) as avg_ats_score
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
    `);

    const jobStats = jobStatsResult.rows[0];

    // 2. Get application status breakdown
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM job_applications
      GROUP BY status
    `);

    const statusBreakdown = {};
    statusResult.rows.forEach(row => {
      statusBreakdown[row.status] = parseInt(row.count);
    });

    // 3. Get recent applications (last 10)
    const recentAppsResult = await pool.query(`
      SELECT 
        ja.id,
        ja.job_id,
        ja.status,
        ja.ats_score,
        ja.applied_at,
        u.email,
        cp.f_name,
        cp.l_name,
        j.title as job_title,
        c.name as company_name
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      JOIN candidate_profiles cp ON ja.user_id = cp.user_id
      JOIN jobs j ON ja.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY ja.applied_at DESC
      LIMIT 10
    `);

    // 4. Get top performing candidates
    const topCandidatesResult = await pool.query(`
      SELECT 
        u.email,
        cp.f_name,
        cp.l_name,
        cp.cgpa,
        cp.branch,
        AVG(ja.ats_score) as avg_score,
        COUNT(ja.id) as applications_count,
        COUNT(CASE WHEN ja.status = 'shortlisted' THEN 1 END) as shortlisted_count
      FROM users u
      JOIN candidate_profiles cp ON u.id = cp.user_id
      JOIN job_applications ja ON u.id = ja.user_id
      GROUP BY u.id, u.email, cp.f_name, cp.l_name, cp.cgpa, cp.branch
      ORDER BY avg_score DESC
      LIMIT 10
    `);

    // 5. Get jobs with most applications
    const popularJobsResult = await pool.query(`
      SELECT 
        j.id,
        j.title,
        c.name as company_name,
        j.package_lpa,
        COUNT(ja.id) as application_count,
        AVG(ja.ats_score) as avg_score
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      GROUP BY j.id, j.title, c.name, j.package_lpa
      ORDER BY application_count DESC
      LIMIT 5
    `);

    // 6. Get placement rate
    const placementResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN ja.status = 'selected' THEN ja.user_id END) as placed_students,
        COUNT(DISTINCT u.id) as total_students
      FROM users u
      LEFT JOIN job_applications ja ON u.id = ja.user_id
      WHERE u.role = 'candidate'
    `);

    const placementData = placementResult.rows[0];
    const placementRate = placementData.total_students > 0 
      ? Math.round((placementData.placed_students / placementData.total_students) * 100)
      : 0;

    res.json({
      success: true,
      dashboard: {
        overview: {
          total_jobs: parseInt(jobStats.total_jobs) || 0,
          total_companies: parseInt(jobStats.total_companies) || 0,
          total_applications: parseInt(jobStats.total_applications) || 0,
          avg_ats_score: jobStats.avg_ats_score ? Math.round(parseFloat(jobStats.avg_ats_score)) : 0,
          placement_rate: placementRate,
          placed_students: parseInt(placementData.placed_students) || 0,
          total_students: parseInt(placementData.total_students) || 0
        },
        status_breakdown: statusBreakdown,
        recent_applications: recentAppsResult.rows,
        top_candidates: topCandidatesResult.rows.map(c => ({
          ...c,
          avg_score: c.avg_score ? Math.round(parseFloat(c.avg_score)) : 0
        })),
        popular_jobs: popularJobsResult.rows.map(j => ({
          ...j,
          application_count: parseInt(j.application_count),
          avg_score: j.avg_score ? Math.round(parseFloat(j.avg_score)) : 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============================================
// ANALYTICS - Job-wise Statistics
// ============================================

// Get detailed analytics for a specific job (Admin)
router.get('/admin/job/:id/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id: jobId } = req.params;

    // Get application distribution by score ranges
    const scoreDistResult = await pool.query(`
      SELECT 
        CASE 
          WHEN ats_score >= 90 THEN '90-100'
          WHEN ats_score >= 80 THEN '80-89'
          WHEN ats_score >= 70 THEN '70-79'
          WHEN ats_score >= 60 THEN '60-69'
          ELSE '0-59'
        END as score_range,
        COUNT(*) as count
      FROM job_applications
      WHERE job_id = $1
      GROUP BY score_range
      ORDER BY score_range DESC
    `, [jobId]);

    // Get branch-wise distribution
    const branchDistResult = await pool.query(`
      SELECT 
        cp.branch,
        COUNT(*) as count,
        AVG(ja.ats_score) as avg_score
      FROM job_applications ja
      JOIN candidate_profiles cp ON ja.user_id = cp.user_id
      WHERE ja.job_id = $1
      GROUP BY cp.branch
      ORDER BY count DESC
    `, [jobId]);

    // Get CGPA distribution
    const cgpaDistResult = await pool.query(`
      SELECT 
        CASE 
          WHEN cp.cgpa >= 9.0 THEN '9.0-10.0'
          WHEN cp.cgpa >= 8.0 THEN '8.0-8.9'
          WHEN cp.cgpa >= 7.0 THEN '7.0-7.9'
          WHEN cp.cgpa >= 6.0 THEN '6.0-6.9'
          ELSE 'Below 6.0'
        END as cgpa_range,
        COUNT(*) as count
      FROM job_applications ja
      JOIN candidate_profiles cp ON ja.user_id = cp.user_id
      WHERE ja.job_id = $1 AND cp.cgpa IS NOT NULL
      GROUP BY cgpa_range
      ORDER BY cgpa_range DESC
    `, [jobId]);

    res.json({
      success: true,
      analytics: {
        score_distribution: scoreDistResult.rows,
        branch_distribution: branchDistResult.rows.map(b => ({
          ...b,
          count: parseInt(b.count),
          avg_score: b.avg_score ? Math.round(parseFloat(b.avg_score)) : 0
        })),
        cgpa_distribution: cgpaDistResult.rows.map(c => ({
          ...c,
          count: parseInt(c.count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching job analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;