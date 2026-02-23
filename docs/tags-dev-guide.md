# 自定义标签开发指南

本文档说明如何在日报系统中新增自定义标签。

## 目录

- [快速开始](#快速开始)
- [标签类型](#标签类型)
- [新增行内标签](#新增行内标签)
- [新增标记标签](#新增标记标签)
- [新增区块标签](#新增区块标签)
- [标签作用域](#标签作用域)
- [视图层使用](#视图层使用)

---

## 快速开始

新增一个自定义标签只需两步：

1. 在 [`src/parser/tags/definitions.js`](src/parser/tags/definitions.js) 中添加标签定义
2. 在视图模板中使用提取的数据

示例：新增 `[author:张三]: #` 标签

```javascript
// src/parser/tags/definitions.js
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

然后在视图中使用：

```ejs
<% if (customTags.author && customTags.author.length > 0) { %>
<div class="article-author">作者：<%= customTags.author[0].value %></div>
<% } %>
```

---

## 标签类型

系统支持三种标签类型：

### 1. 行内标签 (inline)

**语法**: `[标签名:参数]: #`

**特点**: 单行定义，可重复使用

**示例**:
```markdown
[tag:AI]: #
[from:https://example.com]: #
[icon:🤖]: #
```

**处理器**: [`inlineHandler.js`](src/parser/tags/handlers/inlineHandler.js)

### 2. 标记标签 (marker)

**语法**: `[标签名]: #`

**特点**: 触发状态变化，无参数

**示例**:
```markdown
[section]: #
[head]: #
[articles]: #
```

**处理器**: [`markerHandler.js`](src/parser/tags/handlers/markerHandler.js)

### 3. 区块标签 (block)

**语法**: `<标签名>内容</标签名>`

**特点**: 可跨多行，包含复杂内容

**示例**:
```markdown
<data>
<num>98.7%</num><str>完成率</str>
</data>

<tip>这是提示内容</tip>
```

**处理器**: [`blockHandler.js`](src/parser/tags/handlers/blockHandler.js)

---

## 新增行内标签

行内标签用于定义带参数的简单元数据。

### 步骤 1: 在 definitions.js 中添加定义

打开 [`src/parser/tags/definitions.js`](src/parser/tags/definitions.js)，在任意位置添加：

```javascript
{
  name: 'author',           // 标签名称（唯一标识）
  type: 'inline',           // 标签类型
  syntax: /^\[author:([^\]]+)\]:\s*#\s*$/,  // 正则匹配语法
  scope: ['article'],       // 有效作用域
  maxOccurrences: 1,        // 最大出现次数
  extract: (match, context) => ({ value: match[1] }),  // 提取逻辑
  clean: (match) => match[0],  // 清理逻辑（从内容中移除）
},
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 标签唯一标识 |
| `type` | string | ✅ | `inline` / `marker` / `block` |
| `syntax` | RegExp | ✅ | 匹配标签的正则表达式 |
| `scope` | string[] | ✅ | 有效作用域 |
| `maxOccurrences` | number | ❌ | 最大出现次数，默认 Infinity |
| `extract` | function | ❌ | 提取数据的函数（block/inline 需要） |
| `onMatch` | function | ❌ | 匹配时触发的回调（marker 需要） |
| `clean` | function | ❌ | 清理函数，返回空字符串则从内容中移除 |

### 步骤 2: 在视图中使用

```ejs
<!-- 简单值 -->
<%= customTags.author[0].value %>

<!-- 循环遍历多个值 -->
<% customTags.tag.forEach(t => { %>
  <span class="tag"><%= t.value %></span>
<% }); %>
```

### 完整示例：新增来源标签

```javascript
// 定义
{
  name: 'source',
  type: 'inline',
  syntax: /^\[source:([^\]]+)\]:\s*#\s*$/,
  scope: ['article'],
  maxOccurrences: 1,
  extract: (match) => ({ 
    name: match[1],
    url: null  // 可扩展
  }),
  clean: (match) => match[0],
},
```

```ejs
<!-- 使用 -->
<% if (customTags.source && customTags.source.length > 0) { %>
<div class="article-source">来源：<%= customTags.source[0].value %></div>
<% } %>
```

---

## 新增标记标签

标记标签用于触发状态变化，不提取数据。

### 步骤 1: 添加定义

```javascript
{
  name: 'featured',        // 标签名称
  type: 'marker',          // 标记类型
  syntax: /^\[featured\]:\s*#\s*$/,
  scope: ['section'],       // 有效作用域
  maxOccurrences: 1,
  onMatch: (context) => {
    // 触发状态变化
    context.state.isFeatured = true;
  },
  clean: (match) => match[0],
},
```

### 步骤 2: 在视图中使用

标记标签会修改 `context.state`，可在解析后访问：

```javascript
// 在 routes.js 中
const parsed = markdownParser.parseMarkdown(content);
// parsed.context.state.isFeatured 可用
```

```ejs
<!-- 使用状态 -->
<% if (typeof context !== 'undefined' && context.state && context.state.isFeatured) { %>
<div class="featured-badge">精选</div>
<% } %>
```

---

## 新增区块标签

区块标签用于处理包含复杂内容的标签，如数据块、提示框等。

### 步骤 1: 添加定义

```javascript
{
  name: 'tip',             // 标签名称
  type: 'block',           // 区块类型
  syntax: /<tip>([\s\S]*?)<\/tip>/,
  scope: ['article', 'section'],
  maxOccurrences: Infinity,
  extract: (match) => ({
    content: match[1].trim()
  }),
  // 设为 null 表示保留在内容中，由渲染器处理
  clean: null,
},
```

### 步骤 2: 在视图中使用

```ejs
<% if (customTags.tip && customTags.tip.length > 0) { %>
<div class="tip-box">
  <% customTags.tip.forEach(tip => { %>
  <div class="tip-content"><%- md.render(tip.data.content) %></div>
  <% }); %>
</div>
<% } %>
```

### 完整示例：新增统计卡片区块

```javascript
// 定义
{
  name: 'stat',
  type: 'block',
  syntax: /<stat>([\s\S]*?)<\/stat>/,
  scope: ['article'],
  maxOccurrences: Infinity,
  extract: (match) => {
    // 解析 <num>value</num><label>text</label> 格式
    const items = [];
    const regex = /<num>([^<]+)<\/num>\s*<label>([^<]+)<\/label>/g;
    let m;
    while ((m = regex.exec(match[1])) !== null) {
      items.push({ value: m[1], label: m[2] });
    }
    return items.length > 0 ? items : null;
  },
  clean: null,
},
```

```markdown
<!-- 使用 -->
<stat>
<num>98.7%</num><label>完成率</label>
<num>100万</num><label>Token</label>
</stat>
```

```ejs
<!-- 渲染 -->
<div class="stat-grid">
  <% customTags.stat.forEach(stat => { %>
    <% stat.data.forEach(item => { %>
    <div class="stat-card">
      <div class="stat-value"><%= item.value %></div>
      <div class="stat-label"><%= item.label %></div>
    </div>
    <% }); %>
  <% }); %>
</div>
```

### 完整示例：新增天气卡片区块

```javascript
// 定义
{
  name: 'weather',
  type: 'block',
  syntax: /<weather>([\s\S]*?)<\/weather>/g,
  scope: ['headline', 'section', 'article'],
  maxOccurrences: Infinity,
  extract: (match) => {
    const dayRegex = /<day>([^<]+)<\/day>/g;
    const items = [];
    let m;
    while ((m = dayRegex.exec(match[1])) !== null) {
      const parts = m[1].split('|');
      if (parts.length >= 5) {
        items.push({
          day: parts[0].trim(),
          city: parts[1].trim(),
          icon: parts[2].trim(),
          condition: parts[3].trim(),
          temp: parts[4].trim()
        });
      }
    }
    return items.length > 0 ? items : null;
  },
  clean: null,
},
```

```markdown
<!-- 使用 -->
<weather>
<day>周一|东莞|☀️|晴|26°C/17°C</day>
<day>周二|东莞|⛅|多云|25°C/16°C</day>
<day>周三|深圳|🌧️|雨|24°C/15°C</day>
</weather>
```

```ejs
<!-- CSS 样式 -->
<style>
.weather-grid{display:flex;gap:12px;flex-wrap:wrap;padding:16px;background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:12px;margin:16px 0}
.weather-item{flex:1;min-width:100px;max-width:150px;background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.weather-icon{font-size:2rem;margin-bottom:4px}
.weather-city{font-weight:600;color:#1565c0;font-size:.9rem}
.weather-condition{color:#757575;font-size:.85rem}
.weather-temp{color:#424242;font-size:.85rem;margin-top:4px}
.weather-day{font-size:.75rem;color:#9e9e9e;margin-top:8px;padding-top:8px;border-top:1px dashed #e0e0e0}
</style>

<!-- 渲染 -->
<% if (customTags.weather) { %>
<div class="weather-grid">
  <% customTags.weather.forEach(w => { %>
    <% w.data.forEach(day => { %>
    <div class="weather-item">
      <div class="weather-icon"><%= day.icon %></div>
      <div class="weather-city"><%= day.city %></div>
      <div class="weather-condition"><%= day.condition %></div>
      <div class="weather-temp"><%= day.temp %></div>
      <div class="weather-day"><%= day.day %></div>
    </div>
    <% }); %>
  <% }); %>
</div>
<% } %>
```

---

## 标签作用域

标签可以限定在特定区域生效：

| 作用域 | 说明 | 示例 |
|--------|------|------|
| `headline` | 头版头条区域 | `[tag:AI]` |
| `section` | 章节区域 | `[intro:简介]`, `[icon:🤖]` |
| `article` | 文章区域 | `[from:URL]`, `[tag:标签]` |
| `global` | 全局任意位置 | `[think:思考]` |

### 多作用域

一个标签可以支持多个作用域：

```javascript
{
  name: 'label',
  type: 'inline',
  syntax: /^\[label:([^\]]+)\]:\s*#\s*$/,
  scope: ['headline', 'section', 'article'],
  // ...
}
```

### 作用域判断

在 `extract` 函数中可以通过 `context.state` 判断当前处理区域：

```javascript
extract: (match, context) => {
  if (context.state.inHeadline) {
    // 处理头版头条区域
  } else if (context.state.inSection && context.state.inArticles) {
    // 处理文章区域
  }
  return { value: match[1] };
}
```

---

## 视图层使用

### 访问标签数据

```ejs
<!-- 检查是否存在 -->
<% if (customTags.标签名 && customTags.标签名.length > 0) { %>
  <!-- 访问第一个值 -->
  <%= customTags.标签名[0].value %>
  
  <!-- 遍历所有值 -->
  <% customTags.标签名.forEach(item => { %>
    <span><%= item.value %></span>
  <% }); %>
<% } %>
```

### 数据结构

不同类型标签返回的数据结构：

```javascript
// 行内标签 - extract 返回对象
customTags.tag = [
  { name: 'tag', value: 'AI', match: '[tag:AI]: #', index: 0 },
  { name: 'tag', value: 'OpenAI', match: '[tag:OpenAI]: #', index: 20 }
];

// 标记标签 - 通过 onMatch 修改 context.state
// 在 context.state 中访问

// 区块标签 - extract 返回数组
customTags.data = [
  { 
    name: 'data', 
    data: [
      { value: '98.7%', label: '完成率' },
      { value: '100万', label: 'Token' }
    ],
    match: '<data>...</data>',
    index: 100
  }
];
```

### 常用视图模式

```ejs
<!-- 标签列表 -->
<% if (customTags.tag) { %>
<div class="tags">
  <% customTags.tag.forEach(t => { %>
  <span class="tag"><%= t.value %></span>
  <% }); %>
</div>
<% } %>

<!-- 来源链接 -->
<% if (customTags.from && customTags.from.length > 0) { %>
<a href="<%= customTags.from[0].value %>" target="_blank">来源链接</a>
<% } %>

<!-- 带名称的来源 -->
<% if (customTags.fromstr) { %>
<span>来源：<%= customTags.fromstr[0].value %></span>
<% } %>

<!-- 数据块 -->
<% if (customTags.data && customTags.data.length > 0) { %>
<div class="stats">
  <% customTags.data[0].data.forEach(item => { %>
  <div class="stat">
    <span class="value"><%= item.value %></span>
    <span class="label"><%= item.label %></span>
  </div>
  <% }); %>
</div>
<% } %>
```

---

## 进阶用法

### 条件提取

```javascript
extract: (match, context) => {
  // 根据上下文条件返回不同结构
  if (context.state.inArticle) {
    return { 
      value: match[1],
      articleId: context.state.currentArticleId 
    };
  }
  return { value: match[1] };
}
```

### 跨行匹配

区块标签默认支持跨行：

```javascript
syntax: /<tip>[\s\S]*?<\/tip>/,
// 匹配：
// <tip>
//   多行内容
// </tip>
```

### 正则捕获组

```javascript
// 多个捕获组
syntax: /^\[link:([^\]]+)\]:\s*#\s*\[url:([^\]]+)\]:\s*#\s*$/,
extract: (match) => ({
  text: match[1],
  url: match[2]
}),
```

---

## 调试技巧

### 查看所有提取的标签

在路由中添加调试输出：

```javascript
// routes.js
const parsed = markdownParser.parseMarkdown(content);
console.log('Custom tags:', JSON.stringify(parsed.customTags, null, 2));
```

### 测试正则表达式

```javascript
// 在 Node REPL 中测试
const regex = /^\[author:([^\]]+)\]:\s*#\s*$/;
const test = '[author:张三]: #';
console.log(regex.test(test));  // true
console.log(regex.exec(test));  // 捕获组结果
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| [`src/parser/tags/index.js`](src/parser/tags/index.js) | 标签注册表 |
| [`src/parser/tags/definitions.js`](src/parser/tags/definitions.js) | 标签定义配置 |
| [`src/parser/tags/handlers/inlineHandler.js`](src/parser/tags/handlers/inlineHandler.js) | 行内标签处理器 |
| [`src/parser/tags/handlers/markerHandler.js`](src/parser/tags/handlers/markerHandler.js) | 标记标签处理器 |
| [`src/parser/tags/handlers/blockHandler.js`](src/parser/tags/handlers/blockHandler.js) | 区块标签处理器 |
