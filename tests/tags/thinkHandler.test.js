/**
 * ThinkHandler 测试
 */

const ThinkHandler = require('../../src/parser/tags/handlers/inline/ThinkHandler');
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
    const line = '[think:This is a thought]: #';
    const result = handler.parseLine(line, context, 0);
    expect(result).toBeTruthy();
    expect(result.value).toBe('This is a thought');
    // 行内标签不再返回 html，由视图层在章节末尾渲染
    expect(result.html).toBeUndefined();
  });

  test('should collect think in section context', () => {
    collector.onMarker('section');
    const line = '[think:Section thought]: #';
    handler.parseLine(line, context, 0);
    const meta = collector.getResult();
    expect(meta.sectionArticleMeta[0].thinks).toContain('Section thought');
  });

  test('should collect think in headline context', () => {
    const line = '[think:Headline thought]: #';
    handler.parseLine(line, context, 0);
    const meta = collector.getResult();
    expect(meta.headlineThink).toBe('Headline thought');
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
    const line = '[think:This is a thought]';
    const result = handler.parseLine(line, context, 0);
    expect(result).toBeNull();
  });
});
