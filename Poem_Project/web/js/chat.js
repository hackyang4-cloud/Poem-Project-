/* ============================================================
   chat.js — 诗人闲聊系统
   诗词之外的对话：随机搭话、点击诗人时的回应、好感度联动
   ============================================================ */
const Chat = (() => {
  /* 闲聊语料库 —— 按场景分类，可自由扩展 */
  const BANK = {
    /* 闲置时诗人会主动冒出来的话（每隔一段时间随机一句） */
    idle: [
      '夜深了，露水重了。',
      '你听——风过竹梢。',
      '月光落在肩上，有些凉。',
      '今夜的月亮，比昨日圆些。',
      '走吧，再去前庭看看。',
      '不必说话。看着就好。',
      '你来了？站近些。',
      '塔影斜了，怕是快三更了。',
      '这棵柏树，怕是有百年了。',
      '嘘——别惊了月色。',
    ],

    /* 点击诗人身体时的回应（比单纯念诗句更有性格） */
    tap: [
      '别推我，我看月呢。',
      '做什么？又不是唱戏的。',
      '你戳我作甚？自己看诗去。',
      '手放规矩些。',
      '哎——我方才想到一句，被你打断了。',
      '怎么，嫌我话少？',
      '你再戳，我可要念经了。',
      '……嗯？何事？',
      '年轻人，莫要浮躁。',
      '好好好，陪你看，陪你看。',
    ],

    /* 在塔上点击时的回应 */
    tower: [
      '那塔，白日里也见过，不如夜里有味。',
      '塔上有人否？怕是早就睡了。',
      '你看那窗——像不像一只眼？',
    ],

    /* 在枯枝上点击时的回应 */
    branch: [
      '这枝子，冬天也不落叶，是个硬骨头。',
      '别折它。它比我俩都活得久。',
      '枝头有霜，小心别碰——湿得很。',
    ],

    /* 好感度等级提升时触发 */
    rankUp: [
      '哦？你还在。难得。',
      '你我倒像是旧识了。',
      '再坐坐吧。天亮还早。',
      '此后你若再来，我等你。',
    ],

    /* 播放结束时额外的告别语（好感越高越亲昵） */
    farewell: [
      '今夜就到这里。明日再来？',
      '你去吧。月光替我送你。',
      '路上小心。别忘了今晚的月。',
      '……嗯，别走太远。',
    ],
  };

  /* 按好感度分级的额外闲聊 */
  const RANK_LINES = {
    0: [  /* 陌路 */
      '……你站在那里做什么？',
      '夜深了，公子何事不归？',
    ],
    20: [ /* 初见 */
      '你倒是个有闲心的人。',
      '这月亮，你可也常看？',
    ],
    45: [ /* 同游 */
      '走走走，庭下那片月光好得很。',
      '你我同行，倒也不算寂寞。',
    ],
    70: [ /* 知交 */
      '不必拘礼。坐。',
      '今晚的诗，念给你听可好？',
    ],
    90: [ /* 忘年 */
      '但少闲人如吾两人者耳。',
      '有你同看，这月才算没白费。',
    ],
  };

  let lastIdle = 0;
  const used = new Set();

  function pick(arr) {
    if (!arr || !arr.length) return '';
    /* 尽量不重复，用尽后再轮回 */
    const fresh = arr.filter(s => !used.has(s));
    const pool = fresh.length ? fresh : arr;
    const s = pool[Math.floor(Math.random() * pool.length)];
    used.add(s);
    if (used.size > 30) { const k = used.values().next().value; used.delete(k); }
    return s;
  }

  /* 获取当前好感等级对应的话 */
  function rankLine(affection) {
    const keys = Object.keys(RANK_LINES).map(Number).sort((a, b) => b - a);
    for (const k of keys) {
      if (affection >= k) return pick(RANK_LINES[k]);
    }
    return '';
  }

  /* 主动搭话：每隔一段时间触发一次 */
  function maybeIdle(onSay) {
    const now = Date.now();
    if (now - lastIdle < 18000) return;  /* 至少 18 秒一次 */
    if (Math.random() > 0.35) return;     /* 35% 概率触发 */
    lastIdle = now;
    onSay(pick(BANK.idle));
  }

  function startIdleLoop(onSay) {
    setInterval(() => maybeIdle(onSay), 12000);
  }

  /* 各场景的点击回应 */
  function onPoetTap() { return pick(BANK.tap); }
  function onTowerTap() { return pick(BANK.tower); }
  function onBranchTap() { return pick(BANK.branch); }
  function onFarewell() { return pick(BANK.farewell); }
  function onRankUp() { return pick(BANK.rankUp); }

  return {
    startIdleLoop,
    onPoetTap, onTowerTap, onBranchTap, onFarewell, onRankUp,
    rankLine,
  };
})();
