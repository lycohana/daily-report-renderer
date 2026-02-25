/**
 * [sum:xxx] 标签处理器
 * 用于标记摘要
 * 作为 block 类型处理器，直接在内容中渲染 HTML
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
    
    // 仍然收集元数据用于向后兼容
    if (context?.collector) {
      context.collector.collect('sum', value, context.state);
    }

    // 返回 HTML 用于直接渲染
    return {
      name: this.name,
      value: value,
      lineIndex,
      html: `<div class="analysis-box"><div class="analysis-title">总结</div><div class="analysis-content">${value}</div></div>`
    };
  }

  clean(content) {
    // 完全移除标签，因为已经在 parseLine 中转换为 HTML
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }

  getStyles() {
    return `
.analysis-box{margin-top:28px;padding:20px;background:#f8f9fa;border-left:4px solid var(--accent-blue);border-radius:0 8px 8px 0}
.analysis-title{font-size:.85rem;font-weight:600;color:var(--accent-blue);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.analysis-title::before{content:'■';color:var(--accent-blue);font-size:.6rem}
.analysis-content{font-size:.92rem;color:var(--text-dark);line-height:1.65}
    `.trim();
  }
}

module.exports = SumHandler;
