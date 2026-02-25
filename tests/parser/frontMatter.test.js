const { parseFrontMatter } = require('../../src/parser/frontMatter');

describe('FrontMatter Parser', () => {
  test('should parse yaml arrays and multiline strings', () => {
    const markdown = `---
title: Test
tags:
  - ai
  - news
description: |
  line one
  line two
---
# body`;

    const { frontMatter, content } = parseFrontMatter(markdown);
    expect(frontMatter.title).toBe('Test');
    expect(frontMatter.tags).toEqual(['ai', 'news']);
    expect(frontMatter.description).toContain('line one');
    expect(content).toContain('# body');
  });

  test('should keep 001 as string with failsafe schema', () => {
    const markdown = `---
number: 001
---
# body`;
    const { frontMatter } = parseFrontMatter(markdown);
    expect(frontMatter.number).toBe('001');
  });

  test('should gracefully fallback when yaml is invalid', () => {
    const markdown = `---
title: Test
invalid: [1,2
---
# body`;
    const { frontMatter, content } = parseFrontMatter(markdown);
    expect(frontMatter.title).toBe('Test');
    expect(content).toContain('# body');
  });
});
