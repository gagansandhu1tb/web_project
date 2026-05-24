import { useMemo } from 'react';

function Analytics({ issues, onDownloadCsv }) {
  const totals = useMemo(() => {
    return issues.reduce(
      (acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        acc.cats[issue.category] = (acc.cats[issue.category] || 0) + 1;
        acc.buildings[issue.building] = (acc.buildings[issue.building] || 0) + 1;
        return acc;
      },
      { cats: {}, buildings: {} }
    );
  }, [issues]);

  const resolved = useMemo(
    () => issues.filter((i) => i.status === 'Resolved' && i.resolvedAt),
    [issues]
  );

  const categoryStats = Object.entries(totals.cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCategory = categoryStats[0]?.[1] || 1;

  const avgHours = resolved.length
    ? resolved.reduce((sum, issue) => sum + Math.max(0, new Date(issue.resolvedAt) - new Date(issue.reportedAt || issue.createdAt)), 0) / resolved.length / 36e5
    : 0;

  return (
    <section className="panel">
      <div className="panel-title"><span className="icon">📊</span> Campus Summary</div>

      <div className="stats-row">
        <div className="stat-card blue">
          <div className="num">{issues.length}</div>
          <div className="lbl">Total Reports</div>
        </div>
        <div className="stat-card amber">
          <div className="num">{totals['New'] || 0}</div>
          <div className="lbl">New</div>
        </div>
        <div className="stat-card teal">
          <div className="num">{totals['In Progress'] || 0}</div>
          <div className="lbl">In Progress</div>
        </div>
        <div className="stat-card green">
          <div className="num">{totals['Resolved'] || 0}</div>
          <div className="lbl">Resolved</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-head">
          <div className="chart-title">Category breakdown</div>
          <div className="chart-subtitle">Top categories from all reports</div>
        </div>

        {categoryStats.length > 0 ? (
          categoryStats.map(([category, count]) => (
            <div key={category} className="category-row">
              <div className="category-label">{category}</div>
              <div className="category-bar-track">
                <div
                  className="category-bar-fill"
                  style={{ width: `${(count / maxCategory) * 100}%` }}
                />
              </div>
              <div className="category-value">{count}</div>
            </div>
          ))
        ) : (
          <div className="chart-empty">No category data yet. Submit a report to populate the dashboard.</div>
        )}
      </div>

      <div className="resolution-info">
        ⏱ Avg resolution time:{' '}
        <span>{resolved.length ? `${avgHours.toFixed(1)} hrs` : 'No resolved reports yet'}</span>
      </div>

      <button className="btn-csv" onClick={onDownloadCsv}>
        ⬇ Download CSV Report
      </button>
    </section>
  );
}

export default Analytics;
