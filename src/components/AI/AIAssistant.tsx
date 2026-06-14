import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Zap, ListTodo, AlignLeft, Brain, Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface Message { role: 'user' | 'ai'; text: string; }

interface Props { tasks?: any[]; }

export default function AIAssistant({ tasks = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(prompt?: string) {
    const text = prompt || input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      let aiText = '';
      if (text.toLowerCase().includes('standup')) {
        const { standup } = await api.ai.standup(tasks);
        aiText = standup;
      } else if (text.toLowerCase().includes('priorit') || text.toLowerCase().includes('focus')) {
        const { insight } = await api.ai.insight(tasks);
        aiText = insight;
      } else if (text.toLowerCase().includes('break') || text.toLowerCase().includes('subtask')) {
        aiText = 'Please use "Break Down Task" button in the task panel (click ✨ next to description) for per-task breakdown.';
      } else {
        const { insight } = await api.ai.insight(tasks);
        aiText = insight;
      }
      setMessages(m => [...m, { role: 'ai', text: aiText }]);
    } catch (err: any) {
      setMessages(m => [...m, { role: 'ai', text: `⚠ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { icon: AlignLeft, label: 'Daily Standup', prompt: 'Generate my daily standup' },
    { icon: Brain, label: 'What to focus on?', prompt: 'What should I prioritize today?' },
    { icon: ListTodo, label: 'Task insight', prompt: 'Give me priority insight for my tasks' },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 300,
          width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--yellow)', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(245,197,24,0.4)',
          transition: 'transform .2s, box-shadow .2s',
        }}
        title="Iris AI Assistant"
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, width: 360, zIndex: 299,
          background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', maxHeight: 480,
          animation: 'slideUp .25s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="#000" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Iris AI</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Powered by Gemini · Free</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>Quick actions:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {quickActions.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => send(prompt)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
                        cursor: 'pointer', color: 'var(--text-1)', fontSize: 12, textAlign: 'left',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--yellow)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <Icon size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? 'var(--yellow)' : 'var(--surface-2)',
                color: m.role === 'user' ? '#000' : 'var(--text-1)',
                fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            ))}

            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '12px 12px 12px 2px' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--yellow)' }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(); }}
            style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}
          >
            <input
              className="input"
              style={{ flex: 1, fontSize: 12 }}
              placeholder="Ask Iris anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
