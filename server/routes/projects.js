import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import sql from '../db.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const projects = await sql`
      SELECT p.*, u.name as owner_name,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as done_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.owner_id = ${req.user.id} OR pm.user_id = ${req.user.id}
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `;
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, description, color, due_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const [project] = await sql`
      INSERT INTO projects (name, description, color, owner_id, due_date)
      VALUES (${name}, ${description || null}, ${color || '#F5C518'}, ${req.user.id}, ${due_date || null})
      RETURNING *
    `;
    await sql`INSERT INTO project_members (project_id, user_id) VALUES (${project.id}, ${req.user.id})`;
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, description, color, status, due_date } = req.body;
  try {
    const [project] = await sql`
      UPDATE projects SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        color = COALESCE(${color}, color),
        status = COALESCE(${status}, status),
        due_date = COALESCE(${due_date}, due_date)
      WHERE id = ${req.params.id} AND owner_id = ${req.user.id}
      RETURNING *
    `;
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await sql`DELETE FROM projects WHERE id = ${req.params.id} AND owner_id = ${req.user.id}`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
