/**
 * Markdown Parser 门面模块
 *
 * 对外保持原有 API，不暴露内部拆分细节。
 */

const { createMarkdownIt } = require('./parser/config');
const { parseFrontMatter } = require('./parser/frontMatter');
const { extractCustomTags } = require('./parser/customTags');
const { extractTitleFromFrontMatter, extractEditionFromFrontMatter } = require('./parser/utils');
const { resolveRenderMode, applySecurityMode } = require('./parser/security');
const { parseDocumentStructure } = require('./parser/stateMachine');
const { renderHtmlContent } = require('./parser/renderers/htmlRenderer');
const { sanitizeStructuredMeta } = require('./parser/sanitizers');

const md = createMarkdownIt();

function parseMarkdown(content) {
  const { frontMatter, content: markdownContent } = parseFrontMatter(content);
  const { tags: customTags, cleanContent } = extractCustomTags(markdownContent);
  customTags.cleanContent = cleanContent;

  const { headSection, sections } = parseDocumentStructure(cleanContent, customTags);
  const renderMode = resolveRenderMode(frontMatter);
  const sanitizedSections = sanitizeStructuredMeta(sections, renderMode, applySecurityMode);

  const { htmlContent, headSectionHtml } = renderHtmlContent({
    md,
    cleanContent: customTags.cleanContent,
    headSectionContent: headSection?.content || '',
    renderMode
  });

  const tagsIndex = require('./parser/tags/index');
  const stylesHtml = tagsIndex.getStylesHTML();

  return {
    frontMatter,
    customTags,
    htmlContent,
    headSectionHtml,
    sections: sanitizedSections,
    headSection,
    renderMode,
    stylesHtml
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
