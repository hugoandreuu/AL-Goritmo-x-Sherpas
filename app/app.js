/*
 * app.js — pinta el estudio de un caso (app/estudios/<caso>.json).
 * Aquí no hay ni una cifra del plan escrita a mano: todo llega en el estudio, que genera
 * scripts/estudio.mjs con los datos de Sherpas (MCP o cases/) y las frases del LLM de Sherpas.
 * Sin frameworks: estado en un objeto, plantillas y eventos delegados con data-act.
 */
(function () {
  // ------------------------------------------------------------------ formato
  const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (n, d = 1) => { let s = (+n).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s.replace('.', ','); };
  const M = v => (v == null || isNaN(v)) ? 'sin dato' : Math.abs(v) >= 1e6 ? dec(v / 1e6, 2) + ' M$' : (v < 0 ? '-' : '') + miles(v) + ' $';
  const Mk = v => (v == null || isNaN(v)) ? 'sin dato' : Math.abs(v) >= 1e6 ? dec(v / 1e6, 2) + ' M$' : Math.abs(v) >= 1e4 ? Math.round(v / 1e3) + ' K$' : M(v);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const low1 = s => s.charAt(0).toLowerCase() + s.slice(1);

  // ------------------------------------------------------------------ estudio y estado
  let IDX = [], CASOS = {}, E = null, QMAP = {}, QUIZ = [], SLIDES = [];
  const w = (p, s) => (E.fam.pl ? p : s); // vosotros / tú
  const KEY = () => 'plan-v2-' + E.slug;
  const fresh = () => ({
    stage: 'home', qi: 0, who: null, phrase: null, a: {}, prefs: { level: null },
    gain: null, payDate: null, week: null, fold: {}, react: {}, slide: 0, openQ: null, later: false,
    steps: {}, doubts: [], booking: null, cat: null, help: {}, notes: {}, match: [], mode: null, pj: null,
  });
  let S = fresh();
  const save = () => { try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };
  const app = document.getElementById('app');
  const topActions = document.getElementById('top-actions');
  const PRO = () => S.prefs.level === 'pro';
  // Las animaciones se ven siempre, aunque el sistema pida reducir movimiento: son parte de la demo.
  const REDUCED = () => false;
  const paso = k => E.pasos.find(p => p.key === k);
  const pTitulo = p => (PRO() && p.tituloPro) || p.titulo;

  async function cargarIndice() {
    if (window.__ESTUDIOS__) { IDX = window.__ESTUDIOS__.index; CASOS = window.__ESTUDIOS__.casos; return; }
    IDX = await fetch('estudios/index.json').then(r => { if (!r.ok) throw new Error('index'); return r.json(); });
  }
  async function abrirCaso(slug, limpio) {
    if (!CASOS[slug]) CASOS[slug] = await fetch('estudios/' + slug + '.json').then(r => { if (!r.ok) throw new Error(slug); return r.json(); });
    E = CASOS[slug];
    E.preguntas = E.preguntas.map(aBarra);
    QMAP = Object.fromEntries(E.preguntas.map(q => [q.id, q]));
    buildQuiz([]);
    // Resumen tras el quiz: la nota, una tarjeta por cada uno de los 5 temas y el roadmap.
    SLIDES = ['foto', ...nodos().map(n => 'n:' + n.id)]; // la ruleta enseña las mismas tarjetas que el informe, en el mismo orden
    S = fresh();
    if (!limpio) { try { const raw = localStorage.getItem(KEY()); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* nada */ } }
    if (!E.fam.pl) S.who = 'a';
    buildQuiz(S.match || []);
    try { localStorage.setItem('plan-v2-caso', slug); } catch (e) { /* nada */ }
    LAST_SCORE = null;
    document.querySelector('.brand').innerHTML = `<span class="logo" aria-hidden="true"></span>Plan ${esc(E.fam.apellido)} <small>· prototipo</small>`;
    document.title = `${w('Vuestro', 'Tu')} plan en 5 minutos`;
  }

  // Nota según los pasos marcados. Solo notas que trae el plan: la de cada paso y las combinaciones que da.
  function scoreFor(keys) {
    if (!keys.length) return { v: E.nota.hoy };
    if (keys.length === 1) return { v: paso(keys[0]).nota };
    const exact = E.combos[keys.slice().sort().join('|')];
    if (exact != null) return { v: exact };
    let best = Math.max(...keys.map(k => paso(k).nota));
    for (const [ck, cv] of Object.entries(E.combos)) if (ck.split('|').every(k => keys.includes(k))) best = Math.max(best, cv);
    return { v: best, parcial: true };
  }
  const accepted = () => E.pasos.map(p => p.key).filter(k => S.steps[k] === 'yes');

  // ------------------------------------------------------------------ la ruta
  // Un solo hilo para el quiz, el resumen y el plan: de la nota de hoy a la del plan, parada a parada.
  // Las paradas son los pasos del plan. En el quiz se descubren (cada sorpresa enseña la parada que la arregla),
  // en el resumen se repasan y en el plan se deciden. Solo cifras del plan: la nota de hoy, la de cada paso y la máxima.
  const TEMA_PASOS = { tarjeta: ['card'], vida: ['life'], jubilacion: ['withdraw', 'savings'], inversion: ['conc', 'growth'], colchon: [] };
  const pasoDe = q => {
    if (!q || q.tono !== 'malo') return null;
    const ks = TEMA_PASOS[q.tema] || [];
    return E.pasos.find(p => ks.includes(p.key)) || null;
  };
  const vistos = () => (S.seen = S.seen || {});
  // Nota a la que llegaría la ruta sumando este paso a los ya elegidos (solo notas del plan). Si no la sube, se dice.
  const conPaso = p => { const now = scoreFor(accepted()).v, v = scoreFor([...new Set([...accepted(), p.key])]).v; return v > now ? `con este paso, nota ${v}` : accepted().includes(p.key) ? `nota ${v}` : 'no mueve la nota por sí solo'; };
  function descubrir(q) { // al revelar: la parada que arregla esto queda descubierta
    const p = pasoDe(q);
    if (p) vistos()[p.key] = true;
    else if (q.tema === 'nota' && q.tono === 'malo') E.pasos.forEach(x => { vistos()[x.key] = true; });
  }
  const FASE = { quiz: 'Descubrir', story: 'Repasar', plan: 'Decidir', tema: 'Repasar' };
  // La barra no sale en las preguntas ni en las revelaciones: aparece en el cierre, con la nota y los pasos ya vistos.
  // En pareja, el cierre es la pantalla 'map' (lo que propone vuestro plan).
  const pjCierre = () => S.stage === 'pareja' && !!S.pj && /^map/.test(pjSteps()[S.pj.step] || '');
  const ocultaRuta = () => S.stage === 'quiz' || (S.stage === 'pareja' && !pjCierre());
  function routeBar() {
    const P = E.pasos; if (!P.length || !E.nota) return '';
    const acc = accepted(), sc = scoreFor(acc).v, lo = E.nota.hoy, hi = Math.max(E.nota.max, lo + 1), seen = vistos();
    const hechos = P.filter(p => (S.done || {})[p.key]).map(p => p.key), hoy = hechos.length ? scoreFor(hechos).v : lo;
    const nDone = acc.length, nSeen = P.filter(p => seen[p.key] || acc.includes(p.key)).length;
    const enQuiz = ocultaRuta();
    const fases = ['quiz', 'story', 'plan'], cur = enQuiz ? 0 : pjCierre() ? 1 : fases.indexOf(S.stage === 'tema' ? (S.temaFrom === 'plan' ? 'plan' : 'story') : S.stage);
    const estado = nDone ? `${hechos.length ? `${hechos.length} ${hechos.length === 1 ? 'hecha' : 'hechas'} y ` : ''}${nDone} de ${P.length} ${P.length === 1 ? 'elegida' : 'elegidas'}${sc > hoy ? `. Hechas, la nota llegaría a ${sc}` : ''}`
      : enQuiz ? `${nSeen} de ${P.length} ${P.length === 1 ? 'parada encontrada' : 'paradas encontradas'}. Cuáles son, ${w('lo veis', 'lo ves')} con ${w('vuestro', 'tu')} asesor` : `${P.length} ${P.length === 1 ? 'parada' : 'paradas'} hasta ${E.nota.max}`;
    return `<nav class="route" data-act="rmeet" aria-label="${w('Vuestra', 'Tu')} ruta: nota de hoy ${hoy}${nDone ? `, con los pasos elegidos llegaría a ${sc}` : ''}; con todo el plan, ${E.nota.max}. ${esc(estado)}">
      <div class="rt-top"><ol class="rt-fases">${fases.map((f, i) => `<li class="${i < cur ? 'past' : i === cur ? 'cur' : ''}">${FASE[f]}</li>`).join('')}</ol>
        <span class="rt-sc"><span>Hoy</span><b id="rt-now">${hoy}</b>${nDone && sc > hoy ? `<span class="rt-goal">→ ${sc}</span>` : `<span>/ 100</span>`}</span></div>
      <div class="rt-track"><span class="rt-end lo" title="Nota de hoy">${lo}</span>
        <div class="rt-line"><i class="rt-fill" style="width:${nDone === P.length ? 100 : nDone / (P.length + 1) * 100}%"></i>
        ${P.map((p, i) => { const st = enQuiz ? (seen[p.key] ? 'found' : 'off') : acc.includes(p.key) ? 'done' : 'seen';
          return `<button class="rt-stop ${st}" id="rs-${p.key}" style="left:${(i + 1) / (P.length + 1) * 100}%;view-transition-name:vt-${p.key}" data-act="stop" data-s="${p.key}" aria-label="Parada ${i + 1}: ${st === 'off' ? 'por encontrar' : st === 'found' ? `encontrada; cuál es, ${w('lo veis', 'lo ves')} con ${w('vuestro', 'tu')} asesor` : esc(pTitulo(p)) + (st === 'done' ? ', elegida' : '')}">${st === 'done' ? ic('check', 13) : enQuiz ? '?' : i + 1}</button>`; }).join('')}</div>
        <span class="rt-end hi" title="Nota con todo el plan">${hi}</span></div>
      <p class="rt-st">${esc(estado)}</p></nav>`;
  }
  // Repinta solo la barra y el anillo, sin rehacer la pantalla (la revelación no vuelve a empezar).
  function refreshRoute() {
    const old = app.querySelector('.route'); if (!old) return;
    const t = document.createElement('div'); t.innerHTML = routeBar(); const nu = t.firstElementChild; if (!nu) return;
    old.replaceWith(nu);
    nu.classList.add('bump'); setTimeout(() => nu.classList.remove('bump'), 700);
  }
  // Tarjeta al final de cada revelación: la parada de la ruta que arregla lo que acaban de ver.
  // La reunión en cada problema: el plan se desvela en parte; la solución se trabaja con el asesor.
  function meetBox(txt) {
    return S.booking
      ? `<p class="saved">${ic('check', 15)}Lo añadimos a ${w('vuestra', 'tu')} reunión: ${esc(S.booking.short)}</p>`
      : `<div class="rr-meet"><p>${txt}</p><button class="btn block" data-act="book">${ic('cal', 18)} Reservar reunión</button><small class="rr-fine">30 minutos por videollamada · sin compromiso</small></div>`;
  }
  // Tarjeta al final de cada revelación: qué parte de la ruta toca, sin decir aún cuál es la solución.
  function rvRoute(q) {
    const p = pasoDe(q), i = p ? E.pasos.indexOf(p) : -1, ase = w('vuestro', 'tu') + ' asesor';
    let body;
    if (q.tono !== 'malo') {
      body = `<div class="rr-k good">${ic('check', 15)}Esto ya está bien</div><p class="small muted rr-sal">${esc(q.salida || `Es parte de la base de ${w('vuestra', 'tu')} ruta: no hay que tocarlo.`)}</p>`;
      return `<div class="rv-route" data-st="fade">${body}</div>`;
    }
    if (p) {
      body = `<div class="rr-k">${ic('flag', 15)}${w('Vuestro', 'Tu')} plan tiene un paso para esto</div>
        <div class="rr-stop found"><b class="rr-n">?</b><div><b>Paso ${i + 1} de ${E.pasos.length} de ${w('vuestro', 'tu')} plan</b><small>Qué hacer y cuánto sube ${w('vuestra', 'tu')} nota, ${w('lo veis', 'lo ves')} con ${ase}.</small></div></div>`
        + meetBox(`${w('Vuestro', 'Tu')} asesor ${w('os', 'te')} enseña este paso con ${w('vuestras', 'tus')} cifras y cómo darlo.`);
    } else if (q.tema === 'nota' && E.pasos.length) {
      body = `<div class="rr-k">${ic('flag', 15)}${w('Vuestro', 'Tu')} plan, entero</div>
        <p class="small" style="margin:0">De ${E.nota.hoy} a ${E.nota.max} en ${E.pasos.length} ${E.pasos.length === 1 ? 'paso' : 'pasos'}. Cuáles son, ${w('lo descubrís', 'lo descubres')} con ${ase}.</p>`
        + meetBox(`En 30 minutos ${w('os', 'te')} enseña ${E.pasos.length === 1 ? 'el paso' : `los ${E.pasos.length} pasos`} en orden.`);
    } else {
      const ya = S.doubts.some(d => d.id === 'rq-' + q.id);
      body = `<div class="rr-k">${ic('chat', 15)}Para trabajarlo con ${ase}</div>${q.salida ? `<p class="small muted rr-sal">${esc(q.salida)}</p>` : ''}`
        + meetBox(`${w('Vuestro', 'Tu')} asesor lo revisa ${w('con vosotros', 'contigo')} y ${w('os', 'te')} dice cómo mejorarlo.`)
        + (ya ? `<p class="saved">${ic('check', 15)}Apuntado como pregunta</p>` : `<button class="link block" data-act="rask" data-k="${q.id}">${ic('pen', 16)} Apuntarlo como pregunta para ${ase}</button>`);
    }
    return `<div class="rv-route" data-st="fade">${body}</div>`;
  }
  // Modo pareja: al ver cada respuesta, la parada que toca queda encontrada y se ofrece la reunión.
  // El paso del plan ya sale justo encima (pjPropLine), así que aquí no se repite.
  function pjRoute(q) {
    if (!E.pasos.length) return '';
    if (q) { const p = pasoDe(q); if (p) vistos()[p.key] = true; else if (q.id === 'nota') E.pasos.forEach(x => { vistos()[x.key] = true; }); }
    return `<div class="rv-route pj-route">
      ${meetBox('Vuestro asesor lo revisa con los dos y os enseña cómo mejorarlo.')}</div>`;
  }

  // ------------------------------------------------------------------ iconos (trazo, 24x24)
  const ICP = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    zero: '<circle cx="12" cy="12" r="8"/><path d="M8 16L16 8"/>',
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
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 16v2M17 16v2M5 11h14"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11.5V16c2 2 10 2 12 0v-4.5"/>',
    seed: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>',
  };
  const ic = (n, sz = 20) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICP[n] || ''}</svg>`;
  const optBody = (icon, text, sub) => `<span class="ic">${ic(icon)}</span><span class="tx"><b style="font-weight:600">${text}</b>${sub ? `<span class="muted small" style="display:block">${sub}</span>` : ''}</span>`;
  const OPT_ICONS = { vida: ['zero', 'clock', 'cal', 'shield'], jubilacion: ['sun', 'scale', 'x', 'help'] };

  // ------------------------------------------------------------------ quiz
  function progress() {
    const i = S.qi, n = QUIZ.length;
    return `<div class="progress thin" aria-label="Paso ${i + 1} de ${n}"><div class="bar"><i style="width:${(i / n) * 100}%"></i></div></div>`;
  }
  const dock = (label, enabled, act = 'next') => `<div class="dock"><button class="btn block" data-act="${act}" ${enabled ? '' : 'disabled'}>${label}</button></div>`;

  const fmtGuess = (q, v) => q.tipo === 'importe' ? M(v) : q.tipo === 'opciones' ? q.opciones[v] : q.tipo === 'anio' ? String(v) : dec(v, 1) + (q.sufijo || '');
  function veredicto(q, v) {
    if (q.tipo === 'opciones') {
      if (q.cerca.includes(v)) return 'cerca';
      const rg = q.rangos[v], rr = q.rangos[q.real];
      if (rg == null) return q.tono === 'malo' ? 'menos' : 'mas';
      return rg < rr ? 'mas' : 'menos';
    }
    const d = q.real - v, tol = q.tipo === 'importe' ? q.cerca * q.real : q.cerca;
    return Math.abs(d) <= tol ? 'cerca' : d > 0 ? 'mas' : 'menos';
  }
  function titular(q, v) {
    let t = q.titulares[veredicto(q, v)] || '';
    if (q.tipo !== 'opciones') {
      const d = Math.abs(q.real - v);
      const dif = q.tipo === 'importe' ? M(d) : q.tipo === 'anio' ? `${d} ${d === 1 ? 'año' : 'años'}` : dec(d, 1) + (q.sufijo || ' puntos');
      t = t.replace(/\{dif\}/g, dif);
    }
    return t.replace(/\{tu\}/g, fmtGuess(q, v)).replace(/\{dif\}/g, '').replace(/^./, c => c.toUpperCase());
  }

  // --- imágenes de cada dato. Reciben solo lo que trae el estudio.
  const VIS = {
    ring: v => ring(v.hoy, v.max, true),
    coins: v => `<div class="coins">${Array.from({ length: 10 }, (_, i) => `<i class="${i < v.n ? 'gone' : 'keep'}" style="--d:${i * 70}ms">$</i>`).join('')}</div>
      <div class="coin-leg"><span><i class="lg gone"></i>${v.n} de cada 10 $: ${v.a}</span><span><i class="lg keep"></i>${10 - v.n}: ${v.b}</span></div>`,
    grow: v => `<div class="grow">${v.filas.map((k, i) => `<div class="grow-row"><b>${esc(k.n)}</b><span class="age sm">${k.de}</span><span class="grow-line"></span><span class="age lg" style="--d:${400 + i * 200}ms">${k.a}</span></div>`).join('')}
      <div class="grow-ax"><span>Hoy</span><span>${v.hasta}</span></div></div>${v.marca ? `<div class="mark">${ic('cap', 16)}<span>${esc(v.marca)}</span></div>` : ''}`,
    cuenta: v => `<div class="cuenta"><b>${v.n}</b><span>${esc(v.txt)}</span></div>`,
    yrs: v => `<div class="yrs">${Array.from({ length: v.total }, (_, i) => `<i class="${i < v.on ? 'on' : ''}" style="--d:${i * 60}ms">${v.base != null ? v.base + i + 1 : i + 1}</i>`).join('')}</div>
      <div class="coin-leg"><span><i class="lg keep"></i>Cubierto hoy</span><span><i class="lg off"></i>Lo que recomienda el plan · ${esc(v.leg)}</span></div>`,
    meses: v => {
      const n = Math.min(18, Math.max(v.max, Math.ceil(v.tiene)));
      return `<div class="meses" style="--n:${Math.min(n, 9)}">${Array.from({ length: n }, (_, i) => `<i class="${i + 1 <= Math.floor(v.tiene) ? 'on' : i < v.tiene ? 'half' : ''} ${i + 1 >= v.min && i + 1 <= v.max ? 'rec' : ''}" style="--d:${i * 50}ms;--h:${Math.round((v.tiene - i) * 100)}%">${i + 1}</i>`).join('')}</div>
      <div class="coin-leg"><span><i class="lg keep"></i>Lo que cubre hoy</span><span><i class="lg rec"></i>Lo que recomienda el plan: ${v.min} a ${v.max} meses</span></div>
      ${v.tras != null ? `<div class="mark">${ic('clock', 16)}<span>Apartando lo ya comprometido a corto plazo: <b>${dec(v.tras, 1)} meses</b>.</span></div>` : ''}`;
    },
    tramo: v => {
      const span = v.hasta - v.de, pct = v.ok ? 100 : Math.max(6, Math.min(94, (v.corte - v.de) / span * 100));
      return `<div class="tramo ${v.ok ? 'ok' : ''}"><div class="tm-bar"><i class="tm-on" style="width:${pct}%"></i>${v.ok ? '' : `<i class="tm-off" style="left:${pct}%"></i><b class="tm-cut" style="left:${pct}%">${v.corte}</b>`}</div>
        <div class="tm-ax"><span><b>${v.de}</b>${w('Os jubiláis', 'Te jubilas')}</span><span>${v.hasta != null ? `<b>${v.hasta}</b>` : ''}Hasta donde llega el estudio</span></div></div>
        <div class="coin-leg"><span><i class="lg keep"></i>Con ahorros</span>${v.ok ? '' : '<span><i class="lg gone"></i>Sin ahorros</span>'}</div>`;
    },
    barra: v => `<div class="barras"><div class="br"><small>${esc(v.l1)}</small><div class="br-b"><i class="bad" style="width:${v.hoy}%"></i></div><b>${v.hoy} %</b></div>
      <div class="br"><small>${esc(v.l2)}</small><div class="br-b"><i style="width:${v.meta}%"></i></div><b>${v.meta} %</b></div></div>`,
  };
  const vis = q => (VIS[q.vis.t] ? VIS[q.vis.t](q.vis) : '');
  const origen = q => `<div class="origin">${ic(q.calc ? 'chart' : 'check', 14)}<span>${q.calc ? `Cuenta nuestra con cifras de ${w('vuestro', 'tu')} estudio: ${esc(q.calc)}` : `Cifra de ${w('vuestro', 'tu')} estudio`}</span></div>`;
  const proBlock = q => PRO() && q.pro ? `<div class="protech"><span class="tag navy">Para quien sabe de finanzas</span><p>${esc(q.pro)}</p><div class="src">Origen en el estudio: ${esc(q.origen)}</div></div>` : '';

  const REACT = [['wow', () => w('No lo sabíamos', 'No lo sabía'), 'eye'], ['worry', () => w('Nos preocupa', 'Me preocupa'), 'help'], ['fix', () => w('Queremos arreglarlo', 'Quiero arreglarlo'), 'check']];
  let PEND = null, JUST = false, REVEAL_T = null;

  // --- C. Revelación: caja del dato, regla de la distancia, frase letra a letra, imagen, frase que toca y salida.
  function banda(q, v) {
    if (veredicto(q, v) === 'cerca') return 'clavado';
    if (q.tipo === 'opciones') return Math.abs(v - q.real) === 1 ? 'cerca' : 'lejos';
    const tol = q.tipo === 'importe' ? q.cerca * q.real : q.cerca;
    return Math.abs(q.real - v) <= 2.5 * tol ? 'cerca' : 'lejos';
  }
  const BANDA = { clavado: () => 'Clavado', cerca: () => 'Muy cerca', lejos: () => `Lejos de lo que ${w('pensabais', 'pensabas')}` };
  function ruler(q, v) {
    if (q.tipo === 'opciones') return '';
    const lo = Math.min(q.min, v, q.real), hi = Math.max(q.max, v, q.real), P = x => (x - lo) / (hi - lo || 1) * 100;
    const g = P(v), r = P(q.real);
    return `<div class="ruler" data-st="ruler" aria-hidden="true"><div class="rl-t"><i class="rl-gap ${g > r ? 'rev' : ''}" style="left:${Math.min(g, r)}%;width:${Math.abs(g - r)}%"></i>
      <span class="rl-m you" style="left:${g}%"><small>${w('Vosotros', 'Tú')}</small></span><span class="rl-m plan" style="left:${r}%"><small>Estudio</small></span></div></div>`;
  }
  function revealView(q) {
    const a = S.a[q.id], r = S.react[q.id], bad = q.tono === 'malo', b = banda(q, a.value), tit = titular(q, a.value);
    const count = q.tipo === 'importe' ? { to: q.real, fmt: 'money' } : q.tipo === 'anio' ? { from: a.value, to: q.real, fmt: 'year' } : q.tipo === 'num' && !q.mid ? { to: q.real, fmt: 'num', suf: q.sufijo || '', d: q.real % 1 ? 1 : 0 } : null;
    return `<div class="rv2 ${bad ? 'bad' : 'good'} b-${b} ${JUST ? 'play' : ''}">
      <p class="rv-guess">${w('Vosotros decíais', 'Tú decías')} <b>${esc(fmtGuess(q, a.value))}</b></p>
      <div class="rv-box" data-st="box"><small>${w('Vuestro', 'Tu')} estudio dice</small>
        <b class="big ${q.mid ? 'mid' : ''}"${count ? ` data-count='${JSON.stringify(count)}'` : ''}>${esc(q.plan)}</b><em>${esc(q.unidad)}</em>
        ${b === 'clavado' && !bad ? `<svg class="rv-tick" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>` : ''}</div>
      ${ruler(q, a.value)}
      <div class="rv-prec" data-st="type"><small class="rv-band">${esc(BANDA[b]())}</small><h2 class="rv-type" data-text="${esc(tit)}">${esc(tit)}</h2></div>
      <div class="rv-vis" data-st="vis">${vis(q)}</div>
      ${q.siente ? `<p class="rv-feel" data-st="fade">${q.siente}</p>` : ''}
      ${rvRoute(q)}
      <div class="rv-note" data-st="fade"><div class="rv-note-q">¿Qué ${w('os pasa', 'te pasa')} por la cabeza al ver esto?</div>
        <div class="rx-row">${REACT.map(([v, l, i]) => `<button class="rx" data-act="nsugg" data-k="${q.id}" data-v="${v}" aria-pressed="${r === v}"><span class="sg-ic">${ic(i, 18)}</span><span>${l()}</span></button>`).join('')}</div>
        <p class="saved rx-ok" ${r ? '' : 'hidden'}>${ic('check', 15)}Apuntado para ${w('vuestro', 'tu')} asesor</p>
        ${(S.notes || {})[q.id] ? '' : `<button class="link addnote" data-act="addnote">${ic('pen', 16)}Añadir algo con ${w('vuestras', 'tus')} palabras</button>`}
        <div class="note-w" ${(S.notes || {})[q.id] ? '' : 'hidden'}><label for="note" class="sr">Con ${w('vuestras', 'tus')} palabras</label>
        <textarea id="note" class="free" rows="2" maxlength="200" data-k="${q.id}" placeholder="${w('Escribidlo como os salga', 'Escríbelo como te salga')}">${esc((S.notes || {})[q.id] || '')}</textarea>
        ${(S.notes || {})[q.id] ? `<p class="saved">${ic('check', 15)}Guardado en el cuaderno de ${w('vuestro', 'tu')} asesor</p>` : `<button class="btn soft savebtn" data-act="note" data-k="${q.id}" disabled>Guardar para ${w('vuestro', 'tu')} asesor</button>`}</div></div>
      <div class="rv-foot" data-st="fade">${proBlock(q)}${origen(q)}</div>
      <div class="rv-dock" data-st="dock">${dock('Seguir', true)}</div>
    </div>`;
  }

  // Carga: una gota cae en el centro y abre ondas, como en un lago.
  function suspense(q) {
    const a = S.a[q.id] || {};
    return `<div class="lake-w" role="status" aria-live="polite"><p class="rv-guess">${w('Vosotros decíais', 'Tú decías')} <b>${esc(fmtGuess(q, a.value))}</b></p>
      <div class="lake" aria-hidden="true"><i class="drop"></i><i class="rip"></i><i class="rip"></i><i class="rip"></i></div>
      <p class="lk-t">Buscando el dato en ${w('vuestro', 'tu')} plan…</p></div>`;
  }
  function playReveal(q) {
    PEND = q.id; render();
    if (window.Fondo) { Fondo.focus(true); setTimeout(() => { const l = app.querySelector('.lake'); if (l && PEND === q.id) { const r = l.getBoundingClientRect(); Fondo.ripple(r.left + r.width / 2, r.top + r.height / 2); } }, 680); }
    REVEAL_T = setTimeout(() => endSuspense(q.id), 2300);
  }
  function endSuspense(id) {
    clearTimeout(REVEAL_T);
    if (PEND !== id) return;
    PEND = null; JUST = true; render(); JUST = false; runSeq();
    if (window.Fondo) { const q = QMAP[id]; Fondo.focus(false); Fondo.mood(q && q.tono === 'malo' ? -0.9 : 0.8); Fondo.tint(q && q.tono === 'malo' ? 'mal' : 'bien'); }
  }

  // Secuencia de la revelación. Un toque fuera de los botones la lleva al final.
  let SEQ = [], SEQ_ID = 0, SEQ_USER = false;
  ['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { if (SEQ.length) SEQ_USER = true; }, { passive: true }));
  function runSeq() {
    const root = app.querySelector('.rv2.play'); if (!root) return;
    SEQ_ID++;
    const at = (ms, f) => SEQ.push(setTimeout(f, ms));
    SEQ_USER = false;
    const show = el => {
      el.classList.add('on');
      if (el.dataset.st === 'dock' || SEQ_USER) return; // si la persona ya se mueve por la pantalla, no la arrastramos
      const r = el.getBoundingClientRect(), room = window.innerHeight - 110;
      if (r.bottom > room) window.scrollBy({ top: Math.min(r.bottom - room, r.top - 70), behavior: 'smooth' });
    };
    let t = 120;
    root.querySelectorAll('[data-st]').forEach(el => {
      const k = el.dataset.st;
      if (k === 'box') { at(t, () => { show(el); countUp(el.querySelector('[data-count]'), 250); }); t += el.querySelector('[data-count]') ? 1950 : 900; }
      else if (k === 'ruler') { at(t, () => show(el)); t += 1100; }
      else if (k === 'type') {
        const p = el.querySelector('.rv-type'), txt = p.dataset.text;
        p.style.minHeight = p.offsetHeight + 'px'; p.setAttribute('aria-label', txt); p.textContent = '';
        at(t, () => { show(el); typeIn(p, txt); }); t += 250 + txt.length * 26 + 450;
      } else if (k === 'vis') { at(t, () => { show(el); animateRing(); }); t += 1200; }
      else if (k === 'dock') { at(t, () => { show(el); SEQ = []; }); }
      else { at(t, () => show(el)); t += 500; }
    });
  }
  function typeIn(p, txt) {
    let i = 0;
    const step = () => { i++; p.textContent = txt.slice(0, i); if (i < txt.length) SEQ.push(setTimeout(step, 26)); };
    SEQ.push(setTimeout(step, 250));
  }
  function finishSeq() {
    SEQ.forEach(clearTimeout); SEQ = []; SEQ_ID++;
    const root = app.querySelector('.rv2.play'); if (!root) return;
    const visEl = root.querySelector('[data-st="vis"]'), ringLeft = visEl && !visEl.classList.contains('on');
    root.querySelectorAll('[data-final]').forEach(el => { el.innerHTML = el.dataset.final; el.classList.remove('counting'); });
    root.querySelectorAll('.rv-type').forEach(p => { p.textContent = p.dataset.text; });
    root.querySelectorAll('[data-st]').forEach(el => el.classList.add('on'));
    root.classList.remove('play');
    if (ringLeft) animateRing();
  }
  function countUp(el, delay) {
    if (!el) return;
    const c = JSON.parse(el.getAttribute('data-count')), final = el.innerHTML, id = SEQ_ID;
    el.dataset.final = final;
    const from = c.from != null ? c.from : 0, dur = 1400;
    const fmt = v => c.fmt === 'money' ? M(Math.round(v)) : c.fmt === 'num' ? (c.d ? dec(v, 1) : Math.round(v)) + (c.suf || '') : String(Math.round(v));
    el.classList.add('counting'); el.textContent = fmt(from);
    const t0 = performance.now() + delay;
    const tick = now => {
      if (id !== SEQ_ID) return;
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (c.to - from) * e);
      if (k < 1) requestAnimationFrame(tick); else { el.innerHTML = final; el.classList.remove('counting'); }
    };
    requestAnimationFrame(tick);
  }

  function preparePlan() {
    const n = E.preguntas.filter(q => (S.a[q.id] || {}).revealed).length;
    const lines = [`Leyendo ${w('vuestras', 'tus')} ${n || ''} respuestas`.replace('  ', ' '), PRO() ? 'Añadiendo el detalle técnico' : 'Quitando los tecnicismos', 'Quedándonos con lo que de verdad importa', `Ordenando los pasos que propone ${w('vuestro', 'tu')} plan`];
    const go = () => { S.stage = 'camino'; render(); window.scrollTo(0, 0); };
    if (REDUCED()) { go(); return; }
    topActions.innerHTML = '';
    app.innerHTML = `<div class="prep" role="status" aria-live="polite"><h2>Preparando ${w('vuestro', 'tu')} plan</h2>
      <div class="bar"><i id="prepbar" style="width:0%"></i></div>
      <ul>${lines.map(l => `<li><span class="ck"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>${l}</li>`).join('')}</ul></div>`;
    window.scrollTo(0, 0);
    const lis = app.querySelectorAll('.prep li');
    lis.forEach((li, i) => setTimeout(() => { li.classList.add('on'); document.getElementById('prepbar').style.width = ((i + 1) / lis.length * 100) + '%'; }, 450 + i * 600));
    setTimeout(go, 450 + lis.length * 600 + 450);
  }


  // --- B. Quiz abierto: primero sus palabras, después las preguntas del plan que tocan eso.
  function buildQuiz(match) {
    const ids = E.preguntas.map(q => q.id), first = ids.filter(id => match.includes(id));
    QUIZ = [...(E.fam.pl ? ['who'] : []), 'phrase', 'level', ...first, ...ids.filter(id => !first.includes(id)), 'gain'];
  }
  const sinTilde = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function temasDe(txt) {
    const t = sinTilde(txt || ''), kids = E.fam.hijos.map(k => sinTilde(k.nombre)).join('|');
    const T = { tarjeta: /tarjet|deud|interes|credit|debemos|debo|pagar/, vida: new RegExp(`nin|hij|peque|famil|segur|falt|morir|proteg|pasar algo${kids ? '|' + kids : ''}`),
      jubilacion: /jubil|retir|vejez|pension|mayores/, colchon: /paro|trabaj|emergen|imprevist|colchon|despid|ingres|sueldo/, nota: /futur|salud|general|tranquil|bien/, inversion: /invers|fondo|bolsa|accion/ };
    return E.preguntas.filter(q => T[q.tema] && T[q.tema].test(t)).map(q => q.id);
  }
  // Frases sugeridas como tarjetas en rejilla, con un icono según el tema de la frase (solo adorno, sin cifras).
  const SUGG_IC = [[/interes|tarjet|deud/, 'card'], [/cubiert|proteg|hij|famil/, 'shield'], [/casa|hogar/, 'home'], [/coche/, 'car'], [/jubil|retir/, 'sun'], [/efectivo|colchon|imprevist|ahorr/, 'coins'], [/fondo|invers|bolsa/, 'chart'], [/camino|tranquil/, 'flag']];
  const suggIc = t => (SUGG_IC.find(([r]) => r.test(sinTilde(t))) || [0, 'heart'])[1];
  const suggTiles = (act, actual) => `<div class="sugg-grid">${E.frases.map((p, i) => `<button class="sg" style="--i:${i}" data-act="${act}" data-v="${esc(p)}" aria-pressed="${actual === p}"><span class="sg-ic">${ic(suggIc(p), 18)}</span><span class="sg-t">${esc(p)}</span></button>`).join('')}</div>`;
  // Toda apuesta con la barra: las preguntas de opciones pasan a una edad, con cifras que ya trae el estudio.
  function aBarra(q) {
    if (q.tipo !== 'opciones') return q;
    const v = q.vis || {}, k0 = E.fam.hijos[0];
    if (q.id === 'vida' && v.t === 'yrs') {
      const base = v.base, quien = w('a uno de los dos le', 'te');
      return base != null && k0
        ? Object.assign({}, q, { tipo: 'num', min: base, max: base + 20, step: 1, sufijo: ' años', real: base + v.on, cerca: 1, mid: false,
          q: `Si ${quien} pasara algo, ¿hasta qué edad de ${k0.nombre} cubriría el seguro los gastos de casa?`, sub: `${k0.nombre} tiene hoy ${base} años.`,
          plan: `${base + v.on} años`, unidad: `de ${k0.nombre}: hasta ahí llega el seguro`, calc: (q.calc ? q.calc + '; ' : '') + `edad de ${k0.nombre} hoy + años cubiertos` })
        : Object.assign({}, q, { tipo: 'num', min: 0, max: 20, step: 1, sufijo: ' años', real: v.on, cerca: 1, mid: false,
          q: `Si ${quien} pasara algo, ¿cuántos años de gastos de casa cubriría el seguro?`, plan: `${v.on} años`, unidad: 'de gastos de casa' });
    }
    if (q.id === 'jubilacion' && v.t === 'tramo' && !v.ok && v.corte) {
      return Object.assign({}, q, { tipo: 'num', min: v.de, max: Math.max(v.hasta || 95, v.corte + 5), step: 1, sufijo: ' años', real: v.corte, cerca: 2, mid: false,
        q: `Si ${w('os jubiláis', 'te jubilas')} a los ${v.de}, ¿hasta qué edad ${w('os duran', 'te duran')} los ahorros?`, sub: '',
        plan: `${v.corte} años`, unidad: `hasta ahí ${w('os', 'te')} duran los ahorros`,
        titulares: { cerca: w('Lo veíais venir. Mirad hasta dónde llega.', 'Lo veías venir. Mira hasta dónde llega.'), mas: w('Os duran algo más de lo que pensabais, pero no hasta el final.', 'Te duran algo más de lo que pensabas, pero no hasta el final.'), menos: w('Se acaban antes de lo que pensabais.', 'Se acaban antes de lo que pensabas.') } });
    }
    return q;
  }
  // «Os escuchamos»: la frase vuela al cuaderno del asesor.
  function fly(from, txt, to = 'nb') {
    const nb = document.getElementById(to); if (!from || !nb || !txt) return;
    const a = from.getBoundingClientRect(), b = nb.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'fly'; el.textContent = txt.length > 60 ? txt.slice(0, 58) + '…' : txt;
    el.style.left = a.left + 'px'; el.style.top = a.top + 'px'; el.style.width = Math.min(a.width, 320) + 'px';
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + Math.min(a.width, 320) / 2), dy = b.top + b.height / 2 - (a.top + 20);
    const an = el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .5}px, ${dy * .45}px) scale(.6)`, opacity: .9, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 }], { duration: 850, easing: 'cubic-bezier(.4,0,.2,1)' });
    an.onfinish = () => { el.remove(); const n = document.getElementById(to); if (n) { n.classList.remove('got'); void n.offsetWidth; n.classList.add('got'); } };
  }
  const nbCount = () => (S.phrase ? 1 : 0) + Object.keys(S.notes || {}).length;
  function nbSheet() {
    const items = [S.phrase ? [w('Lo que os ronda la cabeza', 'Lo que te ronda la cabeza'), S.phrase] : null, ...E.preguntas.filter(q => S.notes[q.id]).map(q => [q.creian, S.notes[q.id]])].filter(Boolean);
    sheet(`<div class="kicker">Cuaderno para ${w('vuestro', 'tu')} asesor</div><h2>Lo que ${w('habéis', 'has')} dicho, tal cual</h2>
      ${items.length ? `<ul class="nb-list">${items.map(([t, x]) => `<li><small>${esc(t)}</small><span>«${esc(x)}»</span></li>`).join('')}</ul>` : `<p class="muted">Todavía nada. Lo que ${w('escribáis', 'escribas')} se guarda aquí.</p>`}
      <p class="tiny">${w('Vuestro', 'Tu')} asesor lo leerá antes de la reunión.</p><button class="btn block" data-act="close">Cerrar</button>`);
  }

  // --- B. Cada pregunta: aparece sola en el centro, respira y sube para dejar sitio al widget.
  let INTRO = null, INTRO_T = null, ADV_T = null, BUCKET = null;
  const showV = (q, v) => q.tipo === 'importe' ? M(v) : q.tipo === 'anio' ? String(v) : dec(v, 1) + (q.sufijo || '');
  function numWidget(q, a) {
    const has = a.value != null, st = q.step || 1, mid = Math.round((q.min + q.max) / 2 / st) * st;
    return `<div class="numw"><div class="nw-val ${has ? '' : 'empty'}" id="amt">${has ? showV(q, a.value) : '?'}</div>
      <div class="nw-track"><input type="range" min="${q.min}" max="${q.max}" step="${st}" value="${a.value ?? mid}" class="${has ? '' : 'untouched'}" data-act="range" data-k="${q.id}" aria-label="${esc(q.creian)}">${has ? '' : '<i class="nw-hint" aria-hidden="true"></i>'}</div>
      <div class="spread tiny"><span>${showV(q, q.min)}</span><span>${showV(q, q.max)}</span></div>
      ${has ? '' : `<p class="tiny nw-tip">${w('Arrastrad', 'Arrastra')} la barra</p>`}</div>`;
  }
  function introQ() {
    const st = app.querySelector('.qstage.intro'), head = st && st.querySelector('.qhead'); if (!head) return;
    st.classList.add('think');
    const r = head.getBoundingClientRect(), dy = Math.max(0, window.innerHeight * 0.4 - (r.top + r.height / 2));
    head.style.transform = `translateY(${Math.round(dy)}px)`;
    INTRO_T = setTimeout(settleQ, dy > 0 ? 1300 : 800);
  }
  function settleQ() {
    clearTimeout(INTRO_T);
    const st = app.querySelector('.qstage.think'); if (!st) return;
    st.classList.remove('think'); st.querySelector('.qhead').style.transform = '';
  }
  // Barrido: lo de ahora sale por la izquierda y lo nuevo entra por la derecha.
  let SWIPING = false;
  function swipe(fn) {
    const el = app.firstElementChild;
    if (!el || SWIPING) { if (!SWIPING) fn(); return; }
    SWIPING = true; el.classList.add('sw-out');
    setTimeout(() => { SWIPING = false; fn(); const n = app.firstElementChild; if (n) n.classList.add('sw-in'); }, 320);
  }
  const nextQ = () => swipe(() => { S.qi = Math.min(S.qi + 1, QUIZ.length - 1); render(); });
  const advance = () => { clearTimeout(ADV_T); ADV_T = setTimeout(nextQ, 280); };

  // ¿Ya ha contestado esta pantalla? Entonces el fondo deja el morado y toma color.
  const quizAnswered = (step, a) => step === 'who' ? !!S.who : step === 'phrase' ? !!S.phrase : step === 'level' ? !!S.prefs.level : step === 'gain' ? !!S.gain : a.value != null;
  function renderQuiz() {
    const step = QUIZ[S.qi];
    clearTimeout(INTRO_T);
    if (PEND === step) { app.innerHTML = `<div class="narrow">${progress()}${suspense(QMAP[step])}</div>`; window.scrollTo(0, 0); return; }
    const q = QMAP[step], a = q ? (S.a[q.id] || {}) : {};
    if (q && a.revealed) { app.innerHTML = `<div class="narrow">${progress()}${revealView(q)}</div>`; if (!JUST) animateRing(); return; }
    const perm = q && q.permiso && !a.permission, key = step + (perm ? ':permiso' : '');
    const intro = INTRO !== key; INTRO = key;
    if (intro) BUCKET = null;
    let head = '', body = '', dk = '';
    if (step === 'who') {
      const ad = E.fam.adultos;
      head = `<h2 class="q">¿Quién mira el plan?</h2>`;
      body = [['juntos', 'Los dos juntos', 'heart']].concat([['a', ad[0].nombre, 'eye'], ['b', ad[1].nombre, 'eye']]).map(([v, l, i], k) => `<button class="opt" style="--i:${k}" data-act="who" data-v="${v}" aria-pressed="${S.who === v}">${optBody(i, esc(l))}</button>`).join('');
    } else if (step === 'phrase') {
      head = `<h2 class="q">¿Qué es lo que más ${w('os ronda', 'te ronda')} la cabeza con el dinero?</h2><p class="muted">Con ${w('vuestras', 'tus')} palabras. ${SR ? `O ${w('decidlo', 'dilo')} en voz alta con el micrófono.` : `También ${w('podéis', 'puedes')} dictarlo con el micrófono del teclado.`}</p>`;
      body = `${suggTiles('sugg', S.phrase)}
        <p class="tiny sugg-t">O ${w('escribidlo con vuestras', 'escríbelo con tus')} palabras:</p>
        <textarea id="worry" class="free" rows="3" maxlength="240" data-act="free-in" placeholder="${esc(E.fam.hijos.length ? `Por ejemplo: que a ${E.fam.hijos.map(k => k.nombre).join(' y ')} no les falte de nada` : 'Por ejemplo: llegar tranquilo a la jubilación')}">${esc(S.phrase || '')}</textarea>`;
      dk = `<div class="dock"><button class="btn block" data-act="worry" ${S.phrase ? '' : 'disabled'}>Seguir</button><button class="link block skipw" data-act="worry" data-v="skip">${w('Preferimos', 'Prefiero')} no escribir</button></div>`;
    } else if (step === 'level') {
      head = `<h2 class="q">¿Cómo ${w('os manejáis', 'te manejas')} con las finanzas?</h2><p class="muted">No hay respuestas buenas ni malas. Se puede cambiar después.</p>`;
      body = `<div class="seg2" role="group" aria-label="Nivel">
          <button class="segb" style="--i:0" data-act="level" data-v="new" aria-pressed="${S.prefs.level === 'new'}">${ic('seed', 22)}<b>${w('Somos nuevos', 'Soy nuevo')} en esto</b><span>Sin tecnicismos y paso a paso</span></button>
          <button class="segb" style="--i:1" data-act="level" data-v="pro" aria-pressed="${S.prefs.level === 'pro'}">${ic('chart', 22)}<b>${w('Sabemos', 'Sé')} de finanzas</b><span>Con el detalle técnico a la vista</span></button></div>`;
    } else if (step === 'gain') {
      head = `<h2 class="q">Si esto estuviera resuelto, ¿qué cambiaría en casa?</h2><p class="muted">${w('Elegid', 'Elige')} la que más se parezca.</p>`;
      body = E.ganancias.map(([i, t], k) => `<button class="opt" style="--i:${k}" data-act="gain" data-v="${esc(t)}" aria-pressed="${S.gain === t}">${optBody(i, esc(t))}</button>`).join('');
      dk = dock(`Ver ${w('vuestro', 'tu')} plan`, S.gain, 'toplan');
    } else if (perm) {
      head = `<div class="permic">${ic('shield', 30)}</div><h2 class="q">Lo siguiente no es fácil, pero tiene arreglo.</h2><p class="muted">Hablamos de proteger a ${esc(E.fam.hijos.map(k => k.nombre).join(' y '))}. ¿Lo vemos ahora?</p>`;
      body = `<button class="btn block" data-act="perm" data-v="now">Lo vemos ahora</button><button class="link block" style="width:100%" data-act="perm" data-v="later">Saltar por ahora</button>`;
    } else {
      const n = E.preguntas.indexOf(q) + 1, N = E.preguntas.length, has = a.value != null;
      const men = (S.match || []).includes(q.id) ? `<span class="porque">${ic('chat', 14)}${w('Lo habéis mencionado', 'Lo has mencionado')}</span>` : '';
      head = `<div class="qnum"><i>${n}</i> de ${N}${men}</div><h2 class="q">${esc(q.q)}</h2>${q.sub ? `<p class="muted">${esc(q.sub)}</p>` : ''}`;
      if (q.tipo === 'opciones') {
        const icons = OPT_ICONS[q.tema] || ['zero', 'clock', 'cal', 'shield'];
        body = q.opciones.map((o, i) => `<button class="opt" style="--i:${i}" data-act="opt" data-k="${q.id}" data-v="${i}" aria-pressed="${a.value === i}">${optBody(icons[i % icons.length], esc(o))}</button>`).join('');
      } else body = numWidget(q, a);
      dk = dock(q.tipo === 'anio' ? 'Ver la fecha' : q.tipo === 'opciones' ? 'Ver la respuesta' : 'Ver el dato', has, 'reveal');
    }
    if (window.Fondo) { Fondo.mood(0); Fondo.focus(false); Fondo.tint(quizAnswered(step, a) ? 'pick' : null); }
    app.innerHTML = `<div class="narrow"><div class="qstage ${intro ? 'intro' : ''}">${progress()}<div class="qhead">${head}</div><div class="qbody">${body}</div>${dk}</div></div>`;
    if (intro) { window.scrollTo(0, 0); introQ(); }
  }

  // ------------------------------------------------------------------ anillo de la nota
  let LAST_SCORE = null;
  function ring(now, max, fresh0) {
    const r = 50, c = 2 * Math.PI * r, from = fresh0 ? 0 : LAST_SCORE == null ? now : LAST_SCORE;
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

  // ------------------------------------------------------------------ recorrido guiado
  const quienTxt = p => p.quien === 'familia' ? w('Lo hacéis vosotros', 'Lo haces tú') : `Con ${w('vuestro', 'tu')} asesor`;
  const notaPaso = i => { // nota que enseña la línea para el paso i
    const keys = E.pasos.slice(0, i + 1).map(p => p.key), s = scoreFor(keys);
    return Object.keys(E.combos).length && !s.parcial ? { v: s.v, solo: false } : { v: E.pasos[i].nota, solo: true };
  };

  // ------------------------------------------------------------------ el camino: roadmap animado que se convierte en el informe
  // Tras los quizzes (o tras la intro si van directos al plan) se dibuja la línea de su vida, de hoy a la jubilación,
  // con los hitos y las paradas del estudio. La nota sube parada a parada y acaba en una frase. Después, la línea
  // se encoge hasta ser la barra de la ruta del informe (View Transitions). Solo cifras del estudio.
  const PASO_MS = 340;
  let CAM_T = [];
  const introTxt = () => [
    [`Este es ${w('vuestro', 'tu')} plan,`, `hecho con ${w('vuestras', 'tus')} cifras.`],
    [`Hoy ${w('estáis', 'estás')} en ${E.nota.hoy} de 100.`, E.nota.banda ? `Una salud financiera ${low1(E.nota.banda)}.` : ''],
    E.nota.max > E.nota.hoy ? [`Hay un camino hasta ${E.nota.max}.`, `${w('Os', 'Te')} lo enseñamos.`] : [`Veamos ${w('vuestro', 'tu')} camino,`, 'de hoy a la jubilación.'],
  ];
  function renderIntro() {
    const L = introTxt(), i = Math.min(S.introI || 0, L.length - 1);
    app.innerHTML = `<div class="narrow"><div class="segs intro-segs" aria-hidden="true">${L.map((_, k) => `<button tabindex="-1" class="${k < i ? 'past' : k === i ? 'cur' : ''}"></button>`).join('')}</div>
      <button class="bridge" data-act="introsig"><span>${esc(L[i][0])}</span>${L[i][1] ? ` <span>${esc(L[i][1])}</span>` : ''}</button><p class="tiny intro-hint">Toca para seguir</p></div>`;
    topActions.innerHTML = `<button class="pill" data-act="introskip">Saltar</button>`;
    clearTimeout(BRIDGE_T); BRIDGE_T = setTimeout(introSig, 2300);
  }
  function introSig() {
    clearTimeout(BRIDGE_T);
    const br = app.querySelector('.bridge'); if (!br || br.classList.contains('fade-out')) return;
    br.classList.add('fade-out');
    setTimeout(() => { S.introI = (S.introI || 0) + 1; if (S.introI >= introTxt().length) { S.introI = 0; S.stage = 'camino'; } render(); window.scrollTo(0, 0); }, 450);
  }
  const frasePuedes = () => E.nota.max > E.nota.hoy
    ? [`Hoy, ${E.nota.hoy}.`, `Con nosotros ${w('podéis', 'puedes')} llegar a ${E.nota.max}.`]
    : [`${w('Vais', 'Vas')} por buen camino.`, `Con nosotros, ${w('lo mantenéis', 'lo mantienes')}.`];
  function renderCamino() {
    CAM_T.forEach(clearTimeout); CAM_T = [];
    const filas = caminoFilas(), n = filas.length, total = n * PASO_MS + 400, [f1, f2] = frasePuedes();
    app.innerHTML = `<div class="narrow camino" style="--paso:${PASO_MS}ms;--total:${total}ms">
      <div class="cm-head"><div class="kicker" style="margin:0">${w('Vuestro', 'Tu')} camino</div><h2>De hoy a ${w('vuestra', 'tu')} jubilación</h2>
        <div class="cm-nota"><small id="cm-l">Hoy</small><b id="cm-n" aria-hidden="true">${E.nota.hoy}</b><span>/ 100</span><span class="sr" id="cm-sr" aria-live="polite"></span></div></div>
      <div class="cm-line" data-act="rmeet" role="button" tabindex="0" aria-label="${w('Vuestro', 'Tu')} camino. Toca para hablarlo con ${w('vuestro', 'tu')} asesor">${lineaHtml(filas)}<i class="cm-dot" aria-hidden="true"></i></div>
      <div class="cm-fin"><p class="cm-f1">${esc(f1)}</p><p class="cm-f2">${esc(f2)}</p></div>
      <div class="cm-cta"><button class="btn block" data-act="alinforme">Ver ${w('vuestro', 'tu')} informe</button><button class="link block" data-act="book">${ic('cal', 16)} Reservar reunión con ${w('vuestro', 'tu')} asesor</button></div></div>`;
    window.scrollTo(0, 0);
    const el = document.getElementById('cm-n'), lab = document.getElementById('cm-l');
    // La nota solo sube, de una cifra del estudio a otra (sin cifras intermedias): la acumulada de los pasos vistos.
    let cur = E.nota.hoy;
    const pon = (v, txt) => { if (v <= cur) return; cur = v; el.textContent = v; lab.textContent = txt; el.parentNode.classList.remove('up'); void el.offsetWidth; el.parentNode.classList.add('up'); };
    filas.forEach((x, i) => {
      if (x.c === 'step') { const k = E.pasos.findIndex(p => p.key === x.key); if (k >= 0) CAM_T.push(setTimeout(() => pon(notaPaso(k).v, `Con el paso ${k + 1}`), i * PASO_MS + 300)); }
      // La pantalla acompaña a la línea mientras se dibuja, salvo que la persona ya se esté moviendo.
      CAM_T.push(setTimeout(() => { if (CAM_USER) return; const r = app.querySelectorAll('.camino .tr')[i]; if (r && r.getBoundingClientRect().bottom > innerHeight - 30) window.scrollBy({ top: r.getBoundingClientRect().bottom - innerHeight + 90, behavior: 'smooth' }); }, i * PASO_MS + 250));
    });
    CAM_T.push(setTimeout(() => { pon(E.nota.max, 'Con todo el plan'); lab.textContent = 'Con todo el plan'; const sr = document.getElementById('cm-sr'); if (sr) sr.textContent = `Hoy ${E.nota.hoy}; con todo el plan, ${E.nota.max}.`; }, total - 200));
    CAM_T.push(setTimeout(() => { if (CAM_USER) return; const f = app.querySelector('.cm-cta'); if (f && f.getBoundingClientRect().bottom > innerHeight) f.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, total + 1600));
    CAM_USER = false;
  }
  let CAM_USER = false;
  ['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (S.stage === 'camino') CAM_USER = true; }, { passive: true }));
  // Filas del camino: de hoy a la jubilación. Lo que pasaría sin hacer nada se dice como tal.
  function caminoFilas() {
    const L = E.linea, fin = L.findIndex(x => x.c === 'end');
    return (fin >= 0 ? L.slice(0, fin + 1) : L).map(x => x.c === 'warn' ? Object.assign({}, x, { t: /^sin cambios|si no se hace/i.test(x.t) ? x.t : `Si no se hace nada: ${low1(x.t)}` }) : x);
  }
  // El roadmap se convierte en la barra de la ruta del informe.
  function alInforme() {
    CAM_T.forEach(clearTimeout); CAM_T = [];
    const go = () => { S.stage = 'plan'; render(); window.scrollTo(0, 0); };
    const cam = app.querySelector('.camino');
    if (!cam || matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    // 1) La línea se pliega: se van los hitos y quedan hoy, las paradas y la meta. 2) Cada parada vuela a su sitio en la barra.
    cam.classList.add('plegar'); window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { if (document.startViewTransition) document.startViewTransition(go); else { go(); const r = app.querySelector('.route'); if (r) r.classList.add('llega'); } }, 420);
  }
  // Popup de reunión: al tocar el roadmap, la barra de la ruta o una parada.
  function meetPop(key) {
    const p = key ? paso(key) : null, i = p ? E.pasos.indexOf(p) : -1, oculto = ocultaRuta();
    const tit = p ? (oculto ? `Parada ${i + 1} de ${w('vuestra', 'tu')} ruta` : pTitulo(p)) : `${w('Vuestro', 'Tu')} camino, de ${E.nota.hoy} a ${E.nota.max}`;
    const txt = p ? `${w('Vuestro', 'Tu')} asesor ${w('os', 'te')} explica esta parada con ${w('vuestras', 'tus')} cifras: qué hacer, cuándo y cuánto sube ${w('vuestra', 'tu')} nota.`
      : `${w('Vuestro', 'Tu')} asesor recorre el camino ${w('con vosotros', 'contigo')}, parada a parada, y ${w('os', 'te')} ayuda a dar cada paso.`;
    sheet(`<div class="kicker">${w('Os', 'Te')} acompañamos</div><h2>${esc(tit)}</h2><p class="muted">${txt}</p>
      ${S.booking ? `<p class="saved">${ic('check', 15)}Reunión pedida: ${esc(S.booking.short)}. Lo ${w('veréis', 'verás')} ahí.</p><button class="btn block" data-act="close">Seguir</button>`
        : `<button class="btn block" data-act="book">${ic('cal', 18)} Reservar reunión</button><p class="tiny" style="text-align:center;margin:.5em 0 0">30 minutos por videollamada · sin compromiso</p>`}
      ${p && !oculto && S.stage !== 'pareja' ? `<button class="link" style="width:100%" data-act="verparada" data-s="${p.key}">Ver esta parte del plan</button>` : ''}
      ${S.booking ? '' : `<button class="link" style="width:100%" data-act="close">Ahora no</button>`}`);
  }

  function lineaHtml(filas, horiz) {
    const acc = accepted();
    const rows = (filas || E.linea).map((x, i) => {
      let cls = x.c, icon = x.icon, t = x.t, s = x.s || '', pill = '';
      if (x.c === 'step') {
        const k = E.pasos.findIndex(p => p.key === x.key), p = E.pasos[k], done = S.steps[x.key] === 'yes', np = notaPaso(k);
        cls = 'step ' + (done ? 'done' : 'todo'); icon = done ? 'check' : icon; t = pTitulo(p); s = quienTxt(p);
        pill = `<span class="tr-p">${np.solo ? 'Solo este paso: ' : ''}nota <b>${np.v}</b></span>`;
      } else if (x.c === 'warn' && x.key && S.steps[x.key] === 'yes') { cls = 'ghost'; t = 'Fecha de la tarjeta si no se hiciera nada'; s = ''; }
      else if (x.c === 'now') pill = E.nota.banda ? `<span class="tr-p navy">${esc(E.nota.banda)}</span>` : '';
      return `<div class="tr ${cls}" style="--i:${i}" data-act="rmeet" role="button" tabindex="0"${x.c === 'step' ? ` data-s="${x.key}"` : ''}><span class="tr-w">${esc(x.cuando)}</span><span class="tr-d"${x.c === 'step' && filas ? ` style="view-transition-name:vt-${x.key}"` : ''}>${ic(icon, x.c === 'end' ? 22 : 17)}</span><div class="tr-c"><b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ''}${pill}</div></div>`;
    }).join('');
    return `<div class="tline ${acc.length ? 'has' : ''}${horiz ? ' horiz' : ''}"${horiz ? ' tabindex="0" aria-label="Roadmap. Desliza para ver todos los hitos"' : ''}><i class="tl-spine"></i>${rows}</div>`;
  }

  function slideHtml(id) {
    const acc = accepted(), sc = scoreFor(acc), max = E.nota.max;
    if (id === 'foto') {
      LAST_SCORE = null;
      const ord = E.areas.slice().sort((a, b) => a.nota - b.nota), peor = ord[0];
      return `<div class="kick">${w('Vuestra', 'Tu')} nota general</div><h2>${E.nota.hoy} de 100. Lo que más pesa: ${esc(low1(peor.nombre))}.</h2>
        <div class="card-btn">
        <div class="foto">${ring(E.nota.hoy, max)}<p class="muted small">${w('Vuestra', 'Tu')} nota de salud financiera${E.nota.banda ? `: <b>${esc(E.nota.banda)}</b>` : ''}. ${max > E.nota.hoy ? `Con ${w('vuestro', 'tu')} plan llega a <b>${max}</b>.` : ''}</p></div>
        <div class="areas">${E.areas.map((a, i) => `<div class="ar ${a.nota < 50 ? 'low' : a.nota < 75 ? 'mid' : 'hi'}" style="--i:${i}"><span class="ar-ic">${ic(a.icon, 18)}</span><b>${esc(a.nombre)}</b><div class="ar-b"><i style="width:${Math.max(3, a.nota)}%"></i></div><em>${a.nota}</em></div>`).join('')}</div>
        </div>
        <p class="tiny" style="margin:0">Las cinco áreas con las que ${w('vuestro', 'tu')} plan calcula la nota, de 0 a 100. En las siguientes tarjetas, una por tema.</p>`;
    }
    if (id.startsWith('n:')) {
      const ns = nodos(), k = ns.findIndex(x => x.id === id.slice(2)), n = ns[k]; if (!n) return '';
      const pasos = n.tipo === 'area' ? n.x.pasos : [];
      return `<div class="kick">De lo más urgente a lo que está bien</div>
        <div class="nodo-sl est-${n.estado}"><span class="nd-top"><span class="nd-ic">${ic(n.icon, 18)}</span><span class="nd-est">${ic(EST_IC[n.estado], 14)}${ESTADO_N[n.estado]}</span></span>
          <h2 class="nd-nom">${esc(n.nombre)}</h2>${n.sub ? `<p class="muted small" style="margin:0">${esc(n.sub)}</p>` : ''}
          <span class="nd-cifra"><b>${esc(n.cifra)}</b>${n.de ? `<small>${n.de}</small>` : ''}</span><span class="nd-lab">${esc(n.cifraLab)}</span>
          ${n.titular ? `<p class="nd-tit">${esc(n.titular)}</p>` : ''}
          ${pasos.length ? `<span class="tag acc" style="justify-self:start">${pasos.length} ${pasos.length === 1 ? 'paso' : 'pasos'} del plan</span>` : ''}</div>`;
    }
    if (id.startsWith('t:')) {
      const ts = temasPlan(), k = ts.findIndex(x => 't:' + x.a.nombre === id);
      return `<div class="kick">Tema ${k + 1} de ${ts.length}</div>${temaCard(ts[k], 0, 'story')}`;
    }
    if (id === 'ruta') {
      return `<div class="kick">${w('Vuestro', 'Tu')} roadmap</div><h2>De hoy a ${w('vuestra', 'tu')} jubilación, hito a hito.</h2>${lineaHtml()}`;
    }
    if (id.startsWith('f:')) {
      const q = QMAP[id.slice(2)], g = S.a[q.id], n = E.frenos.indexOf(q.id) + 1;
      return `<div class="kick bad">Freno ${n} · ${esc(q.freno.kick)}</div><h2>${esc(q.freno.h2)}</h2>
        <div class="sl-vis">${vis(q)}</div>
        ${g && g.revealed ? `<div class="memo">${ic('eye', 16)}<span>${w('Vosotros pensabais', 'Tú pensabas')} <b>${esc(low1(fmtGuess(q, g.value)))}</b>. ${w('Vuestro', 'Tu')} estudio dice <b>${esc(q.plan)}</b>.</span></div>` : q.siente ? `<div class="memo">${ic('eye', 16)}<span>${q.siente}</span></div>` : ''}
        <div class="memo good">${ic('check', 16)}<span>${esc(q.salida)}</span></div>${proBlock(q)}`;
    }
    if (id === 'pasos') {
      const n = E.pasos.length, llave = E.pasos.find(p => p.abre && p.nota > E.nota.hoy && !acc.includes(p.key));
      const hint = !acc.length ? `${w('Tocad', 'Toca')} un paso y ${w('mirad', 'mira')} la nota.`
        : sc.v === E.nota.hoy ? `Sigue en ${sc.v}.${llave ? ` Según el plan, primero va «${low1(pTitulo(llave))}».` : ''}`
          : acc.length === n ? `${sc.v}.${sc.parcial ? ` ${w('Vuestro', 'Tu')} plan da la nota de cada paso por separado.` : ` Este es ${w('vuestro', 'tu')} plan completo.`}`
            : `${sc.v}.${sc.parcial ? ` ${w('Vuestro', 'Tu')} plan da la nota de cada paso por separado.` : ` ${w('Probad', 'Prueba')} a sumar otro.`}`;
      return `<div class="kick">La salida · ${n} ${n === 1 ? 'paso' : 'pasos'}</div><h2>${w('Marcad', 'Marca')} lo que ${w('os', 'te')} convence y ${w('mirad vuestra', 'mira tu')} nota.</h2>
        <div class="foto tight">${ring(sc.v, max)}<p class="hint ${acc.length && sc.v === E.nota.hoy ? 'warn' : ''}">${esc(hint)}</p></div>
        <div class="togs">${E.pasos.map((p, i) => `<button class="tog" data-act="tog" data-s="${p.key}" aria-pressed="${S.steps[p.key] === 'yes'}"><span class="tg-n">${i + 1}</span><span class="tg-t"><b>${esc(pTitulo(p))}</b><small>${quienTxt(p)} · solo, nota ${p.nota}</small></span><span class="tg-sw"><i></i></span></button>`).join('')}</div>
        <button class="link small" data-act="whatif">${w('Tenemos', 'Tengo')} dudas sobre algún paso</button>`;
    }
    if (id === 'camino') {
      return `<div class="kick">La imagen completa</div><h2>De hoy a ${w('vuestra', 'tu')} jubilación, en una línea.</h2>${lineaHtml()}`;
    }
    if (id === 'primer') {
      const p = E.primer, pct = Math.round(p.despues / p.hoy * 100);
      return `<div class="kick">${w('Vuestro', 'Tu')} primer paso</div><h2>${esc(p.h2)}</h2>
        <div class="bal"><div class="bal-r"><small>Hoy</small><div class="bal-b"><i style="width:100%"></i></div><b>${p.hoyTxt}</b></div>
          <div class="bal-r"><small>Después</small><div class="bal-b"><i class="ok" style="width:${pct}%"></i></div><b>${p.despuesTxt}</b></div></div>
        <div class="chips2"><span class="pillbig">${ic('chart', 16)}Nota ${E.nota.hoy} <span class="ar">→</span> <b>${p.nota}</b></span><span class="pillbig">${ic('check', 16)}Sin asesor, con ${w('vuestro', 'tu')} efectivo</span></div>
        ${p.urgencia ? `<div class="memo warn">${ic('clock', 16)}<span>${p.urgencia}</span></div>` : ''}
        ${S.payDate ? `<div class="datechip"><span class="dc-ic">${ic('cal', 22)}</span><div><small>Lo ${w('hacéis', 'haces')} el</small><b>${esc(S.payDate.label)}</b></div><button class="link small" data-act="cal" data-k="pay">Cambiar</button></div>`
          : `<button class="btn block big-cta" data-act="cal" data-k="pay">${ic('cal')} Elegir día y hora</button>`}`;
    }
    const ns = nextStep();
    if (S.openQ == null) S.openQ = E.abiertas.map(q => q.id);
    const p0 = E.pasos[0];
    return `<div class="kick">${E.primer ? 'Lo que queda' : `${w('Vuestro', 'Tu')} primer paso`}, con ${w('vuestro', 'tu')} asesor</div><h2>Lo demás se decide hablando.</h2>
      ${S.gain ? `<p class="quote" style="margin:0">Con esto resuelto: <b>«${esc(S.gain)}»</b></p>` : ''}
      ${!E.primer && p0 ? `<div class="memo">${ic('flag', 16)}<span>El primer paso de ${w('vuestro', 'tu')} plan es <b>${esc(low1(pTitulo(p0)))}</b>, y se hace con ${w('vuestro', 'tu')} asesor.</span></div>` : ''}
      <p class="muted" style="margin:0 0 2px">Esto la app no lo decide por ${w('vosotros', 'ti')}. ${w('Tocad', 'Toca')} para quitar lo que no ${w('os', 'te')} importe:</p>
      <div class="oqs">${E.abiertas.map(q => `<button class="oq" data-act="oq" data-id="${q.id}" aria-pressed="${S.openQ.includes(q.id)}"><i>${ic('help', 18)}</i><span>${esc(q.q)}</span></button>`).join('')}</div>
      <button class="askbox" data-act="whatif">${ic('pen', 18)}<span>Escribir otra pregunta para ${w('vuestro', 'tu')} asesor</span></button>
      ${S.booking ? bookedCard() : `<ul class="ticks" style="margin-top:6px"><li>${ic('check', 16)}${w('Salís', 'Sales')} con el orden de ${w('vuestros', 'tus')} pasos y respuesta a esto</li><li>${ic('check', 16)}${ns.mins} minutos, por videollamada</li><li>${ic('check', 16)}Sin preparar nada: ya tiene lo que ${w('habéis', 'has')} contestado</li></ul>
      <button class="btn block big-cta" data-act="book">${ic('cal')} Elegir día con ${w('vuestro', 'tu')} asesor</button>
      <button class="link" style="width:100%" data-act="later">${window.__PREVIEW__ ? (S.later ? 'Sin prisa: el plan sigue aquí' : 'Ahora no') : S.later ? 'Recordatorios a los 3 y 30 días, en el calendario' : `Ahora no. ${w('Recordádnoslo', 'Recuérdamelo')} en 3 y en 30 días`}</button>`}`;
  }

  let STORY_DIR = '';
  // ------------------------------------------------------------------ resumen: la ruleta de tarjetas
  // Las tarjetas del resumen (nota general, los temas y el roadmap) van en una rueda 3D. La del centro
  // se lee; las demás quedan detrás, desenfocadas. Se gira deslizando o con las flechas, y al girar
  // todas cambian de sitio a la vez. «Abrir página» agranda la tarjeta del centro con todo su detalle.
  const RUL = { rot: null, drag: null, ovY: 0 };
  const rulN = () => SLIDES.length;
  const rulMod = x => ((Math.round(x) % rulN()) + rulN()) % rulN();
  const rulName = id => id === 'foto' ? 'Nota general' : id === 'ruta' ? 'Roadmap' : id.startsWith('n:') ? ((nodo(id.slice(2)) || {}).nombre || id.slice(2)) : id.startsWith('t:') ? id.slice(2) : id;
  const rulKey = id => id === 'foto' ? '__nota' : id === 'ruta' ? '__ruta' : id.startsWith('n:') || id.startsWith('t:') ? id.slice(2) : null;
  function renderStory() {
    if (RUL.rot == null || rulMod(RUL.rot) !== S.slide) RUL.rot = Math.max(0, Math.min(S.slide || 0, rulN() - 1));
    const i = rulMod(RUL.rot), id = SLIDES[i], n = rulN(), prev = SLIDES[(i + n - 1) % n], next = SLIDES[(i + 1) % n];
    const back = ic('arrow', 18).replace('<svg', '<svg style="transform:rotate(180deg)"');
    const open = S.rulOpen != null ? SLIDES.find(x => rulKey(x) === S.rulOpen) : null;
    app.innerHTML = `<div class="rul-wrap"><div class="narrow">${routeBar()}<div class="segs" aria-label="Tarjeta ${i + 1} de ${n}">${SLIDES.map((x, k) => `<button data-act="goslide" data-v="${k}" class="${k === i ? 'cur' : ''}" aria-label="Ir a ${esc(rulName(x))}"></button>`).join('')}</div></div>
      <div class="rul-stage" data-rul aria-roledescription="carrusel" aria-label="Resumen de ${w('vuestro', 'tu')} plan"><div class="rul-ring">${SLIDES.map((x, k) => `<section class="rul-card" data-i="${k}" aria-label="${esc(rulName(x))}" ${k === i ? '' : 'aria-hidden="true"'}><div class="rul-in slide">${slideHtml(x)}
        ${rulKey(x) ? `<button class="rul-abrir" data-act="rulopen" data-v="${esc(rulKey(x))}">${ic('plus', 16)}<span>Abrir en el plan</span></button>` : ''}</div></section>`).join('')}</div></div>
      <div class="narrow rul-nav"><button class="rul-arr" data-act="rulgo" data-v="-1" aria-label="Anterior: ${esc(rulName(prev))}">${back}<span>${esc(rulName(prev))}</span></button><span class="rul-pos">${i + 1} / ${n}</span><button class="rul-arr nx" data-act="rulgo" data-v="1" aria-label="Siguiente: ${esc(rulName(next))}"><span>${esc(rulName(next))}</span>${ic('arrow', 18)}</button></div></div>
      ${open ? `<div class="rul-full open" role="dialog" aria-modal="true" aria-label="${esc(rulName(open))}"><div class="rul-full-in"><div class="rul-full-bar"><button class="link tp-back" data-act="rulclose">${back} Volver a la ruleta</button></div><div class="narrow tpage">${temaBody(S.rulOpen)}<p class="foot">Cifras del informe de ${w('vuestro', 'tu')} estudio.</p></div></div></div>` : ''}
      <div class="cta-bar"><div class="cta-in">${open ? `<button class="btn ghost grow" data-act="rulclose">Volver a la ruleta</button>` : ''}<button class="btn grow" data-act="fullplan">Ver el plan completo</button></div></div>`;
    rulLayout(false);
    document.body.classList.toggle('rul-lock', !!open);
    if (open) { const f = app.querySelector('.rul-full'); f.scrollTop = RUL.ovY; f.addEventListener('scroll', () => { RUL.ovY = f.scrollTop; }, { passive: true }); if (S.rulOpen === '__nota') animateRing(); }
    else animateRing();
    requestAnimationFrame(() => rulLayout(false));
  }
  // Coloca la rueda: cada tarjeta en su ángulo; la rueda gira con RUL.rot (sin límite, para que nunca dé la vuelta entera al pasar de la última a la primera).
  function rulLayout(anim) {
    const st = app.querySelector('[data-rul]'); if (!st) return;
    const ring = st.querySelector('.rul-ring'), cards = [...ring.children], n = cards.length, a = 360 / n;
    // En pantallas estrechas la rueda se cierra un poco para que asomen las tarjetas de los lados.
    const sw = st.clientWidth, W = Math.min(sw < 700 ? sw * 0.76 : sw - 32, 460), R = Math.round(W / 2 / Math.tan(Math.PI / n) + 24);
    st.style.setProperty('--w', W + 'px');
    ring.classList.toggle('anim', !!anim);
    ring.style.transform = `translateZ(${-R}px) rotateY(${-RUL.rot * a}deg)`;
    const cur = rulMod(RUL.rot);
    cards.forEach((c, k) => {
      let d = Math.abs(k - RUL.rot) % n; d = Math.min(d, n - d);
      c.style.transform = `rotateY(${k * a}deg) translateZ(${R}px)`;
      c.style.setProperty('--d', d.toFixed(3));
      c.classList.toggle('front', k === cur && d < .5);
    });
    if (!anim) { // todas las tarjetas con la misma altura, la de la más alta
      cards.forEach(c => { c.firstElementChild.style.minHeight = ''; });
      const hMax = Math.max(...cards.map(c => c.firstElementChild.offsetHeight));
      cards.forEach(c => { c.firstElementChild.style.minHeight = hMax + 'px'; });
    }
    const f = cards[cur]; if (f) st.style.height = f.offsetHeight + 'px';
  }
  // Barra de arriba, flechas y posición, sin volver a pintar las tarjetas (así el giro no se corta).
  function rulUi() {
    const n = rulN(), i = rulMod(RUL.rot), prev = SLIDES[(i + n - 1) % n], next = SLIDES[(i + 1) % n];
    app.querySelectorAll('.segs button').forEach((b, k) => b.classList.toggle('cur', k === i));
    const pos = app.querySelector('.rul-pos'); if (pos) pos.textContent = `${i + 1} / ${n}`;
    const [pa, na] = app.querySelectorAll('.rul-arr');
    if (pa) { pa.querySelector('span').textContent = rulName(prev); pa.setAttribute('aria-label', `Anterior: ${rulName(prev)}`); }
    if (na) { na.querySelector('span').textContent = rulName(next); na.setAttribute('aria-label', `Siguiente: ${rulName(next)}`); }
    app.querySelectorAll('.rul-card').forEach((c, k) => { if (k === i) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true'); });
  }
  function rulTo(target, dir) {
    const n = rulN(), cur = Math.round(RUL.rot);
    let k = target;
    if (dir == null) { let d = ((target - rulMod(cur)) % n + n) % n; if (d > n / 2) d -= n; k = cur + d; }
    RUL.rot = k; S.slide = rulMod(k); save();
    const st = app.querySelector('[data-rul]');
    if (st) { st.classList.remove('spin'); void st.offsetWidth; st.classList.add('spin'); }
    rulLayout(true);
    rulUi();
  }
  // Abrir página: la tarjeta del centro crece hasta ocupar la pantalla (y vuelve a su sitio al cerrar).
  function rulOpen(k) {
    const card = app.querySelector('.rul-card.front'), r = card ? card.getBoundingClientRect() : null;
    S.rulOpen = k; RUL.ovY = 0; render();
    const f = app.querySelector('.rul-full'); if (!f || !r || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    f.classList.remove('open'); f.style.clipPath = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 24px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { f.classList.add('open'); f.style.clipPath = 'inset(0 0 0 0 round 0)'; }));
  }
  function rulClose() {
    const f = app.querySelector('.rul-full'), done = () => { S.rulOpen = null; render(); };
    if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
    const card = app.querySelector('.rul-card.front'), r = card.getBoundingClientRect();
    f.classList.add('closing'); f.style.clipPath = `inset(${Math.max(0, r.top)}px ${innerWidth - r.right}px ${Math.max(0, innerHeight - r.bottom)}px ${r.left}px round 24px)`;
    setTimeout(done, 420);
  }
  // Deslizar con el dedo o el ratón: la rueda sigue al dedo y, al soltar, se queda en la tarjeta más cercana (con inercia).
  function rulDown(e) {
    const st = e.target.closest && e.target.closest('[data-rul]'); if (!st || S.rulOpen != null || e.button > 0) return;
    RUL.drag = { x: e.clientX, y: e.clientY, r0: RUL.rot, t: performance.now(), v: 0, lx: e.clientX, lt: performance.now(), moved: false, id: e.pointerId, st };
  }
  function rulMove(e) {
    const d = RUL.drag; if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.moved) { if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y)) { if (Math.abs(e.clientY - d.y) > 10) RUL.drag = null; return; } d.moved = true; d.st.setPointerCapture(d.id); d.st.classList.add('dragging'); }
    const W = parseFloat(d.st.style.getPropertyValue('--w')) || 340, now = performance.now();
    RUL.rot = d.r0 - dx / (W * 0.9);
    d.v = (e.clientX - d.lx) / Math.max(1, now - d.lt); d.lx = e.clientX; d.lt = now;
    rulLayout(false);
  }
  function rulUp(e) {
    const d = RUL.drag; if (!d || e.pointerId !== d.id) return; RUL.drag = null;
    if (!d.moved) { // un toque en una tarjeta lateral la trae al centro
      const c = e.target.closest && e.target.closest('.rul-card'); if (c && !c.classList.contains('front')) rulTo(+c.dataset.i);
      return;
    }
    d.st.classList.remove('dragging');
    const W = parseFloat(d.st.style.getPropertyValue('--w')) || 340;
    RUL.rot = Math.round(RUL.rot - d.v * 260 / (W * 0.9)); RUL.justDragged = true; setTimeout(() => { RUL.justDragged = false; }, 50);
    rulTo(RUL.rot, 0);
  }


  // ------------------------------------------------------------------ plan completo
  function counts() {
    const open = S.doubts.filter(d => d.status === 'open').length, resolved = S.doubts.filter(d => d.status === 'resolved').length;
    const v = E.pasos.map(p => S.steps[p.key]);
    return { open, resolved, yes: v.filter(x => x === 'yes').length, no: v.filter(x => x === 'no').length, pending: v.filter(x => x == null).length, n: E.pasos.length };
  }
  function nextStep() {
    if (S.stage === 'pareja' && pjDone()) return { title: 'Reunión para empezar vuestro plan', mins: 30, days: 5, text: `Con vuestro asesor: ${pjConLista()}. Ya tiene lo que habéis contestado; no hace falta preparar nada.` };
    const c = counts();
    if (c.yes === c.n && c.open === 0) return { title: w('Listos para empezar', 'Todo listo para empezar'), mins: 20, days: 2, text: `${w('Habéis', 'Has')} aceptado todos los pasos y no queda ninguna duda. Una reunión corta para arrancar.` };
    if (c.pending === c.n && c.open === 0) return { title: `Primero, ${w('decidid', 'decide')} los pasos`, mins: 30, days: 5, text: `${w('Contestad', 'Contesta')} «¿${w('Os', 'Te')} convence?» en cada paso. Cuantas más dudas queden resueltas aquí, más corta será la reunión.` };
    if (c.no === 0 && c.open <= 2) return { title: w('Casi listos', 'Casi todo listo'), mins: 30, days: 5, text: c.open ? `${c.open === 1 ? 'Queda 1 duda' : 'Quedan 2 dudas'} que el plan no responde. ${w('Vuestro', 'Tu')} asesor llega con ${c.open === 1 ? 'ella preparada' : 'ellas preparadas'}.` : `Falta decidir algún paso. En media hora queda cerrado con ${w('vuestro', 'tu')} asesor.` };
    return { title: 'Mejor hablarlo con calma', mins: 45, days: 10, text: `Hay pasos que no ${w('os', 'te')} convencen o varias dudas abiertas. Una reunión más larga, sin compromiso, para revisar el plan.` };
  }
  const doubtLine = d => `<div class="doubt ${d.status === 'resolved' ? 'resolved' : 'advisor'}"><div class="spread"><b class="small">${esc(d.q)}</b>${d.status === 'resolved' ? '<span class="tag good">Resuelta</span>' : '<span class="tag acc">Para la reunión</span>'}</div></div>`;

  function believed() {
    return E.preguntas.filter(q => (S.a[q.id] || {}).revealed).map(q => [q.creian, fmtGuess(q, S.a[q.id].value), `${q.plan} ${q.unidad}`]);
  }
  const tbl = rows => `<table class="nums"><tr><td class="tiny">Tema</td><td class="tiny" style="text-align:left">${w('Creíais', 'Creías')}</td><td class="tiny">El plan</td></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td style="text-align:left;font-weight:400">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>`;
  function fold(id, n, title, sub, body, openDefault) {
    const open = S.fold[id] != null ? S.fold[id] : openDefault;
    return `<details class="fold" id="s-${id}" data-fold="${id}" ${open ? 'open' : ''}><summary><b class="n">${n}</b><span class="ft"><strong>${title}</strong><small>${sub}</small></span><i class="chev">${ic('arrow', 18)}</i></summary><div class="foldbody">${body}</div></details>`;
  }
  function bookedCard() {
    const b = S.booking, d = fromIso(b.iso.slice(0, 10), b.time);
    return `<div class="booked"><div class="tile"><small>${d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b><span>${d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span></div>
      <div><span class="tag good">Reunión pedida</span><h3 style="margin:6px 0 2px">${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · ${b.mins} minutos</h3>
      <p class="small muted" style="margin:0">Por videollamada. ${w('Vuestro', 'Tu')} asesor llega con ${w('vuestras', 'tus')} respuestas y dudas leídas.</p></div></div>
      <div class="row" style="margin-top:12px">${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="ics" data-k="meet">Añadir al calendario</button>'}<button class="link" data-act="book">Cambiar el día</button></div>`;
  }
  function weekCard() {
    const wk = S.week; if (!wk || !E.primer) return '';
    return wk.done
      ? `<div class="card win"><span class="tag good">Una semana después</span><h3 style="margin-top:8px">De ${E.nota.hoy} a ${E.primer.nota}, sin ayuda de nadie.</h3><p style="margin:0">Los pasos que quedan se ven con ${w('vuestro', 'tu')} asesor.</p></div>`
      : `<div class="card"><span class="tag warn">Una semana después</span><h3 style="margin-top:8px">Justo para esto está ${w('vuestro', 'tu')} asesor.</h3><p style="margin:0">«${esc(wk.reason)}». Queda apuntado para la reunión.</p></div>`;
  }
  const fuente = () => {
    const g = E.generado || {};
    return `Datos del plan: ${g.datos === 'mcp' ? 'MCP de Sherpas' : 'archivos del caso (los mismos que sirve el MCP de Sherpas)'}. Frases: ${String(g.textos || '').startsWith('llm') ? `escritas por el LLM de Sherpas (${esc(g.textos.slice(4))}) y comprobadas contra el plan` : 'plantilla, pendientes de pasar por el LLM de Sherpas'}.`;
  };


  // ------------------------------------------------------------------ el plan en 5 temas
  // El plan es la estructura: las cinco áreas con las que calcula la nota. Cada pregunta del quiz
  // era una situación dentro de uno de estos temas, y cada paso del plan cae en uno de ellos.
  // Las cifras de cada tema (resumen, detalle y gráfico) vienen del estudio, leídas del informe.
  const TEMAS = {
    'Ahorro': { sub: () => `Lo que ${w('ganáis, gastáis y guardáis', 'ganas, gastas y guardas')}`, temas: ['jubilacion'], pasos: ['savings', 'withdraw'] },
    'Deudas': { sub: () => 'La tarjeta, la hipoteca y los préstamos', temas: ['tarjeta'], pasos: ['card'] },
    'Inversiones': { sub: () => `Dónde está ${w('vuestro', 'tu')} patrimonio y cómo rinde`, temas: ['inversion'], pasos: ['growth', 'conc'] },
    'Colchón': { sub: () => 'El efectivo para imprevistos', temas: ['colchon'], pasos: [] },
    'Seguros': { sub: () => `Proteger a ${w('vuestra', 'tu')} familia y ${w('vuestra', 'tu')} casa`, temas: ['vida'], pasos: ['life', 'umbrella', 'cover'] }
  };
  const nivel = n => n < 50 ? 'low' : n < 75 ? 'mid' : 'hi';
  const ESTADO = { low: 'A reforzar', mid: 'Mejorable', hi: 'Bien' };
  function temasPlan() {
    const usados = new Set();
    const lista = E.areas.map(a => {
      const t = TEMAS[a.nombre] || { sub: () => '', temas: [], pasos: [] };
      const pasos = E.pasos.filter(p => t.pasos.includes(p.key));
      pasos.forEach(p => usados.add(p.key));
      const qs = E.preguntas.filter(q => t.temas.includes(q.tema));
      return { a, t, pasos, qs };
    });
    // Pasos que el código aún no sabe colocar: al tema con peor nota, para que no se pierdan.
    const sueltos = E.pasos.filter(p => !usados.has(p.key));
    if (sueltos.length && lista.length) lista.slice().sort((x, y) => x.a.nota - y.a.nota)[0].pasos.push(...sueltos);
    // Orden: primero los temas donde el plan pide algo, en el orden de sus pasos; luego el resto, de peor a mejor nota.
    const primero = x => x.pasos.length ? Math.min(...x.pasos.map(p => E.pasos.indexOf(p))) : 99;
    return lista.sort((x, y) => primero(x) - primero(y) || x.a.nota - y.a.nota);
  }
  const temaDe = nombre => temasPlan().find(x => x.a.nombre === nombre);
  // Lo que pensaban frente a lo que dice el plan, en las preguntas de ese tema que contestaron.
  const dijeron = x => x.qs.filter(q => (S.a[q.id] || {}).revealed).map(q => `<div class="memo">${ic('eye', 16)}<span>${w('Pensabais', 'Pensabas')} <b>${esc(low1(fmtGuess(q, S.a[q.id].value)))}</b>. El estudio dice <b>${esc(q.plan)}</b> ${esc(q.unidad)}.</span></div>`).join('');
  const filasTema = (rows, pro) => rows && rows.length ? `<ul class="tm-res">${rows.map(r => `<li><span class="tm-l">${esc(r[0])}</span><span>${esc(r[1])}${pro && PRO() && r[2] ? `<small class="tm-o">${esc(r[2])}</small>` : ''}</span></li>`).join('')}</ul>` : '';
  const cabTema = (a, t, tag = 'h3') => `<header class="tm-h"><span class="ar-ic">${ic(a.icon, 18)}</span><div class="tm-ht"><${tag}>${esc(a.nombre)}</${tag}><small>${esc(t.sub())}</small></div>
      <div class="tm-s"><em>${a.nota}<small>/100</small></em><span class="tm-e">${ESTADO[nivel(a.nota)]}</span></div></header>
      <div class="ar-b"><i style="width:${Math.max(3, a.nota)}%"></i></div>`;

  function pasoTema(p) {
    const i = E.pasos.indexOf(p), v = S.steps[p.key], mine = S.doubts.filter(d => d.paso === p.key);
    let after = '';
    if (E.primer && E.primer.key === p.key && v === 'yes') {
      after = S.payDate
        ? `<div class="datechip"><span class="dc-ic">${ic('cal', 22)}</span><div><small>Lo ${w('hacéis', 'haces')} el</small><b>${esc(S.payDate.label)}</b></div><button class="link small" data-act="cal" data-k="pay">Cambiar</button></div>
           <details class="why"><summary>Cómo se hace, en tres pasos</summary><ol class="how">${E.primer.como.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="ics" data-k="pay">Añadir al calendario</button>'}</details>`
        : `<button class="btn block" style="margin-top:12px" data-act="cal" data-k="pay">${ic('cal')} Elegir día y hora</button>`;
    } else if (v === 'yes' && p.quien === 'asesor') after = `<p class="tiny" style="margin:8px 0 0">${ic('chat', 13)} ${w('Vuestro', 'Tu')} asesor lo trae preparado a la reunión.</p>`;
    return `<div class="tm-paso ${v === 'yes' ? 'done' : ''}" id="step-${p.key}">
      <div class="spread" style="align-items:flex-start"><span class="tiny"><b class="tm-n">${v === 'yes' ? ic('check', 13) : i + 1}</b>Paso ${i + 1} del plan · ${quienTxt(p)}</span><span class="tag acc" title="Nota si solo se hace este paso">Nota ${p.nota}</span></div>
      <b class="tm-pt">${esc(pTitulo(p))}</b>${p.porque ? `<p class="small" style="margin:.2em 0 0">${esc(p.porque)}</p>` : ''}
      <div class="vote sm"><span class="small">¿${w('Os', 'Te')} convence?</span>${[['yes', 'Sí'], ['doubt', 'Dudas'], ['no', 'No']].map(([k, l]) => `<button class="chip" data-act="vote" data-s="${p.key}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>
      ${after}${mine.length ? `<div style="margin-top:8px">${mine.map(doubtLine).join('')}</div>` : ''}</div>`;
  }
  const sinPaso = (x) => {
    const salida = x.qs.find(q => q.salida);
    return `<p class="small muted" style="margin:0">${salida ? esc(salida.salida) : nivel(x.a.nota) === 'hi' ? 'Está bien así: el plan no pide cambios en este tema.' : `El plan no propone un paso aquí por ahora. Si ${w('os', 'te')} preocupa, ${w('preguntadlo', 'pregúntalo')} en la reunión.`}</p>`;
  };
  // Tarjeta de tema. En el plan completo lleva los pasos con su voto; en el resumen tras el quiz, solo los títulos.
  function temaCard(x, i, modo) {
    const { a, t, pasos } = x, story = modo === 'story';
    const plan = pasos.length
      ? (story ? `<ul class="tm-pl">${pasos.map(p => { const y = S.steps[p.key] === 'yes', v = (S.seen || {})[p.key]; return `<li class="${y ? 'done' : v ? 'seen' : ''}"><b class="tm-n">${y ? ic('check', 12) : E.pasos.indexOf(p) + 1}</b><span>${esc(pTitulo(p))}${y ? `<small>En ${w('vuestra', 'tu')} ruta</small>` : v ? `<small>Lo ${w('descubristeis', 'descubriste')} en el quiz</small>` : ''}</span></li>`; }).join('')}</ul>` : pasos.map(pasoTema).join(''))
      : sinPaso(x);
    const men = x.qs.some(q => (S.match || []).includes(q.id)) ? `<span class="porque tm-men">${ic('chat', 14)}${w('Lo habéis mencionado', 'Lo has mencionado')}</span>` : '';
    return `<article class="tema ${nivel(a.nota)}" ${story ? '' : `id="tema-${esc(a.nombre)}"`} style="--i:${i}">${men}
      <div class="tm-open">${cabTema(a, t)}${filasTema(a.resumen)}</div>
      <div class="tm-plan"><div class="kicker" style="margin:0 0 6px">${pasos.length ? `Lo que propone ${w('vuestro', 'tu')} plan` : `${w('Vuestro', 'Tu')} plan`}</div>${plan}</div>
    </article>`;
  }

  // --- nodos del informe: las cinco áreas de la nota y los puntos del informe que no puntúan.
  // Cada uno tiene su cifra en grande, su estado (color + icono + texto) y su página con capas.
  const RANGO = { low: 0, mid: 1, hi: 2, neutro: 3 };
  const ESTADO_N = { low: 'A reforzar', mid: 'Mejorable', hi: 'Bien', neutro: 'Para saber' };
  const EST_IC = { low: 'flag', mid: 'eye', hi: 'check', neutro: 'list' };
  const sinTags = h => String(h || '').replace(/<[^>]+>/g, '');
  function nodos() {
    const ts = temasPlan();
    const areas = ts.map(x => ({ id: x.a.nombre, tipo: 'area', x, nombre: x.a.nombre, icon: x.a.icon, sub: x.t.sub(), estado: nivel(x.a.nota), cifra: String(x.a.nota), de: '/100', cifraLab: 'nota del área',
      titular: sinTags((x.a.lectura || [])[0] || (x.a.resumen || []).map(r => `${r[0]}: ${r[1]}`)[0] || ''), pasos: x.pasos.length, nota: x.a.nota }));
    const pts = (E.puntos || []).map(p => ({ ...p, tipo: 'punto', pasos: 0, nota: 50 }));
    return areas.concat(pts).sort((a, b) => RANGO[a.estado] - RANGO[b.estado] || a.nota - b.nota);
  }
  const nodo = id => nodos().find(n => n.id === id);
  function nodoCard(n, i) {
    return `<button class="nodo est-${n.estado}" data-act="tema" data-k="${esc(n.id)}" style="--i:${i}">
      <span class="nd-top"><span class="nd-ic">${ic(n.icon, 18)}</span><span class="nd-est">${ic(EST_IC[n.estado], 14)}${ESTADO_N[n.estado]}</span></span>
      <span class="nd-cifra"><b>${esc(n.cifra)}</b>${n.de ? `<small>${n.de}</small>` : ''}</span><span class="nd-lab">${esc(n.cifraLab)}</span>
      <span class="nd-nom">${esc(n.nombre)}</span><span class="nd-tit">${esc(n.titular)}</span>
      <span class="nd-pie">${n.pasos ? `<span class="tag acc">${n.pasos} ${n.pasos === 1 ? 'paso' : 'pasos'} del plan</span>` : '<span></span>'}<span class="nd-ver">Ver a fondo ${ic('arrow', 14)}</span></span></button>`;
  }
  // Portada: la nota en grande con su color y tres frases (lo mejor, lo que más pesa, el primer paso).
  function portada() {
    const ns = nodos(), est = nivel(E.nota.hoy), peor = ns.find(n => n.estado !== 'neutro'), mejor = ns.slice().reverse().find(n => n.estado === 'hi'), p0 = E.pasos[0];
    const frases = [mejor ? [`check`, `Lo más fuerte: <b>${esc(low1(mejor.nombre))}</b> (${esc(mejor.cifra)}${mejor.de || ''}).`] : null,
      peor ? ['flag', `Lo que más pesa: <b>${esc(low1(peor.nombre))}</b>. ${esc(peor.titular)}`] : null,
      p0 ? ['arrow', `Primer paso del plan: <b>${esc(low1(pTitulo(p0)))}</b>. Con todo el plan, la nota llega a <b>${E.nota.max}</b>.`] : null].filter(Boolean);
    return `<section class="portada est-${est}"><div class="kicker" style="margin:0">Informe de ${esc(E.fam.titulo)}</div>
      <button class="pt-nota" data-act="tema" data-k="__nota" aria-label="Ver la nota a fondo">${ring(E.nota.hoy, E.nota.max)}
        <span class="pt-txt"><span class="nd-est">${ic(EST_IC[est], 14)}${ESTADO_N[est]}</span><b>${w('Vuestra', 'Tu')} nota de salud financiera</b><small>${E.nota.banda ? `Banda ${esc(E.nota.banda)}. ` : ''}Toca para ver cómo se calcula.</small></span></button>
      <ul class="pt-frases">${frases.map(([i2, f], k) => `<li style="--i:${k}">${ic(i2, 16)}<span>${f}</span></li>`).join('')}</ul></section>`;
  }
  // Texto del informe (narrative): en español si hay traducción revisada; si no, el original.
  function narrHtml(n) {
    const txt = n.es || n.en, md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const lineas = String(txt).split(/\n+/).map(x => x.trim()).filter(Boolean);
    const items = lineas.length > 1 || /^- /.test(lineas[0] || '') ? `<ul class="lect">${lineas.map(l => `<li>${md(l.replace(/^- /, ''))}</li>`).join('')}</ul>` : `<p>${md(txt)}</p>`;
    return `${items}${n.es ? '' : `<p class="tiny">Texto original del informe, en inglés.</p>`}`;
  }
  function capaHtml(c) {
    if (c.t === 'filas') return `<div class="dsg"><table>${c.filas.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table></div>${c.nota ? `<p class="tiny">${esc(c.nota)}</p>` : ''}`;
    if (c.t === 'tabla') return `<div class="tbl"><table><thead><tr>${c.cab.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${c.filas.map(r => `<tr>${r.map(v => `<td>${/^<b>[^<]*<\/b>$/.test(v) ? v : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${c.nota ? `<p class="tiny">${esc(c.nota)}</p>` : ''}`;
    if (c.t === 'texto') return c.parrafos.map(x => `<p class="small">${esc(x)}</p>`).join('');
    return '';
  }
  const capasHtml = (capas, narr) => {
    const bloques = (capas || []).map(c => [c.titulo, capaHtml(c)]).concat((narr || []).map(n => [`${n.titulo} · informe`, narrHtml(n)]));
    return bloques.length ? `<div class="capas">${bloques.map(([t2, h]) => `<details class="capa"><summary><span>${esc(t2)}</span>${ic('arrow', 16)}</summary><div class="capa-in">${h}</div></details>`).join('')}</div>` : '';
  };
  const narrDe = id => (E.narrativa || []).filter(n => n.punto === id);
  const conexHtml = ids => { const ns = (ids || []).map(nodo).filter(Boolean); return ns.length ? `<div class="conex"><span class="small muted">Conectado con</span>${ns.map(n => `<button class="chip sm est-${n.estado}" data-act="tema" data-k="${esc(n.id)}">${ic(n.icon, 14)}${esc(n.nombre)}</button>`).join('')}</div>` : ''; };

  // --- gráficos (sin librerías). Reglas: todo empieza en cero sobre un eje con marcas redondas,
  // rejilla fina y discreta, un solo color por gráfico salvo cuando el color significa algo (y entonces
  // hay leyenda), textos siempre del mismo tamaño y nunca encima de la marca ni cortados.
  const ejeTxt = v => { const a = Math.abs(v); return a === 0 ? '0' : a >= 1e6 ? dec(v / 1e6, 1) + ' M$' : a >= 1e3 ? dec(v / 1e3, 0) + ' K$' : Math.round(v) + ' $'; };
  function marcas(lo, hi, n = 4) { // marcas redondas (1, 2, 2,5, 5 × 10^k) que cubren [lo, hi]
    const r = (hi - lo) || Math.abs(hi) || 1, raw = r / n, e = Math.pow(10, Math.floor(Math.log10(raw)));
    const paso = [1, 2, 2.5, 5, 10].map(m => m * e).find(m => m >= raw);
    const a = Math.floor(lo / paso) * paso, b = Math.ceil(hi / paso) * paso, t = [];
    for (let v = a; v <= b + paso / 2; v += paso) t.push(Math.round(v * 100) / 100);
    return t;
  }
  const leyenda = items => items.length ? `<div class="gx-leg">${items.map(([c, t]) => `<span><i class="${c}"></i>${esc(t)}</span>`).join('')}</div>` : '';
  // Barras horizontales: nombre y cifra en una línea encima de cada barra, eje común abajo.
  function barrasHtml(titulo, items, extra = {}) {
    const top = Math.max(...items.map(it => Math.max(it.v || 0, it.ref || 0)), extra.zona ? extra.zona[1] : 0) || 1;
    const t = marcas(0, top), mx = t[t.length - 1], pc = v => Math.max(0, Math.min(100, v / mx * 100));
    const leg = [];
    if (items.some(it => it.tono === 'coste')) leg.push(['coste', extra.costeTxt || 'A vigilar']);
    if (items.some(it => it.tono === 'bueno')) leg.push(['bueno', extra.buenoTxt || 'A favor']);
    if (items.some(it => it.ref)) leg.push(['ref', 'Mínimo que recomienda el plan']);
    if (extra.zona) leg.push(['zona', `Recomendado: ${extra.zona[2]}`]);
    return `<figure class="gf"><figcaption>${esc(titulo)}</figcaption><div class="gx">
      <div class="gx-plot">${t.map(v => `<i class="gx-g${v === 0 ? ' z' : ''}" style="left:${pc(v)}%"></i>`).join('')}${extra.zona ? `<i class="gx-zona" style="left:${pc(extra.zona[0])}%;width:${pc(extra.zona[1]) - pc(extra.zona[0])}%"></i>` : ''}
      ${items.map((it, k) => `<div class="gx-row ${it.tono || ''}" style="--i:${k}"><div class="gx-h"><span class="gx-l" title="${esc(it.lab)}">${esc(it.lab)}</span><span class="gx-v">${esc(it.txt || M(it.v))}</span></div>
        <div class="gx-bar">${it.v > 0 ? `<i style="width:${Math.max(0.8, pc(it.v))}%"></i>` : ''}${it.ref ? `<b class="gx-ref" style="left:${pc(it.ref)}%"></b>` : ''}</div></div>`).join('')}</div>
      <div class="gx-ax">${t.map((v, k) => `<span class="${k === 0 ? 'ini' : k === t.length - 1 ? 'fin' : ''}" style="left:${pc(v)}%">${extra.plano ? v : ejeTxt(v)}</span>`).join('')}</div></div>${leyenda(leg)}</figure>`;
  }
  function graf(g) {
    if (!g) return '';
    if (g.tipo === 'barras') return barrasHtml(g.titulo, g.items, { costeTxt: g.leyenda && g.leyenda.coste, buenoTxt: g.leyenda && g.leyenda.bueno, plano: g.plano });
    if (g.tipo === 'rango') return barrasHtml(g.titulo, [{ lab: 'Hoy', v: g.v, txt: g.txt, tono: g.v < g.min ? 'coste' : 'bueno' }], { zona: [g.min, g.max, `${g.minTxt} a ${g.maxTxt}`], costeTxt: 'Por debajo de lo recomendado', buenoTxt: 'Dentro o por encima' });
    if (g.tipo === 'curva') return svgLinea(g.serie, g.marca, g.titulo, g.nota);
    if (g.tipo === 'flujo') return flujoHtml(g);
    if (g.tipo === 'pares') return paresHtml(g);
    return '';
  }
  // Barra segmentada del sueldo: un bloque por destino, con su leyenda y lo que hay dentro de cada uno.
  function flujoHtml(g) {
    const tot = g.grupos.reduce((x, y) => x + y.v, 0) || 1, col = (gr, k) => gr.sobra ? 'fx-s' : 'fx-' + (k % 6);
    return `<figure class="gf"><figcaption>${esc(g.titulo)}</figcaption>
      <div class="fx-bar" role="img" aria-label="${esc(g.grupos.map(x => `${x.lab} ${Math.round(x.v / tot * 100)} %`).join(', '))}">${g.grupos.map((x, k) => { const pc = x.v / tot * 100; return `<i class="${col(x, k)}" style="flex:${x.v};--i:${k}" title="${esc(x.lab)}: ${M(Math.round(x.v))}">${pc >= 9 ? `${Math.round(pc)} %` : ''}</i>`; }).join('')}</div>
      <ul class="fx-ley">${g.grupos.map((x, k) => `<li><span class="fx-h"><i class="${col(x, k)}"></i><b>${esc(x.lab)}</b><span>${M(Math.round(x.v))} · ${Math.round(x.v / tot * 100)} %</span></span>${x.partes.length > 1 ? `<span class="fx-p">${x.partes.map(p2 => `${esc(p2.lab)} ${Mk(p2.v)}`).join(' · ')}</span>` : ''}</li>`).join('')}</ul></figure>`;
  }
  // Pares de barras (hoy frente a propuesto). Con signo: eje centrado en cero para subidas y caídas.
  function paresHtml(g) {
    const vs = g.items.flatMap(x => [x.a, x.b]).filter(v => v != null), lo = g.signo ? Math.min(0, ...vs) : 0, hi = Math.max(0, ...vs);
    const t = marcas(lo, hi, 4), a0 = t[0], a1 = t[t.length - 1], pc = v => (v - a0) / ((a1 - a0) || 1) * 100, z = pc(0);
    const pct = v => v == null ? '—' : `${g.signo && v > 0 ? '+' : ''}${dec(v * 100, 1)} %`;
    const barra = (v, cls) => v == null ? '' : `<i class="${cls}" style="left:${Math.min(z, pc(v))}%;width:${Math.max(0.6, Math.abs(pc(v) - z))}%"></i>`;
    return `<figure class="gf"><figcaption>${esc(g.titulo)}</figcaption><div class="gx pr">
      <div class="gx-plot">${t.map(v => `<i class="gx-g${v === 0 ? ' z' : ''}" style="left:${pc(v)}%"></i>`).join('')}
      ${g.items.map((x, k) => `<div class="gx-row" style="--i:${k}"><div class="gx-h"><span class="gx-l" title="${esc(x.lab)}">${esc(x.lab)}</span><span class="gx-v">${pct(x.a)} · ${pct(x.b)}</span></div>
        <div class="pr-bars">${barra(x.a, 'pa')}</div><div class="pr-bars">${barra(x.b, 'pb')}</div></div>`).join('')}</div>
      <div class="gx-ax">${t.map((v, k) => `<span class="${k === 0 ? 'ini' : k === t.length - 1 ? 'fin' : ''}" style="left:${pc(v)}%">${dec(v * 100, 0)} %</span>`).join('')}</div></div>
      <div class="gx-leg"><span><i class="pa"></i>${esc(g.series[0])}</span><span><i class="pb"></i>${esc(g.series[1])}</span></div></figure>`;
  }
  // Línea en el tiempo (patrimonio del roadmap o curva de la deuda) con ejes X (años) e Y (dólares).
  // Se dibuja al ancho real de la página para que los textos salgan a su tamaño, ni más grandes ni más pequeños.
  function svgLinea(s, marca, titulo, nota) {
    if (!s || s.length < 2) return '';
    const W = Math.round(Math.max(280, Math.min(640, window.innerWidth) - 60)), H = 190;
    const vs = s.map(p => p[1]), yt = marcas(Math.min(0, ...vs), Math.max(...vs)), y0 = yt[0], y1 = yt[yt.length - 1];
    const L = Math.max(...yt.map(v => ejeTxt(v).length)) * 6.6 + 10, R = 10, T = 26, B = 24, pw = W - L - R, ph = H - T - B;
    const x0 = s[0][0], x1 = s[s.length - 1][0], span = (x1 - x0) || 1;
    const X = y => L + (y - x0) / span * pw, Y = v => T + ph - (v - y0) / ((y1 - y0) || 1) * ph;
    const pasoX = [1, 2, 5, 10, 20, 25].find(p => span / p <= Math.max(3, Math.floor(pw / 62))) || 50;
    const xt = [x0]; for (let y = Math.ceil(x0 / pasoX) * pasoX; y <= x1; y += pasoX) if ((X(y) - X(x0)) > 52 && (X(x1) - X(y)) > 52) xt.push(y);
    xt.push(x1); // primer y último año siempre a la vista
    const pts = s.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
    const j = marca && s.find(p => p[0] === marca[0]);
    let anot = '';
    if (j) { // rótulo arriba, encajado dentro del gráfico
      const tw = marca[1].length * 6.4, cx = X(j[0]), lx = Math.max(L, Math.min(W - R - tw, cx - tw / 2));
      anot = `<line x1="${cx}" x2="${cx}" y1="${T - 6}" y2="${T + ph}" class="gl-j"/><circle cx="${cx}" cy="${Y(j[1])}" r="4.5" class="gl-p"/><text x="${lx}" y="${T - 10}" class="gl-m">${esc(marca[1])}</text>`;
    }
    const resumen = `${x0}: ${M(Math.round(s[0][1]))} · ${x1}: ${M(Math.round(s[s.length - 1][1]))}`;
    return `<figure class="gf"><figcaption>${esc(titulo)}</figcaption><div class="gl-w"><svg class="gl" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(titulo)}. ${esc(resumen)}" data-s='${JSON.stringify(s.map(p => [p[0], Math.round(p[1])]))}' data-g="${[L, T, pw, ph, x0, span, y0, y1 - y0].join(',')}">
      ${yt.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="gl-g${v === 0 ? ' z' : ''}"/><text x="${L - 8}" y="${Y(v) + 4}" class="gl-t" text-anchor="end">${ejeTxt(v)}</text>`).join('')}
      ${xt.map((y, k) => `<line x1="${X(y)}" x2="${X(y)}" y1="${T + ph}" y2="${T + ph + 4}" class="gl-g z"/><text x="${X(y)}" y="${H - 4}" class="gl-t" text-anchor="${k === 0 ? 'start' : k === xt.length - 1 ? 'end' : 'middle'}">${y}</text>`).join('')}
      <polygon points="${X(x0)},${Y(Math.max(0, y0))} ${pts} ${X(x1)},${Y(Math.max(0, y0))}" class="gl-a"/><polyline points="${pts}" class="gl-l"/>${anot}
      <g class="gl-hv"><line class="gl-hl" y1="${T}" y2="${T + ph}"/><circle r="4.5" class="gl-hp"/></g></svg><div class="gl-tip" aria-hidden="true"></div></div>
      <p class="gl-res">${esc(resumen)}</p><details class="gl-tab"><summary>Ver los datos</summary><div><table><tr><th>Año</th><th>Dólares</th></tr>${s.map(p => `<tr><td>${p[0]}</td><td>${M(Math.round(p[1]))}</td></tr>`).join('')}</table></div></details>${nota ? `<p class="tiny" style="margin:4px 0 0">${esc(nota)}</p>` : ''}</figure>`;
  }
  // Al pasar el dedo o el ratón por una línea: año y cifra de ese punto.
  function lineaHover(e) {
    const sv = e.target.closest && e.target.closest('svg.gl'); if (!sv) return;
    const s = JSON.parse(sv.dataset.s), [L, T, pw, ph, x0, span, y0, yr] = sv.dataset.g.split(',').map(Number);
    const r = sv.getBoundingClientRect(), k = r.width / sv.viewBox.baseVal.width, xv = (e.clientX - r.left) / k;
    const yr0 = x0 + (xv - L) / pw * span, p = s.reduce((a, b) => Math.abs(b[0] - yr0) < Math.abs(a[0] - yr0) ? b : a);
    const cx = L + (p[0] - x0) / span * pw, cy = T + ph - (p[1] - y0) / (yr || 1) * ph;
    const g = sv.querySelector('.gl-hv'), tip = sv.parentNode.querySelector('.gl-tip');
    g.style.opacity = 1; g.querySelector('line').setAttribute('x1', cx); g.querySelector('line').setAttribute('x2', cx);
    g.querySelector('circle').setAttribute('cx', cx); g.querySelector('circle').setAttribute('cy', cy);
    tip.innerHTML = `<b>${p[0]}</b> ${M(p[1])}`; tip.style.opacity = 1;
    const tw = tip.offsetWidth; tip.style.left = Math.max(0, Math.min(r.width - tw, cx * k - tw / 2)) + 'px'; tip.style.top = Math.max(0, cy * k - 44) + 'px';
  }
  function lineaFuera(e) {
    const w = e.target.closest && e.target.closest('.gl-w'); if (!w) return;
    w.querySelector('.gl-hv').style.opacity = 0; w.querySelector('.gl-tip').style.opacity = 0;
  }
  function grafLinea(r) {
    const j = r.jubila && (r.serie || []).find(p => p[0] === r.jubila);
    return svgLinea(r.serie, j ? [j[0], `Jubilación ${j[0]} · ${M(Math.round(j[1]))}`] : null, 'Patrimonio neto, en dólares de hoy');
  }

  // --- página de un tema (al tocar una tarjeta, en el resumen o en el plan completo).
  // Misma estructura que su sección en el informe: cifras clave, desglose con total y gráfico,
  // qué significa, lo que propone el plan, para hablar con el asesor y, al final, todas las cifras.
  const kpisHtml = ks => ks && ks.length ? `<div class="kpis">${ks.map((x, i) => `<div class="kpi ${x.tono || ''}" style="--i:${i}"><small>${esc(x.lab)}</small><b>${esc(x.val)}</b>${x.sub ? `<span>${esc(x.sub)}</span>` : ''}</div>`).join('')}</div>` : '';
  const desgloseHtml = d => d ? `<div class="dsg"><div class="dsg-t">${esc(d.titulo)}</div><table>${d.filas.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}${d.total ? `<tr class="tot"><td>${esc(d.total[0])}</td><td>${esc(d.total[1])}</td></tr>` : ''}</table></div>` : '';
  const lecturaHtml = ls => ls && ls.length ? `<ul class="lect">${ls.map(l => `<li>${l}</li>`).join('')}</ul>` : '';
  const asesorHtml = t => t ? `<div class="asesor">${ic('chat', 18)}<div><b>Para hablar con ${w('vuestro', 'tu')} asesor</b><p>${esc(t)}</p><button class="link small" data-act="whatif">Apuntar una pregunta</button></div></div>` : '';
  const sec = (n, t, body) => body ? `<section class="tp-sec"><div class="kicker"><b>${n}</b>${t}</div>${body}</section>` : '';
  function abrirTema(k) { S.temaFrom = S.stage === 'tema' ? S.temaFrom : S.stage; S.temaY = window.scrollY; S.temaK = k; S.stage = 'tema'; render(); window.scrollTo(0, 0); }
  function volverTema(dest) {
    const from = dest || S.temaFrom || 'plan', y = from === S.temaFrom ? S.temaY : 0;
    S.stage = from; S.temaK = null; render(); window.scrollTo(0, y || 0);
  }
  // «Todas las cifras»: mini tarjetas como las KPI, agrupadas por bloque (según el origen de cada cifra) y con chips para filtrar.
  const CF_SEL = {};
  const numHi = h => h.replace(/(-?\d[\d.]*(?:,\d+)?(?:[–-]\d[\d.]*(?:,\d+)?)?\s?(?:%|M\$|\$))/g, '<b class="n">$1</b>');
  const CF_GRUPOS = [
    [/incomes|savingsLevel|investableAssetLevel|IncomePercentile|matchGap/, 'Ingresos y ahorro'], [/outflow|cashflowStatement|netCashFlow/, 'A dónde va el dinero'],
    [/listOfDebts/, 'Cada deuda'], [/debtToIncome|housingRatio|creditCard|DPD/, 'Ratios y plazos'],
    [/marketEnvironments/, 'En crisis'], [/return\d|volatility3y/, 'Rentabilidad'],
    [/allocation|GlidePath|concentration|EquityPct|targetAnalysis|portfolioAnalysis|volatility|sector/, 'Reparto y riesgo'],
    [/risk_profile|totalAssets|netWorth|listOfAssets/, 'Patrimonio'],
    [/cashNeeds/, 'Rentabilidad del efectivo'], [/nearTerm|totalCashNeeded|shortfall|cashAbove|AfterNearTerm/, 'Con los gastos previstos'], [/facts\.cash|emergencyFund/, 'El colchón hoy'],
    [/lifeInsurance/, 'Seguro de vida'], [/umbrella/, 'Responsabilidad civil'], [/profile\.insurance/, 'Pólizas'], [/case\.household/, 'Familia'],
    [/education/, 'Universidad'], [/^goals/, 'Metas'], [/retirement|projections/, 'Jubilación'],
  ];
  function cifrasHtml(rows) {
    if (!rows || !rows.length) return '';
    const gs = [], key = S.temaK || S.rulOpen || '';
    rows.forEach(r => { const n = (CF_GRUPOS.find(([re]) => re.test(r[2] || '')) || [0, 'Otras cifras'])[1], g = gs.find(x => x.n === n); if (g) g.rows.push(r); else gs.push({ n, rows: [r] }); });
    const sel = CF_SEL[key] || '*';
    const tile = (r, i) => `<div class="itile ${String(r[1]).length > 24 ? 'ancha' : ''}" style="--i:${i}"><small>${esc(r[0])}</small><b>${numHi(esc(r[1]))}</b>${PRO() && r[2] ? `<small class="tm-o">${esc(r[2])}</small>` : ''}</div>`;
    return `<div class="cfw">${gs.length > 1 ? `<div class="cf-bar" role="group" aria-label="Filtrar cifras">${[['*', 'Todas', rows.length]].concat(gs.map(x => [x.n, x.n, x.rows.length])).map(([v, l, c]) => `<button class="cf-chip" data-act="cff" data-v="${esc(v)}" aria-pressed="${sel === v}"><span>${esc(l)}</span><em>${c}</em></button>`).join('')}</div>` : ''}
      ${gs.map(x => `<section class="cf-g" data-n="${esc(x.n)}" ${sel === '*' || sel === x.n ? '' : 'hidden'}>${gs.length > 1 ? `<h4 class="cf-h">${esc(x.n)}</h4>` : ''}<div class="itiles">${x.rows.map(tile).join('')}</div></section>`).join('')}</div>`;
  }
  function selCf(btn, v) {
    const box = btn.closest('.cfw'); if (!box) return; CF_SEL[S.temaK || S.rulOpen || ''] = v;
    box.querySelectorAll('[data-act=cff]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
    box.querySelectorAll('.cf-g').forEach(g => { g.hidden = !(v === '*' || g.dataset.n === v); });
  }
  // Contenido de la página de un tema (también es lo que se ve al abrir una tarjeta de la ruleta).
  function temaBody(k) {
    let html = '', titulo = '';
    if (k === '__nota') {
      titulo = 'Nota general';
      html = `<header class="tp-h"><div class="kicker">${w('Vuestra', 'Tu')} nota general</div><h1>${E.nota.hoy} de 100</h1><p class="muted">${E.nota.banda ? `Banda <b>${esc(E.nota.banda)}</b>. ` : ''}Con los pasos de ${w('vuestro', 'tu')} plan llega a <b>${E.nota.max}</b>.</p></header>
        <div class="foto">${ring(E.nota.hoy, E.nota.max)}</div>
        ${sec(1, 'Las cinco áreas', graf({ tipo: 'barras', titulo: 'De 0 a 100', items: E.areas.map(a => ({ lab: a.nombre, v: a.nota, txt: `${a.nota}${a.puntos ? ` · ${a.puntos} puntos` : ''}`, tono: nivel(a.nota) === 'low' ? 'coste' : nivel(a.nota) === 'hi' ? 'bueno' : '' })), leyenda: { coste: 'A reforzar (menos de 50)', bueno: 'Bien (75 o más)' }, plano: true }) + conexHtml(E.areas.map(a => a.nombre)))}
        ${sec(2, 'Cómo sube con cada paso', desgloseHtml({ titulo: 'Nota con los pasos del plan', filas: E.pasos.map(p => [`${p.n}. ${pTitulo(p)}`, `${p.nota}`]).concat(Object.entries(E.combos || {}).map(([c, v]) => [c.split('|').map(s2 => (paso(s2) || {}).titulo || s2).join(' + '), `${v}`])), total: ['Con todo el plan', String(E.nota.max)] }))}
        ${sec(3, 'Ver más', capasHtml(E.notaCapas, narrDe('__nota')))}`;
    } else if (k === '__ruta') {
      const r = E.roadmap || {}; titulo = 'Roadmap';
      html = `<header class="tp-h"><div class="kicker">${w('Vuestro', 'Tu')} roadmap</div><h1>De hoy a ${w('vuestra', 'tu')} jubilación</h1></header>
        ${kpisHtml(r.kpis)}
        ${sec(1, 'El camino, hito a hito', lineaHtml())}
        ${sec(2, `Cómo crece ${w('vuestro', 'tu')} patrimonio`, grafLinea(r))}
        ${sec(3, 'Qué significa', lecturaHtml(r.lectura))}
        ${asesorHtml(r.asesor)}
        <details class="fold-all"><summary>Todas las cifras de este tema</summary>${cifrasHtml(r.detalle)}</details>`;
    } else {
      const x = temaDe(k); if (!x) return '';
      const { a, t, pasos } = x;
      html = `<header class="tp-h tema-big ${nivel(a.nota)}">${cabTema(a, t, 'h1')}</header>
        ${kpisHtml(a.kpis)}
        ${sec(1, 'El desglose', desgloseHtml(a.desglose) + graf(a.graf))}
        ${sec(2, 'Qué significa', lecturaHtml(a.lectura))}
        ${sec(3, `Lo que propone ${w('vuestro', 'tu')} plan`, pasos.length ? pasos.map(pasoTema).join('') : sinPaso(x))}
        ${asesorHtml(a.asesor)}
        <details class="fold-all"><summary>Todas las cifras de este tema</summary>${cifrasHtml(a.detalle)}<p class="tiny">Puntos en la nota: ${esc(a.puntos || a.nota + ' de 100')}.</p></details>`;
    }
    return html;
  }
  function renderTema() {
    const k = S.temaK, desdeResumen = S.temaFrom === 'story', origen = desdeResumen ? 'Resumen' : 'Plan';
    let html = '', titulo = '';
    const cifraBig = n => `<div class="tp-cifra est-${n.estado}"><b>${esc(n.cifra)}</b>${n.de ? `<small>${n.de}</small>` : ''}<span>${esc(n.cifraLab)}</span><span class="nd-est">${ic(EST_IC[n.estado], 14)}${ESTADO_N[n.estado]}</span></div>`;
    if (k === '__nota') {
      titulo = 'Nota general';
      html = `<header class="tp-h"><div class="kicker">${w('Vuestra', 'Tu')} nota general</div><h1>${E.nota.hoy} de 100</h1><p class="muted">${E.nota.banda ? `Banda <b>${esc(E.nota.banda)}</b>. ` : ''}Con los pasos de ${w('vuestro', 'tu')} plan llega a <b>${E.nota.max}</b>.</p></header>
        <div class="foto">${ring(E.nota.hoy, E.nota.max)}</div>
        ${sec(1, 'Las cinco áreas', graf({ tipo: 'barras', titulo: 'De 0 a 100', items: E.areas.map(a => ({ lab: a.nombre, v: a.nota, txt: `${a.nota}${a.puntos ? ` · ${a.puntos} puntos` : ''}`, tono: nivel(a.nota) === 'low' ? 'coste' : nivel(a.nota) === 'hi' ? 'bueno' : '' })), leyenda: { coste: 'A reforzar (menos de 50)', bueno: 'Bien (75 o más)' }, plano: true }) + conexHtml(E.areas.map(a => a.nombre)))}
        ${sec(2, 'Cómo sube con cada paso', desgloseHtml({ titulo: 'Nota con los pasos del plan', filas: E.pasos.map(p => [`${p.n}. ${pTitulo(p)}`, `${p.nota}`]).concat(Object.entries(E.combos || {}).map(([c, v]) => [c.split('|').map(s2 => (paso(s2) || {}).titulo || s2).join(' + '), `${v}`])), total: ['Con todo el plan', String(E.nota.max)] }))}
        ${sec(3, 'Ver más', capasHtml(E.notaCapas, narrDe('__nota')))}`;
    } else if (k === '__ruta') {
      const r = E.roadmap || {}; titulo = 'Roadmap';
      html = `<header class="tp-h"><div class="kicker">${w('Vuestro', 'Tu')} roadmap</div><h1>De hoy a ${w('vuestra', 'tu')} jubilación</h1></header>
        ${kpisHtml(r.kpis)}
        ${sec(1, 'El camino, hito a hito', lineaHtml())}
        ${sec(2, `Cómo crece ${w('vuestro', 'tu')} patrimonio`, grafLinea(r))}
        ${sec(3, 'Qué significa', lecturaHtml(r.lectura))}
        ${asesorHtml(r.asesor)}${conexHtml(['jubilacion', 'universidad'])}
        <details class="fold-all"><summary>Todas las cifras de este tema</summary>${filasTema(r.detalle, true)}</details>`;
    } else {
      const n = nodo(k); if (!n) { volverTema(); return; }
      titulo = n.nombre;
      const head = `<header class="tp-h"><div class="tp-hh"><span class="ar-ic">${ic(n.icon, 20)}</span><div><h1>${esc(n.nombre)}</h1><small class="muted">${esc(n.sub || '')}</small></div></div>${cifraBig(n)}${n.titular ? `<p class="tp-tit">${esc(n.titular)}</p>` : ''}</header>`;
      if (n.tipo === 'area') {
        const { x } = n, { a, pasos } = x;
        html = `${head}${kpisHtml(a.kpis)}
          ${sec(1, 'Lo esencial', lecturaHtml(a.lectura) + dijeron(x))}
          ${sec(2, 'En gráfico', graf(a.graf) + desgloseHtml(a.desglose))}
          ${sec(3, `Lo que propone ${w('vuestro', 'tu')} plan`, pasos.length ? pasos.map(pasoTema).join('') : sinPaso(x))}
          ${asesorHtml(a.asesor)}${conexHtml(a.conexiones)}
          ${sec(4, 'Ver más', capasHtml(a.capas, narrDe(a.nombre)) + `<details class="capa"><summary><span>Todas las cifras de este tema</span>${ic('arrow', 16)}</summary><div class="capa-in">${filasTema(a.detalle, true)}<p class="tiny">Puntos en la nota: ${esc(a.puntos || a.nota + ' de 100')}.</p></div></details>`)}`;
      } else {
        html = `${head}${kpisHtml(n.kpis)}
          ${sec(1, 'Lo esencial', lecturaHtml(n.lectura))}
          ${sec(2, 'En gráfico', graf(n.graf) + graf(n.graf2))}
          ${asesorHtml(n.asesor)}${conexHtml(n.conexiones)}
          ${sec(3, 'Ver más', capasHtml(n.capas, narrDe(n.id)))}`;
      }
    }
    app.innerHTML = `<div class="narrow tpage">${routeBar()}<nav class="migas" aria-label="Estás en"><button class="link" data-act="temaback">${ic('arrow', 14).replace('<svg', '<svg style="transform:rotate(180deg)"')} ${origen}</button><span>›</span><b>${esc(titulo)}</b></nav>${html}
      <p class="foot">Cifras del informe de ${w('vuestro', 'tu')} estudio.</p></div>
      <div class="cta-bar"><div class="cta-in">${desdeResumen ? `<button class="btn ghost grow" data-act="temaback">Volver al resumen</button><button class="btn grow" data-act="temaback" data-v="plan">Plan completo</button>` : `<button class="btn grow" data-act="temaback">Volver al plan completo</button>`}</div></div>`;
    if (k === '__nota') animateRing();
  }
  // Roadmap: el camino de hitos, de hoy a la jubilación.
  function rutaCard() {
    return `<article class="tema ruta"><header class="tm-h"><span class="ar-ic">${ic('flag', 18)}</span><div class="tm-ht"><h3>${w('Vuestro', 'Tu')} roadmap</h3><small>El camino de hitos, de hoy a la jubilación</small></div></header>
      ${lineaHtml(null, true)}<p class="tiny tl-hint">Desliza para ver todo el camino →</p></article>`;
  }

  function renderPlan() {
    const ns = nextStep(), c = counts(), acc = accepted(), sc = scoreFor(acc), max = E.nota.max;
    let main = `<section class="planhero"><div class="kicker" style="margin:0">Plan de ${esc(E.fam.titulo)}</div>
      <h1>«${esc(S.phrase || `${w('Vuestro', 'Tu')} plan`)}»</h1>
      <div class="heroscore">${ring(sc.v, max)}
        <div><b class="hs-t">${acc.length ? `La nota que ${w('tendríais', 'tendrías')} al hacer lo elegido` : `${w('Vuestra', 'Tu')} nota de salud financiera, hoy`}</b>
        <p class="muted small" style="margin:.3em 0 0">${acc.length ? `Hoy es <b>${(() => { const h = E.pasos.filter(p => (S.done || {})[p.key]).map(p => p.key); return h.length ? scoreFor(h).v : E.nota.hoy; })()}</b>. ` : ''}${max > E.nota.hoy ? `Con todos los pasos de ${w('vuestro', 'tu')} plan llega a <b>${max}</b>. ` : ''}${w('Habéis elegido', 'Has elegido')} ${acc.length} de ${c.n}.${sc.parcial ? ' El plan da la nota de cada paso por separado.' : ''}</p></div></div></section>`;
    const nx = ns, nds = nodos();
    main += `<div class="section" id="s-pasos"><div class="kicker"><b>1</b>${w('Vuestro', 'Tu')} informe, de lo más urgente a lo que está bien</div>
      <p class="muted" style="margin-top:-2px">${nds.length} puntos. Toca uno para ver lo esencial, sus gráficas y, si ${w('queréis', 'quieres')}, todo el detalle. Las cinco áreas con nota son las que calculan ${w('vuestra', 'tu')} nota; ahí ${w('votáis', 'votas')} los pasos del plan.</p>
      <div class="nodos">${nds.map(nodoCard).join('')}${rutaCard()}</div></div>`;

    main += `<div class="section" id="s-cierre"><div class="kicker"><b>2</b>${w('Vuestro', 'Tu')} siguiente paso</div>
      <div class="card close"><div class="meter">
        <div><b>${c.yes}/${c.n}</b><span class="tiny">pasos aceptados</span></div>
        <div><b>${c.resolved}</b><span class="tiny">dudas resueltas</span></div>
        <div><b>${c.open}</b><span class="tiny">para la reunión</span></div></div>
        ${S.gain ? `<p class="quote">Con esto resuelto: <b>«${esc(S.gain)}»</b></p>` : ''}
        ${S.booking ? bookedCard() : `<h2 style="margin-top:14px">${nx.title}</h2><p>${nx.text}</p>
        <ul class="ticks"><li>${ic('check', 16)}${w('Salís', 'Sales')} con el orden de ${w('vuestros', 'tus')} pasos y respuesta a ${w('vuestras', 'tus')} dudas</li><li>${ic('check', 16)}${nx.mins} minutos por videollamada</li><li>${ic('check', 16)}No hay que preparar nada</li></ul>
        <button class="btn block big-cta" data-act="book">${ic('cal')} ${c.yes ? `Elegir día con ${w('vuestro', 'tu')} asesor` : `Hablarlo con ${w('vuestro', 'tu')} asesor`}</button>
        <p class="tiny" style="text-align:center;margin:.6em 0 0">Sin compromiso. ${w('Decidís vosotros', 'Decides tú')}.</p>`}
        <button class="link" style="width:100%" data-act="whatif">Antes, ${w('tenemos', 'tengo')} otra pregunta</button>
        ${S.booking ? '' : `<button class="link" style="width:100%" data-act="later">${window.__PREVIEW__ ? (S.later ? 'Sin prisa: el plan sigue aquí' : 'Ahora no') : S.later ? 'Recordatorios a los 3 y 30 días, en el calendario' : `Ahora no. ${w('Recordádnoslo', 'Recuérdamelo')} en 3 y en 30 días`}</button>`}</div>
      ${weekCard()}
      ${E.primer && (S.payDate || S.booking) && !S.week ? `<button class="weeklink" data-act="week">${ic('clock', 18)}<span><b>Una semana después</b><small>Cómo comprobamos que el primer paso está hecho</small></span>${ic('arrow', 18)}</button>` : ''}
      ${S.booking ? fold('hoja', ic('list', 16), `Lo que recibe ${w('vuestro', 'tu')} asesor`, `La hoja con ${w('vuestras', 'tus')} respuestas y dudas`, advisorSheet(), false) : ''}</div>`;

    main += `<p class="foot">Antes de mover dinero, ${w('hablad con vuestro', 'habla con tu')} asesor.</p>`;

    app.innerHTML = `<div class="plan-grid solo"><div>${routeBar()}${main}</div></div>
      <div class="cta-bar"><div class="cta-in"><button class="btn ghost" data-act="whatif">${ic('pen', 16)} Preguntar</button>${S.booking
        ? `<button class="btn soft grow" data-act="gocierre">${ic('check', 18)} Reunión: ${esc(S.booking.short)}</button>`
        : `<button class="btn grow" data-act="book">${ic('cal', 18)} Pedir reunión</button>`}</div></div>`;
    animateRing();
  }

  function advisorSheet() {
    const b = S.booking, by = v => E.pasos.filter(p => S.steps[p.key] === v).map(p => p.titulo);
    const acc = by('yes'), dud = by('doubt'), no = by('no'), open = S.doubts.filter(d => d.status === 'open'), res = S.doubts.filter(d => d.status === 'resolved');
    const ad = E.fam.adultos, quien = !E.fam.pl ? ad[0].nombre : S.who === 'juntos' ? `${ad[0].nombre} y ${ad[1].nombre}` : S.who === 'b' ? ad[1].nombre : ad[0].nombre;
    const catLabel = id => (E.dudas.find(c => c.id === id) || {}).label;
    return `<div class="card" id="hoja"><div class="spread"><h3>Hoja para el asesor</h3><span class="tag good">Reunión pedida</span></div>
      <p class="small"><b>${esc(b.label)}</b> · ${b.mins} min · ${esc(E.fam.titulo)} (${esc(quien)})</p>
      <p class="tiny">Prototipo: no se envía nada. En producción, esta hoja le llega al asesor al confirmar.</p>
      ${E.lectura ? `<h3 style="margin-top:14px">Lectura del caso</h3><p>${esc(E.lectura)}</p>` : ''}
      ${S.phrase ? `<h3 style="margin-top:14px">Lo que más le${E.fam.pl ? 's' : ''} importa</h3><p>«${esc(S.phrase)}»</p>` : ''}
      ${S.gain ? `<h3>Qué cambiaría en casa, con sus palabras</h3><p>«${esc(S.gain)}»</p>` : ''}
      ${Object.keys(S.react).length ? `<h3>Cómo reaccionó a cada dato</h3><ul>${E.preguntas.filter(q => S.react[q.id]).map(q => `<li>${esc(q.creian)}: <b>${(REACT.find(r => r[0] === S.react[q.id]) || [0, () => ''])[1]()}</b></li>`).join('')}</ul>` : ''}
      ${pjSheetBlock()}
      <h3>Nivel</h3><p>${PRO() ? 'Sabe de finanzas: se le puede hablar en términos técnicos.' : 'Nuevo en esto: mejor sin tecnicismos.'}</p>
      ${S.payDate && E.primer ? `<h3>Primer paso con fecha</h3><p>${esc(E.primer.titulo)}: ${esc(S.payDate.label)}.${S.week ? (S.week.done ? ` A la semana estaba hecho (saldo ${M(S.week.balance)}).` : ` A la semana no estaba hecho: «${esc(S.week.reason)}».`) : ''}</p>` : ''}
      <h3>Pasos aceptados (${acc.length}/${E.pasos.length})</h3><ul>${acc.map(t => `<li>${esc(t)}</li>`).join('') || '<li class="muted">Ninguno todavía</li>'}</ul>
      ${dud.length ? `<h3>Con dudas</h3><ul>${dud.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${no.length ? `<h3>No convence</h3><ul>${no.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <h3>Preguntas para la reunión (${open.length})</h3><ul>${open.map(d => `<li>${catLabel(d.topic) ? `<span class="tag acc">${esc(catLabel(d.topic))}</span> ` : ''}${esc(d.q)}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      <h3>Dudas ya resueltas con el plan (${res.length})</h3><ul>${res.map(d => `<li>${esc(d.q)}</li>`).join('') || '<li class="muted">Ninguna</li>'}</ul>
      ${believed().length ? `<h3>Lo que creía y lo que dice el estudio</h3>${tbl(believed())}` : ''}
      <div class="row" style="margin-top:12px"><button class="btn soft" data-act="copy">Copiar resumen</button>${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="print">Imprimir</button>'}</div></div>`;
  }

  // ------------------------------------------------------------------ hojas (modales)
  function sheet(html) {
    closeSheet();
    const v = document.createElement('div');
    v.className = 'sheet-veil'; v.id = 'veil';
    v.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><button class="link close" data-act="close" aria-label="Cerrar">Cerrar</button>${html}</div>`;
    v.addEventListener('click', e => { if (e.target === v) closeSheet(); });
    document.body.appendChild(v);
    return v;
  }
  function closeSheet() { const v = document.getElementById('veil'); if (v) v.remove(); }

  // "¿Y si…?": primero se escribe la pregunta para el asesor y se le pone tema. Debajo, lo poco que ya responde el plan de ese tema.
  let DRAFT = '';
  function askSheet(pasoKey) {
    const cat = E.dudas.find(c => c.id === S.cat) || null, mine = S.doubts.filter(d => d.status === 'open');
    const v = sheet(`<div class="kicker">Para ${w('vuestro', 'tu')} asesor</div><h2>¿Qué le ${w('preguntaríais', 'preguntarías')}?</h2>
      <div class="askfield"><textarea id="free" rows="3" placeholder="${w('Escribidla con vuestras', 'Escríbela con tus')} palabras. Por ejemplo: ¿y si ${w('cambiamos', 'cambio')} de trabajo el año que viene?">${esc(DRAFT)}</textarea></div>
      <p class="asklab">¿De qué va?</p>
      <div class="cats" role="group" aria-label="Tema de la pregunta">${E.dudas.map(c => `<button class="cat" data-act="cat" data-v="${c.id}" aria-pressed="${S.cat === c.id}">${ic(c.icon, 18)}<span>${esc(c.label)}</span></button>`).join('')}</div>
      <button class="btn block" style="margin-top:14px" data-act="free" data-p="${pasoKey || ''}">${ic('pen', 18)} Apuntarla para la reunión</button>
      ${cat && cat.items.length ? `<div class="planresp"><div class="kicker" style="margin:0 0 8px">${w('Vuestro', 'Tu')} plan ya dice algo de esto</div>
        ${cat.items.map(it => { const d = S.doubts.find(x => x.id === it.id); return `<button class="opt slim" data-act="ask" data-t="${cat.id}" data-id="${it.id}"><span class="tx">${esc(it.q)}</span>${d ? `<span class="tag ${d.status === 'resolved' ? 'good' : 'acc'}">${d.status === 'resolved' ? 'resuelta' : 'para la reunión'}</span>` : ic('arrow', 16)}</button>`; }).join('')}</div>` : ''}
      ${mine.length ? `<div class="mineq"><div class="kicker" style="margin:0 0 8px">Apuntadas para la reunión · ${mine.length}</div>${mine.map(d => `<div class="mq"><span class="tag acc">${esc((E.dudas.find(c => c.id === d.topic) || { label: 'Paso' }).label)}</span><span>${esc(d.q)}</span><button class="link small" data-act="unask" data-id="${esc(d.id)}" aria-label="Quitar">Quitar</button></div>`).join('')}</div>` : ''}`);
    v.dataset.paso = pasoKey || '';
  }
  function answerSheet(t, id) {
    const cat = E.dudas.find(c => c.id === t), it = cat.items.find(x => x.id === id), covered = it.covered === 'yes';
    let d = S.doubts.find(x => x.id === id);
    if (!d) { d = { id, topic: t, q: it.q, covered: it.covered, status: covered ? 'pending' : 'open' }; S.doubts.push(d); save(); }
    sheet(`<div class="kicker">${esc(cat.label)}</div><h2>${esc(it.q)}</h2><p class="story" style="font-size:17.5px">${it.a}</p>
      ${covered ? `<p style="font-weight:600;margin-top:16px">¿Queda claro?</p>
        <div class="row"><button class="btn" data-act="resolve" data-id="${id}" data-v="resolved">Sí, queda claro</button><button class="btn ghost" data-act="resolve" data-id="${id}" data-v="open">${w('Seguimos', 'Sigo')} con la duda</button></div>`
        : `<div class="card soft" style="margin-top:12px"><b>Esto el plan no lo responde.</b><p class="small" style="margin:.3em 0 0">Queda apuntado para la reunión con ${w('vuestro', 'tu')} asesor.</p></div>
        <button class="btn block" data-act="whatif">Seguir</button>`}`);
  }
  const NO_REASONS = () => [w('No lo vemos necesario', 'No lo veo necesario'), 'Ahora mismo no hay dinero para esto', w('No lo entendemos del todo', 'No lo entiendo del todo'), w('Queremos pensarlo', 'Quiero pensarlo')];
  function noSheet(key) {
    sheet(`<h2>¿Qué ${w('os', 'te')} frena?</h2><p class="muted small">Queda apuntado para la reunión. No cambia nada del plan.</p>
      ${NO_REASONS().map(r => `<button class="opt" data-act="noreason" data-s="${key}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}`);
  }
  function talkSheet() {
    sheet(`<h2>Hablarlo con una persona</h2><p>${w('Os ayudamos', 'Te ayudamos')} a pedir cita con ${w('vuestro', 'tu')} asesor. Le llega lo que ${w('habéis', 'has')} contestado, para no repetirlo.</p>
      <button class="btn block" data-act="book">Pedir cita</button><button class="link" style="width:100%" data-act="close">Seguir aquí</button>`);
  }
  function settingsSheet() {
    sheet(`<h2>Ajustes</h2>
      <h3>Nivel</h3><div class="chips" style="margin-bottom:16px">${[['new', w('Somos nuevos en esto', 'Soy nuevo en esto')], ['pro', w('Sabemos de finanzas', 'Sé de finanzas')]].map(([v, l]) => `<button class="chip" data-act="setpref" data-v="${v}" aria-pressed="${S.prefs.level === v}">${l}</button>`).join('')}</div>
      <h3>Plan de ejemplo</h3><p class="muted small" style="margin-top:0">La misma app con otro plan de Sherpas.</p>${casePicker()}
      <p class="tiny" style="margin-top:14px">${fuente()}</p>
      <button class="link" data-act="restart">Volver a empezar desde cero</button>`);
  }
  const casePicker = () => `<div class="casos">${IDX.map(c => `<button class="caso" data-act="caso" data-v="${c.slug}" aria-pressed="${c.slug === E.slug}"><b>${esc(c.apellido)}</b><small>${esc(c.titulo.replace(' ' + c.apellido, ''))}</small></button>`).join('')}</div>`;

  // Calendario: 'pay' (primer paso) o 'meet' (reunión con el asesor).
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
      CAL = { kind, day, time, pact: {} };
    }
    const sel = fromIso(CAL.day, CAL.time);
    const months = [...new Set(days.map(x => x.d.toLocaleDateString('es-ES', { month: 'long' })))];
    const head = kind === 'pay'
      ? `<div class="kicker">${w('Vuestro', 'Tu')} primer paso</div><h2>¿Qué día? ${esc(E.primer.titulo)}</h2><p class="muted small">Son diez minutos desde la app del banco. Con día y hora es mucho más fácil que se haga.</p>`
      : `<div class="kicker">Reunión con ${w('vuestro', 'tu')} asesor · ${ns.mins} min</div><h2>${c.yes ? `${w('Elegid', 'Elige')} el día para empezar` : `${w('Elegid', 'Elige')} el día para hablarlo`}</h2><p class="muted small">${ns.text}</p>`;
    sheet(`${head}
      <div class="cal"><div class="cal-head"><b>${months.join(' y ').replace(/^./, x => x.toUpperCase())} de ${days[20].d.getFullYear()}</b>${kind === 'meet' ? '<span class="tiny">Días con hueco, en azul</span>' : ''}</div>
        <div class="cal-grid">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(l => `<span class="dow">${l}</span>`).join('')}
        ${days.map(x => `<button class="day ${x.today ? 'today' : ''}" data-act="calday" data-v="${x.iso}" aria-pressed="${x.iso === CAL.day}" ${x.ok ? '' : 'disabled'} aria-label="${x.d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}">${x.d.getDate()}</button>`).join('')}</div></div>
      <div class="times">${CAL_TIMES[kind].map(t => `<button class="chip" data-act="caltime" data-v="${t}" aria-pressed="${t === CAL.time}">${t}</button>`).join('')}</div>
      <div class="cal-sum"><span class="dc-ic">${ic(kind === 'pay' ? 'card' : 'chat', 22)}</span><div><small>${kind === 'pay' ? `Lo ${w('hacéis', 'haces')} el` : `${w('Vuestra', 'Tu')} reunión`}</small><b>${fmtLong(sel)}</b></div></div>
      ${S.stage === 'pareja' ? pjPact() : ''}
      <button class="btn block" data-act="calok" ${S.stage === 'pareja' && !(CAL.pact && CAL.pact.a && CAL.pact.b) ? 'disabled' : ''}>${kind === 'pay' ? 'Apuntar este día' : 'Pedir esta reunión'}</button>
      <p class="tiny" style="margin-top:10px;text-align:center">${kind === 'pay' ? `Nada mueve dinero desde aquí: el pago lo ${w('hacéis vosotros', 'haces tú')}.` : `Al confirmar, ${w('vuestro', 'tu')} asesor recibe los pasos y las dudas. En este prototipo no se envía nada.`}</p>`);
  }

  // Una semana después: se pide el saldo, no un "ya lo hice".
  const WEEK_REASONS = () => [w('Tenemos dudas', 'Tengo dudas'), w('No sabemos cómo hacerlo', 'No sé cómo hacerlo'), 'Ahora no es prioridad', E.fam.pl ? 'No lo vemos igual los dos' : 'Prefiero hablarlo antes'];
  // real: se abre desde el enlace de la cita del calendario (?semana=1). Si no, es la vista previa.
  function weekSheet(real) {
    const p = E.primer;
    sheet(`<div class="kicker">Una semana después${real ? '' : ' · vista previa'}</div><h2>${esc(p.semana.q)}</h2>
      ${S.phrase ? `<p class="week-why">${w('Lo que os movía', 'Lo que te movía')} hace una semana: <b>«${esc(S.phrase)}»</b></p>` : ''}
      <p class="muted small">${real ? `${w('Miradlo', 'Míralo')} en la app del banco y ${w('escribidlo', 'escríbelo')} aquí.` : 'Esto llegaría a los siete días, con la cita del calendario. Se mira en la app del banco y se escribe aquí.'}</p>
      <div class="moneyin"><input id="bal" type="number" inputmode="numeric" min="0" step="100" placeholder="0" aria-label="Saldo de la tarjeta"><span>$</span></div>
      <div class="chips" style="margin:10px 0 16px"><button class="chip" data-act="weekfill" data-v="${p.despues}">${p.despuesTxt}</button><button class="chip" data-act="weekfill" data-v="${p.hoy}">${p.hoyTxt}, sigue igual</button></div>
      <button class="btn block" data-act="weekok">Comprobar</button>`);
  }
  const meetCtas = () => S.booking ? '<button class="btn block" data-act="close">Seguir</button>' : '<button class="btn block" data-act="book">Pedir reunión</button><button class="link" style="width:100%" data-act="close">Ahora no</button>';
  function weekDone(balance) {
    S.week = { done: true, balance }; S.steps[E.primer.key] = 'yes'; S.done = Object.assign(S.done || {}, { [E.primer.key]: true }); keep();
    sheet(`<div class="celebrate"><div class="burst">${ic('check', 40)}</div><div class="kicker">Paso 1 hecho</div><h2>De ${E.nota.hoy} a ${E.primer.nota}, sin ayuda de nadie.</h2>
      <p>La tarjeta ha bajado a ${M(balance)}. Los pasos que quedan se ven con ${w('vuestro', 'tu')} asesor.</p></div>${meetCtas()}`);
  }
  function weekStuck(balance) {
    sheet(`<div class="kicker">Una semana después</div><h2>¿Qué ${w('os', 'te')} frena?</h2><p class="muted small">No pasa nada. Se lo contamos a ${w('vuestro', 'tu')} asesor.</p>
      ${WEEK_REASONS().map(r => `<button class="opt" data-act="weekwhy" data-b="${balance}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}`);
  }

  // ------------------------------------------------------------------ modo pareja: «Vuestro plan, visto por los dos»
  // Como hacen los asesores con el perfil de riesgo de una pareja: cada uno contesta en privado,
  // en el mismo móvil, y después se comparan las respuestas entre sí y con el plan.
  // Cifras: la del plan, el perfil de riesgo que indicó cada uno y la peor caída real de sus inversiones.
  // Tres partes, cada una con su comparación en cuanto termina: el dinero (en privado), el riesgo (en privado)
  // y, como momento final, los hijos (juntos), contado sin miedo y con lo que recomienda el plan.
  const PJ_ALL = ['intro', 'frase:a', 'money:a', 'risk:a', 'pass:b', 'frase:b', 'money:b', 'risk:b', 'rev:money', 'rev:risk', 'vida', 'rev:vida', 'nota', 'rev:nota', 'map'];
  const RISK = [['sell_all', 'Lo vendería todo', 1, 'x', 'Venderlo todo'], ['sell_part', 'Vendería una parte', 2, 'scale', 'Vender una parte'], ['hold', 'No tocaría nada', 3, 'clock', 'No tocar nada'], ['buy', 'Invertiría más', 4.5, 'seed', 'Invertir más']];
  const pjFresh = () => ({ v: 7, step: 0, frase: { a: null, b: null }, money: { a: null, b: null }, vida: null, nota: null, risk: { a: null, b: null }, guess: { a: null, b: null } });
  const pIdx = x => (x === 'b' ? 1 : 0), other = x => (x === 'a' ? 'b' : 'a');
  const pName = x => E.fam.adultos[pIdx(x)].nombre;
  const pAv = (x, sz = '') => `<span class="pj-av ${x} ${sz}" aria-hidden="true">${esc(pName(x).charAt(0))}</span>`;
  const pDuo = (sz = 'sm') => `<span class="pj-duo ${sz}">${pAv('a')}${pAv('b')}</span>`;
  const riskOpt = id => RISK.find(r => r[0] === id) || null;
  const perfil = x => (E.pareja && E.pareja.perfiles[pIdx(x)]) || null;
  const pLab = p => !p ? 'sin dato' : PRO() ? `${p.etiqueta} (${p.riesgo})` : p.etiqueta;
  const escala = () => (E.pareja && E.pareja.escala) || ['Muy prudente', 'Prudente', 'Equilibrado', 'Dinámico', 'Atrevido'];
  // La pregunta de dinero sigue al estudio: el primer freno con cifra (Weah, la tarjeta; Johnson, el colchón).
  const numQ = q => q && q.tipo !== 'opciones' && q.id !== 'vida' && q.id !== 'nota' && q.min != null;
  // Entre las preguntas con cifra, la del área que peor va (no se elige un tema cuya área va bien); a igualdad, el orden de frenos del estudio.
  const AREA_DE = { tarjeta_interes: 'Deudas', colchon: 'Colchón' };
  const areaNota = q => { const a = (E.areas || []).find(x => x.nombre === AREA_DE[q.id]); return a ? a.nota : 50; };
  const moneyQ = () => { const fr = E.frenos || [], c = E.preguntas.filter(numQ); if (!c.length) return null;
    const rk = q => (fr.indexOf(q.id) < 0 ? 99 : fr.indexOf(q.id));
    return c.slice().sort((x, y) => areaNota(x) - areaNota(y) || rk(x) - rk(y))[0]; };
  // La pregunta de los hijos llega como opciones; aBarra la pasa a la edad del hijo mayor con las cifras del estudio.
  const vidaQ = () => { const q = E.preguntas.find(p => p.id === 'vida'); return q ? aBarra(q) : null; };
  // La nota de salud financiera la adivinan juntos justo antes del final: el anillo llega con su marca.
  const notaQ = () => (E.nota && E.nota.hoy != null ? { id: 'nota', tipo: 'num', min: 0, max: 100, step: 1, sufijo: '', real: E.nota.hoy, q: 'Del 0 al 100, ¿qué nota de salud financiera creéis que os pone vuestro estudio?', sub: 'La calcula con vuestro ahorro, deudas, inversiones, colchón y seguros.' } : null);
  const pjSteps = () => PJ_ALL.filter(s => (vidaQ() || !/vida/.test(s)) && (notaQ() || !/nota/.test(s)));
  const pjAt = () => pjSteps()[S.pj.step];
  const pjDone = () => !!(S.pj && S.pj.v === 7 && pjAt() === 'map');
  const kidsTxt = () => { const n = E.fam.hijos.map(k => k.nombre); return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n[0] || ''; };
  const partVida = () => (E.fam.hijos.length ? (E.fam.hijos.length > 1 ? 'Vuestros hijos' : kidsTxt()) : 'Vuestra familia');
  const isClose = (q, v) => Math.abs(v - q.real) <= (q.tipo === 'importe' ? q.cerca * q.real : q.cerca);
  const moneyClose = x => isClose(moneyQ(), S.pj.money[x]);
  const vidaClose = () => isClose(vidaQ(), S.pj.vida);
  // Distancia entre lo que haría ante una caída y el perfil que indicó en el plan (escala de Sherpas, 1 a 5).
  const encaje = x => { const p = perfil(x), r = riskOpt(S.pj.risk[x]); if (!p || !p.nivel || !r) return 'ok'; const d = r[2] - p.nivel; return d <= -1.5 ? 'prudente' : d >= 1.5 ? 'arriesgado' : 'ok'; };
  const ENCAJE = { ok: () => 'Encaja con su perfil', prudente: () => 'Más prudente que su perfil', arriesgado: () => 'Más arriesgado que su perfil' };
  const aciertos = () => ['a', 'b'].reduce((n, x) => n + (S.pj.guess[x] && S.pj.guess[x] === S.pj.risk[other(x)] ? 1 : 0), 0);
  const pjAdv = () => { S.pj.step = Math.min(S.pj.step + 1, pjSteps().length - 1); if (pjAt() === 'map') pjAgenda(); render(); window.scrollTo(0, 0); };
  const pjGo = () => swipe(pjAdv);
  // Tras «Guardar en secreto» la pantalla ya se ha ido con un fundido: la siguiente entra igual, sin otro deslizamiento.
  const pjGoFade = () => { pjAdv(); const n = app.lastElementChild; if (n) n.classList.add('fd-in'); };
  const titMoney = () => { const ca = moneyClose('a'), cb = moneyClose('b'); return ca && cb ? 'Los dos lo teníais claro' : !ca && !cb ? 'A los dos se os escapaba' : 'Lo veíais distinto'; };
  // Con la edad del hijo mayor (aBarra) se dice «hasta los X años de Liam»; si no, la cifra tal cual.
  const vidaK = () => { const q = vidaQ(), k = E.fam.hijos[0]; return q && q.vis && q.vis.base != null && k ? k.nombre : null; };
  const vidaDijo = (v, html) => { const q = vidaQ(), k = vidaK(), B = t => (html ? `<b>${t}</b>` : t);
    return k ? `creíais que el seguro llegaba hasta los ${v} años de ${esc(k)}; llega hasta los ${B(q.real)}` : `decíais ${esc(showV(q, v))}; el estudio dice ${B(esc(q.plan))}`; };
  // Una sola medida por frase: la edad del hijo para lo que creían y lo que hay; años de gastos para lo que recomienda el plan.
  const vidaFound = () => { const q = vidaQ(), v = q.vis || {}, k = vidaK();
    if (!k) return `${cap1(vidaDijo(S.pj.vida, true))}.${vidaRec() ? ` Lo que recomienda el plan: ${esc(vidaRec())}.` : ''}`;
    const rec = v.total ? ` El plan recomienda <b>${v.total} años</b> de gastos${v.base + v.total <= 25 ? `, hasta los ${v.base + v.total} de ${esc(k)}` : ''}; hoy son ${v.on}.` : '';
    return `Creíais que el seguro llegaba hasta los ${S.pj.vida} años de ${esc(k)}; llega hasta los <b>${q.real}</b>.${rec}`; };
  const vidaJunto = () => { const q = vidaQ(), k = vidaK(); return k ? `creían que cubría hasta los ${S.pj.vida} años de ${k} (estudio: hasta los ${q.real})` : `${showV(q, S.pj.vida)} (estudio: ${q.plan})`; };
  const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
  const titVida = () => { const q = vidaQ(), k = vidaK(); return k ? `Hoy, hasta los ${q.real} años de ${k}` : `Hoy, ${q.plan}`; };
  // Lo mínimo que recomienda el plan (vis.total = cobertura mínima recomendada / gastos de casa, en años).
  const vidaRec = () => { const v = vidaQ().vis || {}, k = vidaK(); if (!v.total) return '';
    return k && v.base + v.total <= 25 ? `hasta los ${v.base + v.total} años de ${k}` : `${v.total} años de gastos de casa (hoy, ${v.on})`; };

  // Qué propone el plan para cada dato: su paso si lo tiene; si no, lo que dice la línea del plan y se pregunta al asesor.
  const PASO_DE = { tarjeta_interes: 'card', vida: 'life' };
  function planPara(qid) {
    const key = PASO_DE[qid], p = key && E.pasos.find(s => s.key === key);
    if (p) return { tit: `Paso ${p.n} de ${E.pasos.length}: ${p.titulo}`, txt: p.porque, quien: p.quien };
    const q = E.preguntas.find(x => x.id === qid), v = q && q.vis;
    if (v && v.t === 'meses' && v.min) return { lab: 'Lo que recomienda vuestro plan', tit: `De ${v.min} a ${v.max} meses de colchón`, txt: `No es uno de los pasos del plan: lo veis con vuestro asesor.` };
    const wl = key && (E.linea || []).find(l => l.c === 'warn' && l.key === key);
    if (wl) return { lab: 'En vuestro plan', tit: 'Aún no es uno de sus pasos', txt: (/hasta aquí/.test(wl.t) ? wl.t.replace('hasta aquí', 'hasta ' + wl.anio) : `${wl.t} (${wl.anio})`) + '. Lo vemos con vuestro asesor.', sin: wl };
    return null;
  }

  // Temas para la reunión que salen de la comparación. Se apuntan como preguntas abiertas para el asesor.
  function pjTemas() {
    const pa = perfil('a'), pb = perfil('b'), q = moneyQ(), vq = vidaQ(), t = [];
    if (pa && pb && pa.nivel !== pb.nivel) t.push(`Cuánto riesgo queremos como familia: ${pa.nombre} indicó ${low1(pa.etiqueta)} y ${pb.nombre}, ${low1(pb.etiqueta)}.`);
    ['a', 'b'].forEach(x => { const e = encaje(x), r = riskOpt(S.pj.risk[x]); if (e !== 'ok') t.push(`${pName(x)} indicó un perfil ${low1(perfil(x).etiqueta)}, pero ante una caída ${low1(r[1])}.`); });
    if (S.pj.risk.a && S.pj.risk.b && S.pj.risk.a !== S.pj.risk.b) t.push(`Ante una caída no haríamos lo mismo: ${pName('a')} ${low1(riskOpt(S.pj.risk.a)[1])} y ${pName('b')} ${low1(riskOpt(S.pj.risk.b)[1])}.`);
    if (!moneyClose('a') && !moneyClose('b')) t.push(`Ninguno de los dos sabía este dato del estudio: ${low1(q.creian || q.q)} (${q.plan}).`);
    const pm = planPara(q.id); if (pm && pm.sin) t.push(`¿Qué hacemos con la tarjeta? ${pm.txt.replace(' Lo vemos con vuestro asesor.', '')}`);
    if (vq && S.pj.vida != null && !vidaClose()) t.push(`Seguro de vida: ${vidaDijo(S.pj.vida, false).replace('creíais', 'creíamos')}.`);
    return t;
  }
  function pjAgenda() {
    S.doubts = S.doubts.filter(d => !/^pj-/.test(d.id));
    pjTemas().forEach((q, i) => S.doubts.push({ id: 'pj-' + i, topic: 'otra', q, covered: 'no', status: 'open' }));
  }

  const pjParts = () => ['frase', 'money', 'risk', ...(vidaQ() ? ['vida'] : []), ...(notaQ() ? ['nota'] : [])];
  const pjPart = (k, name) => `<div class="pj-round"><span>Parte ${pjParts().indexOf(k) + 1} de ${pjParts().length}</span><b>${esc(name)}</b></div>`;
  function pjPass(x) {
    return `<div class="pj-pass ${x}"><div class="pj-pass-in">
      ${pAv(x, 'xl')}
      <p class="pj-kick dark">Turno de</p>
      <h2>${esc(pName(x))}</h2>
      <p class="pj-hide">${ic('lock', 16)} ${x === 'a' ? `Contesta en privado. Lo veréis juntos al terminar.` : `Las respuestas de ${esc(pName(other(x)))} quedan ocultas.`}</p>
      <button class="btn block pj-btn ${x}" data-act="pjgo">Soy ${esc(pName(x))}, continuar</button>
    </div></div>`;
  }
  // Como en el quiz individual: la pregunta entra en el centro y después sube y se amplía con las respuestas (introQ).
  let PJ_IN = null, PJ_NEW = false;
  const pjAsk = (cls, who, part, head, body, foot) => `<div class="narrow pj-turn ${cls} qstage ${PJ_NEW ? 'intro' : ''}"><div class="qhead">${who}${part}${head}</div>
      <div class="qbody"><div class="pj-card">${body}</div></div>${foot || ''}</div>`;
  const pjWho = x => `<div class="pj-who">${pAv(x)}<span>Respuesta privada de <b>${esc(pName(x))}</b></span>${ic('lock', 16)}</div>`;
  const pjCard = (x, part, head, body, foot) => pjAsk(x, pjWho(x), part, head, body, foot);
  const pjQHead = q => `<h2 class="q">${esc(q.q)}</h2>${q.sub ? `<p class="muted small pj-qsub">${esc(q.sub)}</p>` : ''}`;
  function pjSlider(q, v, key) {
    const st = q.step || 1, mid = Math.round((q.min + q.max) / 2 / st) * st, has = v != null;
    return `<div class="numw"><div class="nw-val ${has ? '' : 'empty'}" id="pjamt">${has ? showV(q, v) : '?'}</div>
      <div class="nw-track"><input type="range" min="${q.min}" max="${q.max}" step="${st}" value="${has ? v : mid}" class="${has ? '' : 'untouched'}" data-act="pjrange" data-k="${key}" aria-label="${esc(q.q)}">${has ? '' : '<i class="nw-hint" aria-hidden="true"></i>'}</div>
      <div class="spread tiny"><span>${showV(q, q.min)}</span><span>${showV(q, q.max)}</span></div></div>`;
  }
  function pjMoney(x) {
    const has = S.pj.money[x] != null;
    return pjCard(x, pjPart('money', 'Vuestro dinero'), pjQHead(moneyQ()), pjSlider(moneyQ(), S.pj.money[x], x),
      `<div class="dock"><button class="btn block pj-btn ${x}" data-act="pjgo" id="pjsave" ${has ? '' : 'disabled'}>Guardar respuesta</button></div>`);
  }
  // Como en el quiz abierto: primero sus palabras. Aquí cada uno por separado, en privado.
  function pjFrase(x) {
    const f = S.pj.frase[x], kids = E.fam.hijos.map(k => k.nombre);
    return pjCard(x, pjPart('frase', 'Lo que te ronda la cabeza'), `<h2 class="q">¿Qué es lo que más te ronda la cabeza con el dinero?</h2>
      <p class="muted small pj-qsub">Con tus palabras. No se enseña a ${esc(pName(other(x)))}: es para vuestro asesor, para preparar la reunión.</p>`,
      `${suggTiles('pjfsugg', f)}
      <p class="tiny sugg-t">O escríbelo con tus palabras:</p>
      <textarea id="pjfrase" class="free" rows="3" maxlength="240" data-x="${x}" placeholder="${esc(kids.length ? `Por ejemplo: que a ${kids.join(' y ')} no les falte de nada` : 'Por ejemplo: llegar tranquilos a la jubilación')}">${esc(f || '')}</textarea>`,
      `<div class="dock"><button class="btn block pj-btn ${x}" data-act="pjfrase" data-x="${x}" id="pjfsave" ${f ? '' : 'disabled'}>Guardar en secreto</button><button class="link block skipw" data-act="pjfrase" data-x="${x}" data-v="skip">Prefiero no escribir</button></div>`);
  }
  // Lo que le ronda a cada uno es solo para el asesor: no va a la portada, al calendario ni a lo que veis juntos.
  const pjFrases = () => !!(S.pj && S.pj.frase && (S.pj.frase.a || S.pj.frase.b));
  function pjFraseSet() {
    S.doubts = S.doubts.filter(d => !/^nota-ronda/.test(d.id));
    ['a', 'b'].forEach(x => { if (S.pj.frase[x]) S.doubts.push({ id: 'nota-ronda-' + x, topic: 'otra', q: `Lo que le ronda la cabeza a ${pName(x)}: «${S.pj.frase[x]}»`, covered: 'no', status: 'open' }); });
  }
  function pjVida() {
    const has = S.pj.vida != null;
    return pjAsk('duo', `<div class="pj-who">${pDuo()}<span>Esta la <b>contestáis juntos</b></span></div>`, pjPart('vida', partVida()), pjQHead(vidaQ()), pjSlider(vidaQ(), S.pj.vida, 'vida'),
      `<div class="dock"><button class="btn block" data-act="pjgo" id="pjsave" ${has ? '' : 'disabled'}>Ver lo que dice el estudio</button></div>`);
  }
  function pjNota() {
    const has = S.pj.nota != null;
    return pjAsk('duo', `<div class="pj-who">${pDuo()}<span>Una última, <b>juntos</b></span></div>`, '', pjQHead(notaQ()), pjSlider(notaQ(), S.pj.nota, 'nota'),
      `<div class="dock"><button class="btn block" data-act="pjgo" id="pjsave" ${has ? '' : 'disabled'}>Ver vuestra nota</button></div>`);
  }
  function pjTiles(x, kind) {
    return `<div class="pj-tiles" role="group">${RISK.map(([v, , , i, s], k) => `<button class="pj-tile ${x}" style="--i:${k}" data-act="pjpick" data-k="${kind}" data-x="${x}" data-v="${v}" aria-pressed="${S.pj[kind][x] === v}">${ic(i, 20)}<span>${s}</span></button>`).join('')}</div>`;
  }
  function pjRisk(x) {
    const c = E.pareja && E.pareja.caida, done = S.pj.risk[x] && S.pj.guess[x];
    const head = c ? `En los últimos 3 años, vuestras inversiones llegaron a caer un <b>${esc(c.txt)}</b>. Si mañana volviera a pasar:` : 'Si mañana vuestras inversiones cayeran de golpe:';
    return pjCard(x, pjPart('risk', 'Vuestro riesgo'), `<h2 class="q">${head}</h2>${PRO() && c ? `<p class="tiny">Caída máxima de la cartera del hogar en 3 años, según el análisis de inversiones de vuestro estudio.</p>` : ''}`,
      `<h3 class="pj-sub">¿Qué harías tú?</h3>${pjTiles(x, 'risk')}
      <h3 class="pj-sub">¿Y qué haría <span class="pj-name ${other(x)}">${esc(pName(other(x)))}</span>?</h3>${pjTiles(x, 'guess')}`,
      `<div class="dock"><button class="btn block pj-btn ${x}" data-act="pjgo" id="pjsave" ${done ? '' : 'disabled'}>Guardar respuesta</button></div>`);
  }
  function pjTrack(q) {
    const va = S.pj.money.a, vb = S.pj.money.b, lo = Math.min(q.min, va, vb, q.real), hi = Math.max(q.max, va, vb, q.real), P = v => (v - lo) / (hi - lo || 1) * 100;
    const used = { top: [], bot: [], bot2: [] };
    const mk = (cls, v, lab) => { const x = P(v), row = ['top', 'bot', 'bot2'].find(r => used[r].every(y => Math.abs(y - x) > 18)) || 'bot2'; used[row].push(x);
      return `<span class="pj-mk ${cls} ${row}" style="left:${x}%"><i></i><small>${lab}</small></span>`; };
    const da = Math.abs(va - q.real), db = Math.abs(vb - q.real), win = da < db ? 'a' : db < da ? 'b' : '';
    const gap = (c, v) => `<span class="pj-gap ${c}" style="left:${Math.min(P(v), P(q.real))}%;width:${Math.abs(P(v) - P(q.real))}%"></span>`;
    return `<div class="pj-track" aria-hidden="true"><div class="pj-line"></div>${gap('a', va)}${gap('b', vb)}${mk('plan', q.real, 'Estudio')}${mk('a' + (win === 'a' ? ' win' : ''), va, esc(pName('a')))}${mk('b' + (win === 'b' ? ' win' : ''), vb, esc(pName('b')))}</div>`;
  }
  // Qué propone el plan, en la misma revelación del dato.
  const pjPropLine = (prop, extra) => !prop ? '' : `<div class="pj-prop pj-prop-r"><small>${prop.lab || 'Vuestro plan propone'}</small><b>${esc(prop.tit)}</b>${extra ? `<span>${esc(extra)}</span>` : prop.quien ? `<span>${prop.quien === 'familia' ? 'Lo podéis hacer vosotros' : 'Con vuestro asesor'}</span>` : prop.txt ? `<span>${esc(prop.txt)}</span>` : ''}</div>`;
  // Riesgo: no es un paso del plan; se revisa con el asesor si no encaja o si cada uno indicó un perfil distinto.
  const riskProp = () => { const pa = perfil('a'), pb = perfil('b'); if (!pa || !pb) return null; const off = ['a', 'b'].filter(x => encaje(x) !== 'ok');
    return { lab: 'Lo veis con vuestro asesor', tit: off.length ? `Revisar el perfil de ${off.map(pName).join(' y ')}` : pa.nivel !== pb.nivel ? 'Decidir juntos cuánto riesgo queréis' : 'Seguir con el perfil que indicasteis', revisar: !!off.length || pa.nivel !== pb.nivel }; };
  function pjRevMoney() {
    const q = moneyQ();
    return `<div class="narrow pj-rev">${pjPart('money', 'Vuestro dinero')}
      <h2 class="pj-tit">${esc(titMoney())}</h2>
      <div class="pj-says"><div class="a">${pAv('a')}<small>${esc(pName('a'))}</small><b>${esc(showV(q, S.pj.money.a))}</b></div><div class="b">${pAv('b')}<small>${esc(pName('b'))}</small><b>${esc(showV(q, S.pj.money.b))}</b></div></div>
      <div class="rv-box pj-plan"><small>Vuestro estudio dice</small><b class="big">${esc(q.plan)}</b><em>${esc(q.unidad)}</em></div>
      ${pjTrack(q)}
      ${pjPropLine(planPara(q.id))}
      ${q.siente ? `<p class="rv-feel on">${q.siente}</p>` : ''}
      ${pjRoute(q)}
      ${dock('Seguir: vuestro riesgo', true, 'pjgo')}</div>`;
  }
  function pjRevVida() {
    const q = vidaQ(), rec = vidaRec();
    return `<div class="narrow pj-rev pj-revv">${pjPart('vida', partVida())}
      <div class="pj-says one"><div>${pDuo()}<small>Decíais</small><b>${esc(showV(q, S.pj.vida))}</b></div></div>
      <div class="rv-box pj-plan"><small>Vuestro estudio dice</small><b class="big">${esc(q.plan)}</b><em>${esc(q.unidad)}</em></div>
      <h2 class="pj-tit">${esc(titVida())}</h2>
      ${pjPropLine(planPara('vida'), rec ? `Lo que recomienda: ${rec}` : '')}
      <div class="rv-vis pj-vis">${vis(q)}</div>
      ${pjRoute(q)}
      ${dock(notaQ() ? 'Una última pregunta' : 'Ver qué propone vuestro plan', true, 'pjgo')}</div>`;
  }
  function pjScale(rows) {
    const L = escala();
    return `<div class="pj-scale" aria-hidden="true"><div class="pj-sc-bar">${L.map((_, i) => `<i style="left:${i / (L.length - 1) * 100}%"></i>`).join('')}</div>
      ${rows.map(([cls, lvl, lab, k]) => `<span class="pj-dot ${cls}" style="left:${(lvl - 1) / (L.length - 1) * 100}%;--k:${k}">${lab ? `<small>${lab}</small>` : ''}</span>`).join('')}
      <div class="pj-sc-lab"><span>${L[0]}</span><span>${L[L.length - 1]}</span></div></div>`;
  }
  function pjRevRisk() {
    const c = E.pareja && E.pareja.caida, n = aciertos();
    const col = x => { const r = riskOpt(S.pj.risk[x]), g = riskOpt(S.pj.guess[other(x)]), ok = S.pj.guess[other(x)] === S.pj.risk[x], p = perfil(x), e = encaje(x);
      return `<div class="pj-col ${x}">${pAv(x)}<small>${esc(pName(x))} haría</small><b>${esc(r ? r[1] : '')}</b>
        <p class="pj-thought ${ok ? 'ok' : 'ko'}">${ic(ok ? 'check' : 'x', 16)} ${esc(pName(other(x)))} creía: ${esc(g ? low1(g[1]) : '')}</p>
        ${p ? `<span class="pj-chip ${e}">${ic(e === 'ok' ? 'check' : 'help', 14)} ${ENCAJE[e]()}: ${esc(low1(pLab(p)))}</span>` : ''}</div>`; };
    const pa = perfil('a'), pb = perfil('b'), rows = [];
    if (pa && pa.nivel) rows.push(['a fill', pa.nivel, esc(pName('a')), 0]);
    if (pb && pb.nivel) rows.push(['b fill', pb.nivel, esc(pName('b')), 1]);
    rows.push(['a ring', riskOpt(S.pj.risk.a)[2], '', 2], ['b ring', riskOpt(S.pj.risk.b)[2], '', 3]);
    return `<div class="narrow pj-rev">${pjPart('risk', 'Vuestro riesgo')}
      <h2 class="pj-tit">${n === 2 ? 'Sabéis lo que haría el otro' : 'Ante una caída, no siempre sabéis qué haría el otro'}</h2>
      <div class="pj-cols">${col('a')}${col('b')}</div>
      <div class="card pj-mapcard">${pjScale(rows)}<p class="tiny"><span class="pj-key fill"></span> indicado en el estudio &nbsp; <span class="pj-key ring"></span> lo que haría ante una caída</p></div>
      ${pjPropLine(riskProp())}
      ${c && c.dias ? `<p class="small pj-note">${ic('clock', 16)} Aquella caída del ${esc(c.txt)} se recuperó en ${c.dias} días.</p>` : ''}
      ${pjRoute(null)}
      ${dock(vidaQ() ? `Seguir: ${esc(partVida().replace(/^Vuestr/, 'vuestr'))}` : notaQ() ? 'Una última pregunta' : 'Ver qué propone vuestro plan', true, 'pjgo')}</div>`;
  }
  // La fecha la confirman los dos antes de apuntarla.
  const pjPact = () => `<div class="pj-pact"><small>Lo confirmáis los dos</small><div>${['a', 'b'].map(x => `<button class="pj-thumb ${x}" data-act="pjpact" data-x="${x}" aria-pressed="${!!(CAL && CAL.pact && CAL.pact[x])}">${pAv(x)} ${esc(pName(x))} ${ic('check', 16)}</button>`).join('')}</div></div>`;
  const pjCalBtn = k => (window.__PREVIEW__ ? '' : `<button class="btn block ghost-w" data-act="ics" data-k="${k}">${ic('cal', 18)} Añadir al calendario del móvil</button>`);
  // La nota: revelación propia, con la marca de lo que dijeron y su porqué (las cinco áreas).
  function pjRevNota() {
    const n = E.nota, g = S.pj.nota, ar = E.areas || [], low = ar.length ? ar.reduce((m, x) => (x.nota < m.nota ? x : m)) : null;
    return `<div class="narrow pj-rev pj-revn">${pjPart('nota', 'Vuestra nota')}
      <div class="pj-says one"><div>${pDuo()}<small>Decíais</small><b>${g}</b></div></div>
      <div class="pj-salud"><div class="pj-ringw">${ring(n.hoy, n.max, true)}<i class="pj-guess" style="--a:${g / 100 * 360}deg" aria-hidden="true"></i></div>
        <div><small>Vuestro estudio dice</small><b class="pj-big">${n.hoy} de 100</b></div></div>
      ${ar.length ? `<div class="pj-areas">${ar.map(x => `<div class="pj-ar ${x === low ? 'low' : ''}"><span>${esc(x.nombre)}</span><i><b style="width:${x.nota}%"></b></i><em>${x.nota}</em></div>`).join('')}</div>` : ''}
      ${low ? `<h2 class="pj-tit sm">Lo que más baja vuestra nota: ${esc(low1(low.nombre))}</h2>` : ''}
      ${pjRoute({ id: 'nota' })}
      ${dock('Ver qué propone vuestro plan', true, 'pjgo')}</div>`;
  }
  // Todos los pasos del plan: la nota que deja cada uno (combos), lo que suma y quién lo hace.
  function pjLadder(mine) {
    const P = E.pasos || [], n = E.nota; if (!P.length || !n) return { html: '', total: 0, asesor: 0 };
    let prev = n.hoy, asesor = 0;
    const rows = P.map((p, i) => { const key = P.slice(0, i + 1).map(x => x.key).sort().join('|'), v = i === 0 ? p.nota : (E.combos || {})[key];
      const nota = v != null ? v : prev, gain = nota - prev; if (p.quien === 'asesor') asesor += gain; prev = nota;
      const jub = /retire/i.test((p.plan && p.plan.action) || '');
      return `<li class="${mine && mine.steps.has(p.key) ? 'mine' : ''}"><span class="pj-ln">${i + 1}</span><div><b>${esc(PRO() && p.tituloPro ? p.tituloPro : p.titulo)}</b><small>${mine && mine.steps.has(p.key) ? '<i>Vuestro motivo</i> · ' : ''}${p.quien === 'familia' ? 'Lo podéis hacer vosotros' : 'Con vuestro asesor'}${gain === 0 ? ` · No cambia la nota de hoy${jub ? ': es ahorro para la jubilación' : ''}` : ''}</small></div><em>${nota}<small>${gain > 0 ? '+' + gain : '='}</small></em></li>`; }).join('');
    return { html: `<ol class="pj-ladder"><li class="now"><span class="pj-ln">${ic('flag', 14)}</span><div><b>Hoy</b></div><em>${n.hoy}</em></li>${rows}</ol>`, total: prev - n.hoy, asesor };
  }
  // Objetivos de la línea del plan, con su año e importe; la jubilación siempre (es la que trae dato).
  // Lo que su frase toca: objetivos de la línea cuyo nombre aparece en ella y pasos del plan de sus temas.
  const TEMA_LAB = { tarjeta: 'qué hacer con la tarjeta', vida: 'vuestro seguro de vida', colchon: 'vuestro colchón', jubilacion: 'vuestra jubilación', inversion: 'vuestras inversiones' };
  function pjMine() {
    const f = S.phrase ? sinTilde(S.phrase) : '', goals = new Set(), steps = new Set(); if (!f) return { goals, steps, extra: [] };
    (E.linea || []).forEach(l => { const w0 = sinTilde(l.t).replace(/^(el|la|los|las)\s+/, '').split(/\s+/)[0]; if (w0.length > 3 && f.includes(w0)) goals.add(l); });
    const keys = new Set((E.pasos || []).map(x => x.key)), extra = [];
    temasDe(S.phrase).forEach(id => { const k = PASO_DE[id], q = QMAP[id];
      if (k && keys.has(k)) steps.add(k); else if (q && TEMA_LAB[q.tema] && !extra.includes(TEMA_LAB[q.tema])) extra.push(TEMA_LAB[q.tema]); });
    return { goals, steps, extra };
  }
  function pjGoals(mine) {
    const L = E.linea || [], g = L.filter(l => l.c === 'goal' && !/^Universidad/.test(l.t)).slice(0, 3), end = L.find(l => l.c === 'end');
    const all = [...g, ...(end ? [end] : [])]; if (!all.length) return '';
    return `<div class="pj-goals"><small>Vuestros objetivos en el plan</small><div>${all.map(l => `<span class="${mine.goals.has(l) ? 'mine' : ''}">${ic(l.icon, 14)} ${esc(l.t)} · ${l.anio}${l.s ? ` · ${esc(l.s)}` : ''}${mine.goals.has(l) ? ' · <b>vuestro motivo</b>' : ''}</span>`).join('')}</div></div>`;
  }
  // Lo que se hace con el asesor: sus pasos y, si hace falta, revisar el perfil de riesgo.
  function pjConLista() {
    const rp = riskProp(), con = (E.pasos || []).filter(x => x.quien === 'asesor').map(x => low1(x.titulo)).concat(rp && rp.revisar ? ['revisar vuestro perfil de riesgo'] : [], pjMine().extra.map(t => t + ' (vuestro motivo)'));
    return con.length > 1 ? con.slice(0, -1).join(', ') + ' y ' + con[con.length - 1] : con[0] || 'revisar el plan';
  }
  // Lo que el asesor ya sabe de ellos: su motivo, lo que creía cada uno frente al plan y lo que no encaja.
  function pjGets() {
    const q = moneyQ(), vq = vidaQ(), n = E.nota, out = [], pa = perfil('a'), pb = perfil('b');
    if (S.phrase) out.push(`Lo que os ronda la cabeza: «${S.phrase}»`);
    if (q) { const va = showV(q, S.pj.money.a), vb = showV(q, S.pj.money.b);
      out.push(`${q.creian || 'Vuestro dato'}: ${va === vb ? `los dos creíais ${va}` : `${pName('a')} creía ${va} y ${pName('b')}, ${vb}`}; el estudio dice ${q.plan}.`); }
    if (vq && S.pj.vida != null) { const k = vidaK(); out.push(`Seguro de vida: ${k ? `creíais que cubría hasta los ${S.pj.vida} años de ${k}; el estudio dice hasta los ${vq.real}` : `creíais ${showV(vq, S.pj.vida)}; el estudio dice ${vq.plan}`}.`); }
    if (n && S.pj.nota != null) out.push(`Nota de salud financiera: creíais ${S.pj.nota}; el estudio dice ${n.hoy}.`);
    const ra = riskOpt(S.pj.risk.a), rb = riskOpt(S.pj.risk.b);
    const mq = pjMyQs(); if (mq.length) out.push(`Lo que queréis que os conteste: ${mq.map(d => `«${d.q}»`).join('; ')}.`);
    if (ra && rb) out.push(`Ante una caída: ${pName('a')} ${low1(ra[1])}${pa ? ` (perfil ${low1(pa.etiqueta)})` : ''}; ${pName('b')} ${low1(rb[1])}${pb ? ` (perfil ${low1(pb.etiqueta)})` : ''}. ${aciertos() === 2 ? 'Los dos sabíais lo que haría el otro.' : `Acertasteis ${aciertos()} de 2 sobre el otro.`}`);
    return out.map(t => t.replace(/(\d) (\$|%|años|meses)/g, '$1\u00a0$2'));
  }
  const pjMyQs = () => S.doubts.filter(d => /^pjq-/.test(d.id));
  function pjBooked(back) {
    const cats = (E.dudas || []).filter(c => c.id !== 'otra'), g = (E.linea || []).find(l => l.c === 'goal' && !/^Universidad/.test(l.t)), mq = pjMyQs();
    const eg = g ? `si adelantamos ${low1(g.t)}, ¿afecta a la jubilación?` : 'si nos compramos un coche, ¿nos cargamos la jubilación?';
    sheet(`${back ? `<div class="kicker">Vuestra reunión</div><h2>${esc(S.booking.label)}</h2>` : `<div class="celebrate"><div class="burst">${ic('check', 40)}</div><div class="kicker">Reunión pedida</div><h2>${esc(S.booking.label)}</h2>`}
      <p>Con vuestro asesor: ${esc(pjConLista())}.</p>${back ? '' : '</div>'}
      <div class="pj-myq"><label class="pj-h3" for="pjq">¿Qué queréis que os conteste ese día? <i>(opcional)</i></label>
        ${cats.length ? `<div class="pj-qcats" role="group" aria-label="Tema">${cats.map(c => `<button class="chip" data-act="pjqcat" data-v="${c.id}" aria-pressed="${S.cat === c.id}">${ic(c.icon, 14)} ${esc(c.label)}</button>`).join('')}</div>` : ''}
        <div class="pj-whyw"><input id="pjq" maxlength="160" placeholder="Vuestra pregunta" value="${esc(DRAFT)}"><button class="btn" data-act="pjq">Apuntar</button></div>
        <p class="small muted">${mq.length ? `Apuntadas: ${mq.length}. Podéis añadir más hasta el día de la reunión.` : `Por ejemplo: «${esc(cap1(eg))}»`}</p></div>
      <h3 class="pj-h3">Lo que vuestro asesor ya sabe de vosotros</h3><ul class="pj-knows">${pjGets().map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      ${pjCalBtn('meet').replace('ghost-w', 'soft')}
      <button class="btn ghost block" data-act="close" style="margin-top:8px">Seguir</button>`);
  }
  // Cierre: lo que propone el plan y una sola acción, la reunión, con el botón fijo abajo.
  function pjMap() {
    const temas = pjTemas(), p = E.primer, lista = pjConLista(), mine = pjMine(), lad = pjLadder(mine);
    return `<div class="narrow pj-rev pj-map">
      <p class="pj-kick dark">Lo que propone vuestro plan</p>
      <h2 class="pj-tit">De ${E.nota.hoy} a ${E.nota.max}${lad.total > 0 && lad.asesor ? `: ${lad.asesor} de los ${lad.total} puntos llegan con vuestro asesor` : ''}</h2>
      ${lad.html}
      ${pjGoals(mine)}
      <div class="pj-meet"><small>${ic('chat', 16)} El siguiente paso: la reunión</small>
        <p>Con vuestro asesor: ${esc(lista)}. Ya tendrá lo que habéis contestado${S.phrase || pjFrases() ? ' y lo que le ronda la cabeza a cada uno, con sus palabras' : ''}.</p>
        ${S.booking ? `<button class="link pj-addq" data-act="pjbooked">${ic('pen', 16)} ${pjMyQs().length ? `Vuestras preguntas para ese día: ${pjMyQs().length} · añadir` : 'Apuntar lo que queréis que os conteste'}</button>${pjCalBtn('meet').replace('ghost-w', 'ghost')}` : ''}</div>
      ${p ? `<div class="pj-before"><small>Antes de ir, si queréis</small><h3>${esc(p.titulo)}</h3>
        <p class="small">${p.urgencia}</p>
        ${S.payDate ? `<div class="datechip"><span class="dc-ic">${ic('cal', 22)}</span><div><small>Lo hacéis el</small><b>${esc(S.payDate.label)}</b></div><button class="link small" data-act="cal" data-k="pay">Cambiar</button></div>
          ${pjCalBtn('pay').replace('ghost-w', 'ghost')}
          <button class="weeklink" data-act="week">${ic('clock', 18)}<span><b>Una semana después</b><small>El calendario os lo recuerda y el enlace abre la comprobación del saldo</small></span>${ic('arrow', 18)}</button>`
          : `<button class="btn ghost block" data-act="cal" data-k="pay">${ic('cal', 18)} Elegir el día</button>`}</div>` : ''}
      <details class="pj-gets"><summary>${ic('chat', 14)} Lo que vuestro asesor ya sabe de vosotros</summary><ul>${pjGets().map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>
      <div class="pj-cta"><button class="btn ghost block" data-act="pjplan">Ver vuestro plan ${ic('arrow', 18)}</button><button class="link block" data-act="pjagain">Volver a empezar</button></div>
      <div class="dock pj-dock">${S.booking ? `<div class="datechip"><span class="dc-ic">${ic('chat', 22)}</span><div><small>Vuestra reunión</small><b>${esc(S.booking.label)}</b></div><button class="link small" data-act="book">Cambiar</button></div>`
        : `<button class="btn block pj-bigbtn" data-act="book">${ic('cal', 18)} Pedir reunión con el asesor</button>`}</div></div>`;
  }
  function pjIntro() {
    return `<div class="narrow pj-intro"><div class="pj-duo">${pAv('a', 'xl')}${pAv('b', 'xl')}</div>
      <h1 class="pj-h1">Vuestro dinero,<br>visto por los dos</h1>
      <p class="muted">Cada uno contesta en privado y luego lo veis juntos. Unos 4 minutos.</p>
      <ol class="pj-rules"><li><span>1</span><p>Cada uno, <b>en privado</b>: qué le ronda la cabeza con el dinero. Eso solo lo verá vuestro asesor.</p></li>
        <li><span>2</span><p>Después, qué creéis de unas cifras de vuestro estudio y qué haríais ante una caída.</p></li>
        <li><span>3</span><p>Lo destapáis <b>juntos</b>, lo comparáis con el estudio y veis qué propone vuestro plan.</p></li></ol>
      <p class="tiny pj-trust">${ic('lock', 14)} Empieza ${esc(pName('a'))}. ${esc(pName('b'))}, no mires hasta que te toque.</p>
      ${dock(`Empieza ${esc(pName('a'))}`, true, 'pjgo')}</div>`;
  }
  function renderPareja() {
    if (!S.pj || S.pj.v !== 7) S.pj = pjFresh();
    const steps = pjSteps(), [kind, x] = steps[S.pj.step].split(':');
    const prog = `<div class="progress thin"><div class="bar"><i style="width:${S.pj.step / (steps.length - 1) * 100}%"></i></div></div>`;
    const key = S.pj.step + ':' + steps[S.pj.step]; PJ_NEW = PJ_IN !== key; PJ_IN = key;
    const V = { intro: pjIntro, frase: () => pjFrase(x), pass: () => pjPass(x), money: () => pjMoney(x), vida: pjVida, nota: pjNota, rev: () => (x === 'money' ? pjRevMoney() : x === 'vida' ? pjRevVida() : x === 'nota' ? pjRevNota() : pjRevRisk()), risk: () => pjRisk(x), map: pjMap }[kind];
    app.innerHTML = (kind === 'map' ? `<div class="narrow">${routeBar()}</div>` : '') + (kind === 'pass' ? '' : prog) + V();
    // El fondo toma el color de quien contesta: azul uno, teja el otro; neutro cuando lo veis juntos.
    if (x === 'a' || x === 'b') document.body.dataset.pj = x; else delete document.body.dataset.pj;
    if (kind === 'rev' && x === 'nota') animateRing();
    clearTimeout(INTRO_T); if (PJ_NEW && app.querySelector('.qstage.intro')) { window.scrollTo(0, 0); introQ(); }
    pjTint(kind, x);
  }
  // Fondo del modo pareja: mientras contesta uno, la malla toma su color; si contestan juntos, morada.
  // La respuesta (lo que veis juntos: revelaciones, entrada y cierre) es la malla morada.
  function pjTint(kind, x) {
    if (!window.Fondo) return;
    Fondo.tint(null);
    Fondo.who(x === 'a' || x === 'b' ? x : null);
  }
  // Al terminar su turno, la carta se da la vuelta (queda boca abajo, con candado) y sale como una carta pasada.
  function pjSeal(then, force) {
    const steps = pjSteps(), nx = steps[S.pj.step + 1] || '', x = steps[S.pj.step].split(':')[1], card = app.querySelector('.pj-turn .pj-card');
    if (!card || (x !== 'a' && x !== 'b') || !(force || nx.startsWith('pass') || nx.startsWith('rev')) || REDUCED() || !card.animate) { then(); return; }
    card.style.position = 'relative';
    const tw = app.querySelector('.pj-turn'); if (tw) tw.classList.add('sealing');
    const back = document.createElement('div');
    back.className = 'pj-seal ' + x; back.innerHTML = `${ic('lock', 30)}<b>Guardado en secreto</b>`;
    card.animate([{ transform: 'perspective(900px) rotateY(0)' }, { transform: 'perspective(900px) rotateY(90deg)' }], { duration: 240, easing: 'cubic-bezier(.55,0,.7,.2)', fill: 'forwards' }).onfinish = () => {
      card.appendChild(back);
      card.animate([{ transform: 'perspective(900px) rotateY(-90deg)' }, { transform: 'perspective(900px) rotateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }).onfinish = () => {
        // Se queda un momento boca abajo y la pantalla entera se funde hacia arriba.
        setTimeout(() => {
          const turn = app.querySelector('.pj-turn') || card;
          turn.classList.add('fade-out');
          setTimeout(pjGoFade, 430);
        }, 650);
      };
    };
  }
  function pjSheetBlock() {
    if (!pjDone()) return '';
    const q = moneyQ(), vq = vidaQ();
    const row = x => { const p = perfil(x), r = riskOpt(S.pj.risk[x]), g = riskOpt(S.pj.guess[other(x)]);
      return `<li><b>${esc(pName(x))}</b>: perfil en el estudio ${esc(p ? `${low1(p.etiqueta)} (${p.riesgo})` : 'sin dato')}; ante una caída, «${esc(r ? low1(r[1]) : '')}» (${esc(low1(ENCAJE[encaje(x)]()))}). Su pareja creía: «${esc(g ? low1(g[1]) : '')}». Sobre el dinero decía ${esc(showV(q, S.pj.money[x]))} (estudio: ${esc(q.plan)}).</li>`; };
    const fr = x => (S.pj.frase && S.pj.frase[x] ? `<li><b>${esc(pName(x))}</b>, lo que le ronda la cabeza (contestado en privado): «${esc(S.pj.frase[x])}»</li>` : '');
    return `<h3>Perfil en pareja</h3><ul>${fr('a')}${fr('b')}${row('a')}${row('b')}${vq ? `<li>Seguro de vida, contestado juntos: ${esc(vidaJunto())}.</li>` : ''}${S.pj.nota != null ? `<li>Nota de salud financiera que creían: ${S.pj.nota} (estudio: ${E.nota.hoy}).</li>` : ''}<li>Aciertos sobre lo que haría el otro: ${aciertos()} de 2.</li></ul>`;
  }

  // ------------------------------------------------------------------ barra superior y portada
  function renderTop() {
    const talk = `<button class="pill talk" data-act="talk"><span class="lbl-long">Hablarlo con una persona</span><span class="lbl-short" aria-hidden="true">Asesor</span></button>`;
    if (S.stage === 'plan' || S.stage === 'story') topActions.innerHTML = `${S.stage === 'plan' ? '<button class="pill" data-act="story">Resumen</button>' : ''}<button class="pill" data-act="settings" aria-label="Ajustes"><span aria-hidden="true">⚙</span> <span class="lbl-long">Ajustes</span></button>${talk}`;
    else if (S.stage === 'quiz') topActions.innerHTML = `<button class="pill nb" id="nb" data-act="nb" aria-label="Cuaderno para ${w('vuestro', 'tu')} asesor">${ic('pen', 16)}<b>${nbCount()}</b></button><button class="pill" data-act="skip">Saltar</button>${talk}`;
    else if (S.stage === 'pareja') topActions.innerHTML = `<button class="pill" data-act="skip">Saltar al plan</button>${talk}`;
    else if (S.stage === 'camino') topActions.innerHTML = `<button class="pill" data-act="alinforme">Saltar</button>${talk}`;
    else topActions.innerHTML = '';
    document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; });
  }

  let homeTimer = null;
  // Dos apartados cuando el plan es de una pareja: los dos juntos o cada uno por su cuenta.
  function doors() {
    const ad = E.fam.adultos, enPareja = S.mode === 'pareja' && S.pj && S.pj.step > 0, enSolo = S.mode === 'solo' && S.qi > 0;
    return `<div class="doors"><p class="d-q">¿Quién va a ver el plan?</p>
      <button class="door duo" data-act="mode" data-v="pareja"><span class="pj-duo sm">${pAv('a')}${pAv('b')}</span>
        <span class="d-tx"><b>${enPareja ? 'Seguir donde lo dejasteis' : 'Los dos juntos'}</b><span>En pareja, con un solo móvil. Cada uno contesta en privado.</span><small>Unos 3 minutos</small></span><span class="arr">${ic('arrow', 20)}</span></button>
      <button class="door solo" data-act="mode" data-v="solo"><span class="d-ic">${ic('eye', 22)}</span>
        <span class="d-tx"><b>${enSolo ? 'Seguir donde lo dejasteis' : 'Solo el quiz'}</b><span>Sin juego. Juntos, o ${esc(ad[0].nombre)} o ${esc(ad[1].nombre)} por su cuenta.</span><small>Unos 5 minutos</small></span><span class="arr">${ic('arrow', 20)}</span></button></div>`;
  }
  // --- A. Portada: vuestros nombres, una frase y un botón. Al pulsar, barrido y frase puente.
  function renderHome() {
    const ad = E.fam.adultos, kids = E.fam.hijos.map(k => k.nombre).join(' y ');
    app.innerHTML = `<div class="home"><section class="hello">
        <h1><span class="h-a">${w('Bienvenidos a vuestro', 'Te damos la bienvenida a tu')}</span> <span class="h-b">plan de futuro</span></h1>
        <p class="h-names">${esc(ad.map(x => x.nombre).join(' y '))}</p>
        ${kids ? `<p class="h-kids">Pensado también para ${esc(kids)}.</p>` : ''}
        ${E.fam.pl ? doors() : `<button class="startbtn" data-act="start"><span>${S.qi > 0 ? `Seguir donde lo ${w('dejasteis', 'dejaste')}` : 'Empezar'}</span><span class="arr">${ic('arrow', 22)}</span></button>`}
        <p class="h-trust">${w('Vuestro', 'Tu')} asesor verá las respuestas para preparar la reunión</p>
      </section>
      <div class="home-foot"><button class="link small" data-act="skip">${w('Preferimos', 'Prefiero')} ir directamente al plan</button>
        <details class="h-casos"><summary>Prototipo del reto: cambiar de familia</summary>${casePicker()}</details></div></div>`;
    clearInterval(homeTimer);
  }
  let BRIDGE_T = null;
  function bridge() {
    topActions.innerHTML = '';
    app.innerHTML = `<div class="narrow"><button class="bridge" data-act="bridge"><span>Antes de ir a los detalles,</span> <span>veamos cuánto ${w('conocéis vuestra', 'conoces tu')} situación.</span></button></div>`;
    window.scrollTo(0, 0);
    BRIDGE_T = setTimeout(endBridge, 2900);
  }
  // Lo mismo antes del modo pareja: una frase que prepara, y entra sola.
  function pjBridge() {
    topActions.innerHTML = '';
    if (window.Fondo) { Fondo.show(true); Fondo.vivo(true); }
    app.innerHTML = `<div class="narrow"><button class="bridge" data-act="pjbridge"><span>Antes de ir a las cifras,</span> <span>veamos cuánto os conocéis con el dinero.</span></button></div>`;
    window.scrollTo(0, 0);
    BRIDGE_T = setTimeout(endPjBridge, 2900);
  }
  function endPjBridge() {
    clearTimeout(BRIDGE_T);
    const br = app.querySelector('.bridge'); if (!br || br.classList.contains('fade-out')) return;
    br.classList.add('fade-out');
    setTimeout(() => { S.stage = 'pareja'; render(); window.scrollTo(0, 0); }, 450);
  }
  function endBridge() {
    clearTimeout(BRIDGE_T);
    const br = app.querySelector('.bridge'); if (!br || br.classList.contains('fade-out')) return;
    br.classList.add('fade-out');
    setTimeout(() => { S.stage = 'quiz'; render(); }, 450);
  }

  function render() {
    renderTop();
    if (window.Fondo) Fondo.show(S.stage === 'home' || S.stage === 'quiz' || S.stage === 'pareja' || S.stage === 'story' || S.stage === 'intro' || S.stage === 'camino');
    if (S.stage !== 'pareja') { delete document.body.dataset.pj; if (window.Fondo) Fondo.who(null); }
    if (window.Fondo) Fondo.vivo(S.stage === 'pareja' && S.pj && S.pj.step === 0);
    if (S.stage !== 'story') document.body.classList.remove('rul-lock');
    if (S.stage === 'home') renderHome();
    else if (S.stage === 'quiz') renderQuiz();
    else if (S.stage === 'pareja') renderPareja();
    else if (S.stage === 'story') renderStory();
    else if (S.stage === 'intro') renderIntro();
    else if (S.stage === 'camino') renderCamino();
    else if (S.stage === 'tema') renderTema();
    else renderPlan();
    save();
  }
  // Dictado por voz en todo lo que se escribe: el reconocimiento de voz del propio navegador
  // (Chrome, Edge y Safari). Sin servidor nuestro. Donde no existe, el botón no sale.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let MIC = null;
  function addMics() {
    if (!SR) return;
    document.querySelectorAll('#app textarea, #veil textarea, #pjq').forEach(t => {
      if (t.dataset.mic) return; t.dataset.mic = '1';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mic'; b.dataset.act = 'mic'; b.dataset.for = t.id;
      b.setAttribute('aria-label', 'Dictar por voz'); b.innerHTML = ic('mic', 20);
      if (t.tagName === 'INPUT') { t.after(b); return; }
      const wr = document.createElement('div'); wr.className = 'micw'; t.before(wr); wr.append(t, b);
    });
  }
  function dictar(b) {
    const t = document.getElementById(b.dataset.for); if (!t) return;
    if (MIC) { const was = MIC.btn; MIC.rec.stop(); if (was === b) return; }
    const rec = new SR(), base = t.value.trim() ? t.value.trim() + ' ' : '';
    rec.lang = 'es-ES'; rec.interimResults = true; rec.continuous = false;
    MIC = { rec, btn: b }; b.classList.add('on'); b.setAttribute('aria-label', 'Parar el dictado');
    rec.onresult = e => {
      const txt = [...e.results].map(r => r[0].transcript).join('');
      t.value = (base + txt).slice(0, +t.maxLength > 0 ? +t.maxLength : 1000);
      t.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const fin = () => { b.classList.remove('on'); b.setAttribute('aria-label', 'Dictar por voz'); if (MIC && MIC.rec === rec) MIC = null; };
    rec.onend = fin;
    rec.onerror = e => { fin(); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Sin permiso para el micrófono. Podéis usar el del teclado.'); };
    try { rec.start(); } catch (er) { fin(); }
  }
  if (SR) new MutationObserver(() => addMics()).observe(document.body, { childList: true, subtree: true });
  function keep() { const y = window.scrollY; render(); window.scrollTo(0, y); }
  const marcaSugg = b => app.querySelectorAll('.sg').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2400); }

  // ------------------------------------------------------------------ eventos
  document.addEventListener('toggle', e => {
    if (e.target.matches && e.target.matches('details[data-fold]')) { S.fold[e.target.dataset.fold] = e.target.open; save(); }
  }, true);
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'free' || t.id === 'pjq') { DRAFT = t.value; return; }
    if (t.id === 'pjfrase') { if (window.Fondo) Fondo.pulse(); const bt = document.getElementById('pjfsave'); if (bt) bt.disabled = !t.value.trim(); return; }
    if (t.dataset.act === 'pjrange') {
      const x = t.dataset.k, q = x === 'vida' ? vidaQ() : x === 'nota' ? notaQ() : moneyQ();
      t.classList.remove('untouched'); if (x === 'vida' || x === 'nota') S.pj[x] = +t.value; else S.pj.money[x] = +t.value;
      const v = document.getElementById('pjamt'); v.textContent = showV(q, +t.value); v.classList.remove('empty');
      app.querySelectorAll('.nw-hint').forEach(el => el.remove());
      const bt = document.getElementById('pjsave'); if (bt) bt.disabled = false;
      save(); return;
    }
    if (t.id === 'worry' || t.id === 'note') {
      if (window.Fondo) Fondo.pulse();
      const bt = t.id === 'worry' ? app.querySelector('[data-act="worry"]:not([data-v])') : app.querySelector('.savebtn');
      if (bt) bt.disabled = !t.value.trim();
      if (window.Fondo && t.id === 'worry') Fondo.tint(t.value.trim() ? 'pick' : null);
      return;
    }
    if (t.dataset.act === 'range') {
      const q = QMAP[t.dataset.k];
      t.classList.remove('untouched');
      S.a[q.id] = Object.assign(S.a[q.id] || {}, { value: +t.value });
      const v = document.getElementById('amt'); v.textContent = showV(q, +t.value); v.classList.remove('empty');
      app.querySelectorAll('.nw-hint, .nw-tip').forEach(x => x.remove());
      const btn = document.querySelector('[data-act="reveal"]'); if (btn) btn.disabled = false;
      if (window.Fondo) Fondo.tint('pick');
      const bk = Math.floor((+t.value - q.min) / ((q.max - q.min) || 1) * 12);
      if (BUCKET !== null && bk !== BUCKET) { try { if (navigator.vibrate) navigator.vibrate(4); } catch (er) { /* sin vibración */ } }
      BUCKET = bk;
      save();
    }
  });
  document.addEventListener('pointerdown', e => { const t = e.target; if (t.dataset && (t.dataset.act === 'range' || t.dataset.act === 'pjrange')) t.classList.remove('untouched'); });

  function syncOpenQ() {
    if (S.openQ == null) return;
    S.doubts = S.doubts.filter(d => !/^oq/.test(d.id));
    E.abiertas.filter(q => S.openQ.includes(q.id)).forEach(q => S.doubts.push({ id: q.id, topic: 'otra', q: q.q, covered: 'no', status: 'open' }));
  }
  const toPlan = () => { S.stage = 'plan'; S.prefs.level = S.prefs.level || 'new'; };

  document.addEventListener('pointermove', lineaHover);
  document.addEventListener('pointerdown', lineaHover);
  // Ruleta del resumen: deslizar, flechas del teclado y recolocar al cambiar el tamaño.
  document.addEventListener('pointerdown', rulDown);
  document.addEventListener('pointermove', rulMove);
  document.addEventListener('pointerup', rulUp);
  document.addEventListener('pointercancel', e => { if (RUL.drag && RUL.drag.moved) rulUp(e); RUL.drag = null; });
  document.addEventListener('click', e => { if (RUL.justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('keydown', e => { if (S.stage !== 'story' || S.rulOpen != null || /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') rulTo(Math.round(RUL.rot) + 1, 1); else if (e.key === 'ArrowLeft') rulTo(Math.round(RUL.rot) - 1, -1); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.stage === 'story' && S.rulOpen != null) rulClose(); });
  window.addEventListener('resize', () => { if (S.stage === 'story') rulLayout(false); });
  document.addEventListener('keydown', e => { const t = e.target; if ((e.key === 'Enter' || e.key === ' ') && t && t.matches && t.matches('[role=button][data-act]')) { e.preventDefault(); t.click(); } });
  document.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('svg.gl')) lineaFuera(e); });
  document.addEventListener('click', async e => {
    if (app.contains(e.target) && !e.target.closest('[data-act], summary, a')) {
      if (app.querySelector('.qstage.think')) { settleQ(); return; }
      if (PEND && app.querySelector('.lake-w')) { endSuspense(PEND); return; }
      if (SEQ.length && app.querySelector('.rv2.play')) { finishSeq(); return; }
    }
    const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    const act = b.dataset.act, v = b.dataset.v, k = b.dataset.k;
    const go = nextQ;
    switch (act) {
      case 'start': if (S.qi > 0) swipe(() => { S.stage = 'quiz'; render(); }); else swipe(bridge); break;
      case 'bridge': endBridge(); break;
      case 'pjbridge': endPjBridge(); break;
      case 'mode':
        if (v === 'pareja') { if (S.mode !== 'pareja' || !S.pj || S.pj.v !== 7) S.pj = pjFresh(); S.mode = 'pareja'; S.who = 'juntos'; if (S.pj.step > 0) swipe(() => { S.stage = 'pareja'; render(); window.scrollTo(0, 0); }); else swipe(pjBridge); }
        else { if (S.mode !== 'solo') { S.qi = 0; S.who = null; } S.mode = 'solo'; if (S.qi > 0) swipe(() => { S.stage = 'quiz'; render(); }); else swipe(bridge); }
        break;
      case 'pjgo': if (b.id === 'pjsave') { b.disabled = true; if (window.Fondo) Fondo.pulse(); pjSeal(pjGo); } else pjGo(); break;
      case 'mic': dictar(b); break;
      case 'pjfsugg': { const t = document.getElementById('pjfrase'); if (!t) break; t.value = v; marcaSugg(b); t.focus(); const bt = document.getElementById('pjfsave'); if (bt) bt.disabled = false; if (window.Fondo) Fondo.pulse(); break; }
      case 'pjfrase': {
        const x = b.dataset.x, t = document.getElementById('pjfrase'), txt = v === 'skip' ? '' : (t ? t.value.trim() : '');
        S.pj.frase[x] = txt || null; pjFraseSet(); save();
        if (txt && window.Fondo) Fondo.pulse();
        b.disabled = true; if (txt) pjSeal(pjGo, true); else pjGo(); break;
      }
      case 'pjpact': CAL.pact = CAL.pact || {}; CAL.pact[b.dataset.x] = !CAL.pact[b.dataset.x]; calSheet(CAL.kind, true); break;
      case 'pjpick': { const kind = k, x = b.dataset.x; S.pj[kind][x] = v; save();
        app.querySelectorAll(`[data-act="pjpick"][data-k="${kind}"][data-x="${x}"]`).forEach(el => el.setAttribute('aria-pressed', el.dataset.v === v));
        const bt = document.getElementById('pjsave'); if (bt) bt.disabled = !(S.pj.risk[x] && S.pj.guess[x]); if (window.Fondo) Fondo.pulse(); break; }
      case 'pjplan': S.prefs.level = S.prefs.level || 'new'; preparePlan(); break;
      case 'pjagain': S.pj = pjFresh(); S.doubts = S.doubts.filter(d => !/^pj-/.test(d.id)); render(); window.scrollTo(0, 0); break;
      case 'pjlevel': S.prefs.level = v; save(); app.querySelectorAll('[data-act="pjlevel"]').forEach(el => el.setAttribute('aria-pressed', el.dataset.v === v)); break;
      case 'rtake': { // desde la sorpresa: la parada entra en la ruta y la nota sube
        const s0 = b.dataset.s, before = scoreFor(accepted()).v; S.steps[s0] = 'yes'; save();
        const after = scoreFor(accepted()).v, stop = document.getElementById('rs-' + s0);
        if (stop) stop.scrollIntoView({ block: 'nearest' });
        fly(b, pTitulo(paso(s0)), 'rs-' + s0);
        setTimeout(() => { keep(); refreshRoute(); toast(after > before ? `Elegido. Hecho, la nota pasaría de ${before} a ${after}` : 'Elegido para la ruta'); }, 860);
        break;
      }
      case 'rask': { const q = QMAP[k]; if (!S.doubts.some(d => d.id === 'rq-' + k)) S.doubts.push({ id: 'rq-' + k, topic: 'otra', q: `${q.creian}: ${q.plan} ${q.unidad}. ¿Cómo lo arreglamos?`, covered: 'no', status: 'open' }); fly(b, 'Para la reunión'); keep(); break; }
      case 'vhecho': S.done = S.done || {}; S.done[b.dataset.s] = true; S.steps[b.dataset.s] = 'yes'; keep(); vueltaSheet(+b.dataset.n); break;
      case 'vaun': S.doubts.push({ id: 'vaun-' + b.dataset.s + '-' + Date.now(), topic: 'otra', paso: b.dataset.s, q: `Aún no hemos hecho «${low1(pTitulo(paso(b.dataset.s)))}». ¿Qué nos frena?`, covered: 'no', status: 'open' }); closeSheet(); keep(); toast('Apuntado para la reunión'); break;
      case 'introsig': introSig(); break;
      case 'introskip': clearTimeout(BRIDGE_T); S.introI = 0; S.stage = 'plan'; render(); window.scrollTo(0, 0); break;
      case 'alinforme': alInforme(); break;
      case 'rmeet': meetPop(b.dataset.s || null); break;
      case 'verparada': { closeSheet(); const p = paso(b.dataset.s), x = temasPlan().find(t => t.pasos.includes(p)); if (x) { if (S.stage !== 'tema') S.stage = 'plan'; abrirTema(x.a.nombre); setTimeout(() => { const el = document.getElementById('step-' + p.key); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); } }, 80); } break; }
      case 'stop': meetPop(b.dataset.s); break;
      case 'skip': toPlan(); S.stage = 'intro'; S.introI = 0; render(); window.scrollTo(0, 0); break;
      case 'caso': closeSheet(); await abrirCaso(v); render(); window.scrollTo(0, 0); break;
      case 'who': S.who = v; render(); advance(); break;
      case 'level': S.prefs.level = v; render(); advance(); break;
      case 'phrase': S.phrase = v; render(); advance(); break;
      case 'gain': S.gain = v; render(); break;
      case 'react': S.react[k] = v; keep(); break;
      case 'decade': { const a = S.a[k] = S.a[k] || {}; a.value = Math.max(QMAP[k].min, +v + 5); render(); break; }
      case 'yr': { const a = S.a[k], q = QMAP[k]; a.value = Math.max(q.min, Math.min(q.max, a.value + +v)); render(); break; }
      case 'opt': S.a[k] = Object.assign(S.a[k] || {}, { value: +v }); render(); break;
      case 'perm': { const id = QUIZ[S.qi]; if (v === 'later') { S.a[id] = { permission: 'later' }; go(); } else { S.a[id] = Object.assign(S.a[id] || {}, { permission: 'now' }); render(); } break; }
      case 'reveal': {
        const q = QMAP[QUIZ[S.qi]]; S.a[q.id].revealed = true; descubrir(q);
        if (document.startViewTransition) { document.startViewTransition(() => playReveal(q)); break; }
        const st = app.querySelector('.qstage'); if (st) st.classList.add('fade-out'); setTimeout(() => playReveal(q), 300); break;
      }
      case 'sugg': { const t = document.getElementById('worry'); t.value = v; marcaSugg(b); t.focus(); const bt = app.querySelector('[data-act="worry"]:not([data-v])'); if (bt) bt.disabled = false; if (window.Fondo) { Fondo.pulse(); Fondo.tint('pick'); } break; }
      case 'worry': {
        const t = document.getElementById('worry'), txt = v === 'skip' ? '' : (t ? t.value.trim() : '');
        S.phrase = txt; S.match = temasDe(txt); buildQuiz(S.match);
        S.doubts = S.doubts.filter(d => d.id !== 'nota-ronda');
        if (txt) { S.doubts.push({ id: 'nota-ronda', topic: 'otra', q: `Lo que ${w('les', 'le')} ronda la cabeza: «${txt}»`, covered: 'no', status: 'open' }); renderTop(); fly(t, txt); }
        save();
        if (S.pjFrase) { S.pjFrase = false; setTimeout(preparePlan, txt ? 650 : 0); break; }
        setTimeout(nextQ, txt ? 450 : 0); break;
      }
      case 'nsugg': { S.react[k] = v; save(); app.querySelectorAll('.rx').forEach(x => x.setAttribute('aria-pressed', String(x === b))); const ok = app.querySelector('.rx-ok'); if (ok) ok.hidden = false; if (window.Fondo) Fondo.pulse(); break; }
      case 'addnote': { const nw = app.querySelector('.note-w'); if (nw) { nw.hidden = false; b.hidden = true; const t = document.getElementById('note'); if (t) t.focus(); } break; }
      case 'note': {
        const t = document.getElementById('note'), txt = t.value.trim(); if (!txt) break;
        S.notes[k] = txt; S.doubts = S.doubts.filter(d => d.id !== 'nota-' + k);
        S.doubts.push({ id: 'nota-' + k, topic: 'otra', q: `${QMAP[k].creian}: «${txt}»`, covered: 'no', status: 'open' });
        renderTop(); fly(t, txt); setTimeout(keep, 500); break;
      }
      case 'nb': nbSheet(); break;
      case 'next': go(); break;
      case 'toplan': preparePlan(); break;
      case 'nextslide': rulTo(Math.round(RUL.rot) + 1, 1); break;
      case 'prev': rulTo(Math.round(RUL.rot) - 1, -1); break;
      case 'goslide': rulTo(+v); break;
      case 'rulgo': rulTo(Math.round(RUL.rot) + +v, +v); break;
      case 'rulopen': { // abre esa parte dentro del plan completo
        S.rulOpen = null; S.stage = 'plan'; render(); window.scrollTo(0, 0);
        if (nodo(v) || v === '__nota' || v === '__ruta') abrirTema(v); // se abre como página del plan: «Plan › tema»
        break;
      }
      case 'rulclose': rulClose(); break;
      case 'cff': selCf(b, v); break;
      case 'fullplan': S.rulOpen = null; S.stage = 'plan'; render(); window.scrollTo(0, 0); break;
      case 'story': S.stage = 'story'; S.slide = 0; render(); window.scrollTo(0, 0); break;
      case 'tog': { const s = b.dataset.s; S.steps[s] = S.steps[s] === 'yes' ? null : 'yes'; keep(); break; }
      case 'oq': { const id = b.dataset.id; S.openQ = S.openQ.includes(id) ? S.openQ.filter(x => x !== id) : S.openQ.concat(id); keep(); break; }
      case 'later': S.later = true; keep(); if (window.__PREVIEW__) toast('Sin prisa. El plan sigue aquí'); else { laterIcs(); toast('Recordatorios a los 3 y a los 30 días'); } break;
      case 'vote': {
        const s = b.dataset.s, before = scoreFor(accepted()).v;
        S.steps[s] = S.steps[s] === v ? null : v; keep();
        const after = scoreFor(accepted()).v;
        if (S.steps[s] === 'doubt') { S.cat = null; askSheet(s); } else if (S.steps[s] === 'no') noSheet(s);
        else if (S.steps[s] === 'yes' && E.primer && E.primer.key === s && !S.payDate) calSheet('pay');
        else if (S.steps[s] === 'yes') toast(after > before ? `Elegido. Hecho, la nota pasaría de ${before} a ${after}` : 'Apuntado');
        break;
      }
      case 'noreason': S.doubts.push({ id: 'no-' + b.dataset.s + '-' + Date.now(), topic: 'otra', paso: b.dataset.s, q: `No a «${low1(paso(b.dataset.s).titulo)}»: ${v}`, covered: 'no', status: 'open' }); closeSheet(); keep(); toast('Apuntado para la reunión'); break;
      case 'tema': if (S.stage === 'story' && S.rulOpen != null) { const ix = SLIDES.findIndex(x => rulKey(x) === k); if (ix >= 0) { RUL.rot = ix; S.slide = ix; } S.rulOpen = k; RUL.ovY = 0; render(); app.querySelector('.rul-full') && (app.querySelector('.rul-full').scrollTop = 0); } else abrirTema(k); break;
      case 'temaback': volverTema(v); break;
      case 'whatif': askSheet(null); break;
      case 'cat': { const veil = document.getElementById('veil'); S.cat = S.cat === v ? null : v; save(); askSheet(veil ? veil.dataset.paso : null); break; }
      case 'ask': answerSheet(b.dataset.t, b.dataset.id); break;
      case 'unask': S.doubts = S.doubts.filter(d => d.id !== b.dataset.id); if (S.openQ) S.openQ = S.openQ.filter(x => x !== b.dataset.id); keep(); askSheet(null); break;
      case 'resolve': { const d = S.doubts.find(x => x.id === b.dataset.id); d.status = v; keep(); askSheet(null); toast(v === 'resolved' ? 'Duda resuelta' : 'Apuntada para la reunión'); break; }
      case 'free': {
        const el = document.getElementById('free'), txt = (el.value || '').trim();
        if (!txt) { el.focus(); el.parentNode.classList.add('shake'); setTimeout(() => el.parentNode.classList.remove('shake'), 400); return; }
        S.doubts.push({ id: 'free-' + Date.now(), topic: S.cat || 'otra', paso: b.dataset.p || null, q: txt, covered: 'no', status: 'open' }); DRAFT = ''; keep(); askSheet(null); toast('Apuntada para la reunión'); break;
      }
      case 'pjqcat': S.cat = S.cat === v ? null : v; pjBooked(true); break;
      case 'pjq': {
        const el = document.getElementById('pjq'), txt = (el.value || '').trim();
        if (!txt) { el.focus(); el.parentNode.classList.add('shake'); setTimeout(() => el.parentNode.classList.remove('shake'), 400); return; }
        S.doubts.push({ id: 'pjq-' + Date.now(), topic: S.cat || 'otra', q: txt, covered: 'no', status: 'open' }); DRAFT = ''; S.cat = null; keep(); render(); pjBooked(true); toast('Apuntada para la reunión'); break;
      }
      case 'pjbooked': pjBooked(true); break;
      case 'close': closeSheet(); break;
      case 'talk': talkSheet(); break;
      case 'settings': settingsSheet(); break;
      case 'setpref': S.prefs.level = v; keep(); settingsSheet(); break;
      case 'book': if (S.stage === 'home') { toPlan(); render(); } calSheet('meet'); break;
      case 'cal': calSheet(k); break;
      case 'calday': CAL.day = v; calSheet(CAL.kind, true); break;
      case 'caltime': CAL.time = v; calSheet(CAL.kind, true); break;
      case 'calok': {
        const dt = fromIso(CAL.day, CAL.time), kind = CAL.kind;
        if (kind === 'pay') { S.payDate = { iso: CAL.day, time: CAL.time, label: fmtLong(dt) }; S.steps[E.primer.key] = 'yes'; closeSheet(); keep(); if (S.stage === 'pareja') render(); toast(`Apuntado. Con ese paso, la nota pasa a ${E.primer.nota}`); }
        else { S.booking = { iso: CAL.day, time: CAL.time, label: fmtSlot(dt), short: fmtSlot(dt), mins: nextStep().mins }; syncOpenQ(); closeSheet(); if (S.stage === 'plan') { render(); const sc = document.getElementById('s-cierre'); if (sc) sc.scrollIntoView({ behavior: 'smooth' }); } else { if (S.stage === 'camino') save(); else keep(); if (S.stage === 'pareja') { render(); pjBooked(); } } if (S.stage !== 'pareja') toast('Reunión pedida'); }
        break;
      }
      case 'gocierre': document.getElementById('s-cierre').scrollIntoView({ behavior: 'smooth' }); break;
      case 'week': weekSheet(); break;
      case 'weekfill': document.getElementById('bal').value = v; break;
      case 'weekok': { const n = parseFloat(document.getElementById('bal').value); if (isNaN(n)) return; if (n <= E.primer.despues) weekDone(n); else weekStuck(n); break; }
      case 'weekwhy': S.week = { done: false, balance: +b.dataset.b, reason: v }; S.doubts.push({ id: 'week-' + Date.now(), topic: 'otra', paso: E.primer.key, q: `A la semana no estaba hecho el primer paso: ${v}`, covered: 'no', status: 'open' }); keep();
        sheet(`<div class="kicker">Apuntado</div><h2>Justo para esto está ${w('vuestro', 'tu')} asesor.</h2><p>Le llega lo que nos ${w('habéis', 'has')} dicho, para que la reunión empiece por ahí.</p>${meetCtas()}`); break;
      case 'ics': downloadIcs(k || 'meet'); break;
      case 'copy': copySummary(); break;
      case 'print': window.print(); break;
      case 'restart': try { localStorage.removeItem(KEY()); } catch (er) { /* nada */ } closeSheet(); await abrirCaso(E.slug, true); render(); window.scrollTo(0, 0); break;
    }
  });

  // Cita al calendario con alarma, el objetivo de la familia en el título y un enlace de vuelta.
  // El pago lleva una segunda cita a la semana que abre la comprobación del saldo (?semana=1).
  const icsZ = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsTx = t => String(t).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const icsBase = () => location.origin + location.pathname + '?caso=' + encodeURIComponent(E.slug || '');
  const icsEv = (uid, st, en, sum, desc, url, alarm) => ['BEGIN:VEVENT', 'UID:' + uid + '@plan', 'DTSTAMP:' + icsZ(new Date()), 'DTSTART:' + icsZ(st), 'DTEND:' + icsZ(en),
    'SUMMARY:' + icsTx(sum), 'DESCRIPTION:' + icsTx(desc + '\n' + url), 'URL:' + url, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsTx(sum), 'TRIGGER:' + alarm, 'END:VALARM', 'END:VEVENT'];
  function icsSave(evs, name) {
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//plan//es', ...evs, 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = name; a.click();
  }
  // «Ahora no»: una cita dentro de una semana, a las 19:00, que devuelve al plan.
  // «Ahora no»: dos citas reales en el calendario, a los 3 y a los 30 días, que vuelven a la ruta.
  function laterIcs() {
    const evs = [3, 30].flatMap((n, i) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(19, 0, 0, 0);
      return icsEv(Date.now() + i, d, new Date(d.getTime() + 15 * 60000), `${w('Vuestra', 'Tu')} ruta, ${n} días después` + (S.phrase ? ` · ${S.phrase}` : ''), `Mirad qué paradas lleváis y cuál es la siguiente.`, icsBase() + '&vuelta=' + n + (accepted().length ? '&r=' + accepted().join(',') : ''), '-PT0M'); });
    icsSave(evs, 'volver-a-la-ruta.ics');
  }
  // Al volver desde esas citas (?vuelta=3 o 30): lo hecho, lo que falta y la siguiente parada.
  function vueltaSheet(n) {
    const P = E.pasos, acc = accepted(), done = S.done || {}, hechos = P.filter(p => done[p.key]), sig = P.find(p => acc.includes(p.key) && !done[p.key]) || P.find(p => !done[p.key]);
    const sc = scoreFor(hechos.map(p => p.key)).v;
    sheet(`<div class="kicker">${n} días después</div><h2>${hechos.length ? `${w('Habéis hecho', 'Has hecho')} ${hechos.length} de ${P.length}. Nota ${sc}.` : sig ? `¿${w('Habéis hecho', 'Has hecho')} «${esc(low1(pTitulo(sig)))}»?` : `${w('Vuestra', 'Tu')} ruta sigue aquí.`}</h2>
      ${S.phrase ? `<p class="week-why">${w('Lo que os movía', 'Lo que te movía')}: <b>«${esc(S.phrase)}»</b></p>` : ''}
      <ol class="rr-list big">${P.map((p, i) => `<li class="${done[p.key] ? 'done' : p === sig ? 'next' : ''}"><b class="rr-n sm">${done[p.key] ? ic('check', 12) : i + 1}</b><span>${esc(pTitulo(p))}<small>${done[p.key] ? 'Hecho' : acc.includes(p.key) ? 'Elegido, sin confirmar' : 'Sin elegir'}</small></span></li>`).join('')}</ol>
      ${sig && !done[sig.key] ? `<div class="row" style="margin-bottom:12px"><button class="btn soft grow" data-act="vhecho" data-s="${sig.key}" data-n="${n}">Sí, ${w('lo hemos hecho', 'lo he hecho')}</button><button class="btn ghost grow" data-act="vaun" data-s="${sig.key}">Aún no</button></div>` : ''}
      ${S.booking ? `<p class="saved">${ic('check', 15)}Reunión pedida: ${esc(S.booking.short)}</p><button class="link" style="width:100%" data-act="close">Ver ${w('vuestro', 'tu')} plan</button>`
        : `<button class="link" style="width:100%" data-act="book">${ic('cal', 16)} Elegir día con ${w('vuestro', 'tu')} asesor</button><button class="link" style="width:100%" data-act="close">Ver ${w('vuestro', 'tu')} plan</button>`}`);
  }

  function downloadIcs(kind) {
    const pay = kind === 'pay', b = pay ? S.payDate : S.booking; if (!b) return;
    const s = fromIso(b.iso.slice(0, 10), b.time), e2 = new Date(s.getTime() + (pay ? 15 : b.mins) * 60000);
    const base = icsBase(), why = S.phrase ? ` · ${S.phrase}` : '', ev = icsEv;
    let evs;
    if (pay) {
      const w1 = new Date(s.getTime() + 7 * 864e5), w2 = new Date(w1.getTime() + 10 * 60000);
      evs = [...ev(Date.now(), s, e2, E.primer.titulo + why, `Primer paso de vuestro plan. Después, el saldo de la tarjeta queda en ${E.primer.despuesTxt} y la nota pasa a ${E.primer.nota}.`, base, '-PT15M'),
        ...ev(Date.now() + 1, w1, w2, 'Comprobar el saldo de la tarjeta' + why, `Mirad el saldo en la app del banco y escribidlo en vuestro plan.`, base + '&semana=1', '-PT0M')];
    } else if (S.stage === 'pareja' && pjDone()) evs = ev(Date.now(), s, e2, 'Reunión con el asesor' + why, pjIcsText(), base + '&reunion=1', '-PT1H');
    else evs = ev(Date.now(), s, e2, 'Reunión con el asesor' + why, summaryText(), base, '-PT1H');
    icsSave(evs, pay ? 'primer-paso.ics' : 'reunion-plan.ics');
  }
  // La cita de la pareja es suya: con quién se ve cada cosa y lo que el asesor ya sabe de ellos (sin la hoja interna).
  const pjIcsText = () => `Con vuestro asesor: ${pjConLista()}.\nLo que vuestro asesor ya sabe de vosotros:\n${pjGets().map(t => '- ' + t).join('\n')}\nPara añadir otra pregunta antes de ir, abrid el enlace.`;
  function summaryText() {
    const acc = E.pasos.filter(p => S.steps[p.key] === 'yes').map(p => '- ' + p.titulo), open = S.doubts.filter(d => d.status === 'open').map(d => '- ' + d.q);
    return `${E.fam.titulo}. Reunión: ${S.booking ? S.booking.label + ' (' + S.booking.mins + ' min)' : 'sin fecha'}${S.phrase ? '\nLo que más importa: ' + S.phrase : ''}${S.gain ? '\nQué cambiaría en casa: ' + S.gain : ''}${pjDone() ? `\nLo que habéis contestado:\n${pjGets().filter(t => !/^Lo que (queréis que os conteste|le ronda|os ronda)/.test(t)).map(t => '- ' + t).join('\n')}` : ''}\nNivel: ${PRO() ? 'sabe de finanzas' : 'nuevo en esto'}${S.payDate ? '\nPrimer paso con fecha: ' + S.payDate.label : ''}\nPasos aceptados:\n${acc.join('\n') || '- ninguno'}\nPreguntas para la reunión:\n${open.join('\n') || '- ninguna'}`;
  }
  function copySummary() { const t = summaryText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Resumen copiado'), () => toast('No se ha podido copiar')); }

  // ------------------------------------------------------------------ arranque
  async function boot() {
    try {
      await cargarIndice();
      const q = new URLSearchParams(location.search);
      let slug = q.get('caso'); if (!slug) { try { slug = localStorage.getItem('plan-v2-caso'); } catch (e) { /* nada */ } }
      if (!IDX.some(c => c.slug === slug)) slug = (IDX.find(c => c.slug === 'timothy-melanie-weah') || IDX[0]).slug;
      await abrirCaso(slug, q.has('reset'));
      if (q.get('demo') === 'plan' || q.get('demo') === 'story') { S.stage = q.get('demo'); S.prefs.level = q.get('l') === 'pro' ? 'pro' : 'new'; S.phrase = S.phrase || E.frases[0]; if (q.get('s')) S.slide = +q.get('s'); }
      render();
      if (q.get('vuelta') && q.get('r')) q.get('r').split(',').forEach(k => { if (paso(k)) S.steps[k] = 'yes'; });
      if (q.get('vuelta') && E.pasos.length) { if (S.stage === 'home' || S.stage === 'quiz') { toPlan(); render(); } vueltaSheet(+q.get('vuelta') || 3); }
      else if (q.get('semana') && E.primer && S.payDate && !S.week) weekSheet(true);
      else if (q.get('reunion') && S.booking && S.stage === 'pareja' && pjDone()) pjBooked(true);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="narrow card"><h2>No hemos podido cargar el plan.</h2><p>Arranca la web con <code>npm start</code> desde la raíz del repo. Si faltan los estudios, se generan con <code>npm run estudio</code>.</p><button class="btn" onclick="location.reload()">Reintentar</button></div>`;
    }
  }
  window.addEventListener('resize', () => document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; }));
  boot();
})();
