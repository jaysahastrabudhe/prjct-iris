import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { initDB } from './db.js';
import sql from './db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3002;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, app: 'PRJCT Iris', ai: !!process.env.GEMINI_API_KEY, email: !!resend }));

// Email reminder cron — check every 60s for tasks with reminder_at in the next minute
async function sendReminderEmails() {
  if (!resend) return;
  try {
    const due = await sql`
      SELECT t.title, t.id, t.reminder_at, u.email, u.name
      FROM tasks t
      JOIN users u ON u.id = t.assignee_id OR u.id = (
        SELECT owner_id FROM projects WHERE id = t.project_id
      )
      WHERE t.reminder_at IS NOT NULL
        AND t.reminder_at <= NOW() + INTERVAL '1 minute'
        AND t.reminder_at >= NOW() - INTERVAL '2 minutes'
        AND t.status != 'done'
      LIMIT 20
    `;
    for (const task of due) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'PRJCT Iris <onboarding@resend.dev>',
        to: [task.email],
        subject: `⏰ Reminder: ${task.title}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#F5C518">⏰ Task Reminder</h2><p>Hi ${task.name},</p><p>Your task <strong>${task.title}</strong> is due now.</p><p style="color:#888;font-size:13px">— PRJCT Iris Productivity Hub</p></div>`,
      }).catch(() => {});
    }
  } catch {}
}

async function start() {
  try {
    await initDB();
    console.log('✓ Database initialized');
    app.listen(PORT, () => {
      console.log(`✓ PRJCT Iris server running on http://localhost:${PORT}`);
      console.log(`  AI (Gemini): ${process.env.GEMINI_API_KEY ? '✓ enabled' : '✗ set GEMINI_API_KEY to enable'}`);
      console.log(`  Email (Resend): ${resend ? '✓ enabled' : '✗ set RESEND_API_KEY to enable'}`);
    });
    setInterval(sendReminderEmails, 60_000);
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
