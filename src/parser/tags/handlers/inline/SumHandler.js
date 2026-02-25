/**
 * [sum:xxx] 标签处理器
 * 用于标记摘要
 */

const BaseHandler = require('../../BaseHandler');

class SumHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[sum:([^\]]+)\]:\s*#\s*$/;
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
      context.collector.collect('sum', match[1], context.state);
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

module.exports = SumHandler;
