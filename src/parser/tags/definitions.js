/**
 * 标签定义配置文件
 * 新增标签只需修改这里
 */

module.exports = [
  // ========== 行内标签 ==========

  // [tag:xxx] - 标签
  {
    name: 'tag',
    type: 'inline',
    syntax: /^\[tag:([^\]]+)\]:\s*#\s*$/m,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // [from:xxx] - 来源URL
  {
    name: 'from',
    type: 'inline',
    syntax: /^\[from:([^\]]+)\]:\s*#\s*$/m,
    scope: ['section', 'article'],
    maxOccurrences: 1,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // [fromstr:xxx] - 来源名称
  {
    name: 'fromstr',
    type: 'inline',
    syntax: /^\[fromstr:([^\]]+)\]:\s*#\s*$/m,
    scope: ['section', 'article'],
    maxOccurrences: 1,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // [intro:xxx] - 章节简介
  {
    name: 'intro',
    type: 'inline',
    syntax: /^\[intro:([^\]]+)\]:\s*#\s*$/m,
    scope: ['section'],
    maxOccurrences: 1,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // [icon:xxx] - 章节图标
  {
    name: 'icon',
    type: 'inline',
    syntax: /^\[icon:([^\]]+)\]:\s*#\s*$/m,
    scope: ['section'],
    maxOccurrences: 1,
    extract: (match) => {
      const emojiMatch = match[1].match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
      return { value: emojiMatch ? emojiMatch[0] : match[1] };
    },
    clean: (match) => match[0],
  },

  // [sum:xxx] - 摘要
  {
    name: 'sum',
    type: 'inline',
    syntax: /^\[sum:([^\]]+)\]:\s*#\s*$/m,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: 1,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // [think:xxx] - 观点
  {
    name: 'think',
    type: 'inline',
    syntax: /^\[think:([^\]]+)\]:\s*#\s*$/m,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,
    extract: (match) => ({ value: match[1] }),
    clean: (match) => match[0],
  },

  // ========== 标记标签 ==========

  // [head]: # - 头版头条标记
  {
    name: 'head',
    type: 'marker',
    syntax: /^\[head\]:\s*#\s*$/m,
    scope: ['headline'],
    maxOccurrences: 1,
    onMatch: (context) => {
      context.state.inHeadline = true;
    },
    clean: (match) => match[0],
  },

  // [section]: # - 章节标记
  {
    name: 'section',
    type: 'marker',
    syntax: /^\[section\]:\s*#\s*$/m,
    scope: ['global'],
    maxOccurrences: Infinity,
    onMatch: (context) => {
      context.state.inSection = true;
      context.state.sectionIndex++;
    },
    clean: (match) => match[0],
  },

  // [articles]: # - 文章列表标记
  {
    name: 'articles',
    type: 'marker',
    syntax: /^\[articles\]:\s*#\s*$/m,
    scope: ['section'],
    maxOccurrences: 1,
    onMatch: (context) => {
      context.state.inArticles = true;
    },
    clean: (match) => match[0],
  },

  // ========== 区块标签 ==========

  // <data>...</data> - 数据块
  {
    name: 'data',
    type: 'block',
    syntax: /<data>([\s\S]*?)<\/data>/g,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,
    extract: (match) => {
      const items = [];
      const regex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
      let m;
      while ((m = regex.exec(match[1])) !== null) {
        items.push({ value: m[1], label: m[2] });
      }
      return items.length > 0 ? items : null;
    },
    clean: null, // 保留在内容中，由渲染器处理
  },

  // 引用块 >
  {
    name: 'quote',
    type: 'block',
    syntax: /^> (.+)$/gm,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,
    extract: (match) => ({ content: match[1] }),
    clean: null, // 保留在内容中
  },
];
