/*
 * app.js — flujo "Vuestro plan en 5 minutos" + presentación adaptada + dudas + reserva.
 * Sin frameworks: estado en un objeto, render con plantillas, eventos delegados con data-act.
 */
(function () {
  // ------------------------------------------------------------------ formato
  const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: true });
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const group = n => { const s = nf0.format(Math.round(n)); return Math.abs(n) >= 1000 && Math.abs(n) < 10000 && !s.includes('.') ? s.replace(/^(-?\d)(\d{3})$/, '$1.$2') : s; };
  const Fmt = {
    money(v) {
      if (v == null || isNaN(v)) return 'sin dato';
      if (Math.abs(v) >= 1e6 && v % 1e6 !== 0) return (v / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' M$';
      return group(v) + ' $';
    },
    short(v) { return Math.abs(v) >= 1e6 ? (v / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' M$' : Math.round(v / 1000) + ' k$'; },
    pct(v, d = 0) { if (v == null) return 'sin dato'; return (v * 100).toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: 0 }) + ' %'; },
    month(ym) { if (!ym) return 'sin dato'; const [y, m] = ym.split('-'); return MONTHS[+m - 1] + ' de ' + y; },
    // Nota según qué pasos se hacen. Sale de score.top_moves / combined_moves; nunca se calcula.
    scoreFor(f, keys) {
      const T = { card: 'Pay down revolving card', life: 'Add life cover', umbrella: 'Add umbrella cover' };
      const set = keys.map(k => T[k]).sort().join('|');
      if (!keys.length) return f.score.now;
      if (keys.length === 1) { const m = f.score.moves.find(x => x.title === T[keys[0]]); return m ? m.after : null; }
      const c = f.score.combined.find(x => x.moves.slice().sort().join('|') === set);
      return c ? c.after : null;
    },
  };
  window.Fmt = Fmt;
  const M = Fmt.money, P = Fmt.pct, D = Fmt.month;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ estado
  const KEY = 'weah-plan-v1';
  const fresh = () => ({
    stage: 'home', qi: 0, who: null, phrase: null,
    a: {}, // respuestas del quiz
    sig: { whyOpens: 0, times: [], skippedLife: false, noIdea: 0 },
    prefs: { format: null, depth: null, tone: null, level: null },
    gain: null, payDate: null, week: null, fold: {},
    steps: { card: null, life: null, umbrella: null },
    doubts: [], // {id, topic, q, a, covered, status}
    shareStyle: true, booking: null, cardFmt: {},
  });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* sin almacenamiento */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } };

  let F = null, DB = null; // facts, banco de dudas
  let qStart = Date.now();
  const app = document.getElementById('app');
  const topActions = document.getElementById('top-actions');

  // ------------------------------------------------------------------ quiz: definición
  const QUIZ = ['who', 'card', 'format', 'year', 'cash', 'life', 'feel', 'retire', 'gain', 'depth'];
  const GAIN_OPTS = [['moon', 'Dormiríamos más tranquilos'], ['home', 'Podríamos pensar en la casa'], ['chat', 'Dejaríamos de discutir por dinero'], ['heart', 'Sabríamos que los niños están cubiertos']];
  const PRO = () => S.prefs.level === 'pro';
  const CONF = [['sure', 'Seguro'], ['doubt', 'Lo dudo'], ['none', 'Ni idea']];
  const CASH_OPTS = ['Casi nada', 'Unos cientos de dólares', 'Unos miles de dólares', 'Más de 5.000 $'];
  const LIFE_OPTS = ['Casi nada', 'Unos meses de gastos', 'Un par de años de gastos', 'Más de diez años de gastos'];
  const RETIRE_OPTS = ['Sí, con margen', 'Justo justo', 'No nos llega', 'Ni idea'];


  // Iconos de trazo (24x24), hechos a mano.
  const ICP = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    zero: '<circle cx="12" cy="12" r="8"/><path d="M8 16L16 8"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    coins: '<ellipse cx="9" cy="8" rx="5" ry="2.5"/><path d="M4 8v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8"/><path d="M10 16.5c.6 1.2 2.7 2 5 2 2.8 0 5-1.1 5-2.5v-4c0-1.4-2.2-2.5-5-2.5"/>',
    stack: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    scale: '<path d="M12 4v16M5 20h14M5 8l-3 6h6l-3-6zM19 8l-3 6h6l-3-6zM5 8h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 16v2M17 16v2M5 11h14"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11.5V16c2 2 10 2 12 0v-4.5"/>',
    seed: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  };
  const ic = (n, sz = 20) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n] || ''}</svg>`;
  const optBody = (icon, text, sub) => `<span class="ic">${ic(icon)}</span><span class="tx"><b style="font-weight:600">${text}</b>${sub ? `<span class="muted small" style="display:block">${sub}</span>` : ''}</span>`;

  function progress() {
    const i = S.qi, n = QUIZ.length;
    const left = Math.max(1, Math.round((n - i) * 0.55));
    return `<div class="progress" aria-label="Paso ${i + 1} de ${n}"><div class="bar"><i style="width:${(i / n) * 100}%"></i></div><span class="tiny">~${left} min</span></div>`;
  }

  const confChips = (key) => `<p class="muted small" style="margin:14px 0 6px">¿Qué tan seguros estáis? <span class="tiny">(opcional)</span></p>
    <div class="chips" role="group" aria-label="Seguridad">${CONF.map(([v, l]) => `<button class="chip" data-act="conf" data-k="${key}" data-v="${v}" aria-pressed="${(S.a[key] || {}).conf === v}">${l}</button>`).join('')}</div>`;

  const dock = (label, enabled, act = 'next') => `<div class="dock"><button class="btn block" data-act="${act}" ${enabled ? '' : 'disabled'}>${label}</button></div>`;

  // Tarjeta de un dato con el formato elegido.
  function fact(x, opts = {}) {
    const fmt = (S.cardFmt[x.id]) || S.prefs.format || 'numbers';
    const depth = S.prefs.depth || 'quick';
    const calm = S.prefs.tone === 'calm';
    let body = '';
    if (fmt === 'numbers') {
      body = `<div class="big ${x.bigMid ? 'mid' : ''}"${x.count ? ` data-count='${JSON.stringify(x.count)}'` : ''}>${x.big}</div><p class="muted">${x.bigSub || ''}</p>` +
        (x.rows && !calm ? `<table class="nums">${x.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>` : '');
    } else if (fmt === 'image') {
      body = `<div style="margin:6px 0 10px">${x.image || ''}</div><p class="muted small">${x.bigSub || ''}</p>`;
    } else {
      body = `<p class="story">${x.story}</p>`;
    }
    const why = x.why ? (depth === 'why' || opts.openWhy
      ? `<div class="card soft" style="margin:12px 0 0;padding:14px"><b>Por qué</b><p style="margin:.3em 0 0">${x.why}</p></div>`
      : `<details class="why" data-why><summary>¿Por qué?</summary><p>${x.why}</p></details>`) : '';
    const alt = opts.noAlt ? '' : `<button class="link small" data-act="altfmt" data-id="${x.id}">Ver de otra forma</button>`;
    const pro = PRO() && x.pro ? `<div class="protech"><span class="tag navy">Para quien sabe de finanzas</span><p>${x.pro}</p></div>` : '';
    const origin = `<div class="origin">${ic(x.calc ? 'chart' : 'check', 14)}<span>${x.calc ? 'Cuenta nuestra con cifras de vuestro plan: ' + x.calc : 'Cifra de vuestro plan'}</span></div>`;
    return `<div class="card ${opts.cls || ''}">${x.kicker ? `<div class="kicker">${x.kicker}</div>` : ''}
      ${x.headline ? `<h3>${x.headline}</h3>` : ''}${body}${pro}${why}
      ${alt}${origin}${PRO() && x.src ? `<div class="src">Origen en el plan: ${esc(x.src)}</div>` : ''}${opts.extra || ''}</div>`;
  }

  // ------------------------------------------------------------------ datos de cada tarjeta
  const X = {
    cardCost: () => ({
      id: 'cardCost', kicker: 'La tarjeta', headline: 'Lo que os cuesta la tarjeta al año',
      count: { to: F.card.costYear, fmt: 'money' },
      big: M(F.card.costYear), bigSub: `en intereses: el ${P(F.card.apr)} sobre ${M(F.card.balance)}`,
      rows: [['Saldo de la tarjeta ' + F.card.issuer, M(F.card.balance)], ['Interés', P(F.card.apr)], ['Pagáis al mes', M(F.card.payMonth)], ['De eso, intereses', M(F.card.interestMonth)]],
      image: Charts.interestBar(F.card.payMonth, F.card.interestMonth),
      story: `Cada mes pagáis <strong>${M(F.card.payMonth)}</strong> a la tarjeta. Unos <strong>${M(F.card.interestMonth)}</strong> se van en intereses antes de tocar la deuda. En un año, son <strong>${M(F.card.costYear)}</strong>.`,
      why: `${P(F.card.apr)} × ${M(F.card.balance)} = ${M(F.card.costYear)} al año. De los ${M(F.card.payMonth)} mensuales, unos ${M(F.card.interestMonth)} son intereses, así que la deuda apenas baja.`,
      src: 'profile.liabilities[0] · creditCardDebt.ccPaymentEqualToInterestRate',
      calc: `${P(F.card.apr)} × ${M(F.card.balance)}`,
      pro: `Deuda revolving de ${M(F.card.balance)} al ${P(F.card.apr)} TAE. De la cuota de ${M(F.card.payMonth)}, ${M(F.card.interestMonth)} son intereses. Este saldo activa un tope en la nota${F.score.caps[0] ? ' (' + F.score.caps[0].score_capped_at + ')' : ''}.`,
    }),
    cardYear: () => ({
      id: 'cardYear', kicker: 'La tarjeta', headline: 'A este ritmo, la tarjeta se acaba en…',
      count: { from: (S.a.cardYear || {}).value || 2026, to: +F.card.payoff.slice(0, 4), fmt: 'year' },
      big: D(F.card.payoff), bigMid: true, bigSub: `pagando ${M(F.card.payMonth)} al mes`,
      rows: [['Pago mensual', M(F.card.payMonth)], ['Intereses al mes', M(F.card.interestMonth)], ['Fin previsto', D(F.card.payoff)]],
      image: Charts.timeline(+F.planDate.slice(0, 4), +F.card.payoff.slice(0, 4), D(F.card.payoff), (F.kids[0] && F.education.starts[0]) ? [{ year: +F.education.starts[0].date.slice(0, 4), label: 'Universidad ' + F.education.starts[0].name }] : []),
      story: `Si seguís pagando <strong>${M(F.card.payMonth)}</strong> al mes, la tarjeta se acaba en <strong>${D(F.card.payoff)}</strong>. Para entonces, ${F.education.starts[0] ? F.education.starts[0].name + ' ya estará empezando la universidad' : 'habrán pasado muchos años'}.`,
      why: `Casi todo el pago se lo llevan los intereses (${M(F.card.interestMonth)} de ${M(F.card.payMonth)}), así que el saldo baja muy despacio.`,
      src: 'creditCardDebt.ccPayoffDate',
      pro: `Amortización con cuota fija de ${M(F.card.payMonth)} al ${P(F.card.apr)}: casi toda la cuota son intereses (${M(F.card.interestMonth)}), así que el principal apenas baja hasta el final. Fin previsto: ${D(F.card.payoff)}.`,
    }),
    cash: () => ({
      id: 'cash', kicker: 'El efectivo', headline: `Lo que os dan ${M(F.cash.balance)} en la cuenta, al año`,
      count: { from: 5000, to: F.cash.yieldYear, fmt: 'money' },
      big: M(F.cash.yieldYear), bigSub: `al ${P(F.cash.rate, 1)}, frente a los ${M(F.card.costYear)} que cuesta la tarjeta`,
      rows: [['Efectivo en cuenta', M(F.cash.balance)], ['Rentabilidad', P(F.cash.rate, 1)], ['Os da al año', M(F.cash.yieldYear)], ['La tarjeta cuesta al año', M(F.card.costYear)]],
      image: Charts.compareBars([{ label: 'La tarjeta os cuesta al año', value: F.card.costYear, color: 'var(--s2)' }, { label: 'El efectivo os da al año', value: F.cash.yieldYear, color: 'var(--s1)' }]),
      story: `Vuestro efectivo da unos <strong>${M(F.cash.yieldYear)}</strong> al año. A la vez, la tarjeta se lleva <strong>${M(F.card.costYear)}</strong>. Dinero parado y deuda cara al mismo tiempo.`,
      why: `${P(F.cash.rate, 1)} × ${M(F.cash.balance)} ≈ ${M(F.cash.yieldYear)} al año. El plan ve ${M(F.cash.aboveAll)} por encima de la reserva y de las vacaciones.`,
      src: 'investment-analysis · cashNeeds.currentCashBalance',
      calc: `${P(F.cash.rate, 1)} × ${M(F.cash.balance)}`,
      pro: `Liquidez al ${P(F.cash.rate, 1)} frente a deuda al ${P(F.card.apr)}. Exceso de efectivo tras la reserva y las metas a corto plazo: ${M(F.cash.aboveAll)}. Ese exceso no descuenta el coche ni la casa.`,
    }),
    life: () => ({
      id: 'life', kicker: 'Proteger a ' + F.kids.map(k => k.name).join(' y '), headline: 'Si a uno de los dos le pasara algo, el seguro cubriría…',
      big: `unos ${Math.round(F.life.yearsNow)} años`, bigMid: true, bigSub: `de gastos del hogar. El mínimo recomendado: unos ${Math.round(F.life.yearsMin)}.`,
      rows: [[`Seguro de ${F.a.name}`, M(F.life.nowA)], [`Mínimo para ${F.a.name}`, M(F.life.minA)], [`Seguro de ${F.b.name}`, M(F.life.nowB)], [`Mínimo para ${F.b.name}`, M(F.life.minB)], ['Gastos del hogar al año', M(F.life.expYear)]],
      image: Charts.yearBlocks(F.life.yearsNow, F.life.yearsMin),
      story: `Hoy, entre los dos, tenéis <strong>${M(F.life.now)}</strong> de seguro de vida. Eso pagaría unos <strong>${Math.round(F.life.yearsNow)} años</strong> de los gastos de casa. Para que ${F.kids.map(k => k.name).join(' y ')} estén cubiertos, el plan recomienda unos <strong>${Math.round(F.life.yearsMin)}</strong>.`,
      why: `Lo asegurado entre los dos (${M(F.life.now)}) entre lo que gasta vuestro hogar al año (${M(F.life.expYear)}). El mínimo recomendado suma ${M(F.life.min)}.`,
      src: 'protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses',
      calc: 'capital asegurado ÷ gastos del hogar al año',
      pro: `Capital asegurado: ${F.a.name} ${M(F.life.nowA)}, ${F.b.name} ${M(F.life.nowB)}. Mínimo recomendado: ${M(F.life.minA)} y ${M(F.life.minB)}.${F.life.gapA != null ? ` Déficit: ${M(F.life.gapA)} y ${M(F.life.gapB)}.` : ''} Con hijos a cargo, activa otro tope en la nota${F.score.caps[1] ? ' (' + F.score.caps[1].score_capped_at + ')' : ''}.`,
    }),
    retire: () => ({
      id: 'retire', kicker: 'Jubilación', headline: `¿Llegáis a jubilaros a los ${F.a.retire} y ${F.b.retire}? Sí.`,
      count: { to: F.retirement.coverPct, fmt: 'pct' },
      big: P(F.retirement.coverPct), bigSub: 'de lo que necesitaréis cada año lo cubren vuestros ingresos, y los ahorros no se acaban',
      rows: [['Año de jubilación', F.retirement.year], ['Ingresos / necesidad anual', P(F.retirement.coverPct)], ['Os queda al final del plan (dólares de hoy)', M(F.retirement.leftAtEnd)], ['Ahorráis al año', `${M(F.retirement.savingsYear)} (${P(F.retirement.savingsRate, 1)})`]],
      image: Charts.gauge(F.retirement.coverPct, `Ingresos: ${P(F.retirement.coverPct)} de la necesidad anual`),
      story: `Buena noticia: vuestra jubilación está bien encaminada. Los ingresos cubren el <strong>${P(F.retirement.coverPct)}</strong> de lo que necesitaréis cada año, y al final del plan aún quedan <strong>${M(F.retirement.leftAtEnd)}</strong>.`,
      why: `Ahorráis el ${P(F.retirement.savingsRate, 1)} de lo que ganáis y aprovecháis toda la aportación de vuestras empresas (${M(F.retirement.matchA)} y ${M(F.retirement.matchB)} al año).`,
      src: 'facts.retirement · ratios.savingsLevel',
      pro: `Ingresos sobre necesidad anual: ${P(F.retirement.coverPct)}. Remanente al final del plan: ${M(F.retirement.leftAtEnd)} en dólares de hoy. Tasa de ahorro: ${P(F.retirement.savingsRate, 1)}, con la aportación de empresa aprovechada entera.`,
    }),
    cushion: () => ({
      id: 'cushion', kicker: 'Colchón', headline: 'Vuestro colchón para imprevistos',
      big: `${F.cash.months} meses`, bigMid: true, bigSub: 'de gastos esenciales. Lo recomendado son 8 a 9.',
      rows: [['Efectivo accesible', M(F.cash.accessible)], ['Reserva recomendada', `${M(F.cash.reserveMin)} a ${M(F.cash.reserveMax)}`], ['De sobra, tras reserva y vacaciones', M(F.cash.aboveAll)]],
      image: Charts.compareBars([{ label: 'Lo que tenéis accesible', value: F.cash.accessible, color: 'var(--s1)' }, { label: 'Reserva recomendada (máx.)', value: F.cash.reserveMax, color: 'var(--s3)' }]),
      story: `Si uno de los dos se quedara sin trabajo, tenéis efectivo para unos <strong>${F.cash.months} meses</strong>. El plan recomienda 8 a 9: aquí vais sobrados.`,
      why: `El plan ve ${M(F.cash.aboveAll)} por encima de la reserva y de las vacaciones de ${M(F.goals.vacation)}. Ojo: esa cuenta no incluye el coche ni la casa.`,
      src: 'facts.cash',
      pro: `Liquidez accesible: ${M(F.cash.accessible)}, ${F.cash.months} meses de gastos esenciales. Reserva objetivo: ${M(F.cash.reserveMin)} a ${M(F.cash.reserveMax)}.`,
    }),
    saving: () => ({
      id: 'saving', kicker: 'Ahorro', headline: 'Ahorráis más de lo habitual',
      big: P(F.retirement.savingsRate, 1), bigSub: `de lo que ganáis: ${M(F.retirement.savingsYear)} al año`,
      rows: [['Ahorro al año', M(F.retirement.savingsYear)], [`Aportación empresa ${F.a.name}`, M(F.retirement.matchA)], [`Aportación empresa ${F.b.name}`, M(F.retirement.matchB)]],
      image: Charts.gauge(F.retirement.savingsRate, `Ahorro: ${P(F.retirement.savingsRate, 1)} de los ingresos`),
      story: `Guardáis <strong>${M(F.retirement.savingsYear)}</strong> al año y aprovecháis todo lo que ponen vuestras empresas. Ese hábito es lo que sostiene vuestra jubilación.`,
      why: 'El 20 % suele usarse como referencia. Estáis por encima.',
      src: 'ratios.savingsLevel',
    }),
    score: () => {
      const pts = [{ label: 'Hoy', value: F.score.now }, { label: '+ tarjeta', value: Fmt.scoreFor(F, ['card']) }, { label: '+ vida', value: Fmt.scoreFor(F, ['card', 'life']) }, { label: '+ umbrella', value: Fmt.scoreFor(F, ['card', 'life', 'umbrella']) }];
      return {
        id: 'score', kicker: 'Vuestra nota de salud financiera', headline: `Dos cosas frenan vuestra nota en ${F.score.now}`,
        big: `${F.score.now} de 100`, bigMid: true, bigSub: `La tarjeta al ${P(F.card.apr)} y un seguro de vida bajo para tener a ${F.kids.map(k => k.name).join(' y ')}. Con los pasos del plan, llega a ${pts[3].value}.`,
        rows: F.score.pillars.map(p => [Content.PILLARS[p.pillar] || p.pillar, p.points_shown_in_app]),
        image: Charts.scoreSteps(pts),
        story: `Vuestra nota es <strong>${F.score.now}</strong>. No es por falta de ahorro: es porque la tarjeta y el seguro de vida le ponen un techo. Si quitáis esos dos frenos y añadís el umbrella, el plan la lleva a <strong>${pts[3].value}</strong>.`,
        why: `El plan pone topes a la nota: ${F.score.caps.map(c => `${c.reason === 'High revolving balance with high APR' ? 'deuda de tarjeta con interés alto' : 'seguro de vida bajo con hijos'} (tope ${c.score_capped_at})`).join(' y ')}. Por eso el orden importa: sin la tarjeta, el seguro solo no mueve la nota.`,
        src: 'score.pillars · score.caps_applied · score.top_moves · score.combined_moves',
        pro: `Combinaciones que trae el plan: solo tarjeta ${Fmt.scoreFor(F, ['card'])}; solo seguro de vida ${Fmt.scoreFor(F, ['life'])}; solo umbrella ${Fmt.scoreFor(F, ['umbrella'])}; tarjeta y vida ${Fmt.scoreFor(F, ['card', 'life'])}; vida y umbrella ${Fmt.scoreFor(F, ['life', 'umbrella'])}; los tres ${Fmt.scoreFor(F, ['card', 'life', 'umbrella'])}. La tarjeta es la que abre el resto.`,
      };
    },
  };

  // ------------------------------------------------------------------ quiz: pantallas
  function revealHead(key, truthDistance) {
    const a = S.a[key] || {};
    if (truthDistance === 'close') return a.conf === 'sure' ? 'Lo habéis clavado.' : 'Muy cerca.';
    if (a.conf === 'sure') return 'Aquí el plan sorprende, no vosotros.';
    if (truthDistance === 'mid') return 'Cerca, pero la cifra real es otra.';
    return 'Es una cifra que casi nunca se mira.';
  }


  // ------------------------------------------------------------------ expectativa
  let PEND = null, JUST = false;
  const REDUCED = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SUSP = {
    card: ['Buscando el dato en vuestro plan…', () => `Tarjeta ${F.card.issuer} · ${M(F.card.balance)} al ${P(F.card.apr)}`],
    year: ['Proyectando vuestros pagos, mes a mes…', () => `${M(F.card.payMonth)} al mes desde hoy`],
    cash: ['Mirando lo que rinde vuestra cuenta…', () => `${M(F.cash.balance)} en efectivo`],
    life: ['Sumando lo que tenéis asegurado…', () => `${F.a.name} y ${F.b.name}`],
    retire: ['Proyectando vuestro dinero hasta el final del plan…', () => `${F.projection[0].year} → ${F.projectionEnd.year}`],
  };
  function suspense(step) {
    const t = SUSP[step] || ['Un momento…', () => ''];
    return `<div class="suspense" role="status" aria-live="polite"><div><div class="orb" style="margin:0 auto 28px"></div><p>${t[0]}</p><p class="sub">${t[1]()}</p></div></div>`;
  }
  function playReveal(step) {
    if (REDUCED()) { render(); return; }
    PEND = step; render();
    setTimeout(() => { PEND = null; JUST = true; render(); JUST = false; runCounts(); }, 1700);
  }
  function runCounts() {
    document.querySelectorAll('.seq [data-count]').forEach(el => {
      const c = JSON.parse(el.getAttribute('data-count')); const final = el.innerHTML;
      const from = c.from != null ? c.from : 0, dur = 1300, delay = 900;
      const fmt = v => c.fmt === 'money' ? M(Math.round(v)) : c.fmt === 'pct' ? P(v) : String(Math.round(v));
      el.classList.add('counting'); el.textContent = fmt(from);
      const t0 = performance.now() + delay;
      const tick = now => {
        const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (c.to - from) * e);
        if (k < 1) requestAnimationFrame(tick); else { el.innerHTML = final; el.classList.remove('counting'); }
      };
      requestAnimationFrame(tick);
    });
  }
  function preparePlan() {
    const p = S.prefs;
    const lines = [
      'Leyendo vuestras 5 respuestas',
      PRO() ? 'Añadiendo el detalle técnico' : 'Quitando los tecnicismos',
      `Contándolo ${p.format === 'image' ? 'con imágenes' : p.format === 'story' ? 'como una historia' : 'en números'}`,
      p.depth === 'why' ? 'Añadiendo el porqué de cada paso' : 'Poniendo primero las conclusiones',
      'Ordenando los pasos que propone vuestro plan',
    ];
    const go = () => { S.stage = 'plan'; render(); window.scrollTo(0, 0); if (S.wantsTalk) setTimeout(talkSheet, 300); };
    if (REDUCED()) { go(); return; }
    topActions.innerHTML = '';
    app.innerHTML = `<div class="prep" role="status" aria-live="polite"><h2>Preparando vuestro plan</h2>
      <div class="bar"><i id="prepbar" style="width:0%"></i></div>
      <ul>${lines.map(l => `<li><span class="ck"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>${l}</li>`).join('')}</ul></div>`;
    window.scrollTo(0, 0);
    const lis = app.querySelectorAll('.prep li');
    lis.forEach((li, i) => setTimeout(() => { li.classList.add('on'); document.getElementById('prepbar').style.width = ((i + 1) / lis.length * 100) + '%'; }, 450 + i * 650));
    setTimeout(go, 450 + lis.length * 650 + 500);
  }

  function renderQuiz() {
    const step = QUIZ[S.qi];
    qStart = Date.now();
    if (PEND === step) { app.innerHTML = `<div class="narrow">${progress()}${suspense(step)}</div>`; window.scrollTo(0, 0); return; }
    let h = `<div class="narrow"><div class="qwrap">${progress()}`;
    const A = S.a;

    if (step === 'who') {
      h += `<h2 class="q">¿Quién mira el plan?</h2>
        <div class="chips">${[['juntos', 'Los dos juntos'], ['a', F.a.name], ['b', F.b.name]].map(([v, l]) => `<button class="chip" data-act="who" data-v="${v}" aria-pressed="${S.who === v}">${l}</button>`).join('')}</div>
        <h2 class="q" style="margin-top:28px">En una línea, ¿qué os importa más?</h2>
        ${Content.PHRASES.map((p, i) => `<button class="opt" data-act="phrase" data-v="${esc(p)}" aria-pressed="${S.phrase === p}">${optBody(['heart', 'moon', 'card', 'sun'][i], esc(p))}</button>`).join('')}
        <h2 class="q" style="margin-top:24px">¿Cómo os manejáis con las finanzas?</h2>
        <div class="seg2" role="group" aria-label="Nivel">
          <button class="segb" data-act="level" data-v="new" aria-pressed="${S.prefs.level === 'new'}">${ic('seed', 22)}<b>Somos nuevos en esto</b><span>Sin tecnicismos y paso a paso</span></button>
          <button class="segb" data-act="level" data-v="pro" aria-pressed="${S.prefs.level === 'pro'}">${ic('chart', 22)}<b>Sabemos de finanzas</b><span>Con el detalle técnico a la vista</span></button>
        </div>
        <p class="tiny">No hay respuestas buenas ni malas. Lo usamos para contaros el plan a vuestra manera. Se puede cambiar después.</p>
        ${dock('Empezar', S.who && S.phrase && S.prefs.level)}`;
    }

    if (step === 'card') {
      const a = A.cardCost || {};
      if (!a.revealed) {
        h += `<div class="qnum"><i>1</i> de 5</div><h2 class="q">¿Cuánto creéis que os cuesta la tarjeta al año?</h2>
          <p class="muted">Solo los intereses. Un cálculo a ojo vale; aquí no hay nota.</p>
          <div class="amount"><div class="val ${a.value == null ? 'empty' : ''}" id="amt">${a.value == null ? 'Mueve la barra' : M(a.value)}</div>
          <input type="range" min="0" max="10000" step="100" value="${a.value ?? 5000}" class="${a.value == null ? 'untouched' : ''}" data-act="range" data-k="cardCost" aria-label="Coste anual de la tarjeta">
          <div class="spread tiny"><span>0 $</span><span>10.000 $</span></div></div>
          ${confChips('cardCost')}${dock('Ver cuánto es', a.value != null, 'reveal')}`;
      } else {
        const err = Math.abs(a.value - F.card.costYear) / F.card.costYear;
        const dist = err <= 0.2 ? 'close' : err <= 0.5 ? 'mid' : 'far';
        h += `<div class="revealbox ${JUST ? 'seq' : ''}"><p style="margin:0"><span class="guessline">Vuestra respuesta: <b>${M(a.value)}</b></span></p><div>${factFixed(X.cardCost(), 'numbers')}</div><h2 class="reveal-head">${revealHead('cardCost', dist)}</h2></div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'format') {
      const x = X.cardCost();
      h += `<h2 class="q">Esto mismo, de tres formas. ¿Cuál os lo deja más claro?</h2>
        <p class="muted">Usaremos esa forma para contaros el resto del plan. Podéis cambiarla cuando queráis.</p>
        <div class="pick3">
          <button class="opt" data-act="format" data-v="numbers" aria-pressed="${S.prefs.format === 'numbers'}"><b>En números</b><table class="nums small">${x.rows.slice(1).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table></button>
          <button class="opt" data-act="format" data-v="image" aria-pressed="${S.prefs.format === 'image'}"><b>En una imagen</b>${x.image}</button>
          <button class="opt" data-act="format" data-v="story" aria-pressed="${S.prefs.format === 'story'}"><b>Como una historia</b><span class="muted small">${x.story}</span></button>
        </div>${dock('Seguir', S.prefs.format)}`;
    }

    if (step === 'year') {
      const a = A.cardYear || {};
      if (!a.revealed) {
        const y = a.value;
        h += `<div class="qnum"><i>2</i> de 5</div><h2 class="q">Pagando ${M(F.card.payMonth)} al mes, ¿cuándo terminaríais de pagar la tarjeta?</h2>
          <div class="chips" style="margin:14px 0">${[2020, 2030, 2040, 2050].map(d => `<button class="chip" data-act="decade" data-v="${d}" aria-pressed="${y != null && Math.floor(y / 10) * 10 === d}">${d}s</button>`).join('')}</div>
          <div class="stepper"><button data-act="yr" data-v="-1" aria-label="Un año menos" ${y == null ? 'disabled' : ''}>−</button><div class="yearval">${y ?? '—'}</div><button data-act="yr" data-v="1" aria-label="Un año más" ${y == null ? 'disabled' : ''}>+</button></div>
          ${y == null ? '<p class="tiny" style="text-align:center">Elegid una década y ajustad el año.</p>' : ''}
          ${confChips('cardYear')}${dock('Ver la fecha', y != null, 'reveal')}`;
      } else {
        const diff = Math.abs(a.value - +F.card.payoff.slice(0, 4));
        const dist = diff <= 2 ? 'close' : diff <= 6 ? 'mid' : 'far';
        h += `<div class="revealbox ${JUST ? 'seq' : ''}"><p style="margin:0"><span class="guessline">Vuestra respuesta: <b>${a.value}</b></span></p><div>${fact(X.cardYear(), { noAlt: false })}</div><h2 class="reveal-head">${revealHead('cardYear', dist)}</h2></div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'cash') {
      const a = A.cash || {};
      if (!a.revealed) {
        h += `<div class="qnum"><i>3</i> de 5</div><h2 class="q">Tenéis ${M(F.cash.balance)} en la cuenta. ¿Cuánto os dan al año?</h2>
          ${CASH_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="cash" data-v="${i}" aria-pressed="${a.value === i}">${optBody(['zero', 'coin', 'coins', 'stack'][i], o)}</button>`).join('')}
          ${confChips('cash')}${dock('Ver la respuesta', a.value != null, 'reveal')}`;
      } else {
        h += `<div class="revealbox ${JUST ? 'seq' : ''}"><p style="margin:0"><span class="guessline">Vuestra respuesta: <b>${CASH_OPTS[a.value]}</b></span></p><div>${fact(X.cash())}</div><h2 class="reveal-head">${a.value === 0 ? 'Eso es: casi nada.' : 'Menos de lo que parece.'}</h2></div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'life') {
      const a = A.life || {};
      if (!a.permission) {
        h += `<div class="card" style="text-align:center;padding:28px 22px"><div class="opt-ic" style="width:64px;height:64px;border-radius:20px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:0 auto 14px">${ic('shield', 30)}</div><h2>Lo siguiente no es fácil, pero tiene arreglo.</h2>
          <p>Hablamos de proteger a ${F.kids.map(k => k.name).join(' y ')}. ¿Lo vemos ahora?</p>
          <button class="btn block" data-act="lifeperm" data-v="now">Lo vemos ahora</button>
          <button class="link block" style="width:100%" data-act="lifeperm" data-v="later">Saltar por ahora</button></div>`;
      } else if (!a.revealed) {
        h += `<div class="qnum"><i>4</i> de 5</div><h2 class="q">Si a uno de vosotros le pasara algo, ¿qué tendrían ${F.kids.map(k => `${k.name} (${k.age})`).join(' y ')} asegurado?</h2>
          ${LIFE_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="life" data-v="${i}" aria-pressed="${a.value === i}">${optBody(['zero', 'clock', 'cal', 'shield'][i], o)}</button>`).join('')}
          ${confChips('life')}${dock('Ver la respuesta', a.value != null, 'reveal')}`;
      } else {
        h += `<div class="revealbox ${JUST ? 'seq' : ''}"><p style="margin:0"><span class="guessline">Vuestra respuesta: <b>${LIFE_OPTS[a.value]}</b></span></p><div>${fact(X.life())}</div><h2 class="reveal-head">${a.value === 2 ? 'Habéis estado cerca.' : 'Aquí el plan sorprende, no vosotros.'}</h2></div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'feel') {
      h += `<h2 class="q">Con cifras así, ¿qué os viene mejor?</h2>
        <button class="opt" data-act="tone" data-v="calm" aria-pressed="${S.prefs.tone === 'calm'}">${optBody('flag', 'Lo justo para decidir', 'Una cifra cada vez y el primer paso claro.')}</button>
        <button class="opt" data-act="tone" data-v="full" aria-pressed="${S.prefs.tone === 'full'}">${optBody('eye', 'Verlo todo con detalle', 'Todas las cifras, tablas y de dónde sale cada una.')}</button>
        <button class="opt" data-act="tone" data-v="talk" aria-pressed="false">${optBody('chat', 'Preferimos hablarlo con una persona', 'Seguimos aquí con lo justo y os ayudamos a pedir cita.')}</button>
        ${dock('Seguir', S.prefs.tone)}`;
    }

    if (step === 'retire') {
      const a = A.retire || {};
      if (!a.revealed) {
        h += `<div class="qnum"><i>5</i> de 5</div><h2 class="q">¿Llegáis a jubilaros cuando queréis, ${F.a.name} a los ${F.a.retire} y ${F.b.name} a los ${F.b.retire}?</h2>
          ${RETIRE_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="retire" data-v="${i}" aria-pressed="${a.value === i}">${optBody(['sun', 'scale', 'x', 'help'][i], o)}</button>`).join('')}
          ${confChips('retire')}${dock('Ver la respuesta', a.value != null, 'reveal')}`;
      } else {
        h += `<div class="revealbox ${JUST ? 'seq' : ''}"><p style="margin:0"><span class="guessline">Vuestra respuesta: <b>${RETIRE_OPTS[a.value]}</b></span></p><div>${fact(X.retire())}</div><h2 class="reveal-head">${a.value === 0 ? 'Eso es.' : 'Mejor de lo que pensabais.'}</h2></div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'gain') {
      h += `<h2 class="q">Si esto estuviera resuelto, ¿qué cambiaría en casa?</h2>
        <p class="muted">Elegid la que más se parezca a lo vuestro.</p>
        ${GAIN_OPTS.map(([i, t]) => `<button class="opt" data-act="gain" data-v="${esc(t)}" aria-pressed="${S.gain === t}">${optBody(i, esc(t))}</button>`).join('')}
        ${dock('Seguir', S.gain)}`;
    }

    if (step === 'depth') {
      if (!S.prefs.depth) S.prefs.depth = (S.sig.whyOpens >= 1 || avgTime() > 25) ? 'why' : 'quick';
      h += `<h2 class="q">Última: para contaros el plan, ¿cómo empezamos?</h2>
        <button class="opt" data-act="depth" data-v="quick" aria-pressed="${S.prefs.depth === 'quick'}">${optBody('flag', 'Primero la conclusión', 'El porqué, solo si lo pedimos.')}</button>
        <button class="opt" data-act="depth" data-v="why" aria-pressed="${S.prefs.depth === 'why'}">${optBody('bulb', 'Contadnos el porqué de cada paso', 'Cada propuesta con su razón a la vista.')}</button>
        ${dock('Ver vuestro plan', S.prefs.depth, 'toplan')}`;
    }
    h += '</div></div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);
  }

  function factFixed(x, fmt) { const keep = S.cardFmt[x.id]; S.cardFmt[x.id] = S.cardFmt[x.id] || fmt; const out = fact(x, { noAlt: true }); if (!keep) delete S.cardFmt[x.id]; return out; }
  function avgTime() { const t = S.sig.times; return t.length ? t.reduce((a, b) => a + b, 0) / t.length / 1000 : 0; }

  // ------------------------------------------------------------------ presentación
  const STEPS = () => [
    {
      key: 'card', title: `Pagar ${M(F.firstStep.amount)} de la tarjeta con el efectivo`, when: 'Esta semana',
      effort: Content.EFFORT[F.score.moves[0].effort], score: Fmt.scoreFor(F, ['card']),
      quick: `La nota pasa de ${F.score.now} a ${Fmt.scoreFor(F, ['card'])} y quedan ${M(F.firstStep.remaining)} de tarjeta.`,
      why: `Es el freno más caro: ${M(F.card.costYear)} al año en intereses, mientras el efectivo da ${M(F.cash.yieldYear)}. Después seguiríais con más colchón del recomendado (${F.cash.months} meses frente a 8 a 9).`,
      x: X.cardCost,
    },
    {
      key: 'life', title: 'Subir el seguro de vida de los dos', when: 'Este mes',
      effort: Content.EFFORT[F.score.moves[1].effort], score: Fmt.scoreFor(F, ['card', 'life']),
      quick: `Junto con la tarjeta, la nota llega a ${Fmt.scoreFor(F, ['card', 'life'])}. Hoy el seguro cubriría unos ${Math.round(F.life.yearsNow)} años de gastos; el mínimo, unos ${Math.round(F.life.yearsMin)}.`,
      why: `${F.a.name} tiene ${M(F.life.nowA)} frente a un mínimo de ${M(F.life.minA)}; ${F.b.name}, ${M(F.life.nowB)} frente a ${M(F.life.minB)}. Con dos niños pequeños, los dos sueldos importan.`,
      x: X.life,
    },
    {
      key: 'umbrella', title: PRO() ? `Contratar un seguro umbrella de ${M(F.umbrella.rec)}` : `Contratar un seguro extra de responsabilidad civil de ${M(F.umbrella.rec)}`, when: 'Este trimestre',
      effort: Content.EFFORT[F.score.moves[2].effort], score: Fmt.scoreFor(F, ['card', 'life', 'umbrella']),
      quick: `Con los tres pasos, la nota llega a ${Fmt.scoreFor(F, ['card', 'life', 'umbrella'])}.`,
      why: `Es un seguro de responsabilidad civil por encima del de casa y coche. Una demanda grande podría alcanzar vuestro patrimonio (${M(F.umbrella.netWorthExposed)}). Hoy no tenéis.`,
      x: null,
    },
  ];

  function acceptedKeys() { return Object.keys(S.steps).filter(k => S.steps[k] === 'yes'); }
  function counts() {
    const open = S.doubts.filter(d => d.status === 'open').length;
    const resolved = S.doubts.filter(d => d.status === 'resolved').length;
    const yes = acceptedKeys().length;
    const no = Object.values(S.steps).filter(v => v === 'no').length;
    const pending = Object.values(S.steps).filter(v => v == null).length;
    return { open, resolved, yes, no, pending };
  }

  // Regla de siguiente paso: cuántos pasos aceptados y cuántas dudas quedan abiertas.
  function nextStep() {
    const c = counts();
    if (c.yes === 3 && c.open === 0) return { lvl: 'go', title: 'Listos para empezar', mins: 20, days: 2, text: 'Habéis aceptado los tres pasos y no os queda ninguna duda. Una reunión corta para arrancar.' };
    if (c.pending === 3 && c.open === 0) return { lvl: 'undecided', title: 'Primero, decidid los pasos', mins: 30, days: 5, text: 'Contestad «¿Os convence?» en cada paso. Cuantas más dudas resolváis aquí, más corta y más pronto será la reunión.' };
    if (c.no === 0 && c.open <= 2) return { lvl: 'almost', title: 'Casi listos', mins: 30, days: 5, text: c.open ? `Os ${c.open === 1 ? 'queda 1 duda' : 'quedan 2 dudas'} que el plan no responde. Vuestro asesor llega con ellas preparadas.` : 'Os falta decidir algún paso. En media hora lo cerráis con vuestro asesor.' };
    return { lvl: 'talk', title: 'Mejor hablarlo con calma', mins: 45, days: 10, text: 'Hay pasos que no os convencen o varias dudas abiertas. Una reunión más larga, sin compromiso, para revisar el plan juntos.' };
  }

  function stepCard(st, i) {
    const v = S.steps[st.key];
    const depth = S.prefs.depth, calm = S.prefs.tone === 'calm';
    const myDoubts = S.doubts.filter(d => d.topic === st.key);
    let after = '';
    if (st.key === 'card' && v === 'yes') {
      after = S.payDate
        ? `<div class="datechip"><span class="dc-ic">${ic('cal', 22)}</span><div><small>Lo hacéis el</small><b>${esc(S.payDate.label)}</b></div><button class="link small" data-act="cal" data-k="pay">Cambiar</button></div>
           <details class="why"><summary>Cómo se hace, en tres pasos</summary><ol class="how"><li>Entrad en la app de vuestro banco.</li><li>Pagad ${M(F.firstStep.amount)} a la tarjeta ${esc(F.card.issuer || '')} desde vuestra cuenta de efectivo.</li><li>Comprobad que el saldo de la tarjeta queda en ${M(F.firstStep.remaining)}.</li></ol>${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="ics" data-k="pay">Añadir al calendario</button>'}</details>`
        : `<button class="btn block" style="margin-top:12px" data-act="cal" data-k="pay">${ic('cal')} Elegir día y hora</button>`;
    } else if (v === 'yes') {
      after = `<div class="datechip soft"><span class="dc-ic">${ic('chat', 22)}</span><div><small>Este paso se hace con vuestro asesor</small><b>Os trae presupuestos a la reunión</b></div></div>`;
    }
    return `<div class="rstep ${v === 'yes' ? 'done' : ''}" id="step-${st.key}"><span class="rdot">${v === 'yes' ? ic('check', 18) : i + 1}</span>
     <div class="card step">
      <div class="spread" style="align-items:flex-start"><div class="kicker" style="margin:0">${st.when} · esfuerzo ${st.effort}</div><span class="tag acc" title="Nota tras este paso, en este orden">Nota ${st.score}</span></div>
      <h3 style="margin:6px 0">${st.title}</h3>
      <p>${st.quick}</p>
      ${depth === 'why' ? `<div class="card soft" style="padding:14px;margin:0"><b>Por qué</b><p style="margin:.3em 0 0">${st.why}</p></div>` : `<details class="why"><summary>¿Por qué?</summary><p>${st.why}</p></details>`}
      <p style="margin:14px 0 0;font-weight:600">¿Os convence?</p>
      <div class="vote">${[['yes', 'Sí'], ['doubt', 'Tengo dudas'], ['no', 'No']].map(([k, l]) => `<button class="chip" data-act="vote" data-s="${st.key}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>
      ${after}
      ${myDoubts.length ? `<div style="margin-top:10px">${myDoubts.map(doubtLine).join('')}</div>` : ''}
      ${!calm && st.x ? `<details class="why"><summary>Ver la cifra</summary>${fact(st.x(), { noAlt: false })}</details>` : ''}
     </div></div>`;
  }

  function doubtLine(d) {
    const label = d.status === 'resolved' ? '<span class="tag good">Resuelta</span>' : '<span class="tag acc">Para la reunión</span>';
    return `<div class="doubt ${d.status === 'resolved' ? 'resolved' : 'advisor'}"><div class="spread"><b class="small">${esc(d.q)}</b>${label}</div></div>`;
  }

  function believed() {
    const A = S.a, rows = [];
    if (A.cardCost && A.cardCost.revealed) rows.push(['La tarjeta al año', M(A.cardCost.value), M(F.card.costYear)]);
    if (A.cardYear && A.cardYear.revealed) rows.push(['Fin de la tarjeta', String(A.cardYear.value), D(F.card.payoff)]);
    if (A.cash && A.cash.revealed) rows.push(['Lo que da el efectivo', CASH_OPTS[A.cash.value], M(F.cash.yieldYear) + ' al año']);
    if (A.life && A.life.revealed) rows.push(['Seguro de vida', LIFE_OPTS[A.life.value], `unos ${Math.round(F.life.yearsNow)} años de gastos`]);
    if (A.retire && A.retire.revealed) rows.push(['Jubilación', RETIRE_OPTS[A.retire.value], `Sí: ${P(F.retirement.coverPct)} cubierto`]);
    return rows;
  }

  // Anillo de la nota. Naranja: nota con los pasos aceptados. Azul claro: hasta dónde llega con los tres.
  let LAST_SCORE = null;
  function ring(now, max) {
    const r = 50, c = 2 * Math.PI * r, from = LAST_SCORE == null ? now : LAST_SCORE;
    return `<div class="ring" role="img" aria-label="Nota ${now} de 100"><svg viewBox="0 0 120 120" width="132" height="132">
      <circle cx="60" cy="60" r="${r}" class="rg-bg"/>
      <circle cx="60" cy="60" r="${r}" class="rg-max" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - max / 100)}"/>
      <circle cx="60" cy="60" r="${r}" class="rg-now" id="rg-now" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - from / 100)}" data-to="${c * (1 - now / 100)}"/>
      </svg><div class="rg-num"><b id="rg-val" data-from="${from}" data-to="${now}">${from}</b><span>de 100</span></div></div>`;
  }
  function animateRing() {
    const arc = document.getElementById('rg-now'), val = document.getElementById('rg-val'); if (!arc) return;
    const from = +val.dataset.from, to = +val.dataset.to; LAST_SCORE = to;
    if (from === to || REDUCED()) { arc.setAttribute('stroke-dashoffset', arc.dataset.to); val.textContent = to; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.strokeDashoffset = arc.dataset.to; }));
    const t0 = performance.now(), tick = now => { const k = Math.min(1, (now - t0) / 900); val.textContent = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    val.parentNode.parentNode.classList.add('bump');
  }

  function fold(id, n, title, sub, body, openDefault) {
    const open = S.fold[id] != null ? S.fold[id] : openDefault;
    return `<details class="fold" id="s-${id}" data-fold="${id}" ${open ? 'open' : ''}><summary><b class="n">${n}</b><span class="ft"><strong>${title}</strong><small>${sub}</small></span><i class="chev">${ic('arrow', 18)}</i></summary><div class="foldbody">${body}</div></details>`;
  }

  function goalsStrip() {
    const g = [];
    if (F.goals.car) g.push(['car', 'Coche', F.goals.car.date.slice(0, 4)]);
    if (F.goals.home) g.push(['home', 'Casa', F.goals.home.date.slice(0, 4)]);
    if (F.education.starts[0]) g.push(['cap', 'Universidad de ' + F.education.starts[0].name, F.education.starts[0].date.slice(0, 4)]);
    if (F.retirement.year) g.push(['sun', 'Jubilación', F.retirement.year]);
    return `<div class="rstep goal"><span class="rdot">${ic('flag', 16)}</span><div class="goals"><div class="kicker" style="margin:0 0 8px">A dónde lleva vuestro plan</div>
      <div class="goalrow">${g.map(x => `<div class="goalc"><span>${ic(x[0], 20)}</span><b>${x[2]}</b><small>${x[1]}</small></div>`).join('')}</div></div></div>`;
  }

  function bookedCard() {
    const b = S.booking, d = fromIso(b.iso.slice(0, 10), b.time);
    return `<div class="booked"><div class="tile"><small>${d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b><span>${d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span></div>
      <div><span class="tag good">Reunión pedida</span><h3 style="margin:6px 0 2px">${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · ${b.mins} minutos</h3>
      <p class="small muted" style="margin:0">Por videollamada. Vuestro asesor llega con vuestras respuestas y dudas leídas: no tenéis que preparar nada.</p></div></div>
      <div class="row" style="margin-top:12px">${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="ics" data-k="meet">Añadir al calendario</button>'}<button class="link" data-act="book">Cambiar el día</button></div>`;
  }

  function weekCard() {
    const w = S.week; if (!w) return '';
    return w.done
      ? `<div class="card win"><span class="tag good">Una semana después</span><h3 style="margin-top:8px">Habéis pasado de ${F.score.now} a ${Fmt.scoreFor(F, ['card'])} vosotros solos.</h3><p style="margin:0">Los dos pasos que quedan son seguros, y esos se miran con vuestro asesor.</p></div>`
      : `<div class="card"><span class="tag warn">Una semana después</span><h3 style="margin-top:8px">Justo para esto está vuestro asesor.</h3><p style="margin:0">Nos habéis dicho: «${esc(w.reason)}». Lo hemos apuntado para la reunión.</p></div>`;
  }

  function renderPlan() {
    const calm = S.prefs.tone === 'calm';
    const ns = nextStep(), c = counts();
    const rows = believed();
    const steps = STEPS();
    const accepted = acceptedKeys();
    const scoreNow = Fmt.scoreFor(F, accepted);
    const scoreMax = Fmt.scoreFor(F, ['card', 'life', 'umbrella']);
    const openAll = window.innerWidth >= 1000;
    const kids = F.kids.map(k => k.name).join(' y ');
    const stuck = accepted.length && !accepted.includes('card');

    let main = `<section class="planhero"><div class="kicker" style="margin:0">Plan de la familia ${F.family} · ${F.a.name} y ${F.b.name}</div>
      <h1>«${esc(S.phrase || 'Vuestro plan')}»</h1>
      <div class="heroscore">${ring(scoreNow, scoreMax)}
        <div><b class="hs-t">${accepted.length ? 'Vuestra nota con lo que habéis aceptado' : 'Vuestra nota de salud financiera, hoy'}</b>
        <p class="muted small" style="margin:.3em 0 0">Con los tres pasos de vuestro plan llega a <b>${scoreMax}</b>. ${stuck ? 'Sin el paso de la tarjeta no se mueve: es la que pone el techo.' : `Lleváis ${accepted.length} de 3.`}</p></div></div>
      <button class="btn ghost panel-mobile-toggle" style="background:#fff" data-act="panel">${ic('chart')} Ver vuestros datos en gráficos</button></section>`;

    main += `<div class="section" id="s-pasos"><div class="kicker"><b>1</b>Vuestra hoja de ruta</div>
      <p class="muted" style="margin-top:-2px">Tres pasos, en este orden. Decid en cada uno si os convence.</p>
      <div class="road"><div class="rstep start"><span class="rdot">${ic('flag', 16)}</span><div class="startc"><b>Hoy · nota ${F.score.now}</b><small>La tarjeta y el seguro de vida le ponen techo</small></div></div>
      ${steps.map(stepCard).join('')}${goalsStrip()}</div></div>`;

    main += `<div class="section" id="s-cierre"><div class="kicker"><b>2</b>Vuestro siguiente paso</div>
      <div class="card close"><div class="meter">
        <div><b>${c.yes}/3</b><span class="tiny">pasos aceptados</span></div>
        <div><b>${c.resolved}</b><span class="tiny">dudas resueltas</span></div>
        <div><b>${c.open}</b><span class="tiny">para la reunión</span></div></div>
        ${S.gain ? `<p class="quote">Nos dijisteis que, con esto resuelto, <b>«${esc(S.gain.charAt(0).toLowerCase() + S.gain.slice(1))}»</b>.</p>` : ''}
        ${S.booking ? bookedCard() : `<h2 style="margin-top:14px">${ns.title}</h2><p>${ns.text}</p>
        <ul class="ticks"><li>${ic('check', 16)}Salís con el orden de vuestros pasos y respuesta a vuestras dudas</li><li>${ic('check', 16)}${ns.mins} minutos por videollamada</li><li>${ic('check', 16)}No hay que preparar nada: ya tiene lo que habéis contestado</li></ul>
        <button class="btn block big-cta" data-act="book">${ic('cal')} ${c.yes ? 'Elegir día con vuestro asesor' : 'Hablarlo con vuestro asesor'}</button>
        <p class="tiny" style="text-align:center;margin:.6em 0 0">Sin compromiso. Decidís vosotros.</p>`}
        <button class="link" style="width:100%" data-act="whatif">Antes, tengo otra pregunta</button></div>
      ${weekCard()}
      ${(S.payDate || S.booking) && !S.week ? `<button class="weeklink" data-act="week">${ic('clock', 18)}<span><b>Una semana después</b><small>Ved cómo comprobamos que el primer paso está hecho</small></span>${ic('arrow', 18)}</button>` : ''}
      ${S.booking ? fold('hoja', ic('list', 16), 'Lo que recibe vuestro asesor', 'La hoja con vuestras respuestas y dudas', advisorSheet(), false) : ''}</div>`;

    main += `<div class="section"><div class="kicker"><b>3</b>Más sobre vuestro plan</div>`;
    if (rows.length) main += fold('creiais', ic('eye', 16), 'Lo que creíais y lo que dice el plan', `${rows.length} respuestas comparadas`, `<div class="card">${tbl(rows)}</div>`, openAll);
    const good = [X.retire(), X.saving(), X.cushion()];
    main += fold('bien', ic('sun', 16), 'Lo que ya hacéis bien', `Jubilación cubierta al ${P(F.retirement.coverPct)}, buen ahorro y colchón`, fact(good[0]) + fact(good[1]) + fact(good[2]), openAll);
    main += fold('frena', ic('lock', 16), 'Lo que frena vuestro plan', 'La tarjeta y el seguro de vida ponen techo a la nota', fact(X.score()) + (calm ? '' : fact(X.cash())), openAll);
    main += fold('despues', ic('flag', 16), 'Lo que viene después', `La universidad de ${kids}, el riesgo, el coche y la casa`,
      `<div class="card"><h3>La universidad de ${kids}</h3>
        <p>${S.prefs.format === 'story' ? `Todavía no hay nada ahorrado para la universidad. ${F.education.starts.map(s => `${s.name} empieza en ${D(s.date)}`).join(' y ')}. El plan propone guardar unos <b>${M(F.education.extraYear)}</b> más el primer año.` : `Faltan <b>${M(F.education.gap)}</b>. El plan propone unos <b>${M(F.education.extraYear)}</b> más al año (el primer año; luego sube).`}</p>
        <button class="link small" data-act="doubts" data-t="education">Tengo dudas sobre esto</button></div>
      <div class="card"><h3>Cuánto riesgo queréis</h3>
        <p>${PRO() ? `El <b>${P(F.portfolio.equityNow)}</b> de lo invertido está en renta variable; el objetivo ${F.portfolio.targetProfile} es ${P(F.portfolio.equityTarget)}.` : `De cada 100 $ invertidos, <b>${Math.round(F.portfolio.equityNow * 100)}</b> están en acciones. El plan propone ${Math.round(F.portfolio.equityTarget * 100)}.`} ${F.a.name} se declaró ${F.a.risk} y ${F.b.name} ${F.b.risk}: el plan propone hablarlo juntos.</p>
        ${PRO() ? `<p class="small muted">Tecnología: ${P(F.portfolio.tech)} de las acciones. Fondo apalancado UPRO: ${M(F.portfolio.upro)}.</p>` : ''}
        <button class="link small" data-act="doubts" data-t="portfolio">Tengo dudas sobre esto</button></div>
      <div class="card"><h3>El coche y la casa</h3>
        <p>El plan incluye un coche de ${M(F.goals.car.amount)} en ${D(F.goals.car.date)} y una casa de ${M(F.goals.home.amount)} en ${D(F.goals.home.date)}. Cómo encajan con todo lo demás es justo lo que se ve con vuestro asesor.</p>
        <button class="link small" data-act="doubts" data-t="goals">Tengo dudas sobre esto</button></div>`, openAll);
    main += `</div>`;

    main += `<p class="foot">Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor. Caso de ejemplo del reto; las cifras salen del plan (JSON del caso).</p>`;

    app.innerHTML = `<div class="plan-grid"><div>${main}</div><aside class="panel ${S.panelOpen ? '' : 'collapsed'}" id="panel" aria-label="Panel de datos">${panel()}</aside></div>
      <div class="cta-bar"><div class="cta-in"><button class="btn ghost" data-act="whatif">¿Y si…?</button>${S.booking
        ? `<button class="btn soft grow" data-act="gocierre">${ic('check', 18)} Reunión: ${esc(S.booking.short)}</button>`
        : `<button class="btn grow" data-act="book">${ic('cal', 18)} Pedir reunión</button>`}</div></div>`;
    animateRing();
  }

  const tbl = rows => `<table class="nums"><tr><td class="tiny">Tema</td><td class="tiny" style="text-align:left">Creíais</td><td class="tiny">El plan</td></tr>${rows.map(r => `<tr><td>${r[0]}</td><td style="text-align:left;font-weight:400">${esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</table>`;

  function panel() {
    const people = [F.a.name, F.b.name];
    const groups = [
      { label: 'Jubilación', sub: 'diferidos', test: a => a.tax === 'TAX_DEFERRED' },
      { label: 'Roth', sub: 'sin impuestos', test: a => a.tax === 'TAX_FREE' },
      { label: 'Bróker', sub: 'tributa', test: a => /Brokerage/.test(a.type) },
      { label: 'Efectivo', sub: 'en cuenta', test: a => /Checking/.test(a.type) },
    ].map(g => ({ ...g, by: F.portfolio.accounts.filter(g.test).reduce((o, a) => { o[a.owner] = (o[a.owner] || 0) + a.balance; return o; }, {}) }));
    const total = F.portfolio.accounts.reduce((s, a) => s + a.balance, 0);
    const marks = [{ year: F.retirement.year, label: 'Jubilación' }].concat(F.goals.home ? [{ year: +F.goals.home.date.slice(0, 4), label: 'Casa' }] : []);
    const labelDebt = { PERSONAL_CREDIT_CARD: 'Tarjeta', STUDENT_LOAN_FEDERAL_UNSUBSIDIZED: 'Préstamo de estudios', PRIMARY_MORTGAGE: 'Hipoteca', AUTO_LOAN: 'Préstamo del coche' };
    return `<div class="card"><div class="spread"><h3>Vuestros datos</h3><button class="link small panel-mobile-toggle" data-act="panel">Cerrar</button></div>
        <p class="tiny">Del plan del ${D(F.planDate.slice(0, 7))}. Pasad el dedo o el ratón por los gráficos.</p></div>
      <div class="card"><div class="kicker">Patrimonio neto previsto</div><div class="spread"><b>${M(F.projection[0].today)}</b><span class="tiny">→ ${M(F.retirement.netWorthAtRetireToday)} al jubilaros</span></div>
        <p class="tiny">En dólares de hoy.</p>${Charts.projection(F.projection, marks)}</div>
      <div class="card"><div class="kicker">Dónde está vuestro dinero</div><div class="spread"><b>${M(total)}</b><span class="tiny">${F.portfolio.accounts.length} cuentas</span></div>
        <div class="legend"><span><i style="background:var(--s1)"></i>${people[0]}</span><span><i style="background:var(--s4)"></i>${people[1]}</span></div>
        ${Charts.accountsStack(groups, people)}</div>
      <div class="card"><div class="kicker">Mezcla de todo vuestro dinero</div>
        ${Charts.allocation([{ label: 'Hoy', mix: F.portfolio.allocNow }, { label: 'Propuesta del plan', mix: F.portfolio.allocTarget }])}
        <p class="tiny">Solo lo invertido: ${P(F.portfolio.equityNow)} en acciones frente a un objetivo de ${P(F.portfolio.equityTarget)}.</p></div>
      <div class="card"><div class="kicker">Deudas</div>${Charts.debts(F.debts.map(d => ({ label: labelDebt[d.type] || d.name, balance: d.balance, rate: d.rate, hot: d.rate >= 0.1 })))}</div>
      <div class="card"><div class="kicker">Nota por áreas</div><table class="nums">${F.score.pillars.map(p => `<tr><td>${Content.PILLARS[p.pillar] || p.pillar}</td><td>${p.score}</td></tr>`).join('')}</table></div>`;
  }

  function advisorSheet() {
    const b = S.booking, c = counts();
    const acc = STEPS().filter(s => S.steps[s.key] === 'yes').map(s => s.title);
    const dud = STEPS().filter(s => S.steps[s.key] === 'doubt').map(s => s.title);
    const no = STEPS().filter(s => S.steps[s.key] === 'no').map(s => s.title);
    const open = S.doubts.filter(d => d.status === 'open');
    const res = S.doubts.filter(d => d.status === 'resolved');
    const p = S.prefs;
    const pref = [p.format === 'numbers' ? 'en números' : p.format === 'image' ? 'con imágenes' : 'como historia', p.depth === 'why' ? 'con el porqué de cada paso' : 'conclusión primero', p.tone === 'calm' ? 'una cifra cada vez' : 'con todo el detalle'].join(', ');
    return `<div class="card" id="hoja"><div class="spread"><h3>Hoja para vuestro asesor</h3><span class="tag good">Reunión pedida</span></div>
      <p class="small"><b>${b.label}</b> · ${b.mins} min · Familia ${F.family}${S.who === 'juntos' ? ` (${F.a.name} y ${F.b.name})` : S.who ? ` (${S.who === 'a' ? F.a.name : F.b.name})` : ''}</p>
      <p class="tiny">Prototipo: no se envía nada. En producción, esta hoja le llega al asesor al confirmar.</p>
      <h3 style="margin-top:14px">Lo que más les importa</h3><p>«${esc(S.phrase)}»</p>
      ${S.gain ? `<h3>Qué cambiaría en casa, con sus palabras</h3><p>«${esc(S.gain)}»</p>` : ''}
      <h3>Cómo se manejan con las finanzas</h3><p>${PRO() ? 'Saben de finanzas: se les puede hablar en términos técnicos.' : 'Son nuevos en esto: mejor sin tecnicismos.'}</p>
      ${S.payDate ? `<h3>Primer paso con fecha</h3><p>Pagar ${M(F.firstStep.amount)} de la tarjeta: ${esc(S.payDate.label)}.${S.week ? (S.week.done ? ` A la semana lo habían hecho (saldo ${M(S.week.balance)}).` : ` A la semana no lo habían hecho: «${esc(S.week.reason)}».`) : ''}</p>` : ''}
      <h3>Pasos aceptados (${acc.length}/3)</h3><ul>${acc.map(t => `<li>${t}</li>`).join('') || '<li class="muted">Ninguno todavía</li>'}</ul>
      ${dud.length ? `<h3>Con dudas</h3><ul>${dud.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${no.length ? `<h3>No les convence</h3><ul>${no.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      <h3>Dudas para la reunión (${open.length})</h3><ul>${open.map(d => `<li>${esc(d.q)}${d.covered !== 'yes' ? ' <span class="tag warn">el plan no lo cubre</span>' : ''}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      <h3>Dudas ya resueltas con el plan (${res.length})</h3><ul>${res.map(d => `<li>${esc(d.q)}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      ${believed().length ? `<h3>Creían frente a lo que dice el plan</h3>${tbl(believed())}` : ''}
      <h3>Datos a revisar</h3><ul><li>El efectivo de sobra (${M(F.cash.aboveAll)}) no cuenta el coche (${D(F.goals.car.date)}) ni la casa (${D(F.goals.home.date)}).</li><li>Seguro de vida objetivo: el plan da ${M(F.life.targetA)} y ${M(F.life.targetB)}.</li><li>Los gastos declarados parecen bajos: confirmar antes de fijar cuotas.</li></ul>
      <label class="row small" style="margin:10px 0"><input type="checkbox" data-act="sharestyle" ${S.shareStyle ? 'checked' : ''} style="width:22px;height:22px"> Compartir cómo preferimos ver el plan</label>
      ${S.shareStyle ? `<p class="small muted">Prefieren verlo ${pref}.</p>` : ''}
      <div class="row"><button class="btn soft" data-act="copy">Copiar resumen</button>${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="print">Imprimir</button>'}</div></div>`;
  }

  // ------------------------------------------------------------------ hojas (modales)
  function sheet(html) {
    closeSheet();
    const v = document.createElement('div');
    v.className = 'sheet-veil'; v.id = 'veil';
    v.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><button class="link close" data-act="close" aria-label="Cerrar">Cerrar</button>${html}</div>`;
    v.addEventListener('click', e => { if (e.target === v) closeSheet(); });
    document.body.appendChild(v);
    const f = v.querySelector('button:not(.close), input, textarea'); if (f) f.focus();
  }
  function closeSheet() { const v = document.getElementById('veil'); if (v) v.remove(); }

  function whatIfSheet(topic) {
    const topics = topic ? [topic] : Object.keys(DB);
    const html = `<h2>${topic ? DB[topic].label : '¿Y si…?'}</h2>
      <p class="muted small">Respondemos solo con lo que dice vuestro plan. Lo que el plan no cubre lo apuntamos para la reunión.</p>
      ${topics.map(t => `<div class="kicker" style="margin-top:14px">${DB[t].label}</div>${DB[t].items.map(it => {
        const d = S.doubts.find(x => x.id === it.id);
        return `<button class="opt" data-act="ask" data-t="${t}" data-id="${it.id}">${esc(it.q)}${d ? ` <span class="tag ${d.status === 'resolved' ? 'good' : 'acc'}">${d.status === 'resolved' ? 'resuelta' : 'para la reunión'}</span>` : ''}</button>`;
      }).join('')}`).join('')}
      <div class="kicker" style="margin-top:14px">Otra pregunta</div>
      <textarea id="free" rows="3" style="width:100%;font:inherit;padding:12px;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink)" placeholder="Escribidla con vuestras palabras"></textarea>
      <button class="btn block" style="margin-top:8px" data-act="free" data-t="${topic || 'other'}">Apuntarla para la reunión</button>`;
    sheet(html);
  }

  function answerSheet(t, id) {
    const it = DB[t].items.find(x => x.id === id);
    const covered = it.covered === 'yes';
    let d = S.doubts.find(x => x.id === id);
    if (!d) { d = { id, topic: t, q: it.q, covered: it.covered, status: covered ? 'pending' : 'open' }; S.doubts.push(d); save(); }
    sheet(`<div class="kicker">${DB[t].label}</div><h2>${esc(it.q)}</h2><p class="story" style="font-size:17.5px">${it.a}</p>
      ${covered ? `<p style="font-weight:600;margin-top:16px">¿Os queda claro?</p>
        <div class="row"><button class="btn" data-act="resolve" data-id="${id}" data-v="resolved">Sí, queda claro</button><button class="btn ghost" data-act="resolve" data-id="${id}" data-v="open">Seguimos con la duda</button></div>`
        : `<div class="card soft" style="margin-top:12px"><b>Esto el plan no lo responde del todo.</b><p class="small" style="margin:.3em 0 0">Lo hemos apuntado para vuestra reunión con el asesor.</p></div>
        <button class="btn block" data-act="whatif-back" data-t="${t}">Seguir</button>`}`);
  }

  function noSheet(key) {
    sheet(`<h2>¿Qué os frena?</h2><p class="muted small">Lo apuntamos para la reunión. No cambia nada del plan.</p>
      ${Content.NO_REASONS.map(r => `<button class="opt" data-act="noreason" data-s="${key}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}`);
  }

  function talkSheet() {
    sheet(`<h2>Hablarlo con una persona</h2><p>¿Preferís verlo con alguien? Os ayudamos a pedir cita con vuestro asesor. Le llegarán vuestras dudas para que no tengáis que repetirlas.</p>
      <button class="btn block" data-act="book">Pedir cita</button><button class="link" style="width:100%" data-act="close">Seguir aquí</button>`);
  }

  function settingsSheet() {
    const p = S.prefs;
    const grp = (k, opts) => `<div class="chips" style="margin-bottom:16px">${opts.map(([v, l]) => `<button class="chip" data-act="setpref" data-k="${k}" data-v="${v}" aria-pressed="${p[k] === v}">${l}</button>`).join('')}</div>`;
    sheet(`<h2>Cómo veis el plan</h2><p class="muted small">Lo elegisteis al principio. Cambiadlo cuando queráis.</p>
      <h3>Nivel</h3>${grp('level', [['new', 'Somos nuevos en esto'], ['pro', 'Sabemos de finanzas']])}
      <h3>Forma</h3>${grp('format', [['numbers', 'Números'], ['image', 'Imagen'], ['story', 'Historia']])}
      <h3>Explicación</h3>${grp('depth', [['quick', 'Conclusión primero'], ['why', 'Con el porqué']])}
      <h3>Detalle</h3>${grp('tone', [['calm', 'Lo justo'], ['full', 'Todo']])}
      <button class="link" data-act="restart">Volver a empezar desde cero</button>`);
  }

  // Calendario para elegir día y hora: 'pay' (primer paso) o 'meet' (reunión con el asesor).
  let CAL = null;
  const CAL_TIMES = { pay: ['08:00', '13:30', '19:00', '21:30'], meet: ['09:30', '13:00', '18:30'] };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fromIso = (day, time) => { const [y, m, d] = day.split('-').map(Number), [h, mi] = time.split(':').map(Number); return new Date(y, m - 1, d, h, mi); };
  const fmtLong = dt => { const t = dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1) + ' · ' + dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
  const fmtSlot = s => s.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + s.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  function calDays(kind) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const limit = Math.min(nextStep().days, 10); let work = 0; const out = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const wk = d.getDay() === 0 || d.getDay() === 6; let ok = d > today;
      if (kind === 'meet') { if (wk) ok = false; else if (ok) { work++; if (work > limit) ok = false; } }
      else if (i > 20) ok = false;
      out.push({ d, iso: iso(d), ok, today: +d === +today });
    }
    return out;
  }
  function calSheet(kind, keepSel) {
    const days = calDays(kind), ns = nextStep(), c = counts();
    if (!keepSel || !CAL || CAL.kind !== kind) {
      const prev = kind === 'pay' ? S.payDate : S.booking;
      let day = null, time = kind === 'pay' ? '19:00' : '18:30';
      if (prev && days.some(x => x.ok && x.iso === prev.iso.slice(0, 10))) { day = prev.iso.slice(0, 10); time = prev.time || time; }
      if (!day) { const pick = kind === 'pay' ? days.find(x => x.ok && x.d.getDay() === 1) : null; day = (pick || days.find(x => x.ok)).iso; }
      CAL = { kind, day, time };
    }
    const sel = fromIso(CAL.day, CAL.time);
    const months = [...new Set(days.map(x => x.d.toLocaleDateString('es-ES', { month: 'long' })))];
    const head = kind === 'pay'
      ? `<div class="kicker">Vuestro primer paso</div><h2>¿Qué día pagáis los ${M(F.firstStep.amount)} de la tarjeta?</h2><p class="muted small">Son diez minutos desde la app del banco. Con día y hora es mucho más fácil que se haga.</p>`
      : `<div class="kicker">Reunión con vuestro asesor · ${ns.mins} min</div><h2>${c.yes ? 'Elegid el día para empezar' : 'Elegid el día para hablarlo'}</h2><p class="muted small">${ns.text}</p>`;
    sheet(`${head}
      <div class="cal"><div class="cal-head"><b>${months.join(' y ').replace(/^./, c => c.toUpperCase())} de ${days[20].d.getFullYear()}</b>${kind === 'meet' ? '<span class="tiny">Días con hueco, en azul</span>' : ''}</div>
        <div class="cal-grid">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(l => `<span class="dow">${l}</span>`).join('')}
        ${days.map(x => `<button class="day ${x.today ? 'today' : ''}" data-act="calday" data-v="${x.iso}" aria-pressed="${x.iso === CAL.day}" ${x.ok ? '' : 'disabled'} aria-label="${x.d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}">${x.d.getDate()}</button>`).join('')}</div></div>
      <div class="times">${CAL_TIMES[kind].map(t => `<button class="chip" data-act="caltime" data-v="${t}" aria-pressed="${t === CAL.time}">${t}</button>`).join('')}</div>
      <div class="cal-sum"><span class="dc-ic">${ic(kind === 'pay' ? 'card' : 'chat', 22)}</span><div><small>${kind === 'pay' ? 'Lo hacéis el' : 'Vuestra reunión'}</small><b>${fmtLong(sel)}</b></div></div>
      <button class="btn block" data-act="calok">${kind === 'pay' ? 'Apuntar este día' : 'Pedir esta reunión'}</button>
      <p class="tiny" style="margin-top:10px;text-align:center">${kind === 'pay' ? 'Nada mueve dinero desde aquí: el pago lo hacéis vosotros.' : 'Al confirmar, vuestro asesor recibe vuestros pasos y vuestras dudas. En este prototipo no se envía nada.'}</p>`);
  }
  const bookSheet = () => calSheet('meet');

  // Una semana después: se pide el saldo, no un "ya lo hice".
  const WEEK_REASONS = ['Tenemos dudas', 'No sabemos cómo hacerlo', 'Ahora no es prioridad', 'No lo vemos igual los dos'];
  function weekSheet() {
    sheet(`<div class="kicker">Una semana después · vista previa</div><h2>¿Cuál es el saldo de vuestra tarjeta ahora?</h2>
      <p class="muted small">Esto os llegaría a los siete días. Miradlo en la app de vuestro banco y escribidlo aquí.</p>
      <div class="moneyin"><input id="bal" type="number" inputmode="numeric" min="0" step="100" placeholder="0" aria-label="Saldo de la tarjeta"><span>$</span></div>
      <div class="chips" style="margin:10px 0 16px"><button class="chip" data-act="weekfill" data-v="${F.firstStep.remaining}">${M(F.firstStep.remaining)}</button><button class="chip" data-act="weekfill" data-v="${F.card.balance}">${M(F.card.balance)}, sigue igual</button></div>
      <button class="btn block" data-act="weekok">Comprobar</button>`);
  }
  function weekDone(balance) {
    S.week = { done: true, balance }; S.steps.card = 'yes'; keep();
    sheet(`<div class="celebrate"><div class="burst">${ic('check', 40)}</div><div class="kicker">Paso 1 hecho</div><h2>De ${F.score.now} a ${Fmt.scoreFor(F, ['card'])}, vosotros solos.</h2>
      <p>Vuestra tarjeta ha bajado a ${M(balance)}. Los dos pasos que quedan son seguros, y esos se miran con vuestro asesor.</p></div>
      ${S.booking ? '<button class="btn block" data-act="close">Seguir</button>' : '<button class="btn block" data-act="book">Pedir reunión</button><button class="link" style="width:100%" data-act="close">Ahora no</button>'}`);
  }
  function weekStuck(balance) {
    sheet(`<div class="kicker">Una semana después</div><h2>¿Qué os frena?</h2><p class="muted small">No pasa nada. Decidnos qué ha pasado y se lo contamos a vuestro asesor.</p>
      ${WEEK_REASONS.map(r => `<button class="opt" data-act="weekwhy" data-b="${balance}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}`);
  }

  // ------------------------------------------------------------------ barra superior y portada
  function renderTop() {
    if (S.stage === 'plan') {
      topActions.innerHTML = `<button class="pill" data-act="settings"><span aria-hidden="true">⚙</span> <span class="lbl-long">Cómo lo veis</span></button>
        <button class="pill talk" data-act="talk"><span class="lbl-long">Hablarlo con una persona</span><span class="lbl-short" aria-hidden="true">Asesor</span></button>`;
    } else if (S.stage === 'quiz') {
      topActions.innerHTML = `<button class="pill" data-act="skip">Saltar al plan</button><button class="pill talk" data-act="talk"><span class="lbl-long">Hablarlo con una persona</span><span class="lbl-short" aria-hidden="true">Asesor</span></button>`;
    } else topActions.innerHTML = '';
    document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; });
  }

  let homeTimer = null;
  function renderHome() {
    const kids = F.kids.map(k => k.name).join(' y ');
    app.innerHTML = `<section class="welcome">
      <div style="display:grid;gap:22px;min-width:0">
        <span class="eyebrow-pill"><span class="av"><span style="background:var(--accent)">${F.a.name[0]}</span><span style="background:var(--sky);color:var(--navy)">${F.b.name[0]}</span></span>${F.a.name} y ${F.b.name} ${F.family}</span>
        <h1>Bienvenidos a vuestro <em>plan a futuro</em></h1>
        <p class="lead">Vuestro asesor ha preparado un plan para vosotros y para ${kids}. Primero os preguntamos, después os lo enseñamos. Al final decidís si queréis verlo con él.</p>
        <button class="megacta" data-act="start"><span><b>${S.qi > 0 ? 'Seguir donde lo dejasteis' : 'Ver vuestro plan en 5 minutos'}</b><small>5 preguntas rápidas · sin registros</small></span><span class="go">${ic('arrow', 26)}</span></button>
        <div class="trust"><span>${ic('clock', 16)}5 minutos</span><span>${ic('lock', 16)}Sin cuentas ni datos nuevos</span><span>${ic('check', 16)}Cifras de vuestro plan</span><span>${ic('eye', 16)}Vuestro asesor verá lo que contestéis para preparar la reunión</span></div>
        <button class="link" style="text-align:left;width:fit-content;padding-left:0" data-act="skip">Prefiero ir directamente al plan</button>
      </div>
      <div class="teaser" aria-hidden="true"><div class="blob"></div>
        <div class="tcard main"><div class="kicker">Lo que os cuesta la tarjeta al año</div>
          <div class="blurnum" id="blurnum">?.??? $</div>
          <div style="height:10px;border-radius:99px;background:var(--surface-2);margin:14px 0 8px;overflow:hidden"><div style="height:100%;width:62%;background:linear-gradient(90deg,var(--s2),#f29a6e);border-radius:99px"></div></div>
          <div class="spread tiny"><span>Vosotros decís…</span><span>El plan dice…</span></div></div>
        <div class="tcard mini a"><span class="dot" style="background:var(--good-soft);color:var(--good)">${ic('sun', 18)}</span><span><b>¿Llegáis a jubilaros?</b><br><span class="tiny">Lo vemos en la pregunta 5</span></span></div>
        <div class="tcard mini b"><span class="dot" style="background:var(--accent-soft);color:var(--accent)">${ic('shield', 18)}</span><span><b>Vuestra nota</b><br><span class="tiny">de 0 a 100</span></span></div>
      </div></section>
      <p class="foot">Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia.</p>`;
    clearInterval(homeTimer);
    if (!REDUCED()) homeTimer = setInterval(() => {
      const el = document.getElementById('blurnum'); if (!el) { clearInterval(homeTimer); return; }
      const r = () => Math.floor(Math.random() * 10);
      el.textContent = `${1 + r() % 9}.${r()}${r()}${r()} $`;
    }, 140);
  }

  function render() {
    renderTop();
    if (S.stage === 'home') renderHome();
    else if (S.stage === 'quiz') renderQuiz();
    else renderPlan();
    save();
  }

  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2400); }

  // ------------------------------------------------------------------ eventos
  function markTime() { S.sig.times.push(Date.now() - qStart); }

  document.addEventListener('toggle', e => {
    if (!e.target.matches) return;
    if (e.target.matches('details[data-why]') && e.target.open) { S.sig.whyOpens++; save(); }
    if (e.target.matches('details[data-fold]')) { S.fold[e.target.dataset.fold] = e.target.open; save(); }
  }, true);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.act === 'range') {
      t.classList.remove('untouched');
      S.a[t.dataset.k] = Object.assign(S.a[t.dataset.k] || {}, { value: +t.value });
      const v = document.getElementById('amt'); v.textContent = M(+t.value); v.classList.remove('empty');
      const btn = document.querySelector('[data-act="reveal"]'); if (btn) btn.disabled = false;
      save();
    }
  });
  document.addEventListener('pointerdown', e => {
    const t = e.target;
    if (t.dataset && t.dataset.act === 'range' && t.classList.contains('untouched')) { t.classList.remove('untouched'); }
  });

  document.addEventListener('change', e => {
    if (e.target.dataset.act === 'sharestyle') { S.shareStyle = e.target.checked; render(); }
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, v = b.dataset.v;
    const go = () => { markTime(); S.qi = Math.min(S.qi + 1, QUIZ.length - 1); render(); };
    switch (act) {
      case 'start': S.stage = 'quiz'; render(); break;
      case 'skip':
        S.stage = 'plan';
        S.prefs.format = S.prefs.format || 'numbers'; S.prefs.depth = S.prefs.depth || 'quick'; S.prefs.tone = S.prefs.tone || 'full'; S.prefs.level = S.prefs.level || 'new';
        render(); window.scrollTo(0, 0); break;
      case 'who': S.who = v; render(); break;
      case 'level': S.prefs.level = v; render(); break;
      case 'gain': S.gain = v; render(); break;
      case 'phrase': S.phrase = v; render(); break;
      case 'conf': {
        const k = b.dataset.k; S.a[k] = Object.assign(S.a[k] || {}, { conf: v }); if (v === 'none') S.sig.noIdea++;
        render(); break;
      }
      case 'decade': { const a = S.a.cardYear = S.a.cardYear || {}; a.value = +v + 5; render(); break; }
      case 'yr': { const a = S.a.cardYear; a.value = Math.max(2026, Math.min(2079, a.value + +v)); render(); break; }
      case 'opt': { const k = b.dataset.k; S.a[k] = Object.assign(S.a[k] || {}, { value: +v }); render(); break; }
      case 'reveal': { const k = QUIZ[S.qi] === 'card' ? 'cardCost' : QUIZ[S.qi] === 'year' ? 'cardYear' : QUIZ[S.qi]; markTime(); S.a[k].revealed = true; playReveal(QUIZ[S.qi]); break; }
      case 'format': S.prefs.format = v; render(); break;
      case 'lifeperm':
        if (v === 'later') { S.sig.skippedLife = true; S.a.life = { permission: 'later' }; S.prefs.tone = S.prefs.tone || 'calm'; go(); }
        else { S.a.life = Object.assign(S.a.life || {}, { permission: 'now' }); render(); }
        break;
      case 'tone':
        if (v === 'talk') { S.prefs.tone = 'calm'; S.wantsTalk = true; go(); }
        else { S.prefs.tone = v; render(); }
        break;
      case 'depth': S.prefs.depth = v; render(); break;
      case 'next': go(); break;
      case 'toplan': markTime(); preparePlan(); break;
      case 'altfmt': { const id = b.dataset.id; const order = ['numbers', 'image', 'story']; const cur = S.cardFmt[id] || S.prefs.format || 'numbers'; S.cardFmt[id] = order[(order.indexOf(cur) + 1) % 3]; const y = window.scrollY; render(); window.scrollTo(0, y); break; }
      case 'vote': {
        const s = b.dataset.s, before = Fmt.scoreFor(F, acceptedKeys());
        S.steps[s] = S.steps[s] === v ? null : v; const y = window.scrollY; render(); window.scrollTo(0, y);
        const after = Fmt.scoreFor(F, acceptedKeys());
        if (S.steps[s] === 'doubt') whatIfSheet(s); else if (S.steps[s] === 'no') noSheet(s);
        else if (S.steps[s] === 'yes' && s === 'card' && !S.payDate) calSheet('pay');
        else if (S.steps[s] === 'yes') toast(after > before ? `Vuestra nota sube de ${before} a ${after}` : 'Apuntado. La nota sube cuando entra el paso de la tarjeta');
        break;
      }
      case 'noreason': S.doubts.push({ id: 'no-' + b.dataset.s + '-' + Date.now(), topic: b.dataset.s, q: `No: ${v}`, covered: 'no', status: 'open' }); closeSheet(); keep(); toast('Apuntado para la reunión'); break;
      case 'doubts': whatIfSheet(b.dataset.t); break;
      case 'whatif': whatIfSheet(null); break;
      case 'whatif-back': keep(); whatIfSheet(b.dataset.t in DB ? b.dataset.t : null); break;
      case 'ask': answerSheet(b.dataset.t, b.dataset.id); break;
      case 'resolve': { const d = S.doubts.find(x => x.id === b.dataset.id); d.status = v; closeSheet(); keep(); toast(v === 'resolved' ? 'Duda resuelta' : 'Apuntada para la reunión'); break; }
      case 'free': { const txt = (document.getElementById('free').value || '').trim(); if (!txt) return; S.doubts.push({ id: 'free-' + Date.now(), topic: b.dataset.t, q: txt, covered: 'no', status: 'open' }); closeSheet(); keep(); toast('Apuntada para la reunión'); break; }
      case 'close': closeSheet(); break;
      case 'talk': talkSheet(); break;
      case 'settings': settingsSheet(); break;
      case 'setpref': S.prefs[b.dataset.k] = v; S.cardFmt = {}; keep(); settingsSheet(); break;
      case 'panel': S.panelOpen = !S.panelOpen; render(); if (S.panelOpen) document.getElementById('panel').scrollIntoView({ behavior: 'smooth' }); break;
      case 'book': if (S.stage !== 'plan') { S.stage = 'plan'; S.prefs.format = S.prefs.format || 'numbers'; S.prefs.depth = S.prefs.depth || 'quick'; S.prefs.tone = S.prefs.tone || 'calm'; render(); } bookSheet(); break;
      case 'cal': calSheet(b.dataset.k); break;
      case 'calday': CAL.day = v; calSheet(CAL.kind, true); break;
      case 'caltime': CAL.time = v; calSheet(CAL.kind, true); break;
      case 'calok': {
        const dt = fromIso(CAL.day, CAL.time), kind = CAL.kind;
        if (kind === 'pay') { S.payDate = { iso: CAL.day, time: CAL.time, label: fmtLong(dt) }; closeSheet(); keep(); toast(`Apuntado. Con ese paso, vuestra nota pasa a ${Fmt.scoreFor(F, ['card'])}`); }
        else { S.booking = { iso: CAL.day, time: CAL.time, label: fmtSlot(dt), short: fmtSlot(dt), mins: nextStep().mins }; closeSheet(); render(); document.getElementById('s-cierre').scrollIntoView({ behavior: 'smooth' }); toast('Reunión pedida'); }
        break;
      }
      case 'gocierre': document.getElementById('s-cierre').scrollIntoView({ behavior: 'smooth' }); break;
      case 'week': weekSheet(); break;
      case 'weekfill': document.getElementById('bal').value = v; break;
      case 'weekok': { const n = parseFloat(document.getElementById('bal').value); if (isNaN(n)) return; if (n <= F.firstStep.remaining) weekDone(n); else weekStuck(n); break; }
      case 'weekwhy': S.week = { done: false, balance: +b.dataset.b, reason: v }; S.doubts.push({ id: 'week-' + Date.now(), topic: 'card', q: `A la semana no habían pagado: ${v}`, covered: 'no', status: 'open' }); keep();
        sheet(`<div class="kicker">Apuntado</div><h2>Justo para esto está vuestro asesor.</h2><p>Le llega lo que nos habéis dicho, para que la reunión empiece por ahí.</p>${S.booking ? '<button class="btn block" data-act="close">Seguir</button>' : '<button class="btn block" data-act="book">Pedir reunión</button><button class="link" style="width:100%" data-act="close">Ahora no</button>'}`); break;
      case 'ics': downloadIcs(b.dataset.k || 'meet'); break;
      case 'copy': copySummary(); break;
      case 'print': window.print(); break;
      case 'restart': try { localStorage.removeItem(KEY); } catch (er) { /* nada */ } S = fresh(); closeSheet(); render(); break;
    }
  });

  function keep() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  function downloadIcs(kind) {
    const pay = kind === 'pay', b = pay ? S.payDate : S.booking; if (!b) return;
    const s = fromIso(b.iso.slice(0, 10), b.time), e = new Date(s.getTime() + (pay ? 15 : b.mins) * 60000);
    const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//plan-weah//es', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@plan-weah', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(s), 'DTEND:' + z(e),
      'SUMMARY:' + (pay ? `Pagar ${M(F.firstStep.amount)} de la tarjeta` : 'Reunión con vuestro asesor: empezar el plan'), 'DESCRIPTION:' + (pay ? `Primer paso de vuestro plan. Después, el saldo de la tarjeta queda en ${M(F.firstStep.remaining)}.` : summaryText().replace(/\n/g, '\\n')), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = pay ? 'primer-paso.ics' : 'reunion-plan.ics'; a.click();
  }
  function summaryText() {
    const acc = STEPS().filter(s => S.steps[s.key] === 'yes').map(s => '- ' + s.title);
    const open = S.doubts.filter(d => d.status === 'open').map(d => '- ' + d.q);
    return `Familia ${F.family}. Reunión: ${S.booking ? S.booking.label + ' (' + S.booking.mins + ' min)' : 'sin fecha'}\nLo que más importa: ${S.phrase || ''}\nQué cambiaría en casa: ${S.gain || ''}\nNivel: ${PRO() ? 'saben de finanzas' : 'nuevos en esto'}${S.payDate ? '\nPrimer paso con fecha: ' + S.payDate.label : ''}\nPasos aceptados:\n${acc.join('\n') || '- ninguno'}\nDudas para la reunión:\n${open.join('\n') || '- ninguna'}`;
  }
  function copySummary() { const t = summaryText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Resumen copiado'), () => toast('No se ha podido copiar')); }

  // ------------------------------------------------------------------ arranque
  async function boot() {
    try {
      F = await Facts.load();
      DB = Content.doubts(F);
      Charts.initTips();
      const q = new URLSearchParams(location.search);
      if (q.has('reset')) { S = fresh(); }
      if (q.get('demo') === 'plan') { S.stage = 'plan'; S.prefs = { format: q.get('f') || 'image', depth: q.get('d') || 'quick', tone: q.get('t') || 'full', level: q.get('l') === 'pro' ? 'pro' : 'new' }; S.phrase = S.phrase || Content.PHRASES[0]; }
      render();
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="narrow card"><h2>No hemos podido cargar vuestro plan.</h2><p>Arrancad la web con <code>npm start</code> desde la raíz del repo, o abrid <code>dist/plan-weah.html</code> (se genera con <code>npm run build</code>).</p><button class="btn" onclick="location.reload()">Reintentar</button></div>`;
    }
  }
  window.addEventListener('resize', () => document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; }));
  boot();
})();
