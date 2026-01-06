const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// GET NOTIFICATIONS
// ============================================

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    if (unread_only === 'true') {
      query += ' AND read = false';
    }
    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, [userId]);

    const unreadCount = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unread_count: parseInt(unreadCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ============================================
// MARK AS READ
// ============================================

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE user_id = $1 AND read =false',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============================================
// UTILITY FUNCTION
// ============================================

// Create notification (utility function for internal use)
async function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    const result = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, message, type, link]
    );
    console.log(`📬 Notification created for user ${userId}: ${title}`);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

// ============================================
// BROADCAST (ADMIN)
// ============================================

// Send notification to all candidates (Admin only)
router.post('/broadcast', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, message, type, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all candidate user IDs
    const candidates = await pool.query(
      "SELECT id FROM users WHERE role = 'candidate'"
    );

    let created = 0;
    for (const candidate of candidates.rows) {
      await createNotification(candidate.id, title, message, type, link);
      created++;
    }

    res.json({
      success: true,
      message: `Notification sent to ${created} candidates`
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send notification to specific users (Admin only)
router.post('/send', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { user_ids, title, message, type, link } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    let created = 0;
    for (const userId of user_ids) {
      await createNotification(userId, title, message, type, link);
      created++;
    }

    res.json({
      success: true,
      message: `Notification sent to ${created} users`
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// ============================================
// EXPORTS
// ============================================

module.exports = router;
module.exports.createNotification = createNotification;