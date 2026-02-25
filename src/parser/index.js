/**
 * Parser模块入口
 * 
 * 统一导出所有解析器模块
 */

const markdownParser = require('../markdownParser');

module.exports = {
  parseMarkdown: markdownParser.parseMarkdown,
  extractCustomTags: markdownParser.extractCustomTags,
  parseFrontMatter: markdownParser.parseFrontMatter,
  extractTitleFromFrontMatter: markdownParser.extractTitleFromFrontMatter,
  extractEditionFromFrontMatter: markdownParser.extractEditionFromFrontMatter,
  md: markdownParser.md
};
