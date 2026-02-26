/**
 * [think:xxx] 标签处理器
 * 用于标记观点
 * 作为行内标签，只收集元数据，渲染到章节末尾
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
    
    // 只收集元数据，不返回 HTML
    if (context?.collector) {
      context.collector.collect('think', value, context.state);
    }

    return {
      name: this.name,
      value: value,
      lineIndex
      // 不返回 html 字段，由视图层在章节末尾渲染
    };
  }

  clean(content) {
    return content;
  }

  getStyles() {
    return `
.thought-box{margin-top:18px;padding:16px;background:linear-gradient(135deg,#fef9e7,#fffcf5);border:1px solid #f0e6c8;border-radius:8px}
.thought-title{font-size:.8rem;font-weight:600;color:var(--accent-gold);margin-bottom:8px;display:flex;align-items:center;gap:5px}
.thought-title::before{content:'☁️';font-size:.7rem}
.thought-content{font-size:.88rem;color:var(--text-dark);font-style:italic;line-height:1.6}
    `.trim();
  }
}

module.exports = ThinkHandler;
