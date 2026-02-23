/**
 * 标记标签处理器
 * 处理 [section]:, [head]: 等标记类型标签
 */

const BaseHandler = require('./baseHandler');

class MarkerHandler extends BaseHandler {
  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(this.definition.syntax.source);
      const match = line.match(regex);

      if (match) {
        results.push({
          name: this.name,
          match: match[0],
          lineIndex: i,
        });

        // 执行 onMatch 回调
        if (this.definition.onMatch) {
          this.definition.onMatch(context);
        }
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

module.exports = MarkerHandler;
