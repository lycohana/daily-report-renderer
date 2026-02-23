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

const md = createMarkdownIt();

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
  let hasHeadMarker = false; // 是否看到了 [head]: 标记
  let inSection = false;
  let currentSectionTags = [];
  let currentSectionIcon = null;
  let currentSectionIntro = null;
  let sectionIndex = -1;
  let articleIndex = 0;
  let afterSectionHeader = false;
  
  const lines = cleanContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 只有在看到了 [head]: 标记后，第一个 # 标题才是头版头条
    if (line.startsWith('# ') && isFirstHash && hasHeadMarker) {
      if (headSection) {
        headSection.content = headlineContent.join('\n').replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
      }
      
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
    
    // 如果没有 [head]: 标记，遇到第一个 # 标题时设置 isFirstHash = false 以允许章节解析
    if (line.startsWith('# ') && isFirstHash && !hasHeadMarker && inSection) {
      isFirstHash = false;
    }
    
    // 检测 [head]: 标记 - 标记头版头条区域的开始
    if (line.startsWith('[head]:')) {
      hasHeadMarker = true;
      continue;
    }
    
    if (line.startsWith('[section]:')) {
      sectionIndex++;
      inSection = true;
      continue;
    }
    
    // 章节标题: 在 inSection 状态下，或者没有 [head]: 标记时（允许第一个 # 标题作为章节）
    if (line.startsWith('# ') && (!isFirstHash || !hasHeadMarker) && inSection) {
      if (currentSection && currentArticle) {
        const rawContent = articleContent.join('\n');
        const quoteBlockRegex = /^> (.+)$/gm;
        const articleQuoteBlocks = [];
        let lastMatchEnd = -1;
        let currentQuote = null;
        let match;
        
        while ((match = quoteBlockRegex.exec(rawContent)) !== null) {
          if (lastMatchEnd !== -1 && match.index - lastMatchEnd > 1) {
            if (currentQuote) {
              articleQuoteBlocks.push(currentQuote.trim());
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
          articleQuoteBlocks.push(currentQuote.trim());
        }
        
        currentArticle.quoteBlocks = articleQuoteBlocks;
        currentArticle.content = rawContent.replace(quoteBlockRegex, '').replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
        currentSection.articles.push(currentArticle);
        currentArticle = null;
      }
      if (currentSection) {
        currentSection.tags = currentSectionTags;
        currentSection.icon = currentSectionIcon;
        sections.push(currentSection);
      }
      
      currentSectionTags = [];
      currentSectionIcon = null;
      currentSectionIntro = null;
      articleContent = [];
      articleIndex = 0;
      
      const sectionMetaIndex = sectionIndex * 2;
      const sectionMeta = customTags.sectionArticleMeta && customTags.sectionArticleMeta[sectionMetaIndex];
      if (sectionMeta) {
        if (sectionMeta.icon) {
          currentSectionIcon = sectionMeta.icon;
        }
        if (sectionMeta.intro) {
          currentSectionIntro = sectionMeta.intro;
        }
        if (sectionMeta.tags) {
          currentSectionTags = [...sectionMeta.tags];
        }
      }
      
      currentSection = {
        type: 'section',
        title: line.substring(2).trim(),
        articles: [],
        intro: currentSectionIntro,
        icon: currentSectionIcon,
        tags: currentSectionTags,
        summary: null,
        think: null,
        dataBlocks: null
      };
      
      // 从customTags中获取section级别的dataBlocks
      if (customTags.dataBlocks?.sections && customTags.dataBlocks.sections[sectionIndex]) {
        const sectionData = customTags.dataBlocks.sections[sectionIndex];
        // 查找section级别的dataBlock（不是article的）
        const sectionLevelData = sectionData.find(d => d.type === 'section');
        if (sectionLevelData) {
          currentSection.dataBlocks = [sectionLevelData.data];
        }
      }
      
      afterSectionHeader = true;
      continue;
    }
    
    if (line.trim().startsWith('[icon:') && currentSection && afterSectionHeader) {
      const iconMatch = line.match(/\[icon:([^\]]+)\]/);
      if (iconMatch) {
        currentSectionIcon = iconMatch[1];
        currentSection.icon = currentSectionIcon;
      }
      continue;
    }
    
    if (line.trim().startsWith('[intro:') && currentSection && afterSectionHeader) {
      const introMatch = line.match(/\[intro:([^\]]+)\]/);
      if (introMatch) {
        currentSectionIntro = introMatch[1];
        currentSection.intro = currentSectionIntro;
      }
      continue;
    }
    
    if (line.trim().startsWith('[tag:') && currentSection && afterSectionHeader) {
      const tagMatch = line.match(/\[tag:([^\]]+)\]/);
      if (tagMatch) {
        currentSectionTags.push(tagMatch[1]);
      }
      continue;
    }
    
    if (line.startsWith('## ') && currentSection) {
      if (currentArticle) {
        const rawContent = articleContent.join('\n');
        const quoteBlockRegex = /^> (.+)$/gm;
        const articleQuoteBlocks = [];
        let lastMatchEnd = -1;
        let currentQuote = null;
        let match;
        
        while ((match = quoteBlockRegex.exec(rawContent)) !== null) {
          if (lastMatchEnd !== -1 && match.index - lastMatchEnd > 1) {
            if (currentQuote) {
              articleQuoteBlocks.push(currentQuote.trim());
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
          articleQuoteBlocks.push(currentQuote.trim());
        }
        
        currentArticle.quoteBlocks = articleQuoteBlocks;
        currentArticle.content = rawContent.replace(quoteBlockRegex, '').replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
        currentSection.articles.push(currentArticle);
        currentArticle = null;
      }
      
      articleContent = [];
      const articleTitle = line.substring(3).trim();
      const meta = {
        title: articleTitle,
        from: null,
        fromStr: null,
        tags: []
      };
      
      for (let j = i - 1; j >= 0 && j >= i - 20; j--) {
        const prevLine = lines[j];
        const fromMatch = prevLine.match(/\[from:([^\]]+)\]/);
        if (fromMatch && !meta.from) {
          meta.from = fromMatch[1];
        }
        const fromStrMatch = prevLine.match(/\[fromstr:([^\]]+)\]/);
        if (fromStrMatch && !meta.fromStr) {
          meta.fromStr = fromStrMatch[1];
        }
        const tagMatch = prevLine.match(/\[tag:([^\]]+)\]/);
        if (tagMatch) {
          meta.tags.unshift(tagMatch[1]);
        }
      }
      
      if (currentSection.pendingArticleMeta && !meta.from) {
        meta.from = currentSection.pendingArticleMeta.from;
        meta.fromStr = currentSection.pendingArticleMeta.fromStr;
        meta.tags = [...(currentSection.pendingArticleMeta.tags || []), ...meta.tags];
      }
      
      const articleMetaIndex = sectionIndex * 2 + 1;
      const sectionMeta = customTags.sectionArticleMeta && customTags.sectionArticleMeta[articleMetaIndex];
      if (sectionMeta && sectionMeta.articleMeta) {
        const articleMeta = sectionMeta.articleMeta[articleIndex];
        if (articleMeta) {
          if (!meta.from && articleMeta.from) {
            meta.from = articleMeta.from;
          }
          if (!meta.fromStr && articleMeta.fromStr) {
            meta.fromStr = articleMeta.fromStr;
          }
          if (articleMeta.tags && articleMeta.tags.length > 0) {
            meta.tags = [...articleMeta.tags, ...meta.tags];
          }
        }
      }
      
      currentArticle = {
        type: 'article',
        title: articleTitle,
        content: '',
        quoteBlocks: [],
        from: meta.from,
        fromStr: meta.fromStr,
        tags: meta.tags,
        summary: null,
        think: null,
        dataBlocks: null
      };
      
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
    
    if (line.trim().startsWith('[from:') && currentSection && !currentArticle) {
      const fromMatch = line.match(/\[from:([^\]]+)\]/);
      if (fromMatch) {
        if (!currentSection.pendingArticleMeta) {
          currentSection.pendingArticleMeta = {};
        }
        currentSection.pendingArticleMeta.from = fromMatch[1];
      }
      continue;
    }
    
    if (line.trim().startsWith('[fromstr:') && currentSection && !currentArticle) {
      const fromStrMatch = line.match(/\[fromstr:([^\]]+)\]/);
      if (fromStrMatch) {
        if (!currentSection.pendingArticleMeta) {
          currentSection.pendingArticleMeta = {};
        }
        currentSection.pendingArticleMeta.fromStr = fromStrMatch[1];
      }
      continue;
    }
    
    if (line.trim().startsWith('[tag:') && currentSection && !currentArticle) {
      const tagMatch = line.match(/\[tag:([^\]]+)\]/);
      if (tagMatch) {
        if (!currentSection.pendingArticleMeta) {
          currentSection.pendingArticleMeta = { tags: [] };
        }
        if (!currentSection.pendingArticleMeta.tags) {
          currentSection.pendingArticleMeta.tags = [];
        }
        currentSection.pendingArticleMeta.tags.push(tagMatch[1]);
      }
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
    
    if (headSection && isFirstHash === false && !currentSection) {
      headlineContent.push(line);
    } else if (currentArticle) {
      articleContent.push(line);
    } else if (currentSection) {
      articleContent.push(line);
    }
  }
  
  if (headSection) {
    headSection.content = headlineContent.join('\n').replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
  }
  
  if (currentArticle) {
    const rawContent = articleContent.join('\n');
    const quoteBlockRegex = /^> (.+)$/gm;
    const articleQuoteBlocks = [];
    let lastMatchEnd = -1;
    let currentQuote = null;
    let match;
    
    while ((match = quoteBlockRegex.exec(rawContent)) !== null) {
      if (lastMatchEnd !== -1 && match.index - lastMatchEnd > 1) {
        if (currentQuote) {
          articleQuoteBlocks.push(currentQuote.trim());
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
      articleQuoteBlocks.push(currentQuote.trim());
    }
    
    currentArticle.quoteBlocks = articleQuoteBlocks;
    currentArticle.content = rawContent.replace(quoteBlockRegex, '').replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
    if (currentSection) {
      currentSection.articles.push(currentArticle);
    }
  }
  
  if (currentSection) {
    currentSection.tags = currentSectionTags;
    sections.push(currentSection);
  }
  
  let htmlContent = md.render(cleanContent);
  
  // 后处理：将<data>块替换为HTML
  htmlContent = htmlContent.replace(/<data>([\s\S]*?)<\/data>/g, (match, dataContent) => {
    const items = [];
    const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
    let numMatch;
    while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
      items.push({ value: numMatch[1], label: numMatch[2] });
    }
    
    if (items.length > 0) {
      const itemsHtml = items.map(item => 
        `<div class="front-stat">
          <div class="front-stat-value">${item.value}</div>
          <div class="front-stat-label">${item.label}</div>
        </div>`
      ).join('');
      
      return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
    }
    return '';
  });
  
  // 单独渲染headSection的content并应用后处理
  let headSectionHtml = '';
  if (headSection && headSection.content) {
    headSectionHtml = md.render(headSection.content);
    headSectionHtml = headSectionHtml.replace(/<data>([\s\S]*?)<\/data>/g, (match, dataContent) => {
      const items = [];
      const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
      let numMatch;
      while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
        items.push({ value: numMatch[1], label: numMatch[2] });
      }
      
      if (items.length > 0) {
        const itemsHtml = items.map(item => 
          `<div class="front-stat">
            <div class="front-stat-value">${item.value}</div>
            <div class="front-stat-label">${item.label}</div>
          </div>`
        ).join('');
        
        return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
      }
      return '';
    });
  }
  
  return {
    frontMatter,
    customTags,
    htmlContent,
    headSectionHtml,
    sections,
    headSection
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
