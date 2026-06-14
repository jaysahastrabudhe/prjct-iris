import { Router } from 'express';
import sql from '../db.js';

const router = Router();

function adminAuth(req, res, next) {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!process.env.WAITLIST_ADMIN_KEY || key !== process.env.WAITLIST_ADMIN_KEY) {
    return res.status(403).json({ error: 'Invalid admin key' });
  }
  next();
}

// Public: join the waitlist
router.post('/', async (req, res) => {
  const { email, name, message } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // Check if already a user
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing) return res.status(409).json({ error: 'This email already has an account.' });

    const [entry] = await sql`
      INSERT INTO waitlist (email, name, message)
      VALUES (${email.toLowerCase()}, ${name || null}, ${message || null})
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, message = EXCLUDED.message
      RETURNING id, email, name, approved, created_at
    `;
    res.json({ ok: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: check your own waitlist status
router.get('/status', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const [entry] = await sql`SELECT id, email, approved, created_at FROM waitlist WHERE email = ${email.toLowerCase()}`;
    if (!entry) return res.status(404).json({ error: 'Not on waitlist' });
    const [position] = await sql`SELECT COUNT(*) as pos FROM waitlist WHERE approved = FALSE AND created_at < ${entry.created_at}`;
    res.json({ ...entry, position: parseInt(position.pos) + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all waitlist entries
router.get('/', adminAuth, async (req, res) => {
  try {
    const entries = await sql`
      SELECT w.*, u.id as user_id
      FROM waitlist w
      LEFT JOIN users u ON u.email = w.email
      ORDER BY w.approved ASC, w.created_at ASC
    `;
    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE approved = FALSE) as pending,
        COUNT(*) FILTER (WHERE approved = TRUE) as approved,
        COUNT(*) as total
      FROM waitlist
    `;
    res.json({ entries, stats: stats[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: approve an entry
router.post('/approve/:id', adminAuth, async (req, res) => {
  try {
    const [entry] = await sql`
      UPDATE waitlist SET approved = TRUE, approved_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: bulk approve all pending
router.post('/approve-all', adminAuth, async (req, res) => {
  try {
    const result = await sql`
      UPDATE waitlist SET approved = TRUE, approved_at = NOW()
      WHERE approved = FALSE
      RETURNING id, email
    `;
    res.json({ ok: true, approved: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete entry
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await sql`DELETE FROM waitlist WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
