/**
 * 自定义标签提取模块
 *
 * 提取以下类型的标签：
 * - [tag:xxx]: 标签
 * - [head]: # - 头版头条标记
 * - [from:xxx]: 来源URL
 * - [fromstr:xxx]: 来源名称
 * - [section]: # - 章节标记
 * - [intro:xxx]: 章节简介
 * - [icon:xxx]: 章节图标
 * - [articles]: # - 文章列表标记
 * - [sum:xxx]: 摘要
 * - [think:xxx]: 观点
 * - <data>...</data>: 数据块（根据位置分配到头版头条或文章）
 *
 * 此模块使用新的 tags/index.js 架构作为核心解析引擎
 * 同时保留了旧架构中复杂的状态跟踪逻辑用于 section/article 元数据
 */

const tagRegistry = require('./tags');

/**
 * 提取自定义标签
 *
 * @param {string} content - Markdown文件内容（已去除Front Matter）
 * @returns {Object} - { tags: Object, cleanContent: string }
 *   - tags: 提取的标签对象
 *   - cleanContent: 去除标签后的干净内容
 */
function extractCustomTags(content) {
  // 使用新架构提取基础标签
  const { tags: newTags, cleanContent: newCleanContent } = tagRegistry.extractTags(content);

  // 合并新架构的结果
  const tags = { ...newTags };
  const sectionArticleMeta = [];
  let currentMeta = { from: null, fromStr: null, tags: [], icon: null, intro: null, articleMeta: [] };
  let currentArticleMeta = null;

  const lines = content.split('\n');
  let hasHeadMarker = false; // 是否看到了 [head]: 标记
  let inHeadline = true;
  let inSection = false;
  let sectionIndex = -1;
  let inArticles = false;
  let inArticlesSeen = false;
  const headlineTags = [];

  // 用于跟踪dataBlock属于哪个区域
  let currentDataBlockPosition = 'headline'; // 'headline', 'section', 'article'
  const headlineDataBlocks = [];
  const sectionDataBlocks = [];
  const articleDataBlocks = []; // 二维数组

  // 解析dataBlock的辅助函数
  function parseDataBlock(dataContent) {
    const dateItems = [];
    const numRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
    let numMatch;
    while ((numMatch = numRegex.exec(dataContent)) !== null) {
      dateItems.push({
        value: numMatch[1],
        label: numMatch[2]
      });
    }
    return dateItems.length > 0 ? dateItems : null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测dataBlock的位置
    if (line.includes('<data>')) {
      const dataBlockStart = line.indexOf('<data>');
      let dataBlockContent = '';

      if (line.includes('</data>')) {
        const endIndex = line.indexOf('</data>') + 7;
        dataBlockContent = line.substring(dataBlockStart + 6, endIndex - 7);
      } else {
        dataBlockContent = line.substring(dataBlockStart + 6);
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].includes('</data>')) {
            dataBlockContent += '\n' + lines[j].substring(0, lines[j].indexOf('</data>'));
            break;
          } else {
            dataBlockContent += '\n' + lines[j];
          }
        }
      }

      const parsedData = parseDataBlock(dataBlockContent);
      if (parsedData) {
        if (currentDataBlockPosition === 'headline') {
          headlineDataBlocks.push(parsedData);
        } else if (currentDataBlockPosition === 'section') {
          if (sectionDataBlocks[sectionIndex] === undefined) {
            sectionDataBlocks[sectionIndex] = [];
          }
          sectionDataBlocks[sectionIndex].push({ type: 'section', data: parsedData });
        } else if (currentDataBlockPosition === 'article') {
          if (sectionDataBlocks[sectionIndex] === undefined) {
            sectionDataBlocks[sectionIndex] = [];
          }
          if (articleDataBlocks[sectionIndex] === undefined) {
            articleDataBlocks[sectionIndex] = [];
          }
          const articleIdx = articleDataBlocks[sectionIndex].length;
          articleDataBlocks[sectionIndex].push({ type: 'article', index: articleIdx, data: parsedData });
        }
      }
    }

    // 检测 [head]: 标记
    if (line.startsWith('[head]:')) {
      hasHeadMarker = true;
      continue;
    }

    if (line.startsWith('[section]:')) {
      if (inSection) {
        if (currentArticleMeta && (currentArticleMeta.from || currentArticleMeta.fromStr || currentArticleMeta.tags.length > 0)) {
          currentMeta.articleMeta.push({ ...currentArticleMeta });
        }
        if (currentMeta.articleMeta.length > 0 || currentMeta.tags.length > 0 || currentMeta.icon || currentMeta.intro) {
          sectionArticleMeta.push({ ...currentMeta });
        }
      }
      currentMeta = { from: null, fromStr: null, tags: [], icon: null, intro: null, articleMeta: [] };
      sectionIndex++;
      inSection = true;
      inArticles = false;
      inArticlesSeen = false;
      currentDataBlockPosition = 'section';
      continue;
    }

    if (line.startsWith('[icon:')) {
      const iconMatch = line.match(/\[icon:([^\]]+)\]/);
      if (iconMatch) {
        const iconStr = iconMatch[1];
        const firstEmojiMatch = iconStr.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
        currentMeta.icon = firstEmojiMatch ? firstEmojiMatch[0] : iconStr;
      }
      continue;
    }

    // 只有在看到了 [head]: 标记后，第一个 # 标题才是头版头条的结束
    if (line.startsWith('# ') && inHeadline && hasHeadMarker) {
      inHeadline = false;
      continue;
    }
    
    // 如果没有 [head]: 标记，遇到 # 标题时不设置 inHeadline = false
    // 这样标签会被当作章节级别的标签处理

    if (line.startsWith('[intro:')) {
      const introMatch = line.match(/\[intro:([^\]]+)\]/);
      if (introMatch) {
        currentMeta.intro = introMatch[1];
      }
      continue;
    }

    if (line.startsWith('[articles]:')) {
      inArticles = true;
      inArticlesSeen = true;
      if (currentMeta.icon || currentMeta.intro) {
        sectionArticleMeta.push({ ...currentMeta });
        currentMeta = { from: null, fromStr: null, tags: [], icon: null, intro: null, articleMeta: [] };
      }
      continue;
    }

    if (line.startsWith('# ') && inSection) {
      if (currentArticleMeta && (currentArticleMeta.from || currentArticleMeta.fromStr || currentArticleMeta.tags.length > 0)) {
        currentMeta.articleMeta.push({ ...currentArticleMeta });
      }
      if (inArticlesSeen) {
        if (currentMeta.articleMeta.length > 0 || currentMeta.tags.length > 0 || currentMeta.icon || currentMeta.intro) {
          sectionArticleMeta.push({ ...currentMeta });
        }
        currentMeta = { from: null, fromStr: null, tags: [], icon: null, intro: null, articleMeta: [] };
      }
      inArticles = false;
      inArticlesSeen = false;
      currentArticleMeta = null;
      currentDataBlockPosition = 'section';
      continue;
    }

    if (line.startsWith('## ') && inSection && inArticles) {
      if (currentArticleMeta && (currentArticleMeta.from || currentArticleMeta.fromStr || currentArticleMeta.tags.length > 0)) {
        currentMeta.articleMeta.push({ ...currentArticleMeta });
      }
      currentArticleMeta = { from: null, fromStr: null, tags: [], isFirstArticle: false };
      currentDataBlockPosition = 'article';
      continue;
    }

    if (line.startsWith('[from:') && inArticles) {
      if (!currentArticleMeta) {
        currentArticleMeta = { from: null, fromStr: null, tags: [], isFirstArticle: false };
      }
      const fromMatch = line.match(/\[from:([^\]]+)\]/);
      if (fromMatch) {
        currentArticleMeta.from = fromMatch[1];
      }
      continue;
    }

    if (line.startsWith('[fromstr:') && inArticles) {
      if (!currentArticleMeta) {
        currentArticleMeta = { from: null, fromStr: null, tags: [], isFirstArticle: false };
      }
      const fromStrMatch = line.match(/\[fromstr:([^\]]+)\]/);
      if (fromStrMatch) {
        currentArticleMeta.fromStr = fromStrMatch[1];
      }
      continue;
    }

    if (line.startsWith('[tag:') && inArticles) {
      const tagMatch = line.match(/\[tag:([^\]]+)\]/);
      if (tagMatch) {
        if (currentArticleMeta) {
          currentArticleMeta.tags.push(tagMatch[1]);
        } else {
          currentMeta.tags.push(tagMatch[1]);
        }
      }
      continue;
    }

    if (line.startsWith('[tag:') && inHeadline) {
      const tagMatch = line.match(/\[tag:([^\]]+)\]/);
      if (tagMatch) {
        headlineTags.push(tagMatch[1]);
      }
      continue;
    }

    if (line.startsWith('[from:') && !inArticles && inSection) {
      const fromMatch = line.match(/\[from:([^\]]+)\]/);
      if (fromMatch) {
        currentMeta.from = fromMatch[1];
      }
      continue;
    }

    if (line.startsWith('[fromstr:') && !inArticles && inSection) {
      const fromStrMatch = line.match(/\[fromstr:([^\]]+)\]/);
      if (fromStrMatch) {
        currentMeta.fromStr = fromStrMatch[1];
      }
      continue;
    }
  }

  if (currentArticleMeta && inSection) {
    currentMeta.articleMeta.push({ ...currentArticleMeta });
  }

  if (inSection) {
    sectionArticleMeta.push({ ...currentMeta });
  }

  tags.sectionArticleMeta = sectionArticleMeta;

  // 使用新架构的 cleanContent 作为基础
  let cleanContent = newCleanContent;

  // 处理 headFrom - 头版头条来源
  const headFromRegex = /\[head\]:\s*#\s*\n\[from:([^\]]+)\]/g;
  let match;
  while ((match = headFromRegex.exec(content)) !== null) {
    tags.headFrom = match[1];
  }
  cleanContent = cleanContent.replace(headFromRegex, '');

  // 将dataBlocks存储为结构化对象
  tags.dataBlocks = {
    headline: headlineDataBlocks,
    sections: sectionDataBlocks.filter(s => s !== null && s !== undefined),
    articles: articleDataBlocks.filter(a => a !== null && a !== undefined)
  };

  // 提取引用块
  const firstSectionIndex = content.indexOf('[section]:');
  const headContent = firstSectionIndex === -1 ? content : content.substring(0, firstSectionIndex);

  const quoteBlockRegex = /^> (.+)$/gm;
  const quoteBlocks = [];
  let lastMatchEnd = -1;
  let currentQuote = null;

  while ((match = quoteBlockRegex.exec(headContent)) !== null) {
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

  if (quoteBlocks.length > 0) {
    tags.quoteBlocks = quoteBlocks;
  }

  const cleanFirstSectionIndex = cleanContent.indexOf('[section]:');
  if (cleanFirstSectionIndex !== -1) {
    const headCleanPart = cleanContent.substring(0, cleanFirstSectionIndex);
    const bodyCleanPart = cleanContent.substring(cleanFirstSectionIndex);
    const headQuoteBlockRegex = /^> (.+)$/gm;
    const cleanHeadAfterRemove = headCleanPart.replace(headQuoteBlockRegex, '');
    cleanContent = cleanHeadAfterRemove + bodyCleanPart;
  }

  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
  cleanContent = cleanContent.replace(/^: #\s*$/gm, '');

  if (inSection) {
    if (currentArticleMeta && (currentArticleMeta.from || currentArticleMeta.fromStr || currentArticleMeta.tags.length > 0)) {
      currentMeta.articleMeta.push({ ...currentArticleMeta });
    }
    if (currentMeta.articleMeta.length > 0 || currentMeta.tags.length > 0 || currentMeta.icon || currentMeta.intro) {
      sectionArticleMeta.push({ ...currentMeta });
    }
  }

  if (headlineTags.length > 0) {
    tags.headlineTags = headlineTags;
  }

  return { tags, cleanContent };
}

module.exports = {
  extractCustomTags
};
