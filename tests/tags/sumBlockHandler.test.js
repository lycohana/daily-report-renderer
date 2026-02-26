/**
 * SumBlockHandler 测试
 */

const SumBlockHandler = require('../../src/parser/tags/handlers/block/SumBlockHandler');

describe('SumBlockHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SumBlockHandler();
  });

  test('should have correct name', () => {
    // name 是从类名派生的，全小写
    expect(handler.name).toBe('sumblock');
  });

  test('should return block type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse sum block syntax', () => {
    const content = '<sum>This is a summary</sum>';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('This is a summary');
    expect(results[0].html).toContain('analysis-box');
  });

  test('should handle multiline sum block', () => {
    const content = `<sum>
Line 1
Line 2
</sum>`;
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('Line 1\nLine 2');
  });

  test('should handle multiple sum blocks', () => {
    const content = '<sum>First</sum>content<sum>Second</sum>';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(2);
    expect(results[0].value).toBe('First');
    expect(results[1].value).toBe('Second');
  });

  test('should clean sum block syntax', () => {
    // clean() 不删除标签，因为标签需要保留给 markdownParser.js 处理
    const content = 'Before<sum>summary</sum>After';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.analysis-box');
    expect(styles).toContain('.analysis-title');
    expect(styles).toContain('.analysis-content');
  });

  test('should not match invalid syntax', () => {
    const content = '<sum>unclosed tag';
    const results = handler.parseDocument(content, {});
    expect(results).toHaveLength(0);
  });

  test('should trim whitespace in value', () => {
    const content = `<sum>
      Trimmed content
    </sum>`;
    const results = handler.parseDocument(content, {});
    expect(results[0].value).toBe('Trimmed content');
  });
});
