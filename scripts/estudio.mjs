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
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = (n, d = 1) => { let s = (+n).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s.replace('.', ','); };
const M = v => (v == null || isNaN(v)) ? 'sin dato' : Math.abs(v) >= 1e6 ? dec(v / 1e6, 2) + ' M$' : (v < 0 ? '-' : '') + miles(v) + ' $';
const P = (v, d = 0) => dec(v * 100, d) + ' %';
const fecha = iso => MES[+iso.slice(5, 7) - 1] + ' de ' + iso.slice(0, 4);
const anio = iso => +iso.slice(0, 4);
const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
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
    if (!msg) throw new Error(`MCP ${method}: respuesta vacía`);
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
  if (!entera(fh)) throw new Error('el MCP no ha devuelto el plan completo');
  const persona = await mcp.call('get_case', { caseId, part: 'persona' });
  return { fh, persona: typeof persona === 'string' ? persona : (persona && (persona.text || persona.markdown)) || JSON.stringify(persona) };
}

function parteArchivo(slug) {
  const dir = path.join(ROOT, 'cases', slug);
  const fh = JSON.parse(fs.readFileSync(path.join(dir, 'financial-health.json'), 'utf8'));
  const pf = path.join(dir, 'persona.md');
  return { fh, persona: fs.existsSync(pf) ? fs.readFileSync(pf, 'utf8') : '' };
}

