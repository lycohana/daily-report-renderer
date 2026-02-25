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
      let html = markdownParser.md.render(content);
      html = processBlocks(html);
      html = applySecurityMode(html, renderMode);
      return html;
    }
  };
}

router.get('/', async (req, res) => {
  try {
    const latestReport = cache.getLatestReport();
    
    if (latestReport) {
      return res.render('index', { ...latestReport, md: markdownParser.md });
    }
    
    const reports = await fileWatcher.scanDirectory(config.watchDir);
    
    if (reports.length === 0) {
      return res.status(404).render('error', {
        title: '暂无日报',
        message: '暂无生成的日报内容，请等待或手动添加Markdown文件。',
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
    
    res.render('index', reportData);
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

router.get('/report/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const mdFilePath = path.join(config.watchDir, `${sanitizedFilename}.md`);
    
    const cachedReport = cache.getReport(sanitizedFilename);
    
    if (cachedReport) {
      return res.render('index', { ...cachedReport, md: markdownParser.md });
    }
    
    try {
      await fs.access(mdFilePath);
    } catch {
      return res.status(404).render('error', {
        title: '文件未找到',
        message: `找不到指定的日报文件: ${sanitizedFilename}.md`,
        code: 'FILE_NOT_FOUND'
      });
    }
    
    const content = await fs.readFile(mdFilePath, 'utf-8');
    const parsed = markdownParser.parseMarkdown(content);
    const renderMode = resolveRenderMode(parsed.frontMatter);
    const fileInfo = { basename: sanitizedFilename, filename: `${sanitizedFilename}.md`, date: null };
    const reportData = buildReportData(parsed, fileInfo, renderMode);

    cache.setReport(sanitizedFilename, reportData);
    
    res.render('index', { ...reportData, md: markdownParser.md });
  } catch (error) {
    console.error('Error loading report:', error);
    res.status(500).render('error', {
      title: '加载失败',
      message: '无法加载日报内容，请稍后重试。',
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
