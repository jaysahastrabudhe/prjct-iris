import { useState, FormEvent, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Bell, Mail } from 'lucide-react';
import { api } from '../../lib/api';
import { Project, User, Task } from '../../types';
import { scheduleReminder } from '../../lib/notifications';

interface Props {
  projects: Project[];
  users: User[];
  onClose: () => void;
  onCreated: (task: Task) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#606060' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', color: '#FF4D4D' },
];

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export default function NewTaskModal({ projects, users, onClose, onCreated, defaultProjectId, defaultStatus }: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: defaultProjectId || projects[0]?.id || '',
    assignee_id: '',
    priority: 'medium',
    status: defaultStatus || 'todo',
    due_date: '',
    reminder_at: '',
    tags: '',
    email_reminder: false,
  });
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function enhance() {
    if (!form.title) return;
    setEnhancing(true);
    try {
      const { description } = await api.ai.enhance(form.title, form.description);
      set('description', description);
    } catch { /* AI not configured — silent */ }
    finally { setEnhancing(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.project_id) { setError('Select a project'); return; }
    setLoading(true);
    setError('');
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const task = await api.tasks.create({
        title: form.title,
        description: form.description,
        project_id: form.project_id,
        assignee_id: form.assignee_id || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        reminder_at: form.reminder_at || null,
        tags,
        email_reminder: form.email_reminder,
      });
      if (form.reminder_at) {
        scheduleReminder(form.title, new Date(form.reminder_at), task.id);
      }
      onCreated(task);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedProject = projects.find(p => p.id === form.project_id);

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className="slide-panel">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>New Task</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Add to your productivity board</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            {error && <div className="auth-error">{error}</div>}

            {/* Title */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Task Title *</label>
              <input
                ref={titleRef}
                className="input"
                style={{ fontSize: 15, fontWeight: 600 }}
                placeholder="What needs to get done?"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                required
              />
            </div>

            {/* Description with AI */}
            <div className="input-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="input-label" style={{ margin: 0 }}>Description</label>
                <button
                  type="button"
                  onClick={enhance}
                  disabled={!form.title || enhancing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 8px',
                    background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6,
                    cursor: form.title ? 'pointer' : 'not-allowed', color: 'var(--yellow)', opacity: form.title ? 1 : 0.4,
                  }}
                  title="AI enhance description"
                >
                  {enhancing ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
                  AI Enhance
                </button>
              </div>
              <textarea
                className="input"
                style={{ minHeight: 72, resize: 'vertical', fontSize: 13 }}
                placeholder="Add details, context, acceptance criteria..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            {/* Priority selector */}
            <div>
              <label className="input-label">Priority</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('priority', p.value)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${form.priority === p.value ? p.color : 'var(--border)'}`,
                      background: form.priority === p.value ? `${p.color}18` : 'var(--surface-2)',
                      color: form.priority === p.value ? p.color : 'var(--text-3)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="input-label">Status</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set('status', s.value)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8,
                      border: `2px solid ${form.status === s.value ? 'var(--yellow)' : 'var(--border)'}`,
                      background: form.status === s.value ? 'rgba(245,197,24,0.1)' : 'var(--surface-2)',
                      color: form.status === s.value ? 'var(--yellow)' : 'var(--text-3)',
                      fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project + Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Project *</label>
                <select className="input" style={{ fontSize: 13 }} value={form.project_id} onChange={e => set('project_id', e.target.value)} required>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {selectedProject && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedProject.color, display: 'inline-block' }} />
                    {selectedProject.name}
                  </div>
                )}
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Assignee</label>
                <select className="input" style={{ fontSize: 13 }} value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Due Date</label>
                <input className="input" type="datetime-local" style={{ fontSize: 12 }} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bell size={10} /> Reminder</label>
                <input className="input" type="datetime-local" style={{ fontSize: 12 }} value={form.reminder_at} onChange={e => set('reminder_at', e.target.value)} />
              </div>
            </div>

            {/* Email reminder toggle */}
            {form.reminder_at && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.email_reminder as boolean}
                  onChange={e => set('email_reminder', e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--yellow)' }}
                />
                <Mail size={13} style={{ color: 'var(--text-3)' }} />
                <span>Also send email reminder to assignee</span>
              </label>
            )}

            {/* Tags */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Tags <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(comma separated)</span></label>
              <input className="input" style={{ fontSize: 13 }} placeholder="design, content, urgent" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, background: 'var(--surface-1)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : null}
              Create Task
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