// ------------------------------------------------------------------ 2. cifras: lo que dice el plan
const AREAS = {
  'Savings and cash flow': ['Ahorro', 'coins'], Debt: ['Deudas', 'card'], Investments: ['Inversiones', 'chart'],
  'Liquidity and emergency fund': ['Colchón', 'shield'], 'Insurance and protection': ['Seguros', 'heart'],
};
const ESFUERZO = { low: 'bajo', medium: 'medio', high: 'alto' };
const BANDA = { critical: 'crítica', vulnerable: 'vulnerable', stable: 'estable', strong: 'fuerte', excellent: 'excelente' };

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
    'Pay down revolving card': m => ({ key: 'card', icon: 'card', quien: 'familia', titulo: `Pagar ${M(tarjeta ? tarjeta.balance - m.target_amount : null)} de la tarjeta`, porque: tarjeta ? `Es ${t('vuestra', 'tu')} deuda más cara: al ${P(tarjeta.interest_rate)}. Después del pago quedan ${M(m.target_amount)}.` : '' }),
    'Add life cover': m => ({ key: 'life', icon: 'heart', quien: 'asesor', titulo: 'Subir el seguro de vida', porque: `El plan pide añadir ${M(num((m.action.match(/\$([\d,]+)/) || [])[1]))} de seguro de vida.` }),
    'Raise mortality coverage': m => PASO['Add life cover'](m),
    'Add umbrella cover': m => ({ key: 'umbrella', icon: 'shield', quien: 'asesor', titulo: 'Seguro extra de responsabilidad civil', tituloPro: `Seguro umbrella de ${M(m.target_amount)}`, porque: `Es un seguro de responsabilidad civil por encima del de casa y coche. El plan pide ${M(m.target_amount)}; hoy no ${t('tenéis', 'tienes')}.` }),
    'Raise annual savings': m => { const x = (m.action.match(/\$([\d,]+)\/year/) || [])[1]; return { key: 'savings', icon: 'coins', quien: 'familia', titulo: `Ahorrar ${x ? M(num(x)) : 'más'} más al año`, porque: `El plan pide llevar al ahorro ${x ? M(num(x)) + ' al año' : 'una parte'} de lo que hoy ${t('os', 'te')} sobra cada año.` }; },
    'Lower the withdrawal rate': m => { const x = m.action.match(/\$([\d,]+)\/year \(([\d.]+)%\)/); return { key: 'withdraw', icon: 'sun', quien: 'asesor', titulo: `Sacar menos de ${t('los', 'tus')} ahorros al ${t('jubilaros', 'jubilarte')}`, porque: x ? `El plan lo cifra en sacar ${M(num(x[1]))} al año (el ${dec(+x[2], 1)} %) para que los ahorros duren.` : '' }; },
    'Raise growth allocation toward glide': m => { const x = m.action.match(/from (\d+)% to (\d+)%/); return { key: 'growth', icon: 'chart', quien: 'asesor', titulo: `Subir la parte de ${t('vuestras', 'tus')} inversiones que busca crecer`, porque: x ? `El plan propone pasar del ${x[1]} % al ${x[2]} % en inversiones de crecimiento.` : '' }; },
    'Reduce growth allocation toward glide': m => { const x = m.action.match(/from (\d+)% to (\d+)%/); return { key: 'growth', icon: 'chart', quien: 'asesor', titulo: `Bajar un poco el riesgo de ${t('vuestras', 'tus')} inversiones`, porque: x ? `El plan propone pasar del ${x[1]} % al ${x[2]} % en inversiones de crecimiento.` : '' }; },
    'Close a coverage gap': m => ({ key: 'cover', icon: 'home', quien: 'asesor', titulo: /homeowners/i.test(m.action) ? `Asegurar ${t('vuestra', 'tu')} casa` : 'Cerrar un hueco en los seguros', porque: /homeowners/i.test(m.action) ? `Hoy la casa no tiene seguro de hogar en el plan.` : '' }),
    'Reduce single-name concentration': m => { const x = m.action.match(/Bring (\S+) from (\d+)% to (\d+)%/); return { key: 'conc', icon: 'stack', quien: 'asesor', titulo: `Repartir mejor ${t('vuestras', 'tus')} inversiones`, porque: x ? `Hoy el ${x[2]} % está en un solo fondo (${x[1]}). El plan propone bajarlo al ${x[3]} %.` : '' }; },
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
    q: `Del 0 al 100, ¿qué nota de salud financiera ${t('creéis que os', 'crees que te')} pone ${t('vuestro', 'tu')} plan?`,
    sub: 'A ojo. Aquí nadie examina a nadie.',
    plan: String(nota), unidad: 'de 100, hoy', vis: { t: 'ring', hoy: nota, max: notaMax },
    titulares: { cerca: t('Lo teníais claro.', 'Lo tenías claro.'), mas: t('Mejor de lo que pensabais.', 'Mejor de lo que pensabas.'), menos: t('Más baja de lo que pensabais.', 'Más baja de lo que pensabas.') },
    siente: peor && mejor && peor !== mejor ? `Lo que más tira hacia abajo: ${b(peor.nombre)} (${peor.nota} de 100). Lo que mejor ${t('tenéis', 'tienes')}: ${b(mejor.nombre)} (${mejor.nota} de 100).` : '',
    salida: notaMax > nota ? `Con los pasos de ${t('vuestro', 'tu')} plan llega a ${notaMax}.` : `${t('Vuestro', 'Tu')} plan trae los pasos para cuidarla.`,
    hechos: [`Nota de salud financiera hoy: ${nota} de 100`, `Nota máxima con los pasos del plan: ${notaMax}`, ...areas.map(a => `Área ${a.nombre}: ${a.nota} de 100`)],
    filas: areas.map(a => [a.nombre, `${a.nota} de 100`]), origen: 'score.published_score · score.pillars', creian: 'Nota de salud financiera',
  });

  if (tarjeta && cc.ccPaymentEqualToInterestRate > 0) {
    const pago = tarjeta.monthly_payment || cc.ccMonthlyPayment, int = cc.ccPaymentEqualToInterestRate;
    const n = Math.round(int / pago * 10), malo = n >= 5, fin = cc.ccPayoffDate ? fecha(cc.ccPayoffDate) : null;
    const pasoCard = pasos.find(p => p.key === 'card');
    Q.push({
      id: 'tarjeta_interes', tema: 'tarjeta', tono: malo ? 'malo' : 'bueno', tipo: 'importe', icon: 'card', min: 0, max: pago, step: pago > 250 ? 10 : 5, real: Math.round(int), cerca: 0.2,
      q: `${t('Pagáis', 'Pagas')} ${M(pago)} al mes a la tarjeta. ¿Cuánto de eso se va en intereses?`, sub: 'Lo que no baja la deuda.',
      plan: M(int), unidad: `de cada ${M(pago)}, en intereses`, vis: { t: 'coins', n, a: 'intereses', b: 'baja la deuda' },
      titulares: malo
        ? { cerca: t('Lo teníais claro. Mirad a dónde se va.', 'Lo tenías claro. Mira a dónde se va.'), mas: t('Son {dif} más al mes de lo que pensabais.', 'Son {dif} más al mes de lo que pensabas.'), menos: t('Menos de lo que temíais. Aun así, mirad a dónde se va.', 'Menos de lo que temías. Aun así, mira a dónde se va.') }
        : { cerca: 'Eso es. Aquí la deuda sí baja.', mas: t('Algo más de lo que pensabais, pero la deuda baja.', 'Algo más de lo que pensabas, pero la deuda baja.'), menos: t('Menos de lo que temíais.', 'Menos de lo que temías.') },
      siente: malo
        ? `De cada ${b(M(pago))} que ${t('pagáis', 'pagas')}, ${b(M(int))} son intereses. La deuda casi no baja.${fin ? ` Así dura hasta ${b(fin)}.` : ''}`
        : `De cada ${b(M(pago))} que ${t('pagáis', 'pagas')}, ${b(M(int))} son intereses. El resto baja la deuda${fin ? `, que se acaba en ${b(fin)}` : ''}.`,
      salida: pasoCard ? `La salida está en ${t('vuestro', 'tu')} plan: ${pasoCard.titulo.toLowerCase()}.` : malo ? `${t('Vuestro', 'Tu')} plan la señala como ${t('vuestra', 'tu')} deuda más cara. Cómo subir el pago se ve con ${t('vuestro', 'tu')} asesor.` : `${t('Vuestro', 'Tu')} plan dice que ${t('sigáis', 'sigas')} pagándola: va por buen camino.`,
      calc: `${M(int)} de ${M(pago)}, redondeado a décimas`,
      hechos: [`Tarjeta: ${M(tarjeta.balance)} al ${P(tarjeta.interest_rate)}`, `Pago mensual: ${M(pago)}`, `De ese pago, intereses: ${M(int)}`, fin ? `Fecha en que se acaba la tarjeta a este ritmo: ${fin}` : null, pasoCard ? `Paso del plan: ${pasoCard.titulo}` : null].filter(Boolean),
      freno: { kick: 'La tarjeta', h2: `${M(int)} de cada ${M(pago)} se van en intereses.` },
      filas: [['Saldo de la tarjeta', M(tarjeta.balance)], ['Interés', P(tarjeta.interest_rate)], [`${t('Pagáis', 'Pagas')} al mes`, M(pago)], ['De eso, intereses', M(int)]].concat(fin ? [['Fin previsto', fin]] : []),
      pro: `Deuda revolving de ${M(tarjeta.balance)} al ${P(tarjeta.interest_rate)} TAE. De la cuota de ${M(pago)}, ${M(int)} son intereses.${fin ? ` Fin previsto: ${fin}.` : ''}`,
      origen: 'profile.liabilities · key_metrics.debtManagement.creditCardDebt', creian: 'Intereses de la tarjeta al mes',
    });
    if (cc.ccPayoffDate && anio(cc.ccPayoffDate) - hoyAnio >= 4) {
      const y = anio(cc.ccPayoffDate), años = y - hoyAnio, uni = cg.find(g => g.goalType === 'COLLEGE' && anio(g.date) <= y);
      Q.push({
        id: 'tarjeta_fin', tema: 'tarjeta', tono: 'malo', tipo: 'anio', icon: 'cal', min: hoyAnio, max: hoyAnio + 40, real: y, cerca: 2,
        q: `Pagando ${M(pago)} al mes, ¿en qué año ${t('terminaríais', 'terminarías')} de pagar la tarjeta?`, sub: '',
        plan: fin, unidad: `pagando ${M(pago)} al mes`, mid: true,
        vis: ki.length ? { t: 'grow', filas: ki.map(k => ({ n: k.first_name, de: k.age, a: k.age + años })), hasta: String(y), marca: uni ? `${anio(uni.date)}: ${uni.name.replace('College ', '')} empieza la universidad. La tarjeta sigue ahí.` : null } : { t: 'cuenta', n: años, txt: 'años más con la tarjeta' },
        titulares: { cerca: ki.length ? t('Lo teníais claro. Mirad quién habrá crecido.', 'Lo tenías claro. Mira quién habrá crecido.') : t('Lo teníais claro.', 'Lo tenías claro.'), mas: t('{dif} más tarde de lo que pensabais.', '{dif} más tarde de lo que pensabas.'), menos: t('Antes de lo que temíais. Aun así, es mucho tiempo.', 'Antes de lo que temías. Aun así, es mucho tiempo.') },
        siente: ki.length ? `Cuando ${t('acabéis', 'acabes')} de pagarla, ${lista(ki.map(k => `${k.first_name} tendrá ${b((k.age + años) + ' años')}`))}.` : `Quedan ${b(años + ' años')} de tarjeta.`,
        salida: pasoCard ? `La salida está en ${t('vuestro', 'tu')} plan: ${pasoCard.titulo.toLowerCase()}.` : `Cómo acortarlo se ve con ${t('vuestro', 'tu')} asesor.`,
        calc: ki.length ? 'la edad de los hijos en esa fecha' : 'los años que faltan hasta esa fecha',
        hechos: [`Fecha en que se acaba la tarjeta a este ritmo: ${fin}`, `Pago mensual: ${M(pago)}`, `Años hasta esa fecha: ${años}`, ...ki.map(k => `${k.first_name}: ${k.age} años hoy, ${k.age + años} años en ${y}`)],
        filas: [['Pago mensual', M(pago)], ['Intereses al mes', M(int)], ['Fin previsto', fin]], pro: `Con cuota fija de ${M(pago)} al ${P(tarjeta.interest_rate)}, el principal apenas baja hasta el final. Fin previsto: ${fin}.`,
        origen: 'key_metrics.debtManagement.creditCardDebt.ccPayoffDate', creian: 'Año en que se acaba la tarjeta',
      });
    }
  }

  const vidaHoy = (lb.lifeInsuranceAmountClient || 0) + (lb.lifeInsuranceAmountCoClient || 0);
  const vidaMin = (lr.clientMinRecommendedCoverage || 0) + (lr.coClientMinRecommendedCoverage || 0);
  if (vidaMin && vidaHoy < vidaMin && gastos && (ki.length || pl)) {
    const yn = vidaHoy / gastos, ym = vidaMin / gastos, on = Math.round(yn), total = Math.min(20, Math.round(ym)), k0 = ki[0];
    Q.push({
      id: 'vida', tema: 'vida', tono: 'malo', tipo: 'opciones', icon: 'heart', permiso: !!ki.length,
      opciones: ['Menos de un año', 'Entre 1 y 3 años', 'Entre 4 y 9 años', 'Diez años o más'], rangos: [0, 1, 2, 3], real: yn < 1 ? 0 : yn < 3.5 ? 1 : yn < 9.5 ? 2 : 3, cerca: [yn < 1 ? 0 : yn < 3.5 ? 1 : yn < 9.5 ? 2 : 3],
      q: ki.length ? `Si ${t('a uno de los dos le', 'te')} pasara algo, ¿cuántos años de gastos de casa tendrían cubiertos ${lista(ki.map(k => `${k.first_name} (${k.age})`))}?` : `Si a uno de los dos le pasara algo, ¿cuántos años de gastos de casa cubriría el seguro?`, sub: '',
      plan: `unos ${on} años`, unidad: 'de gastos de casa', mid: true,
      vis: { t: 'yrs', on, total, base: k0 ? k0.age : null, leg: k0 ? `edad de ${k0.first_name}` : 'años' },
      titulares: { cerca: t('Habéis estado cerca. Mirad hasta dónde llega.', 'Has estado cerca. Mira hasta dónde llega.'), mas: 'Algo más, pero lejos de lo que hace falta.', menos: t('Mucho menos de lo que pensabais.', 'Mucho menos de lo que pensabas.') },
      siente: k0 ? `Cubriría la casa hasta que ${k0.first_name} tenga unos ${b((k0.age + on) + ' años')}. El plan recomienda llegar hasta sus ${b(String(k0.age + Math.round(ym)))}.` : `Hoy cubre unos ${b(on + ' años')}. El plan recomienda unos ${b(String(Math.round(ym)))}.`,
      salida: `Tiene arreglo y se ve con ${t('vuestro', 'tu')} asesor: él trae los presupuestos.`,
      calc: 'seguro de vida de hoy ÷ gastos de casa al año',
      hechos: [`Seguro de vida hoy: ${M(vidaHoy)}`, `Mínimo que recomienda el plan: ${M(vidaMin)}`, `Gastos de casa al año: ${M(gastos)}`, `Años de gastos cubiertos hoy: unos ${on}`, `Años que cubriría el mínimo recomendado: unos ${Math.round(ym)}`, ...(k0 ? [`${k0.first_name}: ${k0.age} años hoy; con lo de hoy cubierto hasta sus ${k0.age + on}; con el mínimo, hasta sus ${k0.age + Math.round(ym)}`] : [])],
      freno: { kick: ki.length ? `Proteger a ${kidsTxt}` : 'El seguro de vida', h2: `Hoy el seguro cubriría unos ${on} años. Hacen falta unos ${Math.round(ym)}.` },
      filas: ad.flatMap((a, i) => [[`Seguro de ${a.first_name}`, M(i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient)], [`Mínimo para ${a.first_name}`, M(i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage)]]).concat([['Gastos de casa al año', M(gastos)]]),
      pro: `Capital asegurado: ${lista(ad.map((a, i) => `${a.first_name} ${M(i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient)}`))}. Mínimo recomendado: ${lista(ad.map((a, i) => M(i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage)))}.`,
      origen: 'key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses', creian: 'Años cubiertos por el seguro de vida',
    });
  }

  const meses = parseFloat(get(F, 'cash.monthsCovered.value')), res = (get(F, 'cash.emergencyReserve.label') || '').match(/\((\d+)[–-](\d+) months/);
  if (!isNaN(meses) && res) {
    const rmin = +res[1], rmax = +res[2], ok = meses >= rmin, tras = parseFloat(get(F, 'cash.monthsCoveredAfterNearTermGoals.value'));
    const menos = !isNaN(tras) && tras < meses - 1 && tras < rmin;
    const mTxt = dec(meses, 1) + (meses === 1 ? ' mes' : ' meses');
    Q.push({
      id: 'colchon', tema: 'colchon', tono: ok && !menos ? 'bueno' : 'malo', tipo: 'num', icon: 'shield', min: 0, max: 24, step: 1, sufijo: ' meses', real: meses, cerca: 1,
      q: `Si mañana ${t('os quedarais', 'te quedaras')} sin ingresos, ¿cuántos meses de gastos básicos cubre ${t('vuestro', 'tu')} efectivo?`, sub: 'Lo que hay en cuentas, sin tocar inversiones.',
      plan: mTxt, unidad: 'de gastos básicos', mid: true, vis: { t: 'meses', tiene: meses, min: rmin, max: rmax, tras: menos ? tras : null },
      titulares: ok && !menos
        ? { cerca: t('Eso es. Aquí vais bien.', 'Eso es. Aquí vas bien.'), mas: t('Más de lo que pensabais.', 'Más de lo que pensabas.'), menos: t('Algo menos de lo que pensabais, pero dentro de lo recomendado.', 'Algo menos de lo que pensabas, pero dentro de lo recomendado.') }
        : { cerca: t('Lo teníais claro. Mirad lo que recomienda el plan.', 'Lo tenías claro. Mira lo que recomienda el plan.'), mas: t('Algo más de lo que pensabais, pero no llega a lo recomendado.', 'Algo más de lo que pensabas, pero no llega a lo recomendado.'), menos: t('Menos de lo que pensabais.', 'Menos de lo que pensabas.') },
      siente: `El plan recomienda entre ${b(rmin + ' y ' + rmax + ' meses')}. ${t('Tenéis', 'Tienes')} ${b(dec(meses, 1))}.${menos ? ` Y apartando lo que ya ${t('tenéis', 'tienes')} comprometido a corto plazo, quedan ${b(dec(tras, 1))}.` : ''}`,
      salida: ok && !menos ? (pasos.some(p => p.key === 'card') ? `Con parte de ese efectivo es con lo que ${t('vuestro', 'tu')} plan propone pagar la tarjeta.` : 'Este punto ya está. No hay que tocarlo.') : `${t('Vuestro', 'Tu')} plan propone acercar ese colchón a lo recomendado. El cómo se ve con ${t('vuestro', 'tu')} asesor.`,
      hechos: [`Meses de gastos básicos que cubre el efectivo: ${dec(meses, 1)}`, `Reserva recomendada: entre ${rmin} y ${rmax} meses`, `Efectivo accesible: ${M(get(F, 'cash.accessibleCash.value'))}`, menos ? `Meses cubiertos tras apartar los objetivos a corto plazo: ${dec(tras, 1)}` : null].filter(Boolean),
      freno: { kick: 'El colchón', h2: `${t('Vuestro', 'Tu')} efectivo cubre ${mTxt}. El plan recomienda de ${rmin} a ${rmax}.` },
      filas: [['Efectivo accesible', M(get(F, 'cash.accessibleCash.value'))], ['Meses cubiertos', dec(meses, 1)], ['Reserva recomendada', `${M(get(F, 'cash.emergencyReserve.min'))} a ${M(get(F, 'cash.emergencyReserve.max'))}`]],
      pro: `Liquidez accesible: ${M(get(F, 'cash.accessibleCash.value'))}, ${dec(meses, 1)} meses de gastos esenciales. Reserva objetivo: ${M(get(F, 'cash.emergencyReserve.min'))} a ${M(get(F, 'cash.emergencyReserve.max'))}.`,
      origen: 'key_metrics.facts.cash', creian: 'Meses que cubre el efectivo',
    });
  }

  const conc = moves.map(m => m.action.match(/Bring (\S+) from (\d+)% to (\d+)% of investable/)).find(Boolean);
  if (conc) {
    Q.push({
      id: 'concentracion', tema: 'inversion', tono: 'malo', tipo: 'num', icon: 'stack', min: 0, max: 100, step: 1, sufijo: ' %', real: +conc[2], cerca: 5,
      q: `De todo lo que ${t('tenéis', 'tienes')} invertido, ¿qué parte está en un solo fondo?`, sub: 'El más grande de todos.',
      plan: conc[2] + ' %', unidad: `en un solo fondo (${conc[1]})`, vis: { t: 'barra', hoy: +conc[2], meta: +conc[3], l1: 'Hoy', l2: 'Lo que propone el plan' },
      titulares: { cerca: t('Lo teníais claro.', 'Lo tenías claro.'), mas: t('Más de lo que pensabais.', 'Más de lo que pensabas.'), menos: t('Menos de lo que pensabais. Aun así, el plan lo ve alto.', 'Menos de lo que pensabas. Aun así, el plan lo ve alto.') },
      siente: `Si ese fondo cae, se lleva por delante una parte grande de lo ${t('vuestro', 'tuyo')}. El plan propone bajarlo al ${b(conc[3] + ' %')}.`,
      salida: `Qué vender y cuándo se ve con ${t('vuestro', 'tu')} asesor.`,
      hechos: [`Parte de lo invertido en un solo fondo (${conc[1]}): ${conc[2]} %`, `Lo que propone el plan: ${conc[3]} %`],
      freno: { kick: 'Las inversiones', h2: `El ${conc[2]} % de lo invertido está en un solo fondo.` },
      filas: [[`Fondo ${conc[1]}, hoy`, conc[2] + ' %'], ['Propuesta del plan', conc[3] + ' %']], pro: `Concentración en ${conc[1]}: ${conc[2]} % de lo invertible; el plan apunta al ${conc[3]} %.`,
      origen: 'score.top_moves', creian: 'Parte invertida en un solo fondo',
    });
  }

  const R = F.retirement || {}, agota = R.savingsRunOut, queda = R.savingsLeftAtPlanEnd;
  const edadJ = ad.map(a => a.retirement_age), finEdad = fin.age_client ?? fin.age_co_client ?? (ad[0] ? ad[0].age + yearly.length - 1 : null);
  if (agota || queda) {
    const corte = agota ? +(agota.label.match(/age (\d+)/) || [])[1] : null;
    const pasoRet = pasos.find(p => p.key === 'withdraw');
    const cuota = get(R, 'incomeShareOfNeed.value');
    Q.push({
      id: 'jubilacion', tema: 'jubilacion', tono: agota ? 'malo' : 'bueno', tipo: 'opciones', icon: 'sun',
      opciones: ['Sí, con margen', 'Justo justo', 'No llega', 'Ni idea'], rangos: [3, 2, 1, null], real: agota ? 2 : 0, cerca: agota ? [2] : [0, 1],
      q: `¿${t('Os', 'Te')} llega para ${t('jubilaros', 'jubilarte')} a los ${lista(edadJ.map(String))} y vivir de ello?`, sub: '',
      plan: agota ? `hasta los ${corte}` : 'Sí, llega', unidad: agota ? `${t('os', 'te')} duran los ahorros` : `y al final del plan quedan ${M(queda.value)}`, mid: true,
      vis: { t: 'tramo', de: edadJ[0], corte, hasta: finEdad, ok: !agota },
      titulares: agota
        ? { cerca: t('Lo veíais venir. Mirad hasta dónde llega.', 'Lo veías venir. Mira hasta dónde llega.'), mas: t('El plan dice que no llega.', 'El plan dice que no llega.'), menos: t('El plan dice otra cosa.', 'El plan dice otra cosa.') }
        : { cerca: t('Eso es. Llegáis.', 'Eso es. Llegas.'), mas: t('Mejor de lo que pensabais.', 'Mejor de lo que pensabas.'), menos: t('Llegáis, aunque con menos margen del que creíais.', 'Llegas, aunque con menos margen del que creías.') },
      siente: agota
        ? `${t('Os jubiláis', 'Te jubilas')} a los ${lista(edadJ.map(String))} y el plan llega hasta los ${finEdad}. Los ahorros se acaban a los ${b(String(corte))}.`
        : `${t('Os jubiláis', 'Te jubilas')} a los ${lista(edadJ.map(String))} y los ahorros no se acaban: al final del plan quedan ${b(M(queda.value))}.`,
      salida: agota ? (pasoRet ? `${t('Vuestro', 'Tu')} plan trae un paso para esto, y solo con él la nota pasa de ${nota} a ${pasoRet.nota}.` : `Es de lo primero que se ve con ${t('vuestro', 'tu')} asesor: cuánto ahorrar y cuándo ${t('jubilaros', 'jubilarte')}.`) : `Aquí no hay que correr. Lo que frena ${t('vuestro', 'tu')} plan está en otra parte.`,
      calc: null,
      hechos: [`Edad de jubilación: ${lista(edadJ.map(String))}`, `El plan llega hasta los ${finEdad} años`, agota ? `Los ahorros se acaban a los ${corte} años` : `Ahorros que quedan al final del plan: ${M(queda.value)}`, cuota ? `Parte del gasto de jubilación que cubren los ingresos: ${String(cuota).replace('%', ' %')}` : null, pasoRet ? `Paso del plan: ${pasoRet.titulo} (nota ${pasoRet.nota})` : null].filter(Boolean),
      freno: { kick: 'La jubilación', h2: agota ? `Los ahorros se acaban a los ${corte}. El plan llega hasta los ${finEdad}.` : `${t('Llegáis', 'Llegas')}: al final del plan quedan ${M(queda.value)}.` },
      filas: [['Edad de jubilación', lista(edadJ.map(String))], agota ? ['Los ahorros se acaban a los', String(corte)] : ['Queda al final del plan', M(queda.value)]].concat(cuota ? [['Gasto cubierto por ingresos', String(cuota).replace('%', ' %')]] : []),
      pro: `${cuota ? `Ingresos sobre necesidad anual en jubilación: ${String(cuota).replace('%', ' %')}. ` : ''}${agota ? `Agotamiento de activos líquidos a los ${corte}.` : `Remanente al final del plan: ${M(queda.value)} en dólares de hoy.`}`,
      origen: 'key_metrics.facts.retirement', creian: 'Jubilación',
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
      key: 'card', titulo: p0.titulo, h2: `${p0.titulo}. Diez minutos.`, hoy: tarjeta.balance, hoyTxt: M(tarjeta.balance), despues: resto, despuesTxt: M(resto), importeTxt: M(paga), nota: p0.nota,
      urgencia: cc.ccPaymentEqualToInterestRate ? `Cada mes que pasa son ${b(M(cc.ccPaymentEqualToInterestRate))} en intereses.` : '',
      como: [`${t('Entrad', 'Entra')} en la app ${t('de vuestro', 'de tu')} banco.`, `${t('Pagad', 'Paga')} ${M(paga)} a la tarjeta desde ${t('vuestra', 'tu')} cuenta.`, `${t('Comprobad', 'Comprueba')} que el saldo de la tarjeta queda en ${M(resto)}.`],
      semana: { q: `¿Cuál es el saldo de ${t('vuestra', 'tu')} tarjeta ahora?` },
    };
  }

  // ---- línea de hoy a la jubilación (goals.chartGoals + pasos + fechas del plan)
  const linea = [{ c: 'now', icon: 'flag', anio: hoyAnio, cuando: 'Hoy', t: `Nota ${nota}` }];
  pasos.forEach(p => linea.push({ c: 'step', key: p.key, icon: p.icon, anio: hoyAnio, cuando: 'Paso ' + p.n, t: p.titulo, quien: p.quien }));
  const edadEn = y => ki.map(k => `${k.first_name}, ${k.age + (y - hoyAnio)}`).join(' · ');
  for (const g of cg) {
    if (!g.date || anio(g.date) < hoyAnio) continue;
    const y = anio(g.date);
    if (g.subType === 'VEHICLE_PURCHASE') linea.push({ c: 'goal', icon: 'car', anio: y, cuando: String(y), t: 'El coche', s: importe('VEHICLE_PURCHASE') ? M(importe('VEHICLE_PURCHASE')) : '' });
    else if (g.subType === 'REAL_ESTATE_PURCHASE') linea.push({ c: 'goal', icon: 'home', anio: y, cuando: String(y), t: 'La casa', s: importe('REAL_ESTATE_PURCHASE') ? M(importe('REAL_ESTATE_PURCHASE')) : '' });
    else if (g.goalType === 'COLLEGE') linea.push({ c: 'goal', icon: 'cap', anio: y, cuando: String(y), t: `Universidad de ${g.name.replace('College ', '')}`, s: '' });
  }
  if (tarjeta && cc.ccPayoffDate) {
    const y = anio(cc.ccPayoffDate), largo = y - hoyAnio >= 4;
    linea.push({ c: largo ? 'warn' : 'goal', key: largo ? 'card' : null, icon: 'card', anio: y, cuando: String(y), t: largo ? 'Sin cambios, la tarjeta dura hasta aquí' : 'Se acaba la tarjeta', s: largo && ki.length ? edadEn(y) : '' });
  }
  const jub = cg.filter(g => g.goalType === 'RETIREMENT').map(g => anio(g.date));
  if (jub.length) linea.push({ c: 'end', icon: 'sun', anio: Math.max(...jub), cuando: String(Math.max(...jub)), t: 'Jubilación', s: agota ? '' : 'Los ahorros llegan hasta el final' });
  if (agota) {
    const z = cg.find(g => g.goalType === 'BANKRUPTCY_ZEROCASH'), corte = +(agota.label.match(/age (\d+)/) || [])[1];
    const y = z ? anio(z.date) : hoyAnio + (corte - ad[0].age);
    linea.push({ c: 'warn', icon: 'clock', anio: y, cuando: String(y), t: 'Aquí se acaban los ahorros', s: `A los ${corte} años, según ${t('vuestro', 'tu')} plan` });
  }
  const peso = { now: 0, step: 1, goal: 2, warn: 3, end: 4 };
  linea.sort((x, y) => x.anio - y.anio || peso[x.c] - peso[y.c]);

  // ---- preguntas que se quedan para el asesor
  const coche = cg.find(g => g.subType === 'VEHICLE_PURCHASE'), casa = cg.find(g => g.subType === 'REAL_ESTATE_PURCHASE'), unis = cg.filter(g => g.goalType === 'COLLEGE');
  const abiertas = [
    agota ? `¿Qué tendría que cambiar para que los ahorros lleguen hasta el final?` : null,
    casa ? `¿Cabe la casa de ${anio(casa.date)} con todo lo demás?` : null,
    coche ? `¿Qué pasa con la jubilación si ${t('compramos', 'compro')} el coche en ${anio(coche.date)}?` : null,
    unis.length ? `¿Cómo ${t('ahorramos', 'ahorro')} para la universidad de ${lista(unis.map(u => u.name.replace('College ', '')))} sin descuidar lo demás?` : null,
    pl && ad[0].risk_profile !== ad[1].risk_profile ? `${ad[0].first_name} es ${ad[0].risk_profile} y ${ad[1].first_name}, ${ad[1].risk_profile}. ¿Cuánto riesgo queremos juntos?` : null,
    `¿Por dónde ${t('empezamos', 'empiezo')} si no ${t('podemos', 'puedo')} con todo a la vez?`,
  ].filter(Boolean).slice(0, 3).map((q, i) => ({ id: 'oq' + (i + 1), q }));

  // ---- "¿Y si…?": pocas preguntas por categoría, contestadas solo con el plan
  const cat = [];
  const ed = F.education || {};
  if (coche) cat.push({ id: 'coche', label: 'Coche', icon: 'car', items: [
    { q: '¿Cuándo está previsto y por cuánto?', a: `${t('Vuestro', 'Tu')} plan cuenta con un coche de ${b(M(importe('VEHICLE_PURCHASE')))} en ${b(fecha(coche.date))}.`, covered: 'yes' },
    { q: `¿Y si lo ${t('compramos', 'compro')} antes o más caro?`, a: `El plan solo tiene hecha la cuenta con esa fecha y ese importe. Cambiarlos mueve todo lo demás.`, covered: 'no' }] });
  if (casa) cat.push({ id: 'casa', label: 'Casa', icon: 'home', items: [
    { q: '¿Cuándo está prevista y por cuánto?', a: `${t('Vuestro', 'Tu')} plan cuenta con una casa de ${b(M(importe('REAL_ESTATE_PURCHASE')))} en ${b(fecha(casa.date))}.`, covered: 'yes' },
    { q: '¿Cabe con todo lo demás?', a: `Es la pregunta que el plan deja para hablar: depende de qué pasos se hagan antes.`, covered: 'no' }] });
  if (!isNaN(meses) && res) cat.push({ id: 'imprevistos', label: 'Imprevistos', icon: 'shield', items: [
    { q: `¿Cuánto ${t('aguantamos', 'aguanto')} sin ingresos?`, a: `${t('Vuestro', 'Tu')} efectivo cubre ${b(dec(meses, 1) + ' meses')} de gastos básicos. El plan recomienda entre ${res[1]} y ${res[2]}.`, covered: 'yes' },
    { q: `¿Y si ${t('uno de los dos pierde', 'pierdo')} el trabajo?`, a: `El plan no trae ese escenario calculado.`, covered: 'no' }] });
  if (tarjeta) cat.push({ id: 'tarjeta', label: 'Tarjeta', icon: 'card', items: [
    { q: '¿Cuánto cuesta cada mes?', a: `De los ${b(M(tarjeta.monthly_payment))} que ${t('pagáis', 'pagas')} al mes, ${b(M(cc.ccPaymentEqualToInterestRate))} son intereses.${cc.ccPayoffDate ? ` A este ritmo se acaba en ${b(fecha(cc.ccPayoffDate))}.` : ''}`, covered: 'yes' },
    { q: `¿Y si la ${t('pagamos', 'pago')} entera de golpe?`, a: primer ? `El plan propone pagar ${primer.importeTxt}. Pagarla entera no está calculado.` : `El plan no trae esa cuenta hecha.`, covered: 'no' }] });
  if (vidaMin) cat.push({ id: 'seguros', label: 'Seguros', icon: 'heart', items: [
    { q: '¿Cuánto seguro de vida recomienda el plan?', a: `Como mínimo ${b(M(vidaMin))}${pl ? ' entre los dos' : ''}. Hoy ${t('tenéis', 'tienes')} ${b(M(vidaHoy))}.`, covered: 'yes' },
    { q: '¿Cuánto costaría al mes?', a: `El plan no trae precios. Los presupuestos los trae ${t('vuestro', 'tu')} asesor.`, covered: 'no' }] });
  if (unis.length && ed.fundingGap) cat.push({ id: 'hijos', label: 'Hijos', icon: 'cap', items: [
    { q: '¿Cuánto falta para la universidad?', a: `Al plan le faltan ${b(M(ed.fundingGap.value))} para la universidad de ${kidsTxt}, en un solo pago y en dólares de hoy.`, covered: 'yes' },
    { q: '¿De dónde sale ese dinero?', a: `El plan lo deja abierto: compite con los demás objetivos.`, covered: 'no' }] });
  if (agota || queda) cat.push({ id: 'jubilacion', label: 'Jubilación', icon: 'sun', items: [
    { q: `¿${t('Nos', 'Me')} llega?`, a: agota ? `Con el plan de hoy, los ahorros se acaban a los ${b((agota.label.match(/age (\d+)/) || [])[1] + ' años')}.` : `Sí. Al final del plan quedan ${b(M(queda.value))}.`, covered: 'yes' },
    { q: `¿Y si ${t('nos jubilamos', 'me jubilo')} antes?`, a: `El plan solo está calculado con las edades de hoy.`, covered: 'no' }] });
  cat.forEach(c => c.items.forEach((it, i) => { it.id = c.id + '-' + (i + 1); }));
  cat.push({ id: 'otra', label: 'Otra cosa', icon: 'help', items: [] });

  const frases = [ki.length ? `Que a ${kidsTxt} no ${ki.length > 1 ? 'les' : 'le'} falte de nada` : 'No tener que preocuparme por el dinero', 'Dormir sin pensar en el dinero', tarjeta ? 'Dejar de pagar intereses' : 'Que mi dinero trabaje bien', 'Llegar bien a la jubilación'];
  const ganancias = [['moon', t('Dormiríamos más tranquilos', 'Dormiría mejor')], [casa ? 'home' : 'sun', casa ? t('Podríamos pensar en la casa', 'Podría pensar en la casa') : t('Podríamos pensar en lo siguiente', 'Podría pensar en lo siguiente')], pl ? ['chat', 'Dejaríamos de discutir por dinero'] : ['check', 'Dejaría de darle vueltas'], ki.length ? ['heart', `Sabría${pl ? 'mos' : ''} que ${kidsTxt} ${ki.length > 1 ? 'están cubiertos' : 'está cubierto'}`] : ['flag', 'Sabría por dónde empezar']];

  // ---- «Ver el detalle»: las cifras del informe que explican cada pregunta. Rótulos en español
  // escritos por código; valores leídos del plan. Las pocas cuentas propias se marcan con «(cuenta nuestra)».
  const R2 = F.retirement || {}, C2 = F.cash || {}, ef = get(fh, 'key_metrics.protection.emergencyFund.cashAndExpensesOverview') || {};
  const deudas = (get(fh, 'profile.liabilities') || []).filter(l => l.balance > 0);
  const dti = get(fh, 'key_metrics.ratios.debtToIncome') || {}, caps = get(fh, 'score.caps_applied') || [], pil = get(fh, 'score.pillars') || [];
  const val = x => (x && typeof x === 'object' ? x.value : x);
  const TIPO = ty => /CREDIT_CARD/.test(ty) ? 'Otra tarjeta' : /MORTGAGE/.test(ty) ? 'Hipoteca' : /STUDENT/.test(ty) ? 'Préstamo de estudios' : /AUTO/.test(ty) ? 'Préstamo del coche' : /PERSONAL/.test(ty) ? 'Préstamo personal' : 'Otra deuda';
  const CAP = { 'High revolving balance with high APR': 'la deuda de tarjeta, con interés alto', 'Mortality coverage ratio below threshold with dependents': 'poco seguro de vida con hijos a cargo' };
  const DET = {
    nota: () => [
      ...pil.map(x => [(AREAS[x.pillar] || [x.pillar])[0], x.points_shown_in_app ? `${x.points_shown_in_app} puntos` : `${x.score} de 100`]),
      ...caps.filter(c => CAP[c.reason]).map(c => ['Lo que pone techo a la nota', `${CAP[c.reason]}: como mucho ${c.score_capped_at}`]),
      ...(pasos[0] ? [['Primer paso del plan', `${pasos[0].titulo}: la nota pasa a ${pasos[0].nota}`]] : []),
      ['Máximo con todos los pasos', `${notaMax} de 100`]],
    tarjeta: () => {
      if (!tarjeta) return null;
      const pago = tarjeta.monthly_payment || cc.ccMonthlyPayment, int = cc.ccPaymentEqualToInterestRate;
      return [['Saldo de la tarjeta', M(tarjeta.balance)], ['Interés anual', P(tarjeta.interest_rate)], [`${t('Pagáis', 'Pagas')} al mes`, M(pago)],
        int ? ['De eso, intereses al mes', M(int)] : null, int ? ['Intereses en un año (cuenta nuestra)', M(Math.round(int * 12))] : null,
        cc.minCcPaymentNormal && cc.maxCcPaymentNormal ? ['Pago al mes que recomienda el plan', `${M(Math.round(cc.minCcPaymentNormal))} a ${M(Math.round(cc.maxCcPaymentNormal))}`] : null,
        cc.ccPayoffDate ? ['Fin previsto a este ritmo', fecha(cc.ccPayoffDate)] : null,
        ...deudas.filter(l => l !== tarjeta).map(l => [TIPO(l.type), `${M(l.balance)}${l.interest_rate ? ` al ${P(l.interest_rate, 1)}` : ''}`]),
        dti.monthlyDebtPayments ? ['Pagos de deudas al mes, en total', M(dti.monthlyDebtPayments)] : null,
        dti.ratio != null ? ['Parte de los ingresos que va a deudas', P(dti.ratio)] : null].filter(Boolean);
    },
    vida: () => [...ad.flatMap((a, i) => {
      const hoy = i ? lb.lifeInsuranceAmountCoClient : lb.lifeInsuranceAmountClient, mn = i ? lr.coClientMinRecommendedCoverage : lr.clientMinRecommendedCoverage, mx = i ? lr.coClientMaxRecommendedCoverage : lr.clientMaxRecommendedCoverage;
      const ing = get(fh, `key_metrics.protection.lifeInsurance.clientDemographics.${i ? 'coClientIncomeAtRisk' : 'clientIncomeAtRisk'}`);
      return [[`Seguro de ${a.first_name} hoy`, M(hoy || 0)], mn ? [`Recomendado para ${a.first_name}`, mx ? `${M(mn)} a ${M(mx)}` : `desde ${M(mn)}`] : null, mn && hoy < mn ? [`Le falta como mínimo`, M(mn - (hoy || 0))] : null, ing ? [`Ingresos de ${a.first_name} que protege`, `${M(ing)} al año`] : null].filter(Boolean);
    }), gastos ? ['Gastos de casa al año', M(gastos)] : null, ki.length ? ['Dependen de esos ingresos', lista(ki.map(k => `${k.first_name} (${k.age})`))] : null].filter(Boolean),
    colchon: () => [['Efectivo accesible', M(val(C2.accessibleCash))], ef.monthlyExpenses ? ['Gastos básicos al mes', M(ef.monthlyExpenses)] : null, ['Meses que cubre hoy', dec(val(C2.monthsCovered), 1)],
      C2.emergencyReserve ? ['Reserva que recomienda el plan', `${M(C2.emergencyReserve.min)} a ${M(C2.emergencyReserve.max)}`] : null,
      val(C2.monthsCoveredAfterNearTermGoals) != null ? ['Meses tras apartar los gastos ya previstos', dec(val(C2.monthsCoveredAfterNearTermGoals), 1)] : null,
      val(C2.cashAboveTotalNeeded) > 0 ? ['Lo que sobra tras la reserva y esos gastos', M(val(C2.cashAboveTotalNeeded))] : null].filter(Boolean),
    jubilacion: () => [['Edad de jubilación', lista(edadJ.map(String))], val(R2.spendingNeed) ? ['Gasto al año en la jubilación', M(Math.round(val(R2.spendingNeed)))] : null,
      val(R2.guaranteedIncome) ? ['Ingresos garantizados al año (pensiones y rentas)', M(Math.round(val(R2.guaranteedIncome)))] : null,
      val(R2.incomeShareOfNeed) ? ['Parte del gasto que cubren los ingresos', String(val(R2.incomeShareOfNeed)).replace('%', ' %')] : null,
      val(R2.spendingGap) ? ['Lo que sale de los ahorros cada año', M(Math.round(val(R2.spendingGap)))] : null,
      R2.savingsRunOut ? ['Los ahorros se acaban a los', `${(R2.savingsRunOut.label.match(/age (\d+)/) || [])[1]} años`] : val(R2.savingsLeftAtPlanEnd) ? ['Ahorros que quedan al final del plan', M(val(R2.savingsLeftAtPlanEnd))] : null,
      finEdad ? ['El plan llega hasta los', `${finEdad} años`] : null].filter(Boolean),
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
const NUM = /\d+(?:[.  ]\d{3})*(?:,\d+)?/g;
const canon = s => s.replace(/[.  ]/g, '').replace(',', '.');
const numeros = txt => (String(txt).replace(/<[^>]+>/g, ' ').match(NUM) || []).map(canon);
const limpio = s => String(s || '').replace(/[<>]/g, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').trim();

function entradaLlm(E, persona, fh) {
  return {
    familia: { nombre: E.fam.titulo, trato: E.fam.pl ? 'vosotros (son dos adultos)' : 'tú (es un solo adulto)', adultos: E.fam.adultos, hijos: E.fam.hijos },
    persona: persona.slice(0, 7000),
    resumen_del_plan: get(fh, 'narrative.summary_main'),
    recomendaciones_del_plan: get(fh, 'narrative.summary_recommendations'),
    pasos_del_plan: E.pasos.map(p => ({ paso: p.titulo, nota_tras_el_paso: p.nota, lo_hace: p.quien === 'familia' ? 'la familia sola' : 'con el asesor' })),
    preguntas_posibles: E.catalogo.map(q => ({ id: q.id, tema: q.tema, noticia: q.tono === 'malo' ? 'mala' : 'buena', como_se_contesta: q.tipo === 'opciones' ? q.opciones : q.tipo === 'anio' ? 'eligiendo un año' : 'moviendo una barra', pregunta_base: q.q, dato_del_plan: `${q.plan} ${q.unidad}`, hechos: q.hechos })),
    ejemplo_de_tono: { siente: 'De cada **300 $** que pagáis, **270 $** son intereses. La deuda casi no baja.' },
  };
}

const SISTEMA = (reglas) => `Eres quien prepara, para Sherpas, la conversación previa a la reunión con una familia que todavía no es cliente.
La familia va a adivinar un dato de su propio plan y después verá el dato real. Tu trabajo es elegir qué datos preguntar y escribir qué se le dice en cada camino para que SIENTA el dato y quiera hablar con su asesor.

Normas que no se pueden saltar:
- No calculas nada. No sumas, no restas, no comparas cifras. Solo puedes usar cifras que estén en "hechos" de esa misma pregunta, escritas igual.
- No inventas consejos ni productos. Qué paso del plan responde a cada dato lo pone el código, no tú.
- El plan sorprende, no la persona: nunca la hagas sentir tonta ni culpable.
- Nada de urgencia falsa, cuentas atrás ni miedo gratuito.
- Español de España, cercano, frases cortas. Sin tecnicismos ni anglicismos (nada de "revolving", "TAE", "liquidez", "cash"). La moneda es el dólar ($), nunca euros.
- Respeta el trato indicado en "familia.trato" (vosotros o tú) en las preguntas y en "siente". No lo mezcles.
- "ejemplo_de_tono" es solo para oír el tono. Es de otra familia: no copies sus frases ni sus cifras.
- Reglas de Sherpas para citar cifras: ${reglas.join(' ')}

Qué devuelves, en JSON y nada más:
{
 "lectura": "2 o 3 frases en tercera persona, para el asesor: qué le importa a esta familia según su persona y qué dato le va a mover más. Sin cifras.",
 "orden": ["id", ...],        // entre 3 y 5 ids de preguntas_posibles. Empieza por la que más engancha a ESTA familia y acaba, si hay, en una buena noticia.
 "porque_orden": "una frase",
 "frases": ["...", "...", "...", "..."],      // 4 respuestas a "¿qué te importa más?", dichas en primera persona como las diría la familia. 45 caracteres como mucho, sin cifras, sin punto final.
 "ganancias": ["...", "...", "...", "..."],   // 4 respuestas a "si esto estuviera resuelto, ¿qué cambiaría en casa?", en primera persona ("Dormiría..." o "Dormiríamos..."). 45 caracteres como mucho, sin cifras, sin punto final.
 "abiertas": ["...", "...", "..."],           // 3 dudas del estilo "¿y si...?" que tendría esta familia y que solo el asesor puede contestar, en primera persona. Sin cifras nuevas.
 "preguntas": {
   "<id>": {
     "q": "la pregunta. Puedes dejar pregunta_base o acercarla a su vida, pero se tiene que poder contestar como indica como_se_contesta y no puede desvelar el dato",
     "siente": "1 o 2 frases que traduzcan el dato a SU vida: sus hijos por su nombre, su casa, su fecha, lo que diga su persona. Marca en **negrita** la cifra clave. Si la noticia es buena, que suene a buena"
   }
 }
}
"siente" de 200 caracteres como mucho, sin rayas ni paréntesis. Escribe "preguntas" solo para los ids de "orden".`;

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
  if (!m) throw new Error('LLM: respuesta sin JSON');
  return { json: JSON.parse(m[0]), uso: j.usage || null };
}

// 4. control: cada número del texto tiene que venir en lo que se le dio.
const JERGA = /\b(umbrella|cash|revolving|TAE|liquidez|euros?)\b/i;
function controlar(E, salida) {
  const avisos = [], ok = { preguntas: {} };
  const ids = E.catalogo.map(q => q.id);
  const permitidosFam = new Set([...E.fam.adultos.flatMap(a => [a.edad, a.jubila]), ...E.fam.hijos.map(h => h.edad)].map(String));
  const sinNumeros = (campo, v, max) => {
    if (!Array.isArray(v)) return null;
    const l = v.map(x => limpio(x).replace(/\.$/, '')).filter(x => x && x.length <= max && !numeros(x).length);
    if (l.length !== v.length) avisos.push(`${campo}: se han quitado ${v.length - l.length} frases (cifras o demasiado largas)`);
    return l;
  };
  const orden = Array.isArray(salida.orden) ? [...new Set(salida.orden.filter(id => ids.includes(id)))] : [];
  if (orden.length >= 3 && orden.length <= 5) ok.orden = orden; else avisos.push('orden: no válido, se usa el de plantilla');
  const fr = sinNumeros('frases', salida.frases, 60); if (fr && fr.length >= 3) ok.frases = fr.slice(0, 4);
  const ga = sinNumeros('ganancias', salida.ganancias, 60); if (ga && ga.length >= 3) ok.ganancias = ga.slice(0, 4);
  const ab = Array.isArray(salida.abiertas) ? salida.abiertas.map(limpio).filter(x => x && x.length <= 120 && !JERGA.test(x)).map(x => /^¿[^?]*$/.test(x) ? x + '?' : x) : null;
  if (ab && ab.length >= 2) {
    const todo = new Set(E.catalogo.flatMap(q => q.hechos.flatMap(numeros)).concat(E.linea.map(l => String(l.anio)), [...permitidosFam]));
    const buenas = ab.filter(x => numeros(x).every(n => todo.has(n)));
    if (buenas.length !== ab.length) avisos.push(`abiertas: ${ab.length - buenas.length} descartadas por cifras que no están en el plan`);
    if (buenas.length >= 2) ok.abiertas = buenas.slice(0, 3);
  }
  if (typeof salida.lectura === 'string') { const l = limpio(salida.lectura); if (l && !numeros(l).length && l.length <= 500) ok.lectura = l; else avisos.push('lectura: descartada (cifras o demasiado larga)'); }
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
      const trato = E.fam.pl ? /\b(tu|tus|tienes|pagas|crees|pensabas|tenías|creías|temías)\b/i : /\b(vosotros|vuestr[oa]s?|tenéis|pagáis|habéis|mirad|creéis|pensabais|estáis|queréis|podéis|llegáis|jubiláis|teníais|temíais)\b/i;
      if (!v || v.length > max) avisos.push(`${q.id}.${campo}: descartado por longitud`);
      else if (trato.test(v)) avisos.push(`${q.id}.${campo}: descartado, mezcla tú y vosotros`);
      else if (malos.length) avisos.push(`${q.id}.${campo}: descartado, cifra que no está en el plan (${malos.join(', ')})`);
      else if (JERGA.test(v) || /—/.test(v)) avisos.push(`${q.id}.${campo}: descartado por jerga o rayas`);
      else if (/[{}]/.test(v)) avisos.push(`${q.id}.${campo}: descartado por marcas no válidas`);
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
    mensajes.push({ role: 'assistant', content: JSON.stringify(json) }, { role: 'user', content: `Se han descartado estas partes: ${c.avisos.join('; ')}. Devuelve el JSON completo otra vez, corrigiendo solo eso. Recuerda: ninguna cifra que no esté en "hechos".` });
    try { const r2 = await pedirLlm(mensajes); const c2 = controlar(E, r2.json); intentos = 2; if (c2.avisos.length <= c.avisos.length) { c = c2; json = r2.json; uso = r2.uso; } } catch (e) { c.avisos.push('segundo intento fallido: ' + e.message); }
  }
  aplicar(E, c.ok);
  return { avisos: c.avisos, intentos, uso, crudo: json };
}

// ------------------------------------------------------------------ salida
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
  const L = [`# Estudio: ${E.fam.titulo}`, '', `- Caso: \`${E.slug}\``, `- Datos: ${g.datos === 'mcp' ? 'MCP de Sherpas (get_case)' : 'archivos de `cases/` (los mismos JSON que sirve el MCP)'}`, `- Frases: ${g.textos.startsWith('llm') ? 'escritas por el LLM de Sherpas (`' + g.textos.slice(4) + '`' + (g.llmFecha ? ', el ' + g.llmFecha : '') + '), con control de cifras' : 'plantilla, sin LLM'}`, `- Generado: ${g.fecha}`, ''];
  if (g.avisos.length) { L.push('## Avisos', '', ...g.avisos.map(a => '- ' + a), ''); }
  if (E.lectura) L.push('## Lo que lee el LLM de esta familia', '', E.lectura, '');
  if (E.porqueOrden) L.push(`Por qué este orden: ${E.porqueOrden}`, '');
  L.push(`## Nota`, '', `Hoy ${E.nota.hoy} de 100. Con los pasos del plan, ${E.nota.max}.`, '', '| Área | Nota |', '|---|---|', ...E.areas.map(a => `| ${a.nombre} | ${a.nota} |`), '');
  L.push('## Preguntas, en orden', '');
  E.preguntas.forEach((q, i) => {
    L.push(`### ${i + 1}. ${q.q}`, '', `- Dato del plan: **${q.plan}** ${q.unidad} (${q.tono === 'malo' ? 'mala noticia' : 'buena noticia'})`, `- Origen: \`${q.origen}\`${q.calc ? `. Cuenta nuestra: ${q.calc}` : ''}`,
      `- Si acierta: «${q.titulares.cerca}»`, `- Si el dato es mayor de lo que dijo: «${q.titulares.mas}»`, `- Si es menor: «${q.titulares.menos}»`, `- Para que lo sienta: ${sinB(q.siente)}`, `- Salida: ${q.salida}`,
      `- Escrito por el LLM: ${q.escritas && q.escritas.length ? q.escritas.join(', ') : 'nada (plantilla)'}`, '');
  });
  if (E.sinUsar.length) L.push('Preguntas posibles que no se usan en este caso: ' + E.sinUsar.map(s => `${s.creian} (${s.plan})`).join('; ') + '.', '');
  L.push('## Pasos del plan', '', '| Paso | Quién | Nota tras el paso (solo) |', '|---|---|---|', ...E.pasos.map(p => `| ${p.titulo} | ${p.quien === 'familia' ? 'La familia' : 'Con el asesor'} | ${p.nota} |`), '');
  const combos = Object.entries(E.combos);
  L.push(combos.length ? 'Combinaciones que trae el plan: ' + combos.map(([k, v]) => `${k.split('|').map(x => (E.pasos.find(p => p.key === x) || {}).titulo).join(' + ')} = ${v}`).join('; ') + '.' : 'El plan no trae la nota de varios pasos juntos; la app no la inventa.', '');
  L.push('## De hoy a la jubilación', '', ...E.linea.map(l => `- ${l.cuando}: ${l.t}${l.s ? ` (${l.s})` : ''}`), '');
  L.push('## Para el asesor', '', ...E.abiertas.map(a => '- ' + a.q), '');
  if (crudo) L.push('## Respuesta completa del LLM', '', '```json', JSON.stringify(crudo, null, 2), '```', '');
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
      console.log(`MCP de Sherpas conectado. Casos: ${slugs.join(', ')}`);
    } catch (e) { console.log(`No se ha podido usar el MCP (${e.message}). Se leen los archivos de cases/.${(process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY ? ' Este equipo sale por un proxy: prueba con NODE_USE_ENV_PROXY=1 (Node 22.21 o más).' : ''}`); mcp = null; }
  } else console.log(FLAG('--sin-mcp') ? 'MCP desactivado (--sin-mcp).' : 'Sin MCP_TOKEN: se leen los archivos de cases/.');
  if (!slugs.length) slugs = fs.readdirSync(path.join(ROOT, 'cases')).filter(d => fs.existsSync(path.join(ROOT, 'cases', d, 'financial-health.json')));
  console.log(sinLlm ? (FLAG('--sin-llm') ? 'LLM desactivado (--sin-llm): frases de plantilla.' : 'Sin llamar al LLM: se reutiliza lo que dejó escrito en app/estudios/llm/ (si no hay, plantilla).') : `LLM de Sherpas: ${MODEL}`);

  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(DOCS, { recursive: true });
  const indice = [];
  for (const slug of slugs) {
    const g = { fecha: new Date().toISOString().slice(0, 10), datos: 'archivos', textos: 'plantilla', avisos: [] };
    let d = null;
    if (mcp) { try { d = await parteMcp(mcp, slug); g.datos = 'mcp'; } catch (e) { g.avisos.push(`MCP: ${e.message}. Se han usado los archivos.`); } }
    if (!d) d = parteArchivo(slug);
    if (g.datos === 'mcp' && fs.existsSync(path.join(ROOT, 'cases', slug, 'financial-health.json'))) {
      const local = parteArchivo(slug).fh;
      if (get(local, 'score.published_score') !== get(d.fh, 'score.published_score')) g.avisos.push('La nota del MCP no coincide con la del archivo local.');
    }
    const E = leer(d.fh);
    let crudo = null;
    if (!sinLlm) {
      try {
        const r = await escribirConLlm(E, d.persona, d.fh); g.textos = 'llm:' + MODEL; g.llmFecha = g.fecha; g.avisos.push(...r.avisos); g.intentos = r.intentos; crudo = r.crudo;
        fs.mkdirSync(path.join(OUT, 'llm'), { recursive: true });
        fs.writeFileSync(CACHE(slug), JSON.stringify({ modelo: MODEL, fecha: g.fecha, datos: g.datos, respuesta: crudo }, null, 1) + '\n');
      } catch (e) { g.avisos.push(`LLM: ${e.message}. Se han dejado las frases de plantilla.`); }
    } else if (!FLAG('--sin-llm') && fs.existsSync(CACHE(slug))) {
      // sin clave, pero con una respuesta del LLM guardada de una ejecución anterior
      const guardado = JSON.parse(fs.readFileSync(CACHE(slug), 'utf8'));
      const r = reaplicar(E, guardado); g.textos = 'llm:' + guardado.modelo; g.llmFecha = guardado.fecha; g.avisos.push(...r.avisos); crudo = r.crudo;
      if (g.datos === 'archivos' && guardado.datos === 'mcp') g.datosLlm = 'mcp';
    }
    cerrar(E); E.generado = g;
    fs.writeFileSync(path.join(OUT, slug + '.json'), JSON.stringify(E, null, 1) + '\n');
    fs.writeFileSync(path.join(DOCS, slug + '.md'), informe(E, g, crudo));
    indice.push({ slug, titulo: E.fam.titulo, apellido: E.fam.apellido, nota: E.nota.hoy, datos: g.datos, textos: g.textos });
    console.log(`  ${slug}: nota ${E.nota.hoy}, ${E.preguntas.length} preguntas (${E.preguntas.map(q => q.id).join(', ')}), datos ${g.datos}, frases ${g.textos}${g.avisos.length ? `, ${g.avisos.length} avisos` : ''}`);
  }
  // el índice conserva los casos que ya estaban y no se han regenerado ahora
  const fi = path.join(OUT, 'index.json');
  const previo = fs.existsSync(fi) ? JSON.parse(fs.readFileSync(fi, 'utf8')) : [];
  const todos = previo.filter(p => !indice.some(i => i.slug === p.slug) && fs.existsSync(path.join(OUT, p.slug + '.json'))).concat(indice).sort((a, b2) => a.slug.localeCompare(b2.slug));
  fs.writeFileSync(fi, JSON.stringify(todos, null, 1) + '\n');
  console.log(`Estudios en app/estudios/ y lectura en docs/estudios/.`);
}
main().catch(e => { console.error(e); process.exit(1); });
