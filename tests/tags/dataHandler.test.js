/**
 * DataHandler 测试
 */

const DataHandler = require('../../src/parser/tags/handlers/block/DataHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('DataHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new DataHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('data');
  });

  test('should return block type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse data block', () => {
    const content = '<data><num>100</num><str>Items</str></data>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data).toEqual([{ value: '100', label: 'Items' }]);
  });

  test('should parse multiple data items', () => {
    const content = '<data><num>100</num><str>Items</str><num>200</num><str>Views</str></data>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data).toEqual([
      { value: '100', label: 'Items' },
      { value: '200', label: 'Views' },
    ]);
  });

  test('should handle multiline data block', () => {
    const content = `<data>
<num>100</num><str>Items</str>
<num>200</num><str>Views</str>
</data>`;
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].data).toHaveLength(2);
  });

  test('should return null for empty data', () => {
    const content = '<data></data>';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });

  test('should not clean data block', () => {
    const content = '<data><num>100</num><str>Items</str></data>Some content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });

  test('should return styles', () => {
    const styles = handler.getStyles();
    expect(styles).toBe('');
  });
});
