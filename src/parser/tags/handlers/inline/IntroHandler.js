/**
 * [intro:xxx] 标签处理�?
 * 用于标记章节简�?
 */

const BaseHandler = require('../../BaseHandler');

class IntroHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[intro:([^\]]+)\]:\s*#\s*$/m;
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
          context.collector.collect('intro', match[1], context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = IntroHandler;
