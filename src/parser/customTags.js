/**
 * 自定义标签提取模块
 * 使用新的 tags/index.js 架构作为核心解析引擎
 */

const tagRegistry = require('./tags');

/**
 * 提取自定义标签
 *
 * @param {string} content - Markdown 文件内容（已去除 Front Matter）
 * @returns {Object} - { tags: Object, cleanContent: string }
 *   - tags: 提取的标签对象
 *   - cleanContent: 去除标签后的干净内容
 */
function extractCustomTags(content) {
  return tagRegistry.extractTags(content);
}

module.exports = {
  extractCustomTags
};
