/**
 * <data>...</data> 标签处理器
 * 数据块
 */

const BaseHandler = require('../../BaseHandler');

class DataHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /<data>([\s\S]*?)<\/data>/g;
  }

  getType() {
    return 'block';
  }

  parseDocument(content, context) {
    const results = [];
    let match;
    this.syntax.lastIndex = 0;

    while ((match = this.syntax.exec(content)) !== null) {
      const parsedData = this._parseDataBlock(match[1]);
      if (parsedData) {
        results.push({
          name: this.name,
          data: parsedData,
          match: match[0],
          index: match.index
        });

        if (context?.collector) {
          context.collector.onDataBlock(parsedData);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content; // 保留在内容中
  }

  getStyles() {
    return `
.front-stats{display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;padding:20px;background:linear-gradient(135deg,#f8f9fa,#fff);border-radius:12px}
.front-stat{flex:1;min-width:120px;text-align:center;padding:12px}
.front-stat-value{font-size:1.6rem;font-weight:700;color:var(--accent-blue)}
.front-stat-label{font-size:.78rem;color:var(--text-muted);margin-top:4px}
    `.trim();
  }

  _parseDataBlock(dataContent) {
    const items = [];
    const regex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
    let numMatch;
    while ((numMatch = regex.exec(dataContent)) !== null) {
      items.push({ value: numMatch[1], label: numMatch[2] });
    }
    return items.length > 0 ? items : null;
  }
}

module.exports = DataHandler;
