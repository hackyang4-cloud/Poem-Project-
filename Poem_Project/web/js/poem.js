/* ============================================================
   poem.js — 诗词加载与"夜游"播放引擎（视觉小说式）
   ============================================================ */
const PoemEngine = (() => {
  let index = null;
  let poem = null;
  let cache = {};

  let playing = false;
  let timers = [];
  let lineIndex = -1;
  let typing = null;
  let onLineCallback = null;
  let onEndCallback = null;
  let onLineStartCallback = null;

  /* ---------------- 数据加载 ---------------- */

  async function loadIndex() {
    const res = await fetch('data/index.json', { cache: 'no-store' });
    index = await res.json();
    return index;
  }

  async function loadPoem(id) {
    if (cache[id]) return cache[id];
    const entry = index.poems.find(p => p.id === id);
    if (!entry) throw new Error('找不到诗词: ' + id);
    const res = await fetch(`data/${entry.file}`, { cache: 'no-store' });
    const data = await res.json();
    cache[id] = data;
    return data;
  }

  async function usePoem(id) {
    const data = await loadPoem(id);
    poem = data;
    lineIndex = -1;
    return data;
  }

  function getPoem() { return poem; }
  function getIndex() { return index; }

  /* ---------------- 播放控制 ---------------- */

  function clearTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
    if (typing) { clearInterval(typing.timer); typing = null; }
  }

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function start(opts = {}) {
    if (!poem) return;
    clearTimers();
    playing = true;
    lineIndex = -1;

    const speed = opts.speed || 1;
    const script = poem.narration || [];

    script.forEach((entry, i) => {
      later(() => {
        if (!playing) return;
        showLine(entry.s, i, script.length);
        if (onLineStartCallback) onLineStartCallback(i, entry, script.length);
      }, entry.t * 1000 / speed);
    });

    later(() => {
      if (!playing) return;
      playing = false;
      if (onEndCallback) onEndCallback();
    }, (script.length ? script[script.length - 1].t + 6 : 1) * 1000 / speed);
  }

  function stop() {
    playing = false;
    clearTimers();
  }

  function next() {
    if (!poem) return;
    const script = poem.narration || [];
    const cur = script[lineIndex];
    const target = (cur ? cur.t : 0) + 4;
    const nextEntry = script.find(e => e.t > target);
    if (nextEntry) {
      showLine(nextEntry.s, script.indexOf(nextEntry), script.length);
    }
  }

  /* 跳过朗诵，直接进入夜游 */
  function skipToWalk() {
    playing = false;
    clearTimers();
    const script = poem.narration || [];
    if (script.length) {
      const last = script[script.length - 1];
      showLine(last.s, script.length - 1, script.length);
    }
  }

  function showLine(text, idx, total) {
    lineIndex = idx;
    if (onLineCallback) onLineCallback(text, idx, total);
  }

  /* ---------------- 打字机 ---------------- */

  function typeInto(el, text, speed = 34, onDone) {
    if (typing) { clearInterval(typing.timer); typing = null; }
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.appendChild(cursor);

    let i = 0;
    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer);
        typing = null;
        if (onDone) onDone();
        return;
      }
      cursor.remove();
      el.textContent += text[i];
      el.appendChild(cursor);
      i++;
      if (i % 3 === 0) Sfx.tick();
    }, speed);
    typing = { el, text, i, timer };
  }

  function finishTyping() {
    if (!typing) return false;
    clearInterval(typing.timer);
    typing.el.textContent = typing.text;
    typing = null;
    return true;
  }

  /* ---------------- 事件 ---------------- */

  function onLine(fn) { onLineCallback = fn; }
  function onEnd(fn) { onEndCallback = fn; }
  function onLineStart(fn) { onLineStartCallback = fn; }

  return {
    loadIndex, loadPoem, usePoem, getPoem, getIndex,
    start, stop, next, skipToWalk, typeInto, finishTyping,
    onLine, onEnd, onLineStart,
    get playing() { return playing; },
    get lineIndex() { return lineIndex; },
  };
})();
