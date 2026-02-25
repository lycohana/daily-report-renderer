/**
 * [section]: 标签处理器
 * 章节标记
 */

const BaseHandler = require('../../BaseHandler');

class SectionHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[section\]:\s*#\s*$/;
  }

  getType() {
    return 'marker';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    if (context?.collector) {
      context.collector.onMarker('section');
    }

    return {
      name: this.name,
      match: match[0],
      lineIndex
    };
  }

  clean(content) {
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }
}

module.exports = SectionHandler;
