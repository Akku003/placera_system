const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all candidates
router.get('/candidates', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        cp.f_name,
        cp.m_name,
        cp.l_name,
        cp.register_number,
        cp.branch,
        cp.cgpa,
        cp.backlogs,
        cp.academic_year,
        cp.placement_status,
        (
          SELECT json_agg(cs.skill)
          FROM candidate_skills cs
          WHERE cs.user_id = u.id
        ) as skills,
        (
          SELECT COUNT(*)::int
          FROM job_applications ja
          WHERE ja.user_id = u.id
        ) as total_applications,
        (
          SELECT COUNT(*)::int
          FROM job_applications ja
          WHERE ja.user_id = u.id AND ja.status = 'selected'
        ) as selected_count
      FROM users u
      JOIN candidate_profiles cp ON u.id = cp.user_id
      WHERE u.role = 'candidate'
      ORDER BY cp.f_name, cp.l_name
    `);

    res.json({
      success: true,
      candidates: result.rows,
      total_count: result.rows.length,
      statistics: {
        total_candidates: result.rows.length,
        placed: result.rows.filter(c => c.placement_status === 'placed').length,
        unplaced: result.rows.filter(c => c.placement_status === 'unplaced').length,
        average_cgpa: result.rows.length > 0 
          ? (result.rows.reduce((sum, c) => sum + (parseFloat(c.cgpa) || 0), 0) / result.rows.length).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Update candidate placement status
router.patch('/candidates/:userId/placement-status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { placement_status } = req.body;

    if (!['placed', 'unplaced'].includes(placement_status)) {
      return res.status(400).json({ error: 'Invalid placement status' });
    }

    const result = await pool.query(
      'UPDATE candidate_profiles SET placement_status = $1 WHERE user_id = $2 RETURNING *',
      [placement_status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({
      success: true,
      message: `Candidate marked as ${placement_status}`,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating placement status:', error);
    res.status(500).json({ error: 'Failed to update placement status' });
  }
});

// Bulk update placement status
router.post('/candidates/bulk-placement-status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { user_ids, placement_status } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    if (!['placed', 'unplaced'].includes(placement_status)) {
      return res.status(400).json({ error: 'Invalid placement status' });
    }

    const result = await pool.query(
      'UPDATE candidate_profiles SET placement_status = $1 WHERE user_id = ANY($2) RETURNING *',
      [placement_status, user_ids]
    );

    res.json({
      success: true,
      message: `${result.rows.length} candidates marked as ${placement_status}`,
      updated_candidates: result.rows
    });
  } catch (error) {
    console.error('Error bulk updating placement status:', error);
    res.status(500).json({ error: 'Failed to update placement status' });
  }
});

module.exports = router;