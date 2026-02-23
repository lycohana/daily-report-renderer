/**
 * Front Matter解析模块
 * 
 * 负责解析Markdown文件开头的YAML格式元数据
 * 
 * Front Matter格式：
 * ---
 * key: value
 * key2: value2
 * ---
 */

/**
 * 解析Front Matter元数据
 * 
 * @param {string} content - 完整的Markdown文件内容
 * @returns {Object} - { frontMatter: Object, content: string }
 *   - frontMatter: 解析后的元数据对象
 *   - content: 去除Front Matter后的内容
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]+/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: {}, content };
  }

  const frontMatterStr = match[1];
  const frontMatter = {};
  
  frontMatterStr.split(/\r?\n/).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith('\'') && value.endsWith('\''))) {
        value = value.slice(1, -1);
      }
      
      frontMatter[key] = value;
    }
  });

  return {
    frontMatter,
    content: content.substring(match[0].length)
  };
}

module.exports = {
  parseFrontMatter
};
