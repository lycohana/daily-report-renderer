/**
 * Markdown Parser - 日报渲染核心解析模块
 * 
 * 功能：
 * - 解析Markdown文件的Front Matter元数据
 * - 提取自定义标签（tag, icon, intro, from, fromstr等）
 * - 解析标题（头版头条）和章节（section）结构
 * - 将Markdown转换为HTML
 * 
 * 模块结构：
 * - config.js: Markdown-it配置
 * - frontMatter.js: Front Matter解析
 * - customTags.js: 自定义标签提取
 * - utils.js: 工具函数
 * - markdownParser.js: 主解析逻辑（入口）
 * 
 * Markdown文件格式规范：
 * ---
 * number: 001
 * date: 2026-2-22
 * weather: 东莞 · 多云 28°C/19°C
 * read_time: 约 8 分钟
 * ---
 * 
 * [head]: #                           - 标记头版头条开始
 * [from:URL]: #                       - 来源URL
 * [tag:标签1]: #                      - 头版头条标签（可多个）
 * [tag:标签2]: #
 * # 头版头条标题                      - 一级标题作为头版头条标题
 * 头版头条内容...
 * 
 * [section]: #                        - 标记章节开始
 * [intro:章节简介]: #                 - 章节简介
 * [icon:图标]: #                      - 章节图标（取第一个emoji）
 * # 章节标题                          - 二级标题作为章节标题
 * [articles]: #                       - 标记文章列表开始
 * ## 文章标题1                        - 三级标题作为文章标题
 * [from:URL]: #                       - 文章来源URL
 * [fromstr:来源名称]: #               - 来源名称
 * [tag:标签1]: #                      - 文章标签
 * 文章内容...
 * ## 文章标题2
 * ...
 */

const { createMarkdownIt } = require('./parser/config');
const { parseFrontMatter } = require('./parser/frontMatter');
const { extractCustomTags } = require('./parser/customTags');
const { extractTitleFromFrontMatter, extractEditionFromFrontMatter } = require('./parser/utils');
const { processBlocks } = require('./parser/blocks');
const { applySecurityMode, resolveRenderMode } = require('./parser/security');

const md = createMarkdownIt();

// ============================================
// 工具函数
// ============================================

function trimContent(content) {
  return content.replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
}

function extractQuoteBlocksAndContent(rawContent) {
  const quoteBlockRegex = /^> (.+)$/gm;
  const quoteBlocks = [];
  let lastMatchEnd = -1;
  let currentQuote = null;
  let match;

  while ((match = quoteBlockRegex.exec(rawContent)) !== null) {
    if (lastMatchEnd !== -1 && match.index - lastMatchEnd > 1) {
      if (currentQuote) {
        quoteBlocks.push(currentQuote.trim());
        currentQuote = null;
      }
    }
    if (!currentQuote) {
      currentQuote = match[1];
    } else {
      currentQuote += '\n' + match[1];
    }
    lastMatchEnd = match.index + match[0].length;
  }

  if (currentQuote) {
    quoteBlocks.push(currentQuote.trim());
  }

  return {
    quoteBlocks,
    content: trimContent(rawContent.replace(quoteBlockRegex, ''))
  };
}

// ============================================
// 节点工厂函数
// ============================================

function createSectionNode(title, sectionMeta) {
  return {
    type: 'section',
    title,
    articles: [],
    intro: sectionMeta?.intro || null,
    icon: sectionMeta?.icon || null,
    tags: [...(sectionMeta?.tags || [])],
    summary: sectionMeta?.sum || null,
    think: sectionMeta?.thinks?.[0] || null,
    dataBlocks: null
  };
}

function createArticleNode(title, articleMeta) {
  return {
    type: 'article',
    title,
    content: '',
    quoteBlocks: [],
    from: articleMeta?.from || null,
    fromStr: articleMeta?.fromStr || null,
    tags: articleMeta?.tags || [],
    summary: articleMeta?.sum || null,
    think: articleMeta?.thinks?.[0] || null,
    dataBlocks: null
  };
}

// ============================================
// 状态管理类
// ============================================

/**
 * 解析器状态管理类
 * 封装所有状态变量，提供清晰的状态转换接口
 */
class ParserState {
  constructor(customTags) {
    this.headSection = null;
    this.currentSection = null;
    this.currentArticle = null;
    this.sections = [];
    
    this.headlineContent = [];
    this.articleContent = [];
    
    this.isFirstHash = true;
    this.inSection = false;
    this.sectionIndex = -1;
    this.articleIndex = 0;
    
    // 从 customTags 中获取元数据
    this.hasHeadMarker = customTags.hasHeadMarker || !!customTags.headlineTags || !!customTags.headFrom;
    this.sectionMetas = customTags.sectionArticleMeta || [];
    this.currentSectionMetaIndex = 0;
    this.customTags = customTags;
  }

