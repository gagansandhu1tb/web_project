import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function UserManagement({ token, onCreateUser }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ name: '', role: 'student' });

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  }), [token]);

  const loadUsers = async () => {
    try {
      setError('');
      const res = await fetch(`${API_BASE}/api/users`, {
        headers
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unable to load users.');
      setUsers(payload);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    }
  };

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await onCreateUser(form);
      setMessage(`Created ${form.role} user ${form.email}`);
      setForm({ name: '', email: '', password: '', role: 'student' });
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Could not create user.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'DELETE',
        headers
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unable to delete user.');
      setMessage(payload.message || 'User removed.');
      setUsers(users.filter((user) => user._id !== id));
    } catch (err) {
      setError(err.message || 'Delete failed.');
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditValues({ name: user.name, role: user.role });
    setMessage('');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ name: '', role: 'student' });
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editValues)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Unable to update user.');
      setUsers(users.map((user) => (user._id === id ? payload : user)));
      setMessage('User updated.');
      cancelEdit();
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  };

  return (
    <div className="user-management-root">
      <section className="panel user-management-panel">
        <div className="panel-title"><span className="icon">👥</span> User Management</div>
        <p className="admin-copy">Create new accounts and manage existing campus users.</p>
        {message && <div className="admin-status success">{message}</div>}
        {error && <div className="admin-status error">{error}</div>}
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="user-name">Full name</label>
            <input
              id="user-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="user-email">Email address</label>
            <input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@stmarys.ac.uk"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Choose a strong password"
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="user-role">User role</label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn-submit" type="submit">Create account</button>
        </form>
      </section>

      <section className="panel user-list-panel">
        <div className="panel-title"><span className="icon">📋</span> Existing Users</div>
        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    {editingId === user._id ? (
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {editingId === user._id ? (
                      <select
                        value={editValues.role}
                        onChange={(e) => setEditValues({ ...editValues, role: e.target.value })}
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="user-actions">
                    {editingId === user._id ? (
                      <>
                        <button type="button" className="btn-small" onClick={() => saveEdit(user._id)}>Save</button>
                        <button type="button" className="btn-small btn-cancel" onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn-small" onClick={() => startEdit(user)}>Edit</button>
                        <button type="button" className="btn-small btn-danger" onClick={() => handleDelete(user._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-row">No users found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default UserManagement;
