# 自定义标签开发指南

**版本**: 1.0.0
**最后更新**: 2026-02-26

本文档说明如何在日报系统中新增自定义标签。系统采用模块化标签处理架构，支持自动发现和注册标签处理器。

## 目录

- [快速开始](#快速开始)
- [架构概述](#架构概述)
- [标签类型](#标签类型)
- [新增标签处理器](#新增标签处理器)
- [标签作用域](#标签作用域)
- [状态机](#状态机)
- [视图层使用](#视图层使用)
- [测试](#测试)
- [样式](#样式)

---

## 快速开始

新增一个自定义标签只需两步：

1. 在 `src/parser/tags/handlers/` 对应类型目录下创建新的处理器文件
   - `inline/` - 行内标签（如 `[tag:xxx]: #`）
   - `marker/` - 标记标签（如 `[section]: #`）
   - `block/` - 区块标签（如 `<data>...</data>`）
2. 在视图模板中使用提取的数据

示例：新增 `[author:张三]: #` 标签（行内标签）

```javascript
// src/parser/tags/handlers/inline/AuthorHandler.js
const BaseHandler = require('../../BaseHandler');

class AuthorHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[author:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    const value = match[1];
    
    // 收集元数据
    if (context?.collector) {
      context.collector.collect('author', value, context.state);
    }

    return {
      name: this.name,
      value: value,
      lineIndex
    };
  }

  clean(content) {
    // 注意：行内标签通常删除标签语法
    // 如果是 sum/think 等特殊标签，需要保留内容供 stateMachine.js 解析
    return content.replace(new RegExp(this.syntax.source, 'gm'), '');
  }

  getStyles() {
    return `
.author { color: #1565c0; font-weight: 600; }
    `.trim();
  }
}

module.exports = AuthorHandler;
```

然后在视图中使用：

**注意**：新标签字段需要在 `MetaCollector.js` 的 `collect()` 方法中收集，并在 `getResult()` 方法中返回。如果需要在 `sections` 或 `articles` 中访问，还需要在 `src/parser/stateMachine.js` 中映射字段。

```ejs
<!-- 在头版区域 -->
<% if (customTags.headAuthor) { %>
<div class="article-author">作者：<%= customTags.headAuthor %></div>
<% } %>

<!-- 在章节区域 -->
<% sections.forEach(section => { %>
  <% if (section.author) { %>
  <div class="section-author">作者：<%= section.author %></div>
  <% } %>
<% }); %>

<!-- 在文章区域 -->
<% sections.forEach(section => { %>
  <% section.articles.forEach(article => { %>
    <% if (article.author) { %>
    <div class="article-author">作者：<%= article.author %></div>
    <% } %>
  <% }); %>
<% }); %>
```

---

## 架构概述

### 文件结构

```
src/parser/tags/
├── BaseHandler.js           # 基础处理器类
├── MetaCollector.js         # 元数据收集器（状态机）
├── index.js                 # 标签注册表（自动发现）
└── handlers/                # 标签处理器目录
    ├── inline/              # 行内标签处理器
    │   ├── TagHandler.js       # [tag:] 标签
    │   ├── FromHandler.js      # [from:] 标签
    │   ├── FromstrHandler.js   # [fromstr:] 标签
    │   ├── IconHandler.js      # [icon:] 标签
    │   ├── IntroHandler.js     # [intro:] 标签
    │   ├── SumHandler.js       # [sum:] 标签（行内）
    │   └── ThinkHandler.js     # [think:] 标签（行内）
    ├── marker/              # 标记标签处理器
    │   ├── HeadHandler.js      # [head]: 标记
    │   ├── SectionHandler.js   # [section]: 标记
    │   └── ArticlesHandler.js  # [articles]: 标记
    └── block/               # 区块标签处理器
        ├── DataHandler.js      # <data> 数据块
        ├── QuoteHandler.js     # > 引用块
        ├── WeatherHandler.js   # <weather> 天气块
        ├── SumBlockHandler.js  # <sum> 总结块
        ├── ThinkBlockHandler.js# <think> 思考块
        └── NotesBlockHandler.js# <notes> 笔记块
```

### 核心组件

1. **BaseHandler** - 所有处理器的基类，提供通用属性和方法
2. **MetaCollector** - 状态机和元数据收集器，跟踪文档结构
3. **TagRegistry** - 自动发现和注册处理器（`index.js`）
4. **Handler Classes** - 每个标签一个处理器类

### 处理流程

```
Markdown 文件
    │
    ▼
tags/index.js (extractTags)
    │
    ├── marker handlers → 更新状态（head/section/articles）
    │                     ↓
    │                     clean() 删除标签语法
    │
    ├── inline handlers → 收集元数据到 MetaCollector
    │                     ↓
    │                     clean() 删除标签语法 (sum/think 除外)
    │
    ├── block handlers  → 生成 HTML（parseDocument）
    │                     ↓
    │                     clean() 保留内容
    │
    ▼
parser/stateMachine.js
    │
    ├── parseLine() → 构建 sections/articles 结构
    │
    └── tryParseSum/tryParseThink → 解析行内 sum/think（需要保留的标签）
    │
    ▼
parser/renderers/htmlRenderer.js
    │
    └── processBlocks() → 渲染 data/weather/sum/think/notes
    │
    ▼
EJS 模板渲染
```

### 重要架构说明

#### `clean()` 方法行为

不同类型的标签处理器有不同的 `clean()` 行为：

| 类型 | 行为 | 原因 | 示例文件 |
|------|------|------|----------|
| **行内标签** (inline) | 删除标签语法 | 元数据已收集到 `MetaCollector` | `TagHandler.js`, `FromHandler.js` |
| **标记标签** (marker) | 删除标签语法 | 状态已更新，标签不再需要 | `HeadHandler.js`, `SectionHandler.js` |
| **区块标签** (block) | 通常不删除 | 需要在渲染阶段处理 HTML | `DataHandler.js`, `WeatherHandler.js` |
| **特殊行内标签** (`sum`/`think`) | 不删除 | 需要在 `stateMachine.js` 中再次解析 | `SumHandler.js`, `ThinkHandler.js` |

**示例**:

```javascript
// 行内/标记标签 - 删除语法
clean(content) {
  return content.replace(new RegExp(this.syntax.source, 'gm'), '');
}

// 区块标签 - 保留内容
clean(content) {
  return content;  // 不删除，由渲染阶段处理
}

// 特殊行内标签 (sum/think) - 保留内容
clean(content) {
  return content;  // 不删除，供 stateMachine.js 解析
}
```

**注意事项**:

1. 行内标签和标记标签在元数据收集完成后会删除标签语法
2. 区块标签保留原始内容，由 `htmlRenderer.js` 的 `processBlocks()` 处理
3. `sum` 和 `think` 行内标签特殊处理，保留内容供 `stateMachine.js` 的 `tryParseSum`/`tryParseThink` 解析

---

## 标签类型

### 1. 行内标签 (inline)

**语法**: `[标签名：参数]: #`

**特点**: 单行定义，可重复使用，收集元数据

**示例**:
```markdown
[tag:AI]: #
[from:https://example.com]: #
[icon:🤖]: #
[sum:这是总结]: #
[think:这是思考]: #
```

**处理器示例**: `TagHandler.js`, `FromHandler.js`, `SumHandler.js`, `ThinkHandler.js`

**实现接口**:
```javascript
class MyHandler extends BaseHandler {
  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) return null;
    
    if (context?.collector) {
      context.collector.collect('mytag', match[1], context.state);
    }
    
    return {
      name: this.name,
      value: match[1],
      lineIndex
    };
  }

  clean(content) {
    return content;  // 不删除标签
  }
}
```

### 2. 标记标签 (marker)

**语法**: `[标签名]: #`

**特点**: 触发状态变化，无参数

**示例**:
```markdown
[section]: #
[head]: #
[articles]: #
```

**处理器示例**: `HeadHandler.js`, `SectionHandler.js`, `ArticlesHandler.js`

**实现接口**:
```javascript
class MyHandler extends BaseHandler {
  getType() {
    return 'marker';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) return null;
    
    if (context?.collector) {
      context.collector.onMarker('mytag');
    }
    
    return {
      name: this.name,
      match: match[0],
      lineIndex
    };
  }

  clean(content) {
    return content;  // 不删除标签
  }
}
```

### 3. 区块标签 (block)

**语法**: `<标签名>内容</标签名>` 或 `> 引用块`

**特点**: 可跨多行，包含复杂内容

**示例**:
```markdown
<data>
<num>98.7%</num><str>完成率</str>
</data>

<sum>
这是总结内容，可以跨多行。
</sum>

<think>
这是思考内容。
</think>

> **引用：** 引用内容
```

**处理器示例**: `DataHandler.js`, `QuoteHandler.js`, `WeatherHandler.js`, `SumBlockHandler.js`, `ThinkBlockHandler.js`

**实现接口**:
```javascript
class MyHandler extends BaseHandler {
  getType() {
    return 'block';
  }

  parseDocument(content, context) {
    const results = [];
    this.syntax.lastIndex = 0;
    const matches = [...content.matchAll(this.syntax)];
    
    for (const match of matches) {
      const value = match[1].trim();
      results.push({
        name: this.name,
        value: value,
        html: this._renderHTML(value)
      });
    }
    
    return results;
  }

  _renderHTML(value) {
    return `<div class="my-tag">${value}</div>`;
  }

  clean(content) {
    return content;  // 不删除标签
  }
}
```

---

## Sum 和 Think 标签详解

系统支持两种类型的 sum（总结）和 think（思考）标签：

### 行内标签（章节/文章级别）

**语法**: `[sum:xxx]: #` / `[think:xxx]: #`

**作用域**: 根据位置自动识别
- 在头版区域 → `headlineSum` / `headlineThink`
- 在章节区域 → `sectionMeta.sum` / `sectionMeta.thinks`
- 在文章区域 → `articleMeta.sum` / `articleMeta.thinks`

**渲染位置**: 章节/文章末尾（由视图层控制）

**示例**:
```markdown
[section]: #
[intro:AI 热点深度分析]: #
[icon:🤖]: #
# AI 热点深度分析
[articles]: #
## 文章 1
文章内容...
[sum:这是章节总结，会渲染在章节末尾]: #
[think:这是章节思考，会渲染在章节末尾]: #
```

**渲染效果**:
```
┌─────────────────────────────────────┐
│  🤖 AI 热点深度分析        P01      │
├─────────────────────────────────────┤
│  文章 1 标题                          │
│  文章内容...                        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ ■ 总结                       │    │
│  │   这是章节总结...            │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 💡 思考                      │    │
│  │   这是章节思考...            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 区块标签（原地渲染）

**语法**: `<sum>...</sum>` / `<think>...</think>`

**作用域**: 任意位置

**渲染位置**: 标签所在位置（由 `src/parser/renderers/htmlRenderer.js` 调用 `processBlocks()` 处理）

**示例**:
```markdown
## 文章标题
文章内容...

<sum>
这是文章的总结，可以跨多行。
支持复杂的格式。
</sum>

<think>
这是观点思考，同样支持多行。
</think>

更多文章内容...
```

**渲染效果**:
```
文章标题
文章内容...

┌─────────────────────────────┐
│ ■ 总结                       │
│   这是文章的总结              │
└─────────────────────────────┘

更多文章内容...
```

---

## 新增标签处理器

### 步骤 1：创建处理器文件

在 `src/parser/tags/handlers/` 目录下创建新文件，例如 `AuthorHandler.js`：

```javascript
// src/parser/tags/handlers/inline/AuthorHandler.js
const BaseHandler = require('../../BaseHandler');

class AuthorHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[author:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parseLine(line, context, lineIndex) {
    const match = line.match(this.syntax);
    if (!match) {
      return null;
    }

    const value = match[1];
    
    // 收集元数据
    if (context?.collector) {
      context.collector.collect('author', value, context.state);
    }

    return {
      name: this.name,
      value: value,
      lineIndex
    };
  }

  clean(content) {
    // 注意：不删除标签，因为标签需要保留给结构解析与渲染模块处理
    return content;
  }

  getStyles() {
    return `
.author { color: #1565c0; font-weight: 600; }
    `.trim();
  }
}

module.exports = AuthorHandler;
```

### 步骤 2：自动注册

处理器文件创建后会自动被 `index.js` 发现并注册，无需手动配置。

### 步骤 3：判断是否需要在 MetaCollector 中添加收集逻辑

**如果新标签是以下类型，无需添加收集逻辑**（已内置支持）：

| 标签类型 | 说明 |
|----------|------|
| `tag` | 标签分类 |
| `from` | 来源链接 |
| `fromstr` | 来源名称 |
| `intro` | 章节简介 |
| `icon` | 章节图标 |
| `sum` | 摘要 |
| `think` | 思考 |

**如果新标签是自定义类型**，需要在 `MetaCollector.js` 的 `collect()` 方法中添加收集逻辑：

### 步骤 4：在 MetaCollector 中添加收集逻辑

```javascript
case 'author':
  if (inArticles) {
    if (!this.currentArticleMeta) {
      this.currentArticleMeta = {
        from: null,
        fromStr: null,
        tags: [],
        isFirstArticle: false
      };
    }
    this.currentArticleMeta.author = value;
  } else if (inSection) {
    this.currentMeta.author = value;
  } else if (inHeadline) {
    this.headAuthor = value;
  }
  break;
```

### 步骤 5：更新 getResult() 方法

在 `MetaCollector.js` 的 `getResult()` 方法中添加返回字段：

```javascript
return {
  // ... 其他字段
  headAuthor: this.headAuthor,
  // ...
};
```

### 步骤 6：更新结构映射与净化模块

如果新字段需要在 `sections` 或 `articles` 中访问：

1. 在 `src/parser/stateMachine.js` 的 `createSectionNode()` 或 `createArticleNode()` 中添加字段映射
2. 在 `src/parser/sanitizers.js` 的 `sanitizeStructuredMeta()` 中添加安全处理（如果需要）

---

## 标签作用域

标签可以在不同上下文中使用，系统会自动识别：

| 作用域 | 状态条件 | 数据收集位置 |
|--------|----------|--------------|
| **headline** | `!inSection && !inArticles` | `headlineSum`, `headlineThink`, `headlineTags` |
| **section** | `inSection && !inArticles` | `currentMeta.sum`, `currentMeta.thinks` |
| **article** | `inSection && inArticles` | `currentArticleMeta.sum`, `currentArticleMeta.thinks` |

状态由 `MetaCollector` 跟踪，通过 `context.state` 访问。

---

## 状态机

`MetaCollector` 管理文档解析状态，分为公共状态和内部状态。

### 公共状态 (`state` 对象)

```javascript
this.state = {
  inHeadline: true,      // 是否在头版区域
  inSection: false,      // 是否在章节区域
  inArticles: false,     // 是否在文章区域
  sectionIndex: -1,      // 当前章节索引
  articleIndex: 0,       // 当前文章索引
  hasHeadMarker: false,  // 是否有 [head]: 标记
};
```

状态变化由标记标签触发：
- `[head]:` → `hasHeadMarker = true`
- `[section]:` → `inSection = true`, `sectionIndex++`
- `[articles]:` → `inArticles = true`

标题也会触发状态变化：
- `# 标题`（在头版后）→ `inHeadline = false`
- `# 标题`（在章节中）→ 保存当前文章，开始新章节
- `## 标题`（在文章中）→ 保存当前文章，开始新文章

### 内部状态（不直接暴露）

除了 `state` 对象外，`MetaCollector` 还维护以下内部状态：

| 状态 | 类型 | 描述 |
|------|------|------|
| `currentMeta` | Object | 当前章节的元数据 |
| `currentArticleMeta` | Object | 当前文章的元数据 |
| `sectionArticleMeta` | Array | 所有章节/文章元数据数组 |
| `headlineTags` | Array | 头版区域的标签 |
| `headFrom` | String | 头版区域的来源 URL |
| `headlineSum` | String | 头版区域的摘要 |
| `headlineThink` | String | 头版区域的思考 |
| `currentDataBlockPosition` | String | 当前数据块位置（headline/section/article） |
| `headlineDataBlocks` | Array | 头版数据块 |
| `sectionDataBlocks` | Array | 章节数据块 |
| `articleDataBlocks` | Array | 文章数据块 |
| `weather` | Array | 天气数据数组 |
| `quoteBlocks` | Array | 引用块数组 |

---

## 视图层使用

### 访问 customTags

```ejs
<% if (customTags.headlineTags) { %>
<div class="tags">
  <% customTags.headlineTags.forEach(tag => { %>
  <span class="tag"><%= tag %></span>
  <% }); %>
</div>
<% } %>
```

### 访问 section/article 元数据

```ejs
<% sections.forEach(section => { %>
<div class="section">
  <h3><%= section.title %></h3>
  <p><%= section.intro %></p>
  
  <% section.articles.forEach(article => { %>
  <div class="article">
    <h4><%= article.title %></h4>
    <% if (article.from) { %>
    <a href="<%= article.from %>">来源</a>
    <% } %>
    <% if (article.sum) { %>
    <div class="article-sum"><%= article.sum %></div>
    <% } %>
  </div>
  <% }); %>
  
  <% if (section.summary) { %>
  <div class="section-summary"><%= section.summary %></div>
  <% } %>
</div>
<% }); %>
```

---

## 测试

为新增的标签创建测试文件 `tests/tags/AuthorHandler.test.js`：

```javascript
const AuthorHandler = require('../../src/parser/tags/handlers/inline/AuthorHandler');
const MetaCollector = require('../../src/parser/tags/MetaCollector');

describe('AuthorHandler', () => {
  let handler;
  let collector;
  let context;

  beforeEach(() => {
    handler = new AuthorHandler();
    collector = new MetaCollector();
    context = { collector, state: {} };
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('author');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse author syntax', () => {
    const line = '[author:张三]: #';
    const result = handler.parseLine(line, context, 0);
    expect(result).toBeTruthy();
    expect(result.value).toBe('张三');
  });

  test('should collect author in section context', () => {
    collector.onMarker('section');
    const line = '[author:张三]: #';
    handler.parseLine(line, context, 0);
    const meta = collector.getResult();
    expect(meta.sectionArticleMeta[0].author).toBe('张三');
  });

  test('should clean without removing tags', () => {
    // 注意：clean() 不删除标签，因为标签需要保留给结构解析与渲染模块处理
    const content = '[author:张三]: #\n其他内容';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe(content);
  });
});
```

运行测试：
```bash
npm test -- AuthorHandler
```

---

## 样式

处理器可以通过 `getStyles()` 方法返回 CSS 样式：

```javascript
getStyles() {
  return `
.author { color: #1565c0; font-weight: 600; }
  `.trim();
}
```

样式会自动被 `TagRegistry.collectStyles()` 收集，并通过 `getStylesHTML()` 注入到页面的 `<style>` 标签中。

### 暗黑模式适配规范

新增标签样式时，请同步遵守：

1. `getStyles()` 中优先使用语义变量（如 `var(--text-dark)`、`var(--text-muted)`、`var(--accent-*)`）。
2. 如果使用固定浅色背景（如 `#fff` 或浅色渐变），必须在 `public/css/dark-mode.css` 添加对应类覆盖。
3. 类名保持稳定（例如 `.analysis-box`），避免后续 dark 覆盖失效。
4. 提交前至少手动验证一次浅色/暗黑两种模式。

完整规范见 [`docs/theme-dev-guide.md`](theme-dev-guide.md)。

---

## 完整示例

查看现有处理器作为参考：

| 文件 | 类型 | 描述 |
|------|------|------|
| [`TagHandler.js`](src/parser/tags/handlers/inline/TagHandler.js) | inline | 简单的行内标签 |
| [`FromHandler.js`](src/parser/tags/handlers/inline/FromHandler.js) | inline | 带 URL 的标签 |
| [`SumHandler.js`](src/parser/tags/handlers/inline/SumHandler.js) | inline | 行内总结标签 |
| [`SumBlockHandler.js`](src/parser/tags/handlers/block/SumBlockHandler.js) | block | 块级总结标签 |
| [`DataHandler.js`](src/parser/tags/handlers/block/DataHandler.js) | block | 复杂的数据块 |
| [`QuoteHandler.js`](src/parser/tags/handlers/block/QuoteHandler.js) | block | 引用块处理 |
| [`SectionHandler.js`](src/parser/tags/handlers/marker/SectionHandler.js) | marker | 章节标记 |
