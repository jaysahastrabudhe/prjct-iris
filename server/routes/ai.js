import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set — add it to .env to enable AI');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
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

export default router;
