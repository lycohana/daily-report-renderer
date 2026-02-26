/**
 * 结构化字段净化（safe 模式）
 *
 * @param {Array} sections
 * @param {string} renderMode
 * @param {Function} applySecurityMode
 * @returns {Array}
 */
function sanitizeStructuredMeta(sections, renderMode, applySecurityMode) {
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

module.exports = {
  sanitizeStructuredMeta
};
