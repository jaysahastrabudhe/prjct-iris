import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Columns3, CheckSquare, Users, Settings, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Columns3, label: 'Kanban', path: '/kanban' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Users, label: 'Team', path: '/team' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
          <h1>PRJCT Iris</h1>
          <span>Social Media Hub</span>
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
              onClick={() => navigate(path)}
            >
              <Icon />
              {label}
            </div>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Tools</div>
        <div className="nav-item">
          <Zap />
          Reminders
          <span className="nav-badge">ON</span>
        </div>
      </nav>

      <div className="sidebar-footer">
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
