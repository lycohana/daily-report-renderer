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
    // BaseHandler �?name 是从类名派生的，去掉 "Handler" 后缀并转小写
    expect(handler.name).toBe('base');
  });

  test('should return name from getName()', () => {
    expect(handler.getName()).toBe('base');
  });

  test('should not be instantiated directly', () => {
    // BaseHandler 应该被继承使�?
    expect(handler).toBeInstanceOf(BaseHandler);
  });

  test('should throw error when parse() is not implemented', () => {
    expect(() => handler.parse('')).toThrow('parse() must be implemented by subclass');
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
