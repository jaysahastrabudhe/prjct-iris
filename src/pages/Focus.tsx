import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Coffee, Wind, Brain, Minus, Plus, X } from 'lucide-react';
import Header from '../components/Layout/Header';

const SESSIONS = [
  { label: 'Focus', duration: 25 * 60, color: '#F5C518', icon: '🍅' },
  { label: 'Short Break', duration: 5 * 60, color: '#22C55E', icon: '☕' },
  { label: 'Long Break', duration: 15 * 60, color: '#3B82F6', icon: '🌊' },
];

const CONTEXT_KEY = 'iris_ctx_switches';
const POMODORO_KEY = 'iris_pomodoros';
const BRAINDUMP_KEY = 'iris_braindump';
const DISTRACTIONS_KEY = 'iris_distractions';

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getToday<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    const data = JSON.parse(raw);
    return data[getTodayKey()] ?? def;
  } catch { return def; }
}

function setToday(key: string, value: unknown) {
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};
    data[getTodayKey()] = value;
    // keep 7 days
    const keys = Object.keys(data).sort();
    if (keys.length > 7) delete data[keys[0]];
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function focusScore(pomodoros: number, switches: number, distractions: number): number {
  const pScore = Math.min(pomodoros * 20, 60);
  const cPenalty = Math.min(switches * 4, 30);
  const dPenalty = Math.min(distractions * 5, 20);
  return Math.max(0, Math.min(100, pScore - cPenalty - dPenalty + 10));
}

