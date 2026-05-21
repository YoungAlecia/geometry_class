/* =============================================================
   Geometry Honors — Front-end script
   - Modular calculator library (window.GeometryCalculators)
   - Live input handling with validation
   - GeoGebra applet loader via deployggb.js
   - Mobile nav toggle, active-section highlight, swap tool
   ============================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // 1. GeoGebra applet configuration
  // ---------------------------------------------------------
  // TEACHERS: edit `materialId` to swap the default activity.
  // The material ID is the alphanumeric segment of any
  // geogebra.org/m/<ID> URL (typically 8-12 chars).
  const GGB_CONFIG = {
    materialId: 'RHYH3UVE',   // default: a public geometry/graphing material
    appName:    'graphing',   // graphing | geometry | 3d | classic | suite
    showToolBar:      true,
    showAlgebraInput: true,
    showMenuBar:      false,
    showResetIcon:    true,
    enableLabelDrags: false,
    enableShiftDragZoom: true,
    capturingThreshold: 3,
    borderColor: '#e3dcc8'
  };

  /**
   * Inject (or replace) the GeoGebra applet inside #ggb-element.
   * Safe to call multiple times — clears the mount first.
   */
  function loadGeoGebra(overrides) {
    const mount = document.getElementById('ggb-element');
    if (!mount) return;

    const cfg = Object.assign({}, GGB_CONFIG, overrides || {});
    const width  = Math.max(320, mount.clientWidth || 800);
    const height = 540;

    // Clear previous applet (or fallback message)
    mount.innerHTML = '';

    if (typeof window.GGBApplet !== 'function') {
      mount.innerHTML =
        '<div class="ggb-fallback">' +
        '<p><strong>GeoGebra could not be loaded.</strong></p>' +
        '<p class="muted">Check your network connection and reload, or open this page via http(s):// (not file://).</p>' +
        '</div>';
      return;
    }

    const params = {
      appName:          cfg.appName,
      material_id:      cfg.materialId,
      width:            width,
      height:           height,
      showToolBar:      cfg.showToolBar,
      showAlgebraInput: cfg.showAlgebraInput,
      showMenuBar:      cfg.showMenuBar,
      showResetIcon:    cfg.showResetIcon,
      enableLabelDrags: cfg.enableLabelDrags,
      enableShiftDragZoom: cfg.enableShiftDragZoom,
      capturingThreshold:  cfg.capturingThreshold,
      borderColor:      cfg.borderColor,
      scaleContainerClass: 'ggb-mount',
      autoHeight: false,
      allowStyleBar: true
    };

    try {
      const applet = new window.GGBApplet(params, true);
      applet.inject('ggb-element');
    } catch (err) {
      console.error('GeoGebra inject failed:', err);
      mount.innerHTML =
        '<div class="ggb-fallback"><p><strong>Could not load the activity.</strong></p>' +
        '<p class="muted">Verify the material ID and try again.</p></div>';
    }

    const status = document.getElementById('lab-status');
    if (status) {
      status.textContent = 'Activity: ' + cfg.materialId + ' \u00B7 ' + cfg.appName;
    }
  }

  // Load the default applet once deployggb.js has finished loading.
  if (document.readyState === 'loading') {
    window.addEventListener('load', function () { loadGeoGebra(); });
  } else {
    // Defer to next tick so the deferred deployggb.js can attach GGBApplet
    setTimeout(function () { loadGeoGebra(); }, 0);
  }

  // ---------------------------------------------------------
  // 2. Calculator library (pure functions — easy to unit test)
  // ---------------------------------------------------------
  const PI = Math.PI;

  /**
   * Each calculator exposes a `compute(values)` function that
   * returns { results: {key: number}, error: null|string }.
   * Inputs are coerced from strings; missing inputs yield null
   * results (calculator stays in an "incomplete" state).
   */
  const GeometryCalculators = {
    triangle: {
      requires: ['base', 'height'],
      compute: function (v) {
        const b = num(v.base), h = num(v.height);
        const a = num(v.sideA), c = num(v.sideC);
        const out = { area: null, perimeter: null };
        if (anyNegative([b, h, a, c])) return { results: out, error: 'Values must be zero or positive.' };

        if (isFinite(b) && isFinite(h)) out.area = 0.5 * b * h;
        if (isFinite(a) && isFinite(b) && isFinite(c)) {
          // Triangle inequality (only enforce when all three sides given)
          if (a + b <= c || a + c <= b || b + c <= a) {
            return { results: out, error: 'Sides do not satisfy the triangle inequality (a+b>c, etc.).' };
          }
          out.perimeter = a + b + c;
        }
        return { results: out, error: null };
      }
    },

    trapezoid: {
      requires: ['a', 'b', 'height'],
      compute: function (v) {
        const a = num(v.a), b = num(v.b), h = num(v.height);
        const c = num(v.legC), d = num(v.legD);
        const out = { area: null, perimeter: null };
        if (anyNegative([a, b, h, c, d])) return { results: out, error: 'Values must be zero or positive.' };

        if (isFinite(a) && isFinite(b) && isFinite(h)) out.area = 0.5 * (a + b) * h;
        if (isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d)) out.perimeter = a + b + c + d;
        return { results: out, error: null };
      }
    },

    circle: {
      requires: ['radius'],
      compute: function (v) {
        const r = num(v.radius);
        const out = { area: null, circumference: null };
        if (anyNegative([r])) return { results: out, error: 'Radius must be zero or positive.' };
        if (isFinite(r)) {
          out.area = PI * r * r;
          out.circumference = 2 * PI * r;
        }
        return { results: out, error: null };
      }
    },

    sphere: {
      requires: ['radius'],
      compute: function (v) {
        const r = num(v.radius);
        const out = { volume: null, surface: null };
        if (anyNegative([r])) return { results: out, error: 'Radius must be zero or positive.' };
        if (isFinite(r)) {
          out.volume  = (4 / 3) * PI * r * r * r;
          out.surface = 4 * PI * r * r;
        }
        return { results: out, error: null };
      }
    }
  };

  function num(v) {
    if (v === '' || v === null || v === undefined) return NaN;
    const n = Number(v);
    return n;
  }
  function anyNegative(arr) {
    return arr.some(function (x) { return isFinite(x) && x < 0; });
  }
  function formatNumber(n) {
    if (n === null || !isFinite(n)) return '\u2014';
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 10000 || abs < 0.001) return n.toExponential(3);
    // Up to 3 decimals, trim trailing zeros
    return n.toFixed(3).replace(/\.?0+$/, '');
  }

  // Expose for testing in the browser console
  window.GeometryCalculators = GeometryCalculators;
  window.formatNumber = formatNumber;

  // ---------------------------------------------------------
  // 3. Wire calculator UI
  // ---------------------------------------------------------
  function wireCalculator(card) {
    const shape = card.dataset.shape;
    const calc  = GeometryCalculators[shape];
    if (!calc) return;

    const inputs   = card.querySelectorAll('input[data-key]');
    const errorEl  = card.querySelector('[data-role="error"]');
    const resultEls = card.querySelectorAll('[data-result]');

    function collect() {
      const v = {};
      inputs.forEach(function (i) { v[i.dataset.key] = i.value; });
      return v;
    }

    function update() {
      const values = collect();

      // Per-input validation (mark negatives as invalid)
      inputs.forEach(function (i) {
        const raw = i.value;
        if (raw === '') { i.removeAttribute('aria-invalid'); return; }
        const n = Number(raw);
        if (!isFinite(n) || n < 0) i.setAttribute('aria-invalid', 'true');
        else i.removeAttribute('aria-invalid');
      });

      const { results, error } = calc.compute(values);

      if (error) {
        errorEl.textContent = error;
        errorEl.hidden = false;
      } else {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }

      resultEls.forEach(function (el) {
        const key = el.dataset.result;
        const prev = el.textContent;
        const next = formatNumber(results[key]);
        if (prev !== next) {
          el.textContent = next;
          el.classList.remove('is-live');
          // force reflow to restart animation
          void el.offsetWidth;
          if (next !== '\u2014') el.classList.add('is-live');
        }
      });
    }

    inputs.forEach(function (i) {
      i.addEventListener('input', update);
      i.addEventListener('change', update);
    });

    // Initial state
    update();
  }

  document.querySelectorAll('.calc-card').forEach(wireCalculator);

  // ---------------------------------------------------------
  // 4. Nav: mobile toggle + active section highlight
  // ---------------------------------------------------------
  const navToggle = document.querySelector('.nav-toggle');
  const navList   = document.getElementById('nav-list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      const open = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navList.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active section highlight using IntersectionObserver
  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('.nav-list a');
  if ('IntersectionObserver' in window && sections.length) {
    const byId = {};
    navLinks.forEach(function (a) {
      const id = a.getAttribute('href').replace('#', '');
      byId[id] = a;
    });
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && byId[entry.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          byId[entry.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  // ---------------------------------------------------------
  // 5. Lab toolbar: app selector + reload + swap-tool
  // ---------------------------------------------------------
  const appSelect = document.getElementById('ggb-app-name');
  const reloadBtn = document.getElementById('ggb-reload');
  if (appSelect) {
    appSelect.addEventListener('change', function () {
      GGB_CONFIG.appName = appSelect.value;
      loadGeoGebra();
    });
  }
  if (reloadBtn) {
    reloadBtn.addEventListener('click', function () { loadGeoGebra(); });
  }

  const swapId    = document.getElementById('swap-id');
  const swapApp   = document.getElementById('swap-app');
  const swapApply = document.getElementById('swap-apply');
  const swapMsg   = document.getElementById('swap-msg');

  function setSwapMsg(text, kind) {
    if (!swapMsg) return;
    swapMsg.textContent = text;
    swapMsg.classList.remove('is-ok', 'is-error');
    if (kind) swapMsg.classList.add('is-' + kind);
  }

  if (swapApply) {
    swapApply.addEventListener('click', function () {
      const id = (swapId.value || '').trim();
      if (!/^[A-Za-z0-9]{4,16}$/.test(id)) {
        setSwapMsg('Material IDs are 4-16 letters or digits (no slashes).', 'error');
        swapId.focus();
        return;
      }
      GGB_CONFIG.materialId = id;
      GGB_CONFIG.appName    = swapApp.value || GGB_CONFIG.appName;
      if (appSelect) appSelect.value = GGB_CONFIG.appName;
      loadGeoGebra();
      setSwapMsg('Loaded "' + id + '" in the Lab above.', 'ok');
      // Smooth scroll up to the lab
      document.getElementById('lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Enter key in input triggers apply
    swapId.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); swapApply.click(); }
    });
  }

  // Misc
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
