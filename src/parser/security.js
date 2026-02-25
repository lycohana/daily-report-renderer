const sanitizeHtml = require('sanitize-html');

const RENDER_MODES = {
  LEGACY: 'legacy',
  SAFE: 'safe'
};

function resolveRenderMode(frontMatter = {}) {
  const mode = String(frontMatter.render_mode || '').toLowerCase().trim();
  return mode === RENDER_MODES.SAFE ? RENDER_MODES.SAFE : RENDER_MODES.LEGACY;
}

function sanitizeRenderedHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em',
      'blockquote', 'code', 'pre', 'a', 'br', 'hr', 'div', 'span'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'title'],
      div: ['class', 'data-inline'],
      span: ['class'],
      code: ['class']
    },
    allowedClasses: {
      div: [
        /^front-/,
        /^weather-/,
        /^article-/,
        /^section-/,
        /^analysis-/,
        /^thought-/,
        /^toc-/
      ],
      span: [/^front-/, /^article-/, /^section-/, /^toc-/],
      code: [/^language-/]
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto']
    },
    transformTags: {
      a: (tagName, attribs) => {
        const next = { ...attribs };
        if (next.target === '_blank') {
          next.rel = 'noopener noreferrer';
        }
        return {
          tagName,
          attribs: next
        };
      }
    }
  });
}

function applySecurityMode(html, renderMode) {
  if (renderMode === RENDER_MODES.SAFE) {
    return sanitizeRenderedHtml(html);
  }
  return html;
}

module.exports = {
  RENDER_MODES,
  resolveRenderMode,
  applySecurityMode
};
