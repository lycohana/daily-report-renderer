/**
 * [think:xxx] 标签处理器
 * 用于标记观点
 */

const BaseHandler = require('../BaseHandler');

class ThinkHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[think:([^\]]+)\]:\s*#\s*$/m;
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
          context.collector.collect('think', match[1], context.state);
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
.thought-box{margin-top:18px;padding:16px;background:linear-gradient(135deg,#fef9e7,#fffcf5);border:1px solid #f0e6c8;border-radius:8px}
.thought-title{font-size:.8rem;font-weight:600;color:var(--accent-gold);margin-bottom:8px;display:flex;align-items:center;gap:5px}
.thought-content{font-size:.88rem;color:var(--text-dark);font-style:italic;line-height:1.6}
    `.trim();
  }
}

module.exports = ThinkHandler;
