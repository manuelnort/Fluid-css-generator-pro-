/* ═══════════════════════════════════════════════════════════════
   FLUID CSS GENERATOR — app.js
   ═══════════════════════════════════════════════════════════════ */

/* ── CONSTANTS ──────────────────────────────────────────────── */

const BREAKPOINTS = [
  { label: 'Small mobile',      vp: 320,  type: 'm' },
  { label: 'Mobile (375)',       vp: 375,  type: 'm' },
  { label: 'iPhone Pro Max',     vp: 430,  type: 'm' },
  { label: 'Tablet portrait',    vp: 768,  type: 't' },
  { label: 'Tablet landscape',   vp: 1024, type: 't' },
  { label: 'Laptop (1280)',      vp: 1280, type: 'd' },
  { label: 'Desktop (1440)',     vp: 1440, type: 'd' },
  { label: 'Large desktop',      vp: 1920, type: 'd' },
  { label: '4K / Ultra-wide',    vp: 2560, type: 'd' },
];

const CHART_BREAKPOINTS = [375, 768, 1024, 1440, 1920];

const TYPE_LABELS = { m: 'Mobile', t: 'Tablet', d: 'Desktop' };
const TYPE_BADGES = { m: 'badge-m', t: 'badge-t', d: 'badge-d' };

const SETTINGS_KEY = 'fluidCSS_settings_v2';
const HISTORY_KEY  = 'fluidCSS_history_v2';

/* ── STATE ──────────────────────────────────────────────────── */

let clampUnit = 'rem';

let cfg = {
  theme:          'system',
  accent:         '#1D9E75',
  baseFontSize:   16,
  defaultMinVp:   375,
  defaultMaxVp:   1440,
  outputUnit:     'rem',
  precision:      4,
  showChart:      true,
  showSim:        true,
  showTable:      true,
  showExport:     true,
};

let savedHistory = [];

/* ── SETTINGS ───────────────────────────────────────────────── */

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (stored) cfg = { ...cfg, ...stored };
  } catch (e) {
    // Use defaults if storage fails
  }
  applyTheme(cfg.theme);
  applyAccent(cfg.accent);
  syncSettingsUI();
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg));
  } catch (e) {
    // Storage unavailable — continue without persistence
  }
}

function syncSettingsUI() {
  document.getElementById('s-base').value  = cfg.baseFontSize;
  document.getElementById('s-minvp').value = cfg.defaultMinVp;
  document.getElementById('s-maxvp').value = cfg.defaultMaxVp;
  document.getElementById('s-prec').value  = cfg.precision;
  document.getElementById('prec-val').textContent = cfg.precision;
  document.getElementById('accent-custom').value = cfg.accent;

  // Sync theme segmented control
  document.querySelectorAll('#theme-seg .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === cfg.theme);
  });

  // Sync unit segmented control
  document.querySelectorAll('#unit-seg .seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === cfg.outputUnit);
  });

  // Sync section toggles
  ['chart', 'sim', 'table', 'export'].forEach(id => {
    const key = 'show' + id.charAt(0).toUpperCase() + id.slice(1);
    const toggle = document.getElementById('tog-' + id);
    if (toggle) toggle.checked = cfg[key];
    toggleSection('section-' + id, cfg[key]);
  });

  // Sync accent swatches
  document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.classList.toggle('active', swatch.dataset.color === cfg.accent);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyAccent(hex) {
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-dim', hex + '18');
  document.documentElement.style.setProperty('--accent-text', hex);
}

function toggleSection(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
}

function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) return;
  cfg = {
    theme: 'system', accent: '#1D9E75', baseFontSize: 16,
    defaultMinVp: 375, defaultMaxVp: 1440, outputUnit: 'rem',
    precision: 4, showChart: true, showSim: true, showTable: true, showExport: true,
  };
  // Remove CSS variable overrides so the stylesheet defaults take effect
  document.documentElement.style.removeProperty('--accent');
  document.documentElement.style.removeProperty('--accent-dim');
  document.documentElement.style.removeProperty('--accent-text');
  applyTheme(cfg.theme);
  syncSettingsUI();
  saveSettings();
  update();
}

