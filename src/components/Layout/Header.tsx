import { useState, useEffect, useRef } from 'react';
import { Bell, Plus, X, CheckCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Notification } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  title: string;
  onNewTask?: () => void;
}

export default function Header({ title, onNewTask }: HeaderProps) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifs();
    const id = setInterval(loadNotifs, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function loadNotifs() {
    try {
      const data = await api.users.notifications();
      setNotifs(data);
    } catch {}
  }

  async function markAllRead() {
    await api.users.markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function typeIcon(type: string) {
    if (type === 'reminder') return '⏰';
    if (type === 'warning') return '⚠️';
    if (type === 'success') return '✅';
    return '💡';
  }

  return (
    <header className="page-header">
      <span className="page-title">{title}</span>
      <div className="header-actions">
        {onNewTask && (
          <button className="btn btn-primary btn-sm" onClick={onNewTask}>
            <Plus size={13} /> New Task
          </button>
        )}

        <div className="dropdown" ref={ref}>
          <button className="icon-btn" onClick={() => setOpen(o => !o)}>
            <Bell size={15} />
            {unread > 0 && <span className="notif-dot" />}
          </button>

          {open && (
            <div className="notif-panel fade-in">
              <div className="notif-panel-header">
                <span className="notif-panel-title">Notifications {unread > 0 && <span style={{ color: 'var(--yellow)', marginLeft: 4 }}>({unread})</span>}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {unread > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ padding: '3px 8px', fontSize: 11 }}>
                      <CheckCheck size={11} /> All read
                    </button>
                  )}
                  <button className="icon-btn" onClick={() => setOpen(false)} style={{ width: 24, height: 24 }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <div className="empty-state-icon">🔔</div>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifs.slice(0, 20).map(n => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={async () => { if (!n.read) { await api.users.markRead(n.id); setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); } }}
                    >
                      <div className="notif-icon">{typeIcon(n.type)}</div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        {n.message && <div className="notif-msg">{n.message}</div>}
                        <div className="notif-time">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
