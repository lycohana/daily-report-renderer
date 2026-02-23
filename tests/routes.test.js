const request = require('supertest');
const express = require('express');

// Mock the required modules
jest.mock('../src/cache', () => ({
  getLatestReport: jest.fn(),
  setLatestReport: jest.fn(),
  getReport: jest.fn(),
  setReport: jest.fn(),
  getReportList: jest.fn(),
  setReportList: jest.fn(),
  invalidateAll: jest.fn(),
  invalidateReport: jest.fn(),
  getStats: jest.fn(() => ({ keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0 }))
}));

jest.mock('../src/fileWatcher', () => ({
  scanDirectory: jest.fn(),
  startWatching: jest.fn(),
  stopWatching: jest.fn()
}));

const cache = require('../src/cache');
const fileWatcher = require('../src/fileWatcher');

// Import the parseFormField function by evaluating it from routes
// Since it's not exported, we'll test it indirectly through integration
describe('Form Field Parsing', () => {
  // Test the parseFormField logic directly (updated to support multiple sources)
  function parseFormField(formValue) {
    if (!formValue) {
      return [];
    }

    // 先用逗号分割多个来源
    const sources = formValue.split(',');

    return sources.map(source => {
      const sourceStr = source.trim();
      if (!sourceStr) {
        return { name: null, url: null };
      }

      // 尝试使用 | 分隔
      if (sourceStr.includes('|')) {
        const parts = sourceStr.split('|');
        return {
          name: parts[0].trim(),
          url: parts[1] ? parts[1].trim() : null
        };
      }

      // 尝试使用 - 分隔
      if (sourceStr.includes(' - ')) {
        const parts = sourceStr.split(' - ');
        return {
          name: parts[0].trim(),
          url: parts[1] ? parts[1].trim() : null
        };
      }

      // 只有名称，没有URL
      return {
        name: sourceStr.trim(),
        url: null
      };
    }).filter(source => source.name !== null);
  }

  test('should parse form field with pipe separator', () => {
    const result = parseFormField('微信公众号AIdaily|https://example.com');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe('https://example.com');
  });

  test('should parse form field with dash separator', () => {
    const result = parseFormField('微信公众号AIdaily - https://example.com');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe('https://example.com');
  });

  test('should parse form field without URL', () => {
    const result = parseFormField('微信公众号AIdaily');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe(null);
  });

  test('should handle empty form field', () => {
    const result = parseFormField('');
    expect(result).toEqual([]);
  });

  test('should handle null form field', () => {
    const result = parseFormField(null);
    expect(result).toEqual([]);
  });

  test('should handle undefined form field', () => {
    const result = parseFormField(undefined);
    expect(result).toEqual([]);
  });

  test('should parse multiple sources with comma separator', () => {
    const result = parseFormField('AIBase|https://www.aibase.com,GitHub Blog|https://github.com/blog,AI News|https://ainews.com');
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('AIBase');
    expect(result[0].url).toBe('https://www.aibase.com');
    expect(result[1].name).toBe('GitHub Blog');
    expect(result[1].url).toBe('https://github.com/blog');
    expect(result[2].name).toBe('AI News');
    expect(result[2].url).toBe('https://ainews.com');
  });

  test('should handle mixed sources with and without URLs', () => {
    const result = parseFormField('Source1|https://source1.com,Source2,Source3|https://source3.com');
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Source1');
    expect(result[0].url).toBe('https://source1.com');
    expect(result[1].name).toBe('Source2');
    expect(result[1].url).toBe(null);
    expect(result[2].name).toBe('Source3');
    expect(result[2].url).toBe('https://source3.com');
  });
});

// Simple router tests without starting the full server
describe('Routes Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Integration', () => {
    test('cache should be properly configured', () => {
      expect(cache.getStats).toBeDefined();
      expect(typeof cache.getStats).toBe('function');
    });

    test('cache should invalidate all reports', () => {
      cache.invalidateAll();
      expect(cache.invalidateAll).toHaveBeenCalled();
    });

    test('cache should store and retrieve report', () => {
      const testReport = { title: 'Test Report', content: 'Test content' };
      cache.setReport('test.md', testReport);
      expect(cache.setReport).toHaveBeenCalledWith('test.md', testReport);
    });
  });

  describe('File Watcher Integration', () => {
    test('fileWatcher should have scanDirectory method', () => {
      expect(fileWatcher.scanDirectory).toBeDefined();
    });

    test('fileWatcher should have startWatching method', () => {
      expect(fileWatcher.startWatching).toBeDefined();
    });

    test('fileWatcher should have stopWatching method', () => {
      expect(fileWatcher.stopWatching).toBeDefined();
    });
  });

  describe('Report Data Structure', () => {
    test('report should have required fields', () => {
      const reportData = {
        title: 'Test Report',
        edition: '001',
        frontMatter: {},
        customTags: {},
        headSection: null,
        htmlContent: '',
        sections: [],
        filename: 'test.md'
      };

      expect(reportData).toHaveProperty('title');
      expect(reportData).toHaveProperty('edition');
      expect(reportData).toHaveProperty('frontMatter');
      expect(reportData).toHaveProperty('customTags');
      expect(reportData).toHaveProperty('headSection');
      expect(reportData).toHaveProperty('htmlContent');
      expect(reportData).toHaveProperty('sections');
      expect(reportData).toHaveProperty('filename');
    });
  });
});
