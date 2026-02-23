/**
 * MetaCollector 测试
 */

const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('MetaCollector', () => {
  let collector;

  beforeEach(() => {
    collector = new MetaCollector();
  });

  test('should initialize with default state', () => {
    expect(collector.state).toEqual({
      inHeadline: true,
      inSection: false,
      inArticles: false,
      sectionIndex: -1,
      articleIndex: 0,
      hasHeadMarker: false,
    });
  });

  test('should handle head marker', () => {
    collector.onMarker('head');
    expect(collector.state.hasHeadMarker).toBe(true);
  });

  test('should handle section marker', () => {
    collector.onMarker('section');
    expect(collector.state.inSection).toBe(true);
    expect(collector.state.sectionIndex).toBe(0);
  });

  test('should handle articles marker', () => {
    collector.onMarker('articles');
    expect(collector.state.inArticles).toBe(true);
  });

  test('should collect tag metadata', () => {
    collector.collect('tag', 'test-tag', {});
    const result = collector.getResult();
    expect(result.headlineTags).toContain('test-tag');
  });

  test('should collect from metadata in section', () => {
    collector.onMarker('section');
    collector.collect('from', 'https://example.com', {});
    const result = collector.getResult();
    expect(result.sectionArticleMeta[0].from).toBe('https://example.com');
  });

  test('should collect fromstr metadata in section', () => {
    collector.onMarker('section');
    collector.collect('fromstr', 'Example Source', {});
    const result = collector.getResult();
    expect(result.sectionArticleMeta[0].fromStr).toBe('Example Source');
  });

  test('should collect icon metadata', () => {
    collector.onMarker('section');
    collector.collect('icon', '📰', {});
    const result = collector.getResult();
    expect(result.sectionArticleMeta[0].icon).toBe('📰');
  });

  test('should collect intro metadata', () => {
    collector.onMarker('section');
    collector.collect('intro', 'This is an intro', {});
    const result = collector.getResult();
    expect(result.sectionArticleMeta[0].intro).toBe('This is an intro');
  });

  test('should handle data blocks', () => {
    const data = [{ value: '100', label: 'Items' }];
    collector.onDataBlock(data);
    const result = collector.getResult();
    expect(result.dataBlocks.headline).toContain(data);
  });

  test('should set headFrom', () => {
    collector.setHeadFrom('https://example.com');
    const result = collector.getResult();
    expect(result.headFrom).toBe('https://example.com');
  });

  test('should set quote blocks', () => {
    const quotes = ['Quote 1', 'Quote 2'];
    collector.setQuoteBlocks(quotes);
    const result = collector.getResult();
    expect(result.quoteBlocks).toEqual(quotes);
  });

  test('should return empty result when no data collected', () => {
    const result = collector.getResult();
    expect(result.sectionArticleMeta).toEqual([]);
    expect(result.headlineTags).toBeUndefined();
    expect(result.headFrom).toBeNull();
  });
});
