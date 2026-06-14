import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight, Columns3, CheckSquare, BarChart3, Bell, Users, Zap,
  Calendar, Clock, Workflow, ChevronRight, Shield, Sparkles,
  TrendingUp, Target, MessageSquare, CheckCircle2, Circle, Timer
} from 'lucide-react';

/* ── Scroll reveal hook ────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Animated counter ──────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let start = 0;
      const step = to / 40;
      const t = setInterval(() => {
        start += step;
        if (start >= to) { setVal(to); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 30);
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Notched slider ────────────────────────────────────────────── */
function NotchSlider({ labels, value, onChange, color = 'var(--yellow)' }: {
  labels: string[]; value: number; onChange: (i: number) => void; color?: string;
}) {
  const pct = (value / (labels.length - 1)) * 100;
  return (
    <div className="notch-slider">
      <div style={{ position: 'relative' }}>
        <div className="notch-track">
          <div className="notch-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="notch-dots" style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-between' }}>
          {labels.map((_, i) => (
            <div
              key={i}
              className={`notch-dot ${i <= value ? (i === value ? 'active' : 'past') : ''}`}
              style={{ background: i < value ? color : i === value ? color : undefined, borderColor: i <= value ? color : undefined }}
              onClick={() => onChange(i)}
            />
          ))}
        </div>
      </div>
      <div className="notch-labels">
        {labels.map((l, i) => (
          <span key={l} className={`notch-label ${i === value ? 'active' : ''}`} style={{ color: i === value ? color : undefined }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Mini Kanban mockup ────────────────────────────────────────── */
const MOCK_TASKS = {
  todo: [
    { t: 'Instagram carousel — Q3', tag: 'Design', color: '#A855F7' },
    { t: 'Twitter thread — product launch', tag: 'Copy', color: '#3B82F6' },
  ],
  in_progress: [
    { t: 'LinkedIn ad creative', tag: 'Urgent', color: '#FF4D4D' },
    { t: 'TikTok script review', tag: 'Review', color: '#F97316' },
  ],
  done: [
    { t: 'Brand guidelines PDF', tag: 'Done', color: '#22C55E' },
  ],
};

function MiniKanban() {
  const cols = [
    { key: 'todo', label: 'To Do', dot: '#606060' },
    { key: 'in_progress', label: 'In Progress', dot: '#3B82F6' },
    { key: 'done', label: 'Done', dot: '#22C55E' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
      {cols.map(col => (
        <div key={col.key} style={{
          flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.dot }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-heading)' }}>{col.label}</span>
          </div>
          {(MOCK_TASKS as any)[col.key].map((t: any) => (
            <div key={t.t} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6, padding: '7px 8px', marginBottom: 5,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.4, marginBottom: 5 }}>{t.t}</div>
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 99,
                background: `${t.color}20`, color: t.color,
                fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}>{t.tag}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Mini Dashboard mockup ─────────────────────────────────────── */
function MiniDashboard() {
  const bars = [65, 80, 45, 90, 55, 75, 88];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['12 Projects', '47 Tasks', '3 Overdue'].map((s, i) => (
          <div key={s} style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-heading)', color: i === 2 ? '#FF4D4D' : 'var(--yellow)' }}>
              {s.split(' ')[0]}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{s.split(' ')[1]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: '100%', height: `${h}%`, background: i === 3 ? 'var(--yellow)' : 'rgba(245,197,24,0.2)',
              borderRadius: '3px 3px 0 0', minHeight: 4,
              transition: 'height 1s ease',
            }} />
            <span style={{ fontSize: 8, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini Calendar mockup ──────────────────────────────────────── */
function MiniCalendar() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const events: Record<number, string> = { 5: '#F5C518', 12: '#3B82F6', 15: '#22C55E', 18: '#A855F7', 22: '#FF4D4D', 26: '#F97316' };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {['M','T','W','T','F','S','S'].map(d => (
          <span key={d} style={{ fontSize: 9, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', flex: 1, textAlign: 'center' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {days.map(d => (
          <div key={d} style={{
            aspectRatio: '1', borderRadius: 4, fontSize: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: events[d] ? `${events[d]}20` : 'rgba(255,255,255,0.02)',
            color: events[d] ? events[d] : 'var(--text-3)',
            fontWeight: events[d] ? 700 : 400,
            border: d === 13 ? '1px solid var(--yellow)' : '1px solid transparent',
            fontFamily: 'var(--font-mono)',
          }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Workload mockup ───────────────────────────────────────────── */
function MiniWorkload() {
  const team = [
    { name: 'Priya M.', load: 85, color: '#F5C518' },
    { name: 'Rohan K.', load: 60, color: '#22C55E' },
    { name: 'Sara L.', load: 95, color: '#FF4D4D' },
    { name: 'Dev A.', load: 40, color: '#3B82F6' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {team.map(m => (
        <div key={m.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>{m.name}</span>
            <span style={{ fontSize: 10, color: m.load > 80 ? '#FF4D4D' : m.color, fontFamily: 'var(--font-mono)' }}>{m.load}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${m.load}%`, background: m.load > 80 ? '#FF4D4D' : m.color, borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Feature tabs config ───────────────────────────────────────── */
const FEATURE_TABS = [
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'workload', label: 'Workload', icon: Users },
];

const FEATURE_DETAILS: Record<string, { title: string; desc: string; bullets: string[]; preview: JSX.Element }> = {
  kanban: {
    title: 'Visual Kanban Board',
    desc: 'Drag tasks across columns. See your entire social content pipeline at a glance — filtered by project or assignee.',
    bullets: ['Drag-and-drop across 4 stages', 'Per-column task count', 'Priority & due date on cards', 'Filter by project or assignee'],
    preview: <MiniKanban />,
  },
  dashboard: {
    title: 'Live Analytics Dashboard',
    desc: 'Area charts, bar charts, and pie breakdowns — all live. Know exactly where your team stands without asking.',
    bullets: ['Task activity for last 7 days', 'Status & priority breakdown', 'Per-project progress bars', 'Overdue alerts at a glance'],
    preview: <MiniDashboard />,
  },
  calendar: {
    title: 'Content Calendar',
    desc: 'See every deadline plotted on a calendar. Plan campaigns and spot clashes before they happen.',
    bullets: ['Monthly calendar view', 'Color-coded by project', 'Click to open any task', 'Never miss a posting date'],
    preview: <MiniCalendar />,
  },
  workload: {
    title: 'Team Workload View',
    desc: 'See who is at capacity and who has room. Balance assignments before someone burns out.',
    bullets: ['Capacity bars per team member', 'Overloaded members flagged red', 'Drag tasks to rebalance', 'Manager-level access only'],
    preview: <MiniWorkload />,
  },
};

/* ── Main Landing ──────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [priority, setPriority] = useState(1);
  const [activeTab, setActiveTab] = useState('kanban');
  const [approvalStep, setApprovalStep] = useState(1);
  useReveal();

  // Cycle approval steps for animation
  useEffect(() => {
    const t = setInterval(() => setApprovalStep(s => (s + 1) % 4), 1800);
    return () => clearInterval(t);
  }, []);

  const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Urgent'];
  const PRIORITY_COLORS = ['#606060', '#3B82F6', '#F97316', '#FF4D4D'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>

      {/* ── Sticky Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 58,
        background: 'rgba(8,8,8,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 30, height: 30, background: 'var(--yellow)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="14" cy="13" r="3" fill="#000"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>PRJCT Iris</span>
          <span className="live-dot" style={{ marginLeft: 6, fontSize: 10 }}>Live</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login?mode=register')}>
            Get Started <ArrowRight size={12} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 40px 60px', maxWidth: 1080, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600,
          background: 'radial-gradient(ellipse, rgba(245,197,24,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div className="reveal" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 24,
          fontSize: 11, fontWeight: 700, color: 'var(--yellow)',
          fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase',
        }}>
          <Zap size={10} /> Built for social media marketing teams
        </div>

        <h1 className="reveal" style={{
          fontSize: 'clamp(38px, 6vw, 68px)',
          fontFamily: 'var(--font-heading)', fontWeight: 700,
          letterSpacing: '-2.5px', lineHeight: 1.02,
          marginBottom: 18,
        }}>
          Ship social content<br />
          <span className="gradient-text">without the chaos.</span>
        </h1>

        <p className="reveal" style={{
          fontSize: 16, color: 'var(--text-2)', maxWidth: 500, margin: '0 auto 36px',
          lineHeight: 1.65,
        }}>
          The command center for social media teams. Kanban boards, content calendars, live dashboards, workload views, and in-browser reminders — all in one place.
        </p>

        <div className="reveal" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <button className="btn btn-primary btn-lg glow-yellow-sm" onClick={() => navigate('/login?mode=register')}>
            Start Free — No Card Needed <ArrowRight size={14} />
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>Sign In</button>
        </div>
        <div className="reveal" style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          ✓ Live in 60 seconds &nbsp;·&nbsp; ✓ Neon DB backed &nbsp;·&nbsp; ✓ Role-based access
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ padding: '0 40px 60px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal glass" style={{ borderRadius: 14, padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { n: 340, suffix: '+', label: 'Tasks tracked', sub: 'across all projects' },
            { n: 12, suffix: '+', label: 'Projects managed', sub: 'per workspace avg' },
            { n: 100, suffix: '%', label: 'Browser native', sub: 'no external app needed' },
            { n: 3, suffix: ' roles', label: 'Access levels', sub: 'Admin · Manager · Member' },
          ].map(({ n, suffix, label, sub }, i) => (
            <div key={label} style={{
              textAlign: 'center', padding: '0 20px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--yellow)', letterSpacing: '-1px', lineHeight: 1 }}>
                <Counter to={n} suffix={suffix} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 5 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Feature Preview ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Interactive Preview</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>See it in action</h2>
        </div>
        <div className="reveal" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div className="feature-tabs">
            {FEATURE_TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`feature-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                <Icon size={12} style={{ display: 'inline', marginRight: 5 }} />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="reveal" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 16, padding: 24,
        }}>
          {/* Left: preview */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: 16,
            border: '1px solid var(--border)', minHeight: 200,
          }}>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              {(() => { const Icon = FEATURE_TABS.find(t => t.id === activeTab)?.icon || Columns3; return <Icon size={13} style={{ color: 'var(--yellow)' }} />; })()}
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                {FEATURE_DETAILS[activeTab].title}
              </span>
            </div>
            {FEATURE_DETAILS[activeTab].preview}
          </div>
          {/* Right: description */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 8px' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
              {FEATURE_DETAILS[activeTab].title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
              {FEATURE_DETAILS[activeTab].desc}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEATURE_DETAILS[activeTab].bullets.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--yellow)', flexShrink: 0 }} /> {b}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => navigate('/login?mode=register')}>
              Try it free <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Everything you need</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>One tool. Zero context switching.</h2>
        </div>
        <div className="bento-grid reveal">

          {/* Large: Reminders */}
          <div className="bento-card bento-2x1 glass-yellow" style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: 'var(--yellow)' }}>
                <Bell size={18} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>In-Browser Reminders</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>Set per-task reminders. They fire as native browser notifications — no app, no email, no friction.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 160 }}>
              {[
                { t: 'Instagram post', time: 'in 2h', color: '#F5C518' },
                { t: 'Client approval', time: 'Tomorrow 9am', color: '#22C55E' },
                { t: 'Campaign brief', time: 'Overdue', color: '#FF4D4D' },
              ].map(r => (
                <div key={r.t} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px',
                  display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <Bell size={11} style={{ color: r.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{r.t}</div>
                    <div style={{ fontSize: 9, color: r.color, fontFamily: 'var(--font-mono)' }}>{r.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Small: Priority slider */}
          <div className="bento-card bento-1x1 glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Target size={14} style={{ color: PRIORITY_COLORS[priority] }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Task Priority</span>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: `${PRIORITY_COLORS[priority]}18`, color: PRIORITY_COLORS[priority],
                fontFamily: 'var(--font-mono)', border: `1px solid ${PRIORITY_COLORS[priority]}30`,
              }}>
                {PRIORITY_LABELS[priority]}
              </div>
            </div>
            <NotchSlider
              labels={PRIORITY_LABELS}
              value={priority}
              onChange={setPriority}
              color={PRIORITY_COLORS[priority]}
            />
          </div>

          {/* Small: Due date tracking */}
          <div className="bento-card bento-1x1 glass">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,77,77,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#FF4D4D' }}>
              <Timer size={16} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Due Date Tracking</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Overdue tasks surface instantly across every view.</div>
          </div>

          {/* Small: Team access */}
          <div className="bento-card bento-1x1 glass">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#A855F7' }}>
              <Shield size={16} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Role-Based Access</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Admin, Manager, Member — everyone gets exactly what they need.</div>
          </div>

          {/* Large: Approval workflow */}
          <div className="bento-card bento-2x1 glass" style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#3B82F6' }}>
                <Workflow size={18} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Approval Workflow</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>Move content through Draft → Review → Approved → Published. Never ship unapproved content.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', minWidth: 160 }}>
              {['Draft', 'In Review', 'Approved', 'Published'].map((s, i) => (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: i <= approvalStep ? 1 : 0.3,
                  transition: 'opacity 0.4s ease',
                }}>
                  {i <= approvalStep
                    ? <CheckCircle2 size={14} style={{ color: i === approvalStep ? 'var(--yellow)' : 'var(--green)', flexShrink: 0 }} />
                    : <Circle size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 11, fontWeight: i === approvalStep ? 700 : 400, color: i === approvalStep ? 'var(--yellow)' : 'var(--text-2)', fontFamily: 'var(--font-heading)' }}>{s}</span>
                  {i === approvalStep && (
                    <span className="live-dot" style={{ fontSize: 9 }}>now</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Small: Time tracking teaser */}
          <div className="bento-card bento-1x1 glass">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#22C55E' }}>
              <Clock size={16} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Time Tracking</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Log hours per task. See where your team's time actually goes.</div>
            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,197,24,0.1)', color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>COMING SOON</span>
          </div>

          {/* Small: Notifications */}
          <div className="bento-card bento-1x1 glass">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#F97316' }}>
              <MessageSquare size={16} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Smart Notifications</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Get alerted when tasks are assigned, moved, or overdue.</div>
          </div>

        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Simple by design</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>Up and running in 3 steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { n: '01', icon: Zap, title: 'Create workspace', desc: 'Register your agency. Create projects for each client or campaign in seconds.', color: '#F5C518' },
            { n: '02', icon: Users, title: 'Invite your team', desc: 'Add members with role-based access. Assign tasks, set due dates, enable reminders.', color: '#A855F7' },
            { n: '03', icon: TrendingUp, title: 'Ship faster', desc: 'Move cards through Kanban, track progress on the dashboard, never miss a deadline.', color: '#22C55E' },
          ].map(({ n, icon: Icon, title, desc, color }, i) => (
            <div key={n} className={`reveal glass bento-card`} style={{ animationDelay: `${i * 0.1}s`, gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', fontWeight: 700 }}>{n}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>Role-based access control</h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 10 }}>Everyone gets exactly the access they need — nothing more.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { role: 'Admin', color: '#F5C518', perms: ['Full workspace control', 'Invite & remove members', 'Manage all projects & tasks', 'Change user roles'] },
            { role: 'Manager', color: '#A855F7', perms: ['Create & manage projects', 'Assign tasks to members', 'View team workload', 'Set team reminders'] },
            { role: 'Member', color: '#3B82F6', perms: ['View assigned projects', 'Update task status', 'Add tags to tasks', 'Set personal reminders'] },
          ].map(({ role, color, perms }, i) => (
            <div key={role} className="reveal glass bento-card" style={{ borderColor: `${color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Shield size={15} style={{ color }} />
                <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-heading)', color }}>{role}</span>
              </div>
              {perms.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, fontSize: 12, color: 'var(--text-2)' }}>
                  <ChevronRight size={11} style={{ color, flexShrink: 0 }} /> {p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '0 40px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="reveal" style={{
          background: 'linear-gradient(135deg, rgba(245,197,24,0.09) 0%, rgba(245,197,24,0.03) 100%)',
          border: '1px solid rgba(245,197,24,0.18)',
          borderRadius: 20, padding: '60px 48px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 300, height: 300,
            background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
            padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: 'rgba(245,197,24,0.1)', color: 'var(--yellow)',
            fontFamily: 'var(--font-mono)', border: '1px solid rgba(245,197,24,0.2)',
          }}>
            <Sparkles size={11} /> Free to start, no credit card
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-1.5px', marginBottom: 12 }}>
            Ready to take control?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32 }}>
            Set up your team's workspace in under a minute.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg glow-yellow" onClick={() => navigate('/login?mode=register')}>
              Create Free Account <ArrowRight size={14} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>Sign In Instead</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1080, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'var(--yellow)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.4" strokeLinecap="round"/>
              <circle cx="14" cy="13" r="3" fill="#000"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13 }}>PRJCT Iris</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>— Social Media Command Center</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          Neon DB · React 18 · Express · Space Grotesk
        </span>
      </footer>

    </div>
  );
}
