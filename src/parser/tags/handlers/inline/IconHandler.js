/**
 * [icon:xxx] 标签处理器
 * 用于标记章节图标
 */

const BaseHandler = require('../../BaseHandler');

class IconHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[icon:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    const emojiMatch = match[1].match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
    const value = emojiMatch ? emojiMatch[0] : match[1];

    if (context?.collector) {
      context.collector.collect('icon', value, context.state);
    }

    return {
      name: this.name,
      value,
      lineIndex
    };
  }

  clean(content) {
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }
}

module.exports = IconHandler;
