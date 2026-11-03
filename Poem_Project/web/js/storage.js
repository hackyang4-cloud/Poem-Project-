/* ============================================================
   storage.js — 本地存档与设置
   ============================================================ */
const Store = (() => {
  const KEY_SETTINGS = 'ctsy.settings';
  const KEY_SAVES = 'ctsy.saves';
  const KEY_AFFECTION = 'ctsy.affection';
  const KEY_PROGRESS = 'ctsy.progress';
  const KEY_STATS = 'ctsy.stats';        /* 统计：互动次数等 */
  const KEY_DAILY = 'ctsy.daily';        /* 每日互动记录 */

  const DEFAULTS = {
    fontSize: 26,
    animation: true,
    sound: true,
    autoPlay: false,
    lineSpeed: 1,
    reduceMotion: false,
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* 隐私模式，忽略 */ }
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  return {
    get settings() {
      return Object.assign({}, DEFAULTS, read(KEY_SETTINGS, {}));
    },
    set settings(v) {
      write(KEY_SETTINGS, Object.assign({}, this.settings, v));
    },

    get saves() {
      return read(KEY_SAVES, []);
    },
    set saves(v) {
      write(KEY_SAVES, v);
    },

    /** 好感度按诗词 id 分开记录，最大 999 */
    get affection() {
      return read(KEY_AFFECTION, {});
    },
    set affection(v) {
      write(KEY_AFFECTION, v);
    },
    addAffection(poemId, delta) {
      const map = this.affection;
      const old = map[poemId] || 0;
      const next = Math.max(0, Math.min(999, old + delta));
      map[poemId] = next;
      this.affection = map;

      /* 统计互动 */
      const stats = this.stats;
      stats.totalInteractions = (stats.totalInteractions || 0) + 1;
      if (delta > 0) stats.totalAffection = (stats.totalAffection || 0) + delta;
      this.stats = stats;

      return { val: next, old, leveledUp: getLevel(next) > getLevel(old) };
    },

    /** 阅读进度：每首诗读到第几句 */
    get progress() {
      return read(KEY_PROGRESS, {});
    },
    set progress(v) {
      write(KEY_PROGRESS, v);
    },
    setProgress(poemId, index) {
      const p = this.progress;
      p[poemId] = index;
      this.progress = p;
    },

    /** 统计数据 */
    get stats() {
      return read(KEY_STATS, { totalInteractions: 0, totalAffection: 0, poemsRead: [] });
    },
    set stats(v) {
      write(KEY_STATS, v);
    },
    markPoemRead(poemId) {
      const s = this.stats;
      if (!s.poemsRead) s.poemsRead = [];
      if (!s.poemsRead.includes(poemId)) s.poemsRead.push(poemId);
      this.stats = s;
    },

    /** 每日互动记录：防止刷好感 */
    get daily() {
      return read(KEY_DAILY, {});
    },
    set daily(v) {
      write(KEY_DAILY, v);
    },
    /** 检查今日某项互动是否已用过，返回 true=可用 */
    checkDaily(action, poemId = '_global') {
      const d = this.daily;
      const key = `${poemId}.${action}`;
      return d[key] !== todayKey();
    },
    /** 标记今日已用过某项互动 */
    markDaily(action, poemId = '_global') {
      const d = this.daily;
      d[`${poemId}.${action}`] = todayKey();
      this.daily = d;
    },

    clearAll() {
      [KEY_SETTINGS, KEY_SAVES, KEY_AFFECTION, KEY_PROGRESS, KEY_STATS, KEY_DAILY]
        .forEach(k => localStorage.removeItem(k));
    },
  };

  /** 好感等级计算（供外部调用） */
  function getLevel(val) {
    if (val >= 100) return 5;
    if (val >= 90) return 4;
    if (val >= 70) return 3;
    if (val >= 45) return 2;
    if (val >= 20) return 1;
    return 0;
  }
})();

/** 好感等级公共定义 */
const AFFECTION_LEVELS = [
  { lv: 0, min: 0,   name: '陌路', color: '#8a9bb8',
    desc: '夜风还很凉，你们只是擦肩而过。',
    perk: '诗人偶尔搭话' },
  { lv: 1, min: 20,  name: '初见', color: '#a0c4e8',
    desc: '月色正好，你愿意停下来听。',
    perk: '解锁点击闲聊' },
  { lv: 2, min: 45,  name: '同游', color: '#c9a0e8',
    desc: '庭下如水，你们已是同路的人。',
    perk: '解锁诗人心情显示' },
  { lv: 3, min: 70,  name: '知交', color: '#e8c9a0',
    desc: '不必多言，一个眼神就够了。',
    perk: '解锁专属对话' },
  { lv: 4, min: 90,  name: '忘年', color: '#e8a0b8',
    desc: '此夜尽欢，天涯只隔一段月光。',
    perk: '解锁藏头诗' },
  { lv: 5, min: 100, name: '千古', color: '#ffd700',
    desc: '但少闲人如吾两人者耳——你我皆是。',
    perk: '全部解锁' },
];

function getAffectionLevel(val) {
  return [...AFFECTION_LEVELS].reverse().find(l => val >= l.min) || AFFECTION_LEVELS[0];
}

