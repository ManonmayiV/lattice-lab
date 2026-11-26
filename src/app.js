import { mulberry32 } from './prng.js';
import {
  Q, keygen, encrypt, decrypt, simulate, analyticFailureRate, noiseStdDev,
  solveSecret, bytesToBits, bitsToBytes,
} from './lwe.js';
import {
  SEMIPRIMES, shorTrial, factorWithShor, powerSequence, scalingExperiment, fitLine,
} from './shor.js';
import { KEMS, SIGS, totalBytes, ratioTo } from './sizes.js';
import { QUIZ } from './quiz.js';
import { histogramSvg, lineChartSvg, barChartSvg } from './svg.js';

const $ = (id) => document.getElementById(id);

// Escape anything that did not come from a number we computed ourselves.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fmt = (n) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- Experiment 1

const nSelect = $('shor-n');
for (const n of SEMIPRIMES) nSelect.add(new Option(String(n), String(n)));
nSelect.value = '15';
$('shor-a').value = '7';

function renderTrial(n, t) {
  if (t.outcome === 'invalid') {
    return `<div class="card"><span class="bad">${esc(t.note)}</span></div>`;
  }
  let html = '';
  if (t.outcome === 'lucky') {
    html += `<div class="card"><span class="ok">Lucky guess.</span> ${esc(t.note)}. So ${n} = ${t.factors[0]} × ${t.factors[1]}. A real run would rarely get this lucky with a 2048-bit N.</div>`;
    return html;
  }
  const show = Math.min(24, t.r * 2);
  const seq = powerSequence(t.a, n, show);
  html += `<div class="card"><strong>Step 1. Watch the pattern repeat.</strong><p class="seq mono">${t.a}<sup>x</sup> mod ${n} for x = 0, 1, 2, ...: ${seq.join(', ')}${show < t.r * 2 ? ', ...' : ''}</p>`;
  html += `<p>The first return to 1 is at x = <strong>${t.r}</strong>. That repeat length is the <em>order</em> r. A quantum computer finds r quickly. Here we found it by counting.</p></div>`;
  html += `<div class="card"><strong>Step 2. Turn the period into factors.</strong><ol>`;
  html += `<li>r = ${t.r} is ${t.r % 2 === 0 ? 'even, which we need' : 'odd, which breaks the method'}.</li>`;
  if (t.r % 2 === 0) {
    html += `<li>a<sup>r/2</sup> mod N = ${t.a}<sup>${t.r / 2}</sup> mod ${n} = <strong>${t.half}</strong>${t.half === n - 1 ? ', which is -1 mod N and breaks the method' : ''}.</li>`;
  }
  html += `</ol>`;
  if (t.outcome === 'factored') {
    html += `<p>gcd(${t.half} - 1, ${n}) = ${t.gcds[0]} and gcd(${t.half} + 1, ${n}) = ${t.gcds[1]}.</p>`;
    html += `<p class="ok">${n} = ${t.factors[0]} × ${t.factors[1]}. Factored.</p>`;
  } else {
    html += `<p class="bad">${esc(t.note)}.</p>`;
  }
  html += `</div>`;
  return html;
}

$('shor-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const n = Number(nSelect.value);
  const a = Number($('shor-a').value);
  const out = $('shor-out');
  if (!Number.isInteger(a) || a < 2 || a >= n) {
    out.innerHTML = `<div class="card"><span class="bad">Pick a whole number a with 2 ≤ a ≤ ${n - 1}.</span></div>`;
    return;
  }
  out.innerHTML = renderTrial(n, shorTrial(n, a));
});

$('shor-auto').addEventListener('click', () => {
  const n = Number(nSelect.value);
  const res = factorWithShor(n);
  let html = `<div class="table-wrap"><table><caption>Every base tried for N = ${n}, in order</caption><thead><tr><th>Base a</th><th class="num">Order r</th><th>Outcome</th></tr></thead><tbody>`;
  for (const t of res.attempts) {
    const outcome = t.outcome === 'factored' ? `Factored: ${n} = ${t.factors[0]} × ${t.factors[1]}` : t.outcome === 'lucky' ? esc(t.note) : esc(t.note);
    html += `<tr><td>${t.a}</td><td class="num">${t.r ?? 'n/a'}</td><td>${outcome}</td></tr>`;
  }
  html += `</tbody></table></div>`;
  $('shor-out').innerHTML = html;
});

