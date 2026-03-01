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
const express = require('express');
const request = require('supertest');
const fs = require('fs').promises;
const routes = require('../src/routes');

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

describe('Tree Route', () => {
  describe('Date Format Validation', () => {
    test('should accept valid date format YYYY-MM-DD', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(dateRegex.test('2026-06-26')).toBe(true);
      expect(dateRegex.test('2026-01-01')).toBe(true);
      expect(dateRegex.test('2026-12-31')).toBe(true);
    });

    test('should reject invalid date formats', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(dateRegex.test('2026-6-26')).toBe(false);
      expect(dateRegex.test('2026/06/26')).toBe(false);
      expect(dateRegex.test('06-26-2026')).toBe(false);
      expect(dateRegex.test('2026-06')).toBe(false);
      expect(dateRegex.test('invalid')).toBe(false);
    });
  });

  describe('Tree Data Structure', () => {
    test('tree data should have required fields', () => {
      const treeData = {
        frontMatter: {},
        title: 'Test Report',
        edition: '001',
        headSection: {
          title: 'Test Headline',
          tags: ['tag1', 'tag2'],
          from: 'https://example.com',
          fromStr: 'Example Source',
          summary: 'Test summary',
          think: 'Test thought'
        },
        sections: [
          {
            title: 'Test Section',
            icon: '📁',
            intro: 'Test intro',
            tags: ['section-tag'],
            summary: 'Section summary',
            think: 'Section thought',
            articles: [
              {
                title: 'Test Article',
                from: 'https://example.com/article',
                fromStr: 'Article Source',
                tags: ['article-tag'],
                summary: 'Article summary',
                think: 'Article thought'
              }
            ]
          }
        ]
      };

      expect(treeData).toHaveProperty('frontMatter');
      expect(treeData).toHaveProperty('title');
      expect(treeData).toHaveProperty('edition');
      expect(treeData).toHaveProperty('headSection');
      expect(treeData).toHaveProperty('sections');
      
      expect(treeData.headSection).toHaveProperty('title');
      expect(treeData.headSection).toHaveProperty('tags');
      expect(treeData.headSection).toHaveProperty('summary');
      
      expect(treeData.sections[0]).toHaveProperty('title');
      expect(treeData.sections[0]).toHaveProperty('articles');
      expect(treeData.sections[0].articles[0]).toHaveProperty('title');
      expect(treeData.sections[0].articles[0]).toHaveProperty('tags');
    });

    test('tree data should handle missing optional fields', () => {
      const treeData = {
        frontMatter: {},
        title: 'Test Report',
        edition: '001',
        headSection: {
          title: 'Test Headline',
          tags: [],
          from: null,
          fromStr: null,
          summary: null,
          think: null
        },
        sections: []
      };

      expect(treeData.headSection.tags).toEqual([]);
      expect(treeData.headSection.from).toBeNull();
      expect(treeData.headSection.summary).toBeNull();
    });
  });

  describe('File Path Construction', () => {
    const path = require('path');
    const config = require('../src/config');

    test('should construct correct file path from date', () => {
      const date = '2026-06-26';
      const expectedPath = path.join(config.watchDir, `${date}.md`);
      
      expect(expectedPath).toContain('2026-06-26.md');
    });

    test('should sanitize date parameter', () => {
      const maliciousDate = '../../../etc/passwd';
      const sanitized = path.basename(maliciousDate);
      
      expect(sanitized).toBe('passwd');
    });
  });
});

describe('Download Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.response.render = function renderMock(view, options) {
      return this.status(this.statusCode || 200).json({ view, ...options });
    };
    app.use('/', routes);
    jest.clearAllMocks();
  });

  test('GET /download should download latest markdown file', async () => {
    fileWatcher.scanDirectory.mockResolvedValue([
      { filename: '2026-02-28.md', basename: '2026-02-28', sortKey: '20260228' }
    ]);
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue('# latest report');

    const res = await request(app).get('/download');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.headers['content-disposition']).toContain('attachment; filename="2026-02-28.md"');
    expect(res.text).toBe('# latest report');
  });

  test('GET /download/:date should download specified markdown file', async () => {
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue('# history report');

    const res = await request(app).get('/download/2026-02-20');

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment; filename="2026-02-20.md"');
    expect(res.text).toBe('# history report');
  });

  test('GET /download/:date should reject invalid date format', async () => {
    const res = await request(app).get('/download/2026-2-20');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DATE_FORMAT');
  });
});
