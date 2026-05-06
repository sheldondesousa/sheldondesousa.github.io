import React from 'react';

export default function FilterBar({ categories, activeCategory, setActiveCategory, showUnread, setShowUnread }) {
  return (
    <div className="filter-bar">
      <div className="filter-section-label">Category</div>
      <div className="filter-chips">
        <button
          className={`chip ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <label className="unread-toggle">
        <div
          className={`toggle-switch ${showUnread ? 'on' : ''}`}
          onClick={() => setShowUnread((v) => !v)}
        >
          <div className="toggle-knob" />
        </div>
        <span className="toggle-label">Unread only</span>
      </label>
    </div>
  );
}
