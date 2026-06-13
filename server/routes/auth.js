import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, name, password, role = 'member' } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name and password required' });
  }
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const colors = ['#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#C77DFF'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const [user] = await sql`
      INSERT INTO users (email, name, password_hash, role, avatar_color)
      VALUES (${email}, ${name}, ${hash}, ${role}, ${avatarColor})
      RETURNING id, email, name, role, avatar_color, created_at
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
    const [user] = await sql`SELECT id, email, name, role, avatar_color, created_at FROM users WHERE id = ${id}`;
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
