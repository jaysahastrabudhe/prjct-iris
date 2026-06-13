import { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import Header from '../components/Layout/Header';
import { api } from '../lib/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_BADGE: Record<string, string> = {
  admin: '#F5C518',
  manager: '#A855F7',
  member: '#3B82F6',
};

export default function Team() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', password: '', role: 'member' });
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    api.users.list().then(setUsers);
  }, []);

  async function deleteUser(id: string) {
    if (!confirm('Remove this team member?')) return;
    await api.users.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function changeRole(id: string, role: string) {
    const updated = await api.users.update(id, { role });
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      const { user } = await api.auth.register(inviteForm.email, inviteForm.name, inviteForm.password, inviteForm.role);
      setUsers(prev => [...prev, user]);
      setShowInvite(false);
      setInviteForm({ email: '', name: '', password: '', role: 'member' });
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  }

  const isAdmin = me?.role === 'admin';

  return (
    <>
      <Header title="Team" />
      <div className="page-body fade-in">

        <div className="section-header" style={{ marginBottom: 20 }}>
          <div>
            <span className="section-title">Team Members</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 10 }}>
              {users.length} member{users.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
              <Plus size={14} /> Add Member
            </button>
          )}
        </div>

        <div className="team-grid">
          {users.map(user => (
            <div key={user.id} className="team-card">
              <div className="avatar avatar-lg" style={{ background: user.avatar_color }}>
                {initials(user.name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: `${ROLE_BADGE[user.role]}20`,
                  color: ROLE_BADGE[user.role],
                  fontFamily: 'var(--font-mono)',
                }}>
                  {user.role === 'admin' && <Shield size={10} />}
                  {user.role}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Joined {format(parseISO(user.created_at), 'MMM yyyy')}
              </div>

              {isAdmin && user.id !== me?.id && (
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <select
                    className="input"
                    style={{ width: 110, padding: '4px 8px', fontSize: 11 }}
                    value={user.role}
                    onChange={e => changeRole(user.id, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteUser(user.id)}
                    style={{ padding: '4px 8px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              {user.id === me?.id && (
                <span style={{ fontSize: 10, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>YOU</span>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><UserIcon size={40} /></div>
            <h3>No team members yet</h3>
            <p>Invite your social media team to get started</p>
          </div>
        )}
      </div>

      {showInvite && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="modal fade-in">
            <div className="modal-header">
              <span className="modal-title">Add Team Member</span>
              <button className="icon-btn" onClick={() => setShowInvite(false)}>✕</button>
            </div>
            <form onSubmit={invite}>
              <div className="modal-body">
                {inviteError && <div className="auth-error">{inviteError}</div>}
                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input className="input" placeholder="Full name" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="input" type="email" placeholder="email@agency.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Temporary Password</label>
                  <input className="input" type="password" placeholder="min 6 characters" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select className="input" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
                  {inviteLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Plus size={13} />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
