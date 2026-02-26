/**
 * Markdown Parser - 日报渲染核心解析模块
 *
 * 功能：
 * - 解析 Markdown 文件的 Front Matter 元数据
 * - 提取自定义标签（tag, icon, intro, from, fromstr, sum, think 等）
 * - 基于状态机解析文档结构（headline/section/article）
 * - 将 Markdown 转换为 HTML
 *
 * 模块结构：
 * - config.js: Markdown-it 配置
 * - frontMatter.js: Front Matter 解析
 * - customTags.js: 自定义标签提取（使用 tags/index.js 注册表）
 * - blocks.js: 块级标签 HTML 渲染（<data>, <weather>, <sum>, <think>，<notes>）
 * - security.js: HTML 安全净化（render_mode: safe 模式）
 * - utils.js: 工具函数
 * - markdownParser.js: 主解析逻辑（入口）
 *
 * 解析状态机说明：
 *
 * 状态变量:
 * - hasHeadMarker: 是否存在 [head]: # 标记（由 MetaCollector 收集）
 * - isFirstHash: 是否遇到第一个 # 标题
 * - inSection: 是否处于 section 内部
 * - sectionIndex / articleIndex: 当前章节/文章索引
 *
 * 状态转换流程:
 * 1. 初始状态：inHeadline=true, isFirstHash=true
 * 2. 遇到 # 标题且 hasHeadMarker=true → 创建 headSection，isFirstHash=false
 * 3. 再次遇到 # 标题且 hasHeadMarker=true → 创建新 section，inSection=true
 * 4. 在 section 内遇到 ## 标题 → 创建新 article
 * 5. 在 section 内遇到下一个 # 标题 → 保存当前 section，创建新 section
 *
 * 注意：
 * - 没有 [head] 标记时，第一个 # 标题会被当作 section 处理
 * - [sum:] 和 [think:] 标签可以出现在 headline/section/article 任何位置，解析器会根据当前状态自动归属
 * - <sum>、<think>、<notes> 等块级标签由 blocks.js 在 HTML 渲染阶段处理
 *
 * Markdown 文件格式规范：
 *
 * ---
 * number: 001                          - 期号
 * date: 2026-2-22                      - 日期
 * weather: 东莞 · 多云 28°C/19°C        - 天气
 * read_time: 约 8 分钟                  - 阅读时间
 * form: 来源 1|URL1, 来源 2|URL2        - 快速链接表单
 * render_mode: legacy|safe             - 渲染模式（safe 模式启用 HTML 净化）
 * ---
 *
 * [head]: #                            - 标记头版头条开始
 * [from:URL]: #                        - 头版头条来源 URL
 * [tag:标签 1]: #                       - 头版头条标签（可多个）
 * [tag:标签 2]: #
 * # 头版头条标题                        - 一级标题作为头版头条标题
 * 头版头条内容...
 * <data>...</data>                     - 数据块（显示为统计卡片）
 * <sum>总结内容</sum>                   - 摘要块（headline 级别）
 * <think> 思考内容</think>                 - 思考块（headline 级别）
 *
 * [section]: #                         - 标记章节开始
 * [intro:章节简介]: #                  - 章节简介
 * [icon:🧪]: #                         - 章节图标（emoji）
 * # 章节标题                           - 一级标题作为章节标题
 * <data>...</data>                     - 章节级数据块
 *
 * [articles]: #                        - 标记文章列表开始
 * ## 文章标题 1                         - 三级标题作为文章标题
 * [from:URL]: #                        - 文章来源 URL
 * [fromstr:来源名称]: #                - 来源名称
 * [tag:标签 1]: #                       - 文章标签
 * 文章内容...
 * <sum>摘要</sum>                       - 文章摘要块
 * <think> 思考</think>                     - 文章思考块
 *
 * ## 文章标题 2
 * ...
 *
 * <notes>                              - 随笔笔记区块（底部统一渲染）
 * <note>笔记内容 1</note>
 * <note>笔记内容 2</note>
 * </notes>
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

    // 从 customTags 中获取 section 级别的 dataBlocks
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
      // 使用 matchAll 避免 lastIndex 状态问题
      const notes = [...notesContent.matchAll(/<note>([\s\S]*?)<\/note>/g)]
        .map(m => m[1].trim())
        .filter(Boolean);

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
 * 解析 Markdown 内容
 *
 * 解析流程：
 * 1. 解析 Front Matter 元数据
 * 2. 提取自定义标签（由 tags/index.js 注册表处理）
 * 3. 基于状态机解析文档结构：
 *    - hasHeadMarker=true 时：第一个 # 标题 → 头版头条 (headSection)
 *    - hasHeadMarker=false 时：第一个 # 标题 → 章节 (section)
 *    - [section] 标记 → 新章节开始
 *    - ## 标题 → 新文章 (article)
 * 4. 安全处理结构化数据（render_mode: safe 模式）
 * 5. 将 Markdown 转换为 HTML，处理块级标签（<sum>, <think>，<notes>, <data>, <weather>）
 *
 * @param {string} content - 完整的 Markdown 文件内容（包含 Front Matter）
 * @returns {Object} 解析结果
 *   - frontMatter: Front Matter 元数据对象
 *   - customTags: 自定义标签提取结果（包含 section/article 元数据、dataBlocks 等）
 *   - htmlContent: 主体内容的 HTML
 *   - headSectionHtml: 头版头条的 HTML（单独渲染）
 *   - sections: 章节数组（包含文章列表）
 *   - headSection: 头版头条对象
 *   - renderMode: 渲染模式 ('legacy' | 'safe')
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
