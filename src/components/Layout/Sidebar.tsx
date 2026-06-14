import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Columns3, CheckSquare, Users, LogOut, Timer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Columns3, label: 'Kanban', path: '/kanban' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Users, label: 'Team', path: '/team' },
  { icon: Timer, label: 'Focus Mode', path: '/focus' },
];

const CTX_KEY = 'iris_ctx_switches';
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function getTodaySwitches(): number {
  try {
    const raw = localStorage.getItem(CTX_KEY);
    if (!raw) return 0;
    return JSON.parse(raw)[getTodayKey()] || 0;
  } catch { return 0; }
}
function addContextSwitch() {
  try {
    const raw = localStorage.getItem(CTX_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const k = getTodayKey();
    data[k] = (data[k] || 0) + 1;
    const keys = Object.keys(data).sort();
    if (keys.length > 7) delete data[keys[0]];
    localStorage.setItem(CTX_KEY, JSON.stringify(data));
  } catch {}
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [switches, setSwitches] = useState(getTodaySwitches);

  function nav(path: string) {
    if (path !== pathname) {
      addContextSwitch();
      setSwitches(getTodaySwitches());
    }
    navigate(path);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="14" cy="13" r="3" fill="#000"/>
          </svg>
        </div>
        <div className="logo-text">
          <h1>Ironavtar</h1>
          <span>The iron for your mind</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>
        {NAV.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
          return (
            <div
              key={path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => nav(path)}
            >
              <Icon size={16} />
              {label}
              {path === '/focus' && switches > 0 && (
                <span className="nav-badge" style={{ background: switches > 10 ? '#FF4D4D' : 'var(--yellow)', color: '#000' }}>
                  {switches}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ padding: '6px 12px 10px', fontSize: 10, color: 'var(--text-3)' }}>
          Context switches today: <strong style={{ color: switches > 10 ? '#FF4D4D' : 'var(--text-2)' }}>{switches}</strong>
        </div>
        <div className="user-pill" onClick={logout} title="Sign out">
          <div className="avatar" style={{ background: user?.avatar_color || '#F5C518' }}>
            {user ? initials(user.name) : '?'}
          </div>
          <div className="user-pill-info">
            <div className="user-pill-name">{user?.name}</div>
            <div className="user-pill-role">{user?.role}</div>
          </div>
          <LogOut size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
