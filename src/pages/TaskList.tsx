import { useEffect, useState } from 'react';
import { Trash2, Calendar, Search, Filter } from 'lucide-react';
import Header from '../components/Layout/Header';
import NewTaskModal from '../components/Tasks/NewTaskModal';
import { api } from '../lib/api';
import { Task, Project, User, TaskStatus, TaskPriority } from '../types';
import { format, parseISO, isPast } from 'date-fns';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'overdue'>('all');

  useEffect(() => {
    Promise.all([api.tasks.list(), api.projects.list(), api.users.list()])
      .then(([t, p, u]) => { setTasks(t); setProjects(p); setUsers(u); });
  }, []);

  async function deleteTask(id: string) {
    await api.tasks.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function updateStatus(id: string, status: TaskStatus) {
    const updated = await api.tasks.update(id, { status });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  }

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterProject && t.project_id !== filterProject) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (activeTab === 'overdue') return t.due_date && t.status !== 'done' && isPast(parseISO(t.due_date));
    return true;
  });

  const counts = {
    all: tasks.length,
    mine: tasks.length,
    overdue: tasks.filter(t => t.due_date && t.status !== 'done' && isPast(parseISO(t.due_date))).length,
  };

  return (
    <>
      <Header title="Task List" onNewTask={() => setShowNewTask(true)} />
      <div className="page-body fade-in">

        {/* Tabs */}
        <div className="tabs">
          {(['all', 'mine', 'overdue'] as const).map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 5, opacity: 0.6 }}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30 }}
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 160 }} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="input" style={{ width: 130 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="task-list-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const overdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
                return (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                      {task.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {task.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                        </div>
                      )}
                    </td>
                    <td>
                      {task.project_name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                          <span className="project-dot" style={{ background: task.project_color || '#F5C518' }} />
                          {task.project_name}
                        </span>
                      )}
                    </td>
                    <td>
                      {task.assignee_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="avatar" style={{ background: task.assignee_color || '#F5C518', width: 24, height: 24, fontSize: 10 }}>
                            {initials(task.assignee_name)}
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{task.assignee_name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      <select
                        className="input"
                        style={{ width: 130, padding: '4px 8px', fontSize: 12 }}
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td>
                      {task.due_date ? (
                        <span style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          {overdue && ' ⚠'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28, border: 'none', color: 'var(--text-3)' }}
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No tasks found</h3>
              <p>Create your first task or adjust filters</p>
            </div>
          )}
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
    </>
  );
}
