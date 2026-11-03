/* ============================================================
   panels.js — 右侧面板：读诗 / 存档 / 设置 / 好感
   ============================================================ */
const Panels = (() => {
  const layer = document.getElementById('panelLayer');
  const titleEl = document.getElementById('panelTitle');
  const bodyEl = document.getElementById('panelBody');
  const scrim = document.getElementById('panelScrim');
  const closeBtn = document.getElementById('panelClose');

  let current = null;

  const TITLES = { read: '读诗', poems: '诗选', archive: '存档', settings: '设置', affection: '好感' };

  function open(name) {
    current = name;
    titleEl.textContent = TITLES[name] || name;
    render(name);
    layer.hidden = false;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.panel === name);
    });
    Sfx.open();
  }

  function close() {
    layer.hidden = true;
    current = null;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  }

  function render(name) {
    switch (name) {
      case 'read': renderRead(); break;
      case 'poems': renderPoems(); break;
      case 'archive': renderArchive(); break;
      case 'settings': renderSettings(); break;
      case 'affection': renderAffection(); break;
    }
  }

  /* ================= 诗选 ================= */
  async function renderPoems() {
    const idx = PoemEngine.getIndex();
    const cur = PoemEngine.getPoem();
    bodyEl.innerHTML = '<div class="p-empty">正在取诗…</div>';

    const items = idx.poems.map(entry => ({ entry, id: entry.id }));
    const loaded = [];
    for (const it of items) {
      try { loaded.push({ ...it, poem: await PoemEngine.loadPoem(it.id) }); }
      catch (e) { /* 跳过损坏的数据 */ }
    }

    const cards = loaded.map(({ id, poem }) => {
      const aff = Store.affection[id] || 0;
      const isCur = cur && cur.id === id;
      return `
        <div class="poem-card ${isCur ? 'cur' : ''}" data-id="${id}">
          <div class="poem-card-main">
            <div class="poem-card-title">${poem.title}</div>
            <div class="poem-card-sub">${poem.subtitle || ''}</div>
            <div class="poem-card-desc">${(poem.summary || '').slice(0, 52)}…</div>
          </div>
          <div class="poem-card-side">
            <div class="poem-card-aff">${aff}</div>
            <div class="poem-card-affl">好感</div>
          </div>
        </div>`;
    }).join('');

    bodyEl.innerHTML = `
      <section class="p-section">
        <div class="p-label">诗 选 · 共 ${loaded.length} 首</div>
        ${cards || '<div class="p-empty">暂无诗词</div>'}
      </section>
      <section class="p-section">
        <div class="p-label">怎 么 加 诗</div>
        <div class="p-card">
          <h3>三 步</h3>
          <p>1. 在 <code>web/data/poems/</code> 新建一个 JSON 文件<br>
          2. 照抄 <code>chengtiansi.json</code> 的结构填写<br>
          3. 在 <code>web/data/index.json</code> 的 poems 数组里加一行<br>
          <code>{ "id": "你的id", "file": "poems/你的id.json" }</code><br>
          保存后刷新页面，这首诗就会出现在这里。</p>
        </div>
      </section>`;

    bodyEl.querySelectorAll('.poem-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.dataset.id;
        if (cur && cur.id === id) { close(); return; }
        await window.dispatchEvent(new CustomEvent('poem:switch', { detail: id }));
        close();
      });
    });
  }

  /* ================= 读诗 ================= */
  function renderRead() {
    const p = PoemEngine.getPoem();
    if (!p) { bodyEl.innerHTML = '<div class="p-empty">尚未载入诗词</div>'; return; }

    const linesHtml = p.lines.map((l, i) => {
      const cls = ['v-line'];
      if (l.type === 'meta') cls.push('meta');
      if (l.type === 'highlight') cls.push('highlight');
      return `<div class="${cls.join(' ')}" data-idx="${i}">${l.text}</div>`;
    }).join('');

    const notesHtml = p.lines.map(l => `
      <div class="note-item">
        <div class="note-no">${l.no}</div>
        <div class="note-body">
          <div class="note-text">${l.text}</div>
          <div class="note-desc">${l.note || ''}</div>
        </div>
      </div>`).join('');

    const transHtml = p.lines.filter(l => l.translation).map(l => `
      <div class="translation-box" style="margin-bottom:10px">
        <p style="color:rgba(232,201,138,.85);font-family:var(--font-cn)">${l.text}</p>
        <p>${l.translation}</p>
      </div>`).join('');

    const charsHtml = (p.characters || []).map(c => `
      <div class="char-card">
        <div class="char-word">${c.char}</div>
        <div class="char-pinyin">${c.pinyin}</div>
        <div class="char-mean">${c.meaning}</div>
      </div>`).join('');

    const metaHtml = [
      ['朝代', p.dynasty], ['作者', p.author], ['时地', p.era],
      ['地点', p.location], ['心境', p.mood],
    ].filter(x => x[1]).map(([k, v]) => `
      <div class="meta-cell">
        <div class="meta-k">${k}</div>
        <div class="meta-v">${v}</div>
      </div>`).join('');

    const tagsHtml = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

    bodyEl.innerHTML = `
      <section class="p-section">
        <div class="p-label">全 诗 竖 排</div>
        <div class="vertical-poem" id="vPoem">${linesHtml}</div>
        <div class="btn-row" style="margin-top:14px">
          <button class="btn" id="btnPlayPoem">▶ 夜游朗读</button>
          <button class="btn ghost" id="btnReveal">逐句显示</button>
          <button class="btn ghost" id="btnSave">存档</button>
        </div>
      </section>

      <section class="p-section">
        <div class="p-label">全 文</div>
        <div class="p-card"><p class="poem-full">${p.fullText}</p></div>
      </section>

      <section class="p-section">
        <div class="p-label">诗 词 背 景</div>
        <div class="p-card"><p>${p.summary}</p></div>
      </section>

      ${metaHtml ? `<section class="p-section">
        <div class="p-label">诗 词 信 息</div>
        <div class="meta-grid">${metaHtml}</div>
      </section>` : ''}

      ${tagsHtml ? `<section class="p-section">
        <div class="p-label">标 签</div>
        <div class="tag-list">${tagsHtml}</div>
      </section>` : ''}

      ${transHtml ? `<section class="p-section">
        <div class="p-label">译 文</div>
        ${transHtml}
      </section>` : ''}

      <section class="p-section">
        <div class="p-label">逐 句 赏 析</div>
        ${notesHtml}
      </section>

      ${charsHtml ? `<section class="p-section">
        <div class="p-label">字 词</div>
        <div class="char-grid">${charsHtml}</div>
      </section>` : ''}

      <section class="p-section">
        <div class="p-label">小 试 身 手</div>
        <button class="btn" id="btnQuiz">${(p.quiz || []).length} 道题 →</button>
      </section>
    `;

    const vLines = [...bodyEl.querySelectorAll('.v-line')];
    let revealed = 0;
    const revealNext = () => {
      if (revealed >= vLines.length) { revealAll(); return; }
      vLines[revealed].classList.add('show');
      vLines[revealed].classList.remove('dim');
      revealed++;
      vLines.forEach((el, i) => { if (i >= revealed) el.classList.add('dim'); });
    };
    const revealAll = () => {
      vLines.forEach(el => { el.classList.add('show'); el.classList.remove('dim'); });
      revealed = vLines.length;
    };

    bodyEl.querySelector('#btnReveal').addEventListener('click', revealNext);
    bodyEl.querySelector('#btnPlayPoem').addEventListener('click', () => {
      revealAll(); close();
      window.dispatchEvent(new CustomEvent('poem:play'));
    });
    bodyEl.querySelector('#btnSave').addEventListener('click', () => {
      saveCurrent();
      window.dispatchEvent(new CustomEvent('toast', { detail: '已存档' }));
    });

    const quizBtn = bodyEl.querySelector('#btnQuiz');
    if (quizBtn) quizBtn.addEventListener('click', () => {
      close();
      window.dispatchEvent(new CustomEvent('poem:quiz'));
    });

    // 点击诗句细读 → 加好感
    const readSet = new Set();
    vLines.forEach(el => {
      el.addEventListener('click', () => {
        const idx = +el.dataset.idx;
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 1400);
        if (readSet.has(idx)) return;
        readSet.add(idx);
        window.dispatchEvent(new CustomEvent('affection:add', { detail: 5 }));
        showLineNote(idx);
      });
    });

    function showLineNote(idx) {
      const line = p.lines[idx];
      if (!line || !line.note) return;
      const card = document.createElement('div');
      card.className = 'p-card';
      card.style.marginTop = '12px';
      card.innerHTML = `<h3>${line.text}</h3><p>${line.note}</p>`;
      const anchor = bodyEl.querySelector('#vPoem');
      anchor.after(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    vLines.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('show');
        vLines.forEach((x, j) => { if (j > i) x.classList.add('dim'); });
      }, 200 + i * 220);
    });
  }

  function saveCurrent() {
    const p = PoemEngine.getPoem();
    if (!p) return;
    const saves = Store.saves;
    saves.unshift({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      line: PoemEngine.lineIndex,
      time: new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
    Store.saves = saves.slice(0, 20);
  }

  /* ================= 存档 ================= */
  function renderArchive() {
    const saves = Store.saves;
    const progress = Store.progress;

    if (!saves.length) {
      bodyEl.innerHTML = `
        <div class="p-empty">
          还没有存档。<br><br>
          在「读诗」面板中点击 <b style="color:var(--gold)">存档</b>，<br>
          即可记录此刻读到的位置。
        </div>`;
      return;
    }

    const rows = saves.map((s, i) => `
      <div class="save-item">
        <div class="save-info">
          <div class="save-name">${s.title || '未命名'}</div>
          <div class="save-meta">${s.subtitle || ''} · 第 ${(s.line || 0) + 1} 句 · ${s.time || ''}</div>
        </div>
        <button class="btn ghost" data-load="${i}" style="padding:7px 14px;font-size:12.5px">继续</button>
        <button class="save-del" data-del="${i}">删除</button>
      </div>`).join('');

    const progRows = Object.entries(progress).map(([id, idx]) => `
      <div class="save-item">
        <div class="save-info">
          <div class="save-name">${id}</div>
          <div class="save-meta">读到第 ${idx + 1} 句</div>
        </div>
      </div>`).join('');

    bodyEl.innerHTML = `
      <section class="p-section">
        <div class="p-label">手 动 存 档</div>
        ${rows}
      </section>
      ${progRows ? `<section class="p-section">
        <div class="p-label">阅 读 进 度</div>
        ${progRows}
      </section>` : ''}
      <section class="p-section">
        <button class="btn danger" id="btnClearSaves">清空全部存档</button>
      </section>`;

    bodyEl.querySelectorAll('[data-load]').forEach(b => {
      b.addEventListener('click', () => {
        const s = saves[+b.dataset.load];
        window.dispatchEvent(new CustomEvent('poem:resume', { detail: s }));
        close();
      });
    });

    bodyEl.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', () => {
        const list = Store.saves;
        list.splice(+b.dataset.del, 1);
        Store.saves = list;
        renderArchive();
      });
    });

    const clear = bodyEl.querySelector('#btnClearSaves');
    if (clear) clear.addEventListener('click', () => {
      Store.saves = [];
      renderArchive();
    });
  }

  /* ================= 设置 ================= */
  function renderSettings() {
    const s = Store.settings;

    bodyEl.innerHTML = `
      <section class="p-section">
        <div class="p-label">显 示</div>
        <div class="set-row">
          <div>
            <div class="set-label">诗文字号</div>
            <div class="set-desc">竖排正文的字号</div>
          </div>
          <div class="set-ctl">
            <button class="step-btn" id="fsDown">−</button>
            <span class="fs-val" id="fsVal">${s.fontSize}px</span>
            <button class="step-btn" id="fsUp">+</button>
          </div>
        </div>
        <div class="set-row">
          <div>
            <div class="set-label">背景动效</div>
            <div class="set-desc">星空、雾气、月光的呼吸动画</div>
          </div>
          <div class="set-ctl"><div class="switch ${s.animation ? 'on' : ''}" id="swAnim"></div></div>
        </div>
        <div class="set-row">
          <div>
            <div class="set-label">音效</div>
            <div class="set-desc">古琴风格的环境音与打字声</div>
          </div>
          <div class="set-ctl"><div class="switch ${s.sound ? 'on' : ''}" id="swSound"></div></div>
        </div>
      </section>

      <section class="p-section">
        <div class="p-label">朗 读</div>
        <div class="set-row">
          <div>
            <div class="set-label">语速</div>
            <div class="set-desc">台词与动画的推进速度</div>
          </div>
          <div class="set-ctl">
            <div class="seg">
              <button data-speed="0.75" class="${s.lineSpeed === 0.75 ? 'on' : ''}">慢</button>
              <button data-speed="1" class="${s.lineSpeed === 1 ? 'on' : ''}">中</button>
              <button data-speed="1.5" class="${s.lineSpeed === 1.5 ? 'on' : ''}">快</button>
            </div>
          </div>
        </div>
        <div class="set-row">
          <div>
            <div class="set-label">自动播放</div>
            <div class="set-desc">进入页面后自动开始夜游</div>
          </div>
          <div class="set-ctl"><div class="switch ${s.autoPlay ? 'on' : ''}" id="swAuto"></div></div>
        </div>
      </section>

      <section class="p-section">
        <div class="p-label">数 据</div>
        <div class="btn-row">
          <button class="btn ghost" id="btnResetProgress">重置阅读进度</button>
          <button class="btn danger" id="btnResetAll">清除全部数据</button>
        </div>
      </section>

      <section class="p-section">
        <div class="p-label">关 于</div>
        <div class="p-card">
          <h3>诗词夜游</h3>
          <p>一个本地运行的古诗词互动小站。当前收录《${PoemEngine.getPoem()?.title || ''}》。<br>
          新增诗词：在 <code>web/data/poems/</code> 下放入 JSON 文件，
          再到 <code>web/data/index.json</code> 里登记一行即可。</p>
        </div>
      </section>
    `;

    const fsVal = bodyEl.querySelector('#fsVal');
    const setFs = (v) => {
      const val = Math.max(16, Math.min(42, v));
      Store.settings = { fontSize: val };
      document.documentElement.style.setProperty('--fs-poem', val + 'px');
      fsVal.textContent = val + 'px';
    };
    bodyEl.querySelector('#fsDown').addEventListener('click', () => setFs(Store.settings.fontSize - 2));
    bodyEl.querySelector('#fsUp').addEventListener('click', () => setFs(Store.settings.fontSize + 2));

    const bindSwitch = (id, key, after) => {
      const el = bodyEl.querySelector(id);
      el.addEventListener('click', () => {
        const on = !el.classList.contains('on');
        el.classList.toggle('on', on);
        Store.settings = { [key]: on };
        if (after) after(on);
      });
    };
    bindSwitch('#swAnim', 'animation', (on) => {
      document.querySelectorAll('.star,.moon,.fog,.poet-arm,.tower-window,.moon-halo')
        .forEach(el => { el.style.animationPlayState = on ? 'running' : 'paused'; });
    });
    bindSwitch('#swSound', 'sound', (on) => { Sfx.enabled = on; });
    bindSwitch('#swAuto', 'autoPlay');

    bodyEl.querySelectorAll('[data-speed]').forEach(b => {
      b.addEventListener('click', () => {
        const v = parseFloat(b.dataset.speed);
        Store.settings = { lineSpeed: v };
        bodyEl.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b));
      });
    });

    bodyEl.querySelector('#btnResetProgress').addEventListener('click', () => {
      Store.progress = {};
      window.dispatchEvent(new CustomEvent('toast', { detail: '阅读进度已重置' }));
      renderSettings();
    });

    bodyEl.querySelector('#btnResetAll').addEventListener('click', () => {
      if (!confirm('确定清除全部数据？包括存档、好感度与设置。')) return;
      Store.clearAll();
      window.dispatchEvent(new CustomEvent('toast', { detail: '数据已清空' }));
      renderSettings();
    });
  }

  /* ================= 好感 ================= */
  function renderAffection() {
    const p = PoemEngine.getPoem();
    const id = p ? p.id : 'unknown';
    const val = Store.affection[id] || 0;
    const level = getAffectionLevel(val);
    const nextLevel = AFFECTION_LEVELS.find(l => l.lv === level.lv + 1);
    const stats = Store.stats;

    /* 各等级解锁状态 */
    const levelsHtml = AFFECTION_LEVELS.map(l => {
      const unlocked = val >= l.min;
      const isCur = l.lv === level.lv;
      return `
        <div class="level-row ${unlocked ? 'unlocked' : ''} ${isCur ? 'cur' : ''}">
          <div class="level-name" style="color:${unlocked ? l.color : '#555'}">${l.name}</div>
          <div class="level-min">${l.min}</div>
          <div class="level-perk ${unlocked ? '' : 'locked'}">${unlocked ? l.perk : '???'}</div>
        </div>`;
    }).join('');

    bodyEl.innerHTML = `
      <section class="p-section">
        <div class="affection-wrap">
          <div class="affection-num" style="color:${level.color}">${val}</div>
          <div class="affection-label">${p ? p.author : ''} 对你的好感</div>
          <div class="affection-bar"><div class="affection-fill" style="width:${val}%;background:${level.color}"></div></div>
          <div class="affection-rank" style="color:${level.color}">${level.name}</div>
          <div class="affection-hint">${level.desc}</div>
          ${nextLevel ? `<div class="affection-hint">再获得 ${nextLevel.min - val} 点 → 「${nextLevel.name}」</div>` : '<div class="affection-hint">已达最高等级 ✦</div>'}
        </div>
      </section>

      <section class="p-section">
        <div class="p-label">好 感 等 级</div>
        ${levelsHtml}
      </section>

      <section class="p-section">
        <div class="p-label">怎 么 赚 好 感</div>
        <div class="p-card"><h3>共 游 一 夜</h3><p>完整听完一遍夜游朗读：+15</p></div>
        <div class="p-card"><h3>点 亮 竹 柏 之 影</h3><p>在「读诗」中点击诗句细读：+5（每句一次）</p></div>
        <div class="p-card"><h3>小 试 身 手</h3><p>答对题目：+10，全对额外 +5</p></div>
        <div class="p-card"><h3>抬 头 看 月</h3><p>点击月亮：+3（每日一次）</p></div>
        <div class="p-card"><h3>戳 戳 诗 人</h3><p>点击诗人搭话：30% 概率 +1</p></div>
      </section>

      <section class="p-section">
        <div class="p-label">互 动 统 计</div>
        <div class="stats-grid">
          <div class="stat-cell">
            <div class="stat-num">${stats.totalInteractions || 0}</div>
            <div class="stat-label">互动次数</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num">${stats.totalAffection || 0}</div>
            <div class="stat-label">累计好感</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num">${(stats.poemsRead || []).length}</div>
            <div class="stat-label">读过的诗</div>
          </div>
        </div>
      </section>

      ${level.lv >= 4 ? `
      <section class="p-section">
        <div class="p-label">藏 头 诗 · 已 解 锁</div>
        <div class="p-card">
          <p style="font-family:var(--font-cn);font-size:17px;line-height:2;color:var(--gold);letter-spacing:.08em">「但少闲人如吾两人者耳。」</p>
        </div>
      </section>` : `
      <section class="p-section">
        <div class="p-label">???</div>
        <div class="p-card"><p style="color:rgba(200,215,250,.35)">好感达到「忘年」(90) 后解锁……</p></div>
      </section>`}
    `;
  }

  function refreshAffection() {
    if (current === 'affection') renderAffection();
  }

  /* ================= 绑定 ================= */
  function init() {
    scrim.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !layer.hidden) close();
    });
  }

  return { init, open, close, refreshAffection, saveCurrent, get current() { return current; } };
})();
