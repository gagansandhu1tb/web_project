import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import IssueForm from './components/IssueForm.jsx';
import IssueList from './components/IssueList.jsx';
import Guidance from './components/Guidance.jsx';
import Analytics from './components/Analytics.jsx';
import Login from './components/Login.jsx';

function App() {
  const [issues, setIssues] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('ok');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('campusfixUser');
    if (storedUser) setUser(JSON.parse(storedUser));
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

  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/issues');
      if (!res.ok) throw new Error();
      setIssues(await res.json());
    } catch {
      showFeedback('Unable to load reports — check backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addIssue = async (issue) => {
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...issue, reporterEmail: user?.email || 'anonymous' })
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
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  const login = ({ email }) => {
    const u = { email };
    setUser(u);
    localStorage.setItem('campusfixUser', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusfixUser');
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
    a.download = 'campusfix-reports.csv';
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
            <h1>CampusFix</h1>
          </div>
        </div>
        {user && (
          <div className="header-right">
            <div className="user-badge">
              <div className="user-dot" />
              {user.email}
            </div>
            <nav className="app-nav">
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/report">Report</NavLink>
              <NavLink to="/guidance">Guidance</NavLink>
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
