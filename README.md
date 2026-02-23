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
- ✅ **代码质量**: ESLint + Prettier + Husky

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
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
│       ├── customTags.js     # 自定义标签提取
│       └── utils.js          # 工具函数
├── views/                     # EJS 模板
│   ├── index.ejs             # 日报详情页
│   ├── list.ejs              # 日报列表页
│   └── error.ejs             # 错误页
├── tests/                    # 测试文件
│   ├── routes.test.js
│   ├── markdownParser.test.js
│   ├── cache.test.js
│   └── fileWatcher.test.js
├── .husky/                   # Git hooks
├── package.json
└── .eslintrc.json
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

### 数据块

```markdown
<data>
<num>98.7%</num><str>完成率</str>
<num>100万</num><str>Token上下文</str>
</data>
```

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
```

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
```

### Git Hooks

使用 Husky 集成 Git hooks：

- `pre-commit`: 运行 ESLint + Prettier
- `commit-msg`: 验证提交信息格式

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
