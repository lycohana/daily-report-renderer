/**
 * IconHandler 测试
 */

const IconHandler = require('../../src/parser/tags/handlers/inline/IconHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('IconHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new IconHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('icon');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse icon syntax with emoji', () => {
    const content = '[icon:📰]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('📰');
  });

  test('should parse icon syntax with text', () => {
    const content = '[icon:NEWS]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('NEWS');
  });

  test('should extract first emoji from mixed content', () => {
    const content = '[icon:📰🔥]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('📰');
  });

  test('should clean icon syntax', () => {
    const content = '[icon:📰]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[icon:📰]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
