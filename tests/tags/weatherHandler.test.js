/**
 * WeatherHandler 测试
 */

const WeatherHandler = require('../../src/parser/tags/handlers/block/WeatherHandler');
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
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day><day>周二|🌧️|雨|20°C/15°C</day></weather>';
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

  test('should support weather block with extra attributes and center', () => {
    const content = '<weather class="weekly" center data-x="1"><day>周一|☀️|晴|26°C/17°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.center).toBe(true);
  });

  test('should parse day attribute syntax and auto-fill icon', () => {
    const content = '<weather><day day="周三 4" weather="多云" temp="19 16" /></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items[0]).toEqual({
      day: '周三 4',
      city: null,
      icon: '⛅',
      condition: '多云',
      temp: '19°C/16°C',
    });
  });

  test('should support separate weekday/date/icon attributes', () => {
    const content = '<weather><day weekday="周二" date="3" icon="🌧️" weather="雨" temp="17/14" /></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items[0]).toEqual({
      day: '周二 3',
      city: null,
      icon: '🌧️',
      condition: '雨',
      temp: '17°C/14°C',
    });
  });

  test('should infer condition from icon and normalize single temperature', () => {
    const content = '<weather><day day="周四 5" icon="☀️" temp="24" /></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items[0]).toEqual({
      day: '周四 5',
      city: null,
      icon: '☀️',
      condition: '晴',
      temp: '24°C',
    });
  });

  test('should fallback to unknown condition when icon is not mapped', () => {
    const content = '<weather><day day="周五 6" icon="🌀" temp="20/10" /></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items[0].condition).toBe('未知');
    expect(results[0].data.items[0].temp).toBe('20°C/10°C');
  });

  test('should support mixed new and legacy day syntax in order', () => {
    const content = '<weather><day day="周三 4" weather="雨" temp="17/14" /><day>周四|☀️|晴|24°C/15°C</day></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.items).toHaveLength(2);
    expect(results[0].data.items[0].day).toBe('周三 4');
    expect(results[0].data.items[1].day).toBe('周四');
  });

  test('should ignore day item when day attribute is missing', () => {
    const content = '<weather><day weather="雨" temp="17/14" /></weather>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });

  test('should not clean weather block', () => {
    const content = '<weather><day>周一|☀️|晴|26°C/17°C</day></weather>';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.weather-grid');
    expect(styles).toContain('.weather-item');
  });
});
