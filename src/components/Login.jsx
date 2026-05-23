import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    const success = await onLogin({ email, password });
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="login-shell">
      <section className="panel login-panel">
        <div className="login-logo">🔧</div>
        <h2>FixMyCampus</h2>
        <p>Sign in with your campus credentials to report and track maintenance issues.</p>
        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@stmarys.ac.uk"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>
          <button className="btn-login" type="submit">Continue to Dashboard →</button>
        </form>
        <p className="login-note">
          🔒 Your session is stored locally on this device only. Reports are stored securely and handled in accordance with campus data policy.
        </p>
      </section>
    </div>
  );
}

export default Login;
