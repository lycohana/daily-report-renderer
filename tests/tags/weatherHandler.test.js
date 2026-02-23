/**
 * WeatherHandler 测试
 */

const WeatherHandler = require('../../src/parser/tags/tags/weatherHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('WeatherHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new WeatherHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('weather');
  });

  test('should return block type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse weather block with city', () => {
    const content = '<weather><day>周一 | 东莞|☀️|晴|26°C/17°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items).toHaveLength(1);
    expect(results[0].data.items[0]).toEqual({
      day: '周一',
      city: '东莞',
      icon: '☀️',
      condition: '晴',
      temp: '26°C/17°C',
    });
  });

  test('should parse weather block without city', () => {
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items).toHaveLength(1);
    expect(results[0].data.items[0]).toEqual({
      day: '周一',
      city: null,
      icon: '☀️',
      condition: '晴',
      temp: '26°C/17°C',
    });
  });

  test('should parse multiple days', () => {
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day><day>周二|☁️|多云|25°C/16°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items).toHaveLength(2);
  });

  test('should handle center attribute', () => {
    const content = '<weather center><day>周一|☀️|晴|26°C/17°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.center).toBe(true);
  });

  test('should not clean weather block', () => {
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day></weather>Some content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.weather-grid');
    expect(styles).toContain('.weather-item');
  });
});