$('scale-run').addEventListener('click', () => {
  const btn = $('scale-run');
  const out = $('scale-out');
  btn.disabled = true;
  out.textContent = 'Measuring...';
  setTimeout(() => {
    const t0 = performance.now();
    const samples = scalingExperiment([10, 12, 14, 16, 18, 20, 22, 24]);
    const ms = Math.round(performance.now() - t0);
    const points = samples.map((s) => ({ x: s.bits, y: s.log2steps }));
    const fit = fitLine(points);
    const at2048 = Math.round(fit.intercept + fit.slope * 2048);
    let html = lineChartSvg({
      id: 'scale',
      points,
      fit,
      title: 'Brute-force steps versus bit length of N',
      desc: `Each dot is one brute-force order search. The vertical axis is log base 2 of the steps. The dashed line is a straight-line fit with slope ${fit.slope.toFixed(2)}.`,
      xLabel: 'bit length of N',
      yLabel: 'log2 of steps taken',
    });
    const lo = Math.min(...samples.map((s) => s.bits));
    const hi = Math.max(...samples.map((s) => s.bits));
    html += `<div class="card"><p>${samples.length} searches on semiprimes of ${lo} to ${hi} bits finished in ${ms} ms. The fitted slope is <strong>${fit.slope.toFixed(2)}</strong>, so each extra bit of N roughly multiplies the work by ${Math.pow(2, fit.slope).toFixed(2)}.</p>`;
    html += `<p>If that trend held for a 2048-bit modulus, brute-force period finding would need about <strong>2 to the power of ${fmt(at2048)}</strong> steps. That is an extrapolation from small sizes, and the number field sieve does much better in practice. The point is that period finding by counting cannot scale, while Shor's quantum period finding grows only polynomially with the bit length.</p></div>`;
    html += `<details><summary>All ${samples.length} measurements as a table</summary><div class="table-wrap"><table><caption>Brute-force order search results</caption><thead><tr><th class="num">Bits</th><th class="num">N</th><th class="num">a</th><th class="num">Steps (order r)</th></tr></thead><tbody>`;
    for (const s of samples) html += `<tr><td class="num">${s.bits}</td><td class="num">${fmt(s.n)}</td><td class="num">${s.a}</td><td class="num">${fmt(s.steps)}</td></tr>`;
    html += `</tbody></table></div></details>`;
    out.innerHTML = html;
    btn.disabled = false;
  }, 30);
});

// ---------------------------------------------------------------- Experiment 2

const lweParams = () => ({
  n: Number($('lwe-n').value),
  m: Number($('lwe-m').value),
  B: Number($('lwe-b').value),
});
const lweSeed = () => (Number($('lwe-seed').value) || 0) >>> 0;
const pct = (p) => (p === 0 ? '0%' : p < 0.0001 ? 'under 0.01%' : `${(p * 100).toFixed(2)}%`);

function updateLive() {
  const p = lweParams();
  $('lwe-n-out').textContent = p.n;
  $('lwe-m-out').textContent = p.m;
  $('lwe-b-out').textContent = p.B;
  const sigma = noiseStdDev(p);
  $('lwe-live').textContent =
    `A bit decrypts wrongly when the noise passes q/4 = ${Math.floor(Q / 4)}. ` +
    `Typical noise (standard deviation) is about ${sigma.toFixed(1)}. ` +
    `Predicted chance of a wrong bit: ${pct(analyticFailureRate(p))}.`;
}
// Old results describe old settings, so clear them whenever a slider or the seed moves.
function clearLweResults() {
  for (const id of ['lwe-send-out', 'lwe-sim-out', 'lwe-attack-out']) $(id).replaceChildren();
}
for (const id of ['lwe-n', 'lwe-m', 'lwe-b']) {
  $(id).addEventListener('input', () => {
    updateLive();
    clearLweResults();
  });
}
$('lwe-seed').addEventListener('input', clearLweResults);
updateLive();

