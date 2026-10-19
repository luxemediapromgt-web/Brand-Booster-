(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  var pre = $('#preloader');
  function hidePre() { if (pre) pre.classList.add('done'); revealHero(); }
  window.addEventListener('load', function () { setTimeout(hidePre, 900); });
  setTimeout(hidePre, 3500); // safety net

  /* ---------- Reveal on scroll ---------- */
  var heroRevealed = false;
  function revealHero() {
    if (heroRevealed) return; heroRevealed = true;
    $$('#home .reveal').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count]').forEach(countUp);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.closest('#home')) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .14, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
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
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 30);
    prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    var cur = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < window.innerHeight * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var burger = $('#burger'), menu = $('#navLinks');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Gold particles ---------- */
  var cv = $('#particles');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), W, H, dots = [], N = window.innerWidth < 700 ? 28 : 60;
    function size() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
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

  /* ---------- Cursor glow, tilt, magnetic, card spotlight (desktop only) ---------- */
  if (fine && !reduce) {
    var glow = $('#cursorGlow');
    window.addEventListener('mousemove', function (e) {
      glow.style.opacity = 1;
      glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    });

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

  /* ---------- Showreel: play when visible / hover, open modal on click ---------- */
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
