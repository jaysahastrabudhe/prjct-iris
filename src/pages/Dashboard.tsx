import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, CheckSquare, Users, TrendingUp, Plus, ArrowUpRight, Timer, Brain } from 'lucide-react';
import Header from '../components/Layout/Header';
import { api } from '../lib/api';
import { Task, Project, User } from '../types';
import { format, subDays, isBefore, parseISO } from 'date-fns';
import NewTaskModal from '../components/Tasks/NewTaskModal';
import NewProjectPanel from '../components/Tasks/NewProjectPanel';
import DashboardInsights from '../components/AI/DashboardInsights';

const STATUS_COLORS: Record<string, string> = {
  todo: '#606060', in_progress: '#3B82F6', review: '#A855F7', done: '#22C55E',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: '#606060', medium: '#3B82F6', high: '#F97316', urgent: '#FF4D4D',
};

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function getTodayValue(key: string, def = 0): number {
  try { const d = JSON.parse(localStorage.getItem(key) || '{}'); return d[getTodayKey()] ?? def; } catch { return def; }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ctxSwitches = getTodayValue('iris_ctx_switches');
  const pomodoros = getTodayValue('iris_pomodoros');
  const distractions = getTodayValue('iris_distractions');
  const focusScore = Math.max(0, Math.min(100, Math.min(pomodoros * 20, 60) - Math.min(ctxSwitches * 4, 30) - Math.min(distractions * 5, 20) + 10));
  const scoreColor = focusScore >= 70 ? '#22C55E' : focusScore >= 40 ? '#F5C518' : '#FF4D4D';

  useEffect(() => {
    Promise.all([api.tasks.list(), api.projects.list(), api.users.list()])
      .then(([t, p, u]) => { setTasks(t); setProjects(p); setUsers(u); })
      .catch(() => setError('Failed to load workspace data. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && isBefore(parseISO(t.due_date), new Date())).length;

  const activityData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const label = format(day, 'EEE');
    const created = tasks.filter(t => format(parseISO(t.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
    const completed = tasks.filter(t => t.status === 'done' && format(parseISO(t.updated_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length;
    return { day: label, Created: created, Completed: completed };
  });

  const statusData = ['todo', 'in_progress', 'review', 'done'].map(s => ({
    name: s.replace('_', ' '), value: tasks.filter(t => t.status === s).length, color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);

  const priorityData = ['low', 'medium', 'high', 'urgent'].map(p => ({
    priority: p, count: tasks.filter(t => t.priority === p).length, fill: PRIORITY_COLORS[p],
  }));

  function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

  if (error) return (
    <>
      <Header title="Dashboard" onNewTask={() => setShowNewTask(true)} />
      <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Couldn't load your workspace</h3>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={() => { setError(null); setLoading(true); Promise.all([api.tasks.list(), api.projects.list(), api.users.list()]).then(([t, p, u]) => { setTasks(t); setProjects(p); setUsers(u); }).catch(() => setError('Still failing. Check the server is running.')).finally(() => setLoading(false)); }}>Retry</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Header title="Dashboard" onNewTask={() => setShowNewTask(true)} />
      <div className="page-body fade-in">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><Layers size={18} /></div>
            <div><div className="stat-value">{projects.length}</div><div className="stat-label">Active Projects</div></div>
            <div className="stat-delta"><ArrowUpRight size={12} /> All running</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CheckSquare size={18} /></div>
            <div><div className="stat-value">{tasks.length}</div><div className="stat-label">Total Tasks</div></div>
            <div className="stat-delta" style={{ color: 'var(--text-3)' }}>{done} completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--blue)' }}><TrendingUp size={18} /></div>
            <div><div className="stat-value">{inProgress}</div><div className="stat-label">In Progress</div></div>
            <div className="stat-delta" style={{ color: 'var(--blue)' }}><ArrowUpRight size={12} /> Active now</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: overdue > 0 ? 'rgba(255,77,77,0.15)' : 'rgba(34,197,94,0.15)', color: overdue > 0 ? 'var(--red)' : 'var(--green)' }}>
              <Users size={18} />
            </div>
            <div>
              <div className="stat-value" style={{ color: overdue > 0 ? 'var(--red)' : 'inherit' }}>{overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
            <div className="stat-delta" style={{ color: overdue > 0 ? 'var(--red)' : 'var(--green)' }}>{overdue > 0 ? '⚠ Needs attention' : '✓ On track'}</div>
          </div>
        </div>

        {/* Productivity widgets row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Brain size={14} style={{ color: scoreColor }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Focus Score</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{focusScore}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              {focusScore >= 70 ? 'Great focus today!' : focusScore >= 40 ? 'Room to improve' : 'Start a pomodoro session'}
            </div>
            <div style={{ marginTop: 10, height: 4, background: 'var(--surface-2)', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${focusScore}%`, background: scoreColor, transition: 'width .5s' }} />
            </div>
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Timer size={14} style={{ color: '#F5C518' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Pomodoros</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{pomodoros}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              {pomodoros === 0 ? 'No sessions yet — visit Focus Mode' : `${Math.round(pomodoros * 25)} min of deep work`}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {Array.from({ length: Math.min(pomodoros, 6) }).map((_, i) => <span key={i} style={{ fontSize: 14 }}>🍅</span>)}
              {pomodoros > 6 && <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>+{pomodoros - 6}</span>}
            </div>
          </div>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={14} style={{ color: ctxSwitches > 10 ? '#FF4D4D' : '#A855F7' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Context Switches</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: ctxSwitches > 10 ? '#FF4D4D' : 'var(--text)', lineHeight: 1 }}>{ctxSwitches}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              {ctxSwitches <= 5 ? '✓ Excellent focus — low switching' : ctxSwitches <= 10 ? '~ Moderate switching today' : '⚠ High switching costs ~23min each'}
            </div>
            <div style={{ marginTop: 10, height: 4, background: 'var(--surface-2)', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${Math.min((ctxSwitches / 15) * 100, 100)}%`, background: ctxSwitches > 10 ? '#FF4D4D' : ctxSwitches > 5 ? '#F5C518' : '#22C55E', transition: 'width .5s' }} />
            </div>
          </div>
        </div>

        {/* AI Insights + Smart Alerts */}
        <DashboardInsights tasks={tasks} projects={projects} />

        {/* Charts row 1 */}
        <div className="charts-grid">
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <span className="section-title">Task Activity — Last 7 Days</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5C518" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F5C518" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Created" stroke="#F5C518" strokeWidth={2} fill="url(#gCreated)" />
                <Area type="monotone" dataKey="Completed" stroke="#22C55E" strokeWidth={2} fill="url(#gDone)" />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <span className="section-title">Task Status</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="charts-grid" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <span className="section-title">Priority Breakdown</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={priorityData} barSize={28}>
                <XAxis dataKey="priority" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="section-header" style={{ marginBottom: 12 }}>
              <span className="section-title">Projects</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewProject(true)}><Plus size={12}/> New Project</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.slice(0, 4).map(p => {
                const pct = p.task_count ? Math.round(((p.done_count || 0) / p.task_count) * 100) : 0;
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="project-dot" style={{ background: p.color }} />
                        {p.name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>No projects yet</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewProject(true)}><Plus size={12} /> Create First Project</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="row">
          <div className="card">
            <div className="section-header">
              <span className="section-title">Recent Tasks</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewTask(true)}><Plus size={12}/> New Task</button>
            </div>
            <div className="activity-feed">
              {tasks.slice(0, 6).map(t => (
                <div key={t.id} className="activity-item">
                  <div className="activity-dot" style={{ background: STATUS_COLORS[t.status] }} />
                  <div>
                    <div className="activity-text"><strong>{t.title}</strong>{t.project_name && <span> · {t.project_name}</span>}</div>
                    <div className="activity-time">{format(parseISO(t.created_at), 'MMM d, h:mm a')}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '20px 0' }}>No tasks yet</div>}
            </div>
          </div>
          <div className="card" style={{ maxWidth: 260, flexShrink: 0 }}>
            <div className="section-header" style={{ marginBottom: 14 }}>
              <span className="section-title">Team</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(u => {
                const assigned = tasks.filter(t => t.assignee_id === u.id).length;
                return (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ background: u.avatar_color }}>{u.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{assigned} tasks</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--surface-2)', borderRadius: 99, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{u.role}</span>
                  </div>
                );
              })}
              {users.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No team members</div>}
            </div>
          </div>
        </div>
      </div>

      {showNewTask && (
        <NewTaskModal
          projects={projects}
          users={users}
          onClose={() => setShowNewTask(false)}
          onCreated={t => { setTasks(prev => [t, ...prev]); setShowNewTask(false); }}
        />
      )}
      {showNewProject && (
        <NewProjectPanel
          onClose={() => setShowNewProject(false)}
          onCreated={p => { setProjects(prev => [p, ...prev]); setShowNewProject(false); }}
        />
      )}
    </>
  );
}
