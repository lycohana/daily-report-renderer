/**
 * ArticlesHandler 测试
 */

const ArticlesHandler = require('../../src/parser/tags/handlers/ArticlesHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('ArticlesHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new ArticlesHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('articles');
  });

  test('should return marker type', () => {
    expect(handler.getType()).toBe('marker');
  });

  test('should parse articles syntax', () => {
    const content = '[articles]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].match).toBe('[articles]: #');
  });

  test('should update collector state', () => {
    const content = '[articles]: #';
    handler.parse(content, context);
    expect(collector.state.inArticles).toBe(true);
  });

  test('should clean articles syntax', () => {
    const content = '[articles]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[articles]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
