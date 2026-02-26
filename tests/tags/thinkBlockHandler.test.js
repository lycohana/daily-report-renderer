/**
 * ThinkBlockHandler 测试
 */

const ThinkBlockHandler = require('../../src/parser/tags/handlers/block/ThinkBlockHandler');

describe('ThinkBlockHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ThinkBlockHandler();
  });

  test('should have correct name', () => {
    // name 是从类名派生的，全小写
    expect(handler.name).toBe('thinkblock');
  });

  test('should return block type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse think block syntax', () => {
    const content = '<think>This is a thought</think>';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('This is a thought');
    expect(results[0].html).toContain('thought-box');
  });

  test('should handle multiline think block', () => {
    const content = `<think>
Line 1
Line 2
</think>`;
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('Line 1\nLine 2');
  });

  test('should handle multiple think blocks', () => {
    const content = '<think>First</think>content<think>Second</think>';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(2);
    expect(results[0].value).toBe('First');
    expect(results[1].value).toBe('Second');
  });

  test('should clean think block syntax', () => {
    // clean() 不删除标签，因为标签需要保留给 markdownParser.js 处理
    const content = 'Before<think>thought</think>After';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.thought-box');
    expect(styles).toContain('.thought-title');
    expect(styles).toContain('.thought-content');
  });

  test('should not match invalid syntax', () => {
    const content = '<think>unclosed tag';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(0);
  });

  test('should trim whitespace in value', () => {
    const content = `<think>
      Trimmed content
    </think>`;
    const results = handler.parseDocument(content, {});
    expect(results[0].value).toBe('Trimmed content');
  });
});
