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
    SLIDES = ['foto', ...E.frenos.map(id => 'f:' + id), 'pasos', 'camino', E.primer ? 'primer' : null, 'reunion'].filter(Boolean);
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
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 16v2M17 16v2M5 11h14"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11.5V16c2 2 10 2 12 0v-4.5"/>',
    seed: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
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
        <div class="tm-ax"><span><b>${v.de}</b>${w('Os jubiláis', 'Te jubilas')}</span><span>${v.hasta != null ? `<b>${v.hasta}</b>` : ''}Hasta donde llega el plan</span></div></div>
        <div class="coin-leg"><span><i class="lg keep"></i>Con ahorros</span>${v.ok ? '' : '<span><i class="lg gone"></i>Sin ahorros</span>'}</div>`;
    },
    barra: v => `<div class="barras"><div class="br"><small>${esc(v.l1)}</small><div class="br-b"><i class="bad" style="width:${v.hoy}%"></i></div><b>${v.hoy} %</b></div>
      <div class="br"><small>${esc(v.l2)}</small><div class="br-b"><i style="width:${v.meta}%"></i></div><b>${v.meta} %</b></div></div>`,
  };
  const vis = q => (VIS[q.vis.t] ? VIS[q.vis.t](q.vis) : '');
  const rowsTbl = rows => `<table class="nums">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`;
  const origen = q => `<div class="origin">${ic(q.calc ? 'chart' : 'check', 14)}<span>${q.calc ? `Cuenta nuestra con cifras de ${w('vuestro', 'tu')} plan: ${esc(q.calc)}` : `Cifra de ${w('vuestro', 'tu')} plan`}</span></div>`;
  const proBlock = q => PRO() && q.pro ? `<div class="protech"><span class="tag navy">Para quien sabe de finanzas</span><p>${esc(q.pro)}</p><div class="src">Origen en el plan: ${esc(q.origen)}</div></div>` : '';

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
      <span class="rl-m you" style="left:${g}%"><small>${w('Vosotros', 'Tú')}</small></span><span class="rl-m plan" style="left:${r}%"><small>Plan</small></span></div></div>`;
  }
  function revealView(q) {
    const a = S.a[q.id], r = S.react[q.id], bad = q.tono === 'malo', b = banda(q, a.value), help = S.help && S.help[q.id], tit = titular(q, a.value);
    const count = q.tipo === 'importe' ? { to: q.real, fmt: 'money' } : q.tipo === 'anio' ? { from: a.value, to: q.real, fmt: 'year' } : q.tipo === 'num' && !q.mid ? { to: q.real, fmt: 'num', suf: q.sufijo || '', d: q.real % 1 ? 1 : 0 } : null;
    return `<div class="rv2 ${bad ? 'bad' : 'good'} b-${b} ${JUST ? 'play' : ''}">
      <p class="rv-guess">${w('Vosotros decíais', 'Tú decías')} <b>${esc(fmtGuess(q, a.value))}</b></p>
      <div class="rv-box" data-st="box"><small>${w('Vuestro', 'Tu')} plan dice</small>
        <b class="big ${q.mid ? 'mid' : ''}"${count ? ` data-count='${JSON.stringify(count)}'` : ''}>${esc(q.plan)}</b><em>${esc(q.unidad)}</em>
        ${b === 'clavado' ? `<svg class="rv-tick" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>` : ''}</div>
      ${ruler(q, a.value)}
      <div class="rv-prec" data-st="type"><small class="rv-band">${esc(BANDA[b]())}</small><h2 class="rv-type" data-text="${esc(tit)}">${esc(tit)}</h2></div>
      <div class="rv-vis" data-st="vis">${vis(q)}</div>
      ${q.siente ? `<p class="rv-feel" data-st="fade">${q.siente}</p>` : ''}
      <div class="rv-note" data-st="fade"><label for="note">¿Qué ${w('os pasa', 'te pasa')} por la cabeza al ver esto?</label>
        <textarea id="note" class="free" rows="2" maxlength="200" data-k="${q.id}" placeholder="${w('Escribidlo como os salga', 'Escríbelo como te salga')}">${esc((S.notes || {})[q.id] || '')}</textarea>
        <div class="sugg">${REACT.map(([v, l, i]) => `<button class="chip sm" data-act="nsugg" data-k="${q.id}" data-v="${v}" aria-pressed="${r === v}">${l()}</button>`).join('')}</div>
        ${(S.notes || {})[q.id] ? `<p class="saved">${ic('check', 15)}Guardado en el cuaderno de ${w('vuestro', 'tu')} asesor</p>` : `<button class="btn soft savebtn" data-act="note" data-k="${q.id}" disabled>Guardar para ${w('vuestro', 'tu')} asesor</button>`}</div>
      ${help ? `<div class="rv-exit" id="rv-exit"><span class="dc-ic">${ic(bad ? 'arrow' : 'check', 20)}</span><span>${esc(q.salida)}</span></div>` : ''}
      <div class="rv-foot" data-st="fade"><details class="why rv-more"><summary>Ver las cifras de ${w('vuestro', 'tu')} informe</summary><div class="card">${rowsTbl(q.filas)}${proBlock(q)}</div></details>${origen(q)}</div>
      <div class="rv-dock" data-st="dock">${help ? dock('Seguir', true) : `<div class="dock"><button class="btn block" data-act="help" data-k="${q.id}">Podemos ${w('ayudaros', 'ayudarte')} con esto</button><button class="link block" data-act="next">Seguir</button></div>`}</div>
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
    if (window.Fondo) { const q = QMAP[id]; Fondo.focus(false); Fondo.mood(q && q.tono === 'malo' ? -0.9 : 0.8); }
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
    const go = () => { S.stage = 'story'; S.slide = 0; render(); window.scrollTo(0, 0); };
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
  function fly(from, txt) {
    const nb = document.getElementById('nb'); if (!from || !nb || !txt) return;
    const a = from.getBoundingClientRect(), b = nb.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'fly'; el.textContent = txt.length > 60 ? txt.slice(0, 58) + '…' : txt;
    el.style.left = a.left + 'px'; el.style.top = a.top + 'px'; el.style.width = Math.min(a.width, 320) + 'px';
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + Math.min(a.width, 320) / 2), dy = b.top + b.height / 2 - (a.top + 20);
    const an = el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .5}px, ${dy * .45}px) scale(.6)`, opacity: .9, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 }], { duration: 850, easing: 'cubic-bezier(.4,0,.2,1)' });
    an.onfinish = () => { el.remove(); const n = document.getElementById('nb'); if (n) { n.classList.remove('got'); void n.offsetWidth; n.classList.add('got'); } };
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
      head = S.mode === 'solo' ? `<h2 class="q">¿Quién eres?</h2><p class="muted">Contestas tú solo. Luego ${esc(ad[0].nombre)} y ${esc(ad[1].nombre)} pueden jugar juntos en el modo pareja.</p>` : `<h2 class="q">¿Quién mira el plan?</h2>`;
      body = (S.mode === 'solo' ? [] : [['juntos', 'Los dos juntos', 'heart']]).concat([['a', ad[0].nombre, 'eye'], ['b', ad[1].nombre, 'eye']]).map(([v, l, i], k) => `<button class="opt" style="--i:${k}" data-act="who" data-v="${v}" aria-pressed="${S.who === v}">${optBody(i, esc(l))}</button>`).join('');
    } else if (step === 'phrase') {
      head = `<h2 class="q">¿Qué es lo que más ${w('os ronda', 'te ronda')} la cabeza con el dinero?</h2><p class="muted">Con ${w('vuestras', 'tus')} palabras. También ${w('podéis', 'puedes')} dictarlo con el micrófono del teclado.</p>`;
      body = `<textarea id="worry" class="free" rows="3" maxlength="240" data-act="free-in" placeholder="${esc(E.fam.hijos.length ? `Por ejemplo: que a ${E.fam.hijos.map(k => k.nombre).join(' y ')} no les falte de nada` : 'Por ejemplo: llegar tranquilo a la jubilación')}">${esc(S.phrase || '')}</textarea>
        <p class="tiny sugg-t">O ${w('empezad', 'empieza')} con una de estas y ${w('cambiadla', 'cámbiala')} a ${w('vuestro', 'tu')} gusto:</p>
        <div class="sugg">${E.frases.map((p, i) => `<button class="chip sm" style="--i:${i}" data-act="sugg" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>`;
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
    if (window.Fondo) { Fondo.mood(0); Fondo.focus(false); }
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

  function lineaHtml() {
    const acc = accepted();
    const rows = E.linea.map((x, i) => {
      let cls = x.c, icon = x.icon, t = x.t, s = x.s || '', pill = '';
      if (x.c === 'step') {
        const k = E.pasos.findIndex(p => p.key === x.key), p = E.pasos[k], done = S.steps[x.key] === 'yes', np = notaPaso(k);
        cls = 'step ' + (done ? 'done' : 'todo'); icon = done ? 'check' : icon; t = pTitulo(p); s = quienTxt(p);
        pill = `<span class="tr-p">${np.solo ? 'Solo este paso: ' : ''}nota <b>${np.v}</b></span>`;
      } else if (x.c === 'warn' && x.key && S.steps[x.key] === 'yes') { cls = 'ghost'; t = 'Fecha de la tarjeta si no se hiciera nada'; s = ''; }
      else if (x.c === 'now') pill = E.nota.banda ? `<span class="tr-p navy">${esc(E.nota.banda)}</span>` : '';
      return `<div class="tr ${cls}" style="--i:${i}"><span class="tr-w">${esc(x.cuando)}</span><span class="tr-d">${ic(icon, x.c === 'end' ? 22 : 17)}</span><div class="tr-c"><b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ''}${pill}</div></div>`;
    }).join('');
    return `<div class="tline ${acc.length ? 'has' : ''}"><i class="tl-spine"></i>${rows}</div>`;
  }

  function slideHtml(id) {
    const acc = accepted(), sc = scoreFor(acc), max = E.nota.max;
    if (id === 'foto') {
      LAST_SCORE = null;
      const ord = E.areas.slice().sort((a, b) => a.nota - b.nota), peor = ord[0];
      return `<div class="kick">${w('Vuestra', 'Tu')} foto de hoy</div><h2>${E.nota.hoy} de 100. Lo que más pesa: ${esc(low1(peor.nombre))}.</h2>
        <div class="foto">${ring(E.nota.hoy, max)}<p class="muted small">${w('Vuestra', 'Tu')} nota de salud financiera${E.nota.banda ? `: <b>${esc(E.nota.banda)}</b>` : ''}. ${max > E.nota.hoy ? `Con ${w('vuestro', 'tu')} plan llega a <b>${max}</b>.` : ''}</p></div>
        <div class="areas">${E.areas.map((a, i) => `<div class="ar ${a.nota < 50 ? 'low' : a.nota < 75 ? 'mid' : 'hi'}" style="--i:${i}"><span class="ar-ic">${ic(a.icon, 18)}</span><b>${esc(a.nombre)}</b><div class="ar-b"><i style="width:${Math.max(3, a.nota)}%"></i></div><em>${a.nota}</em></div>`).join('')}</div>
        <p class="tiny" style="margin:0">Las cinco áreas con las que ${w('vuestro', 'tu')} plan calcula la nota, de 0 a 100.</p>`;
    }
    if (id.startsWith('f:')) {
      const q = QMAP[id.slice(2)], g = S.a[q.id], n = E.frenos.indexOf(q.id) + 1;
      return `<div class="kick bad">Freno ${n} · ${esc(q.freno.kick)}</div><h2>${esc(q.freno.h2)}</h2>
        <div class="sl-vis">${vis(q)}</div>
        ${g && g.revealed ? `<div class="memo">${ic('eye', 16)}<span>${w('Vosotros pensabais', 'Tú pensabas')} <b>${esc(low1(fmtGuess(q, g.value)))}</b>. ${w('Vuestro', 'Tu')} plan dice <b>${esc(q.plan)}</b>.</span></div>` : q.siente ? `<div class="memo">${ic('eye', 16)}<span>${q.siente}</span></div>` : ''}
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
      <button class="link" style="width:100%" data-act="later">${S.later ? `${w('Os', 'Te')} avisamos dentro de una semana` : `Ahora no. ${w('Avisadnos', 'Avísame')} dentro de una semana`}</button>`}`;
  }

  let STORY_DIR = '';
  function renderStory() {
    const i = Math.max(0, Math.min(S.slide, SLIDES.length - 1)), id = SLIDES[i], last = i === SLIDES.length - 1;
    app.innerHTML = `<div class="narrow storyw"><div class="segs" aria-label="Pantalla ${i + 1} de ${SLIDES.length}">${SLIDES.map((_, k) => `<button data-act="goslide" data-v="${k}" class="${k < i ? 'past' : k === i ? 'cur' : ''}" aria-label="Ir a la pantalla ${k + 1}"></button>`).join('')}</div>
      <div class="slide ${STORY_DIR}" data-id="${id}">${slideHtml(id)}</div></div>
      <div class="cta-bar"><div class="cta-in">${i > 0 ? `<button class="btn ghost" data-act="prev" aria-label="Atrás">${ic('arrow', 18).replace('<svg', '<svg style="transform:rotate(180deg)"')}</button>` : ''}
        <button class="btn grow ${last || (id === 'primer' && !S.payDate) ? 'soft' : ''}" data-act="${last ? 'fullplan' : 'nextslide'}">${last ? 'Ver el plan completo' : id === 'primer' && !S.payDate ? 'Ahora no' : 'Siguiente'}</button></div></div>`;
    animateRing(); STORY_DIR = '';
  }

  // ------------------------------------------------------------------ plan completo
  function counts() {
    const open = S.doubts.filter(d => d.status === 'open').length, resolved = S.doubts.filter(d => d.status === 'resolved').length;
    const v = E.pasos.map(p => S.steps[p.key]);
    return { open, resolved, yes: v.filter(x => x === 'yes').length, no: v.filter(x => x === 'no').length, pending: v.filter(x => x == null).length, n: E.pasos.length };
  }
  function nextStep() {
    const c = counts();
    if (c.yes === c.n && c.open === 0) return { title: w('Listos para empezar', 'Todo listo para empezar'), mins: 20, days: 2, text: `${w('Habéis', 'Has')} aceptado todos los pasos y no queda ninguna duda. Una reunión corta para arrancar.` };
    if (c.pending === c.n && c.open === 0) return { title: `Primero, ${w('decidid', 'decide')} los pasos`, mins: 30, days: 5, text: `${w('Contestad', 'Contesta')} «¿${w('Os', 'Te')} convence?» en cada paso. Cuantas más dudas queden resueltas aquí, más corta será la reunión.` };
    if (c.no === 0 && c.open <= 2) return { title: w('Casi listos', 'Casi todo listo'), mins: 30, days: 5, text: c.open ? `${c.open === 1 ? 'Queda 1 duda' : 'Quedan 2 dudas'} que el plan no responde. ${w('Vuestro', 'Tu')} asesor llega con ${c.open === 1 ? 'ella preparada' : 'ellas preparadas'}.` : `Falta decidir algún paso. En media hora queda cerrado con ${w('vuestro', 'tu')} asesor.` };
    return { title: 'Mejor hablarlo con calma', mins: 45, days: 10, text: `Hay pasos que no ${w('os', 'te')} convencen o varias dudas abiertas. Una reunión más larga, sin compromiso, para revisar el plan.` };
  }
  const doubtLine = d => `<div class="doubt ${d.status === 'resolved' ? 'resolved' : 'advisor'}"><div class="spread"><b class="small">${esc(d.q)}</b>${d.status === 'resolved' ? '<span class="tag good">Resuelta</span>' : '<span class="tag acc">Para la reunión</span>'}</div></div>`;

  function stepCard(p, i) {
    const v = S.steps[p.key], mine = S.doubts.filter(d => d.paso === p.key);
    let after = '';
    if (E.primer && E.primer.key === p.key && v === 'yes') {
      after = S.payDate
        ? `<div class="datechip"><span class="dc-ic">${ic('cal', 22)}</span><div><small>Lo ${w('hacéis', 'haces')} el</small><b>${esc(S.payDate.label)}</b></div><button class="link small" data-act="cal" data-k="pay">Cambiar</button></div>
           <details class="why"><summary>Cómo se hace, en tres pasos</summary><ol class="how">${E.primer.como.map(x => `<li>${esc(x)}</li>`).join('')}</ol>${window.__PREVIEW__ ? '' : '<button class="btn soft" data-act="ics" data-k="pay">Añadir al calendario</button>'}</details>`
        : `<button class="btn block" style="margin-top:12px" data-act="cal" data-k="pay">${ic('cal')} Elegir día y hora</button>`;
    } else if (v === 'yes') {
      after = p.quien === 'asesor' ? `<div class="datechip soft"><span class="dc-ic">${ic('chat', 22)}</span><div><small>Este paso se hace con ${w('vuestro', 'tu')} asesor</small><b>Lo trae preparado a la reunión</b></div></div>` : '';
    }
    return `<div class="rstep ${v === 'yes' ? 'done' : ''}" id="step-${p.key}"><span class="rdot">${v === 'yes' ? ic('check', 18) : i + 1}</span>
     <div class="card step">
      <div class="spread" style="align-items:flex-start"><div class="kicker" style="margin:0">${quienTxt(p)} · esfuerzo ${esc(p.esfuerzo)}</div><span class="tag acc" title="Nota si solo se hace este paso">Solo: nota ${p.nota}</span></div>
      <h3 style="margin:6px 0">${esc(pTitulo(p))}</h3>
      ${p.porque ? `<p>${esc(p.porque)}</p>` : ''}
      <p style="margin:14px 0 0;font-weight:600">¿${w('Os', 'Te')} convence?</p>
      <div class="vote">${[['yes', 'Sí'], ['doubt', w('Tenemos dudas', 'Tengo dudas')], ['no', 'No']].map(([k, l]) => `<button class="chip" data-act="vote" data-s="${p.key}" data-v="${k}" aria-pressed="${v === k}">${l}</button>`).join('')}</div>
      ${after}${mine.length ? `<div style="margin-top:10px">${mine.map(doubtLine).join('')}</div>` : ''}
     </div></div>`;
  }

  function believed() {
    return E.preguntas.filter(q => (S.a[q.id] || {}).revealed).map(q => [q.creian, fmtGuess(q, S.a[q.id].value), `${q.plan} ${q.unidad}`]);
  }
  const tbl = rows => `<table class="nums"><tr><td class="tiny">Tema</td><td class="tiny" style="text-align:left">${w('Creíais', 'Creías')}</td><td class="tiny">El plan</td></tr>${rows.map(r => `<tr><td>${esc(r[0])}</td><td style="text-align:left;font-weight:400">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>`;
  function fold(id, n, title, sub, body, openDefault) {
    const open = S.fold[id] != null ? S.fold[id] : openDefault;
    return `<details class="fold" id="s-${id}" data-fold="${id}" ${open ? 'open' : ''}><summary><b class="n">${n}</b><span class="ft"><strong>${title}</strong><small>${sub}</small></span><i class="chev">${ic('arrow', 18)}</i></summary><div class="foldbody">${body}</div></details>`;
  }
  function goalsStrip() {
    const g = E.linea.filter(x => x.c === 'goal' || x.c === 'end');
    return g.length ? `<div class="rstep goal"><span class="rdot">${ic('flag', 16)}</span><div class="goals"><div class="kicker" style="margin:0 0 8px">A dónde lleva ${w('vuestro', 'tu')} plan</div>
      <div class="goalrow">${g.map(x => `<div class="goalc"><span>${ic(x.icon, 20)}</span><b>${esc(x.cuando)}</b><small>${esc(x.t)}</small></div>`).join('')}</div></div></div>` : '';
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

  function renderPlan() {
    const ns = nextStep(), c = counts(), rows = believed(), acc = accepted(), sc = scoreFor(acc), max = E.nota.max, openAll = window.innerWidth >= 1000;
    let main = `<section class="planhero"><div class="kicker" style="margin:0">Plan de ${esc(E.fam.titulo)}</div>
      <h1>«${esc(S.phrase || `${w('Vuestro', 'Tu')} plan`)}»</h1>
      <div class="heroscore">${ring(sc.v, max)}
        <div><b class="hs-t">${acc.length ? `${w('Vuestra', 'Tu')} nota con lo que ${w('habéis', 'has')} aceptado` : `${w('Vuestra', 'Tu')} nota de salud financiera, hoy`}</b>
        <p class="muted small" style="margin:.3em 0 0">${max > E.nota.hoy ? `Con los pasos de ${w('vuestro', 'tu')} plan llega a <b>${max}</b>. ` : ''}${w('Lleváis', 'Llevas')} ${acc.length} de ${c.n}.${sc.parcial ? ' El plan da la nota de cada paso por separado.' : ''}</p></div></div></section>`;

    main += `<div class="section" id="s-pasos"><div class="kicker"><b>1</b>${w('Vuestra', 'Tu')} hoja de ruta</div>
      <p class="muted" style="margin-top:-2px">${c.n} ${c.n === 1 ? 'paso' : 'pasos'}, en el orden del plan. ${w('Decid', 'Di')} en cada uno si ${w('os', 'te')} convence.</p>
      <div class="road"><div class="rstep start"><span class="rdot">${ic('flag', 16)}</span><div class="startc"><b>Hoy · nota ${E.nota.hoy}</b>${E.nota.banda ? `<small>${esc(E.nota.banda.replace(/^./, x => x.toUpperCase()))}, según ${w('vuestro', 'tu')} plan</small>` : ''}</div></div>
      ${E.pasos.map(stepCard).join('')}${goalsStrip()}</div></div>`;

    main += `<div class="section" id="s-cierre"><div class="kicker"><b>2</b>${w('Vuestro', 'Tu')} siguiente paso</div>
      <div class="card close"><div class="meter">
        <div><b>${c.yes}/${c.n}</b><span class="tiny">pasos aceptados</span></div>
        <div><b>${c.resolved}</b><span class="tiny">dudas resueltas</span></div>
        <div><b>${c.open}</b><span class="tiny">para la reunión</span></div></div>
        ${S.gain ? `<p class="quote">Con esto resuelto: <b>«${esc(S.gain)}»</b></p>` : ''}
        ${S.booking ? bookedCard() : `<h2 style="margin-top:14px">${ns.title}</h2><p>${ns.text}</p>
        <ul class="ticks"><li>${ic('check', 16)}${w('Salís', 'Sales')} con el orden de ${w('vuestros', 'tus')} pasos y respuesta a ${w('vuestras', 'tus')} dudas</li><li>${ic('check', 16)}${ns.mins} minutos por videollamada</li><li>${ic('check', 16)}No hay que preparar nada</li></ul>
        <button class="btn block big-cta" data-act="book">${ic('cal')} ${c.yes ? `Elegir día con ${w('vuestro', 'tu')} asesor` : `Hablarlo con ${w('vuestro', 'tu')} asesor`}</button>
        <p class="tiny" style="text-align:center;margin:.6em 0 0">Sin compromiso. ${w('Decidís vosotros', 'Decides tú')}.</p>`}
        <button class="link" style="width:100%" data-act="whatif">Antes, ${w('tenemos', 'tengo')} otra pregunta</button></div>
      ${weekCard()}
      ${E.primer && (S.payDate || S.booking) && !S.week ? `<button class="weeklink" data-act="week">${ic('clock', 18)}<span><b>Una semana después</b><small>Cómo comprobamos que el primer paso está hecho</small></span>${ic('arrow', 18)}</button>` : ''}
      ${S.booking ? fold('hoja', ic('list', 16), `Lo que recibe ${w('vuestro', 'tu')} asesor`, `La hoja con ${w('vuestras', 'tus')} respuestas y dudas`, advisorSheet(), false) : ''}</div>`;

    main += `<div class="section"><div class="kicker"><b>3</b>Más sobre ${w('vuestro', 'tu')} plan</div>`;
    if (rows.length) main += fold('creiais', ic('eye', 16), `Lo que ${w('creíais', 'creías')} y lo que dice el plan`, `${rows.length} respuestas comparadas`, `<div class="card">${tbl(rows)}</div>`, openAll);
    main += fold('linea', ic('flag', 16), `De hoy a ${w('vuestra', 'tu')} jubilación`, 'Los pasos, las compras y las fechas del plan en una línea', lineaHtml(), openAll);
    main += fold('areas', ic('chart', 16), `${w('Vuestra', 'Tu')} nota por áreas`, 'Las cinco áreas con las que el plan calcula la nota', `<div class="card">${rowsTbl(E.areas.map(a => [a.nombre, `${a.nota} de 100`]))}</div>`, openAll);
    main += `</div><p class="foot">Esto ayuda a entender el plan del asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, ${w('hablad con vuestro', 'habla con tu')} asesor. Caso de ejemplo del reto. ${fuente()}</p>`;

    app.innerHTML = `<div class="plan-grid solo"><div>${main}</div></div>
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
      ${believed().length ? `<h3>Lo que creía y lo que dice el plan</h3>${tbl(believed())}` : ''}
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
      CAL = { kind, day, time };
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
      <button class="btn block" data-act="calok">${kind === 'pay' ? 'Apuntar este día' : 'Pedir esta reunión'}</button>
      <p class="tiny" style="margin-top:10px;text-align:center">${kind === 'pay' ? `Nada mueve dinero desde aquí: el pago lo ${w('hacéis vosotros', 'haces tú')}.` : `Al confirmar, ${w('vuestro', 'tu')} asesor recibe los pasos y las dudas. En este prototipo no se envía nada.`}</p>`);
  }

  // Una semana después: se pide el saldo, no un "ya lo hice".
  const WEEK_REASONS = () => [w('Tenemos dudas', 'Tengo dudas'), w('No sabemos cómo hacerlo', 'No sé cómo hacerlo'), 'Ahora no es prioridad', E.fam.pl ? 'No lo vemos igual los dos' : 'Prefiero hablarlo antes'];
  function weekSheet() {
    const p = E.primer;
    sheet(`<div class="kicker">Una semana después · vista previa</div><h2>${esc(p.semana.q)}</h2>
      <p class="muted small">Esto llegaría a los siete días. Se mira en la app del banco y se escribe aquí.</p>
      <div class="moneyin"><input id="bal" type="number" inputmode="numeric" min="0" step="100" placeholder="0" aria-label="Saldo de la tarjeta"><span>$</span></div>
      <div class="chips" style="margin:10px 0 16px"><button class="chip" data-act="weekfill" data-v="${p.despues}">${p.despuesTxt}</button><button class="chip" data-act="weekfill" data-v="${p.hoy}">${p.hoyTxt}, sigue igual</button></div>
      <button class="btn block" data-act="weekok">Comprobar</button>`);
  }
  const meetCtas = () => S.booking ? '<button class="btn block" data-act="close">Seguir</button>' : '<button class="btn block" data-act="book">Pedir reunión</button><button class="link" style="width:100%" data-act="close">Ahora no</button>';
  function weekDone(balance) {
    S.week = { done: true, balance }; S.steps[E.primer.key] = 'yes'; keep();
    sheet(`<div class="celebrate"><div class="burst">${ic('check', 40)}</div><div class="kicker">Paso 1 hecho</div><h2>De ${E.nota.hoy} a ${E.primer.nota}, sin ayuda de nadie.</h2>
      <p>La tarjeta ha bajado a ${M(balance)}. Los pasos que quedan se ven con ${w('vuestro', 'tu')} asesor.</p></div>${meetCtas()}`);
  }
  function weekStuck(balance) {
    sheet(`<div class="kicker">Una semana después</div><h2>¿Qué ${w('os', 'te')} frena?</h2><p class="muted small">No pasa nada. Se lo contamos a ${w('vuestro', 'tu')} asesor.</p>
      ${WEEK_REASONS().map(r => `<button class="opt" data-act="weekwhy" data-b="${balance}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}`);
  }

  // ------------------------------------------------------------------ modo pareja: «El impostor del dinero»
  // Un móvil, dos jugadores. Cada uno contesta en secreto y pasa el móvil (como en el juego del Impostor).
  // Mide lo que cada uno cree del dinero y del riesgo, y lo compara con el plan: la cifra real,
  // el perfil de riesgo que marcó cada uno y la peor caída de sus inversiones. Nada inventado.
  const PJ_STEPS = ['intro', 'pass:a', 'money:a', 'pass:b', 'money:b', 'rev:money', 'pass:a', 'risk:a', 'guess:a', 'vote:a', 'pass:b', 'risk:b', 'guess:b', 'vote:b', 'rev:risk', 'unmask', 'map'];
  const RISK = [['sell_all', 'Lo vendo todo', 1, 'x'], ['sell_part', 'Vendo una parte', 2, 'scale'], ['hold', 'No toco nada', 3, 'clock'], ['buy', 'Meto más dinero', 4.5, 'seed']];
  const pjFresh = () => ({ step: 0, money: { a: null, b: null }, risk: { a: null, b: null }, guess: { a: null, b: null }, vote: { a: null, b: null } });
  const pIdx = x => (x === 'b' ? 1 : 0), other = x => (x === 'a' ? 'b' : 'a');
  const pName = x => E.fam.adultos[pIdx(x)].nombre;
  const pAv = (x, sz = '') => `<span class="pj-av ${x} ${sz}" aria-hidden="true">${esc(pName(x).charAt(0))}</span>`;
  const riskOpt = id => RISK.find(r => r[0] === id) || null;
  const perfil = x => (E.pareja && E.pareja.perfiles[pIdx(x)]) || null;
  const escala = () => (E.pareja && E.pareja.escala) || ['Muy prudente', 'Prudente', 'Equilibrado', 'Dinámico', 'Atrevido'];
  const moneyQ = () => E.preguntas.find(q => q.id === 'tarjeta_interes') || E.preguntas.find(q => q.tipo !== 'opciones');
  const impostor = x => { const p = perfil(x), r = riskOpt(S.pj.risk[x]); return !!(p && p.nivel && r && Math.abs(r[2] - p.nivel) >= 1.5); };
  // Quién marcó el perfil más atrevido en el plan: 'a', 'b' o 'igual'.
  const masAtrevido = () => { const pa = perfil('a'), pb = perfil('b'); if (!pa || !pb || pa.nivel === pb.nivel) return 'igual'; return pa.nivel > pb.nivel ? 'a' : 'b'; };
  const aciertos = () => ['a', 'b'].reduce((n, x) => n + (S.pj.guess[x] && S.pj.guess[x] === S.pj.risk[other(x)] ? 1 : 0) + (S.pj.vote[x] === masAtrevido() ? 1 : 0), 0);
  const pjGo = () => swipe(() => { S.pj.step = Math.min(S.pj.step + 1, PJ_STEPS.length - 1); render(); window.scrollTo(0, 0); });

  function pjRound(n, name) { return `<div class="pj-round"><span>Ronda ${n} de 2</span><b>${name}</b></div>`; }
  function pjPass(x) {
    const first = S.pj.step === 1;
    return `<div class="pj-pass ${x}"><div class="pj-pass-in">
      ${pAv(x, 'xl')}
      <p class="pj-kick">${first ? 'Empieza' : 'Pásale el móvil a'}</p>
      <h2>${esc(pName(x))}</h2>
      <p class="pj-hide">${ic('eye', 18)} Que ${esc(pName(other(x)))} no mire</p>
      <button class="pj-reveal" data-act="pjgo"><span>Soy ${esc(pName(x))}: ver mi carta</span>${ic('arrow', 20)}</button>
    </div></div>`;
  }
  function pjCard(x, round, body, foot) {
    return `<div class="narrow pj-turn ${x}"><div class="pj-who">${pAv(x)}<span>Carta secreta de <b>${esc(pName(x))}</b></span>${ic('lock', 16)}</div>
      ${round}<div class="pj-card">${body}</div>${foot || ''}</div>`;
  }
  function pjMoney(x) {
    const q = moneyQ(), v = S.pj.money[x], st = q.step || 1, mid = Math.round((q.min + q.max) / 2 / st) * st, has = v != null;
    return pjCard(x, pjRound(1, 'El dinero'), `<h2 class="q">${esc(q.q)}</h2>
      <div class="numw"><div class="nw-val ${has ? '' : 'empty'}" id="pjamt">${has ? showV(q, v) : '?'}</div>
      <div class="nw-track"><input type="range" min="${q.min}" max="${q.max}" step="${st}" value="${has ? v : mid}" class="${has ? '' : 'untouched'}" data-act="pjrange" data-k="${x}" aria-label="${esc(q.q)}">${has ? '' : '<i class="nw-hint" aria-hidden="true"></i>'}</div>
      <div class="spread tiny"><span>${showV(q, q.min)}</span><span>${showV(q, q.max)}</span></div></div>`,
      `<div class="dock"><button class="btn block pj-btn ${x}" data-act="pjgo" id="pjsave" ${has ? '' : 'disabled'}>${ic('lock', 18)} Guardar en secreto</button></div>`);
  }
  function pjOpts(x, kind, list) {
    return list.map(([v, l, , i], k) => `<button class="opt pj-opt ${x}" style="--i:${k}" data-act="pjpick" data-k="${kind}" data-x="${x}" data-v="${v}" aria-pressed="${S.pj[kind][x] === v}">${optBody(i, esc(l))}</button>`).join('');
  }
  function pjRisk(x) {
    const c = E.pareja && E.pareja.caida;
    const head = c ? `En los últimos 3 años, ${w('vuestras', 'tus')} inversiones llegaron a caer un <b>${esc(c.txt)}</b>. Si mañana vuelve a pasar, ¿qué haces tú?` : `Si mañana ${w('vuestras', 'tus')} inversiones caen de golpe, ¿qué haces tú?`;
    return pjCard(x, pjRound(2, 'El riesgo'), `<h2 class="q">${head}</h2>${pjOpts(x, 'risk', RISK)}`);
  }
  function pjGuess(x) {
    return pjCard(x, pjRound(2, 'El riesgo'), `<h2 class="q">¿Y qué crees que contestará <span class="pj-name ${other(x)}">${esc(pName(other(x)))}</span>?</h2>${pjOpts(x, 'guess', RISK)}`);
  }
  function pjVote(x) {
    const opts = [['a', pName('a'), 0, 'eye'], ['b', pName('b'), 0, 'eye'], ['igual', 'Marcamos lo mismo', 0, 'scale']];
    return pjCard(x, pjRound(2, 'El riesgo'), `<p class="pj-kick dark">Última carta</p><h2 class="q">Cuando hicisteis el plan, cada uno marcó cuánto riesgo acepta. ¿Quién marcó el perfil más atrevido?</h2>${pjOpts(x, 'vote', opts)}`);
  }
  // Una línea con las dos marcas y la del plan.
  function pjTrack(q) {
    const va = S.pj.money.a, vb = S.pj.money.b, lo = Math.min(q.min, va, vb, q.real), hi = Math.max(q.max, va, vb, q.real), P = v => (v - lo) / (hi - lo || 1) * 100;
    // Etiquetas arriba o abajo sin pisarse: cada marca coge la primera fila libre.
    const used = { top: [], bot: [], bot2: [] };
    const mk = (cls, v, lab) => { const x = P(v), row = ['top', 'bot', 'bot2'].find(r => used[r].every(y => Math.abs(y - x) > 18)) || 'bot2'; used[row].push(x);
      return `<span class="pj-mk ${cls} ${row}" style="left:${x}%"><i></i><small>${lab}</small></span>`; };
    return `<div class="pj-track" aria-hidden="true"><div class="pj-line"></div>${mk('plan', q.real, 'Plan')}${mk('a', va, esc(pName('a')))}${mk('b', vb, esc(pName('b')))}</div>`;
  }
  function pjRevMoney() {
    const q = moneyQ(), va = S.pj.money.a, vb = S.pj.money.b, da = Math.abs(va - q.real), db = Math.abs(vb - q.real);
    const tol = q.tipo === 'importe' ? q.cerca * q.real : q.cerca, ca = da <= tol, cb = db <= tol;
    const tit = ca && cb ? 'Los dos lo teníais claro' : !ca && !cb ? 'Ninguno de los dos lo sabía' : `${ca ? pName('a') : pName('b')} lo tenía más claro`;
    return `<div class="narrow pj-rev">${pjRound(1, 'El dinero')}
      <h2 class="pj-tit">${esc(tit)}</h2>
      <div class="pj-says"><div class="a">${pAv('a')}<small>${esc(pName('a'))} decía</small><b>${esc(showV(q, va))}</b></div><div class="b">${pAv('b')}<small>${esc(pName('b'))} decía</small><b>${esc(showV(q, vb))}</b></div></div>
      <div class="rv-box pj-plan"><small>${w('Vuestro', 'Tu')} plan dice</small><b class="big">${esc(q.plan)}</b><em>${esc(q.unidad)}</em></div>
      ${pjTrack(q)}
      ${q.siente ? `<p class="rv-feel on">${q.siente}</p>` : ''}
      ${dock('Ronda 2: el riesgo', true, 'pjgo')}</div>`;
  }
  function pjScale(rows) {
    const L = escala();
    return `<div class="pj-scale" aria-hidden="true"><div class="pj-sc-bar">${L.map((_, i) => `<i style="left:${i / (L.length - 1) * 100}%"></i>`).join('')}</div>
      ${rows.map(([cls, lvl, lab, k]) => `<span class="pj-dot ${cls}" style="left:${(lvl - 1) / (L.length - 1) * 100}%;--k:${k}">${lab ? `<small>${lab}</small>` : ''}</span>`).join('')}
      <div class="pj-sc-lab"><span>${L[0]}</span><span>${L[L.length - 1]}</span></div></div>`;
  }
  function pjRevRisk() {
    const c = E.pareja && E.pareja.caida;
    const col = x => { const r = riskOpt(S.pj.risk[x]), g = riskOpt(S.pj.guess[other(x)]), ok = S.pj.guess[other(x)] === S.pj.risk[x];
      return `<div class="pj-col ${x}">${pAv(x)}<small>${esc(pName(x))} haría</small><b>${esc(r ? r[1] : '')}</b>
        <p class="pj-thought ${ok ? 'ok' : 'ko'}">${ic(ok ? 'check' : 'x', 16)} ${esc(pName(other(x)))} creía: ${esc(g ? low1(g[1]) : '')}</p></div>`; };
    return `<div class="narrow pj-rev">${pjRound(2, 'El riesgo')}
      <h2 class="pj-tit">${S.pj.guess.a === S.pj.risk.b && S.pj.guess.b === S.pj.risk.a ? 'Os leéis la mente' : S.pj.guess.a !== S.pj.risk.b && S.pj.guess.b !== S.pj.risk.a ? 'Pensáis distinto de lo que creéis' : 'Uno de los dos conoce mejor al otro'}</h2>
      <div class="pj-cols">${col('a')}${col('b')}</div>
      ${pjScale([['a ring', riskOpt(S.pj.risk.a)[2], esc(pName('a')), 0], ['b ring', riskOpt(S.pj.risk.b)[2], esc(pName('b')), 1]])}
      ${c && c.dias ? `<div class="pj-fact">${ic('clock', 22)}<p>Aquella caída del <b>${esc(c.txt)}</b> se recuperó en <b>${c.dias} días</b>. Quien vendió, se perdió la vuelta.</p></div>` : ''}
      ${dock('Desenmascarar al impostor', true, 'pjgo')}</div>`;
  }
  function pjUnmask() {
    const t = masAtrevido(), lab = v => v === 'igual' ? 'los dos igual' : pName(v);
    const card = (x, k) => { const p = perfil(x), r = riskOpt(S.pj.risk[x]), imp = impostor(x);
      return `<div class="pj-flip ${x}" style="--k:${k}"><div class="pj-fl-in"><div class="pj-fl-back">${pAv(x, 'lg')}<b>?</b></div>
        <div class="pj-fl-front">${pAv(x, 'lg')}<h3>${esc(pName(x))}</h3>
          <p><small>En el plan marcó</small><b>${esc(p ? p.etiqueta : 'sin dato')}</b></p>
          <p><small>En el juego</small><b>${esc(r ? r[1] : '')}</b></p>
          <span class="pj-stamp ${imp ? 'imp' : 'ok'}">${imp ? 'Impostor' : 'Coherente'}</span></div></div></div>`; };
    const anyImp = impostor('a') || impostor('b');
    const votes = ['a', 'b'].map(x => `<li>${pAv(x)} ${esc(pName(x))} votó a <b>${esc(lab(S.pj.vote[x]))}</b> ${S.pj.vote[x] === t ? `<span class="ok">${ic('check', 16)}</span>` : `<span class="ko">${ic('x', 16)}</span>`}</li>`).join('');
    return `<div class="narrow pj-rev">
      <h2 class="pj-tit">¿Hay un impostor en casa?</h2>
      <p class="muted small">Impostor: quien marca una cosa en el plan y hace otra cuando el dinero cae.</p>
      <div class="pj-flips">${card('a', 0)}${card('b', 1)}</div>
      <div class="pj-verdict" style="--k:2"><p>${anyImp ? `${esc(['a', 'b'].filter(impostor).map(pName).join(' y '))} ${['a', 'b'].filter(impostor).length > 1 ? 'dicen' : 'dice'} una cosa en el plan y haría otra. No pasa nada: es justo lo que conviene hablar.` : 'Aquí no hay impostores: cada uno hace lo que marcó en el plan.'}</p>
        <p class="small">El más atrevido según el plan: <b>${esc(lab(t))}</b>.</p><ul class="pj-votes">${votes}</ul></div>
      ${dock('Ver vuestro mapa', true, 'pjgo')}</div>`;
  }
  function pjMap() {
    const n = aciertos(), pa = perfil('a'), pb = perfil('b'), ra = riskOpt(S.pj.risk.a), rb = riskOpt(S.pj.risk.b);
    const rows = [];
    if (pa && pa.nivel) rows.push(['a fill', pa.nivel, esc(pName('a')), 0]);
    if (pb && pb.nivel) rows.push(['b fill', pb.nivel, esc(pName('b')), 1]);
    if (ra) rows.push(['a ring', ra[2], '', 2]);
    if (rb) rows.push(['b ring', rb[2], '', 3]);
    const dif = pa && pb && pa.nivel !== pb.nivel;
    return `<div class="narrow pj-rev pj-map">
      <p class="pj-kick dark">Vuestro mapa de pareja</p>
      <div class="pj-score"><b>${n}</b><span>de 4</span></div>
      <h2 class="pj-tit">${n >= 3 ? 'Os conocéis muy bien' : n === 2 ? 'Os conocéis a medias' : 'Tenéis mucho que contaros'}</h2>
      <p class="muted small">Aciertos sobre lo que haría el otro y sobre quién es más atrevido.</p>
      <div class="card pj-mapcard"><h3>Cuánto riesgo acepta cada uno</h3>${pjScale(rows)}
        <p class="tiny"><span class="pj-key fill"></span> lo que marcó en el plan &nbsp; <span class="pj-key ring"></span> lo que haría en el juego</p></div>
      <div class="pj-cta">
        <p>${dif ? `En el plan, ${esc(pa.nombre)} es <b>${esc(low1(pa.etiqueta))}</b> y ${esc(pb.nombre)}, <b>${esc(low1(pb.etiqueta))}</b>. ` : ''}Cuánto riesgo queréis <b>como familia</b> se decide juntos, y para eso está ${w('vuestro', 'tu')} asesor. Le llegará este mapa.</p>
        <button class="btn block" data-act="pjplan">${E.preguntas.some(q => (S.a[q.id] || {}).revealed) ? `Ver ${w('vuestro', 'tu')} plan` : 'Seguir con vuestro plan'} ${ic('arrow', 18)}</button>
        <button class="btn ghost block" data-act="book">${ic('cal', 18)} Pedir reunión con el asesor</button>
        <button class="link block" data-act="pjagain">Volver a jugar</button>
      </div></div>`;
  }
  function pjIntro() {
    return `<div class="narrow pj-intro"><div class="pj-duo">${pAv('a', 'xl')}${pAv('b', 'xl')}</div>
      <h1 class="pj-h1">El impostor<br>del dinero</h1>
      <p class="muted">Un móvil, dos jugadores. ¿Cuánto sabéis de vuestro dinero y del otro?</p>
      <ol class="pj-rules"><li><span>1</span><p>Cada uno contesta <b>en secreto</b> y pasa el móvil.</p></li><li><span>2</span><p>Al final de cada ronda se ven las dos respuestas y lo que dice el plan.</p></li><li><span>3</span><p>Descubrimos si hay un <b>impostor</b>: quien dice una cosa y haría otra.</p></li></ol>
      ${dock('Empezar a jugar', true, 'pjgo')}</div>`;
  }
  function renderPareja() {
    if (!S.pj) S.pj = pjFresh();
    const [kind, x] = PJ_STEPS[S.pj.step].split(':');
    const prog = `<div class="progress thin"><div class="bar"><i style="width:${S.pj.step / (PJ_STEPS.length - 1) * 100}%"></i></div></div>`;
    const V = { intro: pjIntro, pass: () => pjPass(x), money: () => pjMoney(x), 'rev': () => (x === 'money' ? pjRevMoney() : pjRevRisk()), risk: () => pjRisk(x), guess: () => pjGuess(x), vote: () => pjVote(x), unmask: pjUnmask, map: pjMap }[kind];
    app.innerHTML = (kind === 'pass' ? '' : prog) + V();
  }
  function pjSheetBlock() {
    if (!S.pj || S.pj.step < PJ_STEPS.indexOf('map')) return '';
    const q = moneyQ(), lab = v => v === 'igual' ? 'los dos igual' : pName(v);
    const row = x => { const p = perfil(x), r = riskOpt(S.pj.risk[x]), g = riskOpt(S.pj.guess[other(x)]);
      return `<li><b>${esc(pName(x))}</b>: en el plan ${esc(p ? low1(p.etiqueta) : 'sin dato')}; ante una caída, «${esc(r ? low1(r[1]) : '')}»${impostor(x) ? ' (no encaja con su perfil)' : ''}. Su pareja creía: «${esc(g ? low1(g[1]) : '')}». Sobre el dinero decía ${esc(showV(q, S.pj.money[x]))} (plan: ${esc(q.plan)}).</li>`; };
    return `<h3>Modo pareja</h3><ul>${row('a')}${row('b')}<li>Votaron como más atrevido a: ${esc(pName('a'))} → ${esc(lab(S.pj.vote.a))}, ${esc(pName('b'))} → ${esc(lab(S.pj.vote.b))}. Aciertos: ${aciertos()} de 4.</li></ul>`;
  }

  // ------------------------------------------------------------------ barra superior y portada
  function renderTop() {
    const talk = `<button class="pill talk" data-act="talk"><span class="lbl-long">Hablarlo con una persona</span><span class="lbl-short" aria-hidden="true">Asesor</span></button>`;
    if (S.stage === 'plan' || S.stage === 'story') topActions.innerHTML = `${S.stage === 'plan' ? '<button class="pill" data-act="story">Resumen</button>' : ''}<button class="pill" data-act="settings" aria-label="Ajustes"><span aria-hidden="true">⚙</span> <span class="lbl-long">Ajustes</span></button>${talk}`;
    else if (S.stage === 'quiz') topActions.innerHTML = `<button class="pill nb" id="nb" data-act="nb" aria-label="Cuaderno para ${w('vuestro', 'tu')} asesor">${ic('pen', 16)}<b>${nbCount()}</b></button><button class="pill" data-act="skip">Saltar</button>${talk}`;
    else if (S.stage === 'pareja') topActions.innerHTML = `<button class="pill" data-act="skip">Saltar al plan</button>${talk}`;
    else topActions.innerHTML = '';
    document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; });
  }

  let homeTimer = null;
  // Dos apartados cuando el plan es de una pareja: jugar juntos o contestar cada uno por su cuenta.
  function doors() {
    const ad = E.fam.adultos, enJuego = S.mode === 'pareja' && S.pj && S.pj.step > 0, enSolo = S.mode === 'solo' && S.qi > 0;
    return `<div class="doors">
      <button class="door duo" data-act="mode" data-v="pareja"><span class="pj-duo sm">${pAv('a')}${pAv('b')}</span>
        <span class="d-tx"><small>En pareja · juego · 3 min</small><b>${enJuego ? 'Seguir la partida' : 'El impostor del dinero'}</b><span>Un móvil, dos jugadores. ¿Cuánto os conocéis con el dinero?</span></span><span class="arr">${ic('arrow', 20)}</span></button>
      <button class="door solo" data-act="mode" data-v="solo"><span class="d-ic">${ic('eye', 22)}</span>
        <span class="d-tx"><small>Individual · 5 min</small><b>${enSolo ? 'Seguir donde lo dejé' : 'Cada uno a su ritmo'}</b><span>${esc(ad[0].nombre)} o ${esc(ad[1].nombre)}, con las preguntas del plan.</span></span><span class="arr">${ic('arrow', 20)}</span></button></div>`;
  }
  // --- A. Portada: vuestros nombres, una frase y un botón. Al pulsar, barrido y frase puente.
  function renderHome() {
    const ad = E.fam.adultos, kids = E.fam.hijos.map(k => k.nombre).join(' y ');
    app.innerHTML = `<div class="home"><section class="hello">
        <h1><span class="h-a">${w('Bienvenidos a vuestro', 'Te damos la bienvenida a tu')}</span> <span class="h-b">plan de futuro</span></h1>
        <p class="h-names">${esc(ad.map(x => x.nombre).join(' y '))}</p>
        ${kids ? `<p class="h-kids">Pensado también para ${esc(kids)}.</p>` : ''}
        ${E.fam.pl ? doors() : `<button class="startbtn" data-act="start"><span>${S.qi > 0 ? `Seguir donde lo ${w('dejasteis', 'dejaste')}` : 'Empezar'}</span><span class="arr">${ic('arrow', 22)}</span></button>`}
        <p class="h-trust">5 minutos · Sin cuentas · Cifras de ${w('vuestro', 'tu')} plan<br>${w('Vuestro', 'Tu')} asesor verá las respuestas para preparar la reunión</p>
      </section>
      <div class="home-foot"><button class="link small" data-act="skip">${w('Preferimos', 'Prefiero')} ir directamente al plan</button>
        <details class="h-casos"><summary>Prototipo del reto: cambiar de familia</summary>${casePicker()}</details>
        <p class="foot">Esto ayuda a entender el plan del asesor. No es consejo nuevo ni lo cambia. ${fuente()}</p></div></div>`;
    clearInterval(homeTimer);
  }
  let BRIDGE_T = null;
  function bridge() {
    topActions.innerHTML = '';
    app.innerHTML = `<div class="narrow"><button class="bridge" data-act="bridge"><span>Antes de ir a los detalles,</span> <span>veamos cuánto ${w('conocéis vuestra', 'conoces tu')} situación.</span></button></div>`;
    window.scrollTo(0, 0);
    BRIDGE_T = setTimeout(endBridge, 2900);
  }
  function endBridge() {
    clearTimeout(BRIDGE_T);
    if (!app.querySelector('.bridge')) return;
    swipe(() => { S.stage = 'quiz'; render(); });
  }

  function render() {
    renderTop();
    if (window.Fondo) Fondo.show(S.stage === 'home' || S.stage === 'quiz' || S.stage === 'pareja');
    if (S.stage === 'home') renderHome();
    else if (S.stage === 'quiz') renderQuiz();
    else if (S.stage === 'pareja') renderPareja();
    else if (S.stage === 'story') renderStory();
    else renderPlan();
    save();
  }
  function keep() { const y = window.scrollY; render(); window.scrollTo(0, y); }
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2400); }

  // ------------------------------------------------------------------ eventos
  document.addEventListener('toggle', e => {
    if (e.target.matches && e.target.matches('details[data-fold]')) { S.fold[e.target.dataset.fold] = e.target.open; save(); }
  }, true);
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'free') { DRAFT = t.value; return; }
    if (t.dataset.act === 'pjrange') {
      const q = moneyQ(), x = t.dataset.k;
      t.classList.remove('untouched'); S.pj.money[x] = +t.value;
      const v = document.getElementById('pjamt'); v.textContent = showV(q, +t.value); v.classList.remove('empty');
      app.querySelectorAll('.nw-hint').forEach(el => el.remove());
      const bt = document.getElementById('pjsave'); if (bt) bt.disabled = false;
      save(); return;
    }
    if (t.id === 'worry' || t.id === 'note') {
      if (window.Fondo) Fondo.pulse();
      const bt = t.id === 'worry' ? app.querySelector('[data-act="worry"]:not([data-v])') : app.querySelector('.savebtn');
      if (bt) bt.disabled = !t.value.trim();
      return;
    }
    if (t.dataset.act === 'range') {
      const q = QMAP[t.dataset.k];
      t.classList.remove('untouched');
      S.a[q.id] = Object.assign(S.a[q.id] || {}, { value: +t.value });
      const v = document.getElementById('amt'); v.textContent = showV(q, +t.value); v.classList.remove('empty');
      app.querySelectorAll('.nw-hint, .nw-tip').forEach(x => x.remove());
      const btn = document.querySelector('[data-act="reveal"]'); if (btn) btn.disabled = false;
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
      case 'mode':
        if (v === 'pareja') { if (S.mode !== 'pareja' || !S.pj) S.pj = pjFresh(); S.mode = 'pareja'; S.who = 'juntos'; swipe(() => { S.stage = 'pareja'; render(); window.scrollTo(0, 0); }); }
        else { if (S.mode !== 'solo') { S.qi = 0; S.who = null; } S.mode = 'solo'; if (S.qi > 0) swipe(() => { S.stage = 'quiz'; render(); }); else swipe(bridge); }
        break;
      case 'pjgo': pjGo(); break;
      case 'pjpick': { const kind = k, x = b.dataset.x; S.pj[kind][x] = v; render(); clearTimeout(ADV_T); ADV_T = setTimeout(pjGo, 320); break; }
      case 'pjplan': {
        // Tras el juego, la pareja sigue por el quiz abierto (frase, revelaciones y cuaderno) salvo que ya lo hiciera.
        if (E.preguntas.some(q => (S.a[q.id] || {}).revealed)) { S.prefs.level = S.prefs.level || 'new'; preparePlan(); break; }
        S.who = 'juntos'; S.qi = Math.max(0, QUIZ.indexOf('phrase'));
        swipe(() => { S.stage = 'quiz'; render(); window.scrollTo(0, 0); }); break;
      }
      case 'pjagain': S.pj = pjFresh(); render(); window.scrollTo(0, 0); break;
      case 'help': S.help[k] = true; keep(); { const ex = document.getElementById('rv-exit'); if (ex) ex.scrollIntoView({ behavior: 'smooth', block: 'center' }); } break;
      case 'skip': toPlan(); render(); window.scrollTo(0, 0); break;
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
        const q = QMAP[QUIZ[S.qi]]; S.a[q.id].revealed = true;
        if (document.startViewTransition) { document.startViewTransition(() => playReveal(q)); break; }
        const st = app.querySelector('.qstage'); if (st) st.classList.add('fade-out'); setTimeout(() => playReveal(q), 300); break;
      }
      case 'sugg': { const t = document.getElementById('worry'); t.value = v; t.focus(); const bt = app.querySelector('[data-act="worry"]:not([data-v])'); if (bt) bt.disabled = false; if (window.Fondo) Fondo.pulse(); break; }
      case 'worry': {
        const t = document.getElementById('worry'), txt = v === 'skip' ? '' : (t ? t.value.trim() : '');
        S.phrase = txt; S.match = temasDe(txt); buildQuiz(S.match);
        S.doubts = S.doubts.filter(d => d.id !== 'nota-ronda');
        if (txt) { S.doubts.push({ id: 'nota-ronda', topic: 'otra', q: `Lo que ${w('les', 'le')} ronda la cabeza: «${txt}»`, covered: 'no', status: 'open' }); renderTop(); fly(t, txt); }
        save(); setTimeout(nextQ, txt ? 450 : 0); break;
      }
      case 'nsugg': { const t = document.getElementById('note'), l = (REACT.find(r => r[0] === v) || [0, () => ''])[1](); S.react[k] = v; t.value = t.value.trim() ? t.value.trim().replace(/[.\s]*$/, '. ') + l : l; t.dispatchEvent(new Event('input', { bubbles: true })); save(); break; }
      case 'note': {
        const t = document.getElementById('note'), txt = t.value.trim(); if (!txt) break;
        S.notes[k] = txt; S.doubts = S.doubts.filter(d => d.id !== 'nota-' + k);
        S.doubts.push({ id: 'nota-' + k, topic: 'otra', q: `${QMAP[k].creian}: «${txt}»`, covered: 'no', status: 'open' });
        renderTop(); fly(t, txt); setTimeout(keep, 500); break;
      }
      case 'nb': nbSheet(); break;
      case 'next': go(); break;
      case 'toplan': preparePlan(); break;
      case 'nextslide': S.slide = Math.min(S.slide + 1, SLIDES.length - 1); STORY_DIR = 'fwd'; render(); window.scrollTo(0, 0); break;
      case 'prev': S.slide = Math.max(S.slide - 1, 0); STORY_DIR = 'back'; render(); window.scrollTo(0, 0); break;
      case 'goslide': S.slide = +v; STORY_DIR = 'fwd'; render(); window.scrollTo(0, 0); break;
      case 'fullplan': S.stage = 'plan'; render(); window.scrollTo(0, 0); break;
      case 'story': S.stage = 'story'; S.slide = 0; render(); window.scrollTo(0, 0); break;
      case 'tog': { const s = b.dataset.s; S.steps[s] = S.steps[s] === 'yes' ? null : 'yes'; keep(); break; }
      case 'oq': { const id = b.dataset.id; S.openQ = S.openQ.includes(id) ? S.openQ.filter(x => x !== id) : S.openQ.concat(id); keep(); break; }
      case 'later': S.later = true; keep(); toast(`Hecho. ${w('Os', 'Te')} avisamos dentro de una semana`); break;
      case 'vote': {
        const s = b.dataset.s, before = scoreFor(accepted()).v;
        S.steps[s] = S.steps[s] === v ? null : v; keep();
        const after = scoreFor(accepted()).v;
        if (S.steps[s] === 'doubt') { S.cat = null; askSheet(s); } else if (S.steps[s] === 'no') noSheet(s);
        else if (S.steps[s] === 'yes' && E.primer && E.primer.key === s && !S.payDate) calSheet('pay');
        else if (S.steps[s] === 'yes') toast(after > before ? `${w('Vuestra', 'Tu')} nota sube de ${before} a ${after}` : 'Apuntado');
        break;
      }
      case 'noreason': S.doubts.push({ id: 'no-' + b.dataset.s + '-' + Date.now(), topic: 'otra', paso: b.dataset.s, q: `No a «${low1(paso(b.dataset.s).titulo)}»: ${v}`, covered: 'no', status: 'open' }); closeSheet(); keep(); toast('Apuntado para la reunión'); break;
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
      case 'close': closeSheet(); break;
      case 'talk': talkSheet(); break;
      case 'settings': settingsSheet(); break;
      case 'setpref': S.prefs.level = v; keep(); settingsSheet(); break;
      case 'book': if (S.stage === 'home' || S.stage === 'quiz') { toPlan(); render(); } calSheet('meet'); break;
      case 'cal': calSheet(k); break;
      case 'calday': CAL.day = v; calSheet(CAL.kind, true); break;
      case 'caltime': CAL.time = v; calSheet(CAL.kind, true); break;
      case 'calok': {
        const dt = fromIso(CAL.day, CAL.time), kind = CAL.kind;
        if (kind === 'pay') { S.payDate = { iso: CAL.day, time: CAL.time, label: fmtLong(dt) }; S.steps[E.primer.key] = 'yes'; closeSheet(); keep(); toast(`Apuntado. Con ese paso, la nota pasa a ${E.primer.nota}`); }
        else { S.booking = { iso: CAL.day, time: CAL.time, label: fmtSlot(dt), short: fmtSlot(dt), mins: nextStep().mins }; syncOpenQ(); closeSheet(); if (S.stage === 'plan') { render(); const sc = document.getElementById('s-cierre'); if (sc) sc.scrollIntoView({ behavior: 'smooth' }); } else keep(); toast('Reunión pedida'); }
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

  function downloadIcs(kind) {
    const pay = kind === 'pay', b = pay ? S.payDate : S.booking; if (!b) return;
    const s = fromIso(b.iso.slice(0, 10), b.time), e2 = new Date(s.getTime() + (pay ? 15 : b.mins) * 60000);
    const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//plan//es', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@plan', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(s), 'DTEND:' + z(e2),
      'SUMMARY:' + (pay ? E.primer.titulo : 'Reunión con el asesor: empezar el plan'), 'DESCRIPTION:' + (pay ? `Primer paso del plan. Después, el saldo de la tarjeta queda en ${E.primer.despuesTxt}.` : summaryText().replace(/\n/g, '\\n')), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = pay ? 'primer-paso.ics' : 'reunion-plan.ics'; a.click();
  }
  function summaryText() {
    const acc = E.pasos.filter(p => S.steps[p.key] === 'yes').map(p => '- ' + p.titulo), open = S.doubts.filter(d => d.status === 'open').map(d => '- ' + d.q);
    return `${E.fam.titulo}. Reunión: ${S.booking ? S.booking.label + ' (' + S.booking.mins + ' min)' : 'sin fecha'}${S.phrase ? '\nLo que más importa: ' + S.phrase : ''}${S.gain ? '\nQué cambiaría en casa: ' + S.gain : ''}${S.pj && S.pj.step >= PJ_STEPS.indexOf('map') ? `\nModo pareja: ${['a', 'b'].map(x => `${pName(x)} (plan: ${perfil(x) ? low1(perfil(x).etiqueta) : 'sin dato'}; ante una caída: ${riskOpt(S.pj.risk[x]) ? low1(riskOpt(S.pj.risk[x])[1]) : '-'})`).join(', ')}. Aciertos: ${aciertos()} de 4` : ''}\nNivel: ${PRO() ? 'sabe de finanzas' : 'nuevo en esto'}${S.payDate ? '\nPrimer paso con fecha: ' + S.payDate.label : ''}\nPasos aceptados:\n${acc.join('\n') || '- ninguno'}\nPreguntas para la reunión:\n${open.join('\n') || '- ninguna'}`;
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
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="narrow card"><h2>No hemos podido cargar el plan.</h2><p>Arranca la web con <code>npm start</code> desde la raíz del repo. Si faltan los estudios, se generan con <code>npm run estudio</code>.</p><button class="btn" onclick="location.reload()">Reintentar</button></div>`;
    }
  }
  window.addEventListener('resize', () => document.querySelectorAll('.lbl-short').forEach(el => { el.style.display = window.innerWidth <= 560 ? 'inline' : 'none'; }));
  boot();
})();
