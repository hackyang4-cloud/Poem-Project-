/* ============================================================
   main.js — 串联一切
   流程：朗诵 → 夜游 → 结局亲吻 → 测验
   ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    poemTitle: $('poemTitle'),
    poemSub: $('poemSub'),
    nameplateText: $('nameplateText'),
    nameplate: $('nameplate'),
    dialogueText: $('dialogueText'),
    dialogue: $('dialogue'),
    dialogueMore: $('dialogueMore'),
    continueBtn: $('continueBtn'),
    playBtn: $('playBtn'),
    fastBtn: $('fastBtn'),
    skipBtn: $('skipBtn'),
    toast: $('toast'),
    quizLayer: $('quizLayer'),
    quizQ: $('quizQ'),
    quizOptions: $('quizOptions'),
    quizTip: $('quizTip'),
    quizNext: $('quizNext'),
    moon: $('moon'),
    poet: $('poet'),
    moodBubble: $('moodBubble'),
  };

  const state = {
    poem: null,
    phase: 'idle',
    fast: false,
    quizIndex: 0,
    quizRight: 0,
  };

  let toastTimer = null;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2400);
  }
  window.addEventListener('toast', e => toast(e.detail));

  function addAffection(n, opts = {}) {
    const p = state.poem;
    if (!p) return;
    const result = Store.addAffection(p.id, n);
    Sfx.heart();
    if (!opts.silent) toast(`好感 +${n}　当前 ${result.val}`);
    Panels.refreshAffection();
    updateMoodBubble();
    if (result.leveledUp) {
      setTimeout(() => toast(`好感升级！→ ${getAffectionLevel(result.val).name}`), 1200);
    }
    return result.val;
  }
  window.addEventListener('affection:add', e => addAffection(e.detail));

  const MOODS = [
    { max: 20, text: '🌙 发呆中' },
    { max: 45, text: '🍵 喝茶中' },
    { max: 70, text: '🙂 微笑' },
    { max: 90, text: '✨ 愉悦' },
    { max: 999, text: '🌕 旷达' },
  ];

  function updateMoodBubble() {
    const p = state.poem;
    if (!p) { els.moodBubble.hidden = true; return; }
    const val = Store.affection[p.id] || 0;
    if (val < 45) { els.moodBubble.hidden = true; return; }
    const mood = MOODS.find(m => val < m.max) || MOODS[MOODS.length - 1];
    els.moodBubble.textContent = mood.text;
    els.moodBubble.hidden = false;
  }

  function speak(text) {
    const speed = Store.settings.animation ? 34 / Store.settings.lineSpeed : 1;
    PoemEngine.typeInto(els.dialogueText, text, speed);
  }

  function setLine(text) { Sfx.line(); speak(text); }

  /* ====== 阶段1：朗诵 ====== */
  function startReciting() {
    if (state.phase === 'reciting') return;
    state.phase = 'reciting';
    els.playBtn.classList.add('is-playing');
    els.skipBtn.hidden = false;
    els.dialogue.classList.remove('walk-active');
    PoemEngine.start({ speed: state.fast ? 1.6 : Store.settings.lineSpeed });
  }

  function stopReciting() {
    state.phase = 'idle';
    els.playBtn.classList.remove('is-playing');
    els.skipBtn.hidden = true;
    PoemEngine.stop();
  }

  /* 跳过朗诵，直接进入夜游 */
  function skipReciting() {
    if (state.phase !== 'reciting') return;
    PoemEngine.stop();
    PoemEngine.skipToWalk();
    onReciteEnd();
  }

  function onReciteEnd() {
    els.playBtn.classList.remove('is-playing');
    els.skipBtn.hidden = true;
    els.dialogue.classList.add('walk-active');
    els.nameplate.hidden = false;
    els.nameplateText.textContent = '旁白';
    toast('朗诵完毕 — 夜游开始，点击对话继续');
    setTimeout(() => startWalking(), 600);
  }

  /* ====== 阶段2：夜游 ====== */
  function startWalking() {
    state.phase = 'walking';
    Walk.startWalk(state.poem, {
      onAffectionChange: (delta) => {
        addAffection(delta, { silent: delta < 5 });
        if (delta >= 5) toast(`好感 +${delta}`);
      },
      onComplete: () => {
        state.phase = 'ended';
        els.dialogue.classList.remove('walk-active');
        setTimeout(() => {
          toast('夜游结束 — 小试身手');
          startQuiz();
        }, 1500);
      },
    });
  }

  /* ====== 切换诗词 ====== */
  async function switchPoem(id) {
    stopReciting();
    Walk.reset();
    els.skipBtn.hidden = true;
    els.dialogue.classList.remove('walk-active');
    const p = await PoemEngine.usePoem(id);
    state.poem = p;
    state.phase = 'idle';
    els.poemTitle.textContent = p.title;
    els.poemSub.textContent = p.subtitle;
    els.nameplateText.textContent = (p.author || '').split('').join(' ');
    els.nameplate.hidden = true;
    document.title = `诗词夜游 · ${p.title}`;
    els.dialogueText.textContent = p.narration?.[0]?.s || '点击播放，开始夜游。';
    updateMoodBubble();
    toast(`已切换到《${p.title}》`);
    setTimeout(startReciting, 400);
  }

  /* ====== 启动 ====== */
  async function boot() {
    Scene.init();
    Panels.init();
    applySettings();
    await PoemEngine.loadIndex();
    const firstId = PoemEngine.getIndex().poems[0].id;
    const p = await PoemEngine.usePoem(firstId);
    state.poem = p;
    els.poemTitle.textContent = p.title;
    els.poemSub.textContent = p.subtitle;
    els.nameplateText.textContent = (p.author || '').split('').join(' ');
    els.nameplate.hidden = true;
    document.title = `诗词夜游 · ${p.title}`;

    PoemEngine.onLine((text, idx) => { setLine(text); Store.setProgress(p.id, idx); });
    PoemEngine.onLineStart((idx, entry) => { Walk.onReciteLine(idx, entry); });
    PoemEngine.onEnd(() => onReciteEnd());

    els.dialogueText.textContent = p.narration?.[0]?.s || '点击播放，开始夜游。';
    els.skipBtn.hidden = true;
    updateMoodBubble();
    bindEvents();
    setTimeout(startReciting, 800);
  }

  function applySettings() {
    const s = Store.settings;
    document.documentElement.style.setProperty('--fs-poem', s.fontSize + 'px');
    Sfx.enabled = s.sound;
    if (!s.animation) {
      document.querySelectorAll('.star,.moon,.fog,.poet-arm,.tower-window,.moon-halo')
        .forEach(el => { el.style.animationPlayState = 'paused'; });
    }
  }

  /* ====== 事件 ====== */
  function bindEvents() {
    els.playBtn.addEventListener('click', () => {
      if (state.phase === 'idle') startReciting();
      else if (state.phase === 'reciting') stopReciting();
    });

    els.dialogue.addEventListener('click', (e) => {
      if (e.target.closest('.dialogue-more')) return;
      if (e.target.closest('#choiceBox')) return;
      if (state.phase === 'walking') return;
      if (state.phase === 'reciting') { PoemEngine.finishTyping(); return; }
      if (state.phase === 'idle') startReciting();
    });

    els.dialogueMore.addEventListener('click', () => Panels.open('read'));

    els.fastBtn.addEventListener('click', () => {
      state.fast = !state.fast;
      els.fastBtn.classList.toggle('on', state.fast);
      toast(state.fast ? '快进中…' : '恢复正常语速');
    });

    els.skipBtn.addEventListener('click', () => {
      if (state.phase === 'reciting') skipReciting();
    });

    document.querySelectorAll('.nav-item').forEach(b => {
      b.addEventListener('click', () => {
        const name = b.dataset.panel;
        if (Panels.current === name) Panels.close();
        else Panels.open(name);
      });
    });

    $('btnMenu').addEventListener('click', () => Panels.open('read'));

    els.moon.addEventListener('click', () => {
      Scene.onMoonTap();
      if (state.phase === 'walking' || state.phase === 'ended') {
        toast('「今夕清辉，落在竹柏上。」');
      }
    });

    els.poet.addEventListener('click', () => {
      if (state.phase === 'walking' || state.phase === 'ended') return;
      if (state.phase === 'idle') startReciting();
    });

    window.addEventListener('poem:play', () => {
      if (state.phase === 'idle') setTimeout(startReciting, 200);
    });
    window.addEventListener('poem:quiz', () => startQuiz());
    window.addEventListener('poem:switch', async e => { await switchPoem(e.detail); });

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (els.quizLayer.hidden === false) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (state.phase === 'walking') Walk.advance();
        else if (state.phase === 'idle') startReciting();
        else if (state.phase === 'reciting') PoemEngine.finishTyping();
      }
      if (e.key === 'f' || e.key === 'F') els.fastBtn.click();
    });
  }

  /* ====== 测验 ====== */
  function startQuiz() {
    const p = state.poem;
    if (!p || !p.quiz || !p.quiz.length) { toast('这首诗暂无题目'); return; }
    state.quizIndex = 0;
    state.quizRight = 0;
    renderQuiz();
    els.quizLayer.hidden = false;
  }

  function renderQuiz() {
    const p = state.poem;
    const q = p.quiz[state.quizIndex];
    $('quizTitle').textContent = `小试身手 · ${state.quizIndex + 1}/${p.quiz.length}`;
    els.quizQ.textContent = q.q;
    els.quizOptions.innerHTML = '';
    els.quizTip.hidden = true;
    els.quizNext.hidden = true;
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt;
      b.addEventListener('click', () => answer(i, b));
      els.quizOptions.appendChild(b);
    });
  }

  function answer(i, btn) {
    const p = state.poem;
    const q = p.quiz[state.quizIndex];
    const opts = [...els.quizOptions.children];
    opts.forEach((b, j) => { b.disabled = true; if (j === q.answer) b.classList.add('correct'); });
    if (i === q.answer) {
      state.quizRight++;
      Sfx.correct();
      els.quizTip.innerHTML = `<b style="color:var(--gold)">答对了。</b>${q.tip || ''}`;
    } else {
      Sfx.wrong();
      btn.classList.add('wrong');
      els.quizTip.innerHTML = `<b style="color:#ff9d9d">再想想。</b>${q.tip || ''}`;
    }
    els.quizTip.hidden = false;
    els.quizNext.hidden = false;
  }

  els.quizNext.addEventListener('click', () => {
    const p = state.poem;
    state.quizIndex++;
    if (state.quizIndex >= p.quiz.length) {
      els.quizLayer.hidden = true;
      const score = state.quizRight;
      toast(`测验完成：${score}/${p.quiz.length}`);
      if (score === p.quiz.length) addAffection(10);
      return;
    }
    renderQuiz();
  });

  $('quizClose').addEventListener('click', () => { els.quizLayer.hidden = true; });
  els.quizLayer.addEventListener('click', e => {
    if (e.target === els.quizLayer) els.quizLayer.hidden = true;
  });

  /* ====== 启动 ====== */
  boot().catch(err => { console.error(err); toast('载入失败：' + err.message); });
})();
