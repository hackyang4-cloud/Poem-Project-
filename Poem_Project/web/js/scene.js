/* ============================================================
   scene.js — 星空、视差与场景交互
   ============================================================ */
const Scene = (() => {
  let starsEl, moonEl, poetEl, towerEl;
  let parallaxTargets = [];
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  function makeStars(count = 130) {
    if (!starsEl) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const size = Math.random() * 2.4 + 0.6;
      s.className = 'star';
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (Math.random() * 100) + '%';
      s.style.top = (Math.random() * 88) + '%';
      s.style.setProperty('--dur', (2.5 + Math.random() * 4) + 's');
      s.style.setProperty('--delay', (Math.random() * 5) + 's');
      s.style.setProperty('--o', (0.25 + Math.random() * 0.7).toFixed(2));
      frag.appendChild(s);
    }
    starsEl.appendChild(frag);
  }

  function init() {
    starsEl = document.getElementById('stars');
    moonEl = document.getElementById('moon');
    poetEl = document.getElementById('poet');
    towerEl = document.getElementById('tower');

    makeStars();

    parallaxTargets = [
      { el: moonEl, depth: 8 },
      { el: towerEl, depth: 16 },
      { el: poetEl, depth: 22 },
    ];

    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('deviceorientation', e => {
      if (e.gamma == null) return;
      mouseX = Math.max(-1, Math.min(1, e.gamma / 30));
      mouseY = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
    }, true);

    loop();
  }

  function loop() {
    currentX += (mouseX - currentX) * 0.045;
    currentY += (mouseY - currentY) * 0.045;

    parallaxTargets.forEach(t => {
      if (!t.el) return;
      t.el.style.transform =
        `translate3d(${currentX * t.depth}px, ${currentY * t.depth * 0.5}px, 0)`;
    });

    requestAnimationFrame(loop);
  }

  function onMoonTap() {
    if (!moonEl) return;
    moonEl.classList.remove('moon-tapped');
    void moonEl.offsetWidth;
    moonEl.classList.add('moon-tapped');
  }

  return { init, onMoonTap };
})();
