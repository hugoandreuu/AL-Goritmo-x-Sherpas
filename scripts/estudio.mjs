#!/usr/bin/env node
/*
 * estudio.mjs — genera el "estudio" de cada caso, que es lo único que lee la app.
 *
 *   1. DATOS   Pide el plan al MCP de Sherpas (list_cases / get_case). Si no hay token,
 *              lee los mismos JSON de cases/. Nunca se teclea una cifra a mano.
 *   2. CIFRAS  El código saca del plan las preguntas posibles, los pasos, la nota y la línea
 *              de vida. La IA nunca calcula (BASES.md §9).
 *   3. FRASES  El LLM de Sherpas (proxy, gpt-5-mini) lee la persona y el resumen del plan,
 *              elige qué preguntas hacer y en qué orden, y escribe las frases de cada camino.
 *   4. CONTROL Cada número que escriba el LLM tiene que estar en lo que se le dio.
 *              Si no, esa frase se descarta y se queda la de plantilla.
 *
 * Uso:   npm run estudio                    (todos los casos)
 *        npm run estudio -- michael-carter  (uno)
 *        npm run estudio -- --sin-llm --sin-mcp
 *        npm run estudio -- --reusar        (datos otra vez del MCP, frases ya escritas por el LLM)
 * Claves: .env en la raíz (ver .env.example). Sin claves funciona con cases/ y plantillas,
 *        y lo deja escrito en cada estudio (campo "generado").
 *        Lo que contesta el LLM se guarda en app/estudios/llm/. Si luego se ejecuta sin clave,
 *        se reutiliza esa respuesta (pasando otra vez el control de cifras).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerPuntos, NARRATIVA, cifrasIguales, cortoValido } from './puntos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'app', 'estudios');
const DOCS = path.join(ROOT, 'docs', 'estudios');

// ------------------------------------------------------------------ entorno
function leerEnv() {
  const env = { ...process.env };
  const f = path.join(ROOT, '.env');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] == null) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
const ENV = leerEnv();
const ARGS = process.argv.slice(2);
const FLAG = f => ARGS.includes(f);
const MODEL = ENV.LLM_MODEL || 'gpt-5-mini';

// ------------------------------------------------------------------ formato (español)
const MES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dec = (n, d = 1) => { let s = (+n).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s; };
const M = v => (v == null || isNaN(v)) ? 'no data' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + '$' + dec(Math.abs(v) / 1e6, 2) + 'M' : (v < 0 ? '-' : '') + '$' + miles(v);
// Cifra redondeada para las cajas de cifras clave (como el informe: «$151K», «$1.5M»).
const Mk = v => (v == null || isNaN(v)) ? 'no data' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + '$' + dec(Math.abs(v) / 1e6, Math.abs(v) >= 1e7 ? 1 : 2) + 'M' : Math.abs(v) >= 1e4 ? (v < 0 ? '-' : '') + '$' + miles(Math.round(Math.abs(v) / 1000)) + 'K' : (v < 0 ? '-' : '') + '$' + miles(v);
const P = (v, d = 0) => dec(v * 100, d) + '%';
const fecha = iso => MES[+iso.slice(5, 7) - 1] + ' ' + iso.slice(0, 4);
const anio = iso => +iso.slice(0, 4);
const low = s2 => s2.charAt(0).toLowerCase() + s2.slice(1);
const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const b = s => `<b>${s}</b>`;
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? null : x[k]), o) ?? null;

// ------------------------------------------------------------------ 1. datos: MCP de Sherpas
async function mcpAbrir(url, token) {
  let sid = null, id = 0;
  async function rpc(method, params, aviso) {
    const body = aviso ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++id, method, params };
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}` };
    if (sid) headers['Mcp-Session-Id'] = sid;
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`MCP ${method}: HTTP ${r.status}`);
    sid = r.headers.get('mcp-session-id') || sid;
    if (aviso) return null;
    const txt = await r.text();
    let msg = null;
    if ((r.headers.get('content-type') || '').includes('text/event-stream')) {
      for (const l of txt.split(/\r?\n/)) {
        if (!l.startsWith('data:')) continue;
        try { const j = JSON.parse(l.slice(5).trim()); if (j.id === id) msg = j; } catch { /* línea parcial */ }
      }
    } else msg = JSON.parse(txt);
    if (!msg) throw new Error(`MCP ${method}: empty response`);
    if (msg.error) throw new Error(`MCP ${method}: ${msg.error.message}`);
    return msg.result;
  }
  await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'estudio-plan', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  return {
    async call(name, args) {
      const r = await rpc('tools/call', { name, arguments: args });
      const t = (r.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
      if (r.isError) throw new Error(`MCP ${name}: ${t.slice(0, 200)}`);
      try { const p = JSON.parse(t); return p && typeof p === 'object' && 'value' in p ? p.value : p; } catch { return t; }
    },
  };
}

const SECCIONES_FH = ['case', 'score', 'goals', 'profile', 'narrative', 'key_metrics', 'projections'];
const entera = v => v && typeof v === 'object' && v.score && v.key_metrics && v.projections;

async function parteMcp(mcp, caseId) {
  let fh = await mcp.call('get_case', { caseId, part: 'financial-health' });
  if (!entera(fh)) { // el servidor da un índice: se pide sección a sección
    fh = {};
    for (const section of SECCIONES_FH) {
      const v = await mcp.call('get_case', { caseId, part: 'financial-health', section });
      fh[section] = v && typeof v === 'object' && section in v && Object.keys(v).length <= 2 ? v[section] : v;
    }
  }
  if (!entera(fh)) throw new Error('the MCP did not return the full plan');
  const persona = await mcp.call('get_case', { caseId, part: 'persona' });
  let ia = null; // análisis de inversiones: solo hace falta para el modo pareja (perfil de riesgo y caídas)
  try { ia = await mcp.call('get_case', { caseId, part: 'investment-analysis' }); if (!ia || typeof ia !== 'object' || !ia.key_metrics) ia = null; } catch { ia = null; }
  return { fh, ia, persona: typeof persona === 'string' ? persona : (persona && (persona.text || persona.markdown)) || JSON.stringify(persona) };
}

function parteArchivo(slug) {
  const dir = path.join(ROOT, 'cases', slug);
  const fh = JSON.parse(fs.readFileSync(path.join(dir, 'financial-health.json'), 'utf8'));
  const pf = path.join(dir, 'persona.md'), pi = path.join(dir, 'investment-analysis.json');
  return { fh, ia: fs.existsSync(pi) ? JSON.parse(fs.readFileSync(pi, 'utf8')) : null, persona: fs.existsSync(pf) ? fs.readFileSync(pf, 'utf8') : '' };
}

// ------------------------------------------------------------------ 2. cifras: lo que dice el plan
const AREAS = {
  'Savings and cash flow': ['Savings', 'coins'], Debt: ['Debt', 'card'], Investments: ['Investments', 'chart'],
  'Liquidity and emergency fund': ['Emergency fund', 'shield'], 'Insurance and protection': ['Insurance', 'heart'],
};
const ESFUERZO = { low: 'low', medium: 'medium', high: 'high' };
const BANDA = { critical: 'critical', vulnerable: 'vulnerable', stable: 'stable', strong: 'strong', excellent: 'excellent' };

