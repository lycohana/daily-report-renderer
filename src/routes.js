const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config');
const cache = require('./cache');
const markdownParser = require('./markdownParser');
const fileWatcher = require('./fileWatcher');
const { processBlocks } = require('./parser/blocks');
const { applySecurityMode, resolveRenderMode } = require('./parser/security');
const { parseFormField } = require('./utils/formParser');
const tagsIndex = require('./parser/tags/index');

const router = express.Router();

/**
 * 构建报告数据对象
 * @param {Object} parsed - markdownParser.parseMarkdown() 返回的解析结果
 * @param {Object} fileInfo - 文件信息对象 { basename, filename, date }
 * @param {string} renderMode - 渲染模式
 * @returns {Object} 报告数据对象
 */
function buildReportData(parsed, fileInfo, renderMode) {
  const title = markdownParser.extractTitleFromFrontMatter(parsed.frontMatter, fileInfo.basename);
  const edition = markdownParser.extractEditionFromFrontMatter(parsed.frontMatter, fileInfo.basename);
  const formInfo = parseFormField(parsed.frontMatter && parsed.frontMatter.form);

  return {
    title,
    edition,
    frontMatter: parsed.frontMatter,
    customTags: parsed.customTags,
    htmlContent: parsed.htmlContent,
    headSectionHtml: parsed.headSectionHtml,
    sections: parsed.sections,
    headSection: parsed.headSection,
    date: fileInfo.date,
    filename: fileInfo.basename,
    formInfo,
    md: markdownParser.md,
    renderMarkdown: (content) => {
      if (!content) {
        return '';
      }
      
      let html = content;
      
      // 先渲染 markdown
      html = markdownParser.md.render(html);
      // 然后处理块级标签（sum, think, notes 等）
      html = processBlocks(html, markdownParser.md);
      html = applySecurityMode(html, renderMode);
      
      return html;
    }
  };
}

async function downloadMarkdown(res, reportName) {
  const sanitizedName = path.basename(reportName);
  const mdFilePath = path.join(config.watchDir, `${sanitizedName}.md`);

  try {
    await fs.access(mdFilePath);
  } catch {
    return res.status(404).render('error', {
      title: '文件未找到',
      message: `找不到指定的日报文件：${sanitizedName}.md`,
      code: 'FILE_NOT_FOUND'
    });
  }

  const content = await fs.readFile(mdFilePath, 'utf-8');

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizedName}.md"`);
  return res.send(content);
}

