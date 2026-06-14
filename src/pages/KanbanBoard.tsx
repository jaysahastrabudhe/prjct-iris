import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import Header from '../components/Layout/Header';
import NewTaskModal from '../components/Tasks/NewTaskModal';
import { api } from '../lib/api';
import { Task, Project, User, TaskStatus } from '../types';
import { format, isPast, parseISO, differenceInDays } from 'date-fns';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#606060' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { id: 'review', label: 'Review', color: '#A855F7' },
  { id: 'done', label: 'Done', color: '#22C55E' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([api.tasks.list(), api.projects.list(), api.users.list()])
      .then(([t, p, u]) => { setTasks(t); setProjects(p); setUsers(u); });
  }, []);

  const filtered = tasks.filter(t =>
    !filter || t.project_id === filter
  );

  function tasksByStatus(status: TaskStatus) {
    return filtered.filter(t => t.status === status).sort((a, b) => a.position - b.position);
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;

    setTasks(prev =>
      prev.map(t =>
        t.id === draggableId
          ? { ...t, status: newStatus, position: destination.index }
          : t
      )
    );

    await api.tasks.update(draggableId, { status: newStatus, position: destination.index });
  }

  function dueDateStyle(due?: string): string {
    if (!due) return '';
    const d = parseISO(due);
    if (isPast(d)) return 'overdue';
    if (differenceInDays(d, new Date()) <= 1) return 'soon';
    return '';
  }

  function ageBadge(updatedAt: string) {
    const days = differenceInDays(new Date(), parseISO(updatedAt));
    if (days < 2) return null;
    const cls = days >= 7 ? 'critical' : days >= 3 ? 'stale' : '';
    const label = days >= 7 ? `${days}d ⚠` : `${days}d`;
    return <span className={`age-badge ${cls}`}>{label}</span>;
  }

  return (
    <>
      <Header title="Kanban Board" onNewTask={() => { setNewTaskStatus('todo'); setShowNewTask(true); }} />
      <div className="page-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: 'calc(100vh - 60px)' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0 }}>
          <select
            className="input"
            style={{ width: 200 }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map(col => {
              const colTasks = tasksByStatus(col.id);
              return (
                <div key={col.id} className="kanban-col">
                  <div className="kanban-col-header">
                    <div className="col-dot" style={{ background: col.color }} />
                    <span className="kanban-col-title">{col.label}</span>
                    <span className="kanban-col-count">{colTasks.length}</span>
                    <button
                      className="icon-btn"
                      style={{ width: 24, height: 24, marginLeft: 4, border: 'none', background: 'transparent' }}
                      onClick={() => { setNewTaskStatus(col.id); setShowNewTask(true); }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`kanban-cards ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => (
                              <div
                                className={`task-card ${snap.isDragging ? 'dragging' : ''}`}
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 10 }}>
                                  <div className="task-card-title" style={{ marginBottom: 0, flex: 1 }}>{task.title}</div>
                                  {ageBadge(task.updated_at)}
                                </div>
                                <div className="task-card-meta">
                                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                                  {task.project_name && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
                                      <span className="project-dot" style={{ background: task.project_color || '#F5C518' }} />
                                      {task.project_name}
                                    </span>
                                  )}
                                  {task.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                  ))}
                                </div>
                                <div className="task-card-footer">
                                  {task.due_date ? (
                                    <div className={`due-date ${dueDateStyle(task.due_date)}`}>
                                      <Calendar size={10} />
                                      {format(parseISO(task.due_date), 'MMM d')}
                                    </div>
                                  ) : <div />}
                                  {task.assignee_name && (
                                    <div
                                      className="avatar"
                                      style={{ background: task.assignee_color || '#F5C518', width: 22, height: 22, fontSize: 9 }}
                                      data-tooltip={task.assignee_name}
                                    >
                                      {initials(task.assignee_name)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div
                            className="kanban-empty"
                            onClick={() => { setNewTaskStatus(col.id); setShowNewTask(true); }}
                          >
                            <Plus size={13} />
                            Add task to {col.label}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {showNewTask && (
        <NewTaskModal
          projects={projects}
          users={users}
          defaultStatus={newTaskStatus}
          onClose={() => setShowNewTask(false)}
          onCreated={t => { setTasks(prev => [...prev, t]); setShowNewTask(false); }}
        />
      )}
    </>
  );
}
