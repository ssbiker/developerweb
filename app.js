/* ══════════════════════════════════════════════════
   PORTFOLIO - app.js
   Reveal, filter, spotlight, 3D tilt, counters, parallax.
   Safe without JS.
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Reveal on scroll ── */
  var animated = document.querySelectorAll('[data-animate]');
  function reveal(el) { el.classList.add('in'); }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    animated.forEach(reveal);
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    animated.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      else observer.observe(el);
    });
  }

  /* ── 1b. Word-by-word reveal (hero + contact titles) ── */
  var headings = document.querySelectorAll('.hero-title, .contact-title');
  headings.forEach(function (h) {
    if (reduceMotion) return;

    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (word) {
          if (!word) return;
          if (word.trim() === '') { frag.appendChild(document.createTextNode(' ')); return; }
          var span = document.createElement('span');
          span.className = 'w';
          span.textContent = word;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.classList && node.classList.contains('w')) return;
        var wrap = document.createElement('span');
        wrap.className = 'w';
        node.parentNode.insertBefore(wrap, node);
        wrap.appendChild(node);
      }
    });

    var words = h.querySelectorAll('.w');
    words.forEach(function (w, i) { w.style.setProperty('--i', i); });
  });

  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle && !reduceMotion) {
    setTimeout(function () { heroTitle.classList.add('in'); }, 150);
  }

  /* ── 2. Animated odometer counters ── */
  var counters = document.querySelectorAll('.stat-num');

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;

    function tick(now) {
      if (!start) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  }

  if (counters.length) {
    if (reduceMotion) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
    } else if ('IntersectionObserver' in window) {
      var cObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateCount(entry.target); cObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ── 3. Project filter ── */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');

      cards.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var show = (f === 'all' || cats.indexOf(f) !== -1);
        card.classList.toggle('hidden', !show);
        if (show) {
          card.style.opacity = '0';
          requestAnimationFrame(function () { card.style.opacity = '1'; });
        }
      });
    });
  });

  /* ── 4. Spotlight + 3D tilt ── */
  var spotlightEls = document.querySelectorAll('.project, .service');
  var tiltEls = document.querySelectorAll('.project, .id-card');

  if (!reduceMotion) {
    spotlightEls.forEach(function (el) {
      el.classList.add('spotlight');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    tiltEls.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform 0.12s ease-out';
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 8).toFixed(2) + 'deg) rotateY(' + (px * 10).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = '';
      });
    });
  }

  /* ── 5. Scroll progress + parallax ── */
  var progress = document.querySelector('.scroll-progress');
  var ambient = document.getElementById('ambient');

  if (!reduceMotion && (progress || ambient)) {
    var ticking = false;
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        var p = max > 0 ? scrollTop / max : 0;
        progress.style.transform = 'scaleX(' + p + ')';
      }
      if (ambient) {
        ambient.style.transform = 'translateY(' + (scrollTop * 0.06) + 'px)';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    });
    update();
  }

  /* ── 6. Mobile menu ── */
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
      });
    });
  }
})();