$('lwe-send-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const params = lweParams();
  const rng = mulberry32(lweSeed());
  const text = $('lwe-msg').value;
  const bytes = new TextEncoder().encode(text).slice(0, 12);
  const out = $('lwe-send-out');
  if (bytes.length === 0) {
    out.textContent = 'Type a short message first.';
    return;
  }
  const { pk, sk } = keygen(rng, params);
  const bits = bytesToBits(bytes);
  const got = bits.map((bit) => decrypt(sk, encrypt(rng, pk, bit)).bit);
  const flips = got.filter((b, i) => b !== bits[i]).length;
  const back = new TextDecoder().decode(bitsToBytes(got));
  out.replaceChildren();
  const card = document.createElement('div');
  card.className = 'card';
  const line1 = document.createElement('p');
  line1.append('Sent: ');
  const c1 = document.createElement('code');
  c1.textContent = text;
  line1.append(c1);
  const line2 = document.createElement('p');
  line2.append('Decrypted: ');
  const c2 = document.createElement('code');
  c2.textContent = back;
  line2.append(c2);
  const line3 = document.createElement('p');
  line3.className = flips === 0 ? 'ok' : 'bad';
  line3.textContent =
    flips === 0
      ? `All ${bits.length} bits decrypted correctly.`
      : `${flips} of ${bits.length} bits flipped, so the message is damaged. Noise was too large for this modulus.`;
  const line4 = document.createElement('p');
  line4.textContent = `Each bit was encrypted separately with ${params.m} samples in dimension ${params.n}. Public data per bit: ${params.n} numbers plus one.`;
  card.append(line1, line2, line3, line4);
  out.append(card);
});

$('lwe-sim').addEventListener('click', () => {
  const btn = $('lwe-sim');
  const params = lweParams();
  btn.disabled = true;
  setTimeout(() => {
    const res = simulate(mulberry32(lweSeed() + 1), params, 2000);
    const predicted = analyticFailureRate(params);
    let html = histogramSvg({
      id: 'hist',
      values: res.noise,
      domain: [-Math.floor(Q / 2), Math.floor(Q / 2)],
      bins: 41,
      threshold: Q / 4,
      title: 'Distribution of decryption noise over 2,000 trials',
      desc: `Noise values cluster around zero. Bits decrypt wrongly when noise falls beyond plus or minus ${Math.floor(Q / 4)}. ${res.failures} of 2000 trials failed.`,
      xLabel: 'noise term added during decryption',
    });
    html += `<div class="card"><p><strong>${res.failures}</strong> of 2,000 bits decrypted wrongly (<strong>${pct(res.rate)}</strong>). The normal-curve prediction was <strong>${pct(predicted)}</strong>.</p>`;
    html += `<p>Parameters: n = ${params.n}, m = ${params.m}, B = ${params.B}, q = ${Q}, seed ${lweSeed() + 1}. Same settings and seed give the same numbers.</p></div>`;
    $('lwe-sim-out').innerHTML = html;
    btn.disabled = false;
  }, 20);
});

$('lwe-attack').addEventListener('click', () => {
  const params = lweParams();
  const { pk, sk } = keygen(mulberry32(lweSeed() + 2), params);
  const res = solveSecret(pk);
  const out = $('lwe-attack-out');
  if (!res.ok) {
    out.innerHTML = `<div class="card"><span class="bad">The random matrix was singular for this seed. Change the seed and try again.</span></div>`;
    return;
  }
  const matches = res.s.filter((v, i) => v === sk.s[i]).length;
  const recovered = matches === params.n;
  let html = `<div class="card"><p class="${recovered ? 'bad' : 'ok'}">${recovered ? `Secret recovered: all ${params.n} entries match. With no noise, the lock is just algebra.` : `Attack failed: ${matches} of ${params.n} secret entries match.`}</p>`;
  html += `<p>Largest gap between A·s' and b across all ${params.m} equations: <strong>${res.residual}</strong>. A correct secret would leave a gap of at most B = ${params.B}.</p>`;
  html += recovered
    ? `<p>Gauss-Jordan elimination needs only ${params.n} equations when nothing is hidden. Move the noise slider above 0 and run it again.</p></div>`
    : `<p>Gauss-Jordan elimination solves ${params.n} noisy equations exactly, so the noise gets baked into the answer. Real attacks use lattice reduction, which is why real systems use far larger dimensions than this toy.</p></div>`;
  out.innerHTML = html;
});

