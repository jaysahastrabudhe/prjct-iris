import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import sql from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const users = await sql`SELECT id, email, name, role, avatar_color, created_at FROM users ORDER BY created_at ASC`;
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  try {
    const [user] = await sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role)
      WHERE id = ${req.params.id}
      RETURNING id, email, name, role, avatar_color, created_at
    `;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await sql`DELETE FROM users WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifs = await sql`
      SELECT * FROM notifications WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC LIMIT 50
    `;
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await sql`UPDATE notifications SET read = TRUE WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${req.user.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update own preferences
router.put('/me/preferences', async (req, res) => {
  const { email_reminders_enabled } = req.body;
  try {
    const [user] = await sql`
      UPDATE users
      SET email_reminders_enabled = COALESCE(${email_reminders_enabled ?? null}, email_reminders_enabled)
      WHERE id = ${req.user.id}
      RETURNING id, email, name, role, avatar_color, email_reminders_enabled, access_granted, created_at
    `;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Weekly wins: tasks completed in the last 7 days
router.get('/me/weekly-wins', async (req, res) => {
  try {
    const wins = await sql`
      SELECT t.id, t.title, t.priority, t.updated_at, p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE (t.assignee_id = ${req.user.id} OR p.owner_id = ${req.user.id})
        AND t.status = 'done'
        AND t.updated_at >= NOW() - INTERVAL '7 days'
      ORDER BY t.updated_at DESC
    `;
    res.json(wins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
