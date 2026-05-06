import React, { useState, useEffect, useCallback } from 'react';
import ArticleCard from './components/ArticleCard.jsx';
import FilterBar from './components/FilterBar.jsx';
import SchedulerPanel from './components/SchedulerPanel.jsx';
import SourcesTab from './components/SourcesTab.jsx';

const API = '/api';

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function App() {
  const [activeTab, setActiveTab] = useState('digest'); // 'digest' | 'sources'
  const [articles, setArticles] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showUnread, setShowUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (showUnread) params.set('unread', 'true');
      const data = await apiFetch(`/articles?${params}`);
      setArticles(data);
    } catch (err) {
      setError(err.message);
    }
  }, [activeCategory, showUnread]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [arts, feedList, cats, stat] = await Promise.all([
        apiFetch('/articles'),
        apiFetch('/feeds'),
        apiFetch('/categories'),
        apiFetch('/status'),
      ]);
      setArticles(arts);
      setFeeds(feedList);
      setCategories(cats);
      setStatus(stat);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Re-fetch articles when filters change
  useEffect(() => {
    if (!loading) loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, showUnread]);

  // Poll status while refreshing to update UI
  useEffect(() => {
    if (!status?.isRefreshing) return;
    const interval = setInterval(async () => {
      try {
        const stat = await apiFetch('/status');
        setStatus(stat);
        if (!stat.isRefreshing) {
          // Refresh done — reload articles
          await loadArticles();
          const cats = await apiFetch('/categories');
          setCategories(cats);
        }
      } catch (_) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [status?.isRefreshing, loadArticles]);

  async function handleRefresh() {
    try {
      await apiFetch('/refresh', { method: 'POST' });
      const stat = await apiFetch('/status');
      setStatus(stat);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkRead(id) {
    try {
      await apiFetch(`/articles/${id}/read`, { method: 'PATCH' });
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleFeed(id) {
    try {
      const updated = await apiFetch(`/feeds/${id}/toggle`, { method: 'PATCH' });
      setFeeds((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddFeed(data) {
    const feed = await apiFetch('/feeds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setFeeds((prev) => [...prev, feed]);
  }

  const isRefreshing = status?.isRefreshing;
  const unreadCount = articles.filter((a) => !a.is_read).length;

  const displayedArticles = articles.filter((a) => {
    if (showUnread && a.is_read) return false;
    if (activeCategory && a.category !== activeCategory) return false;
    return true;
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="wordmark">The Digest</span>
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'digest' ? 'active' : ''}`}
              onClick={() => setActiveTab('digest')}
            >
              Digest {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className={`nav-tab ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              Sources
            </button>
          </nav>
        </div>
        <div className="header-right">
          <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <span className="spinner" /> : '↻'}
            {isRefreshing ? 'Refreshing…' : 'Refresh Now'}
          </button>
        </div>
      </header>

      <div className="main">
        {activeTab === 'digest' ? (
          <>
            <aside className="sidebar">
              <SchedulerPanel status={status} />
              <FilterBar
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                showUnread={showUnread}
                setShowUnread={setShowUnread}
              />
            </aside>

            <section className="feed">
              {error && <div className="error-banner">{error}</div>}
              {isRefreshing && (
                <div className="refreshing-banner">
                  <span className="spinner" />
                  Fetching and summarizing new articles — this may take a moment…
                </div>
              )}

              <div className="feed-header">
                <span className="feed-title">Latest Articles</span>
                <span className="feed-count">{displayedArticles.length} articles</span>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <p>Loading…</p>
                </div>
              ) : displayedArticles.length === 0 ? (
                <div className="empty-state">
                  <h3>No articles yet</h3>
                  <p>Hit "Refresh Now" to pull from your RSS feeds.</p>
                </div>
              ) : (
                <div className="article-list">
                  {displayedArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <aside className="sidebar">
              <SchedulerPanel status={status} />
            </aside>
            <SourcesTab
              feeds={feeds}
              onToggle={handleToggleFeed}
              onAdd={handleAddFeed}
            />
          </>
        )}
      </div>
    </div>
  );
}
