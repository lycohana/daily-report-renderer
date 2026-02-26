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
- 🧪 **完整测试**: Jest 单元测试 + 集成测试（261 个测试）
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
│   ├── routes.js              # 路由处理
│   ├── config.js              # 配置文件
│   ├── markdownParser.js      # Markdown 解析核心
│   ├── fileWatcher.js         # 文件监控模块
│   ├── cache.js               # 缓存管理
│   └── parser/                # 解析器子模块
│       ├── config.js          # markdown-it 配置
│       ├── frontMatter.js     # Front Matter 解析
│       ├── blocks.js          # 块级标签处理
│       ├── security.js        # 安全处理
│       ├── stateMachine.js    # 文档结构状态机
│       ├── sanitizers.js      # 结构化字段净化
│       ├── renderers/         # 渲染编排模块
│       │   └── htmlRenderer.js# HTML 渲染器
│       └── tags/              # 标签处理器模块
│           ├── index.js       # 标签注册表（自动发现）
│           ├── BaseHandler.js # 基础处理器类
│           ├── MetaCollector.js # 元数据收集器
│           └── handlers/      # 标签处理器
│               ├── inline/    # 行内标签（tag, from, sum, think...）
│               ├── marker/    # 标记标签（head, section, articles）
│               └── block/     # 区块标签（data, weather, notes...）
├── views/                     # EJS 模板
│   ├── index.ejs             # 日报详情页
│   ├── list.ejs              # 日报列表页
│   └── error.ejs             # 错误页
├── tests/                     # 测试文件
│   ├── routes.test.js
│   ├── markdownParser.test.js
│   ├── cache.test.js
│   ├── fileWatcher.test.js
│   └── tags/                  # 标签处理器测试
├── docs/                      # 文档
│   └── tags-dev-guide.md      # 自定义标签开发指南
├── reports/                   # 日报文件目录
└── package.json
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
          │    ├── inline (tag, from, icon, sum, think...)
          │    ├── marker (head, section, articles)
          │    └── block (data, quote, weather, notes...)
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
| CACHE_TIMEOUT | 300000 | 缓存超时 (ms) |

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

#### 行内标签

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
| `[sum:摘要]: #` | 章节/文章 | 摘要内容（渲染到章节/文章末尾） |
| `[think:思考]: #` | 章节/文章 | 思考点评（渲染到章节/文章末尾） |

#### 块级标签

| 标签 | 描述 |
|------|------|
| `<weather>...</weather>` | 天气块，显示多日天气 |
| `<data>...</data>` | 数据块，显示统计数字 |
| `<sum>...</sum>` | 总结块，原地渲染摘要 |
| `<think>...</think>` | 思考块，原地渲染思考 |
| `<notes>...</notes>` | 笔记块，包含多个 `<note>` 子标签，渲染在页面底部 |
| `> 引用` | 引用块，显示引用内容 |

### 标签详解

#### Sum 和 Think 标签

系统支持两种形式的 sum/think 标签：

**1. 行内标签** - 渲染到章节/文章末尾

```markdown
[section]: #
# 章节标题
[articles]: #
## 文章
文章内容...
[sum:这是章节总结，会渲染在章节末尾]: #
[think:这是章节思考，会渲染在章节末尾]: #
```

**2. 块级标签** - 原地渲染

```markdown
## 文章标题
文章内容...

<sum>
这是文章的总结内容，会显示为带边框的总结框
可以跨多行
</sum>

<think>
这是思考内容，会显示为带边框的思考框
</think>

更多文章内容...
```

**渲染效果：**
- `<sum>...</sum>` → 显示为蓝色左边框的总结框
- `<think>...</think>` → 显示为金色边框的思考框（斜体文字）

#### 笔记块

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

#### 数据块

```markdown
<data>
<num>98.7%</num><str>完成率</str>
<num>100 万</num><str>Token 上下文</str>
</data>
```

#### 天气块

```markdown
<!-- 带城市名称（5 段格式） -->
<weather>
<day>周一 | 东莞|☀️|晴|26°C/17°C</day>
<day>周二 | 深圳|🌧️|雨|24°C/15°C</day>
</weather>

<!-- 不带城市名称（4 段格式，居中显示） -->
<weather center>
<day>周一|☀️|晴|26°C/17°C</day>
<day>周二|⛅|多云|25°C/16°C</day>
</weather>
```

**格式说明：**
- 带城市：`<day>星期 | 城市|emoji|天气 | 温度</day>`
- 不带城市：`<day>星期|emoji|天气 | 温度</day>`
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
├── sumHandler.test.js
├── sumBlockHandler.test.js
├── thinkHandler.test.js
├── thinkBlockHandler.test.js
└── ...

tests/parser/             ✓ 解析器子模块测试
├── stateMachine.test.js
├── renderers/htmlRenderer.test.js
└── sanitizers.test.js
```

### 测试统计

- **总测试数**: 261
- **通过率**: 100%
- **测试套件**: 29

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

#### ESLint ([`eslint.config.js`](eslint.config.js))

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
2. 提取自定义标签（通过 `tags/index.js`）
3. 调用 `src/parser/stateMachine.js` 构建文档结构（头版头条、章节、文章）
4. 调用 `src/parser/sanitizers.js` 处理 safe 模式结构化净化
5. 调用 `src/parser/renderers/htmlRenderer.js` 完成 HTML 渲染与 block 后处理

#### 标签系统

[`src/parser/tags/`](src/parser/tags/) 是标签处理核心：

- **`index.js`** - 标签注册表，自动发现并注册所有处理器
- **`BaseHandler.js`** - 基础处理器类，提供通用属性（name, syntax）
- **`MetaCollector.js`** - 元数据收集器，跟踪文档状态并收集标签数据
- **`handlers/`** - 标签处理器目录
  - `inline/` - 行内标签（`[tag:xxx]: #` 格式）
  - `marker/` - 标记标签（`[section]: #` 格式，触发状态变化）
  - `block/` - 区块标签（`<data>...</data>` 格式）

详细开发指南见 [docs/tags-dev-guide.md](docs/tags-dev-guide.md)

#### 主题系统（浅色/暗黑）

主题维护与新增组件适配规范见 [docs/theme-dev-guide.md](docs/theme-dev-guide.md)，包含：

- `data-theme` 状态约定
- 组件接入流程（默认样式 + dark 覆盖）
- 标签处理器 `getStyles()` 的暗黑适配约束
- UI 回归检查清单

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
