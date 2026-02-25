/**
 * Parser 模块入口测试
 * 
 * 验证 src/parser/index.js 可以正常导出所有解析函数
 */

const parser = require('../../src/parser');

describe('Parser Module Entry', () => {
  describe('Module Loading', () => {
    test('should load parser module successfully', () => {
      // 验证模块可以正常加载
      expect(parser).toBeDefined();
      expect(typeof parser).toBe('object');
    });

    test('should export parseMarkdown function', () => {
      expect(parser.parseMarkdown).toBeDefined();
      expect(typeof parser.parseMarkdown).toBe('function');
    });

    test('should export extractCustomTags function', () => {
      expect(parser.extractCustomTags).toBeDefined();
      expect(typeof parser.extractCustomTags).toBe('function');
    });

    test('should export parseFrontMatter function', () => {
      expect(parser.parseFrontMatter).toBeDefined();
      expect(typeof parser.parseFrontMatter).toBe('function');
    });

    test('should export extractTitleFromFrontMatter function', () => {
      expect(parser.extractTitleFromFrontMatter).toBeDefined();
      expect(typeof parser.extractTitleFromFrontMatter).toBe('function');
    });

    test('should export extractEditionFromFrontMatter function', () => {
      expect(parser.extractEditionFromFrontMatter).toBeDefined();
      expect(typeof parser.extractEditionFromFrontMatter).toBe('function');
    });

    test('should export md (markdown-it instance)', () => {
      expect(parser.md).toBeDefined();
      expect(typeof parser.md.render).toBe('function');
    });
  });

  describe('Integration Test', () => {
    const sampleMarkdown = `---
title: 2026-2-22
weather: 东莞 · 多云 28°C/19°C
read_time: 约 8 分钟
---
[head]: #
[from:https://example.com]: #
[tag:测试]: #
# 测试标题

这是测试内容。

[section]: #
[intro:测试简介]: #
[icon:🧪]: #
# 测试章节

[articles]: #
## 测试文章

这是文章内容。
`;

    test('should parse markdown completely through parser entry', () => {
      const result = parser.parseMarkdown(sampleMarkdown);

      expect(result).toBeDefined();
      expect(result.frontMatter).toBeDefined();
      expect(result.frontMatter.title).toBe('2026-2-22');
      expect(result.customTags).toBeDefined();
      expect(result.htmlContent).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
    });

    test('should extract front matter through parser entry', () => {
      const markdown = `---
title: Test Title
number: 001
---
# Hello`;

      const { frontMatter, content } = parser.parseFrontMatter(markdown);

      expect(frontMatter.title).toBe('Test Title');
      expect(frontMatter.number).toBe('001');
      expect(content).toContain('# Hello');
    });

    test('should extract custom tags through parser entry', () => {
      const markdown = `
[head]: #
[tag:AI]: #
[tag:科技]: #
# Test Headline
`;

      const { tags } = parser.extractCustomTags(markdown);

      expect(tags).toBeDefined();
      expect(tags.headlineTags).toBeDefined();
      expect(tags.headlineTags).toContain('AI');
      expect(tags.headlineTags).toContain('科技');
    });

    test('should extract title from front matter through parser entry', () => {
      const frontMatter = { title: 'Test Title' };
      const title = parser.extractTitleFromFrontMatter(frontMatter, '2026-02-22');

      expect(title).toBe('Test Title');
    });

    test('should extract edition from front matter through parser entry', () => {
      const frontMatter = { number: '002' };
      const edition = parser.extractEditionFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');

      expect(edition).toBe('002');
    });
  });
});
