/**
 * BaseHandler 测试
 */

const BaseHandler = require('../../src/parser/tags/BaseHandler');

describe('BaseHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new BaseHandler();
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('base');
  });

  test('should return name from getName()', () => {
    expect(handler.getName()).toBe('base');
  });

  test('should be instantiable for inheritance compatibility', () => {
    expect(handler).toBeInstanceOf(BaseHandler);
  });

  test('should return empty array in default parse()', () => {
    expect(handler.parse('')).toEqual([]);
  });

  test('should return null for default parseLine()', () => {
    expect(handler.parseLine('test', {})).toBeNull();
  });

  test('should return empty array for default parseDocument()', () => {
    expect(handler.parseDocument('test', {})).toEqual([]);
  });

  test('should return content unchanged in clean()', () => {
    const content = 'test content';
    expect(handler.clean(content)).toBe(content);
  });

  test('should return "inline" as default type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should return empty string for getStyles()', () => {
    expect(handler.getStyles()).toBe('');
  });
});
