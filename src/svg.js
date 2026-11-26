// Tiny dependency-free SVG chart builders. Each chart carries a <title> and <desc> for
// screen readers, and the page pairs every chart with a text table of the same data.
// Colours pass 4.5:1 contrast on white and meaning is never carried by colour alone
// (fail zones use hatching and text labels).

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const INK = '#1b1b1f';
const BLUE = '#1f5aa6';
const RED = '#a61b1b';
const GRID = '#d5d7dd';

const open = (w, h, title, desc, id) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" font-family="system-ui, sans-serif" font-size="12">` +
  `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>` +
  `<defs><pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  `<rect width="6" height="6" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="6" stroke="${RED}" stroke-width="2"/></pattern></defs>`;

export function histogramSvg({ id = 'hist', values, domain, bins, threshold, title, desc, xLabel }) {
  const W = 680, H = 290, L = 52, R = 16, T = 20, Bt = 58;
  const pw = W - L - R, ph = H - T - Bt;
  const [lo, hi] = domain;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins)));
    counts[idx]++;
  }
  const max = Math.max(1, ...counts);
  const x = (v) => L + ((v - lo) / (hi - lo)) * pw;
  const y = (c) => T + ph - (c / max) * ph;
  let s = open(W, H, title, desc, id);
  // fail zones
  s += `<rect x="${L}" y="${T}" width="${x(-threshold) - L}" height="${ph}" fill="url(#${id}-hatch)" opacity="0.35"/>`;
  s += `<rect x="${x(threshold)}" y="${T}" width="${L + pw - x(threshold)}" height="${ph}" fill="url(#${id}-hatch)" opacity="0.35"/>`;
  const bw = pw / bins;
  counts.forEach((c, i) => {
    if (!c) return;
    s += `<rect x="${L + i * bw + 1}" y="${y(c)}" width="${bw - 2}" height="${T + ph - y(c)}" fill="${BLUE}"/>`;
  });
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="${INK}"/>`;
  s += `<line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="${INK}"/>`;
  for (const t of [-threshold, threshold]) {
    s += `<line x1="${x(t)}" y1="${T}" x2="${x(t)}" y2="${T + ph}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 4"/>`;
  }
  s += `<text x="${x(-threshold) - 6}" y="${T + 14}" text-anchor="end" fill="${RED}" font-weight="600">wrong bit zone</text>`;
  s += `<text x="${x(threshold) + 6}" y="${T + 14}" fill="${RED}" font-weight="600">wrong bit zone</text>`;
  for (const t of [lo, -threshold, 0, threshold, hi]) {
    s += `<text x="${x(t)}" y="${T + ph + 16}" text-anchor="middle" fill="${INK}">${Math.round(t)}</text>`;
  }
  s += `<text x="${L + pw / 2}" y="${H - 22}" text-anchor="middle" fill="${INK}">${esc(xLabel)}</text>`;
  s += `<text x="${L + pw / 2}" y="${H - 6}" text-anchor="middle" fill="${INK}">dashed lines: -q/4 and +q/4 (${Math.round(threshold)})</text>`;
  s += `<text transform="translate(14 ${T + ph / 2}) rotate(-90)" text-anchor="middle" fill="${INK}">count (max ${max})</text>`;
  return s + '</svg>';
}

export function lineChartSvg({ id = 'scale', points, fit, title, desc, xLabel, yLabel }) {
  const W = 680, H = 300, L = 58, R = 16, T = 16, Bt = 48;
  const pw = W - L - R, ph = H - T - Bt;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1;
  const y0 = 0, y1 = Math.ceil(Math.max(...ys) + 1);
  const X = (v) => L + ((v - x0) / (x1 - x0)) * pw;
  const Y = (v) => T + ph - ((v - y0) / (y1 - y0)) * ph;
  let s = open(W, H, title, desc, id);
  for (let v = y0; v <= y1; v += Math.max(1, Math.round((y1 - y0) / 6))) {
    s += `<line x1="${L}" y1="${Y(v)}" x2="${L + pw}" y2="${Y(v)}" stroke="${GRID}"/>`;
    s += `<text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" fill="${INK}">${v}</text>`;
  }
  for (let v = Math.ceil(x0); v <= x1; v += 2) {
    s += `<text x="${X(v)}" y="${T + ph + 16}" text-anchor="middle" fill="${INK}">${v}</text>`;
  }
  s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="${INK}"/>`;
  s += `<line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" stroke="${INK}"/>`;
  if (fit) {
    s += `<line x1="${X(x0)}" y1="${Y(fit.intercept + fit.slope * x0)}" x2="${X(x1)}" y2="${Y(fit.intercept + fit.slope * x1)}" stroke="${RED}" stroke-width="2" stroke-dasharray="6 4"/>`;
  }
  for (const p of points) s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" fill="${BLUE}" fill-opacity="0.75"/>`;
  s += `<text x="${L + pw / 2}" y="${H - 8}" text-anchor="middle" fill="${INK}">${esc(xLabel)}</text>`;
  s += `<text transform="translate(14 ${T + ph / 2}) rotate(-90)" text-anchor="middle" fill="${INK}">${esc(yLabel)}</text>`;
  return s + '</svg>';
}

export function barChartSvg({ id = 'sizes', items, title, desc, unit = 'bytes' }) {
  const rowH = 30, L = 300, R = 110, T = 8;
  const W = 760, H = T + items.length * rowH + 8;
  const max = Math.max(...items.map((i) => i.value));
  const pw = W - L - R;
  let s = open(W, H, title, desc, id);
  items.forEach((it, i) => {
    const y = T + i * rowH;
    const w = Math.max(2, (it.value / max) * pw);
    s += `<text x="${L - 8}" y="${y + 18}" text-anchor="end" fill="${INK}">${esc(it.label)}</text>`;
    const fill = it.hatched ? `url(#${id}-hatch)` : BLUE;
    const stroke = it.hatched ? RED : BLUE;
    s += `<rect x="${L}" y="${y + 4}" width="${w}" height="20" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    s += `<text x="${L + w + 6}" y="${y + 18}" fill="${INK}">${it.value.toLocaleString('en-US')} ${esc(unit)}</text>`;
  });
  return s + '</svg>';
}
