module.exports = {
  port: process.env.PORT || 3000,
  watchDir: process.env.WATCH_DIR || './reports',
  outputDir: process.env.OUTPUT_DIR || './output',
  markdownPattern: '**/*.md',
  htmlPattern: '每日日报 - *.html',
  cacheTimeout: 5 * 60 * 1000,
  maxCacheSize: 100,
  fileChangeDebounce: 500,
  supportedDateFormats: ['YYYY-MM-DD', 'YYYY-M-D']
};