function leer(fh) {
  const hh = get(fh, 'case.household') || [];
  const ad = hh.filter(p => p.role !== 'child'), ki = hh.filter(p => p.role === 'child');
  const pl = ad.length > 1;
  const t = (p, s) => (pl ? p : s);
  const slug = get(fh, 'case.slug');
  const apellido = slug.split('-').pop().replace(/^./, c => c.toUpperCase());
  const yearly = get(fh, 'projections.yearly') || [];
  const hoyAnio = yearly.length ? yearly[0].year : new Date().getFullYear();
  const fin = yearly[yearly.length - 1] || {};
  const nombres = ad.map(a => a.first_name), hijos = ki.map(k => k.first_name);

  const tarjeta = (get(fh, 'profile.liabilities') || []).find(l => /CREDIT_CARD/.test(l.type) && l.balance > 0) || null;
  const cc = get(fh, 'key_metrics.debtManagement.creditCardDebt') || {};
  const moves = get(fh, 'score.top_moves') || [];
  const combined = get(fh, 'score.combined_moves') || [];
  const nota = get(fh, 'score.published_score');
  const F = get(fh, 'key_metrics.facts') || {};
  const lb = get(fh, 'key_metrics.protection.lifeInsurance.lifeInsuranceCoverageBasics') || {};
  const lr = get(fh, 'key_metrics.protection.lifeInsurance.lifeInsuranceCoverageRecommendations') || {};
  const gastos = get(fh, 'key_metrics.ratios.investableAssetLevel.annualExpenses');
  const cg = get(fh, 'goals.chartGoals') || [], gs = get(fh, 'goals.goalsSummary') || [];
  const importe = sub => (gs.find(x => x.subType === sub) || {}).amount ?? null;

  // ---- pasos del plan (score.top_moves), en el orden del plan
  const num = s => +String(s).replace(/,/g, '');
  const PASO = {
    'Pay down revolving card': m => ({ key: 'card', icon: 'card', quien: 'familia', titulo: `Pay ${M(tarjeta ? tarjeta.balance - m.target_amount : null)} on the card`, porque: tarjeta ? `It’s your most expensive debt, at ${P(tarjeta.interest_rate)}. After the payment, ${M(m.target_amount)} is left.` : '' }),
    'Add life cover': m => ({ key: 'life', icon: 'heart', quien: 'asesor', titulo: 'Add life cover', porque: `The plan asks you to add ${M(num((m.action.match(/\$([\d,]+)/) || [])[1]))} of life cover.` }),
    'Raise mortality coverage': m => PASO['Add life cover'](m),
    'Add umbrella cover': m => ({ key: 'umbrella', icon: 'shield', quien: 'asesor', titulo: 'Extra liability cover', tituloPro: `Umbrella policy of ${M(m.target_amount)}`, porque: `It’s liability cover on top of your home and car policies. The plan asks for ${M(m.target_amount)}; today you have none.` }),
    'Raise annual savings': m => { const x = (m.action.match(/\$([\d,]+)\/year/) || [])[1]; return { key: 'savings', icon: 'coins', quien: 'familia', titulo: `Save ${x ? M(num(x)) : 'more'} more a year`, porque: `The plan asks you to move ${x ? M(num(x)) + ' a year' : 'part'} of what you have left over each year into savings.` }; },
    'Lower the withdrawal rate': m => { const x = m.action.match(/\$([\d,]+)\/year \(([\d.]+)%\)/); return { key: 'withdraw', icon: 'sun', quien: 'asesor', titulo: `Withdraw less from your savings in retirement`, porque: x ? `The plan puts it at withdrawing ${M(num(x[1]))} a year (${dec(+x[2], 1)}%) so your savings last.` : '' }; },
    'Raise growth allocation toward glide': m => { const x = m.action.match(/from (\d+)% to (\d+)%/); return { key: 'growth', icon: 'chart', quien: 'asesor', titulo: `Raise the growth share of your investments`, porque: x ? `The plan proposes going from ${x[1]}% to ${x[2]}% in growth investments.` : '' }; },
    'Reduce growth allocation toward glide': m => { const x = m.action.match(/from (\d+)% to (\d+)%/); return { key: 'growth', icon: 'chart', quien: 'asesor', titulo: `Take a little risk out of your investments`, porque: x ? `The plan proposes going from ${x[1]}% to ${x[2]}% in growth investments.` : '' }; },
    'Close a coverage gap': m => ({ key: 'cover', icon: 'home', quien: 'asesor', titulo: /homeowners/i.test(m.action) ? `Insure your home` : 'Close an insurance gap', porque: /homeowners/i.test(m.action) ? `Today the plan shows no homeowners insurance on the house.` : '' }),
    'Reduce single-name concentration': m => { const x = m.action.match(/Bring (\S+) from (\d+)% to (\d+)%/); return { key: 'conc', icon: 'stack', quien: 'asesor', titulo: `Spread your investments better`, porque: x ? `Today ${x[2]}% is in a single fund (${x[1]}). The plan proposes bringing it down to ${x[3]}%.` : '' }; },
  };
  const pasos = moves.map((m, i) => {
    const d = PASO[m.title] ? PASO[m.title](m) : { key: 'paso' + (i + 1), icon: 'flag', quien: 'asesor', titulo: m.title, porque: m.action, sinTraducir: true };
    return { ...d, n: i + 1, nota: m.score_after, esfuerzo: ESFUERZO[m.effort] || m.effort, abre: !!m.lifts_a_cap, plan: { title: m.title, action: m.action } };
  });
  const keyDe = title => (pasos.find(p => p.plan.title === title) || {}).key;
  const combos = {};
  for (const c of combined) combos[c.moves.map(keyDe).sort().join('|')] = c.score_after;
  const notaMax = Math.max(nota, ...pasos.map(p => p.nota), ...Object.values(combos));

  // ---- áreas de la nota (score.pillars)
  const areas = (get(fh, 'score.pillars') || []).map(p => ({ nombre: (AREAS[p.pillar] || [p.pillar])[0], icon: (AREAS[p.pillar] || [0, 'flag'])[1], nota: p.score, puntos: p.points_shown_in_app }));
  const peor = areas.slice().sort((x, y) => x.nota - y.nota)[0], mejor = areas.slice().sort((x, y) => y.nota - x.nota)[0];

  // ---- preguntas posibles. Cada una lleva su cifra del plan, su imagen y sus frases de plantilla.
  const Q = [];
  const kidsTxt = lista(hijos);

  Q.push({
    id: 'nota', tema: 'nota', tono: get(fh, 'score.colour') === 'green' ? 'bueno' : 'malo', tipo: 'num', icon: 'chart', min: 0, max: 100, step: 1, sufijo: '', real: nota, cerca: 5,
    q: `From 0 to 100, what Financial Health score do you think your plan gives you?`,
    sub: 'Just a guess. Nobody is grading anyone here.',
    plan: String(nota), unidad: 'out of 100, today', vis: { t: 'ring', hoy: nota, max: notaMax },
    titulares: { cerca: t('You knew it.', 'You knew it.'), mas: t('Better than you thought.', 'Better than you thought.'), menos: t('Lower than you thought.', 'Lower than you thought.') },
    siente: peor && mejor && peor !== mejor ? `What pulls it down most: ${b(peor.nombre)} (${peor.nota} out of 100). Your strongest area: ${b(mejor.nombre)} (${mejor.nota} out of 100).` : '',
    salida: notaMax > nota ? `With the steps in your plan, it reaches ${notaMax}.` : `Your plan has the steps to keep it there.`,
    hechos: [`Financial Health score today: ${nota} out of 100`, `Highest score with the plan’s steps: ${notaMax}`, ...areas.map(a => `${a.nombre} area: ${a.nota} out of 100`)],
    filas: areas.map(a => [a.nombre, `${a.nota} out of 100`]), origen: 'score.published_score · score.pillars', creian: 'Financial Health score',
  });

  if (tarjeta && cc.ccPaymentEqualToInterestRate > 0) {
    const pago = tarjeta.monthly_payment || cc.ccMonthlyPayment, int = cc.ccPaymentEqualToInterestRate;
    const n = Math.round(int / pago * 10), malo = n >= 5, fin = cc.ccPayoffDate ? fecha(cc.ccPayoffDate) : null;
    const pasoCard = pasos.find(p => p.key === 'card');
    Q.push({
      id: 'tarjeta_interes', tema: 'tarjeta', tono: malo ? 'malo' : 'bueno', tipo: 'importe', icon: 'card', min: 0, max: pago, step: pago > 250 ? 10 : 5, real: Math.round(int), cerca: 0.2,
      q: `You pay ${M(pago)} a month on the card. How much of that goes to interest?`, sub: 'The part that doesn’t reduce the debt.',
      plan: M(int), unidad: `of every ${M(pago)} goes to interest`, vis: { t: 'coins', n, a: 'intereses', b: 'reduces the debt' },
      titulares: malo
        ? { cerca: t('You knew it. Look where it goes.', 'You knew it. Look where it goes.'), mas: t('That’s {dif} more a month than you thought.', 'That’s {dif} more a month than you thought.'), menos: t('Less than you feared. Even so, look where it goes.', 'Less than you feared. Even so, look where it goes.') }
        : { cerca: 'That’s right. Here the debt does go down.', mas: t('A bit more than you thought, but the debt is going down.', 'A bit more than you thought, but the debt is going down.'), menos: t('Less than you feared.', 'Less than you feared.') },
      siente: malo
        ? `Of every ${b(M(pago))} you pay, ${b(M(int))} is interest. The debt barely goes down.${fin ? ` At this pace it lasts until ${b(fin)}.` : ''}`
        : `Of every ${b(M(pago))} you pay, ${b(M(int))} is interest. The rest pays down the debt${fin ? `, which is paid off in ${b(fin)}` : ''}.`,
      salida: pasoCard ? `The way out is in your plan: ${pasoCard.titulo.toLowerCase()}.` : malo ? `Your plan flags it as your most expensive debt. How to raise the payment is something to go over with your advisor.` : `Your plan says to keep paying it: it’s on track.`,
      calc: `${M(int)} of ${M(pago)}, rounded to one decimal`,
      hechos: [`Card: ${M(tarjeta.balance)} at ${P(tarjeta.interest_rate)}`, `Monthly payment: ${M(pago)}`, `Of that payment, interest: ${M(int)}`, fin ? `Date the card is paid off at this pace: ${fin}` : null, pasoCard ? `Plan step: ${pasoCard.titulo}` : null].filter(Boolean),
      freno: { kick: 'The card', h2: `${M(int)} of every ${M(pago)} goes to interest.` },
      filas: [['Card balance', M(tarjeta.balance)], ['Interest', P(tarjeta.interest_rate)], [`You pay each month`, M(pago)], ['Of that, interest', M(int)]].concat(fin ? [['Projected payoff', fin]] : []),
      pro: `Revolving debt of ${M(tarjeta.balance)} at ${P(tarjeta.interest_rate)} APR. Of the ${M(pago)} payment, ${M(int)} is interest.${fin ? ` Projected payoff: ${fin}.` : ''}`,
      origen: 'profile.liabilities · key_metrics.debtManagement.creditCardDebt', creian: 'Card interest per month',
    });
    if (cc.ccPayoffDate && anio(cc.ccPayoffDate) - hoyAnio >= 4) {
      const y = anio(cc.ccPayoffDate), años = y - hoyAnio, uni = cg.find(g => g.goalType === 'COLLEGE' && anio(g.date) <= y);
      Q.push({
        id: 'tarjeta_fin', tema: 'tarjeta', tono: 'malo', tipo: 'anio', icon: 'cal', min: hoyAnio, max: hoyAnio + 40, real: y, cerca: 2,
        q: `Paying ${M(pago)} a month, in what year would you finish paying off the card?`, sub: '',
        plan: fin, unidad: `paying ${M(pago)} a month`, mid: true,
        vis: ki.length ? { t: 'grow', filas: ki.map(k => ({ n: k.first_name, de: k.age, a: k.age + años })), hasta: String(y), marca: uni ? `${anio(uni.date)}: ${uni.name.replace('College ', '')} starts college. The card is still there.` : null } : { t: 'cuenta', n: años, txt: 'more years with the card' },
        titulares: { cerca: ki.length ? t('You knew it. Look who will have grown up.', 'You knew it. Look who will have grown up.') : t('You knew it.', 'You knew it.'), mas: t('{dif} later than you thought.', '{dif} later than you thought.'), menos: t('Sooner than you feared. Even so, it’s a long time.', 'Sooner than you feared. Even so, it’s a long time.') },
        siente: ki.length ? `By the time you pay it off, ${lista(ki.map(k => `${k.first_name} will be ${b((k.age + años) + ' years old')}`))}.` : `${b(años + ' years')} of card payments to go.`,
        salida: pasoCard ? `The way out is in your plan: ${pasoCard.titulo.toLowerCase()}.` : `How to shorten it is something to go over with your advisor.`,
        calc: ki.length ? 'the children’s ages on that date' : 'the years left until that date',
        hechos: [`Date the card is paid off at this pace: ${fin}`, `Monthly payment: ${M(pago)}`, `Years until that date: ${años}`, ...ki.map(k => `${k.first_name}: ${k.age} today, ${k.age + años} in ${y}`)],
        filas: [['Monthly payment', M(pago)], ['Interest per month', M(int)], ['Projected payoff', fin]], pro: `With a fixed payment of ${M(pago)} at ${P(tarjeta.interest_rate)}, the principal barely goes down until the end. Projected payoff: ${fin}.`,
        origen: 'key_metrics.debtManagement.creditCardDebt.ccPayoffDate', creian: 'Year the card is paid off',
      });
    }
  }

  const vidaHoy = (lb.lifeInsuranceAmountClient || 0) + (lb.lifeInsuranceAmountCoClient || 0);
  const vidaMin = (lr.clientMinRecommendedCoverage || 0) + (lr.coClientMinRecommendedCoverage || 0);
  if (vidaMin && vidaHoy < vidaMin && gastos && (ki.length || pl)) {
    const yn = vidaHoy / gastos, ym = vidaMin / gastos, on = Math.round(yn), total = Math.min(20, Math.round(ym)), k0 = ki[0];
    Q.push({
      id: 'vida', tema: 'vida', tono: 'malo', tipo: 'opciones', icon: 'heart', permiso: !!ki.length,
      opciones: ['Less than a year', '1 to 3 years', '4 to 9 years', 'Ten years or more'], rangos: [0, 1, 2, 3], real: yn < 1 ? 0 : yn < 3.5 ? 1 : yn < 9.5 ? 2 : 3, cerca: [yn < 1 ? 0 : yn < 3.5 ? 1 : yn < 9.5 ? 2 : 3],
      q: ki.length ? `If something happened to ${t('one of you', 'you')}, how many years of household expenses would be covered for ${lista(ki.map(k => `${k.first_name} (${k.age})`))}?` : `If something happened to one of you, how many years of household expenses would the insurance cover?`, sub: '',
      plan: `about ${on} years`, unidad: 'of household expenses', mid: true,
      vis: { t: 'yrs', on, total, base: k0 ? k0.age : null, leg: k0 ? `${k0.first_name}’s age` : 'years' },
      titulares: { cerca: t('You were close. Look how far it goes.', 'You were close. Look how far it goes.'), mas: 'A bit more, but far from what’s needed.', menos: t('Much less than you thought.', 'Much less than you thought.') },
      siente: k0 ? `It would cover the household until ${k0.first_name} is about ${b((k0.age + on) + ' years old')}. The plan recommends reaching age ${b(String(k0.age + Math.round(ym)))}.` : `Today it covers about ${b(on + ' years')}. The plan recommends about ${b(String(Math.round(ym)))}.`,
      salida: `It can be fixed, and that’s for your advisor: they bring the quotes.`,
      calc: 'life cover today ÷ household expenses per year',
      hechos: [`Life cover today: ${M(vidaHoy)}`, `Minimum the plan recommends: ${M(vidaMin)}`, `Household expenses per year: ${M(gastos)}`, `Years of expenses covered today: about ${on}`, `Years the recommended minimum would cover: about ${Math.round(ym)}`, ...(k0 ? [`${k0.first_name}: ${k0.age} today; covered until age ${k0.age + on} with today’s cover; until age ${k0.age + Math.round(ym)} with the minimum`] : [])],
      freno: { kick: ki.length ? `Proteger a ${kidsTxt}` : 'Life insurance', h2: `Today the insurance would cover about ${on} years. About ${Math.round(ym)} are needed.` },
      filas: ad.flatMap((a, i) => [[`${a.first_name}’s cover`, M(i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient)], [`Minimum for ${a.first_name}`, M(i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage)]]).concat([['Household expenses per year', M(gastos)]]),
      pro: `Death benefit: ${lista(ad.map((a, i) => `${a.first_name} ${M(i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient)}`))}. Recommended minimum: ${lista(ad.map((a, i) => M(i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage)))}.`,
      origen: 'key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses', creian: 'Years covered by life insurance',
    });
  }

  const meses = parseFloat(get(F, 'cash.monthsCovered.value')), res = (get(F, 'cash.emergencyReserve.label') || '').match(/\((\d+)[–-](\d+) months/);
  if (!isNaN(meses) && res) {
    const rmin = +res[1], rmax = +res[2], ok = meses >= rmin, tras = parseFloat(get(F, 'cash.monthsCoveredAfterNearTermGoals.value'));
    const menos = !isNaN(tras) && tras < meses - 1 && tras < rmin;
    const mTxt = dec(meses, 1) + (meses === 1 ? ' month' : ' months');
    Q.push({
      id: 'colchon', tema: 'colchon', tono: ok && !menos ? 'bueno' : 'malo', tipo: 'num', icon: 'shield', min: 0, max: 24, step: 1, sufijo: ' months', real: meses, cerca: 1,
      q: `If your income stopped tomorrow, how many months of essential expenses would your cash cover?`, sub: 'What’s in your accounts, without touching investments.',
      plan: mTxt, unidad: 'of essential expenses', mid: true, vis: { t: 'months', tiene: meses, min: rmin, max: rmax, tras: menos ? tras : null },
      titulares: ok && !menos
        ? { cerca: t('That’s right. You’re doing well here.', 'That’s right. You’re doing well here.'), mas: t('More than you thought.', 'More than you thought.'), menos: t('A bit less than you thought, but above the recommended minimum.', 'A bit less than you thought, but above the recommended minimum.') }
        : { cerca: t('You knew it. Look at what the plan recommends.', 'You knew it. Look at what the plan recommends.'), mas: t('A bit more than you thought, but short of what’s recommended.', 'A bit more than you thought, but short of what’s recommended.'), menos: t('Less than you thought.', 'Less than you thought.') },
      siente: `The plan recommends ${b(rmin + ' to ' + rmax + ' months')}. You have ${b(dec(meses, 1))}.${menos ? ` And after setting aside what’s already committed in the short term, ${b(dec(tras, 1))} are left.` : ''}`,
      salida: ok && !menos ? (pasos.some(p => p.key === 'card') ? `Part of that cash is what your plan proposes to use to pay down the card.` : 'This one is done. No need to touch it.') : `Your plan proposes bringing that emergency fund closer to what’s recommended. How is something to go over with your advisor.`,
      hechos: [`Months of essential expenses the cash covers: ${dec(meses, 1)}`, `Recommended reserve: ${rmin} to ${rmax} months`, `Accessible cash: ${M(get(F, 'cash.accessibleCash.value'))}`, menos ? `Months covered after setting aside near-term goals: ${dec(tras, 1)}` : null].filter(Boolean),
      freno: { kick: 'The emergency fund', h2: `Your cash covers ${mTxt}. The plan recommends ${rmin} to ${rmax}.` },
      filas: [['Accessible cash', M(get(F, 'cash.accessibleCash.value'))], ['Months covered', dec(meses, 1)], ['Recommended reserve', `${M(get(F, 'cash.emergencyReserve.min'))} a ${M(get(F, 'cash.emergencyReserve.max'))}`]],
      pro: `Accessible liquidity: ${M(get(F, 'cash.accessibleCash.value'))}, ${dec(meses, 1)} months of essential expenses. Target reserve: ${M(get(F, 'cash.emergencyReserve.min'))} to ${M(get(F, 'cash.emergencyReserve.max'))}.`,
      origen: 'key_metrics.facts.cash', creian: 'Months the cash covers',
    });
  }

  const conc = moves.map(m => m.action.match(/Bring (\S+) from (\d+)% to (\d+)% of investable/)).find(Boolean);
  if (conc) {
    Q.push({
      id: 'concentracion', tema: 'inversion', tono: 'malo', tipo: 'num', icon: 'stack', min: 0, max: 100, step: 1, sufijo: '%', real: +conc[2], cerca: 5,
      q: `Of everything you have invested, how much is in a single fund?`, sub: 'The biggest one of all.',
      plan: conc[2] + '%', unidad: `in a single fund (${conc[1]})`, vis: { t: 'barra', hoy: +conc[2], meta: +conc[3], l1: 'Today', l2: 'What the plan proposes' },
      titulares: { cerca: t('You knew it.', 'You knew it.'), mas: t('More than you thought.', 'More than you thought.'), menos: t('Less than you thought. Even so, the plan sees it as high.', 'Less than you thought. Even so, the plan sees it as high.') },
      siente: `If that fund falls, it takes a big part of your money with it. The plan proposes bringing it down to ${b(conc[3] + '%')}.`,
      salida: `What to sell and when is something to go over with your advisor.`,
      hechos: [`Share invested in a single fund (${conc[1]}): ${conc[2]}%`, `What the plan proposes: ${conc[3]}%`],
      freno: { kick: 'Your investments', h2: `${conc[2]}% of what you have invested is in a single fund.` },
      filas: [[`${conc[1]} fund, today`, conc[2] + '%'], ['Plan proposal', conc[3] + '%']], pro: `Concentration in ${conc[1]}: ${conc[2]}% of investable assets; the plan targets ${conc[3]}%.`,
      origen: 'score.top_moves', creian: 'Share invested in a single fund',
    });
  }

  const R = F.retirement || {}, agota = R.savingsRunOut, queda = R.savingsLeftAtPlanEnd;
  const edadJ = ad.map(a => a.retirement_age), finEdad = fin.age_client ?? fin.age_co_client ?? (ad[0] ? ad[0].age + yearly.length - 1 : null);
  if (agota || queda) {
    const corte = agota ? +(agota.label.match(/age (\d+)/) || [])[1] : null;
    const pasoRet = pasos.find(p => p.key === 'withdraw');
    const cuota = get(R, 'incomeShareOfNeed.value');
    // Aunque la proyección diga que los ahorros llegan, el plan puede marcar un hueco en las cuentas de jubilación
    // (p. ej. Johnson: quedan 260 K$ al final, pero faltan 1,43 M$). Entonces no se dice «no hay que correr».
    const hueco = !agota ? Math.round(get(fh, 'key_metrics.ratios.retirementSavings.planningGapAtRetirementAgeInTodaysDollars') || 0) : 0;
    Q.push({
      id: 'jubilacion', tema: 'jubilacion', tono: agota || hueco > 0 ? 'malo' : 'bueno', tipo: 'opciones', icon: 'sun',
      opciones: ['Yes, with room to spare', 'Just about', 'It falls short', 'No idea'], rangos: [3, 2, 1, null], real: agota ? 2 : 0, cerca: agota ? [2] : [0, 1],
      q: `Will you have enough to retire at ${lista(edadJ.map(String))} and live on it?`, sub: '',
      plan: agota ? `until age ${corte}` : 'Yes, it’s enough', unidad: agota ? `your savings last` : `and ${M(queda.value)} is left at the end of the plan`, mid: true,
      vis: { t: 'tramo', de: edadJ[0], corte, hasta: finEdad, ok: !agota },
      titulares: agota
        ? { cerca: t('You saw it coming. Look how far it goes.', 'You saw it coming. Look how far it goes.'), mas: t('The plan says it falls short.', 'The plan says it falls short.'), menos: t('The plan says otherwise.', 'The plan says otherwise.') }
        : { cerca: t('That’s right. You’ll make it.', 'That’s right. You’ll make it.'), mas: t('Better than you thought.', 'Better than you thought.'), menos: t('You’ll make it, but with less room than you thought.', 'You’ll make it, but with less room than you thought.') },
      siente: agota
        ? `You retire at ${lista(edadJ.map(String))} and the plan runs to age ${finEdad}. Your savings run out at ${b(String(corte))}.`
        : `You retire at ${lista(edadJ.map(String))} and your savings don’t run out: ${b(M(queda.value))} is left at the end of the plan.`,
      salida: agota ? (pasoRet ? `Your plan has a step for this, and with it alone the score goes from ${nota} to ${pasoRet.nota}.` : `It’s one of the first things to go over with your advisor: how much to save and when to retire.`) : hueco > 0 ? `It works, but with little room: the plan calculates that your retirement accounts are ${M(hueco)} short (in today’s dollars). That’s for your advisor.` : `No need to rush here. What holds your plan back is elsewhere.`,
      calc: null,
      hechos: [`Retirement age: ${lista(edadJ.map(String))}`, `The plan runs to age ${finEdad}`, agota ? `Savings run out at age ${corte}` : `Savings left at the end of the plan: ${M(queda.value)}`, cuota ? `Share of retirement spending covered by income: ${String(cuota)}` : null, pasoRet ? `Plan step: ${pasoRet.titulo} (score ${pasoRet.nota})` : null, hueco > 0 ? `Retirement account gap (today’s dollars): ${M(hueco)}` : null].filter(Boolean),
      freno: { kick: 'Retirement', h2: agota ? `Savings run out at ${corte}. The plan runs to age ${finEdad}.` : `You’ll make it: ${M(queda.value)} is left at the end of the plan.` },
      filas: [['Retirement age', lista(edadJ.map(String))], agota ? ['Savings run out at age', String(corte)] : ['Left at the end of the plan', M(queda.value)]].concat(cuota ? [['Spending covered by income', String(cuota)]] : []),
      pro: `${cuota ? `Income vs. yearly retirement need: ${String(cuota)}. ` : ''}${agota ? `Liquid assets depleted at age ${corte}.` : `Remaining at the end of the plan: ${M(queda.value)} in today’s dollars.`}`,
      origen: 'key_metrics.facts.retirement', creian: 'Retirement',
    });
  }

  // ---- selección y orden de plantilla (el LLM puede cambiarlos)
  const PRIORIDAD = ['tarjeta_interes', 'vida', 'colchon', 'tarjeta_fin', 'concentracion', 'jubilacion'];
  const ORDEN = ['nota', 'tarjeta_interes', 'tarjeta_fin', 'vida', 'colchon', 'concentracion', 'jubilacion'];
  const malas = PRIORIDAD.filter(id => Q.some(q => q.id === id && q.tono === 'malo')).slice(0, 3);
  const buena = ['jubilacion', 'colchon', 'tarjeta_interes'].find(id => Q.some(q => q.id === id && q.tono === 'bueno'));
  const orden = ['nota', ...ORDEN.filter(id => malas.includes(id))].concat(buena ? [buena] : []);

  // ---- primer paso: solo si el primero del plan lo puede hacer la familia sin asesor
  let primer = null;
  const p0 = pasos[0];
  if (p0 && p0.key === 'card' && tarjeta) {
    const resto = moves[0].target_amount, paga = tarjeta.balance - resto;
    primer = {
      key: 'card', titulo: p0.titulo, h2: `${p0.titulo}. Ten minutes.`, hoy: tarjeta.balance, hoyTxt: M(tarjeta.balance), despues: resto, despuesTxt: M(resto), importeTxt: M(paga), nota: p0.nota,
      urgencia: cc.ccPaymentEqualToInterestRate ? `Every month that goes by costs ${b(M(cc.ccPaymentEqualToInterestRate))} in interest.` : '',
      como: [`Open your bank’s app.`, `Pay ${M(paga)} to the card from your account.`, `Check that the card balance is down to ${M(resto)}.`],
      semana: { q: `What is your card balance now?` },
    };
  }

  // ---- línea de hoy a la jubilación (goals.chartGoals + pasos + fechas del plan)
  const linea = [{ c: 'now', icon: 'flag', anio: hoyAnio, cuando: 'Today', t: `Score ${nota}` }];
  pasos.forEach(p => linea.push({ c: 'step', key: p.key, icon: p.icon, anio: hoyAnio, cuando: 'Step ' + p.n, t: p.titulo, quien: p.quien }));
  const edadEn = y => ki.map(k => `${k.first_name}, ${k.age + (y - hoyAnio)}`).join(' · ');
  for (const g of cg) {
    if (!g.date || anio(g.date) < hoyAnio) continue;
    const y = anio(g.date);
    if (g.subType === 'VEHICLE_PURCHASE') linea.push({ c: 'goal', icon: 'car', anio: y, cuando: String(y), t: 'The car', s: importe('VEHICLE_PURCHASE') ? M(importe('VEHICLE_PURCHASE')) : '' });
    else if (g.subType === 'REAL_ESTATE_PURCHASE') linea.push({ c: 'goal', icon: 'home', anio: y, cuando: String(y), t: 'The home', s: importe('REAL_ESTATE_PURCHASE') ? M(importe('REAL_ESTATE_PURCHASE')) : '' });
    else if (g.goalType === 'COLLEGE') linea.push({ c: 'goal', icon: 'cap', anio: y, cuando: String(y), t: `${g.name.replace('College ', '')}’s college`, s: '' });
  }
  if (tarjeta && cc.ccPayoffDate) {
    const y = anio(cc.ccPayoffDate), largo = y - hoyAnio >= 4;
    linea.push({ c: largo ? 'warn' : 'goal', key: largo ? 'card' : null, icon: 'card', anio: y, cuando: String(y), t: largo ? 'With no changes, the card lasts until here' : 'Card paid off', s: largo && ki.length ? edadEn(y) : '' });
  }
  const jub = cg.filter(g => g.goalType === 'RETIREMENT').map(g => anio(g.date));
  if (jub.length) linea.push({ c: 'end', icon: 'sun', anio: Math.max(...jub), cuando: String(Math.max(...jub)), t: 'Retirement', s: agota ? '' : 'Savings last to the end' });
  if (agota) {
    const z = cg.find(g => g.goalType === 'BANKRUPTCY_ZEROCASH'), corte = +(agota.label.match(/age (\d+)/) || [])[1];
    const y = z ? anio(z.date) : hoyAnio + (corte - ad[0].age);
    linea.push({ c: 'warn', icon: 'clock', anio: y, cuando: String(y), t: 'Savings run out here', s: `At age ${corte}, according to your plan` });
  }
  const peso = { now: 0, step: 1, goal: 2, warn: 3, end: 4 };
  linea.sort((x, y) => x.anio - y.anio || peso[x.c] - peso[y.c]);

  // ---- preguntas que se quedan para el asesor
  const coche = cg.find(g => g.subType === 'VEHICLE_PURCHASE'), casa = cg.find(g => g.subType === 'REAL_ESTATE_PURCHASE'), unis = cg.filter(g => g.goalType === 'COLLEGE');
  const abiertas = [
    agota ? `What would have to change for our savings to last to the end?` : null,
    casa ? `Does the ${anio(casa.date)} home fit with everything else?` : null,
    coche ? `What happens to retirement if ${t('we buy', 'I buy')} the car in ${anio(coche.date)}?` : null,
    unis.length ? `How ${t('do we', 'do I')} save for ${lista(unis.map(u => u.name.replace('College ', '')))}’s college without neglecting everything else?` : null,
    pl && ad[0].risk_profile !== ad[1].risk_profile ? `${ad[0].first_name} is ${ad[0].risk_profile} and ${ad[1].first_name} is ${ad[1].risk_profile}. How much risk do we want together?` : null,
    `Where ${t('do we', 'do I')} start if ${t('we', 'I')} can’t do it all at once?`,
  ].filter(Boolean).slice(0, 3).map((q, i) => ({ id: 'oq' + (i + 1), q }));

  // ---- "¿Y si…?": pocas preguntas por categoría, contestadas solo con el plan
  const cat = [];
  const ed = F.education || {};
  if (coche) cat.push({ id: 'coche', label: 'Car', icon: 'car', items: [
    { q: 'When is it planned, and for how much?', a: `Your plan includes a ${b(M(importe('VEHICLE_PURCHASE')))} car in ${b(fecha(coche.date))}.`, covered: 'yes' },
    { q: `What if ${t('we buy', 'I buy')} it sooner, or spend more?`, a: `The plan only runs the numbers with that date and that amount. Changing them moves everything else.`, covered: 'no' }] });
  if (casa) cat.push({ id: 'casa', label: 'Home', icon: 'home', items: [
    { q: 'When is it planned, and for how much?', a: `Your plan includes a ${b(M(importe('REAL_ESTATE_PURCHASE')))} home in ${b(fecha(casa.date))}.`, covered: 'yes' },
    { q: 'Does it fit with everything else?', a: `That’s the question the plan leaves for the conversation: it depends on which steps you take first.`, covered: 'no' }] });
  if (!isNaN(meses) && res) cat.push({ id: 'imprevistos', label: 'Emergencies', icon: 'shield', items: [
    { q: `How long can ${t('we', 'I')} last without income?`, a: `Your cash covers ${b(dec(meses, 1) + ' months')} of essential expenses. The plan recommends ${res[1]} to ${res[2]}.`, covered: 'yes' },
    { q: `What if ${t('one of us loses', 'I lose')} ${t('their', 'my')} job?`, a: `The plan doesn’t include that scenario.`, covered: 'no' }] });
  if (tarjeta) cat.push({ id: 'tarjeta', label: 'Card', icon: 'card', items: [
    { q: 'How much does it cost each month?', a: `Of the ${b(M(tarjeta.monthly_payment))} you pay each month, ${b(M(cc.ccPaymentEqualToInterestRate))} is interest.${cc.ccPayoffDate ? ` At this pace it’s paid off in ${b(fecha(cc.ccPayoffDate))}.` : ''}`, covered: 'yes' },
    { q: `What if ${t('we pay', 'I pay')} it all off at once?`, a: primer ? `The plan proposes paying ${primer.importeTxt}. Paying it all off isn’t calculated.` : `The plan doesn’t include that calculation.`, covered: 'no' }] });
  if (vidaMin) cat.push({ id: 'seguros', label: 'Insurance', icon: 'heart', items: [
    { q: 'How much life cover does the plan recommend?', a: `At least ${b(M(vidaMin))}${pl ? ' between the two of you' : ''}. Today you have ${b(M(vidaHoy))}.`, covered: 'yes' },
    { q: 'How much would it cost a month?', a: `The plan doesn’t include prices. Your advisor brings the quotes.`, covered: 'no' }] });
  if (unis.length && ed.fundingGap) cat.push({ id: 'hijos', label: 'Kids', icon: 'cap', items: [
    { q: 'How much is missing for college?', a: `The plan is ${b(M(ed.fundingGap.value))} short for ${kidsTxt}’s college, as a single lump sum in today’s dollars.`, covered: 'yes' },
    { q: 'Where does that money come from?', a: `The plan leaves it open: it competes with your other goals.`, covered: 'no' }] });
  if (agota || queda) cat.push({ id: 'jubilacion', label: 'Retirement', icon: 'sun', items: [
    { q: `Will ${t('we', 'I')} have enough?`, a: agota ? `With today’s plan, savings run out at age ${b((agota.label.match(/age (\d+)/) || [])[1])}.` : `Yes. ${b(M(queda.value))} is left at the end of the plan.`, covered: 'yes' },
    { q: `What if ${t('we retire', 'I retire')} earlier?`, a: `The plan is only calculated with today’s ages.`, covered: 'no' }] });
  cat.forEach(c => c.items.forEach((it, i) => { it.id = c.id + '-' + (i + 1); }));
  cat.push({ id: 'otra', label: 'Something else', icon: 'help', items: [] });

  const frases = [ki.length ? `That ${kidsTxt} ${ki.length > 1 ? 'have' : 'has'} everything they need` : 'Not having to worry about money', 'Sleeping without thinking about money', tarjeta ? 'Stop paying interest' : 'Making my money work well', 'Getting to retirement in good shape'];
  const ganancias = [['moon', t('We’d sleep more easily', 'I’d sleep better')], [casa ? 'home' : 'sun', casa ? t('We could think about the home', 'I could think about the home') : t('We could think about what’s next', 'I could think about what’s next')], pl ? ['chat', 'We’d stop arguing about money'] : ['check', 'I’d stop going round in circles'], ki.length ? ['heart', `${pl ? 'We’d' : 'I’d'} know ${kidsTxt} ${ki.length > 1 ? 'are covered' : 'is covered'}`] : ['flag', 'I’d know where to start']];

  // ---- «Ver el detalle»: las cifras del informe que explican cada pregunta. Rótulos en español
  // escritos por código; valores leídos del plan. Las pocas cuentas propias se marcan con «(cuenta nuestra)».
  const R2 = F.retirement || {}, C2 = F.cash || {}, ef = get(fh, 'key_metrics.protection.emergencyFund.cashAndExpensesOverview') || {};
  const deudas = (get(fh, 'profile.liabilities') || []).filter(l => l.balance > 0);
  const dti = get(fh, 'key_metrics.ratios.debtToIncome') || {}, caps = get(fh, 'score.caps_applied') || [], pil = get(fh, 'score.pillars') || [];
  const val = x => (x && typeof x === 'object' ? x.value : x);
  const TIPO = ty => /CREDIT_CARD/.test(ty) ? 'Other card' : /MORTGAGE/.test(ty) ? 'Mortgage' : /STUDENT/.test(ty) ? 'Student loan' : /AUTO/.test(ty) ? 'Car loan' : /PERSONAL/.test(ty) ? 'Personal loan' : 'Other debt';
  const CAP = { 'High revolving balance with high APR': 'credit card debt at a high interest rate', 'Mortality coverage ratio below threshold with dependents': 'low life cover with dependent children' };
  const DET = {
    nota: () => [
      ...pil.map(x => [(AREAS[x.pillar] || [x.pillar])[0], x.points_shown_in_app ? `${x.points_shown_in_app} points` : `${x.score} out of 100`]),
      ...caps.filter(c => CAP[c.reason]).map(c => ['What caps the score', `${CAP[c.reason]}: at most ${c.score_capped_at}`]),
      ...(pasos[0] ? [['First step in the plan', `${pasos[0].titulo}: the score goes to ${pasos[0].nota}`]] : []),
      ['Highest with all the steps', `${notaMax} out of 100`]],
    tarjeta: () => {
      if (!tarjeta) return null;
      const pago = tarjeta.monthly_payment || cc.ccMonthlyPayment, int = cc.ccPaymentEqualToInterestRate;
      return [['Card balance', M(tarjeta.balance)], ['Annual interest rate', P(tarjeta.interest_rate)], [`You pay each month`, M(pago)],
        int ? ['Of that, interest per month', M(int)] : null, int ? ['Interest over a year (our calculation)', M(Math.round(int * 12))] : null,
        cc.minCcPaymentNormal && cc.maxCcPaymentNormal ? ['Monthly payment the plan recommends', `${M(Math.round(cc.minCcPaymentNormal))} a ${M(Math.round(cc.maxCcPaymentNormal))}`] : null,
        cc.ccPayoffDate ? ['Fin previsto a este ritmo', fecha(cc.ccPayoffDate)] : null,
        ...deudas.filter(l => l !== tarjeta).map(l => [TIPO(l.type), `${M(l.balance)}${l.interest_rate ? ` at ${P(l.interest_rate, 1)}` : ''}`]),
        dti.monthlyDebtPayments ? ['Total debt payments per month', M(dti.monthlyDebtPayments)] : null,
        dti.ratio != null ? ['Share of income going to debt', P(dti.ratio)] : null].filter(Boolean);
    },
    vida: () => [...ad.flatMap((a, i) => {
      const hoy = i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient, mn = i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage, mx = i ? lr.coClientMaxRecommendedCoverage : lr.clientMaxRecommendedCoverage;
      const ing = get(fh, `key_metrics.protection.lifeInsurance.clientDemographics.${i ? 'coClientIncomeAtRisk' : 'clientIncomeAtRisk'}`);
      return [[`${a.first_name}’s cover today`, M(hoy || 0)], mn ? [`Recommended for ${a.first_name}`, mx ? `${M(mn)} a ${M(mx)}` : `from ${M(mn)}`] : null, mn && hoy < mn ? [`Shortfall, at minimum`, M(mn - (hoy || 0))] : null, ing ? [`${a.first_name}’s income it protects`, `${M(ing)} a year`] : null].filter(Boolean);
    }), gastos ? ['Household expenses per year', M(gastos)] : null, ki.length ? ['Who depends on that income', lista(ki.map(k => `${k.first_name} (${k.age})`))] : null].filter(Boolean),
    colchon: () => [['Accessible cash', M(val(C2.accessibleCash))], ef.monthlyExpenses ? ['Essential expenses per month', M(ef.monthlyExpenses)] : null, ['Months it covers today', dec(val(C2.monthsCovered), 1)],
      C2.emergencyReserve ? ['Reserve the plan recommends', `${M(C2.emergencyReserve.min)} a ${M(C2.emergencyReserve.max)}`] : null,
      val(C2.monthsCoveredAfterNearTermGoals) != null ? ['Months after setting aside planned expenses', dec(val(C2.monthsCoveredAfterNearTermGoals), 1)] : null,
      val(C2.cashAboveTotalNeeded) > 0 ? ['Surplus after the reserve and those expenses', M(val(C2.cashAboveTotalNeeded))] : null].filter(Boolean),
    jubilacion: () => [['Retirement age', lista(edadJ.map(String))], val(R2.spendingNeed) ? ['Yearly spending in retirement', M(Math.round(val(R2.spendingNeed)))] : null,
      val(R2.guaranteedIncome) ? ['Guaranteed income per year (pensions and annuities)', M(Math.round(val(R2.guaranteedIncome)))] : null,
      val(R2.incomeShareOfNeed) ? ['Share of spending covered by income', String(val(R2.incomeShareOfNeed))] : null,
      val(R2.spendingGap) ? ['Withdrawn from savings each year', M(Math.round(val(R2.spendingGap)))] : null,
      R2.savingsRunOut ? ['Savings run out at age', `${(R2.savingsRunOut.label.match(/age (\d+)/) || [])[1]}`] : val(R2.savingsLeftAtPlanEnd) ? ['Savings left at the end of the plan', M(val(R2.savingsLeftAtPlanEnd))] : null,
      finEdad ? ['The plan runs to age', `${finEdad}`] : null].filter(Boolean),
  };
  for (const q of Q) { const f = DET[q.tema] && DET[q.tema](); if (f && f.length) q.filas = f; }

  return {
    slug,
    fam: { titulo: `${lista(nombres)} ${apellido}`, apellido, pl, adultos: ad.map(a => ({ nombre: a.first_name, edad: a.age, jubila: a.retirement_age, riesgo: a.risk_profile })), hijos: ki.map(k => ({ nombre: k.first_name, edad: k.age })) },
    hoyAnio, nota: { hoy: nota, max: notaMax, banda: BANDA[get(fh, 'score.band')] || null, color: get(fh, 'score.colour') },
    areas, frases, ganancias, orden, catalogo: Q, pasos, combos, primer, linea, abiertas, dudas: cat,
  };
}

// ------------------------------------------------------------------ 3. frases: el LLM de Sherpas
const NUM = /\d+(?:[,  ]\d{3})*(?:\.\d+)?/g;
const canon = s => s.replace(/[,  ]/g, '');
const numeros = txt => (String(txt).replace(/<[^>]+>/g, ' ').match(NUM) || []).map(canon);
const limpio = s => String(s || '').replace(/[<>]/g, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').trim();

function entradaLlm(E, persona, fh) {
  return {
    familia: { nombre: E.fam.titulo, trato: E.fam.pl ? 'you (two adults, speak to both)' : 'you (one adult)', adultos: E.fam.adultos, hijos: E.fam.hijos },
    persona: persona.slice(0, 7000),
    resumen_del_plan: get(fh, 'narrative.summary_main'),
    recomendaciones_del_plan: get(fh, 'narrative.summary_recommendations'),
    pasos_del_plan: E.pasos.map(p => ({ paso: p.titulo, nota_tras_el_paso: p.nota, lo_hace: p.quien === 'familia' ? 'the family on their own' : 'with the advisor' })),
    preguntas_posibles: E.catalogo.map(q => ({ id: q.id, tema: q.tema, noticia: q.tono === 'malo' ? 'mala' : 'buena', como_se_contesta: q.tipo === 'opciones' ? q.opciones : q.tipo === 'anio' ? 'picking a year' : 'moving a slider', pregunta_base: q.q, dato_del_plan: `${q.plan} ${q.unidad}`, hechos: q.hechos })),
    ejemplo_de_tono: { siente: 'Of every **$300** you pay, **$270** is interest. The debt barely goes down.' },
  };
}

const SISTEMA = (reglas) => `You prepare, for Sherpas, the conversation before the meeting with a family that is not yet a client.
The family will guess a figure from their own plan and then see the real one. Your job is to choose which figures to ask about and to write what they are told on each path, so that they FEEL the figure and want to talk to their advisor.

Rules you cannot break:
- You do not calculate anything. No adding, subtracting or comparing figures. You may only use figures that appear in "hechos" for that same question, written the same way.
- You do not invent advice or products. Which plan step answers each figure is set by the code, not by you.
- The plan surprises, not the person: never make them feel foolish or guilty.
- No false urgency, countdowns or needless fear.
- Plain, warm American English, short sentences. No jargon a beginner would not know; when a US term is needed (401(k), 529, umbrella policy), keep it as is. The currency is the dollar ($).
- Speak to the family as "you" (see "familia.trato").
- "ejemplo_de_tono" is only to hear the tone. It is from another family: do not copy its phrases or its figures.
- Sherpas rules for quoting figures: ${reglas.join(' ')}

What you return, in JSON and nothing else:
{
 "lectura": "2 or 3 sentences in the third person, for the advisor: what this family cares about according to their persona and which figure will move them most. No figures.",
 "orden": ["id", ...],        // 3 to 5 ids from preguntas_posibles. Start with the one that will hook THIS family most and, if there is one, end with good news.
 "porque_orden": "one sentence",
 "frases": ["...", "...", "...", "..."],      // 4 answers to "what matters most to you?", in the first person as the family would say them. 45 characters at most, no figures, no final period.
 "ganancias": ["...", "...", "...", "..."],   // 4 answers to "if this were solved, what would change at home?", in the first person ("I'd sleep..." or "We'd sleep..."). 45 characters at most, no figures, no final period.
 "abiertas": ["...", "...", "..."],           // 3 "what if...?" questions this family would have that only the advisor can answer, in the first person. No new figures.
 "preguntas": {
   "<id>": {
     "q": "the question. You may keep pregunta_base or bring it closer to their life, but it must be answerable as como_se_contesta says and must not give away the figure",
     "siente": "1 or 2 sentences that translate the figure into THEIR life: their children by name, their home, their date, what their persona says. Mark the key figure in **bold**. If the news is good, make it sound good"
   }
 }
}
"siente" at most 200 characters, no dashes or parentheses. Write "preguntas" only for the ids in "orden".`;

async function pedirLlm(mensajes) {
  const base = (ENV.LLM_PROXY_URL || 'https://llm-hackathon.sherpaswealth.com').replace(/\/+$/, '').replace(/\/v1$/, '');
  const pedir = async conFormato => fetch(`${base}/v1/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ENV.TEAM_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: mensajes, ...(conFormato ? { response_format: { type: 'json_object' } } : {}) }),
  });
  let r = await pedir(true);
  if (r.status === 400) r = await pedir(false);
  if (!r.ok) throw new Error(`LLM: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const txt = get(j, 'choices.0.message.content') || '';
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('LLM: response without JSON');
  return { json: JSON.parse(m[0]), uso: j.usage || null };
}

// 4. control: cada número del texto tiene que venir en lo que se le dio.
const JERGA = /\b(revolving|liquidity|euros?)\b/i;
function controlar(E, salida) {
  const avisos = [], ok = { preguntas: {} };
  const ids = E.catalogo.map(q => q.id);
  const permitidosFam = new Set([...E.fam.adultos.flatMap(a => [a.edad, a.jubila]), ...E.fam.hijos.map(h => h.edad)].map(String));
  const sinNumeros = (campo, v, max) => {
    if (!Array.isArray(v)) return null;
    const l = v.map(x => limpio(x).replace(/\.$/, '')).filter(x => x && x.length <= max && !numeros(x).length);
    if (l.length !== v.length) avisos.push(`${campo}: removed ${v.length - l.length} phrases (figures or too long)`);
    return l;
  };
  const orden = Array.isArray(salida.orden) ? [...new Set(salida.orden.filter(id => ids.includes(id)))] : [];
  if (orden.length >= 3 && orden.length <= 5) ok.orden = orden; else avisos.push('orden: not valid, using the template order');
  const fr = sinNumeros('frases', salida.frases, 60); if (fr && fr.length >= 3) ok.frases = fr.slice(0, 4);
  const ga = sinNumeros('ganancias', salida.ganancias, 60); if (ga && ga.length >= 3) ok.ganancias = ga.slice(0, 4);
  const ab = Array.isArray(salida.abiertas) ? salida.abiertas.map(limpio).filter(x => x && x.length <= 120 && !JERGA.test(x)).map(x => /^[^?]*$/.test(x) ? x + '?' : x) : null;
  if (ab && ab.length >= 2) {
    const todo = new Set(E.catalogo.flatMap(q => q.hechos.flatMap(numeros)).concat(E.linea.map(l => String(l.anio)), [...permitidosFam]));
    const buenas = ab.filter(x => numeros(x).every(n => todo.has(n)));
    if (buenas.length !== ab.length) avisos.push(`abiertas: ${ab.length - buenas.length} dropped for figures not in the plan`);
    if (buenas.length >= 2) ok.abiertas = buenas.slice(0, 3);
  }
  if (typeof salida.lectura === 'string') { const l = limpio(salida.lectura); if (l && !numeros(l).length && l.length <= 500) ok.lectura = l; else avisos.push('lectura: dropped (figures or too long)'); }
  if (typeof salida.porque_orden === 'string' && !numeros(salida.porque_orden).length) ok.porque_orden = limpio(salida.porque_orden).slice(0, 240);
  for (const q of E.catalogo) {
    const p = (salida.preguntas || {})[q.id]; if (!p) continue;
    const permitidos = new Set([...q.hechos.flatMap(numeros), ...numeros(q.plan), ...numeros(q.q), ...permitidosFam]);
    const out = {};
    // Los titulares de cada camino y la salida (qué paso del plan responde al dato) los pone el código:
    // son lógica, no estilo, y un titular con el sentido cambiado engaña a la familia.
    for (const [campo, max] of [['q', 170], ['siente', 230]]) {
      if (typeof p[campo] !== 'string') continue;
      const v = limpio(p[campo]);
      const malos = numeros(v.replace(/\{dif\}|\{tu\}/g, '')).filter(n => !permitidos.has(n));
      const trato = /(?!)/; // in English «you» is the same for one person or two
      if (!v || v.length > max) avisos.push(`${q.id}.${campo}: dropped for length`);
      else if (trato.test(v)) avisos.push(`${q.id}.${campo}: dropped, wrong form of address`);
      else if (malos.length) avisos.push(`${q.id}.${campo}: dropped, figure not in the plan (${malos.join(', ')})`);
      else if (JERGA.test(v) || /—/.test(v)) avisos.push(`${q.id}.${campo}: dropped for jargon or dashes`);
      else if (/[{}]/.test(v)) avisos.push(`${q.id}.${campo}: dropped for invalid markers`);
      else out[campo] = v;
    }
    if (Object.keys(out).length) ok.preguntas[q.id] = out;
  }
  return { ok, avisos };
}

function aplicar(E, ok) {
  if (ok.orden) E.orden = ok.orden;
  if (ok.frases) E.frases = ok.frases;
  if (ok.ganancias) E.ganancias = ok.ganancias.map((g, i) => [(E.ganancias[i] || E.ganancias[0])[0], g]);
  if (ok.abiertas) E.abiertas = ok.abiertas.map((q, i) => ({ id: 'oq' + (i + 1), q }));
  if (ok.lectura) E.lectura = ok.lectura;
  if (ok.porque_orden) E.porqueOrden = ok.porque_orden;
  for (const q of E.catalogo) {
    const p = ok.preguntas[q.id]; if (!p) continue;
    q.escritas = Object.keys(p);
    if (p.q) q.q = p.q;
    if (p.siente) q.siente = p.siente;
  }
}

const CACHE = slug => path.join(OUT, 'llm', slug + '.json');
const TRAD = slug => path.join(OUT, 'llm', slug + '.informe.json');
const CORTO = slug => path.join(OUT, 'llm', slug + '.corto.json');

// Reaplica una respuesta del LLM ya guardada, pasándola otra vez por el control de cifras.
function reaplicar(E, guardado) {
  const c = controlar(E, guardado.respuesta);
  aplicar(E, c.ok);
  return { avisos: c.avisos, crudo: guardado.respuesta };
}

async function escribirConLlm(E, persona, fh) {
  const reglas = get(fh, 'key_metrics.facts.rules') || [];
  const mensajes = [{ role: 'system', content: SISTEMA(reglas) }, { role: 'user', content: JSON.stringify(entradaLlm(E, persona, fh)) }];
  let { json, uso } = await pedirLlm(mensajes);
  let c = controlar(E, json), intentos = 1;
  if (c.avisos.length) { // un segundo intento, enseñándole lo que se ha descartado
    mensajes.push({ role: 'assistant', content: JSON.stringify(json) }, { role: 'user', content: `These parts were dropped: ${c.avisos.join('; ')}. Return the full JSON again, fixing only that. Remember: no figure that is not in "hechos".` });
    try { const r2 = await pedirLlm(mensajes); const c2 = controlar(E, r2.json); intentos = 2; if (c2.avisos.length <= c.avisos.length) { c = c2; json = r2.json; uso = r2.uso; } } catch (e) { c.avisos.push('second attempt failed: ' + e.message); }
  }
  aplicar(E, c.ok);
  return { avisos: c.avisos, intentos, uso, crudo: json };
}

// ------------------------------------------------------------------ salida
// ------------------------------------------------------------------ modo pareja: perfiles de riesgo y la peor caída real
// Escala de perfiles de Sherpas (allocationBenchmarkAnalysis: Income 1 … Aggressive 5).
const PERFIL = { Income: [1, 'Income'], Conservative: [2, 'Conservative'], Moderate: [3, 'Moderate'], Growth: [4, 'Growth'], Aggressive: [5, 'Aggressive'] };
function leerPareja(E, ia) {
  if (!E.fam.pl) return null;
  const perfiles = E.fam.adultos.map(a => ({ nombre: a.nombre, riesgo: a.riesgo, nivel: (PERFIL[a.riesgo] || [])[0] || null, etiqueta: (PERFIL[a.riesgo] || [])[1] || a.riesgo }));
  const h = get(ia, 'key_metrics.performanceAnalysis.household') || {};
  const caida = h.maxDrawdown3y != null ? { pct: Math.abs(h.maxDrawdown3y), txt: P(Math.abs(h.maxDrawdown3y), 1), dias: h.maxDrawdownRecoveryDays ?? null } : null;
  return { perfiles, caida, escala: Object.values(PERFIL).map(x => x[1]) };
}

// ------------------------------------------------------------------ el plan en 5 temas + roadmap
// Una tarjeta por cada área de la nota, con las cifras de la sección del informe (estudio previo)
// que le corresponde, y una tarjeta final con el roadmap. Todo leído del plan; rótulos por código.
// Cobertura: cada cifra lleva su origen, para comprobar que no falta nada del informe.
const TIPO_DEUDA = { Mortgage: 'Mortgage', 'Credit card': 'Card', 'Student loan': 'Student loan', 'Vehicle loan': 'Car loan', 'Other liability': 'Other debt', 'Personal loan': 'Personal loan' };
const TIPO_SEGURO = { LONG_TERM_DI: 'Disability (long-term)', SHORT_TERM_DI: 'Disability (short-term)', WHOLE_LIFE: 'Life (whole)', TERM_LIFE: 'Life (term)', HOMEOWNERS_INSURANCE: 'Homeowners', VEHICLE_INSURANCE: 'Car', UMBRELLA_INSURANCE: 'Umbrella liability', HEALTH_INSURANCE: 'Health', LONG_TERM_CARE: 'Long-term care' };
const TIPO_ACTIVO = { 'Cash account': 'Cash', 'Investment account': 'Investments', 'Real estate': 'Home', Vehicle: 'Vehicles', 'Other asset': 'Other' };
function leerTemas(E, fh, ia) {
  const t = (p, s) => (E.fam.pl ? p : s), val = x => (x && typeof x === 'object' ? x.value : x), num = x => (typeof x === 'number' && !isNaN(x) ? x : null);
  const km = get(fh, 'key_metrics') || {}, R = km.ratios || {}, F = km.facts || {}, C = F.cash || {}, RT = F.retirement || {}, ED = F.education || {};
  const ad = (get(fh, 'case.household') || []).filter(p => p.role !== 'child'), ki = (get(fh, 'case.household') || []).filter(p => p.role === 'child');
  const fila = (lab, txt, o) => txt == null || txt === '' ? null : [lab, String(txt), o || ''];
  const out = {};

  // Ahorro y flujo de caja · informe: «Savings & Expenses»
  const sl = R.savingsLevel || {}, inc = (get(fh, 'profile.incomes') || []).filter(i => i.type === 'SALARY_AND_WAGES');
  const match = (get(km, 'assetsAndInvestments.matchGapAnalysis') || []).filter(m => m.matchMaximizationStatus && m.matchMaximizationStatus !== 'NOT_APPLICABLE');
  const gastoAnual = num(get(R, 'investableAssetLevel.annualExpenses')), sinCobrar = match.reduce((s, m) => s + (m.uncapturedAnnualMatch || 0), 0), cobra = match.reduce((s, m) => s + (m.currentAnnualMatch || 0), 0);
  // El análisis marca si el gasto declarado es fiable; si no, el gasto y lo que sobra se enseñan como estimados.
  const est = get(ia, 'key_metrics.savingsAndContributions.savingsCapacity.savingsCapacityReliable') === false, ES = x => est ? x + ' (estimated)' : x;
  const SALIDA = { Taxes: 'Taxes', 'Debt Payments': 'Debt', 'Housing Expenses': 'Housing', Savings: 'Savings', Expenses: 'Living expenses' };
  const sal = (get(km, 'savingsAndExpenses.incomeAndCashflow.outflowSummary') || []).slice(1).filter(r => r[0] !== 'Total' && r[1] > 0);
  const ahorroMatch = match.length ? (sinCobrar > 0 ? `You’re leaving ${M(sinCobrar)} a year on the table` : `You get all of it: ${M(cobra)} a year`) : null;
  out['Savings'] = {
    resumen: [fila('Savings per year', sl.savingAmount != null ? `${M(sl.savingAmount)}, ${P(sl.ratio, 1)} of your income` : null, 'ratios.savingsLevel'), fila('Employer match', ahorroMatch, 'matchGapAnalysis')].filter(Boolean),
    detalle: [
      ...inc.map(i => fila(`${E.fam.pl ? (i.name.startsWith('Co-client') ? ad[1].first_name : ad[0].first_name) + '’s salary' : 'Salary'}`, `${M(i.yearly)} a year`, 'profile.incomes')),
      fila('Gross household income', sl.grossIncome != null ? `${M(sl.grossIncome)} a year` : null, 'ratios.savingsLevel.grossIncome'),
      fila(ES('Expenses per year (living, housing and debt)'), gastoAnual != null ? M(gastoAnual) : null, 'ratios.investableAssetLevel.annualExpenses'),
      fila('Savings per year', sl.savingAmount != null ? `${M(sl.savingAmount)} (${P(sl.ratio, 1)})` : null, 'ratios.savingsLevel'),
      ...match.map(m => fila(`Employer match · ${m.accountName}`, m.uncapturedAnnualMatch > 0 ? `${M(m.currentAnnualMatch)} of ${M(m.maxPossibleAnnualMatch)} possible` : `${M(m.currentAnnualMatch)} a year, the maximum`, 'matchGapAnalysis')),
      ...sal.map(r => fila(`Where it goes: ${r[0] === 'Expenses' ? ES(SALIDA[r[0]]) : SALIDA[r[0]] || r[0]}`, `${M(Math.round(r[1]))} a year (${P(r[2], 1)})`, 'savingsAndExpenses.incomeAndCashflow.outflowSummary')),
      fila(ES('Left over this year after expenses and savings'), num(val(RT.netCashFlowThisYear)) != null ? M(Math.round(val(RT.netCashFlowThisYear))) : null, 'facts.retirement.netCashFlowThisYear'),
      fila('Household income percentile', get(km, 'savingsAndExpenses.incomeAndCashflow.householdIncomePercentile') != null ? `above ${P(get(km, 'savingsAndExpenses.incomeAndCashflow.householdIncomePercentile'))} of households` : null, 'incomeAndCashflow.householdIncomePercentile'),
    ].filter(Boolean),
    graf: sal.length ? { tipo: 'barras', titulo: `Where your ${M(sl.grossIncome)} a year goes`, items: sal.map(r => ({ lab: r[0] === 'Expenses' ? ES(SALIDA[r[0]]) : SALIDA[r[0]] || r[0], v: r[1], txt: `${M(Math.round(r[1]))} · ${P(r[2])}`, tono: r[0] === 'Savings' ? 'bueno' : r[0] === 'Debt Payments' ? 'coste' : '' })).concat(num(val(RT.netCashFlowThisYear)) > 0 ? [{ lab: 'Left over', v: val(RT.netCashFlowThisYear), txt: M(Math.round(val(RT.netCashFlowThisYear))), tono: 'bueno' }] : []), leyenda: { coste: 'Debt payments', bueno: 'Savings and what’s left over' } } : null,
  };

  // Deudas · informe: «Debt management»
  const ld = (get(km, 'debtManagement.listOfDebts') || []).slice(1).filter(r => r[2] > 0).map(r => ({ nombre: r[0], tipo: TIPO_DEUDA[r[1]] || r[1], saldo: r[2], tipoInt: r[3], pago: r[4], interes: r[5] }));
  const ind = R.indebtedness || {}, dti = R.debtToIncome || {}, cara = ld.slice().sort((x, y) => y.tipoInt - x.tipoInt)[0];
  const libre = get(R, 'currentDPD.debtLastPayment'), ccFin = get(R, 'creditCardDebt.ccPayoffDate');
  // Curva de la deuda (como «Debt amortization» del informe): cuenta nuestra con el saldo, el interés y el pago
  // de cada deuda de hoy. Solo se enseña si acaba el mismo año que la fecha sin deudas que da el plan.
  let curvaDeuda = null;
  if (ld.length && libre) {
    const sal2 = ld.map(d => ({ s: d.saldo, r: d.tipoInt / 12, p: d.pago })), y0 = E.hoyAnio, serie = [[y0, Math.round(sal2.reduce((x, d) => x + d.s, 0))]];
    let mes = 0, ok = true;
    while (sal2.some(d => d.s > 0) && mes < 12 * 60) {
      mes++;
      for (const d of sal2) if (d.s > 0) { if (d.p <= d.s * d.r) { ok = false; break; } d.s = Math.max(0, d.s * (1 + d.r) - d.p); }
      if (!ok) break;
      if (mes % 12 === 0 || !sal2.some(d => d.s > 0)) serie.push([y0 + Math.ceil(mes / 12), Math.round(sal2.reduce((x, d) => x + d.s, 0))]);
    }
    if (ok && Math.abs((y0 + Math.ceil(mes / 12)) - anio(libre)) <= 1) curvaDeuda = { tipo: 'curva', titulo: 'What you owe, year by year', serie, marca: [serie[serie.length - 1][0], `Debt-free · ${fecha(libre)}`], nota: 'Our calculation, using today’s balance, interest rate and payment for each debt. The end date is the plan’s.' };
  }
  out['Debt'] = {
    resumen: ld.length ? [fila('Total debt', `${M(ind.debtBalance)}, ${M(ind.monthlyDebtPayment)} a month`, 'ratios.indebtedness'), fila('The most expensive', cara ? `${cara.tipo}: ${M(cara.saldo)} at ${P(cara.tipoInt, 1)}` : null, 'debtManagement.listOfDebts'), fila('Debt-free in', libre ? fecha(libre) : null, 'ratios.currentDPD')].filter(Boolean)
      : [fila('Total debt', `$0. You have no outstanding debt`, 'ratios.indebtedness')],
    detalle: [
      ...ld.map(d => fila(`${d.tipo} · ${d.nombre}`, `${M(d.saldo)} at ${P(d.tipoInt, 1)} · ${M(d.pago)} a month, ${M(Math.round(d.interes))} of interest a month`, 'debtManagement.listOfDebts')),
      fila('Share of income going to debt', dti.debtOnlyDti != null ? P(dti.debtOnlyDti, 1) : null, 'ratios.debtToIncome.debtOnlyDti'),
      fila('Including housing costs', dti.ratio != null ? `${P(dti.ratio, 1)} (lenders look at 36%)` : null, 'ratios.debtToIncome.ratio'),
      fila('Housing to income', get(R, 'housingRatio.ratio') != null ? P(get(R, 'housingRatio.ratio'), 1) : null, 'ratios.housingRatio'),
      fila('The card is paid off, at this pace', ccFin && ld.some(d => d.tipo === 'Card') ? fecha(ccFin) : null, 'ratios.creditCardDebt.ccPayoffDate'),
      fila('Last payment on all debts', libre ? fecha(libre) : null, 'ratios.currentDPD.debtLastPayment'),
    ].filter(Boolean),
    graf: curvaDeuda || (ld.length ? { tipo: 'barras', titulo: 'What you owe, and at what interest rate', items: ld.map(d => ({ lab: d.tipo, v: d.saldo, txt: `${M(d.saldo)} · ${P(d.tipoInt, 1)}`, tono: d === cara && cara.tipoInt >= 0.1 ? 'coste' : '' })), leyenda: { coste: 'The most expensive' } } : null),
  };

  // Inversiones · informe: «Assets & Investments» + análisis de inversiones
  const h = get(ia, 'key_metrics.performanceAnalysis.household') || {}, la = (get(km, 'assetsAndInvestments.listOfAssets') || []).slice(1);
  const invertible = num(get(R, 'investableAssetLevel.investableAssets')), caja = num(get(R, 'investableAssetLevel.cashBalance'));
  const iak = get(ia, 'key_metrics') || {}, tot = get(iak, 'concentrationAndDiversification.totals') || {}, pa = get(iak, 'portfolioAnalysis.performance') || {}, ta = get(iak, 'targetAnalysis.performance') || {};
  const pv = get(iak, 'portfolioAnalysis.volatility.annualizedVolatility'), tv = get(iak, 'targetAnalysis.volatility.annualizedVolatility');
  const eqP = ((get(iak, 'targetAnalysis.assetAllocations.assetAllocationsEF') || []).find(x => x.assetAllocation === 'EQUITY') || {}).weight ?? null;
  const sec = (get(iak, 'concentrationAndDiversification.sectorConcentration') || []).slice(1)[0];
  const SECTOR = { Technology: 'Technology', 'Financial Services': 'Financial Services', Healthcare: 'Healthcare', Industrials: 'Industrials' };
  const ENTORNO = { 'Global Financial Crisis': 'the 2008 financial crisis', 'COVID-19 Pandemic Crash': 'the COVID-19 crash (2020)', 'Global Equity Sell-off': 'the 2018 global sell-off', 'Post-GFC Bull Run': 'the post-2009 bull run' };
  const env = (get(iak, 'portfolioAnalysis.marketEnvironments') || []).filter(e => e.type === 'historical');
  const PERF = { Income: 'Income', Conservative: 'prudente', Moderate: 'equilibrado', Growth: 'Growth', Aggressive: 'atrevido' };
  out['Investments'] = {
    resumen: [fila('Invested', invertible != null ? M(invertible) : null, 'ratios.investableAssetLevel.investableAssets'), fila('Return, last 3 years', h.return3yAnnualized != null ? `${P(h.return3yAnnualized, 1)} a year` : null, 'investment-analysis · performanceAnalysis'), fila('Worst drop in 3 years', h.maxDrawdown3y != null ? `${P(Math.abs(h.maxDrawdown3y), 1)}${h.maxDrawdownRecoveryDays ? `, recovered in ${h.maxDrawdownRecoveryDays} days` : ''}` : null, 'investment-analysis · performanceAnalysis')].filter(Boolean),
    detalle: [
      ...ad.map(a => fila(`${E.fam.pl ? a.first_name + '’s risk profile' : 'Risk profile'}`, a.risk_profile ? PERF[a.risk_profile] || a.risk_profile : null, 'case.household.risk_profile')),
      fila('Total net worth', get(km, 'assetsAndInvestments.totalAssetsAndEquity.totalAssets') != null ? M(get(km, 'assetsAndInvestments.totalAssetsAndEquity.totalAssets')) : null, 'totalAssetsAndEquity'),
      fila('Net worth (what you own minus what you owe)', get(km, 'netWorthStatement.netWorth.total') != null ? M(get(km, 'netWorthStatement.netWorth.total')) : null, 'netWorthStatement.netWorth'),
      ...la.map(r => fila(TIPO_ACTIVO[r[0]] || r[0], `${M(r[2])} (${P(r[3])} of the total)`, 'assetsAndInvestments.listOfAssets')),
      fila('In stocks, of what’s invested', tot.investablePortfolioValue ? P(tot.equityExposure / tot.investablePortfolioValue) : null, 'investment-analysis · concentrationAndDiversification.totals'),
      fila('Household mix today (stocks / other)', h.currentEquityPct != null ? `${Math.round(h.currentEquityPct * 100)} / ${100 - Math.round(h.currentEquityPct * 100)}` : null, 'investment-analysis · performanceAnalysis.household.currentEquityPct'),
      fila('Mix the analysis proposes', eqP != null ? `${Math.round(eqP * 100)} / ${100 - Math.round(eqP * 100)}` : null, 'investment-analysis · targetAnalysis.assetAllocations'),
      fila('Expected return per year, today and proposed', pa.expectedPerformance != null && ta.expectedPerformance != null ? `${P(pa.expectedPerformance, 2)} → ${P(ta.expectedPerformance, 2)}` : null, 'investment-analysis · portfolioAnalysis / targetAnalysis'),
      fila('How much it moves per year, today and proposed', pv != null && tv != null ? `${P(pv, 2)} → ${P(tv, 2)}` : null, 'investment-analysis · volatility'),
      sec ? fila('Largest sector', `${SECTOR[sec[0]] || sec[0]}: ${P(sec[1])} of stocks (${sec[3] === 'Elevated' ? 'elevated' : 'normal'})`, 'investment-analysis · sectorConcentration') : null,
      ...env.map(e => fila(`How it would do in: ${ENTORNO[e.name] || e.name}`, P(e.performance, 1), 'investment-analysis · marketEnvironments')),
      fila('Return, last year', h.return1yAnnualized != null ? P(h.return1yAnnualized, 1) : null, 'investment-analysis · return1yAnnualized'),
      fila('Cumulative return, 3 years', h.return3yCumulative != null ? P(h.return3yCumulative, 1) : null, 'investment-analysis · return3yCumulative'),
      fila('How much it moves (3-year volatility)', h.volatility3y != null ? P(h.volatility3y, 1) : null, 'investment-analysis · volatility3y'),
    ].filter(Boolean),
    graf: la.length ? { tipo: 'barras', titulo: 'Where your net worth is'.replace('your', t('your', 'your')), items: la.map(r => ({ lab: TIPO_ACTIVO[r[0]] || r[0], v: r[2], txt: `${M(r[2])} · ${P(r[3])}` })) } : null,
  };

  // Colchón · informe: «Emergency fund»
  const ac = num(val(C.accessibleCash)), mc = parseFloat(val(C.monthsCovered)), er = C.emergencyReserve || {}, ef = R.emergencyFund || {};
  const cy = ((get(ia, 'key_metrics.cashNeeds.summaryIncome') || []).find(r => r[0] === 'Total')) || null;
  const sobra = num(val(C.cashAboveTotalNeeded)), falta = num(ef.shortfallToAdjustedMin);
  out['Emergency fund'] = {
    resumen: [fila('Accessible cash', ac != null ? M(ac) : null, 'facts.cash.accessibleCash'), fila('Covers', !isNaN(mc) ? `${dec(mc, 1)} months of essential expenses (the plan asks for ${ef.minRecommendedEFMonths} to ${ef.maxRecommendedEFMonths})` : null, 'facts.cash.monthsCovered'), sobra > 0 ? fila('Surplus', `${M(sobra)} above the reserve and planned expenses`, 'facts.cash.cashAboveTotalNeeded') : falta > 0 ? fila('Shortfall', `${M(falta)} short of the reserve and planned expenses`, 'ratios.emergencyFund.shortfallToAdjustedMin') : null].filter(Boolean),
    detalle: [
      fila('Accessible cash', ac != null ? M(ac) : null, 'facts.cash.accessibleCash'),
      fila('Essential expenses per month', ef.monthlyExpenses ? M(ef.monthlyExpenses) : null, 'ratios.emergencyFund.monthlyExpenses'),
      fila('Months it covers today', !isNaN(mc) ? dec(mc, 1) : null, 'facts.cash.monthsCovered'),
      fila('Reserve the plan recommends', er.min != null ? `${M(er.min)} to ${M(er.max)} (${ef.minRecommendedEFMonths} to ${ef.maxRecommendedEFMonths} months)` : null, 'facts.cash.emergencyReserve'),
      fila('Months after setting aside planned expenses', val(C.monthsCoveredAfterNearTermGoals) != null ? dec(val(C.monthsCoveredAfterNearTermGoals), 1) : null, 'facts.cash.monthsCoveredAfterNearTermGoals'),
      sobra > 0 ? fila('Surplus after the reserve and those expenses', M(sobra), 'facts.cash.cashAboveTotalNeeded') : null,
      C.totalCashNeeded ? fila('Cash the plan asks for, including planned expenses', `${M(C.totalCashNeeded.min)} a ${M(C.totalCashNeeded.max)}`, 'facts.cash.totalCashNeeded') : null,
      ...(C.nearTermGoals || []).map(g => fila('Planned expense', `${M(g.value)}: ${/vacation/i.test(g.label) ? 'vacation' : /home|real estate|house/i.test(g.label) ? 'home' : /vehicle|car/i.test(g.label) ? 'car' : 'other goal'}`, 'facts.cash.nearTermGoals')),
      falta > 0 ? fila('Shortfall for the reserve and those expenses', M(falta), 'ratios.emergencyFund.shortfallToAdjustedMin') : null,
      cy && cy[2] > cy[1] ? fila('What the cash earns per year', `${M(Math.round(cy[1]))}; well placed, about ${M(Math.round(cy[2]))}`, 'investment-analysis · cashNeeds.summaryIncome') : null,
    ].filter(Boolean),
    graf: ac != null && er.min != null ? { tipo: 'rango', titulo: 'Your cash vs. what’s recommended'.replace('Your', t('Your', 'Your')), v: ac, min: er.min, max: er.max, txt: M(ac), minTxt: M(er.min), maxTxt: M(er.max) } : null,
  };

  // Seguros · informe: «Insurance & Protection» (vida y umbrella)
  const li = R.lifeInsurance || {}, um = R.umbrella || {}, pol = get(fh, 'profile.insurance') || [];
  const vidas = ad.map((a, i) => ({ n: a.first_name, hoy: i ? li.coClientCoverage : li.clientCoverage, min: i ? li.recommendedCoClientMinCoverage : li.recommendedClientMinCoverage, max: i ? li.recommendedCoClientMaxCoverage : li.recommendedClientMaxCoverage })).filter(v => v.min);
  out['Insurance'] = {
    resumen: [...vidas.map(v => fila(`Life${E.fam.pl ? ' · ' + v.n : ''}`, `${M(v.hoy || 0)}; the plan asks for at least ${M(v.min)}`, 'ratios.lifeInsurance')), um.recommendedCoverage ? fila('Umbrella liability', `${M(um.currentCoverage || 0)} of ${M(um.recommendedCoverage)} recommended`, 'ratios.umbrella') : null].filter(Boolean),
    detalle: [
      ...vidas.flatMap(v => [fila(`${v.n}’s life insurance`, M(v.hoy || 0), 'ratios.lifeInsurance'), fila(`Recommended for ${v.n}`, `${M(v.min)} a ${M(v.max)}`, 'ratios.lifeInsurance'), (v.hoy || 0) < v.min ? fila(`${v.n}’s shortfall, at minimum`, M(v.min - (v.hoy || 0)), 'ratios.lifeInsurance') : null]),
      um.recommendedCoverage ? fila('Umbrella liability', `${M(um.currentCoverage || 0)} today, ${M(um.recommendedCoverage)} recommended`, 'ratios.umbrella') : null,
      ...pol.map(p => fila(`Policy · ${TIPO_SEGURO[p.type] || p.type}${E.fam.pl ? ((a => a ? ' · ' + a : '')(/^Your /.test(p.name) ? ad[0].first_name : (ad.find(x => p.name.includes(x.first_name)) || {}).first_name)) : ''}`, typeof p.coverage === 'number' ? M(p.coverage) : 'in force, no amount in the plan', 'profile.insurance')),
      ki.length ? fila('Who depends on this income', lista(ki.map(k => `${k.first_name} (${k.age})`)), 'case.household') : null,
    ].filter(Boolean),
    graf: vidas.length || um.recommendedCoverage ? { tipo: 'barras', titulo: 'What you have vs. what’s recommended', items: [...vidas.map(v => ({ lab: `Life${E.fam.pl ? ' ' + v.n : ''}`, v: v.hoy || 0, ref: v.min, txt: `${M(v.hoy || 0)} of ${M(v.min)}`, tono: (v.hoy || 0) < v.min ? 'coste' : 'bueno' })), um.recommendedCoverage ? { lab: 'Umbrella', v: um.currentCoverage || 0, ref: um.recommendedCoverage, txt: `${M(um.currentCoverage || 0)} of ${M(um.recommendedCoverage)}`, tono: (um.currentCoverage || 0) < um.recommendedCoverage ? 'coste' : 'bueno' } : null].filter(Boolean), leyenda: { coste: 'Below the minimum', bueno: 'Covered' } } : null,
  };

  // ---- página de cada tema, con la estructura de su sección del informe:
  // cifras clave (las cajas de arriba del PDF), desglose con su total (la tabla), qué significa (las viñetas)
  // y «para hablar con el asesor» (el recuadro «We should look into»). Todo con cifras del plan.
  const k = (lab, val, sub, tono) => (val == null || val === '' ? null : { lab, val: String(val), sub: sub || '', tono: tono || '' });
  const pct = x => P(x, 1).replace(',0 ', ' ');
  const ingresos = sl.grossIncome, sobraAnio = num(val(RT.netCashFlowThisYear));
  const SAL2 = { Taxes: 'taxes', 'Debt Payments': 'debt', 'Housing Expenses': 'housing', Savings: 'savings', Expenses: 'living expenses' };
  const de100 = sal.map(r => `${Math.round(r[2] * 100)} to ${SAL2[r[0]] || r[0]}`);
  Object.assign(out['Savings'], {
    kpis: [k('Income per year', ingresos != null ? Mk(ingresos) : null), k('Savings per year', sl.savingAmount != null ? Mk(sl.savingAmount) : null, sl.ratio != null ? `${pct(sl.ratio)} of income` : '', sl.ratio == null ? '' : sl.ratio >= 0.2 ? 'bueno' : sl.ratio < 0.1 ? 'coste' : ''),
      k(ES('Left over per year'), sobraAnio != null ? Mk(Math.round(sobraAnio)) : null, est ? 'reported expenses may be low' : 'after expenses and savings', sobraAnio < 0 ? 'coste' : ''), match.length ? k('Employer match', Mk(cobra), sinCobrar > 0 ? `${Mk(sinCobrar)} not captured` : 'the maximum', sinCobrar > 0 ? 'coste' : 'bueno') : null].filter(Boolean),
    desglose: sal.length ? { titulo: 'Where your income goes each year', filas: sal.map(r => [r[0] === 'Expenses' ? ES(SALIDA[r[0]]) : SALIDA[r[0]] || r[0], M(Math.round(r[1]))]).concat(sobraAnio != null ? [[ES(sobraAnio < 0 ? 'Short' : 'Left over'), M(Math.round(sobraAnio))]] : []), total: ['Income', M(ingresos)] } : null,
    lectura: [de100.length ? `Of every $100 that comes in, ${lista(de100)}.` : null,
      sobraAnio != null ? (sobraAnio >= 0 ? `After everything, you have ${b(M(Math.round(sobraAnio)))} left over this year.` : `This year you’re ${b(M(Math.round(-sobraAnio)))} short: more goes out than comes in.`) : null,
      est ? `Living expenses and what’s left over are ${b('estimates')}: the analysis warns that reported expenses may be lower than the real ones.` : null,
      match.length ? (sinCobrar > 0 ? `Your employer could add ${b(M(sinCobrar))} more a year that you’re not collecting today.` : `You collect the full employer match: ${b(M(cobra))} a year.`) : null].filter(Boolean),
    asesor: `Confirm your real day-to-day spending and what to do with what’s left over each year.`,
  });
  const caraInt = cara ? Math.round(cara.interes) : null;
  Object.assign(out['Debt'], {
    kpis: ld.length ? [k('Total debt', Mk(ind.debtBalance)), k('Monthly payment', Mk(ind.monthlyDebtPayment)), k('Debt to income', dti.debtOnlyDti != null ? pct(dti.debtOnlyDti) : null, dti.ratio != null ? `${pct(dti.ratio)} including housing` : ''), k('Debt-free in', libre ? String(anio(libre)) : null, libre ? fecha(libre) : '')].filter(Boolean) : [k('Total debt', '0 $', t('You have no debt', 'You have no debt'), 'bueno')],
    desglose: ld.length ? { titulo: 'What you owe', filas: ld.map(d => [`${d.tipo} · ${P(d.tipoInt, 1)}`, M(d.saldo)]), total: ['Total', M(ind.debtBalance)] } : null,
    lectura: ld.length ? [cara ? `The most expensive is the ${low(cara.tipo)}: ${b(M(cara.saldo))} at ${b(P(cara.tipoInt, 1))}, ${b(M(caraInt))} of interest a month.` : null,
      dti.ratio != null ? `Including housing, payments take ${b(pct(dti.ratio))} of income. Lenders start paying attention at 36%.` : null,
      ccFin && ld.some(d => d.tipo === 'Card') ? `Paying as you do now, the card is paid off in ${b(fecha(ccFin))}.` : null].filter(Boolean) : [`You have no outstanding debt.`],
    asesor: ld.length ? `Weigh the most expensive debt against the spare cash and the time to pay it off.` : '',
  });
  const eqInv = tot.investablePortfolioValue ? tot.equityExposure / tot.investablePortfolioValue : null, crisis = env.find(e => e.name === 'Global Financial Crisis');
  // Mismo criterio que la tarjeta «Cómo se ha portado la cartera» (puntos.mjs): verde solo si no queda por debajo de su referencia.
  const refRent = get(ia, 'key_metrics.performanceAnalysis.sameRiskBenchmark.return3yAnnualized');
  const tonoRent = h.return3yAnnualized != null && refRent != null ? (h.return3yAnnualized - refRent < 0 ? 'coste' : 'bueno') : '';
  Object.assign(out['Investments'], {
    kpis: [k('Invested', invertible != null ? Mk(invertible) : null), k('Net worth', get(km, 'netWorthStatement.netWorth.total') != null ? Mk(get(km, 'netWorthStatement.netWorth.total')) : null),
      k('Return', h.return3yAnnualized != null ? pct(h.return3yAnnualized) : null, 'a year, last 3 years', tonoRent), k('Worst drop', h.maxDrawdown3y != null ? pct(Math.abs(h.maxDrawdown3y)) : null, h.maxDrawdownRecoveryDays ? `recovered in ${h.maxDrawdownRecoveryDays} days` : '', 'coste')].filter(Boolean),
    desglose: la.length ? { titulo: `Where your net worth is`, filas: la.map(r => [TIPO_ACTIVO[r[0]] || r[0], M(r[2])]), total: ['Total', M(get(km, 'assetsAndInvestments.totalAssetsAndEquity.totalAssets'))] } : null,
    lectura: [eqInv != null ? `${b(pct(eqInv))} of what you have invested is in stocks.` : null,
      h.currentEquityPct != null && eqP != null ? `Counting cash, today’s mix is ${b(`${Math.round(h.currentEquityPct * 100)} / ${100 - Math.round(h.currentEquityPct * 100)}`)} (stocks / other). The analysis proposes ${b(`${Math.round(eqP * 100)} / ${100 - Math.round(eqP * 100)}`)}${pa.expectedPerformance != null && ta.expectedPerformance != null ? `, with an expected return of ${P(ta.expectedPerformance, 2)} instead of ${P(pa.expectedPerformance, 2)}` : ''}.` : null,
      crisis ? `In a crisis like 2008, this portfolio would have fallen ${b(pct(Math.abs(crisis.performance)))}.` : null].filter(Boolean),
    asesor: E.fam.pl && ad[0].risk_profile !== ad[1].risk_profile ? `${ad[0].first_name} is ${PERF[ad[0].risk_profile] || ad[0].risk_profile} and ${ad[1].first_name} is ${PERF[ad[1].risk_profile] || ad[1].risk_profile}: decide together how much risk you want in the portfolio.` : `Whether the portfolio’s risk fits your profile and what you want to achieve.`,
  });
  Object.assign(out['Emergency fund'], {
    kpis: [k('Cash', ac != null ? Mk(ac) : null), k('Covers', !isNaN(mc) ? `${dec(mc, 1)} months` : null, 'of essential expenses'), k('Recommended', ef.minRecommendedEFMonths ? `${ef.minRecommendedEFMonths} to ${ef.maxRecommendedEFMonths} months` : null, er.min != null ? `${Mk(er.min)} a ${Mk(er.max)}` : ''),
      sobra > 0 ? k('Surplus', Mk(sobra), 'after the reserve and planned expenses', ef.color === 'R' ? '' : 'bueno') : falta > 0 ? k('Shortfall', Mk(falta), 'short of the reserve and planned expenses', 'coste') : null].filter(Boolean),
    desglose: C.totalCashNeeded ? { titulo: 'What the plan asks you to hold in cash', filas: [['Emergency reserve', `${M(er.min)} a ${M(er.max)}`], ...(C.nearTermGoals || []).map(g => [`Planned expense: ${/vacation/i.test(g.label) ? 'vacation' : /home|real estate|house/i.test(g.label) ? 'home' : /vehicle|car/i.test(g.label) ? 'car' : 'other'}`, M(g.value)]), [`What you have`, M(ac)]], total: ['Total it asks for', `${M(C.totalCashNeeded.min)} a ${M(C.totalCashNeeded.max)}`] } : null,
    lectura: [!isNaN(mc) ? `Your cash covers ${b(dec(mc, 1) + ' months')} of essential expenses; the plan asks for ${ef.minRecommendedEFMonths} to ${ef.maxRecommendedEFMonths}.` : null,
      sobra > 0 ? `Above the reserve and planned expenses, ${b(M(sobra))} is left over.` : falta > 0 ? `To cover the reserve and planned expenses, ${b(M(falta))} is missing.` : null,
      cy && cy[2] > cy[1] ? `Today that cash earns ${b(M(Math.round(cy[1])))} a year; well placed, about ${b(M(Math.round(cy[2])))}.` : null].filter(Boolean),
    asesor: sobra > 0 ? `What to do with the spare cash: debt, insurance or investing.` : `How to reach the reserve without neglecting everything else.`,
  });
  const faltan = vidas.filter(v => (v.hoy || 0) < v.min);
  const casa = get(R, 'realEstateEquity.realEstateAssets') || 0, sinHogar = casa > 0 && !pol.some(x => (x.type || x.insurance_type) === 'HOMEOWNERS_INSURANCE');
  Object.assign(out['Insurance'], {
    kpis: [...vidas.map(v => k(`Life${E.fam.pl ? ' · ' + v.n : ''}`, Mk(v.hoy || 0), `needs at least ${Mk(v.min)}`, (v.hoy || 0) < v.min ? 'coste' : 'bueno')), um.recommendedCoverage ? k('Umbrella liability', Mk(um.currentCoverage || 0), `needs ${Mk(um.recommendedCoverage)}`, (um.currentCoverage || 0) < um.recommendedCoverage ? 'coste' : 'bueno') : null, k('Policies', String(pol.length), 'in the plan')].filter(Boolean),
    desglose: vidas.length || um.recommendedCoverage ? { titulo: 'What you have and what’s missing', filas: [...vidas.map(v => [`Life · ${v.n}`, `${M(v.hoy || 0)} of ${M(v.min)}`]), um.recommendedCoverage ? ['Umbrella liability', `${M(um.currentCoverage || 0)} of ${M(um.recommendedCoverage)}`] : null].filter(Boolean),
      total: null } : null,
    lectura: [...faltan.map(v => `${v.n} is short at least ${b(M(v.min - (v.hoy || 0)))} of life cover.`),
      um.recommendedCoverage && (um.currentCoverage || 0) < um.recommendedCoverage ? `${(um.currentCoverage || 0) ? 'Not enough' : 'No'} umbrella liability cover: the plan asks for ${b(M(um.recommendedCoverage))}.` : null,
      ki.length ? `${lista(ki.map(k2 => k2.first_name))} ${ki.length > 1 ? 'depend' : 'depends'} on your income.` : null,
      sinHogar ? `No homeowners insurance is on record for the home (${b(M(casa))}).` : null,
      !faltan.length && !(um.recommendedCoverage && (um.currentCoverage || 0) < um.recommendedCoverage) ? (sinHogar ? `The life and umbrella cover the plan asks for are in place.` : `The insurance the plan asks for is in place.`) : null].filter(Boolean),
    asesor: faltan.length || (um.currentCoverage || 0) < (um.recommendedCoverage || 0) ? `How much to buy and what it costs: the plan doesn’t include prices.` : '',
  });

  // Alertas por área. La nota de cada área es la de Sherpas (score.pillars) y no se toca, pero a veces
  // va alta con el dato principal de esa área en rojo (p. ej. Johnson: colchón 85/100 con 1,4 meses de
  // los 8 a 9 que pide el plan). La alerta baja el estado que enseña la app (color y etiqueta) y dice por qué.
  const alerta = (nivel, txt) => ({ nivel, txt });
  const minM = Number(ef.minRecommendedEFMonths);
  if (!isNaN(mc) && minM && mc < minM) out['Emergency fund'].alerta = alerta(mc < minM / 2 ? 'low' : 'mid', `Your cash covers ${dec(mc, 1)} months of essential expenses and the plan asks for ${minM} to ${ef.maxRecommendedEFMonths}.`);
  else if (ef.color === 'R' && sobra > 0) out['Emergency fund'].alerta = alerta('mid', `${M(sobra)} of cash sits above what’s recommended, earning very little.`);
  if (sobraAnio != null && sobraAnio < 0) out['Savings'].alerta = alerta('mid', `This year more goes out than comes in: ${M(Math.round(-sobraAnio))} short.`);
  else if (sinCobrar > 0) out['Savings'].alerta = alerta('mid', `Your employer could add ${M(sinCobrar)} more a year that you’re not collecting today.`);
  if (cara && cara.tipo === 'Card' && cara.tipoInt >= 0.15) out['Debt'].alerta = alerta('mid', `There is credit card debt: ${M(cara.saldo)} at ${P(cara.tipoInt, 1)}.`);
  if (faltan.length) out['Insurance'].alerta = alerta(ki.length ? 'low' : 'mid', `Life cover is short: the plan asks for more than you have.`);
  else if (sinHogar) out['Insurance'].alerta = alerta('mid', `No homeowners insurance is on record for a ${M(casa)} home.`);
  else if (um.recommendedCoverage && (um.currentCoverage || 0) < um.recommendedCoverage) out['Insurance'].alerta = alerta('mid', `There is no umbrella liability cover, and the plan asks for it.`);

  // Roadmap · informe: «Retirement & Goals» + educación + proyección del patrimonio
  const yearly = get(fh, 'projections.yearly') || [], gs = get(fh, 'goals.goalsSummary') || [], cg = get(fh, 'goals.chartGoals') || [];
  const jub = cg.filter(g => g.goalType === 'RETIREMENT').map(g => anio(g.date)), jA = jub.length ? Math.max(...jub) : null;
  const enJub = jA ? yearly.find(y => y.year === jA) : null, agota = RT.savingsRunOut;
  const META = g => g.goalType === 'RETIREMENT' ? null : g.goalType === 'VACATION' ? fila('Vacation', `${M(g.amount)} every year`, 'goals.goalsSummary') : g.goalType === 'COLLEGE' ? fila('College', `${M(g.amount)} per child`, 'goals.goalsSummary') : g.subType === 'REAL_ESTATE_PURCHASE' ? fila('Home', `${M(g.amount)}${(cg.find(c => c.subType === 'REAL_ESTATE_PURCHASE') || {}).date ? ' in ' + fecha(cg.find(c => c.subType === 'REAL_ESTATE_PURCHASE').date) : ''}`, 'goals') : g.subType === 'VEHICLE_PURCHASE' ? fila('Car', `${M(g.amount)}${(cg.find(c => c.subType === 'VEHICLE_PURCHASE') || {}).date ? ' in ' + fecha(cg.find(c => c.subType === 'VEHICLE_PURCHASE').date) : ''}`, 'goals') : fila('Other goal', g.amount ? M(g.amount) : g.value, 'goals');
  E.roadmap = {
    resumen: [fila('Retirement', jA ? `${jA}, at ${lista(ad.map(a => String(a.retirement_age)))}` : null, 'goals.chartGoals'), fila('Income covers', val(RT.incomeShareOfNeed) ? `${String(val(RT.incomeShareOfNeed))} of retirement spending` : null, 'facts.retirement.incomeShareOfNeed'), agota ? fila('Savings run out', `at age ${(agota.label.match(/age (\d+)/) || [])[1]}`, 'facts.retirement.savingsRunOut') : fila('Left at the end of the plan', val(RT.savingsLeftAtPlanEnd) != null ? M(val(RT.savingsLeftAtPlanEnd)) : null, 'facts.retirement.savingsLeftAtPlanEnd')].filter(Boolean),
    detalle: [
      ...gs.map(META).filter(Boolean),
      fila('Yearly spending in retirement', val(RT.spendingNeed) ? M(Math.round(val(RT.spendingNeed))) : null, 'facts.retirement.spendingNeed'),
      fila('Guaranteed income per year (pensions and annuities)', val(RT.guaranteedIncome) ? M(Math.round(val(RT.guaranteedIncome))) : null, 'facts.retirement.guaranteedIncome'),
      fila('Withdrawn from savings each year', val(RT.spendingGap) ? M(Math.round(val(RT.spendingGap))) : null, 'facts.retirement.spendingGap'),
      fila('Average withdrawal rate', val(RT.withdrawalRateAverage) ? String(val(RT.withdrawalRateAverage)) : null, 'facts.retirement.withdrawalRateAverage'),
      fila('Extra savings retirement needs', get(R, 'retirementSavings.requiredExtraSavings') > 0 ? `${M(Math.round(get(R, 'retirementSavings.requiredExtraSavings')))} a year` : null, 'ratios.retirementSavings.requiredExtraSavings'),
      ...(get(R, 'educationSavings.goalsSummary') || []).map(g => fila(`${g.goalName}`, `starts ${fecha(g.date)}; saved ${M(g.accountBalance || 0)}, gap ${M(Math.round(g.totalGAP))}`, 'ratios.educationSavings')),
      fila('College funding gap', val(ED.fundingGap) ? M(Math.round(val(ED.fundingGap))) : null, 'facts.education.fundingGap'),
      fila('Extra yearly saving for college', val(ED.extraYearlySaving) > 0 ? M(Math.round(val(ED.extraYearlySaving))) : null, 'facts.education.extraYearlySaving'),
      fila('Net worth today', get(km, 'netWorthStatement.netWorth.total') != null ? M(get(km, 'netWorthStatement.netWorth.total')) : null, 'netWorthStatement.netWorth'),
      fila(`Net worth at retirement (today’s dollars)`, enJub ? M(enJub.net_worth_todays_dollars) : null, 'projections.yearly'),
    ].filter(Boolean),
    kpis: [jA ? { lab: 'Retirement', val: String(jA), sub: `at ${lista(ad.map(a => String(a.retirement_age)))}`, tono: '' } : null,
      val(RT.incomeShareOfNeed) ? { lab: 'Income covers', val: String(val(RT.incomeShareOfNeed)), sub: 'of retirement spending', tono: '' } : null,
      agota ? { lab: 'Savings run out', val: `at age ${(agota.label.match(/age (\d+)/) || [])[1]}`, sub: 'years', tono: 'coste' } : val(RT.savingsLeftAtPlanEnd) != null ? { lab: 'Left at the end of the plan', val: Mk(val(RT.savingsLeftAtPlanEnd)), sub: 'in today’s dollars', tono: 'bueno' } : null,
      enJub ? { lab: `Net worth at retirement`, val: Mk(enJub.net_worth_todays_dollars), sub: 'in today’s dollars', tono: '' } : null].filter(Boolean),
    lectura: [val(RT.spendingNeed) && val(RT.guaranteedIncome) ? `In retirement you’ll spend about ${b(M(Math.round(val(RT.spendingNeed))))} a year; pensions and annuities cover ${b(M(Math.round(val(RT.guaranteedIncome))))} and the rest comes from savings.` : null,
      val(ED.fundingGap) ? `College is ${b(M(Math.round(val(ED.fundingGap))))} short${val(ED.extraYearlySaving) > 0 ? `: about ${b(M(Math.round(val(ED.extraYearlySaving))))} more a year` : ''}.` : null,
      get(R, 'retirementSavings.requiredExtraSavings') > 0 ? `For retirement to work, the plan asks you to save ${b(M(Math.round(get(R, 'retirementSavings.requiredExtraSavings'))))} more a year.` : null].filter(Boolean),
    asesor: agota ? `What to change so your savings last to the end.` : `How to fit the goals (home, car, college) without moving retirement.`,
    serie: yearly.map(y => [y.year, Math.round(y.net_worth_todays_dollars)]),
    jubila: jA,
  };
  return out;
}

// Lo que contesta la familia se contrasta con los RESULTADOS DEL ESTUDIO (cifras, nota, proyecciones).
// El PLAN son los pasos a seguir y los objetivos de cada área. Esta pasada corrige las frases
// (de plantilla o del LLM) que llaman "plan" a un resultado del estudio. No toca cifras.
const SEMANTICA = [
  [/\baccording to (the|your) plan\b/g, 'according to $1 report'],
  [/\b([Tt]he|[Yy]our) plan (says(?! to keep)|flags|sees|runs to|doesn’t include|is only calculated)\b/g, '$1 report $2'],
  [/\bdo you think your plan gives you\b/g, 'do you think your report gives you'],
  [/\bthe plan shows no homeowners insurance\b/g, 'the report shows no homeowners insurance'],
];
function semantica(o) {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') o[k] = SEMANTICA.reduce((t, [re, to]) => t.replace(re, to), v);
    else if (v && typeof v === 'object') semantica(v);
  }
  return o;
}
function cerrar(E) {
  const porId = Object.fromEntries(E.catalogo.map(q => [q.id, q]));
  E.preguntas = E.orden.map(id => porId[id]).filter(Boolean);
  const vistos = new Set();
  E.frenos = E.preguntas.filter(q => q.tono === 'malo' && q.freno && !vistos.has(q.tema) && vistos.add(q.tema)).slice(0, 2).map(q => q.id);
  for (const q of E.catalogo) delete q.hechos;
  E.sinUsar = E.catalogo.filter(q => !E.orden.includes(q.id)).map(q => ({ id: q.id, creian: q.creian, plan: `${q.plan} ${q.unidad}` }));
  delete E.catalogo; delete E.orden;
  return E;
}

function informe(E, g, crudo) {
  const sinB = s => String(s || '').replace(/<\/?b>/g, '**');
  const L = [`# Study: ${E.fam.titulo}`, '', `- Case: \`${E.slug}\``, `- Data: ${g.datos === 'mcp' ? 'Sherpas MCP (get_case)' : '`cases/` files (the same JSON the MCP serves)'}`, `- Phrases: ${g.textos.startsWith('llm') ? 'written by the Sherpas LLM (`' + g.textos.slice(4) + '`' + (g.llmFecha ? ', on ' + g.llmFecha : '') + '), with figure checks' : 'template, no LLM'}`, `- Generated: ${g.fecha}`, ''];
  if (g.avisos.length) { L.push('## Warnings', '', ...g.avisos.map(a => '- ' + a), ''); }
  if (E.lectura) L.push('## What the LLM reads about this family', '', E.lectura, '');
  if (E.porqueOrden) L.push(`Why this order: ${E.porqueOrden}`, '');
  L.push(`## Score`, '', `Today ${E.nota.hoy} out of 100. With the plan’s steps, ${E.nota.max}.`, '', '| Area | Score |', '|---|---|', ...E.areas.map(a => `| ${a.nombre} | ${a.nota} |`), '');
  L.push('## Questions, in order', '');
  E.preguntas.forEach((q, i) => {
    L.push(`### ${i + 1}. ${q.q}`, '', `- Plan figure: **${q.plan}** ${q.unidad} (${q.tono === 'malo' ? 'bad news' : 'good news'})`, `- Source: \`${q.origen}\`${q.calc ? `. Our calculation: ${q.calc}` : ''}`,
      `- If they get it right: “${q.titulares.cerca}”`, `- If the figure is higher than they said: “${q.titulares.mas}”`, `- If it’s lower: “${q.titulares.menos}”`, `- To make them feel it: ${sinB(q.siente)}`, `- Way out: ${q.salida}`,
      `- Written by the LLM: ${q.escritas && q.escritas.length ? q.escritas.join(', ') : 'nothing (template)'}`, '');
  });
  if (E.sinUsar.length) L.push('Possible questions not used in this case: ' + E.sinUsar.map(s => `${s.creian} (${s.plan})`).join('; ') + '.', '');
  L.push('## Plan steps', '', '| Step | Who | Score after the step (alone) |', '|---|---|---|', ...E.pasos.map(p => `| ${p.titulo} | ${p.quien === 'familia' ? 'The family' : 'With the advisor'} | ${p.nota} |`), '');
  const combos = Object.entries(E.combos);
  L.push(combos.length ? 'Combinations the plan includes: ' + combos.map(([k, v]) => `${k.split('|').map(x => (E.pasos.find(p => p.key === x) || {}).titulo).join(' + ')} = ${v}`).join('; ') + '.' : 'The plan doesn’t give the score for several steps together; the app doesn’t invent it.', '');
  L.push('## From today to retirement', '', ...E.linea.map(l => `- ${l.cuando}: ${l.t}${l.s ? ` (${l.s})` : ''}`), '');
  L.push('## For the advisor', '', ...E.abiertas.map(a => '- ' + a.q), '');
  if (crudo) L.push('## Full LLM response', '', '```json', JSON.stringify(crudo, null, 2), '```', '');
  return L.join('\n');
}

// ------------------------------------------------------------------ principal
async function main() {
  const sinLlm = FLAG('--sin-llm') || FLAG('--reusar') || !ENV.TEAM_KEY, sinMcp = FLAG('--sin-mcp') || !ENV.MCP_TOKEN;
  let mcp = null, slugs = ARGS.filter(a => !a.startsWith('--'));
  if (!sinMcp) {
    try {
      mcp = await mcpAbrir(ENV.MCP_URL || 'https://mcp-hackathon.sherpaswealth.com/mcp', ENV.MCP_TOKEN);
      if (!slugs.length) {
        const l = await mcp.call('list_cases', {});
        const arr = Array.isArray(l) ? l : (l.cases || l.items || []);
        slugs = arr.map(c => (typeof c === 'string' ? c : c.caseId || c.id || c.slug)).filter(Boolean);
      }
      console.log(`Sherpas MCP connected. Cases: ${slugs.join(', ')}`);
    } catch (e) { console.log(`Could not use the MCP (${e.message}). Reading the files in cases/.${(process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY ? ' This machine goes through a proxy: try NODE_USE_ENV_PROXY=1 (Node 22.21 or later).' : ''}`); mcp = null; }
  } else console.log(FLAG('--sin-mcp') ? 'MCP disabled (--sin-mcp).' : 'No MCP_TOKEN: reading the files in cases/.');
  if (!slugs.length) slugs = fs.readdirSync(path.join(ROOT, 'cases')).filter(d => fs.existsSync(path.join(ROOT, 'cases', d, 'financial-health.json')));
  console.log(sinLlm ? (FLAG('--sin-llm') ? 'LLM disabled (--sin-llm): template phrases.' : 'Not calling the LLM: reusing what it wrote in app/estudios/llm/ (template if there is nothing).') : `Sherpas LLM: ${MODEL}`);

  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(DOCS, { recursive: true });
  const indice = [];
  for (const slug of slugs) {
    const g = { fecha: new Date().toISOString().slice(0, 10), datos: 'archivos', textos: 'plantilla', avisos: [] };
    let d = null;
    if (mcp) { try { d = await parteMcp(mcp, slug); g.datos = 'mcp'; } catch (e) { g.avisos.push(`MCP: ${e.message}. The files were used.`); } }
    if (!d) d = parteArchivo(slug);
    if (g.datos === 'mcp' && fs.existsSync(path.join(ROOT, 'cases', slug, 'financial-health.json'))) {
      const local = parteArchivo(slug).fh;
      if (get(local, 'score.published_score') !== get(d.fh, 'score.published_score')) g.avisos.push('The MCP score does not match the local file.');
    }
    const E = leer(d.fh);
    E.pareja = leerPareja(E, d.ia);
    const T = leerTemas(E, d.fh, d.ia);
    E.areas.forEach(a => { Object.assign(a, T[a.nombre] || {}); });
    // Puntos del informe más allá de las cinco áreas, capas de detalle y textos del informe (con su traducción guardada).
    const PU = leerPuntos(E, d.fh, d.ia);
    const CONEX = { Savings: ['flujo', 'impuestos', 'jubilacion'], Debt: ['Emergency fund', 'flujo'], Investments: ['cartera', 'jubilacion'], 'Emergency fund': ['Debt', 'Insurance', 'universidad'], Insurance: ['Emergency fund', 'Debt'] };
    E.areas.forEach(a => { a.capas = (PU.extra[a.nombre] || {}).capas || []; a.conexiones = CONEX[a.nombre] || []; });
    E.puntos = PU.puntos; E.notaCapas = PU.notaCapas;
    const trad = fs.existsSync(TRAD(slug)) ? JSON.parse(fs.readFileSync(TRAD(slug), 'utf8')) : {};
    E.narrativa = Object.entries(NARRATIVA).map(([clave, [punto, titulo]]) => {
      const [parte, campo] = clave.split('.'), en = get(parte === 'fh' ? d.fh : d.ia, 'narrative.' + campo);
      if (!en) return null;
      const es = en; // versión en inglés: el texto original del informe, tal cual
      return { clave, punto, titulo, en, es };
    }).filter(Boolean);
    ['explainer', 'message'].forEach(c => { const en = get(d.fh, 'score.' + c); if (en) { const clave = 'score.' + c, es = en; E.narrativa.push({ clave, punto: '__nota', titulo: c === 'explainer' ? 'How the score is calculated' : 'What the score means', en, es }); } });
    // Resumen corto en español de cada texto del informe (app/estudios/llm/<caso>.corto.json), con control de cifras.
    const corto = fs.existsSync(CORTO(slug)) ? JSON.parse(fs.readFileSync(CORTO(slug), 'utf8')) : {};
    E.narrativa.forEach(n => { const mal = corto[n.clave] ? cortoValido(n.en, corto[n.clave]) : 'falta'; if (mal) { if (corto[n.clave]) g.avisos.push(`Short summary of ${n.clave} dropped: ${mal}.`); } else n.corto = corto[n.clave]; });
    let crudo = null;
    if (!sinLlm) {
      try {
        const r = await escribirConLlm(E, d.persona, d.fh); g.textos = 'llm:' + MODEL; g.llmFecha = g.fecha; g.avisos.push(...r.avisos); g.intentos = r.intentos; crudo = r.crudo;
        fs.mkdirSync(path.join(OUT, 'llm'), { recursive: true });
        fs.writeFileSync(CACHE(slug), JSON.stringify({ modelo: MODEL, fecha: g.fecha, datos: g.datos, respuesta: crudo }, null, 1) + '\n');
      } catch (e) { g.avisos.push(`LLM: ${e.message}. Template phrases kept.`); }
    } else if (!FLAG('--sin-llm') && fs.existsSync(CACHE(slug))) {
      // sin clave, pero con una respuesta del LLM guardada de una ejecución anterior
      const guardado = JSON.parse(fs.readFileSync(CACHE(slug), 'utf8'));
      const r = reaplicar(E, guardado); g.textos = 'llm:' + guardado.modelo; g.llmFecha = guardado.fecha; g.avisos.push(...r.avisos); crudo = r.crudo;
      if (g.datos === 'archivos' && guardado.datos === 'mcp') g.datosLlm = 'mcp';
    }
    cerrar(E); semantica(E); E.generado = g;
    fs.writeFileSync(path.join(OUT, slug + '.json'), JSON.stringify(E, null, 1) + '\n');
    fs.writeFileSync(path.join(DOCS, slug + '.md'), informe(E, g, crudo));
    indice.push({ slug, titulo: E.fam.titulo, apellido: E.fam.apellido, nota: E.nota.hoy, datos: g.datos, textos: g.textos });
    console.log(`  ${slug}: score ${E.nota.hoy}, ${E.preguntas.length} questions (${E.preguntas.map(q => q.id).join(', ')}), data ${g.datos}, phrases ${g.textos}${g.avisos.length ? `, ${g.avisos.length} warnings` : ''}`);
  }
  // el índice conserva los casos que ya estaban y no se han regenerado ahora
  const fi = path.join(OUT, 'index.json');
  const previo = fs.existsSync(fi) ? JSON.parse(fs.readFileSync(fi, 'utf8')) : [];
  const todos = previo.filter(p => !indice.some(i => i.slug === p.slug) && fs.existsSync(path.join(OUT, p.slug + '.json'))).concat(indice).sort((a, b2) => a.slug.localeCompare(b2.slug));
  fs.writeFileSync(fi, JSON.stringify(todos, null, 1) + '\n');
  console.log(`Studies in app/estudios/ and readable copies in docs/estudios/.`);
}
main().catch(e => { console.error(e); process.exit(1); });
