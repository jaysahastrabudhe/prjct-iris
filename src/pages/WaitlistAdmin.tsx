import { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Loader2, Users, Clock, RefreshCw, Key } from 'lucide-react';
import { api } from '../lib/api';

export default function WaitlistAdmin() {
  const [key, setKey] = useState(() => sessionStorage.getItem('iris_admin_key') || '');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load(k = key) {
    setLoading(true);
    setError('');
    try {
      const res = await api.waitlist.admin(k);
      if (res.error) { setError(res.error); setAuthed(false); return; }
      setData(res);
      setAuthed(true);
      sessionStorage.setItem('iris_admin_key', k);
    } catch {
      setError('Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: string) {
    setActionLoading(id);
    await api.waitlist.approve(id, key);
    await load();
    setActionLoading(null);
  }

  async function approveAll() {
    setActionLoading('all');
    await api.waitlist.approveAll(key);
    await load();
    setActionLoading(null);
  }

  async function remove(id: string) {
    if (!confirm('Remove this entry?')) return;
    setActionLoading(id + '_del');
    await api.waitlist.remove(id, key);
    await load();
    setActionLoading(null);
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'var(--yellow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={16} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>Waitlist Admin</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>PRJCT Iris · Restricted</div>
            </div>
          </div>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={e => { e.preventDefault(); load(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Admin key</label>
              <input
                className="input"
                type="password"
                placeholder="Enter WAITLIST_ADMIN_KEY"
                value={key}
                onChange={e => setKey(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={loading || !key}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const entries = data?.entries || [];
  const pending = entries.filter((e: any) => !e.approved);
  const approved = entries.filter((e: any) => e.approved);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Waitlist Admin</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>PRJCT Iris · <a href="/" style={{ color: 'var(--yellow)' }}>← Back to app</a></p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => load()} disabled={loading}>
              <RefreshCw size={12} /> Refresh
            </button>
            {pending.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={approveAll} disabled={actionLoading === 'all'}>
                {actionLoading === 'all' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />}
                Approve All ({pending.length})
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total', value: stats.total || 0, icon: <Users size={16} />, color: 'var(--yellow)' },
            { label: 'Pending', value: stats.pending || 0, icon: <Clock size={16} />, color: '#F97316' },
            { label: 'Approved', value: stats.approved || 0, icon: <CheckCircle size={16} />, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316' }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Pending ({pending.length})</span>
            </div>
            {pending.map((e: any) => (
              <div key={e.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                  {(e.name || e.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.email}</div>
                  {e.message && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, fontStyle: 'italic' }}>"{e.message}"</div>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {new Date(e.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}
                    onClick={() => approve(e.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === e.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={11} />}
                    Approve
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => remove(e.id)}
                    disabled={!!actionLoading}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <div className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Approved ({approved.length})</span>
            </div>
            {approved.map((e: any) => (
              <div key={e.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                  {(e.name || e.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{e.name || '—'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· {e.email}</span></div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Approved {e.approved_at ? new Date(e.approved_at).toLocaleDateString() : '—'}
                    {e.user_id && <span style={{ color: 'var(--green)', marginLeft: 8 }}>✓ has account</span>}
                  </div>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => remove(e.id)} disabled={!!actionLoading}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No waitlist entries yet</h3>
            <p>Share the waitlist URL to start collecting signups.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