  // 尝试解析 [sum:xxx] 标签
  tryParseSum(line, target) {
    if (line.trim().startsWith('[sum:') && target && !target.summary) {
      const sumMatch = line.match(/\[sum:([^\]]+)\]/);
      if (sumMatch) {
        target.summary = sumMatch[1];
        return true;
      }
    }
    return false;
  }

  // 尝试解析 [think:xxx] 标签
  tryParseThink(line, target) {
    if (line.trim().startsWith('[think:') && target && !target.think) {
      const thinkMatch = line.match(/\[think:([^\]]+)\]/);
      if (thinkMatch) {
        target.think = thinkMatch[1];
        return true;
      }
    }
    return false;
  }

  // 添加内容到当前上下文
  addContent(line) {
    if (this.headSection && !this.inSection) {
      this.headlineContent.push(line);
    } else if (this.currentArticle) {
      this.articleContent.push(line);
    } else if (this.currentSection) {
      this.articleContent.push(line);
    }
  }
}

// ============================================
// 节点处理器
// ============================================

/**
 * 处理头版头条节点
 */
function handleHeadline(state, line) {
  const title = line.substring(2).trim();
  state.headSection = {
    type: 'headline',
    title,
    content: '',
    tags: state.customTags.headlineTags || [],
    dataBlocks: state.customTags.dataBlocks?.headline || null,
    quoteBlocks: state.customTags.quoteBlocks || null,
    from: state.customTags.headFrom || state.customTags.from || null,
    sum: state.customTags.headlineSum || null,
    think: state.customTags.headlineThink || null
  };
  state.isFirstHash = false;
}

/**
 * 创建新章节
 */
function startNewSection(state, line) {
  // 保存当前文章
  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }
  
  // 保存当前章节
  if (state.currentSection) {
    state.sections.push(state.currentSection);
  }
  
  // 如果是第一个章节，保存头版头条内容
  if (state.headSection) {
    state.headSection.content = trimContent(state.headlineContent.join('\n'));
  }
  
  state.sectionIndex++;
  state.articleContent = [];
  state.articleIndex = 0;
  
  const sectionMeta = state.sectionMetas[state.currentSectionMetaIndex];
  state.currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
  state.currentSectionMetaIndex++;
  
  // 从 customTags 中获取 section 级别的 dataBlocks
  if (state.customTags.dataBlocks?.sections && 
      state.customTags.dataBlocks.sections[state.sectionIndex]) {
    const sectionData = state.customTags.dataBlocks.sections[state.sectionIndex];
    const sectionLevelData = sectionData.find(d => d.type === 'section');
    if (sectionLevelData) {
      state.currentSection.dataBlocks = [sectionLevelData.data];
    }
  }
  
  state.inSection = true;
}

/**
 * 创建新文章
 */
function startNewArticle(state, line) {
  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }
  
  state.articleContent = [];
  const articleTitle = line.substring(3).trim();
  
  // 从 customTags 中获取文章元数据
  let articleMeta = null;
  if (state.customTags.sectionArticleMeta && 
      state.customTags.sectionArticleMeta[state.sectionIndex]) {
    const sectionMeta = state.customTags.sectionArticleMeta[state.sectionIndex];
    if (sectionMeta.articleMeta && sectionMeta.articleMeta[state.articleIndex]) {
      articleMeta = sectionMeta.articleMeta[state.articleIndex];
    }
  }
  
  state.currentArticle = createArticleNode(articleTitle, articleMeta);
  
  // 从 customTags 中获取 article 级别的 dataBlocks
  if (state.customTags.dataBlocks?.articles && 
      state.customTags.dataBlocks.articles[state.sectionIndex]) {
    const articleDataList = state.customTags.dataBlocks.articles[state.sectionIndex];
    const articleData = articleDataList.find(d => d.index === state.articleIndex);
    if (articleData) {
      state.currentArticle.dataBlocks = [articleData.data];
    }
  }
  
  state.articleIndex++;
}

/**
 * 完成当前文章
 */
