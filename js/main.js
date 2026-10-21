(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Split headlines into masked words ---------- */
  function splitWords(el) {
    var i = 0, frag = document.createDocumentFragment();
    (function walk(node, target) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          ch.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { target.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var n = document.createElement('span'); n.className = 'wi';
            n.style.setProperty('--i', i++); n.textContent = t;
            w.appendChild(n); target.appendChild(w);
          });
        } else if (ch.nodeType === 1) {
          var clone = ch.cloneNode(false); target.appendChild(clone); walk(ch, clone);
        }
      });
    })(el, frag);
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('split');
  }
  try {
    $$('.hero h1, .section h2, .reel__cta h3').forEach(splitWords);
  } catch (e) { /* headings simply stay plain */ }

  /* ---------- Media gets the curtain / clip reveal ---------- */
  $$('.reel__item, .shot, .gallery__cta, .reel__cta').forEach(function (el) { el.classList.add('clip'); });

  /* ---------- Preloader: split curtain ---------- */
  var pre = $('#preloader');
  var heroRevealed = false;
  function revealHero() {
    if (heroRevealed) return; heroRevealed = true;
    $$('#home .reveal').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(countUp);
  }
  var preDone = false;
  function hidePre() {
    if (preDone) return; preDone = true;
    if (pre) { pre.classList.add('done'); setTimeout(function () { pre.style.display = 'none'; }, 1700); }
    setTimeout(revealHero, reduce ? 0 : 750);
  }
  window.addEventListener('load', function () { setTimeout(hidePre, 1000); });
  setTimeout(hidePre, 3800); // safety net

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.closest('#home')) {
          e.target.classList.add('in'); io.unobserve(e.target);
          var t = e.target; setTimeout(function () { t.classList.add('settled'); }, 1700);
        }
      });
    }, { threshold: .14, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); el.classList.add('settled'); });
  }

  /* ---------- Counters ---------- */
  function countUp(el) {
    var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    var t0 = null, dur = 1800;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Nav: scroll state, progress, active link, mobile menu ---------- */
  var nav = $('#nav'), prog = $('#progress');
  var links = $$('.nav__links a[href^="#"]:not(.btn)');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  var steps = $('.steps'), stepItems = $$('.step');
  var desktopMQ = window.matchMedia('(min-width:1021px)');

  /* parallax layers (independent `translate` property, so they never fight other transforms) */
  var layers = [];
  if (!reduce) {
    [['.aurora i:nth-child(1)', .16], ['.aurora i:nth-child(2)', -.1], ['.aurora i:nth-child(3)', .22],
     ['.hero .phone', -.07], ['.chip--a', .1], ['.chip--b', -.14], ['.chip--c', .16], ['.hero__copy', .035]
    ].forEach(function (p) { var el = $(p[0]); if (el) layers.push({ el: el, s: p[1] }); });
  }

  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight, h = document.documentElement.scrollHeight - vh;
    nav.classList.toggle('scrolled', y > 30);
    prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var cur = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });

    if (y < vh * 1.6) layers.forEach(function (l) { l.el.style.translate = '0 ' + (y * l.s).toFixed(1) + 'px'; });

    if (steps) {
      var r = steps.getBoundingClientRect();
      if (desktopMQ.matches) {
        var p = clamp((vh * .78 - r.top) / (r.height * 1.15), 0, 1);
        steps.style.setProperty('--p', p.toFixed(3));
        stepItems.forEach(function (s, i) { s.classList.toggle('on', p >= (i / (stepItems.length - 1)) * .92 && p > 0); });
      } else {
        stepItems.forEach(function (s) { s.classList.toggle('on', s.getBoundingClientRect().top < vh * .78); });
      }
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  var burger = $('#burger'), menu = $('#navLinks');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Section transition wipe on in-page jumps ---------- */
  var wipe = $('#wipe'), wiping = false;
  function jump(target) {
    var top = target.getBoundingClientRect().top + window.scrollY - (target.id === 'home' ? 0 : 70);
    if (reduce || !wipe) { window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (wiping) return; wiping = true;
    wipe.classList.remove('out'); wipe.classList.add('on');
    requestAnimationFrame(function () { requestAnimationFrame(function () { wipe.classList.add('in'); }); });
    setTimeout(function () {
      window.scrollTo({ top: top, behavior: 'instant' });
      wipe.classList.remove('in'); wipe.classList.add('out');
      setTimeout(function () { wipe.classList.remove('on', 'out'); wiping = false; }, 900);
    }, 800);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id.length < 2) return;
    var t = $(id); if (!t) return;
    e.preventDefault(); jump(t);
  });

  /* ---------- Gold particles ---------- */
  var cv = $('#particles');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), W, H, dots = [], N = window.innerWidth < 700 ? 28 : 60;
    var size = function () { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    size(); window.addEventListener('resize', size);
    for (var i = 0; i < N; i++) dots.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4, v: Math.random() * .35 + .08, a: Math.random() * .6 + .2, d: Math.random() * 6.28 });
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(function (p) {
        p.y -= p.v; p.d += .01; p.x += Math.sin(p.d) * .25;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = 'rgba(232,192,106,' + p.a + ')'; ctx.fill();
      });
      requestAnimationFrame(draw);
    })();
  }

  /* ---------- Marquee: speed and direction follow your scrolling ---------- */
  var track = $('.marquee__track');
  if (track && !reduce) {
    track.style.animation = 'none';
    var half = 0, x = 0, dir = -1, vel = 0, lastY = window.scrollY;
    var measure = function () { half = (track.scrollWidth + 34) / 2; };
    measure(); window.addEventListener('resize', measure); window.addEventListener('load', measure);
    (function loop() {
      var y = window.scrollY, dy = y - lastY; lastY = y;
      vel += (dy - vel) * .12;
      if (Math.abs(vel) > .6) dir = vel > 0 ? -1 : 1;
      x += dir * (.75 + Math.min(Math.abs(vel) * .4, 16));
      if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Cursor glow, custom cursor, tilt, magnetic, card spotlight (desktop only) ---------- */
  if (fine && !reduce) {
    var glow = $('#cursorGlow');
    var cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), ringLabel = $('b', ring);
    var mx = -200, my = -200, rx = -200, ry = -200, moved = false;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!moved) { moved = true; rx = mx; ry = my; document.documentElement.classList.add('has-cursor'); }
      glow.style.opacity = 1;
      glow.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    });
    document.addEventListener('mouseleave', function () { cur.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { cur.style.opacity = 1; });
    (function follow() {
      rx += (mx - rx) * .17; ry += (my - ry) * .17;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(follow);
    })();
    $$('.reel__item').forEach(function (el) { el.dataset.cursor = 'Play'; });
    $$('.shot button').forEach(function (el) { el.dataset.cursor = 'View'; });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor],a,button') : null;
      ring.classList.remove('is-link', 'is-label');
      ringLabel.textContent = '';
      if (!t) return;
      if (t.dataset.cursor) { ringLabel.textContent = t.dataset.cursor; ring.classList.add('is-label'); }
      else ring.classList.add('is-link');
    });
    document.addEventListener('mousedown', function () { ring.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { ring.classList.remove('is-down'); });

    $$('.tilt').forEach(function (el) {
      var max = parseFloat(el.dataset.tiltMax || 6);
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * max) + 'deg) rotateY(' + ((px - .5) * max * 1.4) + 'deg)';
        el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });

    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Showreel: play when visible ---------- */
  var reelVids = $$('.reel__item video');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: .45 });
    reelVids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Modal (video + image) ---------- */
  var modal = $('#modal'), body = $('#modalBody'), mTitle = $('#modalTitle'), lastFocus;
  function openModal(kind, src, title) {
    lastFocus = document.activeElement;
    body.innerHTML = '';
    var el;
    if (kind === 'video') {
      el = document.createElement('video');
      el.src = src; el.controls = true; el.autoplay = true; el.playsInline = true;
    } else {
      el = document.createElement('img'); el.src = src; el.alt = title || '';
    }
    body.appendChild(el);
    mTitle.textContent = title || '';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('open'); });
    $('#modalClose').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    setTimeout(function () { modal.hidden = true; body.innerHTML = ''; }, 350);
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('.reel__item').forEach(function (b) { b.addEventListener('click', function () { openModal('video', b.dataset.video, b.dataset.title); }); });
  $$('.shot button').forEach(function (b) { b.addEventListener('click', function () { openModal('img', b.dataset.img, b.dataset.title); }); });
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Contact form -> WhatsApp ---------- */
  var form = $('#contactForm'), note = $('#formNote');
  var WA_NUMBER = '923077667899'; // change here if the number changes
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('.field', form).forEach(function (f) {
      var inp = $('input,select,textarea', f), bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
      f.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please fill in all the fields correctly.'; note.className = 'form__note err'; return; }
    var d = new FormData(form);
    var msg = 'Hello Brand Booster!%0A%0A' +
      'Name: ' + encodeURIComponent(d.get('name')) + '%0A' +
      'Email: ' + encodeURIComponent(d.get('email')) + '%0A' +
      'Service: ' + encodeURIComponent(d.get('service')) + '%0A' +
      'Project: ' + encodeURIComponent(d.get('message'));
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank', 'noopener');
    note.textContent = 'Thank you! Opening WhatsApp to send your message.'; note.className = 'form__note ok';
    form.reset();
  });
  $$('.field input,.field select,.field textarea', form).forEach(function (i) {
    i.addEventListener('input', function () { i.parentNode.classList.remove('invalid'); });
  });

  $('#year').textContent = new Date().getFullYear();
})();
