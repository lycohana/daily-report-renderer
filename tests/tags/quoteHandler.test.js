/**
 * QuoteHandler 测试
 */

const QuoteHandler = require('../../src/parser/tags/handlers/QuoteHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('QuoteHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new QuoteHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('quote');
  });

  test('should return block type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse single quote', () => {
    const content = '> This is a quote\n\n[section]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.content).toBe('This is a quote');
  });

  test('should parse multiple consecutive quotes', () => {
    const content = '> Quote 1\n> Quote 2\n\n[section]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data.content).toContain('Quote 1');
  });

  test('should only parse quotes before section', () => {
    const content = '[section]: #\n> This quote should not be parsed';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.front-detail');
    expect(styles).toContain('blockquote');
  });
});
