import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import TaskList from './pages/TaskList';
import Team from './pages/Team';
import Focus from './pages/Focus';
import AIAssistant from './components/AI/AIAssistant';

function Spinner() {
  return (
    <div className="loading-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'var(--yellow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h9M2 14h6" stroke="#000" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="14" cy="13" r="3" fill="#000"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700 }}>PRJCT Iris</span>
      </div>
      <div className="spinner" />
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/team" element={<Team />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <AIAssistant />
    </Layout>
  );
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
