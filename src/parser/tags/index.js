/**
 * 标签注册表
 * 自动发现并注册所有标签处理器
 */

const fs = require('fs');
const path = require('path');
const MetaCollector = require('./MetaCollector');

class TagRegistry {
  constructor() {
    this.handlers = [];
    this.styleCache = null;
    this.initialize();
  }

  /**
   * 自动发现并注册所有标签处理器
   */
  initialize() {
    const handlersDir = path.join(__dirname, 'handlers');

    if (!fs.existsSync(handlersDir)) {
      console.warn(`Handlers directory not found: ${handlersDir}`);
      return;
    }

    // 递归扫描所有子目录 (inline/, marker/, block/)
    const scanDirectory = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('Handler.js')) {
          try {
            const HandlerClass = require(fullPath);
            const handler = new HandlerClass();
            this.handlers.push(handler);
          } catch (err) {
            console.error(`Failed to load handler ${entry.name}:`, err.message);
          }
        }
      }
    };

    scanDirectory(handlersDir);
  }

  /**
   * 获取所有处理器
   */
  getAllHandlers() {
    return this.handlers;
  }

  /**
   * 获取指定名称的处理器
   */
  getHandler(name) {
    return this.handlers.find((h) => h.name === name.toLowerCase());
  }

  /**
   * 提取标签（主入口）
   */
  extractTags(content, options = {}) {
    const collector = options.collector || new MetaCollector();
    const context = { collector, state: collector.state };

    // 按类型分组处理
    const inlineHandlers = this.handlers.filter((h) => h.getType() === 'inline');
    const markerHandlers = this.handlers.filter((h) => h.getType() === 'marker');
    const blockHandlers = this.handlers.filter((h) => h.getType() === 'block');

    // 逐行处理：先处理 marker 建立状态，然后处理 inline tags
    const lines = content.split('\n');
    const htmlReplacements = new Map(); // 存储行号到 HTML 的映射
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 先处理 marker handlers（建立状态）- 使用单行内容
      for (const handler of markerHandlers) {
        if (typeof handler.parseLine === 'function') {
          handler.parseLine(line, context, i);
        } else {
          handler.parse(line, context);
        }
      }
      
      // 检测 # 标题并通知 collector（在 marker 之后，这样 articles 状态已经设置）
      const headingMatch = line.match(/^(#{1,2})\s/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        collector.onHeading(level);
      }
      
      // 然后处理 inline handlers（收集元数据 + 生成 HTML）
      for (const handler of inlineHandlers) {
        let result;
        if (typeof handler.parseLine === 'function') {
          result = handler.parseLine(line, context, i);
        } else {
          result = handler.parse(line, context);
        }
        
        // 如果处理器返回 HTML，存储替换（行号 -> HTML）
        if (result && result.html) {
          htmlReplacements.set(i, result.html);
        }
      }
    }

    // 处理 block 标签（不需要逐行）
    for (const handler of blockHandlers) {
      if (typeof handler.parseDocument === 'function') {
        handler.parseDocument(content, context);
      } else {
        handler.parse(content, context);
      }
    }

    // 构建 cleanContent，同时应用 HTML 替换
    const cleanLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (htmlReplacements.has(i)) {
        // 使用 HTML 替换
        cleanLines.push(htmlReplacements.get(i));
      } else {
        // 正常清理
        let line = lines[i];
        for (const handler of [...inlineHandlers, ...markerHandlers]) {
          line = handler.clean(line);
        }
        cleanLines.push(line);
      }
    }
    const cleanContent = cleanLines.join('\n');

    // 获取元数据
    const meta = collector.getResult();

    // 构建返回结果
    const tags = this._buildTagsResult(meta);

    return { tags, cleanContent };
  }

  /**
   * 收集所有标签的样式
   * @returns {string} 所有样式的组合
   */
  collectStyles() {
    // 使用缓存避免重复计算
    if (this.styleCache) {
      return this.styleCache;
    }

    const styles = [];
    const seen = new Set();

    for (const handler of this.handlers) {
      if (typeof handler.getStyles === 'function') {
        const style = handler.getStyles();
        if (style && style.trim() && !seen.has(handler.name)) {
          styles.push(style.trim());
          seen.add(handler.name);
        }
      }
    }

    this.styleCache = styles.join('\n');
    return this.styleCache;
  }

  /**
   * 获取样式 HTML 标签
   * @returns {string} <style> 标签
   */
  getStylesHTML() {
    const styles = this.collectStyles();
    if (!styles) {
      return '';
    }
    return `<style>${styles}</style>`;
  }

  /**
   * 清除样式缓存（开发模式使用）
   */
  clearStyleCache() {
    this.styleCache = null;
  }

  /**
   * 构建标签结果对象
   * @private
   */
  _buildTagsResult(meta) {
    const tags = {};

    if (meta.sectionArticleMeta && meta.sectionArticleMeta.length > 0) {
      tags.sectionArticleMeta = meta.sectionArticleMeta;
    }

    if (meta.headlineTags) {
      tags.headlineTags = meta.headlineTags;
    }

    if (meta.headFrom) {
      tags.headFrom = meta.headFrom;
    }

    if (meta.headlineSum) {
      tags.headlineSum = meta.headlineSum;
    }

    if (meta.headlineThink) {
      tags.headlineThink = meta.headlineThink;
    }

    if (meta.dataBlocks) {
      tags.dataBlocks = meta.dataBlocks;
    }

    if (meta.quoteBlocks) {
      tags.quoteBlocks = meta.quoteBlocks;
    }

    // 添加 weather 标签支持
    if (meta.weather && meta.weather.length > 0) {
      tags.weather = meta.weather;
    }

    // 添加 hasHeadMarker 标志，用于 markdownParser.js 判断
    tags.hasHeadMarker = meta.hasHeadMarker;

    return tags;
  }
}

module.exports = new TagRegistry();
