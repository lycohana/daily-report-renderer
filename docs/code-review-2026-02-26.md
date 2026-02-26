# 代码审查报告（2026-02-26）

> 审查范围：`src/`、`README.md`、`API.md`、`docs/`
> 
> 审查维度：逻辑审查、漏洞审查、结构审查、文档内容审查。

## 1. 逻辑审查

### 1.1 章节切换条件依赖 `sectionMetas.length`，可能导致实际 Markdown 章节被忽略
- **位置**：`src/markdownParser.js`
- **问题**：`parseLine()` 在处理“后续 `#` 标题作为新章节”时，条件为 `state.currentSectionMetaIndex < state.sectionMetas.length`。当文档中的 `#` 章节数大于标签元数据收集到的 `sectionMetas` 时，后续章节不会触发 `startNewSection()`，而是被当成普通内容处理。
- **影响**：章节解析结果与 Markdown 结构不一致，可能出现内容串到上一章节的情况。
- **建议**：章节边界应优先由 Markdown 标题语义驱动，再“尽力”关联 `sectionMetas`（不存在元数据时使用空元数据对象）。

### 1.2 `headSection` 在 `safe` 模式下未做结构化字段净化
- **位置**：`src/markdownParser.js`
- **问题**：`sanitizeStructuredMeta()` 仅净化 `sections[].summary/think` 和 `article.summary/think`，未覆盖 `headSection` 的 `sum/think` 字段。
- **影响**：模板若直接输出 `headSection.sum/headSection.think`（尤其在后续维护中使用 `<%- %>`），会形成与“safe 模式”预期不一致的风险窗口。
- **建议**：与 `sections` 保持一致，对 `headSection` 的可渲染富文本字段做同级别净化。

## 2. 漏洞审查

### 2.1 默认 `legacy` 渲染模式 + `markdown-it html: true`，默认暴露 XSS 面
- **位置**：`src/parser/config.js`、`src/parser/security.js`、`README.md`
- **问题**：Markdown 解析器启用了原生 HTML（`html: true`），且系统默认渲染模式是 `legacy`（不净化）。
- **影响**：如果 `reports/` 内容来源不是完全可信，任意内嵌 HTML/脚本注入可直接进入渲染输出。
- **建议**：
  1. 将默认渲染模式改为 `safe`（白名单净化默认开启）。
  2. 或保留 `legacy` 但在文档与启动日志中明确标注“仅用于可信输入源”。

### 2.2 代码块语言标识未转义，存在属性注入风险（legacy 模式下）
- **位置**：`src/parser/config.js`
- **问题**：`highlight()` 中将 `lang` 直接插入 `class="language-${lang}"`，未做转义。
- **影响**：在 `legacy` 模式下，构造恶意 fenced code 语言参数可能打破属性边界，形成 HTML 注入。
- **建议**：对 `lang` 做白名单限制（如 `/^[a-zA-Z0-9_-]+$/`）或调用 `md.utils.escapeHtml(lang)` 后再拼接。

## 3. 结构审查

### 3.1 `markdownParser.js` 职责过重，维护成本较高
- **位置**：`src/markdownParser.js`
- **问题**：同一文件包含状态机解析、节点建模、HTML 渲染、块标签再处理、安全处理等多种职责。
- **影响**：认知负担大，变更时回归风险高，单元测试粒度难细化。
- **建议**：拆分为：
  - `parser/stateMachine.js`（标题/章节/文章解析）
  - `parser/renderers/`（HTML 渲染、block 后处理）
  - `parser/sanitizers.js`（safe 模式净化）

### 3.2 路由层存在重复“读取 + 解析 + 组装”流程
- **位置**：`src/routes.js`
- **问题**：`/`、`/list`、`/report/:filename` 都包含类似读取文件、调用 parser、拼装展示对象的流程。
- **影响**：逻辑重复，未来新增字段时容易出现路由间不一致。
- **建议**：提取 `reportService`（如 `loadReportByFile`, `loadLatestReport`, `loadReportListMeta`）统一处理。

## 4. 文档内容审查

### 4.1 `API.md` 中默认监控目录描述与实际配置不一致
- **位置**：`API.md`、`src/config.js`
- **问题**：文档写“监控目录 `./`”，实际默认值是 `./reports`。
- **影响**：部署/联调时容易误解输入目录，导致“系统找不到日报”问题。
- **建议**：将 `API.md` 对齐为 `./reports`。

### 4.2 文档对安全模式默认行为描述容易被误读
- **位置**：`README.md`
- **问题**：虽写明默认 `legacy`，但未在“快速开始”或“安全提示”显著强调其信任边界。
- **影响**：新接手同学可能在不可信输入场景下直接上线。
- **建议**：在 README 增加“安全基线建议”：生产环境默认 `render_mode: safe`。

---

## 结论（优先级建议）

- **P0（优先修复）**：
  1. 默认渲染策略的安全基线（safe vs legacy）
  2. `highlight(lang)` 属性注入防护
- **P1（本周修复）**：
  1. 章节切换逻辑不应被 `sectionMetas.length` 限制
  2. `headSection` 结构化字段净化一致性
- **P2（可持续优化）**：
  1. `markdownParser.js` 拆分
  2. 路由层服务化与文档纠偏
