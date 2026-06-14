import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Trello, CheckSquare, Users, Timer, Zap } from 'lucide-react';

interface CmdItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
}

interface Props {
  onNewTask: () => void;
  onNewProject: () => void;
}

export default function CommandPalette({ onNewTask, onNewProject }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allItems: CmdItem[] = [
    { id: 'dash', label: 'Go to Dashboard', hint: 'Home', icon: <LayoutDashboard size={14} />, action: () => navigate('/'), section: 'Navigation' },
    { id: 'kanban', label: 'Go to Kanban Board', hint: 'Board view', icon: <Trello size={14} />, action: () => navigate('/kanban'), section: 'Navigation' },
    { id: 'tasks', label: 'Go to Tasks', hint: 'List view', icon: <CheckSquare size={14} />, action: () => navigate('/tasks'), section: 'Navigation' },
    { id: 'focus', label: 'Go to Focus Mode', hint: 'Pomodoro', icon: <Timer size={14} />, action: () => navigate('/focus'), section: 'Navigation' },
    { id: 'team', label: 'Go to Team', hint: 'Members', icon: <Users size={14} />, action: () => navigate('/team'), section: 'Navigation' },
    { id: 'new-task', label: 'Create New Task', hint: '⌘N', icon: <Zap size={14} />, action: onNewTask, section: 'Actions' },
    { id: 'new-project', label: 'Create New Project', hint: '', icon: <Zap size={14} />, action: onNewProject, section: 'Actions' },
  ];

  const filtered = query
    ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const sections = [...new Set(filtered.map(i => i.section))];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) { filtered[selected].action(); setOpen(false); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, selected]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  if (!open) return null;

  let globalIdx = 0;
  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command or search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>ESC</span>
        </div>
        <div className="cmd-results">
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No results for "{query}"</div>
          )}
          {sections.map(section => {
            const items = filtered.filter(i => i.section === section);
            return (
              <div key={section}>
                <div className="cmd-section-label">{section}</div>
                {items.map(item => {
                  const idx = globalIdx++;
                  return (
                    <div
                      key={item.id}
                      className={`cmd-item ${idx === selected ? 'selected' : ''}`}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => { item.action(); setOpen(false); }}
                    >
                      <span style={{ color: 'var(--text-3)' }}>{item.icon}</span>
                      <span className="cmd-label">{item.label}</span>
                      {item.hint && <span className="cmd-hint">{item.hint}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
