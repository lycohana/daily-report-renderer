# 自定义标签开发指南

本文档说明如何在日报系统中新增自定义标签。

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

  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(this.syntax);

      if (match) {
        results.push({
          name: this.name,
          value: match[1],
          lineIndex: i,
        });

        if (context?.collector) {
          context.collector.collect('author', match[1], context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
  }
}

module.exports = AuthorHandler;
```

然后在视图中使用：

**注意**：新标签字段需要在 `MetaCollector.js` 的 `collect()` 方法中收集，并在 `getResult()` 方法中返回。如果需要在 `sections` 或 `articles` 中访问，还需要在 `markdownParser.js` 中映射字段。

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
├── BaseHandler.js          # 基础处理器类
├── MetaCollector.js        # 元数据收集器（状态机）
├── index.js               # 标签注册表（自动发现）
└── handlers/              # 标签处理器目录
    ├── inline/            # 行内标签处理器
    │   ├── TagHandler.js      # [tag:] 标签
    │   ├── FromHandler.js     # [from:] 标签
    │   ├── FromstrHandler.js  # [fromstr:] 标签
    │   ├── IconHandler.js     # [icon:] 标签
    │   ├── IntroHandler.js    # [intro:] 标签
    │   ├── SumHandler.js      # [sum:] 标签
    │   └── ThinkHandler.js    # [think:] 标签
    ├── marker/            # 标记标签处理器
    │   ├── HeadHandler.js     # [head]: 标记
    │   ├── SectionHandler.js  # [section]: 标记
    │   └── ArticlesHandler.js # [articles]: 标记
    └── block/             # 区块标签处理器
        ├── DataHandler.js     # [data:] 数据块
        ├── QuoteHandler.js    # > 引用块
        └── WeatherHandler.js  # <weather> 天气块
```

### 核心组件

1. **BaseHandler** - 所有处理器的基类
2. **MetaCollector** - 状态机和元数据收集器
3. **TagRegistry** - 自动发现和注册处理器
4. **Handler Classes** - 每个标签一个处理器类

---

## 标签类型

### 1. 行内标签 (inline)

**语法**: `[标签名：参数]: #`

**特点**: 单行定义，可重复使用

**示例**:
```markdown
[tag:AI]: #
[from:https://example.com]: #
[icon:🤖]: #
```

**处理器示例**: `TagHandler.js`, `FromHandler.js`

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

### 3. 区块标签 (block)

**语法**: `<标签名>内容</标签名>` 或 `> 引用块`

**特点**: 可跨多行，包含复杂内容

**示例**:
```markdown
<data>
<num>98.7%</num><str>完成率</str>
</data>

> **引用：** 引用内容
```

**处理器示例**: `DataHandler.js`, `QuoteHandler.js`, `WeatherHandler.js`

---

## Sum 和 Think 标签

系统支持两种类型的 sum（总结）和 think（思考）标签：

### 行内标签（章节级别）

**语法**: `[sum:xxx]: #` / `[think:xxx]: #`

**作用域**: 章节级别

**渲染位置**: 章节末尾

**示例**:
```markdown
[section]: #
[intro:AI 热点深度分析]: #
[icon:🤖]: #
# AI 热点深度分析
[articles]: #
## 文章 1
文章内容...
## 文章 2
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
│  文章 2 标题                          │
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

**渲染位置**: 标签所在位置

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

### 处理器接口约定（当前）

- `inline` / `marker` 处理器：实现 `parseLine(line, context, lineIndex)`。
- `block` 处理器：实现 `parseDocument(content, context)`。
- `BaseHandler.parse()` 为兼容入口，会根据 `getType()` 自动分发到对应方法。
- 清理逻辑仍通过 `clean(content)` 完成。

### 步骤 1：创建处理器文件

在 `src/parser/tags/handlers/` 目录下创建新文件，例如 `AuthorHandler.js`：

```javascript
const BaseHandler = require('../BaseHandler');

class AuthorHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /^\[author:([^\]]+)\]:\s*#\s*$/;
  }

  getType() {
    return 'inline';
  }

  parse(content, context) {
    const results = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(this.syntax);

      if (match) {
        results.push({
          name: this.name,
          value: match[1],
          lineIndex: i,
        });

        // 如果需要收集到元数据
        if (context?.collector) {
          context.collector.collect('author', match[1], context.state);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content.replace(this.syntax, '');
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

### 步骤 3：在 MetaCollector 中添加收集逻辑（可选）

如果标签需要收集到元数据中，在 `MetaCollector.js` 的 `collect()` 方法中添加：

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

### 步骤 4：更新 getResult() 方法（如果需要）

在 `MetaCollector.js` 的 `getResult()` 方法中添加返回字段：

```javascript
return {
  // ... 其他字段
  headAuthor: this.headAuthor, // 添加这一行
};
```

### 步骤 5：更新 markdownParser.js（如果需要）

如果新字段需要在 `sections` 或 `articles` 中访问，在 `markdownParser.js` 的 `parseMarkdown()` 函数中，将新字段从 `sectionArticleMeta` 映射到返回的 section/article 对象中。

---

## 标签作用域

标签可以在不同上下文中使用，系统会自动识别：

- **headline** - 头版头条区域
- **section** - 章节区域
- **article** - 文章区域

状态由 `MetaCollector` 跟踪，通过 `context.state` 访问。

---

## 状态机

`MetaCollector` 管理文档解析状态：

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
- `[head]:` → `inHeadline = true`
- `[section]:` → `inSection = true`, `sectionIndex++`
- `[articles]:` → `inArticles = true`

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
  </div>
  <% }); %>
</div>
<% }); %>
```

---

## 测试

为新增的标签创建测试文件 `tests/tags/AuthorHandler.test.js`：

```javascript
const AuthorHandler = require('../../src/parser/tags/handlers/inline/AuthorHandler');

describe('AuthorHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new AuthorHandler();
  });

  test('should have correct name', () => {
    expect(handler.name).toBe('author');
  });

  test('should return inline type', () => {
    expect(handler.getType()).toBe('inline');
  });

  test('should parse author syntax', () => {
    const content = '[author:张三]: #';
    const results = handler.parse(content, {});
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('张三');
  });

  test('should clean author syntax', () => {
    const content = '[author:张三]: #\n其他内容';
    const cleaned = handler.clean(content);
    expect(cleaned).toBe('\n其他内容');
  });
});
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

样式会自动被收集并注入到页面的 `<style>` 标签中。

---

## 完整示例

查看现有处理器作为参考：
- [`TagHandler.js`](src/parser/tags/handlers/inline/TagHandler.js) - 简单的行内标签
- [`FromHandler.js`](src/parser/tags/handlers/inline/FromHandler.js) - 带 URL 的标签
- [`DataHandler.js`](src/parser/tags/handlers/block/DataHandler.js) - 复杂的区块标签
- [`QuoteHandler.js`](src/parser/tags/handlers/block/QuoteHandler.js) - 引用块处理
