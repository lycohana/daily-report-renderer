/**
 * [from:xxx] 标签处理�?
 * 用于标记来源 URL
 */

const BaseHandler = require('../../BaseHandler');

class FromHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[from:([^\]]+)\]:\s*#\s*$/m;
  }

  getType() {
    return 'inline';
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
          value: match[1],
          lineIndex: i
        });

        if (context?.collector) {
          context.collector.collect('from', match[1], context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = FromHandler;
