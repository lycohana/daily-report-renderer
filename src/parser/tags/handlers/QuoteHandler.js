/**
 * 引用块 > 标签处理器
 * 处理 Markdown 引用块
 */

const BaseHandler = require('../BaseHandler');

class QuoteHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^> (.+)$/gm;
  }

  getType() {
    return 'block';
  }

  parse(content, context) {
    const results = [];
    const quoteBlocks = [];
    let match;
    let lastMatchEnd = -1;
    let currentQuote = null;

    // 只处理第一个 section 之前的内容
    // 检测 section 开始：[section]: 标记或第二个 # 标题
    const lines = content.split('\n');
    let headEndIndex = -1;
    let foundFirstHeading = false;
    
    for (let i = 0; i < lines.length; i++) {
      // 检查 [section]: 标记
      if (lines[i].startsWith('[section]:')) {
        headEndIndex = i;
        break;
      }
      // 检查 # 标题
      if (lines[i].startsWith('# ')) {
        if (!foundFirstHeading) {
          foundFirstHeading = true;
        } else {
          // 第二个 # 标题，section 开始
          headEndIndex = i;
          break;
        }
      }
    }
    
    const headContent = headEndIndex === -1 ? content : lines.slice(0, headEndIndex).join('\n');

    while ((match = this.syntax.exec(headContent)) !== null) {
      if (lastMatchEnd !== -1 && match.index - lastMatchEnd > 1) {
        if (currentQuote) {
          quoteBlocks.push(currentQuote.trim());
          currentQuote = null;
        }
      }
      if (!currentQuote) {
        currentQuote = match[1];
      } else {
        currentQuote += '\n' + match[1];
      }
      lastMatchEnd = match.index + match[0].length;
    }
    if (currentQuote) {
      quoteBlocks.push(currentQuote.trim());
    }

    if (quoteBlocks.length > 0) {
      results.push({
        name: this.name,
        data: { content: quoteBlocks.join('\n\n') },
        match: quoteBlocks.join('\n')
      });

      if (context?.collector) {
        context.collector.setQuoteBlocks(quoteBlocks);
      }
    }

    return results;
  }

  clean(content) {
    // 只清理第一个 section 之前的引用块
    const sectionIndex = content.indexOf('[section]:');
    if (sectionIndex === -1) {
      return content.replace(this.syntax, '');
    }
    const headPart = content.substring(0, sectionIndex).replace(this.syntax, '');
    const bodyPart = content.substring(sectionIndex);
    return headPart + bodyPart;
  }

  getStyles() {
    return `
.front-detail{margin-top:28px;padding:20px;background:#f8f9fa;border-left:4px solid var(--accent-blue);border-radius:0 8px 8px 0}
.front-detail blockquote{margin:0;padding:0 16px;border-left:3px solid #ddd;font-style:italic}
    `.trim();
  }
}

module.exports = QuoteHandler;
