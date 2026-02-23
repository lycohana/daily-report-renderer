/**
 * IntroHandler 测试
 */

const IntroHandler = require('../../src/parser/tags/tags/introHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('IntroHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new IntroHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('intro');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse intro syntax', () => {
    const content = '[intro:This is an introduction]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('This is an introduction');
  });

  test('should clean intro syntax', () => {
    const content = '[intro:This is an introduction]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[intro:This is an introduction]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
