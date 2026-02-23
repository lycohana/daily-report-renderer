/**
 * SectionHandler 测试
 */

const SectionHandler = require('../../src/parser/tags/tags/sectionHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('SectionHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new SectionHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('section');
  });

  test('should return marker type', () => {
    expect(handler.getType()).toBe('marker');
  });

  test('should parse section syntax', () => {
    const content = '[section]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(1);
    expect(results[0].match).toBe('[section]: #');
  });

  test('should update collector state', () => {
    const content = '[section]: #';
    handler.parse(content, context);
    expect(collector.state.inSection).toBe(true);
    expect(collector.state.sectionIndex).toBe(0);
  });

  test('should handle multiple section markers', () => {
    const content = '[section]: #\nContent\n[section]: #';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(2);
    expect(collector.state.sectionIndex).toBe(1);
  });

  test('should clean section syntax', () => {
    const content = '[section]: #\nSome content';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\nSome content');
  });

  test('should not match invalid syntax', () => {
    const content = '[section]';
    const results = handler.parse(content, context);
    expect(results).toHaveLength(0);
  });
});
