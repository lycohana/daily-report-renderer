/**
 * SumHandler 测试
 */

const SumHandler = require('../../src/parser/tags/handlers/inline/SumHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('SumHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new SumHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('sum');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse sum syntax', () => {
    const content = '[sum:This is a summary]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('This is a summary');
  });

  test('should clean sum syntax', () => {
    const content = '[sum:This is a summary]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[sum:This is a summary]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
