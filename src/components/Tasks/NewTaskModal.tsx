import { useState, FormEvent, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Bell, Mail, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import { Project, User, Task } from '../../types';
import { scheduleReminder } from '../../lib/notifications';
import { addDays, startOfWeek, addWeeks, format } from 'date-fns';

interface Props {
  projects: Project[];
  users: User[];
  onClose: () => void;
  onCreated: (task: Task) => void;
  defaultProjectId?: string;
  defaultStatus?: string;
}

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#606060' },
  { value: 'medium', label: 'Med',    color: '#3B82F6' },
  { value: 'high',   label: 'High',   color: '#F97316' },
  { value: 'urgent', label: 'Urgent', color: '#FF4D4D' },
];

const STATUSES = [
  { value: 'todo',        label: 'To Do',   color: '#606060' },
  { value: 'in_progress', label: 'In Prog', color: '#3B82F6' },
  { value: 'review',      label: 'Review',  color: '#A855F7' },
  { value: 'done',        label: 'Done',    color: '#22C55E' },
];

function toLocalDT(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function quickDates() {
  const now = new Date();
  return [
    { label: 'Today',      value: toLocalDT(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0)) },
    { label: 'Tomorrow',   value: toLocalDT(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0), 1)) },
    { label: 'This week',  value: toLocalDT(addDays(startOfWeek(now, { weekStartsOn: 1 }), 4)) },
    { label: 'Next week',  value: toLocalDT(addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1)) },
  ];
}

interface NotchSliderProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color: string }[];
}

function NotchSlider({ label, value, onChange, options }: NotchSliderProps) {
  const idx = options.findIndex(o => o.value === value);
  const active = options[idx] ?? options[0];
  const pct = options.length > 1 ? (idx / (options.length - 1)) * 100 : 0;

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const snapped = Math.round(ratio * (options.length - 1));
    onChange(options[Math.max(0, Math.min(options.length - 1, snapped))].value);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(options[Math.min(idx + 1, options.length - 1)].value); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(options[Math.max(idx - 1, 0)].value); }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <label className="input-label" style={{ margin: 0 }}>{label}</label>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: `${active.color}18`, color: active.color,
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          transition: 'all .2s ease', border: `1px solid ${active.color}30`,
        }}>
          {active.label}
        </span>
      </div>

      {/* Track + dots */}
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={options.length - 1}
        aria-valuenow={idx}
        tabIndex={0}
        onKeyDown={handleKey}
        onClick={handleTrackClick}
        style={{ position: 'relative', height: 28, cursor: 'pointer', outline: 'none' }}
      >
        {/* Background rail */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: 4, transform: 'translateY(-50%)',
          background: 'var(--surface-3)', borderRadius: 99,
        }} />
        {/* Filled portion */}
        <div style={{
          position: 'absolute', top: '50%', left: 0,
          height: 4, transform: 'translateY(-50%)',
          width: `${pct}%`,
          background: active.color,
          borderRadius: 99,
          transition: 'width .22s cubic-bezier(0.34,1.56,0.64,1), background .2s ease',
        }} />
        {/* Notch dots */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pointerEvents: 'none',
        }}>
          {options.map((opt, i) => {
            const isActive = i === idx;
            const isPast = i < idx;
            return (
              <div
                key={opt.value}
                style={{
                  width: isActive ? 20 : 12,
                  height: isActive ? 20 : 12,
                  borderRadius: '50%',
                  background: isActive || isPast ? opt.color : 'var(--surface-2)',
                  border: `2px solid ${isActive || isPast ? opt.color : 'var(--border-light)'}`,
                  transition: 'all .22s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: isActive
                    ? `0 0 0 5px ${opt.color}18, 0 0 14px ${opt.color}45`
                    : 'none',
                  flexShrink: 0,
                  zIndex: 2,
                  pointerEvents: 'all',
                  cursor: 'pointer',
                }}
                onClick={e => { e.stopPropagation(); onChange(opt.value); }}
              />
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {options.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
              fontSize: 10, fontWeight: i === idx ? 700 : 400,
              color: i === idx ? opt.color : 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              transition: 'color .2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    } catch {
      // AI not configured
    } finally {
      setEnhancing(false);
    }
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
      if (form.reminder_at) scheduleReminder(form.title, new Date(form.reminder_at), task.id);
      onCreated(task);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedProject = projects.find(p => p.id === form.project_id);
  const dates = quickDates();

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className="slide-panel">
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>New Task</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Add to your productivity board</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
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

            {/* Description with AI enhance */}
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
                    cursor: form.title ? 'pointer' : 'not-allowed', color: 'var(--yellow)',
                    opacity: form.title ? 1 : 0.4, transition: 'opacity .15s',
                  }}
                >
                  {enhancing
                    ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Sparkles size={10} />}
                  AI Enhance
                </button>
              </div>
              <textarea
                className="input"
                style={{ minHeight: 68, resize: 'vertical', fontSize: 13 }}
                placeholder="Add details, context, acceptance criteria..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -4px' }} />

            {/* Priority notch slider */}
            <NotchSlider
              label="Priority"
              value={form.priority}
              onChange={v => set('priority', v)}
              options={PRIORITIES}
            />

            {/* Status notch slider */}
            <NotchSlider
              label="Status"
              value={form.status}
              onChange={v => set('status', v)}
              options={STATUSES}
            />

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -4px' }} />

            {/* Project + Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">
                  {selectedProject
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedProject.color, display: 'inline-block' }} />
                        {selectedProject.name}
                      </span>
                    : 'Project *'}
                </label>
                <select className="input" style={{ fontSize: 13 }} value={form.project_id} onChange={e => set('project_id', e.target.value)} required>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Assignee</label>
                <select className="input" style={{ fontSize: 13 }} value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Due date with quick presets */}
            <div>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <Calendar size={11} /> Due Date
              </label>
              {/* Quick presets */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {dates.map(d => {
                  const isActive = form.due_date === d.value;
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => set('due_date', isActive ? '' : d.value)}
                      style={{
                        padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                        fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        border: `1px solid ${isActive ? 'var(--yellow)' : 'var(--border)'}`,
                        background: isActive ? 'var(--yellow-glow)' : 'var(--surface-2)',
                        color: isActive ? 'var(--yellow)' : 'var(--text-3)',
                        transition: 'all .15s ease',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
                {form.due_date && !dates.some(d => d.value === form.due_date) && (
                  <button
                    type="button"
                    onClick={() => set('due_date', '')}
                    style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                      fontFamily: 'var(--font-mono)', cursor: 'pointer',
                      border: '1px solid var(--yellow)',
                      background: 'var(--yellow-glow)', color: 'var(--yellow)',
                    }}
                  >
                    Custom ×
                  </button>
                )}
              </div>
              <input
                className="input"
                type="datetime-local"
                style={{ fontSize: 12 }}
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
              />
            </div>

            {/* Reminder */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bell size={10} /> Reminder</label>
              <input className="input" type="datetime-local" style={{ fontSize: 12 }} value={form.reminder_at} onChange={e => set('reminder_at', e.target.value)} />
            </div>

            {/* Email reminder toggle */}
            {form.reminder_at && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                cursor: 'pointer', fontSize: 12, marginTop: -10,
              }}>
                <input
                  type="checkbox"
                  checked={form.email_reminder as boolean}
                  onChange={e => set('email_reminder', e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--yellow)' }}
                />
                <Mail size={12} style={{ color: 'var(--text-3)' }} />
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
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, flexShrink: 0,
            background: 'var(--surface)',
          }}>
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
