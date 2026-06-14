import { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, Info, TrendingDown, CheckCircle, RefreshCw, Loader2, ChevronRight, X } from 'lucide-react';
import { api } from '../../lib/api';
import { isBefore, parseISO, addDays } from 'date-fns';

interface Task { id: string; title: string; status: string; priority: string; due_date?: string; assignee_id?: string; project_name?: string; }
interface Project { id: string; name: string; due_date?: string; task_count?: number; done_count?: number; }

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  detail: string;
  ai?: boolean;
}

interface Digest {
  headline?: string;
  priority_task?: string;
  priority_reason?: string;
  risk?: string;
  tip?: string;
}

const DIGEST_KEY = 'iris_digest';

function getTodayKey() { return new Date().toISOString().slice(0, 10); }

function loadCachedDigest(): Digest | null {
  try {
    const raw = localStorage.getItem(DIGEST_KEY);
    if (!raw) return null;
    const { key, data } = JSON.parse(raw);
    if (key !== getTodayKey()) return null;
    return data;
  } catch { return null; }
}

function saveDigest(data: Digest) {
  localStorage.setItem(DIGEST_KEY, JSON.stringify({ key: getTodayKey(), data }));
}

function buildAlerts(tasks: Task[], projects: Project[], switches: number): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  const overdueTasks = tasks.filter(t => t.due_date && t.status !== 'done' && isBefore(parseISO(t.due_date), now));
  if (overdueTasks.length > 0) {
    alerts.push({
      id: 'overdue',
      type: overdueTasks.length >= 3 ? 'danger' : 'warning',
      title: `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
      detail: overdueTasks.slice(0, 2).map(t => t.title).join(', ') + (overdueTasks.length > 2 ? ` +${overdueTasks.length - 2} more` : ''),
    });
  }

  const urgentOpen = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  if (urgentOpen.length > 0) {
    alerts.push({
      id: 'urgent',
      type: 'danger',
      title: `${urgentOpen.length} urgent task${urgentOpen.length > 1 ? 's' : ''} open`,
      detail: urgentOpen[0].title + (urgentOpen.length > 1 ? ` and ${urgentOpen.length - 1} more` : ''),
    });
  }

  const dueSoon = tasks.filter(t => t.due_date && t.status !== 'done' && !isBefore(parseISO(t.due_date), now) && isBefore(parseISO(t.due_date), addDays(now, 2)));
  if (dueSoon.length > 0) {
    alerts.push({
      id: 'due-soon',
      type: 'warning',
      title: `${dueSoon.length} task${dueSoon.length > 1 ? 's' : ''} due within 48h`,
      detail: dueSoon.map(t => t.title).slice(0, 2).join(', '),
    });
  }

  const inReview = tasks.filter(t => t.status === 'review');
  if (inReview.length >= 3) {
    alerts.push({
      id: 'review-pile',
      type: 'warning',
      title: `${inReview.length} tasks stuck in Review`,
      detail: 'Clear the review queue to unblock your team',
    });
  }

  const unassigned = tasks.filter(t => !t.assignee_id && t.status !== 'done');
  if (unassigned.length >= 4) {
    alerts.push({
      id: 'unassigned',
      type: 'info',
      title: `${unassigned.length} tasks have no assignee`,
      detail: 'Assign ownership to prevent tasks from slipping',
    });
  }

  projects.forEach(p => {
    if (p.due_date && p.task_count && p.task_count > 0) {
      const pct = Math.round(((p.done_count || 0) / p.task_count) * 100);
      const daysLeft = Math.ceil((parseISO(p.due_date).getTime() - now.getTime()) / 86400000);
      if (daysLeft > 0 && daysLeft <= 7 && pct < 50) {
        alerts.push({
          id: `project-risk-${p.id}`,
          type: 'danger',
          title: `"${p.name}" at risk`,
          detail: `Due in ${daysLeft}d but only ${pct}% complete`,
        });
      }
    }
  });

  if (switches > 12) {
    alerts.push({
      id: 'ctx-switches',
      type: 'warning',
      title: 'High context switching today',
      detail: `${switches} switches detected — batch similar tasks to reclaim focus`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      type: 'success',
      title: 'All clear — great shape today',
      detail: 'No overdue tasks, no urgent blockers. Keep the momentum.',
    });
  }

  return alerts;
}

const ALERT_ICONS = { danger: AlertTriangle, warning: AlertTriangle, info: Info, success: CheckCircle };
const ALERT_COLORS = { danger: '#FF4D4D', warning: '#F5C518', info: '#3B82F6', success: '#22C55E' };

interface Props { tasks: Task[]; projects: Project[]; }

export default function DashboardInsights({ tasks, projects }: Props) {
  const [digest, setDigest] = useState<Digest | null>(loadCachedDigest);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('iris_dismissed_alerts') || '[]')); } catch { return new Set(); }
  });

  const switches = (() => { try { const d = JSON.parse(localStorage.getItem('iris_ctx_switches') || '{}'); return d[getTodayKey()] || 0; } catch { return 0; } })();
  const pomodoros = (() => { try { const d = JSON.parse(localStorage.getItem('iris_pomodoros') || '{}'); return d[getTodayKey()] || 0; } catch { return 0; } })();
  const focusScore = Math.max(0, Math.min(100, Math.min(pomodoros * 20, 60) - Math.min(switches * 4, 30) + 10));

  const alerts = buildAlerts(tasks, projects, switches).filter(a => !dismissed.has(a.id));

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem('iris_dismissed_alerts', JSON.stringify([...next]));
  }

  async function fetchDigest(force = false) {
    if (!force && digest) return;
    setLoading(true);
    try {
      const { digest: d } = await api.ai.digest(tasks, projects, { pomodoros, switches, score: focusScore });
      setDigest(d);
      saveDigest(d);
    } catch {
      setAiEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tasks.length > 0 && !digest) {
      fetchDigest();
    }
  }, [tasks.length]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

      {/* AI Daily Digest */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} style={{ color: 'var(--yellow)' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Iris AI — Daily Digest</span>
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 99, color: 'var(--text-3)' }}>1×/day</span>
          </div>
          <button
            onClick={() => fetchDigest(true)}
            disabled={loading}
            title="Refresh digest (uses 1 AI credit)"
            style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 6px', borderRadius: 6 }}
          >
            {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={12} />}
            Refresh
          </button>
        </div>

        {!aiEnabled && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 0', lineHeight: 1.7 }}>
            Add <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>GEMINI_API_KEY</code> to <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4 }}>.env</code> to enable AI insights.{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--yellow)' }}>Get a free key →</a>
          </div>
        )}

        {loading && !digest && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: 'var(--text-3)', fontSize: 12 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--yellow)' }} />
            Analysing your workspace…
          </div>
        )}

        {digest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {digest.headline && (
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4, borderLeft: '3px solid var(--yellow)', paddingLeft: 10 }}>
                {digest.headline}
              </div>
            )}

            {digest.priority_task && (
              <div style={{ padding: '10px 12px', background: 'rgba(245,197,24,0.06)', borderRadius: 8, border: '1px solid rgba(245,197,24,0.15)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Focus on first</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{digest.priority_task}</div>
                {digest.priority_reason && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{digest.priority_reason}</div>}
              </div>
            )}

            {digest.risk && (
              <div style={{ padding: '8px 12px', background: 'rgba(255,77,77,0.06)', borderRadius: 8, border: '1px solid rgba(255,77,77,0.15)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={13} style={{ color: '#FF4D4D', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#FF4D4D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Risk</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{digest.risk}</div>
                </div>
              </div>
            )}

            {digest.tip && (
              <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <TrendingDown size={13} style={{ color: '#3B82F6', marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{digest.tip}</div>
              </div>
            )}

            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
              Cached today · refreshes tomorrow · <span style={{ color: 'var(--yellow)' }}>1 credit/day</span>
            </div>
          </div>
        )}

        {!digest && !loading && aiEnabled && tasks.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            Create some tasks and projects — Iris AI will generate your daily digest.
          </div>
        )}
      </div>

      {/* Smart Alerts */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,77,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={13} style={{ color: '#FF4D4D' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Smart Alerts</span>
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 99, color: 'var(--text-3)' }}>rule-based · 0 credits</span>
          </div>
          {dismissed.size > 0 && (
            <button
              onClick={() => { setDismissed(new Set()); localStorage.removeItem('iris_dismissed_alerts'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 11 }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(alert => {
            const Icon = ALERT_ICONS[alert.type];
            const color = ALERT_COLORS[alert.type];
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
                  background: `${color}08`, borderRadius: 8, border: `1px solid ${color}20`,
                  position: 'relative',
                }}
              >
                <Icon size={13} style={{ color, marginTop: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{alert.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{alert.detail}</div>
                </div>
                {alert.id !== 'all-clear' && (
                  <button
                    onClick={() => dismiss(alert.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, flexShrink: 0, marginTop: 1 }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>All alerts dismissed. <button onClick={() => { setDismissed(new Set()); localStorage.removeItem('iris_dismissed_alerts'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--yellow)', fontSize: 12 }}>Reset</button></div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
