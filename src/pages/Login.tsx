import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ email: '', name: '', password: '', dev_code: '' });
  const [showDevCode, setShowDevCode] = useState(!!params.get('code'));
  const [error, setError] = useState('');
  const [waitlistRedirect, setWaitlistRedirect] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setWaitlistRedirect(false);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.name, form.password, undefined, form.dev_code || undefined);
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message?.includes('waitlist') || err.message?.includes('Access restricted')) {
        setWaitlistRedirect(true);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', color: 'var(--text-3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 24, padding: 0, cursor: 'pointer' }}
        >
          ← Back to home
        </button>
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="14" cy="13" r="3" fill="#000"/>
            </svg>
          </div>
          <div className="auth-title">
            <h2>Ironavtar</h2>
            <span>The iron for your mind</span>
          </div>
        </div>

        {error && (
          <div className="auth-error">
            {error}
            {waitlistRedirect && (
              <div style={{ marginTop: 8 }}>
                <a href="/waitlist" style={{ color: 'var(--yellow)', fontWeight: 600 }}>→ Join the waitlist</a>
              </div>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                className="input"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>

          {/* Dev code — only shown on register */}
          {mode === 'register' && (
            <div>
              <button
                type="button"
                onClick={() => setShowDevCode(s => !s)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--text-3)', padding: 0, marginBottom: showDevCode ? 8 : 0,
                  transition: 'color .15s',
                }}
              >
                <Key size={12} />
                Have a dev access code?
                {showDevCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showDevCode && (
                <input
                  className="input"
                  placeholder="Enter dev code (e.g. IRIS-DEV-2025)"
                  value={form.dev_code}
                  onChange={e => setForm(f => ({ ...f, dev_code: e.target.value }))}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  autoFocus
                />
              )}
              {!showDevCode && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                  No code? <a href="/waitlist" style={{ color: 'var(--yellow)' }}>Join the waitlist →</a>
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); setWaitlistRedirect(false); }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
