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
    prefs: { format: null, depth: null, tone: null },
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
  const QUIZ = ['who', 'card', 'format', 'year', 'cash', 'life', 'feel', 'retire', 'depth'];
  const CONF = [['sure', 'Seguro'], ['doubt', 'Lo dudo'], ['none', 'Ni idea']];
  const CASH_OPTS = ['Casi nada', 'Unos cientos de dólares', 'Unos miles de dólares', 'Más de 5.000 $'];
  const LIFE_OPTS = ['Casi nada', 'Unos meses de gastos', 'Un par de años de gastos', 'Más de diez años de gastos'];
  const RETIRE_OPTS = ['Sí, con margen', 'Justo justo', 'No nos llega', 'Ni idea'];

  function progress() {
    const i = S.qi, n = QUIZ.length;
    const left = Math.max(1, Math.round((n - i) * 0.55));
    return `<div class="progress" aria-label="Paso ${i + 1} de ${n}"><div class="bar"><i style="width:${(i / n) * 100}%"></i></div><span class="tiny">~${left} min</span></div>`;
  }

  const confChips = (key) => `<p class="muted small" style="margin:14px 0 6px">¿Qué tan seguros estáis?</p>
    <div class="chips" role="group" aria-label="Seguridad">${CONF.map(([v, l]) => `<button class="chip" data-act="conf" data-k="${key}" data-v="${v}" aria-pressed="${(S.a[key] || {}).conf === v}">${l}</button>`).join('')}</div>`;

  const dock = (label, enabled, act = 'next') => `<div class="dock"><button class="btn block" data-act="${act}" ${enabled ? '' : 'disabled'}>${label}</button></div>`;

  // Tarjeta de un dato con el formato elegido.
  function fact(x, opts = {}) {
    const fmt = (S.cardFmt[x.id]) || S.prefs.format || 'numbers';
    const depth = S.prefs.depth || 'quick';
    const calm = S.prefs.tone === 'calm';
    let body = '';
    if (fmt === 'numbers') {
      body = `<div class="big ${x.bigMid ? 'mid' : ''}">${x.big}</div><p class="muted">${x.bigSub || ''}</p>` +
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
    return `<div class="card ${opts.cls || ''}">${x.kicker ? `<div class="kicker">${x.kicker}</div>` : ''}
      ${x.headline ? `<h3>${x.headline}</h3>` : ''}${body}${why}
      ${alt}${!calm && x.src ? `<div class="src">Del plan: ${esc(x.src)}</div>` : ''}${opts.extra || ''}</div>`;
  }

  // ------------------------------------------------------------------ datos de cada tarjeta
  const X = {
    cardCost: () => ({
      id: 'cardCost', kicker: 'La tarjeta', headline: 'Lo que os cuesta la tarjeta al año',
      big: M(F.card.costYear), bigSub: `en intereses: el ${P(F.card.apr)} sobre ${M(F.card.balance)}`,
      rows: [['Saldo de la tarjeta ' + F.card.issuer, M(F.card.balance)], ['Interés', P(F.card.apr)], ['Pagáis al mes', M(F.card.payMonth)], ['De eso, intereses', M(F.card.interestMonth)]],
      image: Charts.interestBar(F.card.payMonth, F.card.interestMonth),
      story: `Cada mes pagáis <strong>${M(F.card.payMonth)}</strong> a la tarjeta. Unos <strong>${M(F.card.interestMonth)}</strong> se van en intereses antes de tocar la deuda. En un año, son <strong>${M(F.card.costYear)}</strong>.`,
      why: `${P(F.card.apr)} × ${M(F.card.balance)} = ${M(F.card.costYear)} al año. De los ${M(F.card.payMonth)} mensuales, unos ${M(F.card.interestMonth)} son intereses, así que la deuda apenas baja.`,
      src: 'profile.liabilities[0] · creditCardDebt.ccPaymentEqualToInterestRate',
    }),
    cardYear: () => ({
      id: 'cardYear', kicker: 'La tarjeta', headline: 'A este ritmo, la tarjeta se acaba en…',
      big: D(F.card.payoff), bigMid: true, bigSub: `pagando ${M(F.card.payMonth)} al mes`,
      rows: [['Pago mensual', M(F.card.payMonth)], ['Intereses al mes', M(F.card.interestMonth)], ['Fin previsto', D(F.card.payoff)]],
      image: Charts.timeline(+F.planDate.slice(0, 4), +F.card.payoff.slice(0, 4), D(F.card.payoff), (F.kids[0] && F.education.starts[0]) ? [{ year: +F.education.starts[0].date.slice(0, 4), label: 'Universidad ' + F.education.starts[0].name }] : []),
      story: `Si seguís pagando <strong>${M(F.card.payMonth)}</strong> al mes, la tarjeta se acaba en <strong>${D(F.card.payoff)}</strong>. Para entonces, ${F.education.starts[0] ? F.education.starts[0].name + ' ya estará empezando la universidad' : 'habrán pasado muchos años'}.`,
      why: `Casi todo el pago se lo llevan los intereses (${M(F.card.interestMonth)} de ${M(F.card.payMonth)}), así que el saldo baja muy despacio.`,
      src: 'creditCardDebt.ccPayoffDate',
    }),
    cash: () => ({
      id: 'cash', kicker: 'El efectivo', headline: `Lo que os dan ${M(F.cash.balance)} en la cuenta, al año`,
      big: M(F.cash.yieldYear), bigSub: `al ${P(F.cash.rate, 1)}, frente a los ${M(F.card.costYear)} que cuesta la tarjeta`,
      rows: [['Efectivo en cuenta', M(F.cash.balance)], ['Rentabilidad', P(F.cash.rate, 1)], ['Os da al año', M(F.cash.yieldYear)], ['La tarjeta cuesta al año', M(F.card.costYear)]],
      image: Charts.compareBars([{ label: 'La tarjeta os cuesta al año', value: F.card.costYear, color: 'var(--s2)' }, { label: 'El efectivo os da al año', value: F.cash.yieldYear, color: 'var(--s1)' }]),
      story: `Vuestro efectivo da unos <strong>${M(F.cash.yieldYear)}</strong> al año. A la vez, la tarjeta se lleva <strong>${M(F.card.costYear)}</strong>. Dinero parado y deuda cara al mismo tiempo.`,
      why: `${P(F.cash.rate, 1)} × ${M(F.cash.balance)} ≈ ${M(F.cash.yieldYear)} al año. El plan ve ${M(F.cash.aboveAll)} por encima de la reserva y de las vacaciones.`,
      src: 'investment-analysis · cashNeeds.currentCashBalance',
    }),
    life: () => ({
      id: 'life', kicker: 'Proteger a ' + F.kids.map(k => k.name).join(' y '), headline: 'Si a uno de los dos le pasara algo, el seguro cubriría…',
      big: `unos ${Math.round(F.life.yearsNow)} años`, bigMid: true, bigSub: `de gastos del hogar. El mínimo recomendado: unos ${Math.round(F.life.yearsMin)}.`,
      rows: [[`Seguro de ${F.a.name}`, M(F.life.nowA)], [`Mínimo para ${F.a.name}`, M(F.life.minA)], [`Seguro de ${F.b.name}`, M(F.life.nowB)], [`Mínimo para ${F.b.name}`, M(F.life.minB)], ['Gastos del hogar al año', M(F.life.expYear)]],
      image: Charts.yearBlocks(F.life.yearsNow, F.life.yearsMin),
      story: `Hoy, entre los dos, tenéis <strong>${M(F.life.now)}</strong> de seguro de vida. Eso pagaría unos <strong>${Math.round(F.life.yearsNow)} años</strong> de los gastos de casa. Para que ${F.kids.map(k => k.name).join(' y ')} estén cubiertos, el plan recomienda unos <strong>${Math.round(F.life.yearsMin)}</strong>.`,
      why: `Lo asegurado entre los dos (${M(F.life.now)}) entre lo que gasta vuestro hogar al año (${M(F.life.expYear)}). El mínimo recomendado suma ${M(F.life.min)}.`,
      src: 'protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses',
    }),
    retire: () => ({
      id: 'retire', kicker: 'Jubilación', headline: `¿Llegáis a jubilaros a los ${F.a.retire} y ${F.b.retire}? Sí.`,
      big: P(F.retirement.coverPct), bigSub: 'de lo que necesitaréis cada año lo cubren vuestros ingresos, y los ahorros no se acaban',
      rows: [['Año de jubilación', F.retirement.year], ['Ingresos / necesidad anual', P(F.retirement.coverPct)], ['Os queda al final del plan (dólares de hoy)', M(F.retirement.leftAtEnd)], ['Ahorráis al año', `${M(F.retirement.savingsYear)} (${P(F.retirement.savingsRate, 1)})`]],
      image: Charts.gauge(F.retirement.coverPct, `Ingresos: ${P(F.retirement.coverPct)} de la necesidad anual`),
      story: `Buena noticia: vuestra jubilación está bien encaminada. Los ingresos cubren el <strong>${P(F.retirement.coverPct)}</strong> de lo que necesitaréis cada año, y al final del plan aún quedan <strong>${M(F.retirement.leftAtEnd)}</strong>.`,
      why: `Ahorráis el ${P(F.retirement.savingsRate, 1)} de lo que ganáis y aprovecháis toda la aportación de vuestras empresas (${M(F.retirement.matchA)} y ${M(F.retirement.matchB)} al año).`,
      src: 'facts.retirement · ratios.savingsLevel',
    }),
    cushion: () => ({
      id: 'cushion', kicker: 'Colchón', headline: 'Vuestro colchón para imprevistos',
      big: `${F.cash.months} meses`, bigMid: true, bigSub: 'de gastos esenciales. Lo recomendado son 8 a 9.',
      rows: [['Efectivo accesible', M(F.cash.accessible)], ['Reserva recomendada', `${M(F.cash.reserveMin)} a ${M(F.cash.reserveMax)}`], ['De sobra, tras reserva y vacaciones', M(F.cash.aboveAll)]],
      image: Charts.compareBars([{ label: 'Lo que tenéis accesible', value: F.cash.accessible, color: 'var(--s1)' }, { label: 'Reserva recomendada (máx.)', value: F.cash.reserveMax, color: 'var(--s3)' }]),
      story: `Si uno de los dos se quedara sin trabajo, tenéis efectivo para unos <strong>${F.cash.months} meses</strong>. El plan recomienda 8 a 9: aquí vais sobrados.`,
      why: `El plan ve ${M(F.cash.aboveAll)} por encima de la reserva y de las vacaciones de ${M(F.goals.vacation)}. Ojo: esa cuenta no incluye el coche ni la casa.`,
      src: 'facts.cash',
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

  function renderQuiz() {
    const step = QUIZ[S.qi];
    qStart = Date.now();
    let h = `<div class="narrow">${progress()}`;
    const A = S.a;

    if (step === 'who') {
      h += `<h2 class="q">¿Quién mira el plan?</h2>
        <div class="chips">${[['juntos', 'Los dos juntos'], ['a', F.a.name], ['b', F.b.name]].map(([v, l]) => `<button class="chip" data-act="who" data-v="${v}" aria-pressed="${S.who === v}">${l}</button>`).join('')}</div>
        <h2 class="q" style="margin-top:28px">En una línea, ¿qué os importa más?</h2>
        ${Content.PHRASES.map(p => `<button class="opt" data-act="phrase" data-v="${esc(p)}" aria-pressed="${S.phrase === p}">${esc(p)}</button>`).join('')}
        <p class="tiny">No hay respuestas buenas ni malas. Lo usamos para contaros el plan con vuestras palabras.</p>
        ${dock('Empezar', S.who && S.phrase)}`;
    }

    if (step === 'card') {
      const a = A.cardCost || {};
      if (!a.revealed) {
        h += `<div class="kicker">Pregunta 1</div><h2 class="q">¿Cuánto creéis que os cuesta la tarjeta al año?</h2>
          <p class="muted">Solo los intereses. Un cálculo a ojo vale; aquí no hay nota.</p>
          <div class="amount"><div class="val ${a.value == null ? 'empty' : ''}" id="amt">${a.value == null ? 'Mueve la barra' : M(a.value)}</div>
          <input type="range" min="0" max="10000" step="100" value="${a.value ?? 5000}" class="${a.value == null ? 'untouched' : ''}" data-act="range" data-k="cardCost" aria-label="Coste anual de la tarjeta">
          <div class="spread tiny"><span>0 $</span><span>10.000 $</span></div></div>
          ${confChips('cardCost')}${dock('Ver cuánto es', a.value != null && a.conf, 'reveal')}`;
      } else {
        const err = Math.abs(a.value - F.card.costYear) / F.card.costYear;
        const dist = err <= 0.2 ? 'close' : err <= 0.5 ? 'mid' : 'far';
        h += `<p class="muted">Dijisteis <b>${M(a.value)}</b></p><h2 class="reveal">${revealHead('cardCost', dist)}</h2>
          <div class="reveal">${factFixed(X.cardCost(), 'numbers')}</div>${dock('Seguir', true)}`;
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
        h += `<div class="kicker">Pregunta 2</div><h2 class="q">Pagando ${M(F.card.payMonth)} al mes, ¿cuándo terminaríais de pagar la tarjeta?</h2>
          <div class="chips" style="margin:14px 0">${[2020, 2030, 2040, 2050].map(d => `<button class="chip" data-act="decade" data-v="${d}" aria-pressed="${y != null && Math.floor(y / 10) * 10 === d}">${d}s</button>`).join('')}</div>
          <div class="stepper"><button data-act="yr" data-v="-1" aria-label="Un año menos" ${y == null ? 'disabled' : ''}>−</button><div class="yearval">${y ?? '—'}</div><button data-act="yr" data-v="1" aria-label="Un año más" ${y == null ? 'disabled' : ''}>+</button></div>
          ${y == null ? '<p class="tiny" style="text-align:center">Elegid una década y ajustad el año.</p>' : ''}
          ${confChips('cardYear')}${dock('Ver la fecha', y != null && a.conf, 'reveal')}`;
      } else {
        const diff = Math.abs(a.value - +F.card.payoff.slice(0, 4));
        const dist = diff <= 2 ? 'close' : diff <= 6 ? 'mid' : 'far';
        h += `<p class="muted">Dijisteis <b>${a.value}</b></p><h2 class="reveal">${revealHead('cardYear', dist)}</h2><div class="reveal">${fact(X.cardYear(), { noAlt: false })}</div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'cash') {
      const a = A.cash || {};
      if (!a.revealed) {
        h += `<div class="kicker">Pregunta 3</div><h2 class="q">Tenéis ${M(F.cash.balance)} en la cuenta. ¿Cuánto os dan al año?</h2>
          ${CASH_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="cash" data-v="${i}" aria-pressed="${a.value === i}">${o}</button>`).join('')}
          ${confChips('cash')}${dock('Ver la respuesta', a.value != null && a.conf, 'reveal')}`;
      } else {
        h += `<p class="muted">Dijisteis <b>${CASH_OPTS[a.value]}</b></p><h2 class="reveal">${a.value === 0 ? 'Eso es: casi nada.' : 'Menos de lo que parece.'}</h2><div class="reveal">${fact(X.cash())}</div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'life') {
      const a = A.life || {};
      if (!a.permission) {
        h += `<div class="card"><h2>Lo siguiente no es fácil, pero tiene arreglo.</h2>
          <p>Hablamos de proteger a ${F.kids.map(k => k.name).join(' y ')}. ¿Lo vemos ahora?</p>
          <button class="btn block" data-act="lifeperm" data-v="now">Lo vemos ahora</button>
          <button class="link block" style="width:100%" data-act="lifeperm" data-v="later">Saltar por ahora</button></div>`;
      } else if (!a.revealed) {
        h += `<div class="kicker">Pregunta 4</div><h2 class="q">Si a uno de vosotros le pasara algo, ¿qué tendrían ${F.kids.map(k => `${k.name} (${k.age})`).join(' y ')} asegurado?</h2>
          ${LIFE_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="life" data-v="${i}" aria-pressed="${a.value === i}">${o}</button>`).join('')}
          ${confChips('life')}${dock('Ver la respuesta', a.value != null && a.conf, 'reveal')}`;
      } else {
        h += `<p class="muted">Dijisteis <b>${LIFE_OPTS[a.value]}</b></p><h2 class="reveal">${a.value === 2 ? 'Habéis estado cerca.' : 'Aquí el plan sorprende, no vosotros.'}</h2><div class="reveal">${fact(X.life())}</div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'feel') {
      h += `<h2 class="q">Con cifras así, ¿qué os viene mejor?</h2>
        <button class="opt" data-act="tone" data-v="calm" aria-pressed="${S.prefs.tone === 'calm'}"><b>Lo justo para decidir</b><span class="muted small">Una cifra cada vez y el primer paso claro.</span></button>
        <button class="opt" data-act="tone" data-v="full" aria-pressed="${S.prefs.tone === 'full'}"><b>Verlo todo con detalle</b><span class="muted small">Todas las cifras, tablas y de dónde sale cada una.</span></button>
        <button class="opt" data-act="tone" data-v="talk" aria-pressed="false"><b>Preferimos hablarlo con una persona</b><span class="muted small">Seguimos aquí con lo justo y os ayudamos a pedir cita.</span></button>
        ${dock('Seguir', S.prefs.tone)}`;
    }

    if (step === 'retire') {
      const a = A.retire || {};
      if (!a.revealed) {
        h += `<div class="kicker">Pregunta 5</div><h2 class="q">¿Llegáis a jubilaros cuando queréis, ${F.a.name} a los ${F.a.retire} y ${F.b.name} a los ${F.b.retire}?</h2>
          ${RETIRE_OPTS.map((o, i) => `<button class="opt" data-act="opt" data-k="retire" data-v="${i}" aria-pressed="${a.value === i}">${o}</button>`).join('')}
          ${confChips('retire')}${dock('Ver la respuesta', a.value != null && a.conf, 'reveal')}`;
      } else {
        h += `<p class="muted">Dijisteis <b>${RETIRE_OPTS[a.value]}</b></p><h2 class="reveal">${a.value === 0 ? 'Eso es.' : 'Mejor de lo que pensabais.'}</h2><div class="reveal">${fact(X.retire())}</div>${dock('Seguir', true)}`;
      }
    }

    if (step === 'depth') {
      if (!S.prefs.depth) S.prefs.depth = (S.sig.whyOpens >= 1 || avgTime() > 25) ? 'why' : 'quick';
      h += `<h2 class="q">Última: para contaros el plan, ¿cómo empezamos?</h2>
        <button class="opt" data-act="depth" data-v="quick" aria-pressed="${S.prefs.depth === 'quick'}"><b>Primero la conclusión</b><span class="muted small">El porqué, solo si lo pedimos.</span></button>
        <button class="opt" data-act="depth" data-v="why" aria-pressed="${S.prefs.depth === 'why'}"><b>Contadnos el porqué de cada paso</b><span class="muted small">Cada propuesta con su razón a la vista.</span></button>
        ${dock('Ver vuestro plan', S.prefs.depth, 'toplan')}`;
    }
    h += '</div>';
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
      key: 'umbrella', title: `Contratar un seguro umbrella de ${M(F.umbrella.rec)}`, when: 'Este trimestre',
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
    return `<div class="card step" id="step-${st.key}">
      <div class="row" style="align-items:flex-start;flex-wrap:nowrap"><span class="num">${i + 1}</span>
        <div style="flex:1"><div class="kicker" style="margin:0">${st.when} · esfuerzo ${st.effort}</div><h3 style="margin:2px 0 6px">${st.title}</h3></div>
        <span class="tag acc" title="Nota tras este paso, en este orden">Nota ${st.score}</span></div>
      <p>${st.quick}</p>
      ${depth === 'why' ? `<div class="card soft" style="padding:14px;margin:0"><b>Por qué</b><p style="margin:.3em 0 0">${st.why}</p></div>` : `<details class="why"><summary>¿Por qué?</summary><p>${st.why}</p></details>`}
      ${st.key === 'umbrella' ? `<p class="tiny">Umbrella: seguro extra de responsabilidad civil por encima del de casa y coche, para demandas grandes.</p>` : ''}
      <p style="margin:14px 0 0;font-weight:600">¿Os convence?</p>
      <div class="vote">${[['yes', 'Sí'], ['doubt', 'Tengo dudas'], ['no', 'No']].map(([k, l]) => `<button class="chip" data-act="vote" data-s="${st.key}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>
      ${myDoubts.length ? `<div style="margin-top:10px">${myDoubts.map(doubtLine).join('')}</div>` : ''}
      ${!calm && st.x ? `<details class="why"><summary>Ver la cifra</summary>${fact(st.x(), { noAlt: false })}</details>` : ''}
    </div>`;
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

  function renderPlan() {
    const calm = S.prefs.tone === 'calm';
    const ns = nextStep(), c = counts();
    const rows = believed();
    const steps = STEPS();
    const accepted = acceptedKeys();
    const scoreNow = Fmt.scoreFor(F, accepted);
    const scoreMax = Fmt.scoreFor(F, ['card', 'life', 'umbrella']);

    let main = `<div class="section"><div class="kicker">Plan de la familia ${F.family} · ${F.a.name} y ${F.b.name}</div>
      <h1 style="font-size:clamp(30px,7.5vw,46px)">«${esc(S.phrase || 'Vuestro plan')}»</h1>
      <p class="muted">Esto es lo que propone vuestro plan, contado como lo habéis elegido. ${calm ? 'Una cosa cada vez.' : 'Con todas las cifras y de dónde salen.'}</p>
      <button class="btn ghost panel-mobile-toggle" data-act="panel">Ver vuestros datos en gráficos</button></div>`;

    if (rows.length) {
      main += `<div class="section" id="s-creiais"><div class="kicker">1 · Lo que creíais y lo que dice el plan</div>
        <div class="card">${calm ? `<p>Creíais <b>${rows[0][1]}</b>; el plan dice</p><div class="big mid">${rows[0][2]}</div>${rows.length > 1 ? `<details class="why"><summary>Ver las otras ${rows.length - 1}</summary>${tbl(rows.slice(1))}</details>` : ''}` : tbl(rows)}</div></div>`;
    }

    const good = [X.retire(), X.saving(), X.cushion()];
    main += `<div class="section" id="s-bien"><div class="kicker">2 · Lo que ya hacéis bien</div>
      ${fact(good[0])}${calm ? `<details class="why card"><summary>Dos cosas más que hacéis bien</summary>${fact(good[1])}${fact(good[2])}</details>` : fact(good[1]) + fact(good[2])}</div>`;

    main += `<div class="section" id="s-frena"><div class="kicker">3 · Lo que frena vuestro plan</div>${fact(X.score())}
      ${calm ? '' : fact(X.cash())}</div>`;

    main += `<div class="section" id="s-pasos"><div class="kicker">4 · Los pasos que propone vuestro plan</div>
      <div class="card soft"><div class="spread"><b>Vuestra nota con los pasos aceptados</b><b style="font-family:var(--head);font-size:24px">${scoreNow}</b></div>
        <div class="scorebar"><span class="tiny">0</span><div class="track"><div class="fill" style="width:${scoreNow}%"></div></div><span class="tiny">100</span></div>
        <p class="tiny" style="margin:.4em 0 0">Con los tres pasos, ${scoreMax}. Las notas salen del plan: el orden importa porque la tarjeta y el seguro ponen techo.</p></div>
      ${steps.map(stepCard).join('')}</div>`;

    main += `<div class="section" id="s-despues"><div class="kicker">5 · Lo que viene después</div>
      <div class="card"><h3>La universidad de ${F.kids.map(k => k.name).join(' y ')}</h3>
        <p>${S.prefs.format === 'story' ? `Todavía no hay nada ahorrado para la universidad. ${F.education.starts.map(s => `${s.name} empieza en ${D(s.date)}`).join(' y ')}. El plan propone guardar unos <b>${M(F.education.extraYear)}</b> más el primer año.` : `Faltan <b>${M(F.education.gap)}</b>. El plan propone unos <b>${M(F.education.extraYear)}</b> más al año (el primer año; luego sube).`}</p>
        <button class="link small" data-act="doubts" data-t="education">Tengo dudas sobre esto</button></div>
      <div class="card"><h3>Cuánto riesgo queréis</h3>
        <p>El <b>${P(F.portfolio.equityNow)}</b> de lo invertido está en acciones; el objetivo ${F.portfolio.targetProfile} es ${P(F.portfolio.equityTarget)}. ${F.a.name} se declaró ${F.a.risk} y ${F.b.name} ${F.b.risk}: el plan propone hablarlo juntos.</p>
        ${calm ? '' : `<p class="small muted">Tecnología: ${P(F.portfolio.tech)} de las acciones. Fondo apalancado UPRO: ${M(F.portfolio.upro)}.</p>`}
        <button class="link small" data-act="doubts" data-t="portfolio">Tengo dudas sobre esto</button></div>
      <div class="card"><h3>El coche y la casa</h3>
        <p>El plan incluye un coche de ${M(F.goals.car.amount)} en ${D(F.goals.car.date)} y una casa de ${M(F.goals.home.amount)} en ${D(F.goals.home.date)}.</p>
        <button class="link small" data-act="doubts" data-t="goals">Tengo dudas sobre esto</button></div></div>`;

    main += `<div class="section" id="s-cierre"><div class="kicker">6 · Vuestro siguiente paso</div>
      <div class="card"><div class="meter">
        <div><b>${c.yes}/3</b><span class="tiny">pasos aceptados</span></div>
        <div><b>${c.resolved}</b><span class="tiny">dudas resueltas</span></div>
        <div><b>${c.open}</b><span class="tiny">para la reunión</span></div></div>
        <h2 style="margin-top:18px">${ns.title}</h2><p>${ns.text}</p>
        <p class="muted small">Proponemos una reunión de <b>${ns.mins} minutos</b> en los próximos <b>${ns.days} días laborables</b>.${c.pending ? ` Aún no habéis contestado ${c.pending === 1 ? '1 paso' : c.pending + ' pasos'}.` : ''}${ns.lvl !== 'go' && c.open ? ' Si resolvéis aquí alguna duda con «¿Y si…?», la reunión se acorta.' : ''}</p>
        <button class="btn block" data-act="book">${c.yes ? 'Queremos empezar con este plan' : 'Queremos hablarlo con el asesor'}</button>
        <button class="link" style="width:100%" data-act="whatif">Antes, tengo otra pregunta</button></div>
      ${S.booking ? advisorSheet() : ''}</div>`;

    main += `<p class="foot">Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor. Caso de ejemplo del reto; las cifras salen del plan (JSON del caso).</p>`;

    app.innerHTML = `<div class="plan-grid"><div>${main}</div><aside class="panel ${S.panelOpen ? '' : 'collapsed'}" id="panel" aria-label="Panel de datos">${panel()}</aside></div>
      <button class="btn fab" data-act="whatif">¿Y si…?</button>`;
  }

  const tbl = rows => `<table class="nums"><tr><td class="tiny">Tema</td><td class="tiny" style="text-align:left">Creíais</td><td class="tiny">El plan</td></tr>${rows.map(r => `<tr><td>${r[0]}</td><td style="text-align:left;font-weight:400">${esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</table>`;

  function panel() {
    const people = [F.a.name, F.b.name];
    const groups = [
      { label: 'Jubilación', sub: 'con impuestos diferidos', test: a => a.tax === 'TAX_DEFERRED' },
      { label: 'Roth', sub: 'libre de impuestos', test: a => a.tax === 'TAX_FREE' },
      { label: 'Bróker', sub: 'con impuestos', test: a => /Brokerage/.test(a.type) },
      { label: 'Efectivo', sub: 'cuenta corriente', test: a => /Checking/.test(a.type) },
    ].map(g => ({ ...g, by: F.portfolio.accounts.filter(g.test).reduce((o, a) => { o[a.owner] = (o[a.owner] || 0) + a.balance; return o; }, {}) }));
    const total = F.portfolio.accounts.reduce((s, a) => s + a.balance, 0);
    const marks = [{ year: F.retirement.year, label: 'Jubilación' }].concat(F.goals.home ? [{ year: +F.goals.home.date.slice(0, 4), label: 'Casa' }] : []);
    const labelDebt = { PERSONAL_CREDIT_CARD: 'Tarjeta', STUDENT_LOAN_FEDERAL_UNSUBSIDIZED: 'Préstamo de estudios', PRIMARY_MORTGAGE: 'Hipoteca', AUTO_LOAN: 'Préstamo del coche' };
    return `<div class="card"><div class="spread"><h3>Vuestros datos</h3><button class="link small panel-mobile-toggle" data-act="panel">Cerrar</button></div>
        <p class="tiny">Del plan del ${D(F.planDate.slice(0, 7))}. Pasad el dedo o el ratón por los gráficos.</p></div>
      <div class="card"><div class="kicker">Patrimonio neto previsto</div><div class="spread"><b>${M(F.projection[0].today)}</b><span class="tiny">→ ${M(F.retirement.netWorthAtRetireToday)} al jubilaros</span></div>
        <p class="tiny">En dólares de hoy.</p>${Charts.projection(F.projection, marks)}</div>
      <div class="card"><div class="kicker">Dónde está vuestro dinero</div><div class="spread"><b>${M(total)}</b><span class="tiny">${F.portfolio.accounts.length} cuentas</span></div>
        <div class="legend"><span><i style="background:var(--s1)"></i>${people[0]}</span><span><i style="background:var(--s2)"></i>${people[1]}</span></div>
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
      <h3>Pasos aceptados (${acc.length}/3)</h3><ul>${acc.map(t => `<li>${t}</li>`).join('') || '<li class="muted">Ninguno todavía</li>'}</ul>
      ${dud.length ? `<h3>Con dudas</h3><ul>${dud.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${no.length ? `<h3>No les convence</h3><ul>${no.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      <h3>Dudas para la reunión (${open.length})</h3><ul>${open.map(d => `<li>${esc(d.q)}${d.covered !== 'yes' ? ' <span class="tag warn">el plan no lo cubre</span>' : ''}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      <h3>Dudas ya resueltas con el plan (${res.length})</h3><ul>${res.map(d => `<li>${esc(d.q)}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      ${believed().length ? `<h3>Creían frente a lo que dice el plan</h3>${tbl(believed())}` : ''}
      <h3>Datos a revisar</h3><ul><li>El efectivo de sobra (${M(F.cash.aboveAll)}) no cuenta el coche (${D(F.goals.car.date)}) ni la casa (${D(F.goals.home.date)}).</li><li>Seguro de vida objetivo: el plan da ${M(F.life.targetA)} y ${M(F.life.targetB)}.</li><li>Los gastos declarados parecen bajos: confirmar antes de fijar cuotas.</li></ul>
      <label class="row small" style="margin:10px 0"><input type="checkbox" data-act="sharestyle" ${S.shareStyle ? 'checked' : ''} style="width:22px;height:22px"> Compartir cómo preferimos ver el plan</label>
      ${S.shareStyle ? `<p class="small muted">Prefieren verlo ${pref}.</p>` : ''}
      <div class="row"><button class="btn soft" data-act="ics">Añadir al calendario</button><button class="btn soft" data-act="copy">Copiar resumen</button><button class="btn soft" data-act="print">Imprimir</button></div></div>`;
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
      <h3>Forma</h3>${grp('format', [['numbers', 'Números'], ['image', 'Imagen'], ['story', 'Historia']])}
      <h3>Explicación</h3>${grp('depth', [['quick', 'Conclusión primero'], ['why', 'Con el porqué']])}
      <h3>Detalle</h3>${grp('tone', [['calm', 'Lo justo'], ['full', 'Todo']])}
      <button class="link" data-act="restart">Volver a empezar desde cero</button>`);
  }

  function slots(days) {
    const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      added++;
      for (const [h, m] of [[9, 30], [13, 0], [18, 30]]) { const s = new Date(d); s.setHours(h, m); out.push(s); }
    }
    return out;
  }
  const fmtSlot = s => s.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + s.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  function bookSheet() {
    const ns = nextStep(), c = counts();
    const list = slots(Math.min(ns.days, 5)).slice(0, 12);
    sheet(`<h2>${c.yes ? 'Empezar con vuestro plan' : 'Reunión con vuestro asesor'}</h2>
      <p>${ns.text}</p><p class="muted small">Reunión de <b>${ns.mins} minutos</b>, por videollamada. Elegid un hueco:</p>
      <div class="slots">${list.map(s => `<button class="chip" data-act="slot" data-v="${s.toISOString()}" data-mins="${ns.mins}">${fmtSlot(s)}</button>`).join('')}</div>
      <p class="tiny" style="margin-top:12px">Al confirmar, vuestro asesor recibe los pasos aceptados y vuestras dudas. En este prototipo no se envía nada.</p>`);
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

  function renderHome() {
    app.innerHTML = `<div class="narrow hero">
      <div class="eyebrow">Plan de ${F.a.name} y ${F.b.name} ${F.family}</div>
      <h1>Vuestro plan en 5 minutos</h1>
      <p class="muted" style="font-size:19px">Primero adivináis cinco cifras de vuestro dinero. Luego os contamos el plan de vuestro asesor como mejor lo entendáis: en números, con imágenes o como una historia.</p>
      <button class="btn bigcta" data-act="start">${S.qi > 0 && S.stage === 'home' ? 'Seguir donde lo dejamos' : 'Empezar'}</button>
      <button class="link" style="text-align:left" data-act="skip">Ir directamente al plan</button>
      <p class="tiny">Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia.</p></div>`;
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

  document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details[data-why]') && e.target.open) { S.sig.whyOpens++; save(); } }, true);

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.act === 'range') {
      t.classList.remove('untouched');
      S.a[t.dataset.k] = Object.assign(S.a[t.dataset.k] || {}, { value: +t.value });
      const v = document.getElementById('amt'); v.textContent = M(+t.value); v.classList.remove('empty');
      const btn = document.querySelector('[data-act="reveal"]'); if (btn) btn.disabled = !(S.a[t.dataset.k].conf);
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
        S.prefs.format = S.prefs.format || 'numbers'; S.prefs.depth = S.prefs.depth || 'quick'; S.prefs.tone = S.prefs.tone || 'full';
        render(); window.scrollTo(0, 0); break;
      case 'who': S.who = v; render(); break;
      case 'phrase': S.phrase = v; render(); break;
      case 'conf': {
        const k = b.dataset.k; S.a[k] = Object.assign(S.a[k] || {}, { conf: v }); if (v === 'none') S.sig.noIdea++;
        render(); break;
      }
      case 'decade': { const a = S.a.cardYear = S.a.cardYear || {}; a.value = +v + 5; render(); break; }
      case 'yr': { const a = S.a.cardYear; a.value = Math.max(2026, Math.min(2079, a.value + +v)); render(); break; }
      case 'opt': { const k = b.dataset.k; S.a[k] = Object.assign(S.a[k] || {}, { value: +v }); render(); break; }
      case 'reveal': { const k = QUIZ[S.qi] === 'card' ? 'cardCost' : QUIZ[S.qi] === 'year' ? 'cardYear' : QUIZ[S.qi]; markTime(); S.a[k].revealed = true; render(); break; }
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
      case 'toplan': markTime(); S.stage = 'plan'; render(); window.scrollTo(0, 0); if (S.wantsTalk) setTimeout(talkSheet, 300); break;
      case 'altfmt': { const id = b.dataset.id; const order = ['numbers', 'image', 'story']; const cur = S.cardFmt[id] || S.prefs.format || 'numbers'; S.cardFmt[id] = order[(order.indexOf(cur) + 1) % 3]; const y = window.scrollY; render(); window.scrollTo(0, y); break; }
      case 'vote': {
        const s = b.dataset.s; S.steps[s] = v; const y = window.scrollY; render(); window.scrollTo(0, y);
        if (v === 'doubt') whatIfSheet(s); if (v === 'no') noSheet(s);
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
      case 'slot': { const s = new Date(v); S.booking = { iso: v, label: fmtSlot(s), mins: +b.dataset.mins }; closeSheet(); render(); document.getElementById('hoja').scrollIntoView({ behavior: 'smooth' }); break; }
      case 'ics': downloadIcs(); break;
      case 'copy': copySummary(); break;
      case 'print': window.print(); break;
      case 'restart': try { localStorage.removeItem(KEY); } catch (er) { /* nada */ } S = fresh(); closeSheet(); render(); break;
    }
  });

  function keep() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  function downloadIcs() {
    const b = S.booking; if (!b) return;
    const s = new Date(b.iso), e = new Date(s.getTime() + b.mins * 60000);
    const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//plan-weah//es', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@plan-weah', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(s), 'DTEND:' + z(e),
      'SUMMARY:Reunión con vuestro asesor: empezar el plan', 'DESCRIPTION:' + summaryText().replace(/\n/g, '\\n'), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'reunion-plan.ics'; a.click();
  }
  function summaryText() {
    const acc = STEPS().filter(s => S.steps[s.key] === 'yes').map(s => '- ' + s.title);
    const open = S.doubts.filter(d => d.status === 'open').map(d => '- ' + d.q);
    return `Familia ${F.family}. Reunión: ${S.booking ? S.booking.label + ' (' + S.booking.mins + ' min)' : 'sin fecha'}\nLo que más importa: ${S.phrase || ''}\nPasos aceptados:\n${acc.join('\n') || '- ninguno'}\nDudas para la reunión:\n${open.join('\n') || '- ninguna'}`;
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
      if (q.get('demo') === 'plan') { S.stage = 'plan'; S.prefs = { format: q.get('f') || 'image', depth: q.get('d') || 'quick', tone: q.get('t') || 'full' }; S.phrase = S.phrase || Content.PHRASES[0]; }
      render();
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="narrow card"><h2>No hemos podido cargar vuestro plan.</h2><p>Abrid la web con un servidor local (ver README) o usad la versión de un solo archivo.</p><button class="btn" onclick="location.reload()">Reintentar</button></div>`;
    }
  }
  window.addEventListener('resize', () => document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; }));
  boot();
})();
