/* Selected work: one flat 3D card. Each poster has a brand-colour theme (gold / navy / ivory),
   the poster slides in vertically, glossy blobs pop to new spots, the card tilts with the mouse.
   Autoplay, arrows, dots, swipe, keyboard, lightbox. */
(function () {
  var root = document.getElementById('pshow');
  if (!root) return;
  var card = document.getElementById('pcard');
  var pp = Array.prototype.slice.call(root.querySelectorAll('.pp'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.pdot'));
  var blobs = Array.prototype.slice.call(root.querySelectorAll('.pblobs i'));
  var numEl = document.getElementById('pnum');
  var titleEl = document.querySelector('#ptitle span');
  var descEl = document.querySelector('#pdesc span');
  var n = pp.length, cur = 0, timer = null, inView = false, hovering = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var AUTO_MS = 3000, D = 850, EASE = 'cubic-bezier(.65,0,.35,1)', blobTimer = null;

  /* ---------- blob layouts (x / y in % of the poster box, size in px); 3 variants, rotated per poster ---------- */
  var LAYOUTS = [
    [[-62, -34, 92], [64, -48, 58], [58, 38, 42], [-58, 46, 54], [70, 8, 30], [-72, -2, 26]],
    [[60, -30, 84], [-66, -44, 52], [-60, 34, 46], [62, 50, 56], [-70, 6, 28], [72, -4, 24]],
    [[-56, 40, 88], [58, -40, 62], [-66, -26, 40], [66, 30, 50], [8, -62, 30], [-10, 64, 26]]
  ];
  function placeBlobs(i) {
    var L = LAYOUTS[i % LAYOUTS.length];
    var flip = i % 2 ? -1 : 1;
    var order = i % 2 ? [3, 4, 5, 0, 1, 2] : [0, 1, 2, 3, 4, 5];
    blobs.forEach(function (b, k) {
      var s = L[order[k]];
      b.style.transitionDelay = (k * 45) + 'ms';
      b.style.setProperty('--x', (s[0] * flip * (window.innerWidth < 860 ? .8 : 1)).toFixed(0));
      b.style.setProperty('--y', s[1]);
      b.style.setProperty('--s', Math.round(s[2] * (window.innerWidth < 860 ? .72 : 1)) + 'px');
    });
  }

  /* ---------- text swap (left-to-right mask wipe) ---------- */
  function swapText(el, txt, delay) {
    el.textContent = txt;
    if (reduce || !el.animate) return;
    el.animate([{ clipPath: 'inset(0 100% 0 0)', opacity: 0, transform: 'translateY(8px)' }, { clipPath: 'inset(0 0 0 0)', opacity: 1, transform: 'none' }],
      { duration: 650, delay: delay || 0, easing: EASE, fill: 'backwards' });
  }

  /* ---------- go to poster i; dir = +1 (new one comes from the top, old falls down) or -1 ---------- */
  function go(i, dir) {
    i = (i + n) % n;
    if (i === cur) return;
    dir = dir || 1;
    var out = pp[cur], inn = pp[i];
    pp.forEach(function (p) {
      p.getAnimations && p.getAnimations().forEach(function (a) { a.cancel(); });
      if (p !== out && p !== inn) p.classList.remove('is-active');
    });
    inn.classList.add('is-active');
    if (!reduce && inn.animate) {
      /* video motion: new poster rises from the bottom while the old one leaves through the top, both on one ease-in-out */
      inn.style.zIndex = 2; out.style.zIndex = 1;
      inn.animate([{ transform: 'translateY(' + (125 * dir) + '%)' }, { transform: 'translateY(0)' }], { duration: D, easing: EASE, fill: 'both' });
      var a = out.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-125 * dir) + '%)' }], { duration: D, easing: EASE, fill: 'both' });
      a.onfinish = function () { if (cur !== pp.indexOf(out)) out.classList.remove('is-active'); a.cancel(); };
      /* blobs travel with the poster: old set leaves up, new set (new spots) rises from below */
      clearTimeout(blobTimer);
      Array.prototype.forEach.call(root.querySelectorAll('.pblobs'), function (l) {
        l.getAnimations().forEach(function (x) { x.cancel(); });
        l.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-135 * dir) + '%)' }], { duration: D * 0.5, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
      });
      var idx = i;
      blobTimer = setTimeout(function () {
        placeBlobs(idx);
        Array.prototype.forEach.call(root.querySelectorAll('.pblobs'), function (l) {
          l.getAnimations().forEach(function (x) { x.cancel(); });
          l.animate([{ transform: 'translateY(' + (135 * dir) + '%)' }, { transform: 'translateY(0)' }], { duration: D * 0.55, easing: 'cubic-bezier(.1,.4,.3,1)', fill: 'backwards' });
        });
      }, D * 0.42);
      /* top pill: quick wipe like the video */
      var pill = root.querySelector('.pcard3d__pills i.on');
      if (pill) pill.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 600, easing: EASE });
    } else { out.classList.remove('is-active'); placeBlobs(i); }
    cur = i;
    root.dataset.theme = inn.dataset.theme;
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); d.setAttribute('aria-selected', k === i); });
    numEl.textContent = ('0' + (i + 1)).slice(-2);
    swapText(titleEl, inn.dataset.cap, 120);
    swapText(descEl, inn.dataset.desc, 220);
  }
  function next() { go(cur + 1, 1); }
  function prev() { go(cur - 1, -1); }

  /* ---------- autoplay (only while visible; paused on hover / focus / lightbox) ---------- */
  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (reduce || !inView || hovering || document.hidden || lb.classList.contains('is-open')) return;
    timer = setInterval(next, AUTO_MS);
  }
  var entered = false;
  if (!reduce) card.classList.add('is-pre');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView && !entered) { entered = true; card.classList.remove('is-pre'); }
      start();
    }, { threshold: 0.3 }).observe(root);
  } else { inView = true; card.classList.remove('is-pre'); }
  document.addEventListener('visibilitychange', start);
  root.addEventListener('mouseenter', function () { hovering = true; stop(); });
  root.addEventListener('mouseleave', function () { hovering = false; start(); });
  root.addEventListener('focusin', function () { hovering = true; stop(); });
  root.addEventListener('focusout', function () { hovering = false; start(); });

  /* ---------- 3D tilt following the mouse (desktop) ---------- */
  if (!reduce && fine) {
    var raf = 0;
    root.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        card.classList.add('is-live');
        card.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      });
    });
    root.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      card.classList.remove('is-live');
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- controls ---------- */
  root.querySelector('.pnext').addEventListener('click', next);
  root.querySelector('.pprev').addEventListener('click', prev);
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i, i > cur ? 1 : -1); }); });
  pp.forEach(function (p, i) { p.addEventListener('click', function () { open(i); }); });
  document.getElementById('pview').addEventListener('click', function () { open(cur); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev();
  });
  var sx = null, sy = null;
  var stage = document.getElementById('pstage');
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  /* ---------- lightbox ---------- */
  var lb = document.createElement('div');
  lb.className = 'glb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Poster viewer');
  lb.innerHTML = '<button type="button" class="glb__btn glb__x" aria-label="Close">&times;</button>' +
    '<button type="button" class="glb__btn glb__prev" aria-label="Previous poster">&#8249;</button>' +
    '<img class="glb__img" alt="">' +
    '<p class="glb__cap"></p>' +
    '<button type="button" class="glb__btn glb__next" aria-label="Next poster">&#8250;</button>';
  document.body.appendChild(lb);
  var img = lb.querySelector('.glb__img'), cap = lb.querySelector('.glb__cap'), lcur = 0, lastFocus = null;

  function load(i) {
    lcur = (i + n) % n;
    var b = pp[lcur];
    img.classList.add('is-swap');
    setTimeout(function () {
      img.src = b.getAttribute('data-full');
      img.alt = (b.querySelector('img') || {}).alt || '';
      cap.innerHTML = '';
      cap.appendChild(document.createTextNode(b.getAttribute('data-cap') || ''));
      var s = document.createElement('small'); s.textContent = (lcur + 1) + ' / ' + n; cap.appendChild(s);
      img.classList.remove('is-swap');
    }, 160);
    var nx = new Image(); nx.src = pp[(lcur + 1) % n].getAttribute('data-full');
  }
  function open(i) {
    lastFocus = document.activeElement; stop();
    lb.classList.add('is-open'); document.body.style.overflow = 'hidden';
    load(i); lb.querySelector('.glb__x').focus({ preventScroll: true });
  }
  /* single image viewer for other sections (showreel pictures call window.bbLightbox.open) */
  window.bbLightbox = { open: function (src, c) {
    lastFocus = document.activeElement; stop();
    lb.classList.add('is-open', 'is-single'); document.body.style.overflow = 'hidden';
    img.src = src; img.alt = c || ''; cap.textContent = c || '';
    lb.querySelector('.glb__x').focus({ preventScroll: true });
  } };
  function close() {
    var single = lb.classList.contains('is-single');
    lb.classList.remove('is-open', 'is-single'); document.body.style.overflow = '';
    if (!single) go(lcur, 1);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    start();
  }
  lb.querySelector('.glb__x').addEventListener('click', close);
  lb.querySelector('.glb__prev').addEventListener('click', function () { load(lcur - 1); });
  lb.querySelector('.glb__next').addEventListener('click', function () { load(lcur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') load(lcur - 1);
    else if (e.key === 'ArrowRight') load(lcur + 1);
  });
  var lx = null;
  lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (lx === null) return;
    var dx = e.changedTouches[0].clientX - lx; lx = null;
    if (Math.abs(dx) > 50) load(lcur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- init ---------- */
  pp[0].classList.add('is-active');
  dots[0].classList.add('is-on');
  root.dataset.theme = pp[0].dataset.theme;
  placeBlobs(0);
})();
