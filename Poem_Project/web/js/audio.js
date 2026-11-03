/* ============================================================
   audio.js — WebAudio 生成的古风音效（无需音频文件）
   ============================================================ */
const Sfx = (() => {
  let ctx = null;
  let enabled = Store.settings.sound;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** 播放一段音符：[{freq, dur, delay, type, gain}] */
  function play(notes, master = 0.16) {
    if (!enabled) return;
    const ac = ensure();
    if (!ac) return;
    notes.forEach(n => {
      const t0 = ac.currentTime + (n.delay || 0);
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = n.type || 'sine';
      osc.frequency.setValueAtTime(n.freq, t0);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(n.gain || 1, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + n.dur + 0.05);
    });
  }

  /** 古琴五声音阶：宫商角徵羽 */
  const PENT = [261.63, 293.66, 329.63, 392.00, 440.00];

  return {
    set enabled(v) { enabled = v; },
    get enabled() { return enabled; },

    /** 播放按钮：清亮的宫音 */
    start() {
      play([
        { freq: PENT[0], dur: 1.6, delay: 0, type: 'sine', gain: 1 },
        { freq: PENT[1], dur: 1.4, delay: 0.06, type: 'sine', gain: .55 },
        { freq: PENT[2], dur: 1.2, delay: 0.12, type: 'sine', gain: .35 },
      ]);
    },

    /** 每句台词落位 */
    line() {
      play([
        { freq: PENT[Math.floor(Math.random() * 5)], dur: 0.9, delay: 0, type: 'sine', gain: .5 },
        { freq: PENT[2], dur: 0.6, delay: 0.05, type: 'triangle', gain: .18 },
      ]);
    },

    /** 面板打开 */
    open() {
      play([
        { freq: 392, dur: 0.5, type: 'sine', gain: .4 },
        { freq: 523, dur: 0.7, delay: 0.05, type: 'sine', gain: .3 },
      ]);
    },

    /** 好感提升 */
    heart() {
      play([
        { freq: 523, dur: 0.5, type: 'sine', gain: .55 },
        { freq: 659, dur: 0.5, delay: 0.08, type: 'sine', gain: .5 },
        { freq: 784, dur: 0.9, delay: 0.16, type: 'sine', gain: .45 },
      ]);
    },

    /** 答对 */
    correct() {
      play([
        { freq: 659, dur: 0.35, type: 'sine', gain: .6 },
        { freq: 880, dur: 0.6, delay: 0.1, type: 'sine', gain: .5 },
      ]);
    },

    /** 答错 */
    wrong() {
      play([
        { freq: 220, dur: 0.5, type: 'triangle', gain: .5 },
        { freq: 165, dur: 0.7, delay: 0.08, type: 'triangle', gain: .4 },
      ]);
    },

    /** 打字 */
    tick() {
      play([{ freq: 1200 + Math.random() * 400, dur: 0.03, type: 'square', gain: .06 }]);
    },
  };
})();
