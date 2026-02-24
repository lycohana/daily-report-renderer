/**
 * FromstrHandler 测试
 */

const FromstrHandler = require('../../src/parser/tags/handlers/FromstrHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('FromstrHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new FromstrHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('fromstr');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse fromstr syntax', () => {
    const content = '[fromstr:Example Source]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('Example Source');
  });

  test('should clean fromstr syntax', () => {
    const content = '[fromstr:Example Source]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[fromstr:Example Source]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
