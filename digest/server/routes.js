const express = require('express');
const db = require('./db');
const { refreshAllFeeds, getRefreshStatus } = require('./feeds');
const { getSchedulerInfo } = require('./scheduler');

const router = express.Router();

// GET /api/articles
router.get('/articles', (req, res) => {
  const { category, unread } = req.query;
  let query = 'SELECT * FROM articles WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (unread === 'true') {
    query += ' AND is_read = 0';
  }

  query += ' ORDER BY published_at DESC';

  const articles = db.prepare(query).all(...params);
  res.json(articles);
});

// PATCH /api/articles/:id/read
router.patch('/articles/:id/read', (req, res) => {
  const { id } = req.params;
  const result = db
    .prepare('UPDATE articles SET is_read = 1 WHERE id = ?')
    .run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ success: true });
});

// GET /api/feeds
router.get('/feeds', (req, res) => {
  const feeds = db.prepare('SELECT * FROM feeds ORDER BY name ASC').all();
  res.json(feeds);
});

// POST /api/feeds
router.post('/feeds', (req, res) => {
  const { name, url, category } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'name and url are required' });
  }

  try {
    const result = db
      .prepare('INSERT INTO feeds (name, url, category) VALUES (?, ?, ?)')
      .run(name, url, category || 'General');
    const feed = db.prepare('SELECT * FROM feeds WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(feed);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Feed URL already exists' });
    }
    throw err;
  }
});

// PATCH /api/feeds/:id/toggle
router.patch('/feeds/:id/toggle', (req, res) => {
  const { id } = req.params;
  const feed = db.prepare('SELECT * FROM feeds WHERE id = ?').get(id);
  if (!feed) return res.status(404).json({ error: 'Feed not found' });

  db.prepare('UPDATE feeds SET is_active = ? WHERE id = ?').run(
    feed.is_active ? 0 : 1,
    id
  );
  res.json({ ...feed, is_active: feed.is_active ? 0 : 1 });
});

// POST /api/refresh
router.post('/refresh', async (req, res) => {
  const { isRefreshing } = getRefreshStatus();
  if (isRefreshing) {
    return res.status(202).json({ message: 'Refresh already in progress' });
  }

  // Start refresh without awaiting — let client poll status
  refreshAllFeeds().catch((err) =>
    console.error('[routes] Refresh error:', err.message)
  );

  res.json({ message: 'Refresh started' });
});

// GET /api/status
router.get('/status', (req, res) => {
  const { isRefreshing, lastRefreshed } = getRefreshStatus();
  const schedulerInfo = getSchedulerInfo();
  res.json({ isRefreshing, lastRefreshed, ...schedulerInfo });
});

// GET /api/categories
router.get('/categories', (req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT category FROM articles ORDER BY category ASC')
    .all();
  res.json(rows.map((r) => r.category));
});

module.exports = router;
