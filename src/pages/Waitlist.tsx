import { useState } from 'react';
import { CheckCircle, Loader2, ArrowRight, Sparkles, Zap, Brain, Timer } from 'lucide-react';
import { api } from '../lib/api';

const BLOCKERS = [
  { icon: '🔔', stat: '275 interruptions/day', label: 'Notification overload derails focus' },
  { icon: '📅', stat: '21.7 meetings/week', label: 'Meeting creep kills deep work time' },
  { icon: '🔀', stat: '1,200 app switches/day', label: 'Tab toggling costs 4 hours/week' },
  { icon: '🧠', stat: '60% of work is overhead', label: 'Status updates, not actual output' },
];

export default function Waitlist() {
  const [form, setForm] = useState({ email: '', name: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.waitlist.join(form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus(e: React.FormEvent) {
    e.preventDefault();
    setCheckLoading(true);
    try {
      const s = await api.waitlist.status(checkEmail);
      setStatus(s);
    } catch (err: any) {
      setStatus({ error: err.message });
    } finally {
      setCheckLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
        <div style={{ width: 40, height: 40, background: 'var(--yellow)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="14" cy="13" r="3" fill="#000"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 800 }}>Ironavtar</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1 }}>The iron for your mind</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)',
          borderRadius: 99, fontSize: 11, fontWeight: 600, color: 'var(--yellow)',
          fontFamily: 'var(--font-mono)', marginBottom: 20,
        }}>
          <Sparkles size={11} /> Early Access · Limited Spots
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 42, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, marginBottom: 16 }}>
          The productivity app that actually{' '}
          <span style={{
            background: 'linear-gradient(135deg, #F5C518 0%, #FFE066 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>gets you work done</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7 }}>
          AI-powered project management built around real productivity science — not another todo list.
          Pomodoro, focus scoring, context switching, smart alerts, and one AI digest per day.
        </p>
      </div>

      {/* Blocker stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, maxWidth: 760, width: '100%', marginBottom: 56,
      }}>
        {BLOCKERS.map(b => (
          <div key={b.stat} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{b.stat}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* Waitlist form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-light)',
        borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)', marginBottom: 32,
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={24} style={{ color: 'var(--green)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You're on the list!</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>
              We'll email <strong style={{ color: 'var(--text)' }}>{form.email}</strong> when your spot opens up.
              You can check your position below.
            </p>
            <div style={{ marginTop: 20, padding: '10px 16px', background: 'rgba(245,197,24,0.06)', borderRadius: 8, border: '1px solid rgba(245,197,24,0.15)', fontSize: 12, color: 'var(--text-2)' }}>
              Have a dev code? <a href="/login" style={{ color: 'var(--yellow)', fontWeight: 600 }}>Register now →</a>
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Join the waitlist</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>We're rolling out access in cohorts. Secure your spot.</p>

            {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Name</label>
                <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Work email *</label>
                <input className="input" type="email" required placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">What's your biggest productivity blocker? <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                <textarea className="input" style={{ minHeight: 64, resize: 'none', fontSize: 12 }} placeholder="Too many meetings, constant Slack interruptions..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }} disabled={loading}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><ArrowRight size={16} /> Request Access</>}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Check position */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '24px 32px', width: '100%', maxWidth: 480, marginBottom: 48,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Check your waitlist position</h3>
        <form onSubmit={checkStatus} style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            type="email"
            required
            placeholder="Enter your email"
            value={checkEmail}
            onChange={e => setCheckEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-ghost" disabled={checkLoading}>
            {checkLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Check'}
          </button>
        </form>
        {status && !status.error && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: status.approved ? 'rgba(34,197,94,0.06)' : 'rgba(245,197,24,0.06)', borderRadius: 8, border: `1px solid ${status.approved ? 'rgba(34,197,94,0.2)' : 'rgba(245,197,24,0.2)'}` }}>
            {status.approved ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>You're approved! <a href="/login" style={{ color: 'var(--yellow)' }}>Register now →</a></span>
              </div>
            ) : (
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Position <span style={{ color: 'var(--yellow)' }}>#{status.position}</span> in queue</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Joined {new Date(status.created_at).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        )}
        {status?.error && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red)' }}>{status.error}</div>
        )}
      </div>

      {/* Features preview */}
      <div style={{ display: 'flex', gap: 20, maxWidth: 560, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: <Brain size={16} />, label: 'AI Daily Digest', sub: '1 smart call/day' },
          { icon: <Timer size={16} />, label: 'Pomodoro + Focus Score', sub: 'track deep work' },
          { icon: <Zap size={16} />, label: 'Smart Alerts', sub: 'zero AI credits' },
          { icon: <Sparkles size={16} />, label: 'Energy-Aware Tasks', sub: 'deep/shallow/admin' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99 }}>
            <span style={{ color: 'var(--yellow)' }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
        Already have access? <a href="/login" style={{ color: 'var(--yellow)' }}>Sign in →</a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
