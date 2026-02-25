/**
 * [head]: 标签处理器
 * 头版头条标记
 */

const BaseHandler = require('../../BaseHandler');

class HeadHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[head\]:\s*#\s*$/;
  }

  getType() {
    return 'marker';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    if (context?.collector) {
      context.collector.onMarker('head');
    }

    return {
      name: this.name,
      match: match[0],
      lineIndex
    };
  }

  clean(content) {
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }
}

module.exports = HeadHandler;
