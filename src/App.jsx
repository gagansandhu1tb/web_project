import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import IssueForm from './components/IssueForm.jsx';
import IssueList from './components/IssueList.jsx';
import Guidance from './components/Guidance.jsx';
import Analytics from './components/Analytics.jsx';
import UserManagement from './components/UserManagement.jsx';
import Login from './components/Login.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function App() {
  const [issues, setIssues] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('ok');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('fixmycampusAuth');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      setUser(parsed.user);
      setToken(parsed.token);
    }
    loadIssues();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(''), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const showFeedback = (msg, type = 'ok') => {
    setFeedback(msg);
    setFeedbackType(type);
  };

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const loadIssues = async () => {
    if (!token) {
      setIssues([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/issues`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error('Unable to load reports. Please login first.');
      }
      setIssues(await res.json());
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addIssue = async (issue) => {
    try {
      const res = await fetch(`${API_BASE}/api/issues`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(issue)
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Failed');
      setIssues([saved, ...issues]);
      showFeedback('Report submitted successfully.');
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const updateIssue = async (id, changes) => {
    try {
      const res = await fetch(`${API_BASE}/api/issues/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(changes)
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed');
      setIssues(issues.map((i) => (i._id === id ? updated : i)));
      showFeedback('Report updated.');
    } catch (e) {
      showFeedback(e.message, 'error');
    }
  };

  const createUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Unable to create user');
      }
      showFeedback(`User ${payload.email} created successfully.`);
      return payload;
    } catch (error) {
      showFeedback(error.message, 'error');
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Login failed.');
      }
      setUser(payload.user);
      setToken(payload.token);
      localStorage.setItem('fixmycampusAuth', JSON.stringify(payload));
      showFeedback(`Welcome back, ${payload.user.name}!`);
      await loadIssues();
      return true;
    } catch (error) {
      showFeedback(error.message, 'error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('fixmycampusAuth');
    setIssues([]);
    showFeedback('You have been logged out.');
  };

  const downloadCsv = () => {
    if (!issues.length) return;
    const headers = ['Category', 'Building', 'Location', 'Status', 'Reported At', 'Resolved At', 'Reporter', 'Description'];
    const rows = issues.map((i) => [
      i.category, i.building, i.location, i.status,
      new Date(i.reportedAt || i.createdAt).toLocaleString(),
      i.resolvedAt ? new Date(i.resolvedAt).toLocaleString() : '',
      i.reporterEmail || 'anonymous',
      i.description.replace(/"/g, '""')
    ].map((v) => `"${v}"`).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fixmycampus-reports.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showFeedback('CSV downloaded.');
  };

  const Guard = ({ children }) => user ? children : <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">🔧</div>
          <div className="brand-text">
            <h1>FixMyCampus</h1>
            <p>Maintenance reporting platform</p>
          </div>
        </div>
        {user && (
          <div className="header-right">
            <div className="user-badge">
              <div className="user-dot" />
              <div>
                <strong>{user.name}</strong>
                <div>{user.email} · {user.role}</div>
              </div>
            </div>
            <nav className="app-nav">
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/report">Report</NavLink>
              <NavLink to="/guidance">Guidance</NavLink>
              {user?.role === 'admin' && <NavLink to="/users">Users</NavLink>}
            </nav>
            <button className="btn-logout" onClick={logout}>Sign out</button>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="/" element={
            <Guard>
              <div className="dashboard-grid">
                <Analytics issues={issues} onDownloadCsv={downloadCsv} />
                <IssueList issues={issues} onUpdate={updateIssue} loading={loading} />
              </div>
            </Guard>
          } />
          <Route path="/users" element={
            <Guard>
              <UserManagement token={token} onCreateUser={createUser} />
            </Guard>
          } />
          <Route path="/report" element={
            <Guard>
              <div className="report-wrap">
                <IssueForm onAddIssue={addIssue} showFeedback={showFeedback} />
              </div>
            </Guard>
          } />
          <Route path="/guidance" element={<Guard><Guidance /></Guard>} />
          <Route path="*" element={user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        {feedback ? (
          <div className={`footer-feedback ${feedbackType === 'error' ? 'error' : ''}`}>
            {feedbackType === 'error' ? '⚠ ' : '✓ '}{feedback}
          </div>
        ) : <div />}
        <p className="footer-note">Secure · Privacy-aware · Campus-focused</p>
      </footer>
    </div>
  );
}

export default App;
