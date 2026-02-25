module.exports = {
  port: process.env.PORT || 3000,
  watchDir: process.env.WATCH_DIR || './reports',
  cacheTimeout: 5 * 60 * 1000,
  maxCacheSize: 100,
  fileChangeDebounce: 500
};
