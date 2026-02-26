/**
 * 文档结构状态机
 *
 * 仅负责结构化解析（headline / section / article）与节点组装。
 */

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

    this.hasHeadMarker = customTags.hasHeadMarker || !!customTags.headlineTags || !!customTags.headFrom;
    this.sectionMetas = customTags.sectionArticleMeta || [];
    this.currentSectionMetaIndex = 0;
    this.customTags = customTags;
  }

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

function startNewSection(state, line) {
  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }

  if (state.currentSection) {
    state.sections.push(state.currentSection);
  }

  if (state.headSection) {
    state.headSection.content = trimContent(state.headlineContent.join('\n'));
  }

  state.sectionIndex++;
  state.articleContent = [];
  state.articleIndex = 0;

  const sectionMeta = state.sectionMetas[state.currentSectionMetaIndex] || {};
  state.currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);
  state.currentSectionMetaIndex++;

  if (state.customTags.dataBlocks?.sections && state.customTags.dataBlocks.sections[state.sectionIndex]) {
    const sectionData = state.customTags.dataBlocks.sections[state.sectionIndex];
    const sectionLevelData = sectionData.find(d => d.type === 'section');
    if (sectionLevelData) {
      state.currentSection.dataBlocks = [sectionLevelData.data];
    }
  }

  state.inSection = true;
}

function startNewArticle(state, line) {
  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }

  state.articleContent = [];
  const articleTitle = line.substring(3).trim();

  let articleMeta = null;
  if (state.customTags.sectionArticleMeta && state.customTags.sectionArticleMeta[state.sectionIndex]) {
    const sectionMeta = state.customTags.sectionArticleMeta[state.sectionIndex];
    if (sectionMeta.articleMeta && sectionMeta.articleMeta[state.articleIndex]) {
      articleMeta = sectionMeta.articleMeta[state.articleIndex];
    }
  }

  state.currentArticle = createArticleNode(articleTitle, articleMeta);

  if (state.customTags.dataBlocks?.articles && state.customTags.dataBlocks.articles[state.sectionIndex]) {
    const articleDataList = state.customTags.dataBlocks.articles[state.sectionIndex];
    const articleData = articleDataList.find(d => d.index === state.articleIndex);
    if (articleData) {
      state.currentArticle.dataBlocks = [articleData.data];
    }
  }

  state.articleIndex++;
}

function parseLine(state, line) {
  if (line.startsWith('# ') && state.isFirstHash && state.hasHeadMarker) {
    handleHeadline(state, line);
    return true;
  }

  if (line.startsWith('# ') && !state.isFirstHash && state.hasHeadMarker && !state.inSection) {
    startNewSection(state, line);
    return true;
  }

  if (line.startsWith('# ') && state.inSection) {
    startNewSection(state, line);
    return true;
  }

  if (line.startsWith('# ') && (!state.isFirstHash || !state.hasHeadMarker) && state.inSection) {
    if (state.currentSection && state.currentArticle) {
      finalizeCurrentArticle(state);
    }
    if (state.currentSection) {
      state.sections.push(state.currentSection);
    }

    state.articleContent = [];
    state.articleIndex = 0;

    const sectionMeta =
      state.customTags.sectionArticleMeta && state.customTags.sectionArticleMeta[state.sectionIndex];

    state.currentSection = createSectionNode(line.substring(2).trim(), sectionMeta);

    if (state.customTags.dataBlocks?.sections && state.customTags.dataBlocks.sections[state.sectionIndex]) {
      const sectionData = state.customTags.dataBlocks.sections[state.sectionIndex];
      const sectionLevelData = sectionData.find(d => d.type === 'section');
      if (sectionLevelData) {
        state.currentSection.dataBlocks = [sectionLevelData.data];
      }
    }

    return true;
  }

  if (line.startsWith('## ') && state.currentSection) {
    startNewArticle(state, line);
    return true;
  }

  if (state.tryParseSum(line, state.currentSection)) {
    return true;
  }

  if (state.tryParseThink(line, state.currentSection)) {
    return true;
  }

  if (state.tryParseSum(line, state.currentArticle)) {
    return true;
  }

  if (state.tryParseThink(line, state.currentArticle)) {
    return true;
  }

  state.addContent(line);
  return true;
}

function finalizeAll(state) {
  if (state.headSection) {
    const rawContent = state.headlineContent.join('\n');
    const parsedHeadline = extractQuoteBlocksAndContent(rawContent);
    state.headSection.content = parsedHeadline.content;
  }

  if (state.currentArticle) {
    finalizeCurrentArticle(state);
  }

  if (state.currentSection) {
    state.sections.push(state.currentSection);
  }
}

function parseDocumentStructure(cleanContent, customTags) {
  const state = new ParserState(customTags);
  const lines = cleanContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    parseLine(state, lines[i]);
  }
  finalizeAll(state);

  return {
    headSection: state.headSection,
    sections: state.sections
  };
}

module.exports = {
  parseDocumentStructure,
  trimContent,
  extractQuoteBlocksAndContent
};
