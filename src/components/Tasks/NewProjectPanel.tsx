import { useState, FormEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../lib/api';
import { Project } from '../../types';

interface Props {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const COLORS = ['#F5C518', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A855F7', '#22C55E', '#F97316', '#EC4899'];

export default function NewProjectPanel({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', description: '', color: '#F5C518', status: 'active', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const project = await api.projects.create(form);
      onCreated(project);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="slide-panel-overlay" onClick={onClose} />
      <div className="slide-panel">
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>New Project</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Create a new workspace</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            {error && <div className="auth-error">{error}</div>}

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Project Name *</label>
              <input ref={nameRef} className="input" style={{ fontSize: 15, fontWeight: 600 }} placeholder="e.g. Q3 Content Campaign" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Description</label>
              <textarea className="input" style={{ minHeight: 72, resize: 'vertical', fontSize: 13 }} placeholder="What is this project about?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div>
              <label className="input-label">Color</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', border: `3px solid ${form.color === c ? 'var(--text-1)' : 'transparent'}`,
                      background: c, cursor: 'pointer', transition: 'transform .15s',
                      transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Status</label>
                <select className="input" style={{ fontSize: 13 }} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Due Date</label>
                <input className="input" type="date" style={{ fontSize: 12 }} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>

            {/* Preview */}
            <div style={{ padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 10, borderLeft: `3px solid ${form.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: form.color, display: 'inline-block' }} />
                {form.name || 'Project Name'}
              </div>
              {form.description && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{form.description}</div>}
            </div>
          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, background: 'var(--surface-1)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : null}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
