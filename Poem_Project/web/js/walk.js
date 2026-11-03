/* ============================================================
   walk.js — 夜游引擎 + 小游戏
   两阶段流程：
     阶段1 朗诵 — PoemEngine 逐句播放 narration，背景随诗句描述变化
     阶段2 夜游 — 玩家与诗人对话、选择、小游戏
     结局 — 好感达 100 → 亲吻(承天寺) / 温暖收束(野望) → 测验
   支持多首诗，每首有独立的 SCENE_VISUALS 配置
   ============================================================ */
const Walk = (() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    scene: document.querySelector('.scene'),
    poet: $('poet'),
    dialogue: $('dialogue'),
    dialogueText: $('dialogueText'),
    nameplate: $('nameplate'),
    nameplateText: $('nameplateText'),
    playBtn: $('playBtn'),
    continueBtn: $('continueBtn'),
    moon: $('moon'),
    tower: $('tower'),
    branchLeft: document.querySelector('.branch-left'),
    branchRight: document.querySelector('.branch-right'),
    stars: $('stars'),
    bambooGrove: $('bambooGrove'),
    stonePath: $('stonePath'),
    templeGate: $('templeGate'),
    stonePavilion: $('stonePavilion'),
    /* 野望场景元素 */
    sunset: $('sunset'),
    autumnTrees: $('autumnTrees'),
    distantHills: $('distantHills'),
    villagePath: $('villagePath'),
    calf: $('calf'),
    huntHorse: $('huntHorse'),
    villageLights: $('villageLights'),
    /* 小游戏 */
    mgLayer: $('minigameLayer'),
    mgTitle: $('mgTitle'),
    mgDesc: $('mgDesc'),
    mgScore: $('mgScore'),
    mgTimer: $('mgTimer'),
    mgPlay: $('mgPlay'),
    mgDone: $('mgDone'),
  };

  /* 每个场景的完整视觉配置 */
  const SCENE_VISUALS = {
    bedroom: {
      tint: 'linear-gradient(180deg,rgba(50,38,22,.45) 0%,rgba(30,22,12,.3) 100%)',
      moonOpacity: '0.3', moonScale: '0.6', moonTop: '8%', moonLeft: '70%',
      towerOpacity: '0', branchOpacity: '0.2', starsOpacity: '0.3',
      poetBottom: '22vh', fogOpacity: '0.3',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
    },
    road: {
      tint: 'linear-gradient(180deg,rgba(15,25,50,.4) 0%,rgba(10,18,40,.5) 100%)',
      moonOpacity: '0.85', moonScale: '0.85', moonTop: '12%', moonLeft: '50%',
      towerOpacity: '0.3', towerRight: '-12vw', branchOpacity: '0.6', starsOpacity: '0.8',
      poetBottom: '20vh', fogOpacity: '0.5',
      bamboo: false, stonePath: true, gate: false, pavilion: false,
    },
    'temple-gate': {
      tint: 'linear-gradient(180deg,rgba(10,18,12,.55) 0%,rgba(5,12,8,.4) 100%)',
      moonOpacity: '0.7', moonScale: '0.7', moonTop: '10%', moonLeft: '40%',
      towerOpacity: '0', towerRight: '0vw', branchOpacity: '0.5', starsOpacity: '0.6',
      poetBottom: '20vh', fogOpacity: '0.6',
      bamboo: false, stonePath: true, gate: true, pavilion: false,
    },
    courtyard: {
      tint: 'linear-gradient(180deg,rgba(20,32,55,.25) 0%,rgba(15,25,45,.35) 100%)',
      moonOpacity: '1', moonScale: '1', moonTop: '15%', moonLeft: '50%',
      towerOpacity: '0.4', towerRight: '6vw', branchOpacity: '0.9', starsOpacity: '1',
      poetBottom: '20vh', fogOpacity: '0.7',
      bamboo: true, stonePath: true, gate: false, pavilion: false,
    },
    'courtyard-deep': {
      tint: 'linear-gradient(180deg,rgba(8,14,30,.55) 0%,rgba(5,10,22,.65) 100%)',
      moonOpacity: '0.6', moonScale: '0.5', moonTop: '22%', moonLeft: '68%',
      towerOpacity: '0.2', towerRight: '8vw', branchOpacity: '0.75', starsOpacity: '0.7',
      poetBottom: '18vh', fogOpacity: '0.8',
      bamboo: true, stonePath: false, gate: false, pavilion: true,
      /* 野望元素全关 */
      sunset: false, autumnTrees: false, hills: false, vpath: false, calf: false, horse: false, lights: false,
    },
    /* === 野望场景 === */
    'dusk-ridge': {
      tint: 'linear-gradient(180deg,rgba(60,30,15,.4) 0%,rgba(30,18,10,.5) 100%)',
      moonOpacity: '0', moonScale: '0.5', moonTop: '10%', moonLeft: '50%',
      towerOpacity: '0', towerRight: '6vw', branchOpacity: '0.3', starsOpacity: '0.15',
      poetBottom: '20vh', fogOpacity: '0.4',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
      sunset: true, autumnTrees: false, hills: true, vpath: false, calf: false, horse: false, lights: false,
    },
    'autumn-trees': {
      tint: 'linear-gradient(180deg,rgba(50,25,12,.35) 0%,rgba(25,15,8,.45) 100%)',
      moonOpacity: '0', moonScale: '0.5', moonTop: '10%', moonLeft: '60%',
      towerOpacity: '0', towerRight: '6vw', branchOpacity: '0.4', starsOpacity: '0.2',
      poetBottom: '20vh', fogOpacity: '0.5',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
      sunset: true, autumnTrees: true, hills: true, vpath: false, calf: false, horse: false, lights: false,
    },
    'sunset-hills': {
      tint: 'linear-gradient(180deg,rgba(80,35,15,.3) 0%,rgba(40,20,10,.4) 100%)',
      moonOpacity: '0', moonScale: '0.5', moonTop: '8%', moonLeft: '50%',
      towerOpacity: '0', towerRight: '6vw', branchOpacity: '0.4', starsOpacity: '0.25',
      poetBottom: '20vh', fogOpacity: '0.6',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
      sunset: true, autumnTrees: true, hills: true, vpath: false, calf: false, horse: false, lights: false,
    },
    'pasture': {
      tint: 'linear-gradient(180deg,rgba(35,20,15,.45) 0%,rgba(15,10,8,.55) 100%)',
      moonOpacity: '0.2', moonScale: '0.4', moonTop: '8%', moonLeft: '72%',
      towerOpacity: '0', towerRight: '6vw', branchOpacity: '0.3', starsOpacity: '0.4',
      poetBottom: '20vh', fogOpacity: '0.7',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
      sunset: false, autumnTrees: true, hills: true, vpath: true, calf: true, horse: true, lights: false,
    },
    'night-fall': {
      tint: 'linear-gradient(180deg,rgba(10,12,20,.55) 0%,rgba(5,8,16,.65) 100%)',
      moonOpacity: '0.7', moonScale: '0.75', moonTop: '12%', moonLeft: '55%',
      towerOpacity: '0', towerRight: '6vw', branchOpacity: '0.3', starsOpacity: '0.7',
      poetBottom: '20vh', fogOpacity: '0.8',
      bamboo: false, stonePath: false, gate: false, pavilion: false,
      sunset: false, autumnTrees: true, hills: true, vpath: true, calf: false, horse: false, lights: true,
    },
  };

  /* 承天寺场景也补野望元素全关标记（统一处理） */
  ['bedroom','road','temple-gate','courtyard','courtyard-deep'].forEach(k => {
    const v = SCENE_VISUALS[k];
    if (!('sunset' in v)) { v.sunset=false; v.autumnTrees=false; v.hills=false; v.vpath=false; v.calf=false; v.horse=false; v.lights=false; }
  });

  let poem = null;
  let phase = 'idle';
  let currentScene = null;
  let dlgIdx = 0;
  let awaitingChoice = false;
  let onAffectionChange = null;
  let onComplete = null;
  let minigamePlayed = new Set();
  let pendingMinigameAfter = null;

  /* ---------- 场景视觉切换 ---------- */
  function setSceneBg(bg) {
    const cfg = SCENE_VISUALS[bg] || SCENE_VISUALS.courtyard;

    let overlay = document.getElementById('walkOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'walkOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;transition:all 1.5s ease;';
      els.scene.appendChild(overlay);
    }
    overlay.style.background = cfg.tint;

    if (els.moon) {
      els.moon.style.transition = 'all 1.5s ease';
      els.moon.style.opacity = cfg.moonOpacity;
      els.moon.style.transform = `translateX(-50%) scale(${cfg.moonScale})`;
      els.moon.style.top = cfg.moonTop;
      els.moon.style.left = cfg.moonLeft;
    }
    if (els.tower) {
      els.tower.style.transition = 'all 1.5s ease';
      els.tower.style.opacity = cfg.towerOpacity;
      els.tower.style.right = cfg.towerRight || '6vw';
    }
    if (els.branchLeft) {
      els.branchLeft.style.transition = 'opacity 1.5s ease';
      els.branchLeft.style.opacity = cfg.branchOpacity;
    }
    if (els.branchRight) {
      els.branchRight.style.transition = 'opacity 1.5s ease';
      els.branchRight.style.opacity = cfg.branchOpacity;
    }
    if (els.stars) {
      els.stars.style.transition = 'opacity 1.5s ease';
      els.stars.style.opacity = cfg.starsOpacity;
    }
    document.querySelectorAll('.fog').forEach(f => {
      f.style.transition = 'opacity 1.5s ease';
      f.style.opacity = cfg.fogOpacity;
    });

    /* 新场景元素 — 承天寺 */
    if (els.bambooGrove) els.bambooGrove.classList.toggle('show', cfg.bamboo);
    if (els.stonePath) els.stonePath.classList.toggle('show', cfg.stonePath);
    if (els.templeGate) els.templeGate.classList.toggle('show', cfg.gate);
    if (els.stonePavilion) els.stonePavilion.classList.toggle('show', cfg.pavilion);

    /* 新场景元素 — 野望 */
    if (els.sunset) els.sunset.classList.toggle('show', cfg.sunset);
    if (els.autumnTrees) els.autumnTrees.classList.toggle('show', cfg.autumnTrees);
    if (els.distantHills) els.distantHills.classList.toggle('show', cfg.hills);
    if (els.villagePath) els.villagePath.classList.toggle('show', cfg.vpath);
    if (els.calf) els.calf.classList.toggle('show', cfg.calf);
    if (els.huntHorse) els.huntHorse.classList.toggle('show', cfg.horse);
    if (els.villageLights) els.villageLights.classList.toggle('show', cfg.lights);

    if (els.poet) {
      els.poet.style.transition = 'all 1.2s ease';
      els.poet.style.bottom = cfg.poetBottom;
    }
  }

  /* ---------- 打字机 ---------- */
  function typeText(text, onDone) {
    const speed = Store.settings.animation ? 32 / Store.settings.lineSpeed : 1;
    PoemEngine.typeInto(els.dialogueText, text, speed, onDone);
  }

  function showSpeaker(who) {
    els.nameplateText.textContent = who;
    els.nameplate.hidden = false;
    els.nameplate.classList.add('walk-nameplate');
  }

  function showContinueBtn() {
    if (awaitingChoice) { els.continueBtn.hidden = true; return; }
    els.continueBtn.hidden = false;
  }
  function hideContinueBtn() { els.continueBtn.hidden = true; }

  /* ---------- 选项按钮 ---------- */
  function showChoices(choices) {
    awaitingChoice = true;
    hideContinueBtn();
    const cursor = els.dialogueText.querySelector('.cursor');
    if (cursor) cursor.remove();

    let box = document.getElementById('choiceBox');
    if (box) box.remove();
    box = document.createElement('div');
    box.id = 'choiceBox';
    box.className = 'choice-box';

    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => makeChoice(c));
      box.appendChild(btn);
    });

    els.dialogue.parentElement.insertBefore(box, els.dialogue.nextSibling);
    Sfx.open();
  }

  function makeChoice(choice) {
    awaitingChoice = false;
    const box = document.getElementById('choiceBox');
    if (box) box.remove();

    if (choice.aff && onAffectionChange) onAffectionChange(choice.aff);

    if (choice.reply) {
      showSpeaker('旁白');
      hideContinueBtn();
      typeText(choice.reply, () => {
        /* 检查目标场景是否有未玩过的小游戏 */
        const mg = findMinigameForScene(choice.next);
        if (mg && !minigamePlayed.has(mg.id)) {
          showContinueBtn();
          pendingMinigameAfter = () => startMinigame(mg, () => goToScene(choice.next));
        } else {
          showContinueBtn();
          pendingMinigameAfter = () => goToScene(choice.next);
        }
      });
    } else {
      setTimeout(() => goToScene(choice.next), 300);
    }
  }

  /* ---------- 小游戏查找 ---------- */
  function findMinigameForScene(sceneId) {
    if (!poem.minigames) return null;
    return poem.minigames.find(m => m.scene === sceneId);
  }

  /* ---------- 场景跳转 ---------- */
  function goToScene(sceneId) {
    if (sceneId === 'ending') { showEnding(); return; }
    currentScene = poem.walk.scenes.find(s => s.id === sceneId);
    if (!currentScene) { console.error('场景缺失:', sceneId); return; }

    setSceneBg(currentScene.bg);
    hideContinueBtn();

    if (currentScene.narrator) {
      showSpeaker('旁白');
      typeText(currentScene.narrator, () => {
        showContinueBtn();
        dlgIdx = 0;
        waitForAdvance(() => playNextDialogue());
      });
    } else {
      dlgIdx = 0;
      playNextDialogue();
    }
  }

  function playNextDialogue() {
    hideContinueBtn();
    if (!currentScene || dlgIdx >= currentScene.dialogue.length) {
      if (currentScene && currentScene.choices && currentScene.choices.length) {
        showChoices(currentScene.choices);
      }
      return;
    }
    const dlg = currentScene.dialogue[dlgIdx];
    showSpeaker(dlg.who);
    Sfx.line();
    typeText(dlg.text, () => {
      dlgIdx++;
      showContinueBtn();
      waitForAdvance(() => playNextDialogue());
    });

    if (dlg.who !== '旁白' && dlg.emo) {
      els.poet.className = 'poet';
      els.poet.classList.add('emo-' + dlg.emo);
    }
  }

  /* ---------- 推进控制 ---------- */
  let advanceResolver = null;
  function waitForAdvance(fn) { advanceResolver = fn; }
  function advance() {
    if (PoemEngine.finishTyping()) return true;
    if (advanceResolver) {
      const fn = advanceResolver;
      advanceResolver = null;
      hideContinueBtn();
      fn();
      return true;
    }
    if (pendingMinigameAfter) {
      const fn = pendingMinigameAfter;
      pendingMinigameAfter = null;
      fn();
      return true;
    }
    return false;
  }

  /* ============================================================
     小游戏引擎
     ============================================================ */

  function startMinigame(mg, onCompleteFn) {
    els.mgTitle.textContent = mg.title;
    els.mgDesc.textContent = mg.desc;
    els.mgDone.hidden = true;
    els.mgPlay.innerHTML = '';
    els.mgLayer.hidden = false;
    Sfx.open();

    if (mg.type === 'catch') runCatchGame(mg, onCompleteFn);
    else if (mg.type === 'fill') runFillGame(mg, onCompleteFn);
    else if (mg.type === 'find') runFindGame(mg, onCompleteFn);
  }

  /* --- 捉月光 --- */
  function runCatchGame(mg, done) {
    let caught = 0;
    const target = mg.target;
    const timeLimit = mg.time;
    let timeLeft = timeLimit;
    let timerId = null;
    let active = true;

    els.mgScore.textContent = `捕捉: 0/${target}`;
    els.mgTimer.textContent = `⏱ ${timeLeft}s`;

    timerId = setInterval(() => {
      timeLeft--;
      els.mgTimer.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 0) {
        active = false;
        clearInterval(timerId);
        finishCatch();
      }
    }, 1000);

    function spawnSpark() {
      if (!active) return;
      const spark = document.createElement('div');
      spark.className = mg.id === 'catch-leaves' ? 'leaf-spark' : 'moon-spark';
      const w = els.mgPlay.clientWidth;
      const h = els.mgPlay.clientHeight;
      spark.style.left = (20 + Math.random() * (w - 60)) + 'px';
      spark.style.top = (20 + Math.random() * (h - 60)) + 'px';
      spark.style.transition = 'left 3s ease, top 3s ease';
      els.mgPlay.appendChild(spark);

      spark.addEventListener('click', () => {
        if (spark.classList.contains('caught')) return;
        spark.classList.add('caught');
        caught++;
        els.mgScore.textContent = `捕捉: ${caught}/${target}`;
        Sfx.heart();
        setTimeout(() => spark.remove(), 500);
        if (caught >= target) {
          active = false;
          clearInterval(timerId);
          finishCatch();
        }
      });

      /* 光斑移动 */
      setTimeout(() => {
        if (!spark.parentNode) return;
        spark.style.left = (20 + Math.random() * (w - 60)) + 'px';
        spark.style.top = (20 + Math.random() * (h - 60)) + 'px';
      }, 100);

      setTimeout(() => { if (spark.parentNode) spark.remove(); }, 4000);
    }

    const spawnId = setInterval(spawnSpark, 800);
    setTimeout(spawnSpark, 200);

    function finishCatch() {
      clearInterval(spawnId);
      const success = caught >= target;
      els.mgPlay.innerHTML = '';
      const isLeaves = mg.id === 'catch-leaves';
      const successMsg = isLeaves
        ? `✦ 接住了 ${caught} 片秋叶！<br>王绩心暖了几分。`
        : `✦ 捕捉了 ${caught} 缕月光！<br>苏轼心念更切。`;
      const failMsg = isLeaves
        ? `时间到——只接住 ${caught} 片。<br>不过没关系，落叶仍会再来。`
        : `时间到——只捉到 ${caught} 缕。<br>不过没关系，月色仍在。`;
      els.mgPlay.innerHTML = `<div style="display:grid;place-items:center;height:100%;font-family:var(--font-cn);font-size:18px;color:${success ? 'var(--gold)' : '#ff9d9d'};">
        ${success ? successMsg : failMsg}
      </div>`;
      els.mgDone.hidden = false;
      if (success && mg.reward && onAffectionChange) onAffectionChange(mg.reward);
      minigamePlayed.add(mg.id);
      els.mgDone.onclick = () => {
        els.mgLayer.hidden = true;
        done();
      };
    }
  }

  /* --- 填诗 --- */
  function runFillGame(mg, done) {
    let correctCount = 0;
    els.mgScore.textContent = `补字: 0/${mg.items.length}`;
    els.mgTimer.textContent = '';

    mg.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'fill-item';
      row.innerHTML = `<span>${item.before}</span><input class="fill-input" data-idx="${i}" maxlength="4" placeholder="？"><span>${item.after}</span>`;
      els.mgPlay.appendChild(row);
    });

    const inputs = els.mgPlay.querySelectorAll('.fill-input');
    inputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        const val = input.value.trim();
        const answer = mg.items[i].answer;
        if (val === answer) {
          input.classList.add('correct');
          input.classList.remove('wrong');
          input.disabled = true;
          correctCount++;
          els.mgScore.textContent = `补字: ${correctCount}/${mg.items.length}`;
          Sfx.correct();
          checkAllDone();
        } else if (val.length >= answer.length) {
          input.classList.add('wrong');
        } else {
          input.classList.remove('wrong');
        }
      });
    });
    inputs[0]?.focus();

    function checkAllDone() {
      if (correctCount >= mg.items.length) {
        els.mgPlay.innerHTML = `<div style="display:grid;place-items:center;height:100%;font-family:var(--font-cn);font-size:18px;color:var(--gold);">
          ✦ 全文补齐！<br>「但少闲人如吾两人者耳。」
        </div>`;
        els.mgDone.hidden = false;
        if (mg.reward && onAffectionChange) onAffectionChange(mg.reward);
        minigamePlayed.add(mg.id);
        els.mgDone.onclick = () => {
          els.mgLayer.hidden = true;
          done();
        };
      }
    }

    /* 允许跳过 */
    els.mgDone.hidden = false;
    els.mgDone.textContent = '跳过 ▸';
    els.mgDone.onclick = () => {
      els.mgLayer.hidden = true;
      els.mgDone.textContent = '继续 ▸';
      minigamePlayed.add(mg.id);
      done();
    };
    /* 完成后改回 */
    const origCheck = checkAllDone;
  }

  /* --- 寻影 --- */
  function runFindGame(mg, done) {
    let found = 0;
    const target = mg.target;
    const timeLimit = mg.time;
    let timeLeft = timeLimit;
    let timerId = null;
    let active = true;

    els.mgScore.textContent = `找到: 0/${target}`;
    els.mgTimer.textContent = `⏱ ${timeLeft}s`;

    timerId = setInterval(() => {
      timeLeft--;
      els.mgTimer.textContent = `⏱ ${timeLeft}s`;
      if (timeLeft <= 0) {
        active = false;
        clearInterval(timerId);
        finishFind();
      }
    }, 1000);

    /* 放置竹柏影子目标 */
    for (let i = 0; i < target; i++) {
      const shadow = document.createElement('div');
      shadow.className = 'shadow-target';
      const w = els.mgPlay.clientWidth;
      const h = els.mgPlay.clientHeight;
      shadow.style.left = (40 + Math.random() * (w - 100)) + 'px';
      shadow.style.top = (40 + Math.random() * (h - 100)) + 'px';
      shadow.style.animation = `fogDrift ${8 + Math.random() * 6}s ease-in-out infinite`;
      shadow.addEventListener('click', () => {
        if (shadow.classList.contains('found')) return;
        shadow.classList.add('found');
        found++;
        els.mgScore.textContent = `找到: ${found}/${target}`;
        Sfx.heart();
        if (found >= target) {
          active = false;
          clearInterval(timerId);
          finishFind();
        }
      });
      els.mgPlay.appendChild(shadow);
    }

    /* 添加干扰项 */
    for (let i = 0; i < 5; i++) {
      const decoy = document.createElement('div');
      decoy.style.cssText = 'position:absolute;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,rgba(80,80,80,.3),transparent);';
      const w = els.mgPlay.clientWidth;
      const h = els.mgPlay.clientHeight;
      decoy.style.left = (40 + Math.random() * (w - 80)) + 'px';
      decoy.style.top = (40 + Math.random() * (h - 80)) + 'px';
      els.mgPlay.appendChild(decoy);
    }

    function finishFind() {
      const success = found >= target;
      els.mgPlay.innerHTML = '';
      const isLanterns = mg.id === 'find-lanterns';
      const successMsg = isLanterns
        ? `✦ 找到了 ${found} 处灯火！<br>那就是「归处」。`
        : `✦ 找到了 ${found} 处竹柏影子！<br>「盖竹柏影也。」`;
      const failMsg = isLanterns
        ? `时间到——找到 ${found} 处。<br>灯火仍在，归处亦在。`
        : `时间到——找到 ${found} 处。<br>月色仍在，影亦仍在。`;
      els.mgPlay.innerHTML = `<div style="display:grid;place-items:center;height:100%;font-family:var(--font-cn);font-size:18px;color:${success ? 'var(--gold)' : '#ff9d9d'};">
        ${success ? successMsg : failMsg}
      </div>`;
      els.mgDone.hidden = false;
      els.mgDone.textContent = '继续 ▸';
      if (success && mg.reward && onAffectionChange) onAffectionChange(mg.reward);
      minigamePlayed.add(mg.id);
      els.mgDone.onclick = () => {
        els.mgLayer.hidden = true;
        done();
      };
    }
  }

  /* ---------- 朗诵阶段背景变化 ---------- */
  function onReciteLine(idx, entry) {
    if (!poem || !poem.reciteScenes) return;
    const mapping = poem.reciteScenes.find(r => r.idx === idx);
    if (mapping && mapping.bg) {
      setSceneBg(mapping.bg);
    }
  }

  /* ---------- 结局 ---------- */
  function showEnding() {
    phase = 'ended';
    const end = poem.walk.ending;

    const p = PoemEngine.getPoem();
    const cur = Store.affection[p.id] || 0;
    if (cur < 100) {
      const remain = 100 - cur;
      Store.addAffection(p.id, remain);
      if (onAffectionChange) onAffectionChange(remain);
    }

    /* 结局背景 = 最后一幕的背景 */
    const lastScene = poem.walk.scenes[poem.walk.scenes.length - 1];
    setSceneBg(lastScene ? lastScene.bg : 'courtyard-deep');
    hideContinueBtn();
    dlgIdx = 0;

    if (end.narrator) {
      showSpeaker('旁白');
      typeText(end.narrator, () => {
        showContinueBtn();
        waitForAdvance(() => playEndingDialogue());
      });
    } else {
      playEndingDialogue();
    }
  }

  function playEndingDialogue() {
    hideContinueBtn();
    const end = poem.walk.ending;
    if (dlgIdx >= end.dialogue.length) {
      if (end.kiss) triggerKiss();
      else if (end.endingType === 'warm-glow') triggerWarmGlow();
      else finishWalk();
      return;
    }
    const dlg = end.dialogue[dlgIdx];
    showSpeaker(dlg.who);
    Sfx.line();
    typeText(dlg.text, () => {
      dlgIdx++;
      showContinueBtn();
      waitForAdvance(() => playEndingDialogue());
    });
    if (dlg.emo) {
      els.poet.className = 'poet';
      els.poet.classList.add('emo-' + dlg.emo);
    }
  }

  function triggerKiss() {
    hideContinueBtn();
    els.poet.classList.add('kiss-animate');
    const heart = document.createElement('div');
    heart.className = 'kiss-hearts';
    heart.innerHTML = '♡ ❤ ♡ ❤ ♡';
    els.poet.appendChild(heart);

    Sfx.heart();
    setTimeout(() => Sfx.heart(), 500);
    setTimeout(() => Sfx.heart(), 1000);

    showSpeaker('苏轼');
    typeText('……怀民。今夜多谢你。往后的事不好说——但今晚这个月亮，和你，我记一辈子。', () => {
      setTimeout(() => {
        els.poet.classList.remove('kiss-animate');
        if (heart.parentNode) heart.remove();
        finishWalk();
      }, 3500);
    });
  }

  /* 野望式温暖结局 — 无亲吻，灯下搁笔 */
  function triggerWarmGlow() {
    hideContinueBtn();
    els.poet.classList.add('emo-warm');
    Sfx.heart();
    showSpeaker(poem.author || '诗人');
    const lastLine = poem.walk.ending.dialogue[poem.walk.ending.dialogue.length - 1];
    typeText(lastLine ? lastLine.text : '……写完了。', () => {
      setTimeout(() => finishWalk(), 3000);
    });
  }

  function finishWalk() {
    Store.markPoemRead(poem.id);
    if (onComplete) onComplete();
  }

  /* ---------- 启动夜游（阶段2） ---------- */
  function startWalk(p, callbacks) {
    poem = p;
    phase = 'walking';
    onAffectionChange = callbacks.onAffectionChange;
    onComplete = callbacks.onComplete;
    minigamePlayed = new Set();

    els.playBtn.classList.add('is-playing');
    els.continueBtn.addEventListener('click', advance);
    els.dialogue.addEventListener('click', onDialogueClick);

    goToScene(poem.walk.scenes[0].id);
  }

  function onDialogueClick(e) {
    if (e.target.closest('.dialogue-more')) return;
    if (e.target.closest('#choiceBox')) return;
    if (awaitingChoice) return;
    if (!els.mgLayer.hidden) return;
    advance();
  }

  return {
    startWalk,
    advance,
    onReciteLine,
    get phase() { return phase; },
    reset() {
      phase = 'idle';
      currentScene = null;
      dlgIdx = 0;
      awaitingChoice = false;
      advanceResolver = null;
      pendingMinigameAfter = null;
      minigamePlayed = new Set();

      const box = document.getElementById('choiceBox');
      if (box) box.remove();
      const overlay = document.getElementById('walkOverlay');
      if (overlay) overlay.style.background = 'transparent';

      els.poet.className = 'poet';
      els.poet.style.cssText = '';
      if (els.moon) els.moon.style.cssText = '';
      if (els.tower) els.tower.style.cssText = '';
      if (els.branchLeft) els.branchLeft.style.opacity = '';
      if (els.branchRight) els.branchRight.style.opacity = '';
      if (els.stars) els.stars.style.opacity = '';
      document.querySelectorAll('.fog').forEach(f => f.style.opacity = '');

      /* 承天寺元素 */
      if (els.bambooGrove) els.bambooGrove.classList.remove('show');
      if (els.stonePath) els.stonePath.classList.remove('show');
      if (els.templeGate) els.templeGate.classList.remove('show');
      if (els.stonePavilion) els.stonePavilion.classList.remove('show');
      /* 野望元素 */
      if (els.sunset) els.sunset.classList.remove('show','sinking');
      if (els.autumnTrees) els.autumnTrees.classList.remove('show');
      if (els.distantHills) els.distantHills.classList.remove('show');
      if (els.villagePath) els.villagePath.classList.remove('show');
      if (els.calf) els.calf.classList.remove('show');
      if (els.huntHorse) els.huntHorse.classList.remove('show');
      if (els.villageLights) els.villageLights.classList.remove('show');

      els.mgLayer.hidden = true;
      hideContinueBtn();
      els.continueBtn.removeEventListener('click', advance);
      els.dialogue.removeEventListener('click', onDialogueClick);
    },
  };
})();
