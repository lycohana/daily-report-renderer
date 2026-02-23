/**
 * 工具函数模块
 * 
 * 包含从Front Matter中提取标题、期号等辅助函数
 */

/**
 * 从Front Matter中提取标题
 * 
 * 优先级：
 * 1. frontMatter.title
 * 2. 从文件名中提取日期生成标题（如：每日日报 - 2026年2月22日）
 * 3. 使用文件名作为标题
 * 
 * @param {Object} frontMatter - Front Matter元数据
 * @param {string} filename - 文件名
 * @returns {string} 标题
 */
function extractTitleFromFrontMatter(frontMatter, filename) {
  if (frontMatter && frontMatter.title) {
    return frontMatter.title;
  }
  const dateMatch = filename.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateMatch) {
    const year = dateMatch[1];
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);
    return `每日日报 - ${year}年${month}月${day}日`;
  }
  return filename.replace(/\.md$/, '');
}

/**
 * 从Front Matter中提取期号
 * 
 * 优先级：
 * 1. frontMatter.number
 * 2. frontMatter.edition
 * 3. 从文件名中提取第一个数字
 * 4. 默认值 '001'
 * 
 * @param {Object} frontMatter - Front Matter元数据
 * @param {string} filename - 文件名
 * @returns {string} 期号
 */
function extractEditionFromFrontMatter(frontMatter, filename) {
  if (frontMatter && frontMatter.number) {
    return frontMatter.number;
  }
  if (frontMatter && frontMatter.edition) {
    return frontMatter.edition;
  }
  const match = filename.match(/(\d+)/);
  return match ? match[1] : '001';
}

/**
 * 清理内容中的多余空白字符
 * 
 * @param {string} content - 原始内容
 * @returns {string} 清理后的内容
 */
function cleanContent(content) {
  return content.replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
}

module.exports = {
  extractTitleFromFrontMatter,
  extractEditionFromFrontMatter,
  cleanContent
};
