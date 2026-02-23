/**
 * [icon:xxx] 标签处理器
 * 用于标记章节图标
 */

const BaseHandler = require('../BaseHandler');

class IconHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[icon:([^\]]+)\]:\s*#\s*$/m;
  }

  getType() {
    return 'inline';
  }

  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(this.syntax);

      if (match) {
        // 提取第一个 emoji 或整个字符串
        const emojiMatch = match[1].match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
        const value = emojiMatch ? emojiMatch[0] : match[1];

        results.push({
          name: this.name,
          value: value,
          lineIndex: i,
        });

        if (context?.collector) {
          context.collector.collect('icon', value, context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = IconHandler;