export default function Focus() {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSIONS[0].duration);
  const [running, setRunning] = useState(false);
  const [pomodoros, setPomodoros] = useState<number>(() => getToday(POMODORO_KEY, 0));
  const [switches, setSwitches] = useState<number>(() => getToday(CONTEXT_KEY, 0));
  const [distractions, setDistractions] = useState<number>(() => getToday(DISTRACTIONS_KEY, 0));
  const [brainDump, setBrainDump] = useState<string>(() => localStorage.getItem(BRAINDUMP_KEY) || '');
  const [dumpItems, setDumpItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(BRAINDUMP_KEY + '_items') || '[]'); } catch { return []; }
  });
  const [dumpInput, setDumpInput] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const session = SESSIONS[sessionIdx];
  const score = focusScore(pomodoros, switches, distractions);

  const tick = useCallback(() => {
    setTimeLeft(t => {
      if (t <= 1) {
        setRunning(false);
        if (sessionIdx === 0) {
          const next = pomodoros + 1;
          setPomodoros(next);
          setToday(POMODORO_KEY, next);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(sessionIdx === 0 ? '🍅 Focus session done! Take a break.' : '⏰ Break over — time to focus!');
        }
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        return SESSIONS[sessionIdx].duration;
      }
      return t - 1;
    });
  }, [sessionIdx, pomodoros]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  function switchSession(idx: number) {
    setSessionIdx(idx);
    setTimeLeft(SESSIONS[idx].duration);
    setRunning(false);
  }

  function reset() {
    setTimeLeft(session.duration);
    setRunning(false);
  }

  function requestNotifPerm() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function addDistr() {
    const next = distractions + 1;
    setDistractions(next);
    setToday(DISTRACTIONS_KEY, next);
  }

  function addDumpItem(e: React.FormEvent) {
    e.preventDefault();
    if (!dumpInput.trim()) return;
    const items = [...dumpItems, dumpInput.trim()];
    setDumpItems(items);
    localStorage.setItem(BRAINDUMP_KEY + '_items', JSON.stringify(items));
    setDumpInput('');
  }

  function removeDumpItem(i: number) {
    const items = dumpItems.filter((_, idx) => idx !== i);
    setDumpItems(items);
    localStorage.setItem(BRAINDUMP_KEY + '_items', JSON.stringify(items));
  }

  function saveBrainDump(val: string) {
    setBrainDump(val);
    localStorage.setItem(BRAINDUMP_KEY, val);
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const pct = 1 - timeLeft / session.duration;
  const r = 90, circ = 2 * Math.PI * r;
  const dash = pct * circ;

  const scoreColor = score >= 70 ? '#22C55E' : score >= 40 ? '#F5C518' : '#FF4D4D';

  return (
    <>
      <Header title="Focus Mode" />
      <div className="page-body fade-in">

        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,197,24,0.15)', color: '#F5C518' }}><span style={{ fontSize: 18 }}>🍅</span></div>
            <div><div className="stat-value">{pomodoros}</div><div className="stat-label">Pomodoros Today</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}><Zap size={18} /></div>
            <div><div className="stat-value">{switches}</div><div className="stat-label">Context Switches</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}><Wind size={18} /></div>
            <div><div className="stat-value">{distractions}</div><div className="stat-label">Distractions</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: `${scoreColor}22`, color: scoreColor }}><Brain size={18} /></div>
            <div>
              <div className="stat-value" style={{ color: scoreColor }}>{score}</div>
              <div className="stat-label">Focus Score</div>
            </div>
            <div className="stat-delta" style={{ color: scoreColor }}>{score >= 70 ? '✓ Great day' : score >= 40 ? '~ Keep going' : '⚠ Scattered'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Pomodoro timer */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 32 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {SESSIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => switchSession(i)}
                  style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: sessionIdx === i ? s.color : 'var(--surface-2)',
                    color: sessionIdx === i ? '#000' : 'var(--text-2)',
                    border: 'none', transition: 'all .2s',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                <circle
                  cx="110" cy="110" r={r} fill="none"
                  stroke={session.color} strokeWidth="8"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease', filter: running ? `drop-shadow(0 0 8px ${session.color})` : 'none' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 48, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)', letterSpacing: -2 }}>
                  {mins}:{secs}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{session.label}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="icon-btn" onClick={reset} title="Reset"><RotateCcw size={16} /></button>
              <button
                onClick={() => { setRunning(r => !r); requestNotifPerm(); }}
                style={{
                  width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: session.color, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: running ? `0 0 20px ${session.color}60` : 'none', transition: 'box-shadow .3s',
                }}
              >
                {running ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
              </button>
              <button className="icon-btn" onClick={addDistr} title="Log distraction" style={{ fontSize: 16 }}>💨</button>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: Math.min(pomodoros, 8) }).map((_, i) => (
                <span key={i} style={{ fontSize: 18 }}>🍅</span>
              ))}
              {pomodoros > 8 && <span style={{ fontSize: 12, color: 'var(--text-3)', alignSelf: 'center' }}>+{pomodoros - 8}</span>}
              {pomodoros === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Start your first focus session</span>}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
              Each context switch costs ~23 min of recovery.<br/>
              You've switched <strong style={{ color: 'var(--text-2)' }}>{switches}x</strong> today
              {switches > 5 ? ' — consider batching tasks.' : ' — good focus!'}
            </div>
          </div>

          {/* Brain dump + distraction log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <span className="section-title">🧠 Brain Dump</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Capture fast, process later</span>
              </div>
              <form onSubmit={addDumpItem} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  className="input"
                  style={{ flex: 1, fontSize: 13 }}
                  placeholder="Random thought, idea, task... hit Enter"
                  value={dumpInput}
                  onChange={e => setDumpInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm"><Plus size={14} /></button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {dumpItems.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 0', textAlign: 'center' }}>
                    Nothing captured yet — dump your thoughts here freely
                  </div>
                )}
                {dumpItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                    <span style={{ flex: 1 }}>{item}</span>
                    <button
                      onClick={() => removeDumpItem(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}
                    ><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-header" style={{ marginBottom: 12 }}>
                <span className="section-title">💨 Distraction Log</span>
                <span className="stat-value" style={{ fontSize: 24, color: distractions > 5 ? '#FF4D4D' : 'var(--text-1)' }}>{distractions}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
                {distractions === 0 && 'No distractions logged yet — stay in the zone!'}
                {distractions > 0 && distractions <= 3 && '✓ Minimal distractions — solid focus.'}
                {distractions > 3 && distractions <= 7 && '⚠ Moderate distractions. Try closing notifications.'}
                {distractions > 7 && '🔴 High distractions today. Consider a digital detox block.'}
              </div>
              <button
                onClick={addDistr}
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              >
                + Log a distraction
              </button>
            </div>

            <div className="card">
              <div className="section-header" style={{ marginBottom: 8 }}>
                <span className="section-title">📋 Context Switching</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${Math.min((switches / 15) * 100, 100)}%`, background: switches > 10 ? '#FF4D4D' : switches > 5 ? '#F5C518' : '#22C55E', transition: 'width .5s' }} />
                </div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{switches}/15</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Switches are auto-tracked as you navigate between tasks.
                {switches > 10 ? ' Time to go deep — pick one thing.' : ' Keep batching similar work.'}
              </div>
            </div>
          </div>
        </div>

        {/* Long notes */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <span className="section-title">📝 Extended Notes</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Saved automatically</span>
          </div>
          <textarea
            style={{ width: '100%', minHeight: 120, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-1)', fontSize: 13, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
            placeholder="Longer thoughts, meeting notes, ideas to process later..."
            value={brainDump}
            onChange={e => saveBrainDump(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
