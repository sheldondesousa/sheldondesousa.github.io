const Parser = require('rss-parser');
const db = require('./db');
const { summarizeArticle } = require('./summarize');

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'TheDigest/1.0 RSS Reader' },
});

let isRefreshing = false;
let lastRefreshed = null;

async function fetchAndStore(feed) {
  let parsed;
  try {
    parsed = await parser.parseURL(feed.url);
  } catch (err) {
    console.error(`[feeds] Failed to parse ${feed.name}: ${err.message}`);
    return 0;
  }

  const checkStmt = db.prepare('SELECT id, summary FROM articles WHERE url = ?');
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO articles (title, url, source, category, summary, published_at)
    VALUES (@title, @url, @source, @category, @summary, @published_at)
  `);
  const updateSummaryStmt = db.prepare(
    'UPDATE articles SET summary = ? WHERE url = ?'
  );

  let newCount = 0;

  for (const item of parsed.items.slice(0, 20)) {
    const url = item.link || item.guid;
    if (!url) continue;

    const existing = checkStmt.get(url);

    if (!existing) {
      // New article — insert without summary first
      insertStmt.run({
        title: item.title || 'Untitled',
        url,
        source: feed.name,
        category: feed.category,
        summary: null,
        published_at: item.isoDate || item.pubDate || new Date().toISOString(),
      });
      newCount++;

      // Summarize asynchronously but sequentially per feed to avoid rate limits
      try {
        const rawContent = item.contentSnippet || item.content || item.summary || '';
        const summary = await summarizeArticle(item.title || '', rawContent);
        updateSummaryStmt.run(summary, url);
        console.log(`[feeds] Summarized: ${item.title}`);
      } catch (err) {
        console.error(`[feeds] Summarization failed for "${item.title}": ${err.message}`);
      }
    } else if (existing && !existing.summary) {
      // Exists but missing summary — backfill it
      try {
        const rawContent = item.contentSnippet || item.content || item.summary || '';
        const summary = await summarizeArticle(item.title || '', rawContent);
        updateSummaryStmt.run(summary, url);
        console.log(`[feeds] Backfilled summary: ${item.title}`);
      } catch (err) {
        console.error(`[feeds] Backfill failed for "${item.title}": ${err.message}`);
      }
    }
  }

  return newCount;
}

async function refreshAllFeeds() {
  if (isRefreshing) {
    console.log('[feeds] Refresh already in progress, skipping.');
    return { skipped: true };
  }

  isRefreshing = true;
  console.log('[feeds] Starting refresh...');

  try {
    const activeFeeds = db
      .prepare('SELECT * FROM feeds WHERE is_active = 1')
      .all();

    let totalNew = 0;
    for (const feed of activeFeeds) {
      console.log(`[feeds] Fetching ${feed.name}...`);
      const count = await fetchAndStore(feed);
      totalNew += count;
      console.log(`[feeds] ${feed.name}: ${count} new articles`);
    }

    lastRefreshed = new Date().toISOString();
    console.log(`[feeds] Refresh complete. ${totalNew} new articles total.`);
    return { totalNew, lastRefreshed };
  } finally {
    isRefreshing = false;
  }
}

function getRefreshStatus() {
  return { isRefreshing, lastRefreshed };
}

module.exports = { refreshAllFeeds, getRefreshStatus };
