const markdownParser = require('../src/markdownParser');

describe('Markdown Parser', () => {
  const sampleMarkdown = `---
title: 2026-2-22
weather: 东莞 · 多云 28°C/19°C
read_time: 约 8 分钟
---
[head]: #
[from:https://www.aibase.com/zh/news/25572]: #
[tag:智谱AI]: #
[tag:港股]: #
# 智谱AI港股尾盘股价涨超42%  市值突破3232亿港元

今日，港股迎来农历马年的首个交易日，在整体大盘走弱的态势下，AI大模型领域却呈现出蓬勃生机。

[data]: #
<num>98.7%</num><str>任务完成率</str>
#

## 第一章节

这是第一章节的内容。

## 第二章节

这是第二章节的内容。
`;

  const sampleMarkdownWithDataBlocks = `---
title: 2026-2-23
weather: 东莞 · 晴 26°C/18°C
read_time: 约 10 分钟
---
[head]: #
[from:https://example.com]: #
# OpenAI发布GPT-5

今日，OpenAI正式发布GPT-5 Agents。<data>
<num>98.7%</num><str>复杂任务完成率</str>
<num>100万</num><str>Token上下文</str>
</data>

[section]: #
[intro:最新AI动态]: #
[icon]: 🤖
# AI产品一周动态

[articles]: #
## Anthropic发布Claude Code 3.0

[from:https://github.com]: #
[fromstr:GitHub]: #
[tag:编程]: #
Claude Code 3.0在SWE-bench测试中达到92.3%的准确率。<data>
<num>92.3%</num><str>准确率</str>
</data>

## VSCode累计下载量突破15亿次

[from:https://microsoft.com]: #
VSCode扩展市场持续增长。
`;

  describe('parseFrontMatter', () => {
    test('should parse front matter correctly', () => {
      const { frontMatter, content } = markdownParser.parseFrontMatter(sampleMarkdown);
      
      expect(frontMatter.title).toBe('2026-2-22');
      expect(frontMatter.weather).toBe('东莞 · 多云 28°C/19°C');
      expect(frontMatter.read_time).toBe('约 8 分钟');
      expect(content).toContain('# 智谱AI港股尾盘股价涨超42%');
    });

    test('should handle markdown without front matter', () => {
      const markdownWithoutFrontMatter = '# Hello World';
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdownWithoutFrontMatter);
      
      expect(Object.keys(frontMatter).length).toBe(0);
      expect(content).toBe(markdownWithoutFrontMatter);
    });

    test('should handle empty front matter', () => {
      const markdown = `---
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(Object.keys(frontMatter).length).toBe(0);
      expect(content).toContain('# Hello World');
    });

    test('should parse form field with pipe separator', () => {
      const markdown = `---
form: 微信公众号AIdaily|https://example.com
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号AIdaily|https://example.com');
      expect(content).toContain('# Hello World');
    });

    test('should parse form field with dash separator', () => {
      const markdown = `---
form: 微信公众号AIdaily - https://example.com
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号AIdaily - https://example.com');
      expect(content).toContain('# Hello World');
    });

    test('should parse form field without URL', () => {
      const markdown = `---
form: 微信公众号AIdaily
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号AIdaily');
      expect(content).toContain('# Hello World');
    });
  });

  describe('extractCustomTags', () => {
    test('should extract custom tags from markdown', () => {
      const { tags } = markdownParser.extractCustomTags(sampleMarkdown);
      
      expect(tags.tag).toContain('智谱AI');
      expect(tags.tag).toContain('港股');
      expect(tags.from).toBe('https://www.aibase.com/zh/news/25572');
    });

    test('should return empty object when no custom tags', () => {
      const markdown = '# Hello World';
      const { tags } = markdownParser.extractCustomTags(markdown);
      
      expect(Object.keys(tags).length).toBeGreaterThanOrEqual(0);
    });

    test('should extract headline tags', () => {
      const markdown = `
[tag:AI]: #
[tag:科技]: #
# Test Headline
`;
      const { tags } = markdownParser.extractCustomTags(markdown);
      
      expect(tags.headlineTags).toContain('AI');
      expect(tags.headlineTags).toContain('科技');
    });
  });

  describe('parseMarkdown', () => {
    test('should parse markdown completely', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdown);
      
      expect(result.frontMatter).toBeDefined();
      expect(result.customTags).toBeDefined();
      expect(result.htmlContent).toBeDefined();
      expect(result.htmlContent).toContain('智谱AI港股尾盘股价涨超42%');
    });

    test('should return headSection', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdown);
      
      expect(result.headSection).toBeDefined();
      expect(result.headSection.title).toBe('智谱AI港股尾盘股价涨超42%  市值突破3232亿港元');
    });

    test('should return sections array', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdown);
      
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
    });

    test('should include headSectionHtml', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdown);
      
      expect(result.headSectionHtml).toBeDefined();
      expect(typeof result.headSectionHtml).toBe('string');
    });
  });

  describe('Data Block Rendering', () => {
    test('should convert data blocks to HTML in headSection', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.headSectionHtml).toContain('front-stats');
      expect(result.headSectionHtml).toContain('98.7%');
      expect(result.headSectionHtml).toContain('复杂任务完成率');
    });

    test('should convert data blocks to HTML in htmlContent', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.htmlContent).toContain('front-stats');
    });

    test('should handle multiple data block items', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.headSectionHtml).toContain('100万');
      expect(result.headSectionHtml).toContain('Token上下文');
    });

    test('should add data-inline attribute to front-stats', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.headSectionHtml).toContain('data-inline="true"');
    });
  });

  describe('extractTitleFromFrontMatter', () => {
    test('should extract title from front matter', () => {
      const frontMatter = { title: 'Test Title' };
      const title = markdownParser.extractTitleFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');
      
      expect(title).toBe('Test Title');
    });

    test('should generate title from filename when not in front matter', () => {
      const frontMatter = {};
      const title = markdownParser.extractTitleFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');
      
      expect(title).toBe('每日日报 - 2026年2月22日');
    });

    test('should handle various filename formats', () => {
      const frontMatter = {};
      
      const title1 = markdownParser.extractTitleFromFrontMatter(frontMatter, '2026-2-22');
      expect(title1).toBe('每日日报 - 2026年2月22日');
      
      const title2 = markdownParser.extractTitleFromFrontMatter(frontMatter, '2026-02-22');
      expect(title2).toBe('每日日报 - 2026年2月22日');
    });
  });

  describe('extractEditionFromFrontMatter', () => {
    test('should extract edition from front matter', () => {
      const frontMatter = { number: '002' };
      const edition = markdownParser.extractEditionFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');
      
      expect(edition).toBe('002');
    });

    test('should generate edition from filename when not in front matter', () => {
      const frontMatter = {};
      const edition = markdownParser.extractEditionFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');
      
      expect(edition).toBe('001');
    });

    test('should handle missing number gracefully', () => {
      const frontMatter = {};
      const edition = markdownParser.extractEditionFromFrontMatter(frontMatter, 'no-number-file');
      
      expect(edition).toBe('001');
    });
  });

  describe('Section and Article Parsing', () => {
    test('should parse sections correctly', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.sections[0]).toHaveProperty('title');
      expect(result.sections[0]).toHaveProperty('articles');
    });

    test('should parse articles within sections', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      const sectionWithArticles = result.sections.find(s => s.articles && s.articles.length > 0);
      expect(sectionWithArticles).toBeDefined();
      expect(sectionWithArticles.articles.length).toBeGreaterThan(0);
    });

    test('should extract article metadata', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      const article = result.sections.flatMap(s => s.articles)[0];
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('from');
      expect(article).toHaveProperty('fromStr');
    });

    test('should extract section intro', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      expect(result.sections[0].intro).toBe('最新AI动态');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const markdown = `---
title: Test
---
`;
      const result = markdownParser.parseMarkdown(markdown);
      
      expect(result.headSection).toBeNull();
      expect(result.sections).toEqual([]);
    });

    test('should handle markdown with only front matter', () => {
      const markdown = `---
title: Test
---
No content here.`;
      const result = markdownParser.parseMarkdown(markdown);
      
      expect(result.frontMatter.title).toBe('Test');
    });

    test('should handle special characters in title', () => {
      const markdown = `---
title: Test & More <special>
---
# Hello World
`;
      const result = markdownParser.parseMarkdown(markdown);
      
      expect(result.frontMatter.title).toBe('Test & More <special>');
    });

    test('should handle unicode characters', () => {
      const markdown = `---
title: 中文标题
---
# 中文内容 🤖🚀
`;
      const result = markdownParser.parseMarkdown(markdown);
      
      expect(result.frontMatter.title).toBe('中文标题');
      expect(result.htmlContent).toContain('中文内容');
    });
  });
});
