/**
 * 标签注册表
 * 管理所有标签处理器
 */

const definitions = require('./definitions');
const InlineHandler = require('./handlers/inlineHandler');
const MarkerHandler = require('./handlers/markerHandler');
const BlockHandler = require('./handlers/blockHandler');

class TagRegistry {
  constructor() {
    this.handlers = new Map();
    this.initialize();
  }

  initialize() {
    for (const def of definitions) {
      let HandlerClass;
      switch (def.type) {
        case 'inline':
          HandlerClass = InlineHandler;
          break;
        case 'marker':
          HandlerClass = MarkerHandler;
          break;
        case 'block':
          HandlerClass = BlockHandler;
          break;
        default:
          throw new Error(`Unknown handler type: ${def.type}`);
      }
      this.handlers.set(def.name, new HandlerClass(def, this));
    }
  }

  getHandler(name) {
    return this.handlers.get(name);
  }

  getAllHandlers() {
    return Array.from(this.handlers.values());
  }

  // 解析所有标签
  parse(content, context = {}) {
    context = {
      state: {
        inHeadline: true,
        inSection: false,
        inArticles: false,
        sectionIndex: -1,
        articleIndex: 0,
      },
      results: {
        tags: {},
        markers: {},
        blocks: {},
      },
      ...context,
    };

    for (const handler of this.handlers.values()) {
      const results = handler.parse(content, context);
      if (results.length > 0) {
        context.results[handler.name] = results;
      }
    }

    return context.results;
  }

  // 清理内容中的标签
  clean(content) {
    for (const handler of this.handlers.values()) {
      content = handler.clean(content);
    }
    return content;
  }

  // 完整的解析方法：返回 tags 和 cleanContent（兼容旧接口）
  // 注意：只清理 inline 标签，保留 marker 标签供 markdownParser.js 使用
  extractTags(content, context = {}) {
    context = {
      state: {
        inHeadline: true,
        inSection: false,
        inArticles: false,
        sectionIndex: -1,
        articleIndex: 0,
      },
      results: {
        tags: {},
        markers: {},
        blocks: {},
      },
      ...context,
    };

    for (const handler of this.handlers.values()) {
      const results = handler.parse(content, context);
      if (results.length > 0) {
        context.results[handler.name] = results;
      }
    }

    // 只清理 inline 标签，保留 marker 标签（section, head, articles）
    let cleanContent = content;
    for (const handler of this.handlers.values()) {
      // 只清理 inline 和 block 类型，保留 marker
      const def = handler.definition;
      if (def.type === 'inline' || def.type === 'block') {
        cleanContent = handler.clean(cleanContent);
      }
    }

    // 转换为旧架构兼容的格式
    const tags = this._convertToLegacyFormat(context.results);

    return { tags, cleanContent };
  }

  // 转换为旧架构兼容的格式
  _convertToLegacyFormat(results) {
    const tags = {};

    // 处理行内标签 (tag, from, fromstr, intro, icon, sum, think)
    const inlineTags = ['tag', 'from', 'fromstr', 'intro', 'icon', 'sum', 'think'];
    for (const name of inlineTags) {
      if (results[name]) {
        if (name === 'tag') {
          // tag 可能有多个值
          tags.tag = results[name].map(r => r.value);
        } else if (results[name].length > 0) {
          tags[name] = results[name][0].value;
        }
      }
    }

    // 处理标记 (head, section, articles)
    if (results.head) {
      tags.head = true;
    }
    if (results.section) {
      tags.section = results.section.map(r => r.lineIndex);
    }
    if (results.articles) {
      tags.articles = true;
    }

    // 处理区块 (data, quote, weather)
    if (results.data) {
      tags.data = results.data.map(d => d.data);
    }
    if (results.quote) {
      tags.quoteBlocks = results.quote.map(r => r.data.content);
    }
    if (results.weather) {
      tags.weather = results.weather.map(w => w.data);
    }

    return tags;
  }
}

module.exports = new TagRegistry();
