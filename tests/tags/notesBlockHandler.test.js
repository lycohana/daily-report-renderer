const NotesBlockHandler = require('../../src/parser/tags/handlers/block/NotesBlockHandler');

describe('NotesBlockHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new NotesBlockHandler();
  });

  test('should have correct type', () => {
    expect(handler.getType()).toBe('block');
  });

  test('should parse simple notes block', () => {
    const content = '<notes><note>NoteA</note><note>NoteB</note></notes>';
    const results = handler.parseDocument(content);
    
    expect(results.length).toBe(1);
    expect(results[0].value).toEqual(['NoteA', 'NoteB']);
    expect(results[0].html).toContain('随笔笔记');
    expect(results[0].html).toContain('NoteA');
    expect(results[0].html).toContain('NoteB');
  });

  test('should parse notes with markdown formatting', () => {
    const content = '<notes><note>**Bold note**</note><note>*Italic note*</note></notes>';
    const results = handler.parseDocument(content);
    
    expect(results.length).toBe(1);
    expect(results[0].value).toEqual(['**Bold note**', '*Italic note*']);
    // 检查是否渲染为 HTML
    expect(results[0].html).toContain('<strong>Bold note</strong>');
    expect(results[0].html).toContain('<em>Italic note</em>');
  });

  test('should handle empty notes block', () => {
    const content = '<notes></notes>';
    const results = handler.parseDocument(content);
    
    expect(results.length).toBe(1);
    expect(results[0].value).toEqual([]);
    expect(results[0].html).toBe('');
  });

  test('should handle notes with whitespace', () => {
    const content = '<notes>\n  <note>  Note with spaces  </note>\n  <note>Note2</note>\n</notes>';
    const results = handler.parseDocument(content);
    
    expect(results.length).toBe(1);
    expect(results[0].value).toEqual(['Note with spaces', 'Note2']);
  });

  test('should clean notes block from content', () => {
    const content = 'Some text\n<notes><note>NoteA</note></notes>\nMore text';
    const cleaned = handler.clean(content);
    
    expect(cleaned).toBe('Some text\n\nMore text');
  });

  test('should return correct styles', () => {
    const styles = handler.getStyles();
    expect(styles).toContain('.notes-section');
    expect(styles).toContain('.notes-title');
    expect(styles).toContain('.notes-grid');
    expect(styles).toContain('.note-card');
  });
});