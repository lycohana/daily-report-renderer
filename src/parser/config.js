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

  return md;
}

module.exports = {
  createMarkdownIt
};
