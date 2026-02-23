/**
 * [articles]: 标签处理器
 * 文章列表标记
 */

const BaseHandler = require('../BaseHandler');

class ArticlesHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[articles\]:\s*#\s*$/m;
  }

  getType() {
    return 'marker';
  }

  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(this.syntax);

      if (match) {
        results.push({
          name: this.name,
          match: match[0],
          lineIndex: i
        });

        if (context?.collector) {
          context.collector.onMarker('articles');
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = ArticlesHandler;
