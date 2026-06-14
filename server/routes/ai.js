import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set — add it to .env to enable AI');

  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

router.post('/standup', async (req, res) => {
  const { tasks = [] } = req.body;
  const list = tasks
    .map(t => `- [${t.status}] ${t.title}${t.project_name ? ` (${t.project_name})` : ''}`)
    .join('\n');
  try {
    const text = await callGemini(
      `You are a productivity coach. Generate a concise daily standup update from these tasks:\n${list || '(no tasks yet)'}\n\nFormat exactly like this (keep it under 120 words):\n✅ Completed: ...\n🔄 In Progress: ...\n🚧 Blockers: ...\n📅 Up Next: ...`
    );
    res.json({ standup: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/breakdown', async (req, res) => {
  const { title, description } = req.body;
  try {
    const text = await callGemini(
      `Break down this task into 3-5 specific, actionable subtasks.\nTask: "${title}"\n${description ? `Context: "${description}"` : ''}\n\nReturn ONLY a JSON array of strings. Example: ["Do X", "Research Y", "Setup Z"]`
    );
    const match = text.match(/\[[\s\S]*?\]/);
    const subtasks = match ? JSON.parse(match[0]) : [];
    res.json({ subtasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enhance', async (req, res) => {
  const { title, description } = req.body;
  try {
    const text = await callGemini(
      `Rewrite this task description to be clear, specific, and actionable. Max 2 sentences.\nTask: "${title}"\nCurrent: "${description || 'none'}"\n\nReturn ONLY the improved description text.`
    );
    res.json({ description: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/insight', async (req, res) => {
  const { tasks = [] } = req.body;
  const list = tasks
    .map(t => `${t.title} [${t.priority} priority, ${t.status}, due: ${t.due_date || 'none'}]`)
    .join('\n');
  try {
    const text = await callGemini(
      `You are a productivity expert. In 2-3 sentences, tell me what to focus on TODAY based on these tasks and why:\n${list || '(no tasks)'}\n\nBe specific and direct.`
    );
    res.json({ insight: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Daily digest — one call per user per day. Returns a JSON summary.
// Caller should cache the result for 24 hours.
router.post('/digest', async (req, res) => {
  const { tasks = [], projects = [], metrics = {} } = req.body;

  const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date()).length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const blocked = tasks.filter(t => t.status === 'review').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  const taskSummary = tasks.slice(0, 12).map(t =>
    `${t.title} [${t.priority}/${t.status}${t.due_date ? ', due ' + t.due_date.slice(0,10) : ''}]`
  ).join('\n');

  const projectSummary = projects.slice(0, 6).map(p =>
    `${p.name} — ${p.done_count || 0}/${p.task_count || 0} done`
  ).join('\n');

  try {
    const text = await callGemini(
      `You are a productivity analyst. Given this snapshot, return a JSON object with these exact keys.
Tasks (${tasks.length} total, ${overdue} overdue, ${urgent} urgent, ${inProgress} in-progress, ${blocked} in-review):
${taskSummary || '(none)'}

Projects:
${projectSummary || '(none)'}

Metrics: pomodoros=${metrics.pomodoros || 0}, context_switches=${metrics.switches || 0}, focus_score=${metrics.score || 0}

Return ONLY valid JSON, no markdown, no explanation:
{
  "headline": "one punchy sentence on today's biggest priority",
  "priority_task": "name of the single most important task to complete today",
  "priority_reason": "why (1 sentence)",
  "risk": "biggest risk this week (1 sentence, or null if none)",
  "tip": "one specific, actionable productivity tip based on the data"
}`
    );
    const match = text.match(/\{[\s\S]*\}/);
    const digest = match ? JSON.parse(match[0]) : { headline: text };
    res.json({ digest, cached_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