function finalizeCurrentArticle(state) {
  if (!state.currentArticle || !state.currentSection) {
    return;
  }

  const rawContent = state.articleContent.join('\n');
  const parsed = extractQuoteBlocksAndContent(rawContent);
  state.currentArticle.quoteBlocks = parsed.quoteBlocks;
  state.currentArticle.content = parsed.content;
  state.currentSection.articles.push(state.currentArticle);
  state.currentArticle = null;
  state.articleContent = [];
}

/**
 * 完成所有待处理的节点
 */
function finalizeAll(state) {
  // 完成头版头条
  if (state.headSection) {
    const rawContent = state.headlineContent.join('\n');
    const parsedHeadline = extractQuoteBlocksAndContent(rawContent);
    state.headSection.content = parsedHeadline.content;
  }
  
  // 完成当前文章
  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }
  
  // 完成当前章节
  if (state.currentSection) {
    state.sections.push(state.currentSection);
  }
}

// ============================================
// 行解析器
// ============================================

/**
 * 解析单行内容，返回是否已处理
 */
function parseLine(state, line) {
  // 1. 检测 # 标题（头版头条）- 需要 hasHeadMarker 且是第一个 #
  if (line.startsWith('# ') && state.isFirstHash && state.hasHeadMarker) {
    handleHeadline(state, line);
    return true;
  }
  
  // 2. 检测第一个 # 标题作为章节开始
  if (line.startsWith('# ') && !state.isFirstHash && state.hasHeadMarker && !state.inSection) {
    startNewSection(state, line);
    return true;
  }
  
  // 3. 检测后续的 # 标题作为新章节开始
  if (line.startsWith('# ') && state.inSection && state.currentSectionMetaIndex < state.sectionMetas.length) {
    startNewSection(state, line);
    return true;
  }
  
  // 4. 检测章节标题（无 head 标记的情况）
  if (line.startsWith('# ') && (!state.isFirstHash || !state.hasHeadMarker) && state.inSection) {
    if (state.currentSection && state.currentArticle) {
      finalizeCurrentArticle(state);
    }
    if (state.currentSection) {
      state.sections.push(state.currentSection);
    }
    
    state.articleContent = [];
    state.articleIndex = 0;
    
    const sectionMeta = state.customTags.sectionArticleMeta && 
                       state.customTags.sectionArticleMeta[state.sectionIndex];
    
    state.currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
    
    // 从customTags中获取section级别的dataBlocks
    if (state.customTags.dataBlocks?.sections && 
        state.customTags.dataBlocks.sections[state.sectionIndex]) {
      const sectionData = state.customTags.dataBlocks.sections[state.sectionIndex];
      const sectionLevelData = sectionData.find(d => d.type === 'section');
      if (sectionLevelData) {
        state.currentSection.dataBlocks = [sectionLevelData.data];
      }
    }
    
    return true;
  }
  
  // 5. 检测 ## 标题（文章标题）
  if (line.startsWith('## ') && state.currentSection) {
    startNewArticle(state, line);
    return true;
  }
  
  // 6. 尝试解析 [sum:] 标签
  if (state.tryParseSum(line, state.currentSection)) {
    return true;
  }
  
  // 7. 尝试解析 [think:] 标签
  if (state.tryParseThink(line, state.currentSection)) {
    return true;
  }
  
  // 8. 尝试解析文章的 [sum:] 标签
  if (state.tryParseSum(line, state.currentArticle)) {
    return true;
  }
  
  // 9. 尝试解析文章的 [think:] 标签
  if (state.tryParseThink(line, state.currentArticle)) {
    return true;
  }
  
  // 10. 添加内容到当前上下文
  state.addContent(line);
  return true;
}

// ============================================
// 安全处理
// ============================================

function sanitizeStructuredMeta(sections, renderMode) {
  if (renderMode !== 'safe') {
    return sections;
  }

  return sections.map(section => ({
    ...section,
    summary: section.summary ? applySecurityMode(section.summary, renderMode) : section.summary,
    think: section.think ? applySecurityMode(section.think, renderMode) : section.think,
    articles: (section.articles || []).map(article => ({
      ...article,
      summary: article.summary ? applySecurityMode(article.summary, renderMode) : article.summary,
      think: article.think ? applySecurityMode(article.think, renderMode) : article.think
    }))
  }));
}

// ============================================
// HTML 渲染
// ============================================

