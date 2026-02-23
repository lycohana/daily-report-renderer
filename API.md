# 日报渲染系统 API 文档

## 概述

日报渲染系统是一个自动化系统，用于监控指定文件夹中的 Markdown 文件并将其渲染为 HTML 格式的日报页面。系统支持实时监控、缓存机制和响应式设计。

## 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | http://localhost:3000 |
| 默认端口 | 3000 (可通过环境变量 `PORT` 配置) |
| 监控目录 | `./` (可通过环境变量 `WATCH_DIR` 配置) |
| Node.js 版本 | >= 18.0.0 |

## 路由列表

---

### 1. 首页 - 最新日报

**GET /**

显示最新生成的日报内容。如果存在多个日报文件，按日期倒序排列显示最新的一期。

**响应示例:**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>每日日报 - 2026年2月23日</title>
  <style>
    /* 页面样式 */
  </style>
</head>
<body>
  <div class="container">
    <header class="masthead">
      <h1>每日日报</h1>
    </header>
    
    <!-- 头版头条 -->
    <div class="front-page">
      <div class="front-label">头版头条</div>
      <h2 class="front-headline">
        <a href="https://example.com" target="_blank">文章标题</a>
      </h2>
      <p class="front-summary">文章内容...</p>
      
      <!-- 数据块 (内联) -->
      <div class="front-stats" data-inline="true">
        <div class="front-stat">
          <div class="front-stat-value">98.7%</div>
          <div class="front-stat-label">完成率</div>
        </div>
      </div>
    </div>
    
    <!-- 目录 -->
    <div class="toc">...</div>
    
    <!-- 主内容 -->
    <div class="main-content">
      <!-- 章节 -->
      <div class="section" id="section-0">
        <div class="section-header">
          <span class="section-icon">🤖</span>
          <h2>章节标题</h2>
        </div>
        
        <!-- 文章 -->
        <div class="article">
          <div class="article-title">
            <h3>文章标题</h3>
          </div>
          <div class="article-meta">
            <span class="article-source">来源名称</span>
            <span class="article-tag">标签</span>
          </div>
          <div class="article-desc">
            <p>文章内容...</p>
            <!-- 数据块 (内联) -->
            <div class="front-stats" data-inline="true">...</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

**错误响应 (404):**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<body>
  <div class="container">
    <div class="error-page">
      <h1>暂无日报</h1>
      <p>暂无生成的日报内容，请等待或手动添加 Markdown 文件。</p>
      <p class="error-code">错误代码: NO_REPORTS</p>
    </div>
  </div>
</body>
</html>
```

---

### 2. 日报列表页

**GET /list**

展示所有历史日报的列表页面，支持按日期倒序排列。

**查询参数:** 无

**响应示例:**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>日报列表 - 每日日报</title>
</head>
<body>
  <div class="container">
    <header class="masthead">
      <h1>日报列表</h1>
    </header>
    
    <div class="report-list">
      <a href="/report/2026-2-23" class="report-item">
        <div class="report-info">
          <h3>2026年2月23日</h3>
          <span class="report-edition">第 002 期</span>
        </div>
        <div class="report-meta">
          <span class="report-date">2026-02-23</span>
        </div>
      </a>
      
      <a href="/report/2026-2-22" class="report-item">
        <div class="report-info">
          <h3>2026年2月22日</h3>
          <span class="report-edition">第 001 期</span>
        </div>
        <div class="report-meta">
          <span class="report-date">2026-02-22</span>
        </div>
      </a>
    </div>
  </div>
</body>
</html>
```

---

### 3. 单篇日报页

**GET /report/:filename**

显示指定文件名对应的日报内容。

**路径参数:**

| 参数 | 类型 | 描述 |
|------|------|------|
| filename | string | 日报文件名 (不含 .md 后缀) |

**示例:**

```
GET /report/2026-2-23
GET /report/daily-report-001-2026-02-22
```

**响应:** 返回完整的日报 HTML 页面 (同首页结构)

**错误响应 (404):**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<body>
  <div class="container">
    <div class="error-page">
      <h1>文件未找到</h1>
      <p>找不到指定的日报文件: 2026-2-23.md</p>
      <p class="error-code">错误代码: FILE_NOT_FOUND</p>
      <a href="/list">返回列表</a>
    </div>
  </div>
</body>
</html>
```

---

### 4. 健康检查

**GET /health**

检查服务器运行状态和缓存统计信息。

**响应示例:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T14:30:00.000Z",
  "cache": {
    "keys": 5,
    "hits": 127,
    "misses": 8,
    "ksize": 2560,
    "vsize": 512000
  }
}
```

