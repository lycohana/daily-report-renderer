/**
 * <weather>...</weather> 标签处理器
 * 天气数据块
 */

const BaseHandler = require('../BaseHandler');

class WeatherHandler extends BaseHandler {
  constructor() {
    super();
    this.syntax = /<weather(?:\s+center)?>([\s\S]*?)<\/weather>/g;
  }

  getType() {
    return 'block';
  }

  parse(content, context) {
    const results = [];
    let match;
    this.syntax.lastIndex = 0;

    while ((match = this.syntax.exec(content)) !== null) {
      const parsedData = this._parseWeatherData(match[0], match[1]);
      if (parsedData) {
        results.push({
          name: this.name,
          data: parsedData,
          match: match[0],
          index: match.index,
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
.weather-grid{display:flex;gap:12px;flex-wrap:nowrap;overflow-x:auto;padding:16px;background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:12px;margin:16px 0;-webkit-overflow-scrolling:touch}
.weather-grid::-webkit-scrollbar{height:6px}
.weather-grid::-webkit-scrollbar-track{background:transparent}
.weather-grid::-webkit-scrollbar-thumb{background:#90caf9;border-radius:3px}
.weather-grid.weather-center{justify-content:center}
.weather-item{flex:0 0 auto;min-width:110px;max-width:130px;background:#fff;border-radius:12px;padding:14px 12px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.1);transition:transform .2s ease}
.weather-item:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.15)}
.weather-icon{font-size:2rem;margin-bottom:4px}
.weather-city{font-weight:600;color:#1565c0;font-size:.9rem}
.weather-city-placeholder{visibility:hidden}
.weather-condition{color:#757575;font-size:.85rem}
.weather-temp{color:#424242;font-size:.85rem;margin-top:4px}
.weather-day{font-size:.75rem;color:#9e9e9e;margin-top:8px;padding-top:8px;border-top:1px dashed #e0e0e0}
    `.trim();
  }

  _parseWeatherData(fullMatch, content) {
    const dayRegex = /<day>([^<]+)<\/day>/g;
    const items = [];
    const center = fullMatch.includes('center');
    let m;

    while ((m = dayRegex.exec(content)) !== null) {
      const parts = m[1].split('|');
      if (parts.length >= 4) {
        let day, city, icon, condition, temp;
        if (parts.length === 4) {
          // 无城市：日期 | 图标 | 天气 | 温度
          day = parts[0].trim();
          city = null;
          icon = parts[1].trim();
          condition = parts[2].trim();
          temp = parts[3].trim();
        } else {
          // 有城市：日期 | 城市 | 图标 | 天气 | 温度
          day = parts[0].trim();
          city = parts[1].trim();
          icon = parts[2].trim();
          condition = parts[3].trim();
          temp = parts[4].trim();
        }
        items.push({ day, city, icon, condition, temp });
      }
    }

    return items.length > 0 ? { items, center } : null;
  }
}

module.exports = WeatherHandler;
