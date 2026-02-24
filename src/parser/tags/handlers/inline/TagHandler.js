/**
 * [tag:xxx] 标签处理�?
 * 用于标记文章标签
 */

const BaseHandler = require('../../BaseHandler');

class TagHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[tag:([^\]]+)\]:\s*#\s*$/m;
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
          context.collector.collect('tag', match[1], context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }

  getStyles() {
    return `
.front-tag{font-size:.72rem;padding:4px 12px;background:#f0ede8;border-radius:20px;color:var(--text-muted)}
.article-tag{display:inline-block;background:#e8e6e1;padding:2px 10px;border-radius:4px;margin-right:8px;font-size:.72rem}
    `.trim();
  }
}

module.exports = TagHandler;
