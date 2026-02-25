const express = require('express');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const fileWatcher = require('./fileWatcher');
const cache = require('./cache');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', routes);

app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).render('error', {
    title: '服务器错误',
    message: '发生了一个内部错误，请稍后重试。',
    code: 'SERVER_ERROR'
  });
});

async function initializeApp() {
  console.log('Initializing Daily Report Renderer...');
  
  cache.invalidateAll();
  
  const initialReports = await fileWatcher.scanDirectory(config.watchDir);
  
  if (initialReports.length > 0) {
    console.log(`Found ${initialReports.length} initial reports`);
  } else {
    console.log('No initial reports found');
  }
  
  fileWatcher.startWatching(config.watchDir, { ignoreInitial: true });
  
  fileWatcher.onFileChange(async (eventType, parsed) => {
    console.log(`File ${eventType}: ${parsed.filename}`);
    // 精确清除对应文件的缓存
    cache.invalidateReport(parsed.basename);
    // 清除列表缓存（列表顺序可能变化）
    cache.invalidateListCaches();
  });
}

function startServer() {
  const port = config.port;
  
  return app.listen(port, () => {
    console.log(`Daily Report Renderer running at http://localhost:${port}`);
    console.log(`Watching directory: ${config.watchDir}`);
  });
}

if (require.main === module) {
  initializeApp().then(() => {
    startServer();
  }).catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
  });
}

module.exports = { app, initializeApp, startServer };
