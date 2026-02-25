/**
 * 标签处理器基类
 * 所有标签处理器的父类
 */

class BaseHandler {
  constructor() {
    this.name = this.constructor.name.replace('Handler', '').toLowerCase();
  }

  getName() {
    return this.name;
  }

  /**
   * 解析标签（兼容入口）
   * inline/marker: 按行调用 parseLine
   * block: 调用 parseDocument
   * @param {string} content - 内容（整段或单行）
   * @param {Object} context - 上下文
   * @returns {Array} 解析结果数组
   */
  parse(content, context) {
    if (this.getType() === 'block') {
      return this.parseDocument(content, context) || [];
    }

    const lines = String(content).split('\n');
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const parsed = this.parseLine(lines[i], context, i);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else if (parsed) {
        results.push(parsed);
      }
    }
    return results;
  }

  /**
   * 逐行解析（inline/marker 处理器实现）
   * @param {string} _line - 单行内容
   * @param {Object} _context - 上下文
   * @param {number} _lineIndex - 行号
   * @returns {Object|Object[]|null}
   */
  parseLine(_line, _context, _lineIndex) {
    return null;
  }

  /**
   * 文档级解析（block 处理器实现）
   * @param {string} _content - 文档内容
   * @param {Object} _context - 上下文
   * @returns {Array}
   */
  parseDocument(_content, _context) {
    return [];
  }

  /**
   * 清理标签 - 子类可选实现
   * @param {string} content - 内容
   * @returns {string} 清理后的内容
   */
  clean(content) {
    return content;
  }

  /**
   * 获取标签类型
   * @returns {'inline'|'marker'|'block'}
   */
  getType() {
    return 'inline';
  }

  /**
   * 获取标签所需的 CSS 样式
   * 子类可重写此方法返回自定义样式
   * @returns {string} CSS 样式字符串
   */
  getStyles() {
    return '';
  }
}

module.exports = BaseHandler;
