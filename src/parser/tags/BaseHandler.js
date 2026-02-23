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
   * 解析标签 - 子类必须实现
   * @param {string} content - 内容
   * @param {Object} context - 上下文
   * @returns {Object|null} 解析结果
   */
  parse(_content, _context) {
    throw new Error('parse() must be implemented by subclass');
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
