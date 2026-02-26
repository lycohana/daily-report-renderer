const { sanitizeStructuredMeta } = require('../../src/parser/sanitizers');
const { applySecurityMode } = require('../../src/parser/security');

describe('sanitizers', () => {
  const sections = [
    {
      title: '章节',
      summary: '<img src=x onerror=alert(1)>safe?',
      think: '<script>alert(1)</script>think',
      articles: [
        {
          title: '文章',
          summary: '<script>alert(2)</script>article-sum',
          think: '<img src=x onerror=alert(2)>article-think'
        }
      ]
    }
  ];

  test('should keep content unchanged in legacy mode', () => {
    const result = sanitizeStructuredMeta(sections, 'legacy', applySecurityMode);
    expect(result[0].summary).toContain('onerror');
    expect(result[0].think).toContain('<script>');
  });

  test('should sanitize summary and think in safe mode', () => {
    const result = sanitizeStructuredMeta(sections, 'safe', applySecurityMode);
    expect(result[0].summary).not.toContain('onerror');
    expect(result[0].think).not.toContain('<script>');
    expect(result[0].articles[0].summary).not.toContain('<script>');
    expect(result[0].articles[0].think).not.toContain('onerror');
  });
});
