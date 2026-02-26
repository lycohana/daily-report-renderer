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
    return ''; // 样式已移至 components.css
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
