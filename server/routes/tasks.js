import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import sql from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { project_id, status, assignee_id } = req.query;
  const pid = project_id || null;
  const st  = status || null;
  const aid = assignee_id || null;
  try {
    const tasks = await sql`
      SELECT DISTINCT ON (t.id) t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE (p.owner_id = ${req.user.id} OR pm.user_id = ${req.user.id})
        AND (${pid}::text IS NULL OR t.project_id::text = ${pid}::text)
        AND (${st}::text  IS NULL OR t.status = ${st}::text)
        AND (${aid}::text IS NULL OR t.assignee_id::text = ${aid}::text)
      ORDER BY t.id, t.position ASC, t.created_at DESC
    `;
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, description, project_id, assignee_id, status, priority, due_date, reminder_at, tags } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id required' });
  try {
    const [{ max_pos }] = await sql`SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE project_id = ${project_id} AND status = ${status || 'todo'}`;
    const [task] = await sql`
      INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, due_date, reminder_at, tags, position)
      VALUES (${title}, ${description || null}, ${project_id}, ${assignee_id || null}, ${status || 'todo'}, ${priority || 'medium'}, ${due_date || null}, ${reminder_at || null}, ${tags || []}, ${(max_pos || 0) + 1})
      RETURNING *
    `;

    if (reminder_at) {
      await sql`
        INSERT INTO notifications (user_id, title, message, type, task_id)
        VALUES (${req.user.id}, ${'Reminder: ' + title}, ${'Task reminder set for ' + new Date(reminder_at).toLocaleDateString()}, 'reminder', ${task.id})
      `;
    }

    const [fullTask] = await sql`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${task.id}
    `;
    res.status(201).json(fullTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { title, description, status, priority, due_date, reminder_at, assignee_id, tags, position } = req.body;
  try {
    const [access] = await sql`
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = ${req.params.id}
        AND (p.owner_id = ${req.user.id} OR pm.user_id = ${req.user.id})
    `;
    if (!access) return res.status(403).json({ error: 'Forbidden' });

    const [task] = await sql`
      UPDATE tasks SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        due_date = COALESCE(${due_date}, due_date),
        reminder_at = COALESCE(${reminder_at}, reminder_at),
        assignee_id = COALESCE(${assignee_id}, assignee_id),
        tags = COALESCE(${tags}, tags),
        position = COALESCE(${position}, position),
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!task) return res.status(404).json({ error: 'Not found' });

    const [fullTask] = await sql`
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, p.color as project_color
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${task.id}
    `;
    res.json(fullTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [access] = await sql`
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id = ${req.params.id}
        AND (p.owner_id = ${req.user.id} OR pm.user_id = ${req.user.id})
    `;
    if (!access) return res.status(403).json({ error: 'Forbidden' });

    await sql`DELETE FROM tasks WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reminders/due', async (req, res) => {
  try {
    const tasks = await sql`
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = t.project_id
      WHERE (p.owner_id = ${req.user.id} OR pm.user_id = ${req.user.id} OR t.assignee_id = ${req.user.id})
        AND t.reminder_at IS NOT NULL
        AND t.reminder_at <= NOW() + INTERVAL '1 minute'
        AND t.reminder_at >= NOW() - INTERVAL '5 minutes'
        AND t.status != 'done'
    `;
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
