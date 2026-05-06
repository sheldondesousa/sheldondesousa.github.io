const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'digest.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'General',
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    summary TEXT,
    published_at TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default feeds if table is empty
const feedCount = db.prepare('SELECT COUNT(*) as count FROM feeds').get();
if (feedCount.count === 0) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO feeds (name, url, category) VALUES (?, ?, ?)'
  );
  insert.run('a16z', 'https://a16z.com/feed/', 'Venture & Tech');
  insert.run('Anthropic Blog', 'https://www.anthropic.com/news/rss.xml', 'AI Research');
}

module.exports = db;
