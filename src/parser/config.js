/**
 * Markdown配置模块
 * 
 * 包含Markdown-it解析器的配置和初始化
 */

const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');

/**
 * 创建并配置Markdown-it实例
 * 
 * 配置选项：
 * - html: 允许HTML标签
 * - linkify: 自动转换URL为链接
 * - typographer: 智能标点符号
 * - breaks: 转换换行为<br>
 * - highlight: 代码高亮回调
 * 
 * @returns {MarkdownIt} 配置好的Markdown-it实例
 */
function createMarkdownIt() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function (str, lang) {
      return `<pre class="code-block"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  md.use(anchor, {
    permalink: anchor.permalink.headerLink(),
    level: [1, 2, 3, 4],
    slugify: (s) => s.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  });

  // 添加自定义规则渲染<data>块
  // 使用markdown-it的渲染后处理
  md.renderer.rules.paragraph_open = function(tokens, idx, options, env, self) {
    // 检查下一个token是否是包含data的inline
    const nextToken = tokens[idx + 1];
    if (nextToken && nextToken.type === 'inline') {
      const content = nextToken.content;
      if (content.includes('<data>')) {
        // 替换data块
        const newContent = content.replace(/&lt;data&gt;([\s\S]*?)&lt;\/data&gt;/g, (match, dataContent) => {
          // 解码HTML实体
          dataContent = dataContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
          const items = [];
          const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
          let numMatch;
          while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
            items.push({ value: numMatch[1], label: numMatch[2] });
          }
          
          if (items.length > 0) {
            const itemsHtml = items.map(item => 
              `<div class="front-stat">
                <div class="front-stat-value">${item.value}</div>
                <div class="front-stat-label">${item.label}</div>
              </div>`
            ).join('');
            
            return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
          }
          return '';
        });
        nextToken.content = newContent;
      }
    }
    return self.renderToken(tokens, idx, options);
  };
  
  md.renderer.rules.paragraph_close = function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  return md;
}

module.exports = {
  createMarkdownIt
};
