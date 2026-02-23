const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const config = require('./config');
const cache = require('./cache');
const markdownParser = require('./markdownParser');
const fileWatcher = require('./fileWatcher');

const router = express.Router();

/**
 * 解析form字段值
 * 支持格式：
 * - form: 来源名称|来源URL
 * - form: 来源名称 - 来源URL
 * - form: 来源名称 (无URL)
 * - form: 来源1|URL1,来源2|URL2,来源3 (多个来源，用逗号分隔)
 *
 * @param {string} formValue - form字段的值
 * @returns {Array} - [{ name: string, url: string|null }, ...]
 */
function parseFormField(formValue) {
  if (!formValue) {
    return [];
  }

  // 先用逗号分割多个来源
  const sources = formValue.split(',');

  return sources.map(source => {
    const sourceStr = source.trim();
    if (!sourceStr) {
      return { name: null, url: null };
    }

    // 尝试使用 | 分隔
    if (sourceStr.includes('|')) {
      const parts = sourceStr.split('|');
      return {
        name: parts[0].trim(),
        url: parts[1] ? parts[1].trim() : null
      };
    }

    // 尝试使用 - 分隔
    if (sourceStr.includes(' - ')) {
      const parts = sourceStr.split(' - ');
      return {
        name: parts[0].trim(),
        url: parts[1] ? parts[1].trim() : null
      };
    }

    // 只有名称，没有URL
    return {
      name: sourceStr.trim(),
      url: null
    };
  }).filter(source => source.name !== null);
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
    const title = markdownParser.extractTitleFromFrontMatter(parsed.frontMatter, latest.basename);
    const edition = markdownParser.extractEditionFromFrontMatter(parsed.frontMatter, latest.basename);
    const formInfo = parseFormField(parsed.frontMatter && parsed.frontMatter.form);
    
    const reportData = {
      title,
      edition,
      frontMatter: parsed.frontMatter,
      customTags: parsed.customTags,
      htmlContent: parsed.htmlContent,
      headSectionHtml: parsed.headSectionHtml,
      sections: parsed.sections,
      headSection: parsed.headSection,
      date: latest.date,
      filename: latest.basename,
      formInfo,
      md: markdownParser.md,
      renderMarkdown: (content) => {
        if (!content) {
          return '';
        }
        let html = markdownParser.md.render(content);
        // 后处理：将<data>块替换为HTML
        html = html.replace(/<data>([\s\S]*?)<\/data>/g, (match, dataContent) => {
          const items = [];
          const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
          let numMatch;
          while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
            items.push({ value: numMatch[1], label: numMatch[2] });
          }
          if (items.length > 0) {
            const itemsHtml = items.map(item => 
              `<div class="front-stat">
                <div class="front-stat-value">${item.value}</div>
                <div class="front-stat-label">${item.label}</div>
              </div>`
            ).join('');
            return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
          }
          return '';
        });
        // 后处理：将<weather>块替换为HTML（支持位置渲染）
        html = html.replace(/<weather(?:\s+center)?>([\s\S]*?)<\/weather>/g, (match, weatherContent) => {
          const isCenter = match.includes('center');
          const dayRegex = /<day>([^<]+)<\/day>/g;
          const items = [];
          let m;
          while ((m = dayRegex.exec(weatherContent)) !== null) {
            const parts = m[1].split('|');
            if (parts.length >= 4) {
              let day, city, icon, condition, temp;
              if (parts.length === 4) {
                // 无城市: 日期|图标|天气|温度
                day = parts[0].trim();
                city = null;
                icon = parts[1].trim();
                condition = parts[2].trim();
                temp = parts[3].trim();
              } else {
                // 有城市: 日期|城市|图标|天气|温度
                day = parts[0].trim();
                city = parts[1].trim();
                icon = parts[2].trim();
                condition = parts[3].trim();
                temp = parts[4].trim();
              }
              items.push({ day, city, icon, condition, temp });
            }
          }
          if (items.length > 0) {
            const centerClass = isCenter ? ' weather-center' : '';
            const itemsHtml = items.map(item => {
              const cityHtml = item.city 
                ? `<div class="weather-city">${item.city}</div>` 
                : `<div class="weather-city weather-city-placeholder">-</div>`;
              return `<div class="weather-item">
                <div class="weather-icon">${item.icon}</div>
                ${cityHtml}
                <div class="weather-condition">${item.condition}</div>
                <div class="weather-temp">${item.temp}</div>
                <div class="weather-day">${item.day}</div>
              </div>`;
            }).join('');
            return `<div class="weather-grid${centerClass}" data-inline="true">${itemsHtml}</div>`;
          }
          return '';
        });
        return html;
      }
    };
    
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
          } catch (e) {
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
    
    const title = markdownParser.extractTitleFromFrontMatter(parsed.frontMatter, sanitizedFilename);
    const edition = markdownParser.extractEditionFromFrontMatter(parsed.frontMatter, sanitizedFilename);
    const formInfo = parseFormField(parsed.frontMatter && parsed.frontMatter.form);
    
    const reportData = {
      title,
      edition,
      frontMatter: parsed.frontMatter,
      customTags: parsed.customTags,
      headSection: parsed.headSection,
      headSectionHtml: parsed.headSectionHtml,
      htmlContent: parsed.htmlContent,
      sections: parsed.sections,
      filename: sanitizedFilename,
      formInfo,
      renderMarkdown: (content) => {
        if (!content) {
          return '';
        }
        let html = markdownParser.md.render(content);
        // 后处理：将<data>块替换为HTML
        html = html.replace(/<data>([\s\S]*?)<\/data>/g, (match, dataContent) => {
          const items = [];
          const numStrRegex = /<num>([^<]+)<\/num>\s*<str>([^<]+)<\/str>/g;
          let numMatch;
          while ((numMatch = numStrRegex.exec(dataContent)) !== null) {
            items.push({ value: numMatch[1], label: numMatch[2] });
          }
          if (items.length > 0) {
            const itemsHtml = items.map(item => 
              `<div class="front-stat">
                <div class="front-stat-value">${item.value}</div>
                <div class="front-stat-label">${item.label}</div>
              </div>`
            ).join('');
            return `<div class="front-stats" data-inline="true">${itemsHtml}</div>`;
          }
          return '';
        });
        // 后处理：将<weather>块替换为HTML（支持位置渲染）
        html = html.replace(/<weather(?:\s+center)?>([\s\S]*?)<\/weather>/g, (match, weatherContent) => {
          const isCenter = match.includes('center');
          const dayRegex = /<day>([^<]+)<\/day>/g;
          const items = [];
          let m;
          while ((m = dayRegex.exec(weatherContent)) !== null) {
            const parts = m[1].split('|');
            if (parts.length >= 4) {
              let day, city, icon, condition, temp;
              if (parts.length === 4) {
                // 无城市: 日期|图标|天气|温度
                day = parts[0].trim();
                city = null;
                icon = parts[1].trim();
                condition = parts[2].trim();
                temp = parts[3].trim();
              } else {
                // 有城市: 日期|城市|图标|天气|温度
                day = parts[0].trim();
                city = parts[1].trim();
                icon = parts[2].trim();
                condition = parts[3].trim();
                temp = parts[4].trim();
              }
              items.push({ day, city, icon, condition, temp });
            }
          }
          if (items.length > 0) {
            const centerClass = isCenter ? ' weather-center' : '';
            const itemsHtml = items.map(item => {
              const cityHtml = item.city 
                ? `<div class="weather-city">${item.city}</div>` 
                : `<div class="weather-city weather-city-placeholder">-</div>`;
              return `<div class="weather-item">
                <div class="weather-icon">${item.icon}</div>
                ${cityHtml}
                <div class="weather-condition">${item.condition}</div>
                <div class="weather-temp">${item.temp}</div>
                <div class="weather-day">${item.day}</div>
              </div>`;
            }).join('');
            return `<div class="weather-grid${centerClass}" data-inline="true">${itemsHtml}</div>`;
          }
          return '';
        });
        return html;
      }
    };
    
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
