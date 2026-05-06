import React from 'react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ArticleCard({ article, onMarkRead }) {
  const isUnread = !article.is_read;

  function handleReadLink(e) {
    e.stopPropagation();
    if (isUnread) onMarkRead(article.id);
  }

  return (
    <div className={`article-card ${isUnread ? 'unread' : ''}`} onClick={() => isUnread && onMarkRead(article.id)}>
      <div className="article-card-top">
        <div className="article-meta">
          {isUnread && <span className="unread-dot" />}
          <span className="source-label">{article.source}</span>
          <span className="category-badge">{article.category}</span>
        </div>
        <span className="article-date">{formatDate(article.published_at)}</span>
      </div>

      <div className="article-title">{article.title}</div>

      <div className="article-summary">
        {article.summary ? (
          article.summary
        ) : (
          <div className="summary-skeleton">
            <div className="skeleton-line" style={{ width: '100%' }} />
            <div className="skeleton-line" style={{ width: '88%' }} />
            <div className="skeleton-line" style={{ width: '72%' }} />
          </div>
        )}
      </div>

      <div className="article-footer">
        <span />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="read-link"
          onClick={handleReadLink}
        >
          Read article →
        </a>
      </div>
    </div>
  );
}
