import { useState } from 'react';

const CATEGORIES = ['Electrical', 'Plumbing', 'Cleaning', 'Accessibility', 'Structural', 'IT / Network', 'Other'];

function IssueForm({ onAddIssue, showFeedback }) {
  const [form, setForm] = useState({
    category: 'Electrical', building: '', location: '', description: '', photoUrl: ''
  });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building.trim() || !form.location.trim() || !form.description.trim()) {
      showFeedback('Please fill in all required fields.', 'error');
      return;
    }
    if (!consent) {
      showFeedback('Please accept the data consent to submit.', 'error');
      return;
    }
    setSubmitting(true);
    await onAddIssue({ ...form });
    setForm({ category: 'Electrical', building: '', location: '', description: '', photoUrl: '' });
    setConsent(false);
    setSubmitting(false);
  };

  return (
    <section className="form-panel">
      <div className="panel-title"><span className="icon">📝</span> Submit a Maintenance Report</div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={set}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="building">Building / Location *</label>
          <input
            id="building"
            name="building"
            value={form.building}
            onChange={set}
            placeholder="e.g. Main Library, Sports Centre"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="location">Room or Campus Reference *</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={set}
            placeholder="e.g. Ground floor, Room 204"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={set}
            placeholder="Describe the issue clearly — what is wrong, when it started, and any safety concerns."
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="photoUrl">Photo URL (optional)</label>
          <input
            id="photoUrl"
            name="photoUrl"
            value={form.photoUrl}
            onChange={set}
            placeholder="https://example.com/photo.jpg"
          />
        </div>
        <div className="consent-box">
          <input
            type="checkbox"
            id="consent"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <p>
            I understand this report will be stored securely in MongoDB. I have not included sensitive personal information in the description, in line with the platform's privacy policy.
          </p>
        </div>
        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </section>
  );
}

export default IssueForm;
