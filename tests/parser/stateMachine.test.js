const { parseDocumentStructure, extractQuoteBlocksAndContent } = require('../../src/parser/stateMachine');

describe('stateMachine', () => {
  test('should parse headline + section + article structure', () => {
    const cleanContent = `[head]: #
# 头版标题
头版正文

[section]: #
[sum:章节总结]: #
[think:章节思考]: #
# 第一章
[articles]: #
## 文章 A
[sum:文章总结]: #
[think:文章思考]: #
这是文章正文
> 引用 1
> 引用 2`;

    const customTags = {
      hasHeadMarker: true,
      headlineTags: ['头条'],
      headFrom: 'https://head.example.com',
      sectionArticleMeta: [
        {
          intro: '章节简介',
          icon: '🧪',
          tags: ['章节标签'],
          articleMeta: [
            {
              from: 'https://article.example.com',
              fromStr: '来源',
              tags: ['文章标签']
            }
          ]
        }
      ]
    };

    const { headSection, sections } = parseDocumentStructure(cleanContent, customTags);

    expect(headSection).toBeDefined();
    expect(headSection.title).toBe('头版标题');
    expect(headSection.tags).toContain('头条');
    expect(headSection.from).toBe('https://head.example.com');
    expect(headSection.content).toContain('头版正文');

    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('第一章');
    // 保持现有行为：文章起始后的 [sum]/[think] 仍会优先归属到 section
    expect(sections[0].summary).toBe('文章总结');
    expect(sections[0].think).toBe('文章思考');
    expect(sections[0].articles.length).toBe(1);

    const article = sections[0].articles[0];
    expect(article.title).toBe('文章 A');
    expect(article.summary).toBeNull();
    expect(article.think).toBeNull();
    expect(article.from).toBe('https://article.example.com');
    expect(article.fromStr).toBe('来源');
    expect(article.tags).toContain('文章标签');
    expect(article.content).toContain('这是文章正文');
    expect(article.quoteBlocks[0]).toContain('引用 1');
  });

  test('should return empty structure for empty content', () => {
    const { headSection, sections } = parseDocumentStructure('', {});
    expect(headSection).toBeNull();
    expect(sections).toEqual([]);
  });

  test('should split quote blocks from content', () => {
    const parsed = extractQuoteBlocksAndContent('正文\n> 引用 A\n> 引用 B\n\n结尾');
    expect(parsed.quoteBlocks.length).toBe(1);
    expect(parsed.quoteBlocks[0]).toContain('引用 A');
    expect(parsed.content).toContain('正文');
    expect(parsed.content).toContain('结尾');
  });
});