**响应字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| status | string | 服务器状态 ("ok" 或 "error") |
| timestamp | string | ISO 格式时间戳 |
| cache.keys | number | 缓存的键数量 |
| cache.hits | number | 缓存命中次数 |
| cache.misses | number | 缓存未命中次数 |
| cache.ksize | number | 缓存键总大小 (bytes) |
| cache.vsize | number | 缓存值总大小 (bytes) |

---

## Markdown 文件格式

### 文件命名规范

支持以下命名格式:

```
2026-2-23.md
2026-02-23.md
daily-report-001-2026-02-23.md
daily-report-001.md
```

### Front Matter

```yaml
---
title: 2026-2-23
weather: 东莞 · 晴 26°C/18°C
read_time: 约 10 分钟
number: 002
---
```

**支持的 Front Matter 字段:**

| 字段 | 类型 | 描述 |
|------|------|------|
| title | string | 日报标题 |
| weather | string | 天气信息 |
| read_time | string | 阅读时长 |
| number | string | 期号 |
| form | string | 来源信息，格式：`名称|URL,名称|URL,...` |

**form 字段格式示例:**

```yaml
form: AIBase|https://www.aibase.com,GitHub Blog|https://github.com/blog,AI News|https://ainews.com
```

**解析结果:**

```javascript
formInfo = [
  { name: 'AIBase', url: 'https://www.aibase.com' },
  { name: 'GitHub Blog', url: 'https://github.com/blog' },
  { name: 'AI News', url: 'https://ainews.com' }
];
```

**支持格式:**
- `名称|URL` - 名称和链接
- `名称 - URL` - 使用短横线分隔
- `名称` - 仅名称，无链接
- `来源1|URL1,来源2|URL2,来源3` - 多个来源用逗号分隔

### 自定义标签

| 标签 | 作用域 | 描述 |
|------|--------|------|
| `[head]: #` | 文件顶部 | 标记头版头条开始 |
| `[section]: #` | 章节前 | 标记章节开始 |
| `[articles]: #` | 章节中 | 标记文章列表开始 |
| `[tag:标签名]: #` | 任意位置 | 文章/章节标签 |
| `[from:URL]`: # | 文章标题前 | 来源链接 |
| `[fromstr:名称]`: # | 文章标题前 | 来源名称 |
| `[intro:简介]`: # | 章节标题前 | 章节简介 |
| `[icon:emoji]`: # | 章节标题前 | 章节图标 |
| `[sum:摘要]`: # | 章节/文章中 | 摘要内容 |
| `[think:思考]`: # | 章节/文章中 | 思考内容 |

### 区块标签

#### 天气数据块

使用 `<weather>` 标签在文章内容中嵌入天气预报卡片（横向排列）:

```markdown
<weather>
<day>周一|东莞|☀️|晴|26°C/17°C</day>
<day>周二|东莞|⛅|多云|25°C/16°C</day>
<day>周三|深圳|🌧️|雨|24°C/15°C</day>
</weather>
```

**数据格式:**
- 每个 `<day>` 标签包含用 `|` 分隔的5个字段：`日期|城市|图标|天气状况|温度`
- 温度格式：`最高温/最低温`（如 `26°C/17°C`）

**渲染结果:**

```html
<div class="weather-grid">
  <div class="weather-item">
    <div class="weather-icon">☀️</div>
    <div class="weather-city">东莞</div>
    <div class="weather-condition">晴</div>
    <div class="weather-temp">26°C/17°C</div>
    <div class="weather-day">周一</div>
  </div>
  <!-- 更多天气项... -->
</div>
```

**CSS 类名:**

| 类名 | 描述 |
|------|------|
| .weather-grid | 天气网格容器 |
| .weather-item | 单个天气卡片 |
| .weather-icon | 天气图标 |
| .weather-city | 城市名称 |
| .weather-condition | 天气状况 |
| .weather-temp | 温度 |
| .weather-day | 日期 |

### 数据块

使用 `<data>` 标签在文章内容中嵌入统计卡片:

```markdown
<data>
<num>98.7%</num><str>复杂任务完成率</str>
<num>100万</num><str>Token上下文</str>
</data>
```

**渲染结果:**

```html
<div class="front-stats" data-inline="true">
  <div class="front-stat">
    <div class="front-stat-value">98.7%</div>
    <div class="front-stat-label">复杂任务完成率</div>
  </div>
  <div class="front-stat">
    <div class="front-stat-value">100万</div>
    <div class="front-stat-label">Token上下文</div>
  </div>
</div>
```

