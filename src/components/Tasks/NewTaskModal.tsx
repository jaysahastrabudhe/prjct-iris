import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
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

const COLORS = ['#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A855F7', '#22C55E'];

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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.project_id) { setError('Select a project'); return; }
    setLoading(true);
    setError('');
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const task = await api.tasks.create({
        ...form,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
        reminder_at: form.reminder_at || null,
        tags,
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

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <span className="modal-title">New Task</span>
          <button className="icon-btn" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group">
              <label className="input-label">Title *</label>
              <input className="input" placeholder="Task title" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input" placeholder="Details..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div className="row">
              <div className="input-group">
                <label className="input-label">Project *</label>
                <select className="input" value={form.project_id} onChange={e => set('project_id', e.target.value)} required>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Assignee</label>
                <select className="input" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input className="input" type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">⏰ Reminder</label>
                <input className="input" type="datetime-local" value={form.reminder_at} onChange={e => set('reminder_at', e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Tags (comma separated)</label>
              <input className="input" placeholder="instagram, content, urgent" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : null}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
