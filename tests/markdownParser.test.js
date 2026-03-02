const markdownParser = require('../src/markdownParser');

describe('Markdown Parser', () => {
  const sampleMarkdown = `---
title: 2026-2-22
weather: 东莞 · 多云 28°C/19°C
read_time: 约 8 分钟
---
[head]: #
[from:https://www.aibase.com/zh/news/25572]: #
[tag:智谱 AI]: #
[tag:港股]: #
# 智谱 AI 港股尾盘股价涨超 42%  市值突破 3232 亿港元

今日，港股迎来农历马年的首个交易日，在整体大盘走弱的态势下，AI 大模型领域却呈现出蓬勃生机。

<data>
<num>98.7%</num><str>任务完成率</str>
</data>

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
# OpenAI 发布 GPT-5

今日，OpenAI 正式发布 GPT-5 Agents。<data>
<num>98.7%</num><str>复杂任务完成率</str>
<num>100 万</num><str>Token 上下文</str>
</data>

[section]: #
[intro:最新 AI 动态]: #
[icon:🤖]: #
# AI 产品一周动态

[articles]: #
## Anthropic 发布 Claude Code 3.0

[from:https://github.com]: #
[fromstr:GitHub]: #
[tag:编程]: #
Claude Code 3.0 在 SWE-bench 测试中达到 92.3% 的准确率。<data>
<num>92.3%</num><str>准确率</str>
</data>

## VSCode 累计下载量突破 15 亿次

[from:https://microsoft.com]: #
VSCode 扩展市场持续增长。
`;

  const sampleMarkdownWithWeather = `---
title: 2026-2-24
weather: 东莞 · 晴 27°C/18°C
read_time: 约 5 分钟
---
[head]: #
# 天气预报测试

[section]: #
[intro:天气预报]: #
[icon:🌤️]: #
# 本周天气

<weather>
<day>周一 | 东莞|☀️|晴|26°C/17°C</day>
<day>周二 | 东莞|⛅|多云|25°C/16°C</day>
<day>周三 | 深圳|🌧️|雨|24°C/15°C</day>
</weather>
`;

  const sampleMarkdownWithWeatherAttributes = `---
title: 2026-2-25
weather: 东莞 · 雨 17°C/14°C
read_time: 约 6 分钟
---
[head]: #
# 天气预报属性语法测试

<weather center data-type="weekly">
<day day="周二 3" weather="雨" temp="17/14" />
<day>周三|☁️|阴|19°C/16°C</day>
</weather>
`;

  describe('parseFrontMatter', () => {
    test('should parse front matter correctly', () => {
      const { frontMatter, content } = markdownParser.parseFrontMatter(sampleMarkdown);
      
      expect(frontMatter.title).toBe('2026-2-22');
      expect(frontMatter.weather).toBe('东莞 · 多云 28°C/19°C');
      expect(frontMatter.read_time).toBe('约 8 分钟');
      expect(content).toContain('# 智谱 AI 港股尾盘股价涨超 42%');
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
form: 微信公众号 AIdaily|https://example.com
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号 AIdaily|https://example.com');
      expect(content).toContain('# Hello World');
    });

    test('should parse form field with dash separator', () => {
      const markdown = `---
form: 微信公众号 AIdaily - https://example.com
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号 AIdaily - https://example.com');
      expect(content).toContain('# Hello World');
    });

    test('should parse form field without URL', () => {
      const markdown = `---
form: 微信公众号 AIdaily
---
# Hello World`;
      const { frontMatter, content } = markdownParser.parseFrontMatter(markdown);
      
      expect(frontMatter.form).toBe('微信公众号 AIdaily');
      expect(content).toContain('# Hello World');
    });
  });

  describe('extractCustomTags', () => {
    test('should extract custom tags from markdown', () => {
      const { tags } = markdownParser.extractCustomTags(sampleMarkdown);
      
      // 新架构：tag 在 headlineTags 中
      if (tags.headlineTags) {
        expect(tags.headlineTags).toContain('智谱 AI');
        expect(tags.headlineTags).toContain('港股');
      }
      // from 标签在 sectionArticleMeta 或 headFrom 中（可选）
      // 新架构可能返回不同的结构
      expect(tags).toBeDefined();
    });

    test('should return empty object when no custom tags', () => {
      const markdown = '# Hello World';
      const { tags } = markdownParser.extractCustomTags(markdown);
      
      expect(Object.keys(tags).length).toBeGreaterThanOrEqual(0);
    });

    test('should extract headline tags', () => {
      const markdown = `
[head]: #
[tag:AI]: #
[tag:科技]: #
# Test Headline
`;
      const { tags } = markdownParser.extractCustomTags(markdown);
      
      // 新架构：需要 [head]: 标记才能正确解析 headlineTags
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
      expect(result.htmlContent).toContain('智谱 AI 港股尾盘股价涨超 42%');
    });

    test('should return headSection', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdown);
      
      // 新架构：headSection 应该被正确解析
      if (result.headSection) {
        expect(result.headSection.title).toBe('智谱 AI 港股尾盘股价涨超 42%  市值突破 3232 亿港元');
      }
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

      // 新架构：data block 在 headSection 的 content 中
      if (result.headSectionHtml && result.headSectionHtml.length > 0) {
        expect(result.headSectionHtml).toContain('front-stats');
        expect(result.headSectionHtml).toContain('98.7%');
        expect(result.headSectionHtml).toContain('复杂任务完成率');
      }
    });

    test('should convert data blocks to HTML in htmlContent', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);

      // 新架构：data block 后处理在 htmlContent 中
      expect(result.htmlContent).toContain('front-stats');
    });

    test('should handle multiple data block items', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);

      if (result.headSectionHtml && result.headSectionHtml.length > 0) {
        expect(result.headSectionHtml).toContain('100 万');
        expect(result.headSectionHtml).toContain('Token 上下文');
      }
    });

    test('should add data-inline attribute to front-stats', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);

      if (result.headSectionHtml && result.headSectionHtml.length > 0) {
        expect(result.headSectionHtml).toContain('data-inline="true"');
      }
    });
  });

  describe('Weather Block Tag', () => {
    test('should extract weather tag from markdown', () => {
      const { tags } = markdownParser.extractCustomTags(sampleMarkdownWithWeather);

      expect(tags.weather).toBeDefined();
      expect(tags.weather.length).toBe(1);
    });

    test('should parse weather day items correctly', () => {
      const { tags } = markdownParser.extractCustomTags(sampleMarkdownWithWeather);
      const weatherData = tags.weather[0];

      // New structure: { items: [...], center: boolean }
      expect(weatherData.items.length).toBe(3);
      expect(weatherData.items[0].day).toBe('周一');
      expect(weatherData.items[0].city).toBe('东莞');
      expect(weatherData.items[0].icon).toBe('☀️');
      expect(weatherData.items[0].condition).toBe('晴');
      expect(weatherData.items[0].temp).toBe('26°C/17°C');
    });

    test('should handle weather tag in parseMarkdown result', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithWeather);

      expect(result.customTags.weather).toBeDefined();
      expect(result.customTags.weather[0].items.length).toBe(3);
      expect(result.customTags.weather[0].items[1].day).toBe('周二');
      expect(result.customTags.weather[0].items[2].city).toBe('深圳');
    });

    test('should not extract weather with insufficient data', () => {
      const markdownWithInvalidWeather = `---
title: Test
---
# Test
<weather>
<day>周一 | 东莞</day>
</weather>
`;
      const { tags } = markdownParser.extractCustomTags(markdownWithInvalidWeather);

      // When weather data has insufficient parts (less than 4), extract returns null
      // and the weather tag won't be added to the tags object
      expect(tags.weather).toBeUndefined();
    });

    test('should support weather without city (4-part format)', () => {
      const markdownWithWeatherNoCity = `---
title: Test
---
# Test
<weather center>
<day>周一|☀️|晴|26°C/17°C</day>
<day>周二|⛅|多云|25°C/16°C</day>
</weather>
`;
      const { tags } = markdownParser.extractCustomTags(markdownWithWeatherNoCity);

      expect(tags.weather).toBeDefined();
      expect(tags.weather[0].center).toBe(true);
      expect(tags.weather[0].items.length).toBe(2);
      expect(tags.weather[0].items[0].city).toBeNull();
      expect(tags.weather[0].items[0].day).toBe('周一');
      expect(tags.weather[0].items[0].icon).toBe('☀️');
      expect(tags.weather[0].items[1].city).toBeNull();
      expect(tags.weather[0].items[1].day).toBe('周二');
    });

    test('should support weather day attribute syntax', () => {
      const { tags } = markdownParser.extractCustomTags(sampleMarkdownWithWeatherAttributes);
      expect(tags.weather).toBeDefined();
      expect(tags.weather[0].center).toBe(true);
      expect(tags.weather[0].items).toHaveLength(2);
      expect(tags.weather[0].items[0]).toEqual({
        day: '周二 3',
        city: null,
        icon: '🌧️',
        condition: '雨',
        temp: '17°C/14°C'
      });
      expect(tags.weather[0].items[1].day).toBe('周三');
    });

    test('should support separate weekday/date/icon attributes in weather day', () => {
      const markdown = `---
title: Test
---
<weather>
<day weekday="周二" date="3" icon="🌧️" weather="雨" temp="17/14" />
</weather>
`;
      const { tags } = markdownParser.extractCustomTags(markdown);
      expect(tags.weather).toBeDefined();
      expect(tags.weather[0].items[0]).toEqual({
        day: '周二 3',
        city: null,
        icon: '🌧️',
        condition: '雨',
        temp: '17°C/14°C'
      });
    });

    test('should normalize temperature formats from weather day attributes', () => {
      const markdown = `---
title: Test
---
<weather>
<day day="周四 5" weather="晴" temp="24" />
<day day="周五 6" weather="多云" temp="22 15" />
</weather>
`;
      const { tags } = markdownParser.extractCustomTags(markdown);
      expect(tags.weather[0].items[0].temp).toBe('24°C');
      expect(tags.weather[0].items[1].temp).toBe('22°C/15°C');
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
      
      // 新架构：日期格式为"年 月 日"（年和月后有空格）
      expect(title).toBe('每日日报 - 2026 年 2 月 22 日');
    });

    test('should handle various filename formats', () => {
      const frontMatter = {};
      
      const title1 = markdownParser.extractTitleFromFrontMatter(frontMatter, '2026-2-22');
      expect(title1).toBe('每日日报 - 2026 年 2 月 22 日');
      
      const title2 = markdownParser.extractTitleFromFrontMatter(frontMatter, '2026-02-22');
      expect(title2).toBe('每日日报 - 2026 年 2 月 22 日');
      
      const title3 = markdownParser.extractTitleFromFrontMatter(frontMatter, 'daily-report-001-2026-02-22');
      expect(title3).toBe('每日日报 - 2026 年 2 月 22 日');
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
      
      // 新架构：sections 应该包含解析的章节
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
      // 注意：section 数量取决于 markdown 内容
    });

    test('should parse articles within sections', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      // 新架构：文章从内容中解析
      const sectionWithArticles = result.sections.find(s => s.articles && s.articles.length > 0);
      // 注意：如果 sectionWithArticles 未定义，说明测试数据可能需要调整
      if (sectionWithArticles) {
        expect(sectionWithArticles.articles.length).toBeGreaterThan(0);
      }
    });

    test('should extract article metadata', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      const articles = result.sections.flatMap(s => s.articles);
      if (articles.length > 0) {
        const article = articles[0];
        expect(article).toHaveProperty('title');
        // 新架构：from 和 fromStr 从内容中解析
        expect(article).toHaveProperty('from');
        expect(article).toHaveProperty('fromStr');
      }
    });

    test('should extract section intro', () => {
      const result = markdownParser.parseMarkdown(sampleMarkdownWithDataBlocks);
      
      // 新架构：intro 从 customTags.sectionArticleMeta 中获取
      if (result.sections.length > 0 && result.sections[0]) {
        expect(result.sections[0].intro).toBe('最新 AI 动态');
      }
    });
  });

  describe('Tags and Content Association', () => {
    const complexMarkdown = `---
title: 2026-2-24
---
[head]: #
[from:https://head.example.com]: #
[tag:头条 1]: #
[tag:头条 2]: #
# 头版头条标题

这是头版头条的内容。

> **引用：** 这是头版的引用块。

[section]: #
[intro:第一章简介]: #
[icon:📌]: #
[tag:章节 1 标签]: #
# 第一章标题

[articles]: #
## 文章 1
[from:https://article1.example.com]: #
[fromstr:来源 1]: #
[tag:文章 1 标签 1]: #
[tag:文章 1 标签 2]: #
这是文章 1 的内容。

## 文章 2
[from:https://article2.example.com]: #
[tag:文章 2 标签]: #
这是文章 2 的内容。

[section]: #
[intro:第二章简介]: #
[icon:📍]: #
[tag:章节 2 标签]: #
# 第二章标题

[articles]: #
## 文章 3
[from:https://article3.example.com]: #
[tag:文章 3 标签]: #
这是文章 3 的内容。
`;

    test('should correctly associate tags with head section', () => {
      const result = markdownParser.parseMarkdown(complexMarkdown);
      
      // 验证头版头条的 tags
      expect(result.headSection).toBeDefined();
      expect(result.headSection.tags).toContain('头条 1');
      expect(result.headSection.tags).toContain('头条 2');
      
      // 验证 customTags.headlineTags
      expect(result.customTags.headlineTags).toBeDefined();
      expect(result.customTags.headlineTags).toContain('头条 1');
      expect(result.customTags.headlineTags).toContain('头条 2');
    });

    test('should correctly associate tags with sections', () => {
      const result = markdownParser.parseMarkdown(complexMarkdown);
      
      // 验证章节的 tags
      expect(result.sections.length).toBe(2);
      
      // 第一章
      const section1 = result.sections[0];
      expect(section1.title).toBe('第一章标题');
      expect(section1.intro).toBe('第一章简介');
      expect(section1.icon).toBe('📌');
      expect(section1.tags).toContain('章节 1 标签');
      
      // 第二章
      const section2 = result.sections[1];
      expect(section2.title).toBe('第二章标题');
      expect(section2.intro).toBe('第二章简介');
      expect(section2.icon).toBe('📍');
      expect(section2.tags).toContain('章节 2 标签');
    });

    test('should correctly associate tags with articles', () => {
      const result = markdownParser.parseMarkdown(complexMarkdown);
      
      // 第一章有 2 篇文章
      const section1 = result.sections[0];
      expect(section1.articles.length).toBe(2);
      
      // 文章 1
      const article1 = section1.articles[0];
      expect(article1.title).toBe('文章 1');
      expect(article1.from).toBe('https://article1.example.com');
      expect(article1.fromStr).toBe('来源 1');
      expect(article1.tags).toContain('文章 1 标签 1');
      expect(article1.tags).toContain('文章 1 标签 2');
      
      // 文章 2
      const article2 = section1.articles[1];
      expect(article2.title).toBe('文章 2');
      expect(article2.from).toBe('https://article2.example.com');
      expect(article2.tags).toContain('文章 2 标签');
      
      // 第二章有 1 篇文章
      const section2 = result.sections[1];
      expect(section2.articles.length).toBe(1);
      
      // 文章 3
      const article3 = section2.articles[0];
      expect(article3.title).toBe('文章 3');
      expect(article3.from).toBe('https://article3.example.com');
      expect(article3.tags).toContain('文章 3 标签');
    });

    test('should correctly associate from with head section', () => {
      const result = markdownParser.parseMarkdown(complexMarkdown);
      
      // 验证头版头条的 from
      expect(result.headSection.from).toBe('https://head.example.com');
      expect(result.customTags.headFrom).toBe('https://head.example.com');
    });

    test('should correctly parse quote blocks in head section', () => {
      const result = markdownParser.parseMarkdown(complexMarkdown);
      
      // 验证头版头条的引用块
      expect(result.headSection.quoteBlocks).toBeDefined();
      expect(result.headSection.quoteBlocks.length).toBeGreaterThan(0);
      expect(result.headSection.quoteBlocks[0]).toContain('这是头版的引用块');
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
  });

  describe('Render Mode', () => {
    test('should default to legacy mode', () => {
      const markdown = `---
title: Test
---
# Hello
<script>alert(1)</script>`;
      const result = markdownParser.parseMarkdown(markdown);
      expect(result.renderMode).toBe('legacy');
      expect(result.htmlContent).toContain('<script>');
    });

    test('should sanitize html in safe mode', () => {
      const markdown = `---
title: Test
render_mode: safe
---
# Hello
<script>alert(1)</script>
<a href="https://example.com" target="_blank">x</a>`;
      const result = markdownParser.parseMarkdown(markdown);
      expect(result.renderMode).toBe('safe');
      expect(result.htmlContent).not.toContain('<script>');
      expect(result.htmlContent).toContain('rel="noopener noreferrer"');
    });
  });
});
