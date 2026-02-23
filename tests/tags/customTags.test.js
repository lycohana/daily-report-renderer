/**
 * customTags 模块测试
 */

const { extractCustomTags } = require('../../src/parser/customTags');

describe('extractCustomTags', () => {
  test('should extract tag', () => {
    const content = '[tag:test]: #\nSome content';
    const result = extractCustomTags(content);
    expect(result.tags.headlineTags).toContain('test');
  });

  test('should extract multiple tags', () => {
    const content = '[tag:tag1]: #\n[tag:tag2]: #\nContent';
    const result = extractCustomTags(content);
    expect(result.tags.headlineTags).toContain('tag1');
    expect(result.tags.headlineTags).toContain('tag2');
  });

  test('should clean content', () => {
    const content = '[tag:test]: #\nSome content';
    const result = extractCustomTags(content);
    expect(result.cleanContent).not.toContain('[tag:test]: #');
  });

  test('should handle section marker', () => {
    const content = '[section]: #\n[intro:test]: #\n# Section Title';
    const result = extractCustomTags(content);
    expect(result.tags.sectionArticleMeta).toBeDefined();
    expect(result.tags.sectionArticleMeta.length).toBeGreaterThan(0);
  });

  test('should handle data block', () => {
    const content = '<data><num>100</num><str>Items</str></data>';
    const result = extractCustomTags(content);
    expect(result.tags.dataBlocks).toBeDefined();
  });

  test('should handle weather block', () => {
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day></weather>';
    const result = extractCustomTags(content);
    // Weather data is kept in content, not extracted as tags
    expect(result.cleanContent).toContain('<weather>');
  });

  test('should handle complex content', () => {
    const content = `
[tag:news]: #
[head]: #
# 头条新闻

[from:https://example.com]: #

[section]: #
[intro:章节简介]: #
[icon:📰]: #

## 文章 1
[from:https://article1.com]: #
[tag:article1]: #
`;
    const result = extractCustomTags(content);
    expect(result.tags).toBeDefined();
    expect(result.cleanContent).toBeDefined();
  });

  test('should return empty tags for empty content', () => {
    const result = extractCustomTags('');
    expect(result.tags).toBeDefined();
  });
});
