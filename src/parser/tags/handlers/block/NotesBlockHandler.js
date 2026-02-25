/**
 * <notes>...</notes> 标签处理器
 * 用于标记随笔笔记区块，作为 block 类型处理器，原地渲染 HTML
 */

const BaseHandler = require('../../BaseHandler');
const { createMarkdownIt } = require('../../../config');

class NotesBlockHandler extends BaseHandler {
  constructor() {
    super();
    // 匹配 <notes>...</notes> 区块
    this.syntax = /<notes>([\s\S]*?)<\/notes>/g;
    // 匹配 <note>...</note> 子标签
    this.noteSyntax = /<note>([\s\S]*?)<\/note>/g;
    // 创建 markdown 解析器实例
    this.md = createMarkdownIt();
  }

  getType() {
    return 'block';
  }

  parseDocument(content, _context) {
    const results = [];
    const matches = [...content.matchAll(this.syntax)];
    
    for (const match of matches) {
      const notesContent = match[1].trim();
      const notes = this._parseNotes(notesContent);
      results.push({
        name: this.name,
        value: notes,
        html: this._renderHTML(notes)
      });
    }
    
    return results;
  }

  _parseNotes(notesContent) {
    const notes = [];
    const noteMatches = [...notesContent.matchAll(this.noteSyntax)];
    
    for (const match of noteMatches) {
      const noteContent = match[1].trim();
      if (noteContent) {
        notes.push(noteContent);
      }
    }
    
    return notes;
  }

  _renderHTML(notes) {
    if (!notes || notes.length === 0) {
      return '';
    }
    
    let html = '<div class="notes-section"><div class="notes-title">随笔笔记</div><div class="notes-grid">';
    
    notes.forEach((note, index) => {
      // 对每个 note 内容进行 Markdown 渲染
      const renderedNote = this.md.render(note).trim();
      // 移除包裹的 <p> 标签（如果只有一个段落）
      const cleanNote = renderedNote.replace(/^<p>(.*?)<\/p>$/, '$1');
      html += `<div class="note-card"><div class="note-card-content">${cleanNote}</div></div>`;
    });
    
    html += '</div></div>';
    return html;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }

  getStyles() {
    return `
.notes-section{padding:32px 40px;background:#f9f7f3;border-top:2px solid var(--border-color)}
.notes-title{font-family:'Noto Serif SC',serif;font-size:1.1rem;font-weight:700;color:var(--accent-gold);margin-bottom:16px;display:flex;align-items:center;gap:8px}
.notes-title::before{content:'';display:inline-block;width:4px;height:20px;background:var(--accent-gold);border-radius:2px;margin-right:8px}
.notes-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
.note-card{background:#fff;padding:18px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.note-card-content{font-size:.88rem;color:var(--text-muted)}
    `.trim();
  }
}

module.exports = NotesBlockHandler;