(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var toggle = $('.nav-toggle'), menu = $('#nav-menu');
  if (toggle && menu) {
    var setOpen = function (open, focusToggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
      if (focusToggle) toggle.focus();
    };
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    toggle.addEventListener('click', function () { setOpen(!isOpen()); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) setOpen(false, true); });
    document.addEventListener('click', function (e) { if (isOpen() && !e.target.closest('.nav-bar')) setOpen(false); });
  }

  var navLinks = $$('.nav-menu a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    navLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }

  var toTop = $('#back-to-top');
  if (toTop) {
    var ticking = false;
    var onScroll = function () { toTop.hidden = window.scrollY < 600; ticking = false; };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var h = $('.nav-handle'); if (h) h.focus({ preventScroll: true });
    });
  }

  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var activate = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle('active', on);
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab); });
      tab.addEventListener('keydown', function (e) {
        var idx = null;
        if (e.key === 'ArrowRight') idx = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') idx = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') idx = 0;
        else if (e.key === 'End') idx = tabs.length - 1;
        if (idx !== null) { e.preventDefault(); activate(tabs[idx], true); }
      });
    });
  });

  if (navigator.clipboard) {
    $$('.article-body pre').forEach(function (pre) {
      var code = $('code', pre); if (!code) return;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'copy-btn'; btn.textContent = 'copiar';
      btn.setAttribute('aria-label', 'Copiar código');
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent).then(function () {
          btn.textContent = 'copiado'; btn.classList.add('copied');
          setTimeout(function () { btn.textContent = 'copiar'; btn.classList.remove('copied'); }, 1600);
        }, function () {});
      });
      pre.appendChild(btn);
    });
  }

  var wrap = $('#graphWrap');
  if (wrap) {
    var loaded = false;
    var load = function () {
      if (loaded) return; loaded = true;
      var add = function (src, next) {
        var s = document.createElement('script');
        s.src = src; s.onload = next || null;
        s.onerror = function () { document.documentElement.classList.remove('js'); };
        document.head.appendChild(s);
      };
      add('/vendor/d3-graph.min.js', function () { add('/assets/js/graph.js'); });
    };
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { gio.disconnect(); load(); }
      }, { rootMargin: '300px 0px' });
      gio.observe(wrap);
    } else load();
  }
})();
