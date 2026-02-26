const { processBlocks } = require('../blocks');
const { applySecurityMode } = require('../security');

/**
 * HTML 渲染编排器
 *
 * @param {Object} params
 * @param {Object} params.md - markdown-it 实例
 * @param {string} params.cleanContent - 清理后的 markdown 内容
 * @param {string} params.headSectionContent - 头版内容
 * @param {string} params.renderMode - 渲染模式
 * @returns {{ htmlContent: string, headSectionHtml: string }}
 */
function renderHtmlContent({ md, cleanContent, headSectionContent, renderMode }) {
  let htmlContent = md.render(cleanContent);
  htmlContent = processBlocks(htmlContent, md);
  htmlContent = applySecurityMode(htmlContent, renderMode);

  let headSectionHtml = '';
  if (headSectionContent) {
    headSectionHtml = md.render(headSectionContent);
    headSectionHtml = processBlocks(headSectionHtml, md);
    headSectionHtml = applySecurityMode(headSectionHtml, renderMode);
  }

  return { htmlContent, headSectionHtml };
}

module.exports = {
  renderHtmlContent
};
