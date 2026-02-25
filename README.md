# Daily Report Renderer

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

日报渲染系统 - 自动监控 Markdown 文件并渲染为精美的 HTML 日报页面。

## 特性

- 📄 **Markdown 解析**: 支持 Front Matter、自定义标签、结构化章节
- 🔄 **实时监控**: 使用 chokidar 监控文件变化，自动重新渲染
- 💾 **缓存机制**: 内置内存缓存，提升响应速度
- 🎨 **精美 UI**: 报纸风格设计，响应式布局
- 🧪 **完整测试**: Jest 单元测试 + 集成测试
- ✅ **代码质量**: ESLint + Prettier + Commitlint

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/lycohana/daily-report-renderer
cd daily-report-renderer

# 安装依赖
npm install
```

### 运行

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

服务启动后访问 http://localhost:3000

## 项目结构

### 目录结构

```
daily-report-renderer/
├── src/
│   ├── server.js              # Express 服务器入口
│   ├── routes.js             # 路由处理
│   ├── config.js             # 配置文件
│   ├── markdownParser.js     # Markdown 解析核心
│   ├── fileWatcher.js        # 文件监控模块
│   ├── cache.js              # 缓存管理
│   └── parser/               # 解析器子模块
│       ├── config.js         # markdown-it 配置
│       ├── frontMatter.js    # Front Matter 解析
│       ├── customTags.js     # 自定义标签提取（Facade）
│       ├── utils.js          # 工具函数
│       └── tags/             # 标签处理器模块
│           ├── index.js              # 标签注册表
│           ├── BaseHandler.js        # 基础处理器类
│           ├── MetaCollector.js      # 元数据收集器
│           └── handlers/             # 标签处理器
│               ├── TagHandler.js     # [tag:] 标签
│               ├── FromHandler.js    # [from:] 标签
│               ├── SectionHandler.js # [section]: 标记
│               └── ...               # 其他处理器
├── views/                     # EJS 模板
│   ├── index.ejs             # 日报详情页
│   ├── list.ejs              # 日报列表页
│   └── error.ejs             # 错误页
├── tests/                    # 测试文件
│   ├── routes.test.js
│   ├── markdownParser.test.js
│   ├── cache.test.js
│   ├── fileWatcher.test.js
│   └── tags/                 # 标签处理器测试
│       ├── TagHandler.test.js
│       ├── FromHandler.test.js
│       └── ...
├── docs/                     # 文档
│   └── tags-dev-guide.md     # 自定义标签开发指南
├── package.json
└── eslint.config.js
```

### 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         客户端浏览器                                  │
│                    http://localhost:3000                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTP 请求
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Express 服务器                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      routes.js                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ GET /    │  │ GET /list│  │GET /report│ │GET /health│   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │   │
│  └───────┼─────────────┼─────────────┼─────────────┼──────────┘   │
└──────────┼─────────────┼─────────────┼─────────────┼──────────────┘
           │             │             │             │
           ▼             ▼             ▼             │
┌──────────────────────┐ │ ┌──────────────────────┐ │
│   markdownParser.js  │ │ │      cache.js        │ │
│  ┌────────────────┐  │ │ │  ┌────────────────┐  │ │
│  │ frontMatter    │  │ │ │  │ reportList     │  │ │
│  │ customTags     │◄─┼─┼─┤  │ latestReport   │  │ │
│  │ markdown-it    │  │ │ │  │ report cache   │  │ │
│  └───────┬────────┘  │ │ │  └────────────────┘  │ │
└──────────┼───────────┘ │ └──────────────────────┘ │
           │             │                          │
           ▼             │                          │
┌──────────────────────┐ │                          │
│   tags/index.js      │ │                          │
│  ┌────────────────┐  │ │                          │
│  │ TagRegistry    │  │ │                          │
│  │ - initialize() │  │ │                          │
│  │ - extractTags()│  │ │                          │
│  └───────┬────────┘  │ │                          │
└──────────┼───────────┘ │                          │
           │             │                          │
           ▼             │                          │
    ┌──────┴──────┐      │                          │
    │             │      │                          │
    ▼             ▼      │                          │
┌─────────┐  ┌──────────┴┴──────────────────────────┘
│ handlers│  │  MetaCollector.js
│ 目录     │  │  ┌─────────────────────────────┐
│ - inline│  │  │ state: {                    │
│ - marker│  │  │   inHeadline, inSection,    │
│ - block │  │  │   inArticles, sectionIndex  │
│         │  │  │ }                           │
│         │  │  │                             │
│         │  │  │ collect() - 收集元数据       │
│         │  │  │ onMarker() - 处理标记        │
│         │  │  │ onHeading() - 处理标题       │
│         │  │  │ getResult() - 返回结果       │
│         │  │  └─────────────────────────────┘
└─────────┘  └─────────────────────────────────┘
```

