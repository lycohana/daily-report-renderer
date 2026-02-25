const { parseFormField } = require('../../src/utils/formParser');

describe('Form Parser', () => {
  test('should parse form field with pipe separator', () => {
    const result = parseFormField('微信公众号AIdaily|https://example.com');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe('https://example.com');
  });

  test('should parse form field with dash separator', () => {
    const result = parseFormField('微信公众号AIdaily - https://example.com');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe('https://example.com');
  });

  test('should parse form field without URL', () => {
    const result = parseFormField('微信公众号AIdaily');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('微信公众号AIdaily');
    expect(result[0].url).toBe(null);
  });

  test('should handle empty form field', () => {
    expect(parseFormField('')).toEqual([]);
    expect(parseFormField(null)).toEqual([]);
    expect(parseFormField(undefined)).toEqual([]);
  });

  test('should parse multiple sources with comma separator', () => {
    const result = parseFormField(
      'AIBase|https://www.aibase.com,GitHub Blog|https://github.com/blog,AI News|https://ainews.com'
    );
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('AIBase');
    expect(result[1].name).toBe('GitHub Blog');
    expect(result[2].name).toBe('AI News');
  });

  test('should handle mixed sources with and without URLs', () => {
    const result = parseFormField('Source1|https://source1.com,Source2,Source3|https://source3.com');
    expect(result).toHaveLength(3);
    expect(result[1].url).toBe(null);
  });
});
