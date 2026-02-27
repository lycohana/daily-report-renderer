# 新路由 /tree/:date 实现计划

## 需求概述
- **路由路径**: `/tree/:date`
- **输出格式**: HTML 页面
- **功能**: 以树形结构展示文章结构（sections、articles）和元数据，不包含具体内容
- **日期格式**: `YYYY-MM-DD` (如 `2026-06-26`)

## 数据结构分析

### 文章树结构
```
├── headSection (头版头条)
│   ├── title
│   ├── tags[]
│   ├── from
│   ├── fromStr
│   ├── summary
│   ├── think
│   └── dataBlocks
│
└── sections[] (章节列表)
    ├── title
    ├── icon
    ├── intro
    ├── tags[]
    ├── summary
    ├── think
    ├── dataBlocks
    └── articles[]
        ├── title
        ├── from
        ├── fromStr
        ├── tags[]
        ├── summary
        ├── think
        ├── quoteBlocks[]
        └── dataBlocks
```

### 元数据 (frontMatter)
- `number` - 期号
- `date` - 日期
- `weather` - 天气
- `read_time` - 阅读时间
- `form` - 来源列表
- `render_mode` - 渲染模式

## 日期格式要求

### 统一使用 `YYYY-MM-DD` 格式
- **标准格式**: `2026-06-26`（年份-月份-日期，均为两位数）
- **示例路由**: `/tree/2026-06-26`

### 项目兼容性
项目中的 [`parseFilename()`](src/fileWatcher.js:9) 函数正则表达式 `\d{4}-\d{1,2}-\d{1,2}` 已支持：
- `2026-2-26` (单数月份/日期)
- `2026-02-26` (双数月份/日期)
- `2026-06-26` (推荐格式)

`sortKey` 生成逻辑会自动补零: `2026-06-26` → `20260626`

### 测试要求
- 使用 `YYYY-MM-DD` 格式编写测试用例
- 运行 `npm test` 确保所有测试通过
- 运行 `npm run lint` 确保代码风格一致

### 1. 添加路由 (src/routes.js)

新增路由处理函数：
```javascript
router.get('/tree/:date', async (req, res) => {
  // 1. 获取日期参数
  // 2. 查找对应日期的 Markdown 文件
  // 3. 解析 Markdown 获取结构化数据
  // 4. 渲染 tree.ejs 视图
});
```

### 2. 创建视图模板 (views/tree.ejs)

参考现有 `index.ejs` 样式，创建树形展示页面：
- 头部：元信息展示（期号、日期、天气、阅读时间）
- 树形结构：可折叠的章节和文章列表
- 节点信息：标题、标签、来源、摘要、思考等

### 3. 树形数据结构处理

在路由中构建简化后的树形数据：
```javascript
const treeData = {
  frontMatter: parsed.frontMatter,
  title: markdownParser.extractTitleFromFrontMatter(...),
  edition: markdownParser.extractEditionFromFrontMatter(...),
  headSection: parsed.headSection ? {
    title: parsed.headSection.title,
    tags: parsed.headSection.tags,
    from: parsed.headSection.from,
    summary: parsed.headSection.summary,
    think: parsed.headSection.think
  } : null,
  sections: parsed.sections.map(section => ({
    title: section.title,
    icon: section.icon,
    intro: section.intro,
    tags: section.tags,
    summary: section.summary,
    think: section.think,
    articles: section.articles.map(article => ({
      title: article.title,
      from: article.from,
      fromStr: article.fromStr,
      tags: article.tags,
      summary: article.summary,
      think: article.think
    }))
  }))
};
```

## 视图设计

### 页面布局
```
┌─────────────────────────────────────────┐
│  每日日报 - 树形结构                     │
│  第 XXX 期 | 2026-06-26 | 天气 | 阅读时间 │
├─────────────────────────────────────────┤
│  ▼ 头版头条                             │
│    标题: xxx                            │
│    标签: [tag1] [tag2]                  │
│    来源: xxx                            │
│    摘要: xxx                            │
├─────────────────────────────────────────┤
│  ▼ 第一章: AI 热点头条                   │
│    简介: xxx                            │
│    ├─ 文章1: 标题                       │
│    │   标签: [AI] [微软]                │
│    │   来源: AIBase                     │
│    │   摘要: xxx                        │
│    └─ 文章2: 标题                       │
│        ...                              │
├─────────────────────────────────────────┤
│  ▼ 第二章: 开源前沿头条                 │
│    ...                                  │
└─────────────────────────────────────────┘
```

### 交互功能
- 章节默认展开/折叠
- 悬停显示更多信息
- 响应式设计适配移动端

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/routes.js` | 修改 | 添加 `/tree/:date` 路由 |
| `views/tree.ejs` | 新建 | 树形结构视图模板 |
| `public/css/components.css` | 可选 | 添加树形视图样式 |

## 样式复用策略

参考 `index.ejs` 中的现有样式：
- 保持一致的配色方案 (ink-black, paper-bg, accent-red 等)
- 复用相同的字体 (Noto Sans SC, Noto Serif SC)
- 响应式布局适配
