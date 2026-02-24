/**
 * FromHandler 测试
 */

const FromHandler = require('../../src/parser/tags/handlers/FromHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('FromHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new FromHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('from');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse from syntax', () => {
    const content = '[from:https://example.com]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('https://example.com');
  });

  test('should collect metadata', () => {
    const content = '[from:https://example.com]: #';
    handler.parse(content, context);
    const result = collector.getResult();
    // from 标签收集�?sectionArticleMeta 中，headFrom �?customTags.js 特殊处理
    expect(result.sectionArticleMeta).toBeDefined();
  });

  test('should clean from syntax', () => {
    const content = '[from:https://example.com]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[from:https://example.com]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
