import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function Guidance() {
  const [tips, setTips] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/guidance`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setTips)
      .catch(() => setError('Unable to load guidance from the server.'));
  }, []);

  return (
    <section className="panel" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="panel-title"><span className="icon">💡</span> Reporting Guidance</div>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Follow these tips to make your report complete, clear, and easy to action for the maintenance team.
      </p>
      {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
      <div className="guidance-grid">
        {tips.map((item, i) => (
          <div className="guidance-card" key={i}>
            <div className="guidance-num">{i + 1}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Guidance;
