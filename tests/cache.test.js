const cache = require('../src/cache');

describe('Cache Module', () => {
  beforeEach(() => {
    cache.invalidateAll();
  });

  describe('getReportList and setReportList', () => {
    test('should return empty array when not set', () => {
      const result = cache.getReportList();
      
      expect(result).toEqual([]);
    });

    test('should store and retrieve report list', () => {
      const reports = [
        { filename: 'test1.md', title: 'Test 1' },
        { filename: 'test2.md', title: 'Test 2' }
      ];
      
      cache.setReportList(reports);
      const result = cache.getReportList();
      
      expect(result).toEqual(reports);
    });
  });

  describe('getLatestReport and setLatestReport', () => {
    test('should return undefined when not set', () => {
      const result = cache.getLatestReport();
      
      expect(result).toBeUndefined();
    });

    test('should store and retrieve latest report', () => {
      const report = { title: 'Latest Report', content: 'Test' };
      
      cache.setLatestReport(report);
      const result = cache.getLatestReport();
      
      expect(result).toEqual(report);
    });
  });

  describe('getReport and setReport', () => {
    test('should return undefined when not set', () => {
      const result = cache.getReport('test.md');
      
      expect(result).toBeUndefined();
    });

    test('should store and retrieve report by filename', () => {
      const report = { title: 'Test Report', content: 'Test content' };
      
      cache.setReport('test.md', report);
      const result = cache.getReport('test.md');
      
      expect(result).toEqual(report);
    });
  });

  describe('invalidateReport', () => {
    test('should remove specific report from cache', () => {
      const report = { title: 'Test Report' };
      cache.setReport('test.md', report);
      
      cache.invalidateReport('test.md');
      const result = cache.getReport('test.md');
      
      expect(result).toBeUndefined();
    });
  });

  describe('invalidateAll', () => {
    test('should clear all cached data', () => {
      cache.setReportList([{ filename: 'test.md' }]);
      cache.setLatestReport({ title: 'Latest' });
      cache.setReport('test.md', { title: 'Test' });
      
      cache.invalidateAll();
      
      expect(cache.getReportList()).toEqual([]);
      expect(cache.getLatestReport()).toBeUndefined();
      expect(cache.getReport('test.md')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    test('should return cache statistics', () => {
      const stats = cache.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.keys).toBeDefined();
      expect(stats.hits).toBeDefined();
      expect(stats.misses).toBeDefined();
    });
  });
});
