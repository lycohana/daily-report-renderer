const { createMarkdownIt } = require('../../../src/parser/config');
const { renderHtmlContent } = require('../../../src/parser/renderers/htmlRenderer');

describe('htmlRenderer', () => {
  const md = createMarkdownIt();

  test('should render main content and process blocks', () => {
    const { htmlContent } = renderHtmlContent({
      md,
      cleanContent: `# 标题
<sum>总结内容</sum>
<think>思考内容</think>
<notes><note>**笔记**</note></notes>
<data><num>98%</num><str>完成率</str></data>`,
      headSectionContent: '',
      renderMode: 'legacy'
    });

    expect(htmlContent).toContain('analysis-box');
    expect(htmlContent).toContain('thought-box');
    expect(htmlContent).toContain('notes-section');
    expect(htmlContent).toContain('front-stats');
  });

  test('should render headSection content separately', () => {
    const { headSectionHtml } = renderHtmlContent({
      md,
      cleanContent: '# 主内容',
      headSectionContent: '<sum>头版总结</sum>',
      renderMode: 'legacy'
    });

    expect(headSectionHtml).toContain('analysis-box');
    expect(headSectionHtml).toContain('头版总结');
  });

  test('should sanitize html in safe mode', () => {
    const { htmlContent } = renderHtmlContent({
      md,
      cleanContent: '<script>alert(1)</script><sum>ok</sum>',
      headSectionContent: '',
      renderMode: 'safe'
    });

    expect(htmlContent).not.toContain('<script>');
    expect(htmlContent).toContain('analysis-box');
  });
});
