/**
 * 标签处理器基类
 */

class BaseHandler {
  constructor(definition, registry) {
    this.definition = definition;
    this.registry = registry;
    this.name = definition.name;
  }

  /**
   * 解析标签
   * @param {string} content - 内容
   * @param {Object} context - 上下文
   * @returns {Array} 解析结果
   */
  parse(_content, _context) {
    throw new Error('Not implemented');
  }

  /**
   * 清理标签
   * @param {string} content - 内容
   * @returns {string} 清理后的内容
   */
  clean(content) {
    return content;
  }

  /**
   * 验证作用域
   * @param {string} scope - 作用域
   * @returns {boolean} 是否可以应用
   */
  canApply(scope) {
    return this.definition.scope.includes(scope) ||
           this.definition.scope.includes('global');
  }
}

module.exports = BaseHandler;
