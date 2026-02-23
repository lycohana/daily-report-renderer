# 自定义标签系统重构方案

## 1. 当前问题分析

### 1.1 代码现状

现有 [`src/parser/customTags.js`](src/parser/customTags.js) 约 400 行代码，存在以下问题：

| 问题 | 描述 | 影响 |
|------|------|------|
| **逻辑混杂** | 清理、提取、状态跟踪、数据块解析全混在一起 | 难以理解和维护 |
| **重复代码** | 同一标签的正则匹配在不同位置重复出现 | 修改时易遗漏 |
| **扩展困难** | 新增标签需修改 3+ 处（清理/提取/状态处理） | 开发体验差 |
| **区块标签硬编码** | `<data>` 等区块标签缺乏统一架构 | 新增区块标签成本高 |

### 1.2 当前代码结构问题

```javascript
// 问题1: 清理逻辑散落各处
cleanContent = cleanContent.replace(/^\[tag:[^\]]+\]:.*$/gm, '');
cleanContent = cleanContent.replace(/^\[head\]:.*$/gm, '');
cleanContent = cleanContent.replace(/^\[from:[^\]]+\]:.*$/gm, '');
// ... 10+ 行类似代码

// 问题2: 提取逻辑分散
const tagRegex = /\[tag:([^\]]+)\]/g;
const fromRegex = /\[from:([^\]]+)\]/g;
// ... 又是一堆正则

// 问题3: 状态机混杂
let inHeadline = true;
let inSection = false;
let inArticles = false;
// ... 多个状态变量难以追踪
```

---

## 2. 架构设计方案

### 2.1 核心思想

采用 **标签注册表 + 插件式处理器** 架构，将标签的定义、解析、清理逻辑集中管理，通过配置文件即可新增标签。

### 2.2 目录结构

```
src/parser/
├── config.js                # markdown-it 配置（保持不变）
├── customTags.js           # 主入口（简化后）
├── tags/                   # 新增：标签处理器目录
│   ├── index.js            # 标签注册表
│   ├── definitions.js      # 标签定义配置
│   ├── handlers/           # 处理器实现
│   │   ├── inline.js       # 行内标签处理器
│   │   ├── block.js        # 区块标签处理器
│   │   └── marker.js       # 标记标签处理器
│   └── processors/         # 具体标签处理器
│       ├── tagHandler.js   # [tag:xxx]
Handler.js  #│       ├── from [from:xxx]
│       ├── iconHandler.js  # [icon:xxx]
│       ├── dataHandler.js  # <data></data>
│       └── quoteHandler.js # 引用块 >
│   └── utils.js            # 工具函数
├── frontMatter.js          # 保持不变
└── utils.js                # 保持不变
```

---

## 3. 标签分类体系

### 3.1 三种标签类型

| 类型 | 语法示例 | 特点 | 处理器 |
|------|----------|------|--------|
| **行内标签** | `[tag:AI]`, `[icon:🤖]` | 单行，有参数 | `InlineHandler` |
| **标记标签** | `[section]:`, `[head]:` | 无参数，触发状态变化 | `MarkerHandler` |
| **区块标签** | `<data>...</data>` | 可跨多行 | `BlockHandler` |

### 3.2 标签作用域

标签可能作用于不同的文档区域：

| 作用域 | 说明 | 示例 |
|--------|------|------|
| `headline` | 头版头条区域 | `[tag:AI]` |
| `section` | 章节区域 | `[intro:章节简介]` |
| `article` | 文章区域 | `[from:URL]` |
| `global` | 全局通用 | `[think:思考]` |

---

## 4. 核心接口设计

### 4.1 标签定义配置 (definitions.js)

