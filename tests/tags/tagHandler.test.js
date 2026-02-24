/**
 * TagHandler 测试
 */

const TagHandler = require('../../src/parser/tags/handlers/TagHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('TagHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new TagHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('tag');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse tag syntax', () => {
    const content = '[tag:test]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('test');
  });

  test('should parse multiple tags', () => {
    const content = '[tag:tag1]: #\nSome text\n[tag:tag2]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(2);
    expect(results[0].value).toBe('tag1');
    expect(results[1].value).toBe('tag2');
  });

  test('should collect metadata', () => {
    const content = '[tag:test]: #';
    handler.parse(content, context);
    const result = collector.getResult();
    expect(result.headlineTags).toContain('test');
  });

  test('should clean tag syntax', () => {
    const content = '[tag:test]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.front-tag');
    expect(styles).toContain('.article-tag');
  });

  test('should not match invalid syntax', () => {
    const content = '[tag:test]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
