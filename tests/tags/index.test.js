/**
 * TagRegistry 测试
 */

const tagRegistry = require('../../src/parser/tags/index');

describe('TagRegistry', () => {
  test('should have handlers registered', () => {
    const handlers = tagRegistry.getAllHandlers();
    expect(handlers.length).toBeGreaterThan(0);
  });

  test('should have tag handler', () => {
    const handler = tagRegistry.getHandler('tag');
    expect(handler).toBeDefined();
    expect(handler.name).toBe('tag');
  });

  test('should have section handler', () => {
    const handler = tagRegistry.getHandler('section');
    expect(handler).toBeDefined();
    expect(handler.name).toBe('section');
  });

  test('should have data handler', () => {
    const handler = tagRegistry.getHandler('data');
    expect(handler).toBeDefined();
    expect(handler.name).toBe('data');
  });

  test('should have weather handler', () => {
    const handler = tagRegistry.getHandler('weather');
    expect(handler).toBeDefined();
    expect(handler.name).toBe('weather');
  });

  test('should extract tags from content', () => {
    const content = '[tag:test]: #\nSome content';
    const result = tagRegistry.extractTags(content);
    expect(result.tags).toBeDefined();
    expect(result.cleanContent).toBeDefined();
  });

  test('should collect styles', () => {
    const styles = tagRegistry.collectStyles();
    expect(typeof styles).toBe('string');
  });

  test('should return HTML style tag', () => {
    const html = tagRegistry.getStylesHTML();
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
  });

  test('should clear style cache', () => {
    tagRegistry.collectStyles();
    tagRegistry.clearStyleCache();
    expect(tagRegistry.styleCache).toBeNull();
  });

  test('should use parseLine for inline handlers instead of parse', () => {
    const handler = tagRegistry.getHandler('tag');
    expect(handler).toBeDefined();

    const parseSpy = jest.spyOn(handler, 'parse');
    const parseLineSpy = jest.spyOn(handler, 'parseLine');

    tagRegistry.extractTags('[tag:test]: #\ncontent');

    expect(parseLineSpy).toHaveBeenCalled();
    expect(parseSpy).not.toHaveBeenCalled();

    parseSpy.mockRestore();
    parseLineSpy.mockRestore();
  });
});
