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
    const line = '[sum:This is a summary]: #';
    const result = handler.parseLine(line, context, 0);
    expect(result).toBeTruthy();
    expect(result.value).toBe('This is a summary');
    // 行内标签不再返回 html，由视图层在章节末尾渲染
    expect(result.html).toBeUndefined();
  });

  test('should collect sum in section context', () => {
    collector.onMarker('section');
    const line = '[sum:Section summary]: #';
    handler.parseLine(line, context, 0);
    const meta = collector.getResult();
    expect(meta.sectionArticleMeta[0].sum).toBe('Section summary');
  });

  test('should collect sum in headline context', () => {
    const line = '[sum:Headline summary]: #';
    handler.parseLine(line, context, 0);
    const meta = collector.getResult();
    expect(meta.headlineSum).toBe('Headline summary');
  });

  test('should clean sum syntax', () => {
    // clean() 不删除标签，因为标签需要保留给 markdownParser.js 处理
    const content = '[sum:This is a summary]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should not match invalid syntax', () => {
    const line = '[sum:This is a summary]';
    const result = handler.parseLine(line, context, 0);
    expect(result).toBeNull();
  });
});
