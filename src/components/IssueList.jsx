import { useMemo, useState } from 'react';

function statusBadge(status) {
  if (status === 'New') return 'badge-new';
  if (status === 'In Progress') return 'badge-inprogress';
  return 'badge-resolved';
}

function IssueList({ issues, onUpdate, loading }) {
  const [commentInput, setCommentInput] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(issues.map((i) => i.category))], [issues]);

  const filtered = issues.filter((i) => {
    const s = statusFilter === 'All' || i.status === statusFilter;
    const c = categoryFilter === 'All' || i.category === categoryFilter;
    return s && c;
  });

  const updateStatus = (id, status) => onUpdate(id, { status });

  const addComment = (id) => {
    const text = commentInput[id]?.trim();
    if (!text) return;
    const issue = issues.find((i) => i._id === id);
    onUpdate(id, { comments: [...(issue.comments || []), text] });
    setCommentInput({ ...commentInput, [id]: '' });
  };

  return (
    <section className="panel">
      <div className="panel-title"><span className="icon">📋</span> Reported Issues</div>

      <div className="issue-controls">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>New</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          No issues match the selected filters.
        </div>
      ) : (
        <div className="issue-grid">
          {filtered.map((issue) => (
            <article key={issue._id} className="issue-card">
              <div className="card-top">
                <span className="card-category">{issue.category}</span>
                <span className={`status-badge ${statusBadge(issue.status)}`}>{issue.status}</span>
              </div>
              <p className="card-meta">📍 {issue.building} — {issue.location}</p>
              <p className="card-desc">{issue.description}</p>
              {(issue.photoUrl || issue.locationGeo) && (
                <div className="card-links">
                  {issue.photoUrl && (
                    <a href={issue.photoUrl} target="_blank" rel="noreferrer">📷 View photo</a>
                  )}
                  {issue.locationGeo && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${issue.locationGeo.lat}&mlon=${issue.locationGeo.lon}#map=18/${issue.locationGeo.lat}/${issue.locationGeo.lon}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🗺 View on map
                    </a>
                  )}
                </div>
              )}
              <p className="card-time">
                Reported: {new Date(issue.reportedAt || issue.createdAt).toLocaleString()}
                {issue.resolvedAt && ` · Resolved: ${new Date(issue.resolvedAt).toLocaleString()}`}
              </p>
              <div className="card-actions">
                <button className="btn-action progress" onClick={() => updateStatus(issue._id, 'In Progress')}>
                  ⏳ In Progress
                </button>
                <button className="btn-action resolve" onClick={() => updateStatus(issue._id, 'Resolved')}>
                  ✅ Resolved
                </button>
              </div>
              <div className="comment-box">
                <input
                  type="text"
                  value={commentInput[issue._id] || ''}
                  onChange={(e) => setCommentInput({ ...commentInput, [issue._id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addComment(issue._id)}
                  placeholder="Add a status note…"
                />
                <button className="btn-add-comment" onClick={() => addComment(issue._id)}>Add</button>
              </div>
              {issue.comments?.length > 0 && (
                <ul className="comment-list">
                  {issue.comments.map((c, idx) => <li key={idx}>{c}</li>)}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default IssueList;