```javascript
// 标签定义配置文件 - 新增标签只需修改这里
module.exports = [
  // ========== 行内标签 ==========
  {
    name: 'tag',
    type: 'inline',
    syntax: /^\[tag:([^\]]+)\]:\s*#\s*$/,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,  // 允许重复
    extract: (match, context) => ({ value: match[1] }),
    clean: (match) => match[0],
  },
  {
    name: 'from',
    type: 'inline',
    syntax: /^\[from:([^\]]+)\]:\s*#\s*$/,
    scope: ['section', 'article'],
    maxOccurrences: 1,
    extract: (match, context) => ({ value: match[1] }),
    clean: (match) => match[0],
  },
  {
    name: 'icon',
    type: 'inline',
    syntax: /^\[icon:([^\]]+)\]:\s*#\s*$/,
    scope: ['section'],
    maxOccurrences: 1,
    extract: (match, context) => {
      // 提取第一个 emoji
      const emojiMatch = match[1].match(/[\p{Emoji_Presentation}]/u);
      return { value: emojiMatch ? emojiMatch[0] : match[1] };
    },
    clean: (match) => match[0],
  },

  // ========== 标记标签 ==========
  {
    name: 'head',
    type: 'marker',
    syntax: /^\[head\]:\s*#\s*$/,
    scope: ['headline'],
    maxOccurrences: 1,
    onMatch: (context) => {
      context.state.headline = true;
    },
    clean: (match) => match[0],
  },
  {
    name: 'section',
    type: 'marker',
    syntax: /^\[section\]:\s*#\s*$/,
    scope: ['global'],
    maxOccurrences: Infinity,
    onMatch: (context) => {
      context.state.inSection = true;
      context.state.sectionIndex++;
    },
    clean: (match) => match[0],
  },
  {
    name: 'articles',
    type: 'marker',
    syntax: /^\[articles\]:\s*#\s*$/,
    scope: ['section'],
    maxOccurrences: 1,
    onMatch: (context) => {
      context.state.inArticles = true;
    },
    clean: (match) => match[0],
  },

  // ========== 区块标签 ==========
  {
    name: 'data',
    type: 'block',
    syntax: /<data>([\s\S]*?)<\/data>/,
    scope: ['headline', 'section', 'article'],
    maxOccurrences: Infinity,
    extract: (match, context) => {
      const items = [];
      const regex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
      let m;
      while ((m = regex.exec(match[1])) !== null) {
        items.push({ value: m[1], label: m[2] });
      }
      return items.length > 0 ? items : null;
    },
    // 区块标签保留在内容中，由渲染器处理
    clean: null,
  },
];
```

### 4.2 处理器基类

```javascript
// handlers/baseHandler.js
class BaseHandler {
  constructor(definition, registry) {
    this.definition = definition;
    this.registry = registry;
    this.name = definition.name;
  }

  // 解析标签
  parse(content, context) {
    throw new Error('Not implemented');
  }

  // 清理标签
  clean(content) {
    return content;
  }

  // 验证作用域
  canApply(scope) {
    return this.definition.scope.includes(scope) ||
           this.definition.scope.includes('global');
  }
}
```

### 4.3 行内标签处理器

```javascript
// handlers/inlineHandler.js
const BaseHandler = require('./baseHandler');

class InlineHandler extends BaseHandler {
  parse(content, context) {
    const regex = new RegExp(this.definition.syntax.source, 'gm');
    const results = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const extracted = this.definition.extract(match, context);
      if (extracted) {
        results.push({
          name: this.name,
          value: extracted.value || extracted,
          match: match[0],
          index: match.index,
        });
      }
    }

    return results;
  }

  clean(content) {
    if (!this.definition.clean) return content;
    const regex = new RegExp(this.definition.syntax.source, 'gm');
    return content.replace(regex, '');
  }
}
```

### 4.4 区块标签处理器

```javascript
// handlers/blockHandler.js
const BaseHandler = require('./baseHandler');

class BlockHandler extends BaseHandler {
  parse(content, context) {
    const results = [];
    let match;
    const regex = new RegExp(this.definition.syntax.source, 'gm');

    while ((match = regex.exec(content)) !== null) {
      const extracted = this.definition.extract(match, context);
      if (extracted) {
        results.push({
          name: this.name,
          data: extracted,
          match: match[0],
          index: match.index,
        });
      }
    }

    return results;
  }

  // 区块标签通常保留在内容中，由渲染器处理
  clean(content) {
    return content; // 不清理，保留原样
  }
}
```

### 4.5 标签注册表

