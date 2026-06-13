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

export default router;
