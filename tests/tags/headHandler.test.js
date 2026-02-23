/**
 * HeadHandler 测试
 */

const HeadHandler = require('../../src/parser/tags/tags/headHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('HeadHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new HeadHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('head');
  });

  test('should return marker type', () => {
    expect(handler.getType()).toBe('marker');
  });

  test('should parse head syntax', () => {
    const content = '[head]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].match).toBe('[head]: #');
  });

  test('should update collector state', () => {
    const content = '[head]: #';
    handler.parse(content, context);
    expect(collector.state.hasHeadMarker).toBe(true);
  });

  test('should clean head syntax', () => {
    const content = '[head]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[head]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
