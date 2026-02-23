const NodeCache = require('node-cache');
const config = require('./config');

const cache = new NodeCache({
  stdTTL: config.cacheTimeout / 1000,
  checkperiod: 60,
  useClones: false,
  maxKeys: config.maxCacheSize
});

const REPORT_LIST_KEY = 'report_list';
const LATEST_REPORT_KEY = 'latest_report';

function getReportList() {
  return cache.get(REPORT_LIST_KEY) || [];
}

function setReportList(list) {
  cache.set(REPORT_LIST_KEY, list);
}

function getLatestReport() {
  return cache.get(LATEST_REPORT_KEY);
}

function setLatestReport(report) {
  cache.set(LATEST_REPORT_KEY, report);
}

function getReport(filename) {
  return cache.get(`report_${filename}`);
}

function setReport(filename, report) {
  cache.set(`report_${filename}`, report);
}

function invalidateReport(filename) {
  cache.del(`report_${filename}`);
}

function invalidateAll() {
  cache.flushAll();
}

function getStats() {
  return cache.getStats();
}

module.exports = {
  cache,
  getReportList,
  setReportList,
  getLatestReport,
  setLatestReport,
  getReport,
  setReport,
  invalidateReport,
  invalidateAll,
  getStats
};
