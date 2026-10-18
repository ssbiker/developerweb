/* ══════════════════════════════════════════════════
   PORTFOLIO - app.js
   Reveal, segmented filter, spotlight, 3D spring tilt, counters, parallax.
   Emil Kowalski & High-End Motion Engineering.
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Reveal on scroll (Subtle entrance, never scale 0) ── */
  var animated = document.querySelectorAll('[data-animate]');
  function reveal(el) { el.classList.add('in'); }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    animated.forEach(reveal);
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });

    animated.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      else observer.observe(el);
    });
  }

  /* ── 1b. Word-by-word reveal (hero + contact titles, no orphaned punctuation) ── */
  var headings = document.querySelectorAll('.hero-title, .contact-title');
  headings.forEach(function (h) {
    if (reduceMotion) return;

    var wordIndex = 0;
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var text = node.textContent;
        var words = text.split(/\s+/).filter(Boolean);
        if (!words.length) return;
        var hasTrailingSpace = /\s$/.test(text);
        var frag = document.createDocumentFragment();
        words.forEach(function (word, idx) {
          var span = document.createElement('span');
          span.className = 'w';
          span.textContent = word;
          span.style.setProperty('--i', wordIndex++);
          frag.appendChild(span);
          if (idx < words.length - 1 || hasTrailingSpace) {
            frag.appendChild(document.createTextNode(' '));
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        if (node.classList && node.classList.contains('w')) return;
        var wrap = document.createElement('span');
        wrap.className = 'w';
        wrap.style.setProperty('--i', wordIndex++);
        node.parentNode.insertBefore(wrap, node);
        wrap.appendChild(node);
      }
    });
  });

  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle && !reduceMotion) {
    setTimeout(function () { heroTitle.classList.add('in'); }, 120);
  }

  /* ── 2. Animated odometer counters ── */
  var counters = document.querySelectorAll('.stat-num');

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
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
      }, { threshold: 0.35 });
      counters.forEach(function (el) { cObserver.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ── 3. Project filter + Fluid Sliding Indicator ── */
  var filterIndicator = document.getElementById('filterIndicator');
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project');

  function updateIndicator(activeBtn) {
    if (!filterIndicator || !activeBtn) return;
    filterIndicator.style.transform = 'translateX(' + activeBtn.offsetLeft + 'px)';
    filterIndicator.style.width = activeBtn.offsetWidth + 'px';
  }

  var activeBtn = document.querySelector('.filter-btn.active');
  if (activeBtn) {
    requestAnimationFrame(function () { updateIndicator(activeBtn); });
    window.addEventListener('resize', function () {
      var current = document.querySelector('.filter-btn.active');
      if (current) updateIndicator(current);
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      updateIndicator(btn);

      var f = btn.getAttribute('data-filter');
      var delay = 0;

      cards.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var show = (f === 'all' || cats.indexOf(f) !== -1);

        if (show) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(14px) scale(0.97)';
          var currentDelay = delay * 45;
          delay++;
          setTimeout(function () {
            card.style.transition = 'opacity 260ms var(--ease-out), transform 260ms var(--ease-spring)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, currentDelay);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  /* ── 4. Spotlight + 3D Spring Tilt (Lerp momentum physics) ── */
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
      var targetX = 0, targetY = 0;
      var currentX = 0, currentY = 0;
      var isHovered = false;
      var rafId = null;

      function render() {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;

        if (isHovered || Math.abs(currentX) > 0.02 || Math.abs(currentY) > 0.02) {
          el.style.transform = 'perspective(900px) rotateX(' + (-currentY * 6).toFixed(2) + 'deg) rotateY(' + (currentX * 8).toFixed(2) + 'deg) translateY(-4px)';
          rafId = requestAnimationFrame(render);
        } else {
          el.style.transform = '';
          rafId = null;
        }
      }

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        targetX = (e.clientX - r.left) / r.width - 0.5;
        targetY = (e.clientY - r.top) / r.height - 0.5;
        isHovered = true;
        if (!rafId) rafId = requestAnimationFrame(render);
      });

      el.addEventListener('mouseleave', function () {
        targetX = 0;
        targetY = 0;
        isHovered = false;
        if (!rafId) rafId = requestAnimationFrame(render);
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

  /* ── 7. Dynamic Footer Year ── */
  var yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = '© ' + new Date().getFullYear() + ' Sergio Andrés';
  }
})();