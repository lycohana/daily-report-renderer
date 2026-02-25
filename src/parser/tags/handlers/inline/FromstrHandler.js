/**
 * [fromstr:xxx] 标签处理器
 * 用于标记来源名称
 */

const BaseHandler = require('../../BaseHandler');

class FromstrHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[fromstr:([^\]]+)\]:\s*#\s*$/;
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
      context.collector.collect('fromstr', match[1], context.state);
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

module.exports = FromstrHandler;
