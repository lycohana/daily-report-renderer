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
 * [from:URL]: #                       -文章来源URL
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

function finalizeArticle(currentArticle, articleContent, currentSection) {
  if (!currentArticle || !currentSection) {
    return null;
  }

  const rawContent = articleContent.join('\n');
  const parsed = extractQuoteBlocksAndContent(rawContent);
  currentArticle.quoteBlocks = parsed.quoteBlocks;
  currentArticle.content = parsed.content;
  currentSection.articles.push(currentArticle);
  return null;
}

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
 * 状态变量说明：
 * - isFirstHash: 是否遇到第一个一级标题（头版头条）
 * - inSection: 是否在章节区域内
 * - inArticles: 是否在文章列表区域内
 * - afterSectionHeader: 是否刚处理完章节标题
 * 
 * sectionArticleMeta存储结构（混合存储）：
 * - 索引0: 第一个section的icon/intro/tags
 * - 索引1: 第一个section的articles元数据
 * - 索引2: 第二个section的icon/intro/tags
 * - 索引3: 第二个section的articles元数据
 * ...
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
  const { frontMatter, content: markdownContent } = parseFrontMatter(content);
  const { tags: customTags, cleanContent } = extractCustomTags(markdownContent);
  
  const sections = [];
  let headSection = null;
  let currentSection = null;
  let currentArticle = null;
  let headlineContent = [];
  let articleContent = [];
  let isFirstHash = true;
  // 注意：cleanContent 中 [head]: 已被清理，需要从 customTags 中判断
  const hasHeadMarker = customTags.hasHeadMarker || !!customTags.headlineTags || !!customTags.headFrom;
  let inSection = false;
  let sectionIndex = -1;
  let articleIndex = 0;
  // 使用 customTags.sectionArticleMeta 来跟踪 section 元数据
  const sectionMetas = customTags.sectionArticleMeta || [];
  let currentSectionMetaIndex = 0;
  
  const lines = cleanContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 只有在看到了 [head]: 标记后，第一个 # 标题才是头版头条
    if (line.startsWith('# ') && isFirstHash && hasHeadMarker) {
      headlineContent = [];
      headSection = {
        type: 'headline',
        title: line.substring(2).trim(),
        content: '',
        tags: customTags.headlineTags || [],
        dataBlocks: customTags.dataBlocks?.headline || null,
        quoteBlocks: customTags.quoteBlocks || null,
        from: customTags.headFrom || customTags.from || null
      };
      isFirstHash = false;
      continue;
    }
    
    // 检测 # 标题作为 section 开始（[section]: 标记已被清理）
    // 当 inHeadline 结束后，下一个 # 标题就是 section 标题
    if (line.startsWith('# ') && !isFirstHash && hasHeadMarker && !inSection) {
      // 这是第一个 section 标题
      inSection = true;
      sectionIndex++;
      
      // 保存 headSection 内容
      if (headSection) {
        headSection.content = trimContent(headlineContent.join('\n'));
      }
      
      // 从 customTags 中获取 section 元数据
      const sectionMeta = sectionMetas[currentSectionMetaIndex];
      
      currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
      
      currentSectionMetaIndex++;

      continue;
    }
    
    // 检测后续的 # 标题作为新 section 开始（当还有未使用的 section 元数据时）
    if (line.startsWith('# ') && inSection && currentSectionMetaIndex < sectionMetas.length) {
      // 保存当前文章
      if (currentSection && currentArticle) {
        currentArticle = finalizeArticle(currentArticle, articleContent, currentSection);
      }
      
      // 保存当前 section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // 新 section 开始
      sectionIndex++;
      
      // 从 customTags 中获取 section 元数据
      const sectionMeta = sectionMetas[currentSectionMetaIndex];
      
      currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
      
      currentSectionMetaIndex++;

      articleContent = [];
      articleIndex = 0;
      continue;
    }
    
    // 章节标题: 在 inSection 状态下，或者没有 [head]: 标记时（允许第一个 # 标题作为章节）
    if (line.startsWith('# ') && (!isFirstHash || !hasHeadMarker) && inSection) {
      if (currentSection && currentArticle) {
        currentArticle = finalizeArticle(currentArticle, articleContent, currentSection);
      }
      if (currentSection) {
        sections.push(currentSection);
      }
      
      articleContent = [];
      articleIndex = 0;
      
      // 新架构：sectionArticleMeta 是简单数组，每个 section 对应一个对象
      // 注意：sectionIndex 从 0 开始，所以直接使用 sectionIndex 作为索引
      const sectionMeta = customTags.sectionArticleMeta && customTags.sectionArticleMeta[sectionIndex];
      
      currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
      
      // 从customTags中获取section级别的dataBlocks
      if (customTags.dataBlocks?.sections && customTags.dataBlocks.sections[sectionIndex]) {
        const sectionData = customTags.dataBlocks.sections[sectionIndex];
        // 查找section级别的dataBlock（不是article的）
        const sectionLevelData = sectionData.find(d => d.type === 'section');
        if (sectionLevelData) {
          currentSection.dataBlocks = [sectionLevelData.data];
        }
      }
      

      continue;
    }
    
    if (line.startsWith('## ') && currentSection) {
      if (currentArticle) {
        currentArticle = finalizeArticle(currentArticle, articleContent, currentSection);
      }
      
      articleContent = [];
      const articleTitle = line.substring(3).trim();
      
      // 新架构：从 customTags.sectionArticleMeta 中获取文章元数据
      // 使用 articleIndex 来索引当前文章
      let articleMeta = null;
      if (customTags.sectionArticleMeta && customTags.sectionArticleMeta[sectionIndex]) {
        const sectionMeta = customTags.sectionArticleMeta[sectionIndex];
        if (sectionMeta.articleMeta && sectionMeta.articleMeta[articleIndex]) {
          articleMeta = sectionMeta.articleMeta[articleIndex];
        }
      }
      
      currentArticle = createArticleNode(articleTitle, articleMeta);
      
      // 从customTags中获取article级别的dataBlocks
      if (customTags.dataBlocks?.articles && customTags.dataBlocks.articles[sectionIndex]) {
        const articleDataList = customTags.dataBlocks.articles[sectionIndex];
        const articleData = articleDataList.find(d => d.index === articleIndex);
        if (articleData) {
          currentArticle.dataBlocks = [articleData.data];
        }
      }
      
      articleIndex++;
      continue;
    }

    if (line.trim().startsWith('[sum:') && currentSection && !currentSection.summary) {
      const sumMatch = line.match(/\[sum:([^\]]+)\]/);
      if (sumMatch) {
        currentSection.summary = sumMatch[1];
      }
      continue;
    }
    
    if (line.trim().startsWith('[think:') && currentSection && !currentSection.think) {
      const thinkMatch = line.match(/\[think:([^\]]+)\]/);
      if (thinkMatch) {
        currentSection.think = thinkMatch[1];
      }
      continue;
    }
    
    if (line.trim().startsWith('[sum:') && currentArticle && !currentArticle.summary) {
      const sumMatch = line.match(/\[sum:([^\]]+)\]/);
      if (sumMatch) {
        currentArticle.summary = sumMatch[1];
      }
      continue;
    }
    
    if (line.trim().startsWith('[think:') && currentArticle && !currentArticle.think) {
      const thinkMatch = line.match(/\[think:([^\]]+)\]/);
      if (thinkMatch) {
        currentArticle.think = thinkMatch[1];
      }
      continue;
    }
    
    // 收集头版头条内容：在 headSection 创建后，section 标记开始前
    // 注意：这里需要检查 inSection 是否为 false，因为 section 标记会设置 inSection = true
    if (headSection && !inSection) {
      headlineContent.push(line);
    } else if (currentArticle) {
      articleContent.push(line);
    } else if (currentSection) {
      articleContent.push(line);
    }
  }
  
  if (headSection) {
    // 过滤掉引用块，避免重复渲染（引用块在 front-detail 中单独渲染）
    const rawContent = headlineContent.join('\n');
    const parsedHeadline = extractQuoteBlocksAndContent(rawContent);
    headSection.content = parsedHeadline.content;
  }
  
  if (currentArticle) {
    currentArticle = finalizeArticle(currentArticle, articleContent, currentSection);
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  const renderMode = resolveRenderMode(frontMatter);
  const sanitizedSections = sanitizeStructuredMeta(sections, renderMode);
  let htmlContent = md.render(cleanContent);
  htmlContent = processBlocks(htmlContent);
  htmlContent = applySecurityMode(htmlContent, renderMode);
  
  // 单独渲染headSection的content并应用后处理与安全策略
  let headSectionHtml = '';
  if (headSection && headSection.content) {
    headSectionHtml = md.render(headSection.content);
    headSectionHtml = processBlocks(headSectionHtml);
    headSectionHtml = applySecurityMode(headSectionHtml, renderMode);
  }
  
  return {
    frontMatter,
    customTags,
    htmlContent,
    headSectionHtml,
    sections: sanitizedSections,
    headSection,
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