### 数据流

```
Markdown 文件 → fileWatcher 监控变化
     │
     ▼
markdownParser 解析
     │
     ├── frontMatter → 提取元数据 (date, number, weather, form)
     │
     └── customTags → 提取自定义标签
          │
          ▼
     tags/index.js (TagRegistry)
          │
          ├── handlers/ → 解析标签语法
          │    ├── inline (tag, from, icon...)
          │    ├── marker (head, section, articles)
          │    └── block (data, quote, weather)
          │
          └── MetaCollector → 收集元数据
               │
               ├── 跟踪文档状态 (headline/section/article)
               ├── 收集标签数据
               └── 构建 section/article 结构
                    │
                    ▼
               渲染引擎 (EJS)
                    │
                    ▼
               HTML 输出
```

## 配置

通过环境变量或 [`src/config.js`](src/config.js) 修改配置：

| 变量 | 默认值 | 描述 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| WATCH_DIR | ./reports | 监控目录 |
| OUTPUT_DIR | ./output | 输出目录 |
| CACHE_TIMEOUT | 300000 | 缓存超时(ms) |

## Markdown 文件格式

### 基本结构

```yaml
---
number: 002
date: 2026-2-23
weather: 东莞 · 晴 26°C/17°C
read_time: 约 10 分钟
form: AIBase|https://www.aibase.com,GitHub Blog|https://github.com/blog
render_mode: legacy
---
[head]: #
[from:https://example.com]: #
[tag:AI]: #
[tag:OpenAI]: #
# 头版头条标题
头版头条内容...

[section]: #
[intro:章节简介]: #
[icon:🤖]: #
# 章节标题
[articles]: #
## 文章标题
[from:URL]: #
[sum:总结]: #
[think:思考]: #
```

### 渲染安全模式

通过 Front Matter 字段 `render_mode` 控制渲染安全策略：

| 值 | 行为 |
|----|------|
| `legacy` | 保持历史渲染行为，不额外做 HTML 净化 |
| `safe` | 在渲染后进行白名单净化，移除危险 HTML |

默认值：`legacy`。当值缺失或非法时自动回退到 `legacy`。

### 自定义标签

| 标签 | 作用域 | 描述 |
|------|--------|------|
| `[head]: #` | 文件顶部 | 标记头版头条开始 |
| `[section]: #` | 章节前 | 标记章节开始 |
| `[articles]: #` | 章节中 | 标记文章列表开始 |
| `[tag:标签]: #` | 任意 | 标签 |
| `[from:URL]: #` | 文章前 | 来源链接 |
| `[fromstr:名称]: #` | 文章前 | 来源名称 |
| `[intro:简介]: #` | 章节前 | 章节简介 |
| `[icon:emoji]: #` | 章节前 | 章节图标 |
| `[sum:摘要]: #` | 章节/文章 | 摘要内容 |
| `[think:思考]: #` | 章节/文章 | 思考点评 |

### 块级标签

| 标签 | 描述 |
|------|------|
| `<weather>...</weather>` | 天气块，显示多日天气 |
| `<data>...</data>` | 数据块，显示统计数字 |
| `<sum>...</sum>` | 总结块，显示摘要总结 |
| `<think>...</think>` | 思考块，显示思考点评 |
| `<notes>...</notes>` | 笔记块，包含多个 `<note>` 子标签，渲染在页面底部 |

