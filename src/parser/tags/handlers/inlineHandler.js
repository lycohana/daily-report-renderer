/**
 * 行内标签处理器
 * 处理 [tag:xxx] 类型的标签
 */

const BaseHandler = require('./baseHandler');

class InlineHandler extends BaseHandler {
  parse(content, context) {
    const regex = new RegExp(this.definition.syntax.source, 'gm');
    const results = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const extracted = this.definition.extract ? this.definition.extract(match, context) : { value: match[1] };
      if (extracted) {
        results.push({
          name: this.name,
          value: extracted.value || extracted,
          match: match[0],
          index: match.index,
        });
      }
    }

    return results;
  }

  clean(content) {
    if (!this.definition.clean) return content;
    const regex = new RegExp(this.definition.syntax.source, 'gm');
    return content.replace(regex, '');
  }
}

module.exports = InlineHandler;
