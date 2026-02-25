/**
 * [think:xxx] 标签处理器
 * 用于标记观点
 * 作为 block 类型处理器，直接在内容中渲染 HTML
 */

const BaseHandler = require('../../BaseHandler');

class ThinkHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[think:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    const value = match[1];
    
    // 仍然收集元数据用于向后兼容
    if (context?.collector) {
      context.collector.collect('think', value, context.state);
    }

    // 返回 HTML 用于直接渲染
    return {
      name: this.name,
      value: value,
      lineIndex,
      html: `<div class="thought-box"><div class="thought-title">思考</div><div class="thought-content">${value}</div></div>`
    };
  }

  clean(content) {
    // 完全移除标签，因为已经在 parseLine 中转换为 HTML
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
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
