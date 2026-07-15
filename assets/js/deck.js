/* Static slide deck controller
   Pure ES2015. No frameworks. Keyboard + buttons + hash routing + index. */

(function () {
  'use strict';

  var slides    = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total     = slides.length;
  var bar       = document.getElementById('prog-fill');
  var counter   = document.getElementById('counter');
  var btnPrev   = document.getElementById('btn-prev');
  var btnNext   = document.getElementById('btn-next');
  var btnIdx    = document.getElementById('btn-index');
  var btnIdxClose = document.getElementById('btn-index-close');
  var idxPanel  = document.getElementById('side-index');
  var idxItems  = Array.prototype.slice.call(document.querySelectorAll('.si-item'));
  var goLinks   = Array.prototype.slice.call(document.querySelectorAll('[data-goto]'));
  var dots      = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var current   = 1;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function readInitial() {
    var hash = (window.location.hash || '').replace('#', '');
    var match = /^slide-(\d+)$/.exec(hash);
    if (match) {
      var n = parseInt(match[1], 10);
      if (n >= 1 && n <= total) return n;
    }
    var qs = new URLSearchParams(window.location.search);
    var s = parseInt(qs.get('slide'), 10);
    if (s >= 1 && s <= total) return s;
    return 1;
  }

  function setHash(n) {
    var newHash = '#slide-' + n;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  function go(n, opts) {
    opts = opts || {};
    if (n < 1) n = 1;
    if (n > total) n = total;
    if (n === current && !opts.force) return;

    slides.forEach(function (s) {
      var sn = parseInt(s.getAttribute('data-slide'), 10);
      if (sn === n) {
        s.classList.add('active');
        s.classList.remove('in');
        s.removeAttribute('aria-hidden');
        s.scrollTop = 0;
        // Force reflow so removing+adding 'in' restarts animations
        void s.offsetWidth;
        s.classList.add('in');
      } else {
        s.classList.remove('active', 'in');
        s.setAttribute('aria-hidden', 'true');
      }
    });

    current = n;
    var pct = (n / total) * 100;
    if (bar) bar.style.width = pct + '%';
    if (counter) counter.textContent = n + ' / ' + total;

    idxItems.forEach(function (b) {
      var bn = parseInt(b.getAttribute('data-goto'), 10);
      if (bn === (n - 1)) b.classList.add('active');
      else b.classList.remove('active');
    });

    dots.forEach(function (d, i) {
      if (i === (n - 1)) d.classList.add('active');
      else d.classList.remove('active');
    });

    if (btnPrev) btnPrev.disabled = (n === 1);
    if (btnNext) btnNext.disabled = (n === total);

    setHash(n);
  }

  function next() { go(current + 1); }
  function prev() { go(current - 1); }

  /* ---- Keyboard ---- */
  document.addEventListener('keydown', function (e) {
    // Ignore if user is typing in a form control
    var target = e.target;
    var tag = target && target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
    if (target && target.closest && target.closest('.tree-node')) return;
    var personModal = document.getElementById('person-modal');
    if (personModal && personModal.classList.contains('open')) return;

    var key = e.key;

    if (key === 'Escape') {
      e.preventDefault();
      toggleIndex();
      return;
    }
    if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
      e.preventDefault(); next(); return;
    }
    if (key === 'ArrowLeft' || key === 'PageUp') {
      e.preventDefault(); prev(); return;
    }
    if (key === 'Home') { e.preventDefault(); go(1); return; }
    if (key === 'End')  { e.preventDefault(); go(total); return; }
    if (key === 'f' || key === 'F') {
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
      return;
    }
    // Number keys 1-9
    if (/^[1-9]$/.test(key)) {
      var n = parseInt(key, 10);
      if (n >= 1 && n <= total) {
        e.preventDefault();
        go(n);
      }
    }
  });

  /* ---- Buttons ---- */
  if (btnPrev) btnPrev.addEventListener('click', prev);
  if (btnNext) btnNext.addEventListener('click', next);

  goLinks.forEach(function (el) {
    el.addEventListener('click', function (e) {
      var n = parseInt(el.getAttribute('data-goto'), 10) + 1;
      if (!isNaN(n)) {
        e.preventDefault();
        closeIndex();
        go(n);
      }
    });
  });

  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { go(i + 1); });
  });

  /* ---- Index (side panel) ---- */
  function openIndex() {
    if (!idxPanel) return;
    idxPanel.classList.add('open');
    document.getElementById('app').classList.add('index-open');
    if (btnIdxClose) btnIdxClose.focus();
  }
  function closeIndex() {
    if (!idxPanel) return;
    idxPanel.classList.remove('open');
    document.getElementById('app').classList.remove('index-open');
    if (btnIdx) btnIdx.focus();
  }
  function toggleIndex() {
    if (!idxPanel) return;
    if (idxPanel.classList.contains('open')) closeIndex();
    else openIndex();
  }
  if (btnIdx) btnIdx.addEventListener('click', toggleIndex);
  if (btnIdxClose) btnIdxClose.addEventListener('click', closeIndex);

  /* ---- Hashchange ---- */
  window.addEventListener('hashchange', function () {
    var n = readInitial();
    if (n !== current) go(n);
  });

  /* ---- Touch swipe ---- */
  var touchX = null, touchY = null;
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches[0]) {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    var dx = t.clientX - touchX;
    var dy = t.clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else prev();
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ---- Init ---- */
  go(readInitial(), { force: true });
})();
