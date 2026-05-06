const cron = require('node-cron');
const { refreshAllFeeds } = require('./feeds');

let nextRunTime = null;

function getNextRunTime() {
  // Daily at 7:00 AM — compute next occurrence
  const now = new Date();
  const next = new Date();
  next.setHours(7, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

function startScheduler() {
  nextRunTime = getNextRunTime();

  // Runs every day at 7:00 AM server local time
  cron.schedule('0 7 * * *', async () => {
    console.log('[scheduler] Daily refresh triggered at 7:00 AM');
    await refreshAllFeeds();
    nextRunTime = getNextRunTime();
  });

  console.log(`[scheduler] Started. Next run: ${nextRunTime}`);
}

function getSchedulerInfo() {
  return {
    nextRunTime: nextRunTime || getNextRunTime(),
    schedule: 'Daily at 7:00 AM',
  };
}

module.exports = { startScheduler, getSchedulerInfo };