```javascript
// tags/index.js
const definitions = require('./definitions');
const InlineHandler = require('./handlers/inlineHandler');
const MarkerHandler = require('./handlers/markerHandler');
const BlockHandler = require('./handlers/blockHandler');

class TagRegistry {
  constructor() {
    this.handlers = new Map();
    this.initialize();
  }

  initialize() {
    for (const def of definitions) {
      let HandlerClass;
      switch (def.type) {
        case 'inline':
          HandlerClass = InlineHandler;
          break;
        case 'marker':
          HandlerClass = MarkerHandler;
          break;
        case 'block':
          HandlerClass = BlockHandler;
          break;
        default:
          throw new Error(`Unknown handler type: ${def.type}`);
      }
      this.handlers.set(def.name, new HandlerClass(def, this));
    }
  }

  getHandler(name) {
    return this.handlers.get(name);
  }

  getAllHandlers() {
    return Array.from(this.handlers.values());
  }

  // 解析所有标签
  parse(content, context = {}) {
    context = {
      state: {
        inHeadline: true,
        inSection: false,
        inArticles: false,
        sectionIndex: -1,
        articleIndex: 0,
      },
      results: {
        tags: {},
        markers: {},
        blocks: {},
      },
      ...context,
    };

    for (const handler of this.handlers) {
      const results = handler.parse(content, context);
      if (results.length > 0) {
        context.results[handler.name] = results;
      }
    }

    return context.results;
  }

  // 清理内容中的标签
  clean(content) {
    for (const handler of this.handlers) {
      content = handler.clean(content);
    }
    return content;
  }
}

module.exports = new TagRegistry();
```

---

## 5. 使用示例

### 5.1 新增一个行内标签

假设要新增 `[author:张三]: #` 标签，只需在 `definitions.js` 添加：

```javascript
{
  name: 'author',
  type: 'inline',
  syntax: /^\[author:([^\]]+)\]:\s*#\s*$/,
  scope: ['article'],
  maxOccurrences: 1,
  extract: (match) => ({ value: match[1] }),
  clean: (match) => match[0],
},
```

**无需修改任何其他文件！**

### 5.2 新增一个区块标签

假设要新增 `<tip>提示内容</tip>` 标签：

```javascript
{
  name: 'tip',
  type: 'block',
  syntax: /<tip>([\s\S]*?)<\/tip>/,
  scope: ['article'],
  maxOccurrences: Infinity,
  extract: (match) => ({ content: match[1].trim() }),
  clean: null, // 保留在内容中
},
```

### 5.3 视图层使用

```ejs
<!-- 视图模板中使用 -->
<% if (customTags.author && customTags.author.length > 0) { %>
<div class="article-author">作者：<%= customTags.author[0].value %></div>
<% } %>

<% if (customTags.tip && customTips.length > 0) { %>
<div class="tip-box">
  <% customTags.tip.forEach(tip => { %>
  <div class="tip-content"><%= tip.data.content %></div>
  <% }); %>
</div>
<% } %>
```

---

## 6. 向后兼容性

### 6.1 现有标签迁移

所有现有标签都已迁移到新架构：

| 原标签 | 新定义位置 | 状态 |
|--------|------------|------|
| `[tag:xxx]` | definitions.js | ✅ 已迁移 |
| `[from:xxx]` | definitions.js | ✅ 已迁移 |
| `[section]:` | definitions.js | ✅ 已迁移 |
| `<data>...</data>` | definitions.js | ✅ 已迁移 |

### 6.2 API 保持不变

```javascript
// 现有调用方式完全兼容
const { extractCustomTags } = require('./customTags');
// 返回结果格式保持一致
```

---

## 7. 实施计划

### 7.1 阶段划分

| 阶段 | 任务 | 预估工作量 |
|------|------|------------|
| Phase 1 | 创建 `tags/` 目录结构 | 0.5h |
| Phase 2 | 实现处理器基类和三种处理器 | 1h |
| Phase 3 | 迁移现有标签到 definitions.js | 1h |
| Phase 4 | 重构 customTags.js 使用新架构 | 1h |
| Phase 5 | 添加单元测试 | 0.5h |
| **总计** | | **4h** |

### 7.2 风险控制

1. **渐进式迁移** - 保持原有逻辑，新架构仅作为内部实现
2. **测试覆盖** - 确保现有功能完全兼容
3. **回滚方案** - 如有问题可快速回退到原逻辑

---

## 8. 总结

通过引入**标签注册表**和**插件式处理器**架构：

1. ✅ **代码清晰** - 标签定义与处理逻辑分离
2. ✅ **易于扩展** - 新增标签只需修改配置文件
3. ✅ **减少重复** - 通用逻辑封装在处理器基类
4. ✅ **统一架构** - 行内/标记/区块标签各有明确处理模式

开发者新增标签时，只需在 `definitions.js` 中添加几行配置，无需接触任何处理逻辑代码。