**数据块特性:**
- 支持多个 `<num>` 和 `<str>` 配对
- 渲染为内联卡片，插入在段落之间
- 自动应用响应式样式

---

## 错误代码

| 代码 | HTTP 状态码 | 描述 |
|------|-------------|------|
| NO_REPORTS | 404 | 暂无日报 |
| FILE_NOT_FOUND | 404 | 文件未找到 |
| LOAD_ERROR | 500 | 加载失败 |

---

## 缓存机制

### 缓存策略

- **缓存超时**: 5分钟 (300秒，可通过 `CACHE_TTL` 环境变量配置)
- **最大缓存数量**: 100 个缓存项
- **缓存内容**: 日报列表、最新日报、各篇日报内容
- **缓存失效**: 文件变更时自动清除相关缓存

### 缓存统计

通过 `/health` 端点查看缓存命中率和性能指标。

---

## 文件 `chokidar` 监听指定文件夹的变化:

| 事件 | 处理 |
|------|------|
|监听

系统使用 新增文件 | 自动解析并缓存 |
| 修改文件 | 自动更新缓存 |
| 删除文件 | 自动清除缓存 |

**响应时间:** 文件变更后不超过 1 秒自动重新渲染。

---

## 响应式设计

### 断点

| 设备 | 宽度 | 布局 |
|------|------|------|
| 桌面端 | >= 900px | 最佳显示宽度 900px |
| 平板 | 768px - 899px | 单列布局 |
| 移动端 | < 768px | 响应式布局，触摸优化 |

### CSS 类名

| 类名 | 描述 |
|------|------|
| .container | 主容器 |
| .masthead | 页头 |
| .front-page | 头版头条区域 |
| .front-headline | 头版头条标题 |
| .front-summary | 头版头条摘要 |
| .front-stats | 统计卡片容器 |
| .front-stat | 单个统计卡片 |
| .front-stat-value | 统计值 |
| .front-stat-label | 统计标签 |
| .toc | 目录区域 |
| .toc-grid | 目录网格 |
| .toc-item | 目录项 |
| .main-content | 主内容区 |
| .section | 章节 |
| .section-header | 章节标题 |
| .article | 文章 |
| .article-title | 文章标题 |
| .article-meta | 文章元信息 |
| .article-desc | 文章描述 |

---

## 模板函数

系统提供以下模板辅助函数:

### renderMarkdown(content)

将 Markdown 内容渲染为 HTML，并处理内联数据块。

**参数:**
- `content` (string): Markdown 内容

**返回:** HTML 字符串

**示例:**

```ejs
<%- renderMarkdown(article.content) %>
```

---

## 部署

### 本地运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm start
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| WATCH_DIR | ./ | 监控文件夹 |
| OUTPUT_DIR | ./ | 输出文件夹 |
| NODE_ENV | production | 运行环境 |
| CACHE_TTL | 300 | 缓存超时(秒) |

---

## 性能优化

### 缓存策略

1. **内存缓存**: 使用 node-cache 进行内存缓存
2. **按需缓存**: 只缓存请求过的日报
3. **自动失效**: 文件变更时主动清除缓存

### 性能指标

| 指标 | 目标值 |
|------|--------|
| 文件变更响应时间 | < 1 秒 |
| 页面加载时间 | < 2 秒 |
| 缓存命中率 | > 80% |
| 支持历史日报数量 | 100+ |

---

## 客户端集成

### API 调用示例

```javascript
// 获取日报列表
const response = await fetch('/list');
const html = await response.text();

// 获取指定日报
const response = await fetch('/report/2026-2-23');
const html = await response.text();

// 健康检查
const response = await fetch('/health');
const data = await response.json();
console.log(data.cache.hits / (data.cache.hits + data.cache.misses));
```

### CORS 配置

如需跨域访问，可通过代理或配置 CORS 中间件实现。

---

## 故障排除

### 常见问题

**Q: 文件修改后页面没有更新?**
A: 检查缓存设置，确保文件变更被正确检测。尝试访问 `/health` 查看缓存状态。

**Q: 样式显示不正确?**
A: 确保使用的是现代浏览器，或检查 EJS 模板中的 CSS 是否正确加载。

**Q: 如何清空缓存?**
A: 重启服务器会自动清空内存缓存，或修改文件触发自动清除。

**Q: 支持哪些 Markdown 扩展?**
A: 支持标准的 CommonMark + GFM，以及自定义的数据块语法。详见上文"Markdown 文件格式"部分。
