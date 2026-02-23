/**
 * [head]: 标签处理器
 * 头版头条标记
 */

const BaseHandler = require('../BaseHandler');

class HeadHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[head\]:\s*#\s*$/m;
  }

  getType() {
    return 'marker';
  }

  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(this.syntax);

      if (match) {
        results.push({
          name: this.name,
          match: match[0],
          lineIndex: i,
        });

        if (context?.collector) {
          context.collector.onMarker('head');
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = HeadHandler;