// ---------------------------------------------------------------- Experiment 3

function renderSizes(list, base, chartId, tableId, roleLabels) {
  const items = list.map((x) => ({
    label: `${x.name}${x.shorVulnerable ? ' (Shor-vulnerable)' : ''}`,
    value: totalBytes(x),
    hatched: x.shorVulnerable,
  }));
  $(chartId).innerHTML = barChartSvg({
    id: `${chartId}-svg`,
    items,
    title: `${roleLabels.title}: bytes per exchange`,
    desc: `Bar chart of public key plus ${roleLabels.second} in bytes. Hatched bars are broken by Shor's algorithm. Solid bars are lattice-based.`,
  });
  let t = `<table><caption>${roleLabels.title}, sizes in bytes (hatched bars above are Shor-vulnerable)</caption><thead><tr><th>Scheme</th><th class="num">Public key</th><th class="num">${roleLabels.second}</th><th class="num">Exchange total</th><th class="num">× ${esc(base.name)}</th><th>Against Shor's algorithm</th><th>Source</th></tr></thead><tbody>`;
  for (const x of list) {
    t += `<tr><td>${esc(x.name)}</td><td class="num">${fmt(x.publicKey)}</td><td class="num">${fmt(x.response)}</td><td class="num">${fmt(totalBytes(x))}</td><td class="num">${ratioTo(x, base).toFixed(1)}</td><td>${x.shorVulnerable ? 'Broken by a large quantum computer' : 'No known efficient quantum attack'}</td><td>${esc(x.source)}</td></tr>`;
  }
  $(tableId).innerHTML = t + '</tbody></table>';
}
renderSizes(KEMS, KEMS[0], 'kem-chart', 'kem-table', { title: 'Key exchange', second: 'Ciphertext or peer share' });
renderSizes(SIGS, SIGS[0], 'sig-chart', 'sig-table', { title: 'Signatures', second: 'Signature' });

// ---------------------------------------------------------------- Quiz

const quizForm = $('quiz-form');
QUIZ.forEach((item, qi) => {
  const fs = document.createElement('fieldset');
  const lg = document.createElement('legend');
  lg.textContent = `Question ${qi + 1}. ${item.q}`;
  fs.append(lg);
  item.options.forEach((opt, oi) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `q${qi}`;
    input.value = String(oi);
    label.append(input, ` ${opt}`);
    fs.append(label);
  });
  quizForm.append(fs);
});
const submit = document.createElement('button');
submit.type = 'submit';
submit.textContent = 'Check answers';
quizForm.append(submit);

quizForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  let score = 0;
  const out = $('quiz-out');
  out.replaceChildren();
  const list = document.createElement('ol');
  QUIZ.forEach((item, qi) => {
    const chosen = quizForm.querySelector(`input[name="q${qi}"]:checked`);
    const li = document.createElement('li');
    if (!chosen) {
      li.textContent = `Not answered. ${item.why}`;
    } else if (Number(chosen.value) === item.answer) {
      score++;
      li.textContent = `Correct. ${item.why}`;
    } else {
      li.textContent = `Not quite. ${item.why}`;
    }
    list.append(li);
  });
  const head = document.createElement('p');
  head.className = score === QUIZ.length ? 'ok' : '';
  head.textContent = `You got ${score} of ${QUIZ.length}.`;
  out.append(head, list);
});