/* ── SETTINGS PANEL UI ──────────────────────────────────────── */

function openSettings() {
  document.getElementById('settings-panel').classList.add('open');
  document.getElementById('overlay').classList.add('open');
  document.getElementById('settings-toggle-btn').classList.add('active');
}

function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('settings-toggle-btn').classList.remove('active');
}

/* ── HISTORY ────────────────────────────────────────────────── */

function loadHistory() {
  try {
    savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (e) {
    savedHistory = [];
  }
}

function saveHistoryToStorage() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(savedHistory));
  } catch (e) {
    // Continue without persistence
  }
}

function toggleHistoryPanel() {
  const panel = document.getElementById('section-history');
  const btn   = document.getElementById('history-toggle-btn');
  const isHidden = panel.style.display === 'none' || panel.style.display === '';

  panel.style.display = isHidden ? 'block' : 'none';
  btn.classList.toggle('active', isHidden);

  if (isHidden) {
    renderHistory();
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function saveCurrentToHistory() {
  const minV  = parseFloat(document.getElementById('minV').value) || 0;
  const maxV  = parseFloat(document.getElementById('maxV').value) || 0;
  const minVp = parseFloat(document.getElementById('minVp').value) || 375;
  const maxVp = parseFloat(document.getElementById('maxVp').value) || 1440;
  const prop  = document.getElementById('prop').value || 'font-size';
  const token = document.getElementById('token-name').value || 'token';

  const item = {
    id:    Date.now(),
    name:  token,
    prop,
    minV, maxV, minVp, maxVp,
    base:  cfg.baseFontSize,
    ts:    Date.now(),
  };

  savedHistory.unshift(item);
  if (savedHistory.length > 25) savedHistory.pop();

  saveHistoryToStorage();
  renderHistory();
}

function loadFromHistory(id) {
  const item = savedHistory.find(h => h.id === id);
  if (!item) return;

  document.getElementById('prop').value       = item.prop;
  document.getElementById('token-name').value = item.name;
  document.getElementById('minV').value        = item.minV;
  document.getElementById('maxV').value        = item.maxV;
  document.getElementById('minVp').value       = item.minVp;
  document.getElementById('maxVp').value       = item.maxVp;
  update();
}

function deleteFromHistory(id, event) {
  event.stopPropagation();
  savedHistory = savedHistory.filter(h => h.id !== id);
  saveHistoryToStorage();
  renderHistory();
}

function clearHistory() {
  if (!confirm('Clear all saved formulas?')) return;
  savedHistory = [];
  saveHistoryToStorage();
  renderHistory();
}

function timeAgo(timestamp) {
  const diff = (Date.now() - timestamp) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function renderHistory() {
  const list = document.getElementById('history-list');

  if (!savedHistory.length) {
    list.innerHTML = '<p class="history-empty">No saved formulas yet. Generate a formula and click Save above.</p>';
    return;
  }

  list.innerHTML = savedHistory.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-info">
        <div class="history-name">${escapeHtml(item.name)}</div>
        <div class="history-meta">${escapeHtml(item.prop)}: ${item.minV}px → ${item.maxV}px (${item.minVp}px–${item.maxVp}px)</div>
      </div>
      <span class="history-time">${timeAgo(item.ts)}</span>
      <button class="history-del" data-del-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">✕</button>
    </div>
  `).join('');
}

/* ── COMPUTE ────────────────────────────────────────────────── */

function compute() {
  const minV  = parseFloat(document.getElementById('minV').value)  || 0;
  const maxV  = parseFloat(document.getElementById('maxV').value)  || 0;
  const minVp = parseFloat(document.getElementById('minVp').value) || cfg.defaultMinVp;
  const maxVp = parseFloat(document.getElementById('maxVp').value) || cfg.defaultMaxVp;
  const base  = cfg.baseFontSize || 16;
  const prec  = cfg.precision || 4;

  const slope     = (maxV - minV) / (maxVp - minVp);
  const intercept = minV - slope * minVp;

  function buildClamp(unit) {
    const calcPart = `calc(${fmt(intercept, prec)}px + ${fmt(slope * 100, prec + 2)}vw)`;
    if (unit === 'px') return `clamp(${fmt(minV, prec)}px, ${calcPart}, ${fmt(maxV, prec)}px)`;
    if (unit === 'em') return `clamp(${fmt(minV / base, prec)}em, ${calcPart}, ${fmt(maxV / base, prec)}em)`;
    return `clamp(${fmt(minV / base, prec)}rem, ${calcPart}, ${fmt(maxV / base, prec)}rem)`;
  }

  return {
    minV, maxV, minVp, maxVp, base, slope,
    icpt: intercept,
    calcStr:  `calc(${fmt(intercept, prec)}px + ${fmt(slope * 100, prec + 2)}vw)`,
    clampStr: buildClamp(clampUnit),
    clampRem: buildClamp('rem'),
    clampPx:  buildClamp('px'),
    clampEm:  buildClamp('em'),
    valueAt:  (vp) => Math.min(Math.max(intercept + slope * vp, minV), maxV),
  };
}

/* ── MAIN UPDATE ────────────────────────────────────────────── */

function update() {
  const minV  = parseFloat(document.getElementById('minV').value)  || 0;
  const maxV  = parseFloat(document.getElementById('maxV').value)  || 0;
  const minVp = parseFloat(document.getElementById('minVp').value) || 375;
  const maxVp = parseFloat(document.getElementById('maxVp').value) || 1440;
  const prop  = document.getElementById('prop').value || 'font-size';
  const token = (document.getElementById('token-name').value || 'token').replace(/\s+/g, '-');

  // Validation
  const errorEl = document.getElementById('error-alert');
  if (minV >= maxV || minVp >= maxVp) {
    errorEl.classList.add('visible');
    document.getElementById('error-msg').textContent = minV >= maxV
      ? 'Mobile value must be less than desktop value.'
      : 'Min viewport must be less than max viewport.';
  } else {
    errorEl.classList.remove('visible');
  }

  // WCAG check — font-size below 16px at minimum
  const wcagEl     = document.getElementById('wcag-alert');
  const isFontProp = prop.toLowerCase().includes('font') || prop.toLowerCase().includes('text');
  wcagEl.classList.toggle('visible', isFontProp && minV < 16);

  const c = compute();

  // Outputs
  document.getElementById('o-clamp').textContent = c.clampStr;
  document.getElementById('o-calc').textContent  = c.calcStr;
  document.getElementById('o-prop').textContent  = `${prop}: ${c.clampStr};`;
  document.getElementById('o-var').textContent   = `--${token}: ${c.clampRem};`;

  renderChart(c);
  renderBreakpointTable(c);
  renderExport(c, prop, token);
  updateSimulator();
}

/* ── CHART ──────────────────────────────────────────────────── */

function renderChart(c) {
  const svg = document.getElementById('curve-svg');

  const W  = 820, H  = 240;
  const pl = 58,  pr = 20;
  const pt = 22,  pb = 44;
  const cw = W - pl - pr;
  const ch = H - pt - pb;
  const maxViewport = 2560;

  const yMin = Math.min(c.minV, c.valueAt(320))       * 0.85;
  const yMax = Math.max(c.maxV, c.valueAt(maxViewport)) * 1.15;

  const xOf = (vp) => pl + (vp / maxViewport) * cw;
  const yOf = (v)  => pt + ch - ((v - yMin) / (yMax - yMin)) * ch;

  // Build the curve path
  const points = [];
  for (let vp = 0; vp <= maxViewport; vp += 20) {
    points.push(`${xOf(vp).toFixed(1)},${yOf(c.valueAt(vp)).toFixed(1)}`);
  }
  const linePath = 'M' + points.join('L');
  const areaPath = linePath + `L${xOf(maxViewport).toFixed(1)},${(pt + ch).toFixed(1)} L${xOf(0).toFixed(1)},${(pt + ch).toFixed(1)}Z`;

  // Y-axis grid lines
  let gridLines = '';
  for (let i = 0; i <= 5; i++) {
    const v = yMin + (yMax - yMin) * (i / 5);
    const y = yOf(v).toFixed(1);
    gridLines += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="currentColor" stroke-width="0.5" opacity="0.08"/>`;
    gridLines += `<text x="${pl - 6}" y="${parseFloat(y) + 4}" text-anchor="end" font-size="9" fill="currentColor" opacity="0.4">${v.toFixed(1)}</text>`;
  }

  // Breakpoint vertical dashed lines + labels
  let bpLines = '';
  CHART_BREAKPOINTS.forEach(vp => {
    const x = xOf(vp).toFixed(1);
    bpLines += `<line x1="${x}" y1="${pt}" x2="${x}" y2="${pt + ch}" stroke="currentColor" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.2"/>`;
    bpLines += `<text x="${x}" y="${pt + ch + 14}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.4">${vp}</text>`;
  });

  // Fluid zone shading (between minVp and maxVp)
  const fluidX1 = xOf(c.minVp);
  const fluidX2 = xOf(c.maxVp);
  const fluidZone = `<rect x="${fluidX1.toFixed(1)}" y="${pt}" width="${(fluidX2 - fluidX1).toFixed(1)}" height="${ch}" fill="currentColor" opacity="0.04" rx="2"/>`;

  // Clamp flat lines (dashed, outside the fluid range)
  const yMinLine = yOf(c.minV).toFixed(1);
  const yMaxLine = yOf(c.maxV).toFixed(1);
  const clampLines = `
    <line x1="${pl}" y1="${yMinLine}" x2="${xOf(c.minVp).toFixed(1)}" y2="${yMinLine}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.35"/>
    <line x1="${xOf(c.maxVp).toFixed(1)}" y1="${yMaxLine}" x2="${W - pr}" y2="${yMaxLine}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.35"/>
  `;

  // Accent colour for SVG elements
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1D9E75';

  // Dots at each standard breakpoint
  let dots = '';
  BREAKPOINTS.forEach(bp => {
    const x = xOf(bp.vp);
    const y = yOf(c.valueAt(bp.vp));
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${accent}" opacity="0.85" stroke="white" stroke-width="1.5"/>`;
  });

  // Simulator indicator line + dot (updated separately by updateSimulator)
  const simVp = parseFloat(document.getElementById('sim-slider').value) || 768;
  const simX  = xOf(simVp).toFixed(1);
  const simY  = yOf(c.valueAt(simVp)).toFixed(1);
  const simIndicator = `
    <line id="sim-line" x1="${simX}" y1="${pt}" x2="${simX}" y2="${pt + ch}" stroke="${accent}" stroke-width="1.5" opacity="0.6"/>
    <circle id="sim-dot" cx="${simX}" cy="${simY}" r="5" fill="${accent}" stroke="white" stroke-width="2"/>
  `;

  svg.innerHTML = `
    <defs>
      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${accent}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    ${gridLines}
    ${bpLines}
    ${fluidZone}
    <path d="${areaPath}" fill="url(#area-grad)"/>
    <path d="${linePath}" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${clampLines}
    ${dots}
    ${simIndicator}
    <text x="${pl}" y="${H - 6}" font-size="9" fill="currentColor" opacity="0.35">Viewport width (px)</text>
    <text x="${pl - 4}" y="${pt}" font-size="9" fill="currentColor" opacity="0.35">px</text>
  `;
}

/* ── VIEWPORT SIMULATOR ─────────────────────────────────────── */

function updateSimulator() {
  const c   = compute();
  const vp  = parseFloat(document.getElementById('sim-slider').value) || 768;
  const val = c.valueAt(vp);
  const pct = c.maxV > c.minV
    ? Math.round((val - c.minV) / (c.maxV - c.minV) * 100)
    : 0;

  document.getElementById('sim-vp').textContent  = vp + 'px';
  document.getElementById('sim-val').textContent = val.toFixed(2) + 'px';
  document.getElementById('sim-rem').textContent = (val / c.base).toFixed(3) + 'rem';
  document.getElementById('sim-pct').textContent = pct + '%';
  document.getElementById('preview-text').style.fontSize = val + 'px';

  // Move the indicator on the chart without redrawing everything
  const svg = document.getElementById('curve-svg');
  const simLine = svg.querySelector('#sim-line');
  const simDot  = svg.querySelector('#sim-dot');
  if (!simLine || !simDot) return;

  const W = 820, pl = 58, pr = 20, pt = 22, pb = 44;
  const cw = W - pl - pr;
  const ch = 240 - pt - pb;

  const yMin = Math.min(c.minV, c.valueAt(320))       * 0.85;
  const yMax = Math.max(c.maxV, c.valueAt(2560)) * 1.15;

  const xOf = (v)  => pl + (v / 2560) * cw;
  const yOf = (v)  => pt + ch - ((v - yMin) / (yMax - yMin)) * ch;

  const x = xOf(vp).toFixed(1);
  const y = yOf(val).toFixed(1);

  simLine.setAttribute('x1', x);
  simLine.setAttribute('x2', x);
  simDot.setAttribute('cx', x);
  simDot.setAttribute('cy', y);
}

/* ── BREAKPOINT TABLE ───────────────────────────────────────── */

function renderBreakpointTable(c) {
  const tbody = document.getElementById('bp-tbody');

  tbody.innerHTML = BREAKPOINTS.map(bp => {
    const val = c.valueAt(bp.vp);
    const pct = c.maxV > c.minV
      ? Math.round((val - c.minV) / (c.maxV - c.minV) * 100)
      : 0;

    return `
      <tr>
        <td>
          <div class="device-cell">
            <div class="device-icon-wrap">${getDeviceIcon(bp.type)}</div>
            <div>
              <div class="device-name">${bp.label}</div>
              <span class="badge ${TYPE_BADGES[bp.type]} device-tag">${TYPE_LABELS[bp.type]}</span>
            </div>
          </div>
        </td>
        <td class="mono-sm">${bp.vp}px</td>
        <td class="mono-lg">${val.toFixed(2)}px</td>
        <td class="mono-sm">${(val / c.base).toFixed(3)}rem</td>
        <td>
          <div class="scale-cell">
            <div class="bar-wrap">
              <div class="bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="scale-pct">${pct}%</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getDeviceIcon(type) {
  if (type === 'm') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
  }
  if (type === 't') {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
}

/* ── EXPORT ─────────────────────────────────────────────────── */

function renderExport(c, prop, token) {
  const clamp = c.clampRem;
  const bpComments = BREAKPOINTS
    .map(bp => `  /* ${bp.vp}px (${TYPE_LABELS[bp.type].toLowerCase()}): ${c.valueAt(bp.vp).toFixed(2)}px */`)
    .join('\n');

  // CSS Custom Properties
  document.getElementById('exp-css-code').textContent = [
    `:root {`,
    `  --${token}: ${clamp};`,
    `}`,
    ``,
    `/* Usage */`,
    `.element {`,
    `  ${prop}: var(--${token});`,
    `}`,
    ``,
    `/* Breakpoint reference:`,
    bpComments,
    `*/`,
  ].join('\n');

  // SCSS
  document.getElementById('exp-scss-code').textContent = [
    `// Fluid ${token}`,
    `$${token}: ${clamp};`,
    ``,
    `// Mixin`,
    `@mixin fluid-${token} {`,
    `  ${prop}: $${token};`,
    `}`,
    ``,
    `// Usage`,
    `.element {`,
    `  @include fluid-${token};`,
    `}`,
    ``,
    `// Or directly:`,
    `.element {`,
    `  ${prop}: $${token};`,
    `}`,
  ].join('\n');

  // Tailwind
  const twKey = getTailwindKey(prop);
  document.getElementById('exp-tw-code').textContent = [
    `// tailwind.config.js`,
    `module.exports = {`,
    `  theme: {`,
    `    extend: {`,
    `      ${twKey}: {`,
    `        '${token}': '${clamp}',`,
    `      },`,
    `    },`,
    `  },`,
    `};`,
    ``,
    `// Usage in HTML:`,
    `// <p class="text-${token}">...</p>`,
  ].join('\n');

  // Design Tokens JSON (W3C format)
  const tokenData = {
    [token]: {
      '$value':       clamp,
      '$type':        isFontSizeProp(prop) ? 'fontSizes' : 'spacing',
      '$description': `Fluid ${prop} from ${c.minV}px at ${c.minVp}px to ${c.maxV}px at ${c.maxVp}px`,
      'fluid': {
        'min':         `${fmt(c.minV / c.base, 4)}rem`,
        'max':         `${fmt(c.maxV / c.base, 4)}rem`,
        'minViewport': `${c.minVp}px`,
        'maxViewport': `${c.maxVp}px`,
        'slope':       parseFloat((c.slope * 100).toFixed(6)),
        'intercept':   parseFloat(c.icpt.toFixed(4)),
      },
    },
  };
  document.getElementById('exp-json-code').textContent = JSON.stringify(tokenData, null, 2);
}

function getTailwindKey(prop) {
  if (prop.includes('font-size') || prop.includes('text')) return 'fontSize';
  if (prop.includes('padding'))      return 'padding';
  if (prop.includes('margin'))       return 'margin';
  if (prop.includes('gap'))          return 'gap';
  if (prop.includes('radius'))       return 'borderRadius';
  if (prop.includes('width') || prop.includes('height')) return 'spacing';
  return 'spacing';
}

function isFontSizeProp(prop) {
  return prop.toLowerCase().includes('font') || prop.toLowerCase().includes('text');
}

/* ── COPY TO CLIPBOARD ──────────────────────────────────────── */

function copyElement(targetId, btn) {
  const el = document.getElementById(targetId);
  if (!el) return;

  navigator.clipboard.writeText(el.textContent).then(() => {
    const originalHTML = btn.innerHTML;
    btn.classList.add('ok');
    btn.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied
    `;
    setTimeout(() => {
      btn.classList.remove('ok');
      btn.innerHTML = originalHTML;
    }, 1800);
  });
}

/* ── UTILITIES ──────────────────────────────────────────────── */

function fmt(n, decimals = 4) {
  return parseFloat(n.toFixed(decimals));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

/* ── TABS ───────────────────────────────────────────────────── */

function switchTab(tabsHeaderId, targetTabId) {
  const header  = document.getElementById(tabsHeaderId);
  const section = header.closest('.card');

  section.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  header.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(targetTabId).classList.add('active');
  header.querySelector(`[data-tab="${targetTabId}"]`).classList.add('active');
}

/* ── EVENT LISTENERS ────────────────────────────────────────── */

function bindEvents() {

  // ── Settings panel open/close
  document.getElementById('settings-toggle-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close-btn').addEventListener('click', closeSettings);
  document.getElementById('overlay').addEventListener('click', closeSettings);
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);

  // ── History panel toggle
  document.getElementById('history-toggle-btn').addEventListener('click', toggleHistoryPanel);
  document.getElementById('save-history-btn').addEventListener('click', saveCurrentToHistory);
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

  // Event delegation for history items (load on row click, delete on button click)
  document.getElementById('history-list').addEventListener('click', (e) => {
    const delBtn = e.target.closest('[data-del-id]');
    if (delBtn) {
      deleteFromHistory(parseInt(delBtn.dataset.delId, 10), e);
      return;
    }
    const item = e.target.closest('.history-item');
    if (item) loadFromHistory(parseInt(item.dataset.id, 10));
  });

  // ── Main inputs — trigger update on change
  ['prop', 'token-name', 'minV', 'maxV', 'minVp', 'maxVp'].forEach(id => {
    document.getElementById(id).addEventListener('input', update);
  });

  // ── Presets
  document.getElementById('presets-wrap').addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;

    document.getElementById('prop').value       = btn.dataset.prop;
    document.getElementById('token-name').value = btn.dataset.token;
    document.getElementById('minV').value        = btn.dataset.min;
    document.getElementById('maxV').value        = btn.dataset.max;
    document.getElementById('minVp').value       = cfg.defaultMinVp;
    document.getElementById('maxVp').value       = cfg.defaultMaxVp;

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    update();
  });

  // ── Unit pills (rem / px / em on the clamp output row)
  document.querySelector('.unit-pills').addEventListener('click', (e) => {
    const pill = e.target.closest('.unit-pill');
    if (!pill) return;

    clampUnit = pill.dataset.unit;
    document.querySelectorAll('.unit-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    const c = compute();
    document.getElementById('o-clamp').textContent = c.clampStr;
  });

  // ── Copy buttons (event delegation on document)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn[data-target]');
    if (btn) copyElement(btn.dataset.target, btn);
  });

  // ── Viewport simulator slider
  document.getElementById('sim-slider').addEventListener('input', updateSimulator);

  // ── Preview textarea auto-resize
  document.getElementById('preview-text').addEventListener('input', (e) => {
    autoResizeTextarea(e.target);
  });

  // ── Export tabs
  document.getElementById('export-tabs-header').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.dataset.tab) {
      switchTab('export-tabs-header', btn.dataset.tab);
    }
  });

  // ── Settings: theme segmented control
  document.getElementById('theme-seg').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    cfg.theme = btn.dataset.value;
    document.querySelectorAll('#theme-seg .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyTheme(cfg.theme);
    saveSettings();
  });

  // ── Settings: output unit segmented control
  document.getElementById('unit-seg').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    cfg.outputUnit = btn.dataset.value;
    document.querySelectorAll('#unit-seg .seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings();
    update();
  });

  // ── Settings: colour swatches
  document.getElementById('accent-swatches').addEventListener('click', (e) => {
    const swatch = e.target.closest('.swatch');
    if (!swatch) return;
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    cfg.accent = swatch.dataset.color;
    document.getElementById('accent-custom').value = cfg.accent;
    applyAccent(cfg.accent);
    saveSettings();
    update(); // re-render chart with new accent
  });

  // ── Settings: custom colour picker
  document.getElementById('accent-custom').addEventListener('input', (e) => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    cfg.accent = e.target.value;
    applyAccent(cfg.accent);
    saveSettings();
    update();
  });

  // ── Settings: numeric inputs (base font, default viewports)
  document.getElementById('s-base').addEventListener('input', (e) => {
    cfg.baseFontSize = parseFloat(e.target.value) || 16;
    saveSettings();
    update();
  });

  document.getElementById('s-minvp').addEventListener('input', (e) => {
    cfg.defaultMinVp = parseFloat(e.target.value) || 375;
    saveSettings();
  });

  document.getElementById('s-maxvp').addEventListener('input', (e) => {
    cfg.defaultMaxVp = parseFloat(e.target.value) || 1440;
    saveSettings();
  });

  // ── Settings: precision range slider
  document.getElementById('s-prec').addEventListener('input', (e) => {
    cfg.precision = parseInt(e.target.value, 10);
    document.getElementById('prec-val').textContent = cfg.precision;
    saveSettings();
    update();
  });

  // ── Settings: section visibility toggles
  document.querySelectorAll('.toggle input[type="checkbox"][data-section]').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const key = toggle.dataset.key;
      cfg[key] = toggle.checked;
      toggleSection(toggle.dataset.section, toggle.checked);
      saveSettings();
    });
  });

  // ── Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 's' || e.key === 'S') openSettings();
    if (e.key === 'h' || e.key === 'H') toggleHistoryPanel();
    if (e.key === 'Escape')              closeSettings();

    // Cmd/Ctrl+C copies the main clamp formula
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      const clampEl  = document.getElementById('o-clamp');
      const firstBtn = document.querySelector('.copy-btn[data-target="o-clamp"]');
      if (clampEl && firstBtn) copyElement('o-clamp', firstBtn);
    }
  });
}

/* ── INIT ───────────────────────────────────────────────────── */

function init() {
  loadSettings();
  loadHistory();

  // Pre-fill viewport inputs from saved settings
  document.getElementById('minVp').value = cfg.defaultMinVp;
  document.getElementById('maxVp').value = cfg.defaultMaxVp;

  bindEvents();
  update();
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
