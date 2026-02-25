/**
 * <sum>...</sum> 标签处理器
 * 用于标记摘要，作为 block 类型处理器，原地渲染 HTML
 */

const BaseHandler = require('../../BaseHandler');

class SumBlockHandler extends BaseHandler {
  constructor() {
    super();
    // 匹配 <sum>...</sum> 区块
    this.syntax = /<sum>([\s\S]*?)<\/sum>/g;
  }

  getType() {
    return 'block';
  }

  parseDocument(content, _context) {
    const results = [];
    const matches = [...content.matchAll(this.syntax)];
    
    for (const match of matches) {
      const value = match[1].trim();
      results.push({
        name: this.name,
        value: value,
        html: this._renderHTML(value)
      });
    }
    
    return results;
  }

  _renderHTML(value) {
    return `<div class="analysis-box"><div class="analysis-title">总结</div><div class="analysis-content">${value}</div></div>`;
  }

  clean(content) {
    return content.replace(this.syntax, '');
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

module.exports = SumBlockHandler;
