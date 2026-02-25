/**
 * 元数据收集器
 * 负责跟踪文档状态和收集 section/article 级别的元数据
 */

class MetaCollector {
  constructor() {
    // 文档状态跟踪
    this.state = {
      inHeadline: true,
      inSection: false,
      inArticles: false,
      sectionIndex: -1,
      articleIndex: 0,
      hasHeadMarker: false
    };

    // 当前元数据
    this.currentMeta = {
      from: null,
      fromStr: null,
      tags: [],
      icon: null,
      intro: null,
      articleMeta: []
    };

    // 当前文章元数据
    this.currentArticleMeta = null;

    // 收集结果
    this.sectionArticleMeta = [];
    this.headlineTags = [];
    this.headFrom = null;

    // dataBlock 位置跟踪
    this.currentDataBlockPosition = 'headline';
    this.headlineDataBlocks = [];
    this.sectionDataBlocks = [];
    this.articleDataBlocks = [];

    // weather 数据
    this.weather = [];
    
    // headline 级别摘要
    this.headlineSum = null;
    this.headlineThink = null;
  }

  /**
   * 处理标记标签触发状态变化
   * @param {string} markerName - 标记名称 (head, section, articles)
   */
  onMarker(markerName) {
    switch (markerName) {
    case 'head':
      this.state.hasHeadMarker = true;
      break;

    case 'section':
      // 保存当前文章的元数据到当前 section
      if (this.state.inArticles && this.currentArticleMeta) {
        this._saveArticleMeta();
        this.currentArticleMeta = null;
      }
        
      this.state.sectionIndex++;
      this.state.inSection = true;
      this.state.inArticles = false;
      this.state.articleIndex = 0;
      this.currentDataBlockPosition = 'section';
      // 创建新的当前元数据
      this.currentMeta = {
        from: null,
        fromStr: null,
        tags: [],
        icon: null,
        intro: null,
        articleMeta: []
      };
      // 立即保存一个空占位，以便 markdownParser.js 可以通过索引访问
      this.sectionArticleMeta.push(this.currentMeta);
      break;

    case 'articles':
      this.state.inArticles = true;
      break;

    default:
      break;
    }
  }

  /**
   * 处理 # 标题标记
   * @param {number} level - 标题级别 (1 或 2)
   */
  onHeading(level) {
    if (level === 1 && this.state.inHeadline && this.state.hasHeadMarker) {
      // 头版头条结束
      this.state.inHeadline = false;
    } else if (level === 1 && this.state.inSection) {
      // section 内的 # 标题，保存当前文章元数据
      if (this.currentArticleMeta) {
        this._saveArticleMeta();
      }
      if (this.state.inArticles) {
        this._saveCurrentMeta();
        this.currentMeta = {
          from: null,
          fromStr: null,
          tags: [],
          icon: null,
          intro: null,
          articleMeta: []
        };
      }
      this.state.inArticles = false;
      this.currentArticleMeta = null;
      this.currentDataBlockPosition = 'section';
    } else if (level === 2 && this.state.inSection && this.state.inArticles) {
      // ## 标题，新文章开始
      if (this.currentArticleMeta) {
        this._saveArticleMeta();
      }
      this.state.articleIndex++;
      this.currentArticleMeta = {
        from: null,
        fromStr: null,
        tags: [],
        isFirstArticle: this.currentMeta.articleMeta.length === 0
      };
      this.currentDataBlockPosition = 'article';
    }
  }

  /**
   * 收集行内标签元数据
   * @param {string} name - 标签名称
   * @param {string} value - 标签值
   * @param {Object} context - 上下文信息
   */
  collect(name, value, _context = {}) {
    const { inArticles, inSection, inHeadline } = this.state;

    switch (name) {
    case 'tag':
      if (inArticles) {
        if (!this.currentArticleMeta) {
          this.currentArticleMeta = {
            from: null,
            fromStr: null,
            tags: [],
            isFirstArticle: false
          };
        }
        this.currentArticleMeta.tags.push(value);
      } else if (inSection) {
        // 注意：inSection 优先级高于 inHeadline
        this.currentMeta.tags.push(value);
      } else if (inHeadline) {
        this.headlineTags.push(value);
      }
      break;

    case 'from':
      if (inArticles) {
        if (!this.currentArticleMeta) {
          this.currentArticleMeta = {
            from: null,
            fromStr: null,
            tags: [],
            isFirstArticle: false
          };
        }
        this.currentArticleMeta.from = value;
      } else if (inSection) {
        // 注意：inSection 优先级高于 inHeadline
        this.currentMeta.from = value;
      } else if (inHeadline) {
        // 头版头条的 from 需要保存到 headFrom
        this.headFrom = value;
      }
      break;

    case 'fromstr':
      if (inArticles) {
        if (!this.currentArticleMeta) {
          this.currentArticleMeta = {
            from: null,
            fromStr: null,
            tags: [],
            isFirstArticle: false
          };
        }
        this.currentArticleMeta.fromStr = value;
      } else if (inSection) {
        this.currentMeta.fromStr = value;
      }
      break;

    case 'intro':
      if (inSection && !inArticles) {
        this.currentMeta.intro = value;
      }
      break;

    case 'icon':
      if (inSection && !inArticles) {
        this.currentMeta.icon = value;
      }
      break;

    case 'sum':
      // 摘要可以出现在任何地方（headline、section、article）
      // 注意：inHeadline 在遇到第一个#标题后就会变为 false，所以使用 !inSection && !inArticles 来判断 headline 区域
      if (!inSection && !inArticles) {
        // headline 级别（包括#标题之后的区域）
        this.headlineSum = value;
      } else if (inArticles && this.currentArticleMeta && this._articleMetaHasContent()) {
        // 文章级别（只有当有实际内容时）
        this.currentArticleMeta.sum = value;
      } else {
        // section 级别（默认）
        this.currentMeta.sum = value;
      }
      break;

    case 'think':
      // 观点可以出现在任何地方（headline、section、article）
      // 注意：inHeadline 在遇到第一个#标题后就会变为 false，所以使用 !inSection && !inArticles 来判断 headline 区域
      if (!inSection && !inArticles) {
        // headline 级别（包括#标题之后的区域）
        this.headlineThink = value;
      } else if (inArticles && this.currentArticleMeta && this._articleMetaHasContent()) {
        // 文章级别（只有当有实际内容时）
        if (!this.currentArticleMeta.thinks) {
          this.currentArticleMeta.thinks = [];
        }
        this.currentArticleMeta.thinks.push(value);
      } else {
        // section 级别（默认）
        if (!this.currentMeta.thinks) {
          this.currentMeta.thinks = [];
        }
        this.currentMeta.thinks.push(value);
      }
      break;

    default:
      break;
    }
  }

