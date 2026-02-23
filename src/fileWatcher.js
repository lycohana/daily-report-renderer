const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

let watcher = null;
const changeCallbacks = [];

function parseFilename(filename) {
  const basename = path.basename(filename, '.md');
  const dateMatch = basename.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const numMatch = basename.match(/-(\d+)-/);
  
  if (dateMatch) {
    return {
      filename,
      basename,
      number: numMatch ? parseInt(numMatch[1]) : 0,
      year: parseInt(dateMatch[1]),
      month: parseInt(dateMatch[2]),
      day: parseInt(dateMatch[3]),
      date: new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3])),
      sortKey: `${dateMatch[1]}${dateMatch[2].padStart(2, '0')}${dateMatch[3].padStart(2, '0')}`
    };
  }
  
  return null;
}

async function scanDirectory(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.md') && !file.startsWith('.')) {
        const parsed = parseFilename(file);
        if (parsed) {
          const stat = await fs.stat(path.join(dirPath, file));
          parsed.mtime = stat.mtime;
          parsed.size = stat.size;
          reports.push(parsed);
        }
      }
    }
    
    return reports.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  } catch (error) {
    console.error('Error scanning directory:', error);
    return [];
  }
}

async function handleFileChange(eventType, filePath) {
  if (!filePath || !filePath.endsWith('.md')) {
    return;
  }
  
  const parsed = parseFilename(path.basename(filePath));
  if (!parsed) {
    return;
  }
  
  console.log(`File ${eventType}: ${filePath}`);
  
  for (const callback of changeCallbacks) {
    try {
      await callback(eventType, parsed);
    } catch (error) {
      console.error('Error in file change callback:', error);
    }
  }
}

function startWatching(dirPath, options = {}) {
  if (watcher) {
    watcher.close();
  }
  
  const watchPath = dirPath || config.watchDir;
  
  watcher = chokidar.watch(watchPath, {
    ignored: /(^|[/\\])\.|~$/,
    persistent: true,
    ignoreInitial: options.ignoreInitial || false,
    awaitWriteFinish: {
      stabilityThreshold: options.stabilityThreshold || config.fileChangeDebounce,
      pollInterval: 100
    }
  });
  
  watcher
    .on('add', (filePath) => handleFileChange('add', filePath))
    .on('change', (filePath) => handleFileChange('change', filePath))
    .on('unlink', (filePath) => handleFileChange('unlink', filePath))
    .on('error', (error) => console.error('Watcher error:', error));
  
  console.log(`Watching for changes in: ${watchPath}`);
  
  return watcher;
}

function stopWatching() {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log('Stopped watching for file changes');
  }
}

function onFileChange(callback) {
  if (typeof callback === 'function') {
    changeCallbacks.push(callback);
  }
}

function removeCallback(callback) {
  const index = changeCallbacks.indexOf(callback);
  if (index > -1) {
    changeCallbacks.splice(index, 1);
  }
}

module.exports = {
  startWatching,
  stopWatching,
  onFileChange,
  removeCallback,
  scanDirectory,
  parseFilename
};
