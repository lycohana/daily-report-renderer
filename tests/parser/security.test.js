const { applySecurityMode, resolveRenderMode, RENDER_MODES } = require('../../src/parser/security');

describe('Security Parser', () => {
  test('should default to legacy mode', () => {
    expect(resolveRenderMode({})).toBe(RENDER_MODES.LEGACY);
    expect(resolveRenderMode({ render_mode: 'invalid' })).toBe(RENDER_MODES.LEGACY);
  });

  test('should resolve safe mode from front matter', () => {
    expect(resolveRenderMode({ render_mode: 'safe' })).toBe(RENDER_MODES.SAFE);
    expect(resolveRenderMode({ render_mode: 'SAFE' })).toBe(RENDER_MODES.SAFE);
  });

  test('should keep html unchanged in legacy mode', () => {
    const html = '<script>alert(1)</script><p>content</p>';
    expect(applySecurityMode(html, RENDER_MODES.LEGACY)).toBe(html);
  });

  test('should sanitize dangerous html in safe mode', () => {
    const html = '<script>alert(1)</script><p onclick="evil()">safe</p>';
    const result = applySecurityMode(html, RENDER_MODES.SAFE);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('onclick=');
    expect(result).toContain('<p>safe</p>');
  });

  test('should add noopener noreferrer for target blank links', () => {
    const html = '<a href="https://example.com" target="_blank">x</a>';
    const result = applySecurityMode(html, RENDER_MODES.SAFE);
    expect(result).toContain('rel="noopener noreferrer"');
  });

  test('should remove disallowed protocols in safe mode', () => {
    const html = '<a href="javascript:alert(1)">bad</a><a href="https://ok.com">ok</a>';
    const result = applySecurityMode(html, RENDER_MODES.SAFE);
    expect(result).toContain('<a>bad</a>');
    expect(result).toContain('href="https://ok.com"');
  });
});
