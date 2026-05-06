import React, { useState } from 'react';

export default function SourcesTab({ feeds, onToggle, onAdd }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onAdd({ name, url, category: category || 'General' });
      setName('');
      setUrl('');
      setCategory('');
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sources-view">
      <div className="section-header">
        <span className="section-title">RSS Sources</span>
        <button className="add-feed-btn" onClick={() => setShowModal(true)}>
          + Add Feed
        </button>
      </div>

      <div className="feed-list">
        {feeds.map((feed) => (
          <div key={feed.id} className="feed-card">
            <div className="feed-card-left">
              <div className="feed-card-name">{feed.name}</div>
              <div className="feed-card-url">{feed.url}</div>
            </div>
            <div className="feed-card-meta">
              <span className="category-badge">{feed.category}</span>
              <button
                className={`toggle-feed-btn ${feed.is_active ? 'active' : ''}`}
                onClick={() => onToggle(feed.id)}
              >
                {feed.is_active ? 'Active' : 'Paused'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add RSS Feed</div>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. TechCrunch"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Feed URL</label>
                <input
                  className="form-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  type="url"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. AI Research"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Adding…' : 'Add Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
