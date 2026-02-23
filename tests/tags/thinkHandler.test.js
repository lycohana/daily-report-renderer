/**
 * ThinkHandler 测试
 */

const ThinkHandler = require('../../src/parser/tags/tags/thinkHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('ThinkHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new ThinkHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('think');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse think syntax', () => {
    const content = '[think:This is a thought]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('This is a thought');
  });

  test('should clean think syntax', () => {
    const content = '[think:This is a thought]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.thought-box');
    expect(styles).toContain('.thought-title');
  });

  test('should not match invalid syntax', () => {
    const content = '[think:This is a thought]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