### 总结块和思考块

块级标签可在文章内容中直接使用：

```markdown
## 文章标题
文章内容...
<sum>这是文章的总结内容，会显示为带边框的总结框</sum>
</think>这是思考内容，会显示为带边框的思考框</think>
```

**渲染效果：**
- `<sum>...</sum>` → 显示为蓝色左边框的总结框
- `<think>...</think>` → 显示为金色边框的思考框（斜体文字）

> **提示：** 也可以使用行内标签格式 `[sum:总结内容]` 和 `[think:思考内容]`，它们会被渲染到章节末尾。

### 笔记块

```markdown
<notes>
<note>
**重点关注**
- 项目 A 进展
- 项目 B 更新
</note>
<note>
**明日预告**
- 会议安排
- 任务清单
</note>
</notes>
```

笔记块会渲染在页面底部，显示为双列网格布局的卡片。

### 数据块

```markdown
<data>
<num>98.7%</num><str>完成率</str>
<num>100万</num><str>Token上下文</str>
</data>
```

### 天气块

```markdown
<!-- 带城市名称（5段格式） -->
<weather>
<day>周一|东莞|☀️|晴|26°C/17°C</day>
<day>周二|深圳|🌧️|雨|24°C/15°C</day>
</weather>

<!-- 不带城市名称（4段格式，居中显示） -->
<weather center>
<day>周一|☀️|晴|26°C/17°C</day>
<day>周二|⛅|多云|25°C/16°C</day>
</weather>
```

**格式说明：**
- 带城市：`<day>星期|城市|emoji|天气|温度</day>`
- 不带城市：`<day>星期|emoji|天气|温度</day>`
- 可选属性：`center` - 居中显示

## API 接口

| 路由 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 最新日报 |
| `/list` | GET | 日报列表 |
| `/report/:filename` | GET | 指定日报 |
| `/health` | GET | 健康检查 |

详细 API 文档见 [API.md](API.md)

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 模式
npm run test:ci
```

### 测试覆盖

```
src/
├── routes.js             ✓ 路由测试
├── markdownParser.js     ✓ 解析器测试
├── cache.js              ✓ 缓存测试
└── fileWatcher.js        ✓ 文件监控测试

tests/tags/               ✓ 标签处理器测试
├── tagHandler.test.js
├── fromHandler.test.js
├── sectionHandler.test.js
├── dataHandler.test.js
├── weatherHandler.test.js
└── ...
```

### 测试统计

- **总测试数**: 189
- **通过率**: 100%
- **测试套件**: 21


## 代码质量

### 代码规范

项目使用 ESLint + Prettier 确保代码质量：

```bash
# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 格式检查
npm run format:check

# 验证提交信息（手动运行）
npm run commitlint
```

### 配置

#### ESLint ([`.eslintrc.json`](.eslintrc.json))

- 基于 ESLint 推荐规则
- 支持 ES2021 + Node.js 环境
- 开启 Jest 全局变量
- 强制使用 const/let，禁止 var

#### Prettier ([`package.json`](package.json))

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

## 开发指南

### 添加新功能

1. 创建功能分支：`git checkout -b feature/xxx`
2. 编写代码和测试
3. 确保通过所有检查：`npm run validate`
4. 提交代码

### 模块说明

#### Markdown 解析器

[`src/markdownParser.js`](src/markdownParser.js) 是核心解析模块，负责：

1. 解析 Front Matter 元数据
2. 提取自定义标签
3. 识别文档结构（头版头条、章节、文章）
4. 将 Markdown 转换为 HTML

#### 文件监控

[`src/fileWatcher.js`](src/fileWatcher.js) 使用 chokidar 监控文件变化：

- 新增文件 → 自动解析并缓存
- 修改文件 → 更新缓存
- 删除文件 → 清除缓存

#### 缓存管理

[`src/cache.js`](src/cache.js) 使用 node-cache 实现内存缓存：

- 日报列表缓存
- 最新日报缓存
- 单篇日报缓存
- 文件变更时自动失效

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！
