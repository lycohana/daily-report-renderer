/**
 * <think>...</think> 标签处理器
 * 用于标记观点，作为 block 类型处理器，原地渲染 HTML
 */

const BaseHandler = require('../../BaseHandler');

class ThinkBlockHandler extends BaseHandler {
  constructor() {
    super();
    // 匹配 <think>...</think> 区块
    this.syntax = /<think>([\s\S]*?)<\/think>/g;
  }

  getType() {
    return 'block';
  }

  parseDocument(content, context) {
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
    return `<div class="thought-box"><div class="thought-title">思考</div><div class="thought-content">${value}</div></div>`;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }

  getStyles() {
    return `
.thought-box{margin-top:18px;padding:16px;background:linear-gradient(135deg,#fef9e7,#fffcf5);border:1px solid #f0e6c8;border-radius:8px}
.thought-title{font-size:.8rem;font-weight:600;color:var(--accent-gold);margin-bottom:8px;display:flex;align-items:center;gap:5px}
.thought-title::before{content:'💡';font-size:.7rem}
.thought-content{font-size:.88rem;color:var(--text-dark);font-style:italic;line-height:1.6}
    `.trim();
  }
}

module.exports = ThinkBlockHandler;
