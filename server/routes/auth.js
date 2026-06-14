import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../db.js';

const router = Router();

function validDevCode(code) {
  if (!code) return false;
  const codes = (process.env.DEV_CODES || '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean);
  return codes.includes(code.trim().toUpperCase());
}

router.post('/register', async (req, res) => {
  const { email, name, password, role = 'member', dev_code } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name and password required' });
  }
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email already in use' });

    // Access gate: valid dev code OR approved on waitlist
    let accessGranted = false;
    let usedCode = null;

    if (dev_code && validDevCode(dev_code)) {
      accessGranted = true;
      usedCode = dev_code.trim().toUpperCase();
    } else {
      const [entry] = await sql`
        SELECT approved FROM waitlist WHERE email = ${email.toLowerCase()}
      `;
      if (entry?.approved) {
        accessGranted = true;
      } else {
        return res.status(403).json({
          error: 'Access restricted. Use a dev code or join the waitlist.',
          waitlist: true,
        });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const colors = ['#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#C77DFF'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const [user] = await sql`
      INSERT INTO users (email, name, password_hash, role, avatar_color, access_granted, dev_code_used)
      VALUES (${email}, ${name}, ${hash}, ${role}, ${avatarColor}, ${accessGranted}, ${usedCode})
      RETURNING id, email, name, role, avatar_color, access_granted, email_reminders_enabled, created_at
    `;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const [user] = await sql`
      SELECT id, email, name, role, avatar_color, access_granted, email_reminders_enabled, created_at
      FROM users WHERE id = ${id}
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