function renderHtmlContent(state, renderMode) {
  // 处理 block 标签的辅助函数
  const processBlockTags = (html) => {
    const sumRegex = /<sum>([\s\S]*?)<\/sum>/g;
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const notesRegex = /<notes>([\s\S]*?)<\/notes>/g;
    const noteRegex = /<note>([\s\S]*?)<\/note>/g;
    
    // 替换 <sum> 标签为 HTML
    html = html.replace(sumRegex, (match, p1) => {
      const value = p1.trim();
      return `<div class="analysis-box"><div class="analysis-title">总结</div><div class="analysis-content">${value}</div></div>`;
    });
    
    // 替换 <think> 标签为 HTML
    html = html.replace(thinkRegex, (match, p1) => {
      const value = p1.trim();
      return `<div class="thought-box"><div class="thought-title">思考</div><div class="thought-content">${value}</div></div>`;
    });
    
    // 替换 <notes> 标签为 HTML
    html = html.replace(notesRegex, (match, p1) => {
      const notesContent = p1.trim();
      const notes = [];
      let noteMatch;
      // 重置正则的 lastIndex
      noteRegex.lastIndex = 0;
      while ((noteMatch = noteRegex.exec(notesContent)) !== null) {
        const noteValue = noteMatch[1].trim();
        if (noteValue) {
          notes.push(noteValue);
        }
      }
      
      if (notes.length === 0) {
        return '';
      }
      
      let notesHtml = '<div class="notes-section"><div class="notes-title">随笔笔记</div><div class="notes-grid">';
      notes.forEach((note) => {
        // 对每个 note 内容进行 Markdown 渲染
        const renderedNote = md.render(note).trim();
        // 移除包裹的 <p> 标签（如果只有一个段落）
        const cleanNote = renderedNote.replace(/^<p>(.*?)<\/p>$/, '$1');
        notesHtml += `<div class="note-card"><div class="note-card-content">${cleanNote}</div></div>`;
      });
      notesHtml += '</div></div>';
      return notesHtml;
    });
    
    return html;
  };
  
  let htmlContent = md.render(state.customTags.cleanContent);
  htmlContent = processBlocks(htmlContent, md);
  htmlContent = applySecurityMode(htmlContent, renderMode);
  // sum 和 think 标签现在由 processBlocks 直接处理
  
  // 单独渲染 headSection 的 content
  let headSectionHtml = '';
  if (state.headSection && state.headSection.content) {
    headSectionHtml = md.render(state.headSection.content);
    headSectionHtml = processBlocks(headSectionHtml);
    headSectionHtml = applySecurityMode(headSectionHtml, renderMode);
    // 处理 headSection 中的 block 标签
    headSectionHtml = processBlockTags(headSectionHtml);
  }
  
  return { htmlContent, headSectionHtml };
}

// ============================================
// 主解析函数
// ============================================

/**
 * 解析Markdown内容
 * 
 * 解析流程：
 * 1. 解析Front Matter元数据
 * 2. 提取自定义标签
 * 3. 解析文档结构：
 *    - 第一个一级标题(#) -> 头版头条(headSection)
 *    - [section]: 标记 -> 章节(section)
 *    - ## 标题 -> 文章(article)
 * 4. 将Markdown转换为HTML
 * 
 * @param {string} content - 完整的Markdown文件内容
 * @returns {Object} 解析结果
 *   - frontMatter: Front Matter元数据
 *   - customTags: 自定义标签
 *   - htmlContent: 转换后的HTML内容
 *   - sections: 章节数组
 *   - headSection: 头版头条对象
 */
function parseMarkdown(content) {
  // 1. 解析 Front Matter
  const { frontMatter, content: markdownContent } = parseFrontMatter(content);
  
  // 2. 提取自定义标签
  const { tags: customTags, cleanContent } = extractCustomTags(markdownContent);
  customTags.cleanContent = cleanContent; // 传递给后续处理
  
  // 3. 初始化解析器状态
  const state = new ParserState(customTags);
  
  // 4. 逐行解析
  const lines = cleanContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    parseLine(state, lines[i]);
  }
  
  // 5. 完成所有节点
  finalizeAll(state);
  
  // 6. 确定渲染模式
  const renderMode = resolveRenderMode(frontMatter);
  
  // 7. 安全处理结构化数据
  const sanitizedSections = sanitizeStructuredMeta(state.sections, renderMode);
  
  // 8. 渲染 HTML
  const { htmlContent, headSectionHtml } = renderHtmlContent(state, renderMode);
  
  // 9. 返回结果
  return {
    frontMatter,
    customTags,
    htmlContent,
    headSectionHtml,
    sections: sanitizedSections,
    headSection: state.headSection,
    renderMode
  };
}

module.exports = {
  parseMarkdown,
  extractTitleFromFrontMatter,
  extractEditionFromFrontMatter,
  extractCustomTags,
  parseFrontMatter,
  md
};
