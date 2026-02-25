/**
 * [from:xxx] 标签处理器
 * 用于标记来源 URL
 */

const BaseHandler = require('../../BaseHandler');

class FromHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[from:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    if (context?.collector) {
      context.collector.collect('from', match[1], context.state);
    }

    return {
      name: this.name,
      value: match[1],
      lineIndex
    };
  }

  clean(content) {
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }
}

module.exports = FromHandler;