  /**
   * 处理 dataBlock
   * @param {Array} data - 解析后的数据
   */
  onDataBlock(data) {
    if (this.currentDataBlockPosition === 'headline') {
      this.headlineDataBlocks.push(data);
    } else if (this.currentDataBlockPosition === 'section') {
      if (!this.sectionDataBlocks[this.state.sectionIndex]) {
        this.sectionDataBlocks[this.state.sectionIndex] = [];
      }
      this.sectionDataBlocks[this.state.sectionIndex].push({
        type: 'section',
        data: data
      });
    } else if (this.currentDataBlockPosition === 'article') {
      if (!this.sectionDataBlocks[this.state.sectionIndex]) {
        this.sectionDataBlocks[this.state.sectionIndex] = [];
      }
      if (!this.articleDataBlocks[this.state.sectionIndex]) {
        this.articleDataBlocks[this.state.sectionIndex] = [];
      }
      const articleIdx = this.articleDataBlocks[this.state.sectionIndex].length;
      this.articleDataBlocks[this.state.sectionIndex].push({
        type: 'article',
        index: articleIdx,
        data: data
      });
    }
  }

  /**
   * 设置 headFrom
   * @param {string} from - 来源
   */
  setHeadFrom(from) {
    this.headFrom = from;
  }

  /**
   * 设置引用块
   * @param {Array} quoteBlocks - 引用块数组
   */
  setQuoteBlocks(quoteBlocks) {
    this.quoteBlocks = quoteBlocks;
  }

  /**
   * 设置天气数据
   * @param {Object} weatherData - 天气数据对象
   */
  setWeather(weatherData) {
    this.weather.push(weatherData);
  }

  /**
   * 获取最终结果
   * @returns {Object} 收集的所有元数据
   */
  getResult() {
    // 保存最后的元数据
    this._finalize();

    return {
      sectionArticleMeta: this.sectionArticleMeta,
      headlineTags: this.headlineTags.length > 0 ? this.headlineTags : undefined,
      headFrom: this.headFrom,
      headlineSum: this.headlineSum,
      headlineThink: this.headlineThink,
      hasHeadMarker: this.state.hasHeadMarker,
      dataBlocks: {
        headline: this.headlineDataBlocks,
        sections: this.sectionDataBlocks.filter((s) => s !== null && s !== undefined),
        articles: this.articleDataBlocks.filter((a) => a !== null && a !== undefined)
      },
      quoteBlocks: this.quoteBlocks,
      weather: this.weather.length > 0 ? this.weather : undefined
    };
  }

  /**
   * 保存当前元数据
   * @private
   */
  _saveCurrentMeta() {
    if (this.currentArticleMeta) {
      this._saveArticleMeta();
    }
    // 注意：currentMeta 已经在 onMarker 中提前 push 到 sectionArticleMeta
    // 这里只需要更新 articleMeta 即可
  }

  /**
   * 判断当前文章元数据是否有实际内容（from/fromStr/tags）
   * 用于区分"文章头部标签区域"和"文章内容区域/章节尾部"
   * @private
   */
  _articleMetaHasContent() {
    if (!this.currentArticleMeta) return false;
    return !!(
      this.currentArticleMeta.from ||
      this.currentArticleMeta.fromStr ||
      this.currentArticleMeta.tags.length > 0
    );
  }

  /**
   * 保存当前文章元数据
   * @private
   */
  _saveArticleMeta() {
    if (
      this.currentArticleMeta &&
      (this.currentArticleMeta.from ||
        this.currentArticleMeta.fromStr ||
        this.currentArticleMeta.tags.length > 0 ||
        this.currentArticleMeta.sum ||
        (this.currentArticleMeta.thinks && this.currentArticleMeta.thinks.length > 0))
    ) {
      // 找到当前 section 的元数据（最后一个 push 的）
      const currentSectionMeta = this.sectionArticleMeta[this.sectionArticleMeta.length - 1];
      if (currentSectionMeta) {
        currentSectionMeta.articleMeta.push({ ...this.currentArticleMeta });
      }
    }
  }

  /**
   *  finalize 处理
   * @private
   */
  _finalize() {
    if (this.state.inSection) {
      this._saveCurrentMeta();
    }
  }
}

module.exports = MetaCollector;
