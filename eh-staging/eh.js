/* Earth House staging: behaviour layer for the Webflow build (header, reveals, menus, accordions, slider, colour modal). */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOGO_DARK = 'https://cdn.prod.website-files.com/6b07d73f653316321b53b6f1/6b07d966517dbe60038cc3eb_earth-house-logo-dark.png';
  var LOGO_WHITE = 'https://cdn.prod.website-files.com/6b07d73f653316321b53b6f1/6b07d9673d709d4976b52d54_earth-house-logo-white.png';

  // Buttons rebuilt as links: keyboard activation
  $$('.eh-btn').forEach(function (b) {
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
    b.addEventListener('click', function (e) { if (!b.getAttribute('href') || b.getAttribute('href') === '#') e.preventDefault(); });
  });

  // Swatch colours stored as data attributes
  $$('[data-swatch]').forEach(function (el) { el.style.backgroundColor = el.getAttribute('data-swatch'); });

  // Home header: transparent over the hero, solid after it
  var landing = $('.landing-page');
  var header = $('.site-header');
  if (landing && header) {
    var logo = $('.logo img', header);
    var ids = ['about', 'materials', 'wall-system', 'explore-clay', 'projects', 'contact'];
    var onScroll = function () {
      var hero = $('.hero');
      // solid once the hero has (almost) left the screen, including after an anchor jump that stops at the section's scroll margin
      var scrolled = hero ? hero.getBoundingClientRect().bottom <= header.offsetHeight + 40 : window.scrollY > 40;
      header.classList.toggle('is-scrolled', scrolled);
      if (logo) logo.src = scrolled ? LOGO_DARK : LOGO_WHITE;
      var y = window.scrollY + innerHeight * 0.35, cur = '';
      ids.forEach(function (id) { var el = document.getElementById(id); if (el && y >= el.offsetTop) cur = id; });
      $$('#primary-navigation > a').forEach(function (a) { var on = !!cur && a.getAttribute('href') === '#' + cur; a.classList.toggle('is-active', on); });
    };
    onScroll(); addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  }

  // Section reveals
  var reveals = $$('.reveal-section');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reduce) reveals.forEach(function (s) { s.classList.add('is-visible'); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
      reveals.forEach(function (s) { io.observe(s); });
    }
  }

  // Desktop dropdowns
  $$('.materials-nav-menu').forEach(function (m) {
    var t = $('.materials-nav-trigger', m);
    var set = function (o) { m.classList.toggle('is-open', o); if (t) t.setAttribute('aria-expanded', o ? 'true' : 'false'); };
    m.addEventListener('mouseenter', function () { $$('.materials-nav-menu').forEach(function (x) { if (x !== m) { x.classList.remove('is-open'); } }); set(true); });
    m.addEventListener('mouseleave', function () { set(false); });
    m.addEventListener('focusout', function (e) { if (!m.contains(e.relatedTarget)) set(false); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); t && t.focus(); } });
    if (t) t.addEventListener('click', function () { set(!m.classList.contains('is-open')); });
  });

  // Home materials accordion
  $$('.materials-reveal-list article').forEach(function (art, i, all) {
    var b = $(':scope > .eh-btn', art), p = $('.materials-reveal-panel', art);
    var open = function () {
      all.forEach(function (x) { x.classList.remove('is-active'); var xb = $(':scope > .eh-btn', x), xp = $('.materials-reveal-panel', x); xb && xb.setAttribute('aria-expanded', 'false'); xp && xp.setAttribute('aria-hidden', 'true'); });
      art.classList.add('is-active'); b && b.setAttribute('aria-expanded', 'true'); p && p.setAttribute('aria-hidden', 'false');
    };
    if (b) { b.addEventListener('click', function () { if (art.classList.contains('is-active')) { art.classList.remove('is-active'); b.setAttribute('aria-expanded', 'false'); p && p.setAttribute('aria-hidden', 'true'); } else open(); });
      if (matchMedia('(hover: hover)').matches) art.addEventListener('mouseenter', open); }
  });

  // Anchor scrolling that lands exactly: smooth scroll, then correct once it ends (images and reveals shift the layout mid-scroll)
  var anchorTop = function (el) { return el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0); };
  var scrollToEl = function (el) {
    window.scrollTo({ top: anchorTop(el), behavior: reduce ? 'auto' : 'smooth' });
    var done = false, fix = function () { if (done) return; done = true; if (Math.abs(anchorTop(el) - window.scrollY) > 4) window.scrollTo({ top: anchorTop(el), behavior: 'auto' }); };
    if ('onscrollend' in window) addEventListener('scrollend', fix, { once: true });
    setTimeout(fix, 1600);
  };

  // Deep links from the Materials menu (#material-preview-clay-board etc.): open that material and bring the section into view
  var openMaterialFromHash = function (instant) {
    // links use #material-<slug> (no element has that id, so neither the browser nor Webflow jumps to the collapsed panel)
    var h = location.hash, m = h.match(/^#material-(?:preview-)?([a-z-]+)$/);
    if (!m) return;
    var panel = document.getElementById('material-preview-' + m[1]), art = panel && panel.closest('article');
    if (!art) return;
    var b = $(':scope > .eh-btn', art);
    if (b && !art.classList.contains('is-active')) b.click();
    var sec = document.getElementById('materials');
    if (!sec) return;
    if (!instant) { scrollToEl(sec); return; }
    var go = function () { window.scrollTo({ top: anchorTop(sec), behavior: 'auto' }); };
    // arriving from another page: layout, fonts and images are still settling, so land again once they have
    go(); setTimeout(go, 250); setTimeout(go, 800);
  };
  if (document.readyState === 'complete') openMaterialFromHash(true);
  else addEventListener('load', function () { openMaterialFromHash(true); });
  addEventListener('hashchange', function () { openMaterialFromHash(false); });

  // FAQ accordion
  $$('.material-faq-list article').forEach(function (art) {
    var b = $('.eh-btn', art), a = $('.material-faq-answer', art);
    if (!b || !a) return;
    b.addEventListener('click', function () {
      var o = !art.classList.contains('is-open');
      $$('.material-faq-list article').forEach(function (x) { x.classList.remove('is-open'); var xb = $('.eh-btn', x), xa = $('.material-faq-answer', x); xb && xb.setAttribute('aria-expanded', 'false'); xa && xa.classList.remove('eh-shown'); });
      art.classList.toggle('is-open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); a.classList.toggle('eh-shown', o);
    });
  });

  // Testimonials slider
  var track = $('.testimonials-track');
  if (track) {
    var cards = $$('.testimonial-card', track), idx = 0;
    var per = function () { return innerWidth > 900 ? 2 : 1; };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var go = function (i) {
      var max = Math.max(0, cards.length - per()); idx = Math.max(0, Math.min(max, i));
      track.style.transform = 'translateX(' + (-cards[idx].offsetLeft) + 'px)';
      var d = $('.testimonial-count-desktop'), m = $('.testimonial-count-mobile');
      if (d) d.textContent = pad(idx + 1) + '–' + pad(Math.min(cards.length, idx + per())) + ' / ' + pad(cards.length);
      if (m) m.textContent = pad(idx + 1) + ' / ' + pad(cards.length);
    };
    var ctr = $$('.testimonials-controls .eh-btn');
    if (ctr[0]) ctr[0].addEventListener('click', function () { go(idx - per()); });
    if (ctr[1]) ctr[1].addEventListener('click', function () { go(idx + per()); });
    addEventListener('resize', function () { go(idx); });
  }

  // Colour library modal (same markup and classes as the reference)
  var cardsC = $$('.colour-card');
  if (cardsC.length) {
    var cur = 0, back = null, lastFocus = null;
    var close = function () { if (!back) return; back.remove(); back = null; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
    var render = function () {
      var c = cardsC[cur], sw = $('.colour-card-swatch', c), ref = ($('strong', c) || {}).textContent || '';
      $('.colour-modal-swatch', back).style.backgroundColor = sw ? sw.getAttribute('data-swatch') : '';
      $('.colour-modal-reference', back).textContent = ref;
      $('.colour-modal-count', back).textContent = (cur < 9 ? '0' : '') + (cur + 1) + ' / ' + cardsC.length;
    };
    var open = function (i) {
      lastFocus = document.activeElement; cur = i;
      back = document.createElement('div'); back.className = 'colour-modal-backdrop'; back.setAttribute('role', 'presentation');
      back.innerHTML = '<section tabindex="-1" class="colour-modal" role="dialog" aria-modal="true" aria-labelledby="colour-modal-title"><button class="colour-modal-close" type="button">Close</button><div class="colour-modal-swatch"><h2 class="colour-modal-reference" id="colour-modal-title"></h2></div><div class="colour-modal-controls"><button type="button"><span aria-hidden="true">←</span> Previous</button><span class="colour-modal-count"></span><button type="button">Next <span aria-hidden="true">→</span></button></div></section>';
      document.body.appendChild(back); document.body.style.overflow = 'hidden'; render();
      var btns = $$('.colour-modal-controls button', back);
      btns[0].addEventListener('click', function () { cur = (cur - 1 + cardsC.length) % cardsC.length; render(); });
      btns[1].addEventListener('click', function () { cur = (cur + 1) % cardsC.length; render(); });
      $('.colour-modal-close', back).addEventListener('click', close);
      back.addEventListener('click', function (e) { if (e.target === back) close(); });
      var x0 = null; var swEl = $('.colour-modal-swatch', back);
      swEl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      swEl.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { cur = (cur + (dx < 0 ? 1 : -1) + cardsC.length) % cardsC.length; render(); } x0 = null; });
      $('.colour-modal', back).focus();
    };
    cardsC.forEach(function (c, i) { c.addEventListener('click', function () { open(i); }); });
    document.addEventListener('keydown', function (e) {
      if (!back) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { cur = (cur + 1) % cardsC.length; render(); }
      if (e.key === 'ArrowLeft') { cur = (cur - 1 + cardsC.length) % cardsC.length; render(); }
    });
  }

  // Webflow adds a default placeholder to converted inputs; the reference has none
  $$('.contact-form-fields input[placeholder="Example text"]').forEach(function (i) { i.removeAttribute('placeholder'); });

  // Contact form: the submit control is a link in Webflow, so submit the native form (Webflow handles sending and the success state)
  $$('.contact-form-submit .eh-btn').forEach(function (b) {
    b.addEventListener('click', function () { var f = b.closest('form'); if (f) { if (f.requestSubmit) f.requestSubmit(); else if (f.reportValidity()) f.submit(); } });
  });

  // Mobile navigation
  var mOpen = $('.eh-menu-open'), mBack = $('.eh-mnav-backdrop');
  if (mOpen && mBack) {
    var setM = function (o) { mBack.classList.toggle('eh-shown', o); mOpen.setAttribute('aria-expanded', o ? 'true' : 'false'); document.body.style.overflow = o ? 'hidden' : ''; if (o) $('.eh-mnav', mBack).focus(); else mOpen.focus(); };
    mOpen.addEventListener('click', function () { setM(true); });
    $('.eh-menu-close', mBack).addEventListener('click', function () { setM(false); });
    mBack.addEventListener('click', function (e) { if (e.target === mBack) setM(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mBack.classList.contains('eh-shown')) setM(false); });
    $$('.eh-mnav-toggle', mBack).forEach(function (t) {
      t.addEventListener('click', function () { var sub = t.nextElementSibling, o = !sub.classList.contains('eh-shown'); sub.classList.toggle('eh-shown', o); t.setAttribute('aria-expanded', o ? 'true' : 'false'); t.lastElementChild.textContent = o ? '−' : '+'; });
    });
    // any real link in the menu closes it (for same-page links the page would otherwise scroll behind the open menu)
    $$('.eh-mnav a[href]:not(.eh-btn)', mBack).forEach(function (a) {
      a.addEventListener('click', function () { mBack.classList.remove('eh-shown'); mOpen.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
    });
  }

  // Same-page anchor links (#about, #projects, #material-clay-board...): handled here instead of by Webflow so they land exactly
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.classList.contains('eh-btn') || !a.hash || a.hash === '#') return;
    if (a.host !== location.host || a.pathname !== location.pathname) return;
    var mat = /^#material-/.test(a.hash);
    var el = document.getElementById(mat ? 'materials' : decodeURIComponent(a.hash.slice(1)));
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (mBack && mBack.classList.contains('eh-shown')) { mBack.classList.remove('eh-shown'); mOpen.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    $$('.materials-nav-menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
    if (location.hash !== a.hash) history.pushState(null, '', a.hash);
    if (mat) openMaterialFromHash(false); else scrollToEl(el);
  }, true);
})();
