/**
 * <weather>...</weather> 标签处理器
 * 天气数据块
 */

const BaseHandler = require('../../BaseHandler');
const { hasCenterAttribute, parseWeatherItems } = require('../../../weatherParser');

class WeatherHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /<weather\b([^>]*)>([\s\S]*?)<\/weather>/gi;
  }

  getType() {
    return 'block';
  }

  parseDocument(content, context) {
    const results = [];
    let match;
    this.syntax.lastIndex = 0;

    while ((match = this.syntax.exec(content)) !== null) {
      const parsedData = this._parseWeatherData(match[1], match[2]);
      if (parsedData) {
        results.push({
          name: this.name,
          data: parsedData,
          match: match[0],
          index: match.index
        });

        if (context?.collector) {
          context.collector.setWeather(parsedData);
        }
      }
    }

    return results;
  }

  clean(content) {
    return content; // 保留在内容中
  }

  getStyles() {
    return `
.weather-grid{display:flex;gap:14px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;justify-content:flex-start;padding:18px;background:linear-gradient(145deg,#eaf4ff,#d5e9ff 55%,#c8e1fb);border:1px solid rgba(30,58,95,.1);border-radius:16px;margin:18px 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 8px 24px rgba(30,58,95,.08);scrollbar-width:thin;scrollbar-color:#7ca8d9 #d6e8fb}
.weather-grid.weather-center{justify-content:center}
.weather-grid.weather-fill{justify-content:flex-start}
.weather-grid.weather-fill .weather-item{flex:1 1 0;min-width:0;max-width:none}
.weather-item{position:relative;flex:0 0 auto;min-width:128px;max-width:168px;background:linear-gradient(180deg,#fff,#f7fbff);border:1px solid rgba(73,107,157,.16);border-radius:14px;padding:12px 12px 14px;box-shadow:0 6px 16px rgba(33,66,112,.1);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.weather-item:hover{transform:translateY(-3px);border-color:rgba(44,92,160,.34);box-shadow:0 10px 20px rgba(33,66,112,.16)}
.weather-grid.weather-fill .weather-item:hover{transform:translateY(-3px)}
.weather-item-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
.weather-day{display:inline-flex;align-items:center;gap:4px;font-size:.74rem;color:#436088;background:rgba(97,140,199,.13);border:1px solid rgba(97,140,199,.24);border-radius:999px;padding:1px 8px}
.weather-weekday{font-weight:600}
.weather-day-separator{font-size:.68rem;opacity:.58}
.weather-date{font-weight:700;color:#214a7a}
.weather-city{font-weight:700;color:#1f4f88;font-size:.82rem;max-width:58%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.weather-city-placeholder{visibility:hidden}
.weather-icon-wrap{display:flex;justify-content:center;align-items:center;width:48px;height:48px;margin:2px auto 6px;background:linear-gradient(145deg,#ffffff,#edf5ff);border-radius:50%;box-shadow:inset 0 1px 1px rgba(255,255,255,.85),0 2px 6px rgba(39,74,126,.14)}
.weather-icon{font-size:1.8rem;line-height:1}
.weather-condition{color:#415878;font-size:.86rem;font-weight:600;text-align:center}
.weather-temp{display:flex;align-items:baseline;justify-content:center;gap:4px;margin-top:4px}
.weather-temp-high{color:#d14e3d;font-size:1.02rem;font-weight:700}
.weather-temp-divider{color:#8aa0be;font-size:.84rem}
.weather-temp-low{color:#3e6ea8;font-size:.9rem;font-weight:600}
.weather-grid::-webkit-scrollbar{height:6px}
.weather-grid::-webkit-scrollbar-track{background:#dcecff;border-radius:3px}
.weather-grid::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#7ea8d7,#5c8fca);border-radius:3px;transition:background .2s ease}
.weather-grid::-webkit-scrollbar-thumb:hover{background:linear-gradient(90deg,#6b9bd0,#4e83c2)}
@media (max-width:768px){.weather-grid{padding:14px;gap:10px;border-radius:12px}.weather-item{min-width:112px;max-width:none;padding:10px 10px 12px}.weather-icon-wrap{width:42px;height:42px;margin-bottom:4px}.weather-icon{font-size:1.55rem}.weather-temp-high{font-size:.95rem}.weather-temp-low{font-size:.84rem}}
    `.trim();
  }

  _parseWeatherData(attrs, content) {
    const items = parseWeatherItems(content);
    const center = hasCenterAttribute(attrs);
    return items.length > 0 ? { items, center } : null;
  }
}

module.exports = WeatherHandler;
