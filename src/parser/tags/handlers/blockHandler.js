/**
 * 区块标签处理器
 * 处理 <data>...</data> 等区块类型标签
 */

const BaseHandler = require('./baseHandler');

class BlockHandler extends BaseHandler {
  parse(content, context) {
    const results = [];
    let match;
    const regex = new RegExp(this.definition.syntax.source, 'gm');

    while ((match = regex.exec(content)) !== null) {
      const extracted = this.definition.extract ? this.definition.extract(match, context) : { content: match[1] };
      if (extracted) {
        results.push({
          name: this.name,
          data: extracted,
          match: match[0],
          index: match.index
        });
      }
    }

    return results;
  }

  // 区块标签通常保留在内容中，由渲染器处理
  clean(content) {
    return content;
  }
}

module.exports = BlockHandler;
