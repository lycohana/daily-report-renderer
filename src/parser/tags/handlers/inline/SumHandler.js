/**
 * [sum:xxx] 标签处理器
 * 用于标记摘要
 * 作为行内标签，只收集元数据，渲染到章节末尾
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

    const value = match[1];
    
    // 只收集元数据，不返回 HTML
    if (context?.collector) {
      context.collector.collect('sum', value, context.state);
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
.analysis-box{margin-top:28px;padding:20px;background:#f8f9fa;border-left:4px solid var(--accent-blue);border-radius:0 8px 8px 0}
.analysis-title{font-size:.85rem;font-weight:600;color:var(--accent-blue);margin-bottom:10px;display:flex;align-items:center;gap:.8px}
.analysis-title::before{content:'💡';color:var(--accent-blue);font-size:.9rem}
.analysis-content{font-size:.92rem;color:var(--text-dark);line-height:1.65}
    `.trim();
  }
}

module.exports = SumHandler;