router.get('/', async (req, res) => {
  try {
    const latestReport = cache.getLatestReport();
    
    if (latestReport) {
      return res.render('index', { ...latestReport, md: markdownParser.md, stylesHtml: tagsIndex.getStylesHTML() });
    }
    
    const reports = await fileWatcher.scanDirectory(config.watchDir);
    
    if (reports.length === 0) {
      return res.status(404).render('error', {
        title: '暂无日报',
        message: '暂无生成的日报内容，请等待或手动添加 Markdown 文件。',
        code: 'NO_REPORTS'
      });
    }
    
    const latest = reports[0];
    const content = await fs.readFile(path.join(config.watchDir, latest.filename), 'utf-8');
    const parsed = markdownParser.parseMarkdown(content);
    const renderMode = resolveRenderMode(parsed.frontMatter);
    const fileInfo = { basename: latest.basename, filename: latest.filename, date: latest.date };
    const reportData = buildReportData(parsed, fileInfo, renderMode);

    cache.setLatestReport(reportData);

    res.render('index', { ...reportData, stylesHtml: tagsIndex.getStylesHTML() });
  } catch (error) {
    console.error('Error loading index:', error);
    res.status(500).render('error', {
      title: '加载失败',
      message: '无法加载日报内容，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    let reports = cache.getReportList();
    
    if (reports.length === 0) {
      reports = await fileWatcher.scanDirectory(config.watchDir);
      
      if (reports.length === 0) {
        return res.render('error', {
          title: '暂无日报',
          message: '暂无历史日报记录。',
          code: 'NO_REPORTS'
        });
      }
      
      const reportsWithMeta = await Promise.all(
        reports.map(async (report) => {
          try {
            const content = await fs.readFile(path.join(config.watchDir, report.filename), 'utf-8');
            const parsed = markdownParser.parseMarkdown(content);
            return {
              ...report,
              title: markdownParser.extractTitleFromFrontMatter(parsed.frontMatter, report.basename),
              edition: markdownParser.extractEditionFromFrontMatter(parsed.frontMatter, report.basename)
            };
          } catch {
            return {
              ...report,
              title: report.basename
            };
          }
        })
      );
      
      cache.setReportList(reportsWithMeta);
      reports = reportsWithMeta;
    }
    
    res.render('list', {
      title: '日报列表',
      reports: reports.map(r => ({
        filename: r.basename,
        title: r.title,
        edition: r.edition || String(r.number).padStart(3, '0'),
        date: r.date,
        sortKey: r.sortKey
      }))
    });
  } catch (error) {
    console.error('Error loading list:', error);
    res.status(500).render('error', {
      title: '加载失败',
      message: '无法加载日报列表，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

router.get('/download', async (req, res) => {
  try {
    const reports = await fileWatcher.scanDirectory(config.watchDir);

    if (reports.length === 0) {
      return res.status(404).render('error', {
        title: '暂无日报',
        message: '暂无可下载的日报内容，请等待或手动添加 Markdown 文件。',
        code: 'NO_REPORTS'
      });
    }

    const latest = reports[0];
    return downloadMarkdown(res, latest.basename || path.basename(latest.filename, '.md'));
  } catch (error) {
    console.error('Error downloading latest report:', error);
    return res.status(500).render('error', {
      title: '下载失败',
      message: '无法下载最新日报，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

router.get('/download/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
      return res.status(400).render('error', {
        title: '日期格式错误',
        message: '请使用 YYYY-MM-DD 格式，如 2026-06-26',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    return downloadMarkdown(res, date);
  } catch (error) {
    console.error('Error downloading report:', error);
    return res.status(500).render('error', {
      title: '下载失败',
      message: '无法下载指定日报，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

router.get('/report/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const mdFilePath = path.join(config.watchDir, `${sanitizedFilename}.md`);
    
    const cachedReport = cache.getReport(sanitizedFilename);
    
    if (cachedReport) {
      return res.render('index', { ...cachedReport, md: markdownParser.md, stylesHtml: tagsIndex.getStylesHTML() });
    }
    
    try {
      await fs.access(mdFilePath);
    } catch {
      return res.status(404).render('error', {
        title: '文件未找到',
        message: `找不到指定的日报文件：${sanitizedFilename}.md`,
        code: 'FILE_NOT_FOUND'
      });
    }
    
    const content = await fs.readFile(mdFilePath, 'utf-8');
    const parsed = markdownParser.parseMarkdown(content);
    const renderMode = resolveRenderMode(parsed.frontMatter);
    const fileInfo = { basename: sanitizedFilename, filename: `${sanitizedFilename}.md`, date: null };
    const reportData = buildReportData(parsed, fileInfo, renderMode);

    cache.setReport(sanitizedFilename, reportData);

    res.render('index', { ...reportData, md: markdownParser.md, stylesHtml: tagsIndex.getStylesHTML() });
  } catch (error) {
    console.error('Error loading report:', error);
    res.status(500).render('error', {
      title: '加载失败',
      message: '无法加载日报内容，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

/**
 * 树形结构默认路由 - 重定向到最新日报
 */
router.get('/tree', async (req, res) => {
  try {
    let latestReport = cache.getLatestReport();

    // 如果缓存中没有，则扫描目录获取最新日报
    if (!latestReport) {
      const reports = await fileWatcher.scanDirectory(config.watchDir);
      if (reports.length === 0) {
        return res.status(404).render('error', {
          title: '暂无日报',
          message: '目前没有可用的日报数据',
          code: 'NO_REPORTS'
        });
      }
      const latest = reports[0];
      const content = await fs.readFile(path.join(config.watchDir, latest.filename), 'utf-8');
      const parsed = markdownParser.parseMarkdown(content);
      const renderMode = resolveRenderMode(parsed.frontMatter);
      const fileInfo = { basename: latest.basename, filename: latest.filename, date: latest.date };
      latestReport = buildReportData(parsed, fileInfo, renderMode);
    }

    // 提取日期部分（从 basename 如 2026-02-26.md）
    const date = latestReport.filename.replace('.md', '');
    return res.redirect(`/tree/${date}`);
  } catch (error) {
    console.error('Tree default route error:', error);
    return res.status(500).render('error', {
      title: '服务器错误',
      message: '无法获取最新日报',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * 树形结构视图路由
 * 展示指定日期文章的树形结构和元数据（不含具体内容）
 */
router.get('/tree/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // 验证日期格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).render('error', {
        title: '日期格式错误',
        message: '请使用 YYYY-MM-DD 格式，如 2026-06-26',
        code: 'INVALID_DATE_FORMAT'
      });
    }
    
    const sanitizedDate = path.basename(date);
    const mdFilePath = path.join(config.watchDir, `${sanitizedDate}.md`);
    
    try {
      await fs.access(mdFilePath);
    } catch {
      return res.status(404).render('error', {
        title: '文件未找到',
        message: `找不到指定日期的日报文件：${sanitizedDate}.md`,
        code: 'FILE_NOT_FOUND'
      });
    }
    
    const content = await fs.readFile(mdFilePath, 'utf-8');
    const parsed = markdownParser.parseMarkdown(content);
    
    // 构建简化后的树形数据（不含具体内容）
    const treeData = {
      frontMatter: parsed.frontMatter,
      title: markdownParser.extractTitleFromFrontMatter(parsed.frontMatter, sanitizedDate),
      edition: markdownParser.extractEditionFromFrontMatter(parsed.frontMatter, sanitizedDate),
      headSection: parsed.headSection ? {
        title: parsed.headSection.title,
        tags: parsed.headSection.tags,
        from: parsed.headSection.from,
        fromStr: parsed.headSection.fromStr,
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
    
    res.render('tree', {
      ...treeData,
      date: sanitizedDate,
      stylesHtml: tagsIndex.getStylesHTML()
    });
  } catch (error) {
    console.error('Error loading tree:', error);
    res.status(500).render('error', {
      title: '加载失败',
      message: '无法加载树形结构，请稍后重试。',
      code: 'LOAD_ERROR'
    });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cache.getStats()
  });
});

module.exports = router;
