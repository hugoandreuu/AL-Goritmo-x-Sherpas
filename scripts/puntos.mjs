/*
 * Puntos del informe más allá de las cinco áreas de la nota, y capas de detalle para todo.
 *
 * Mapa informe (PDF) → app:
 *   Summary (FH)                         → portada y página de la nota (__nota)
 *   Retirement & Goals                   → punto «Jubilación y metas» (+ roadmap de hitos al final)
 *   Savings & Expenses (diagrama)        → punto «A dónde va cada dólar»
 *   Education (Summary, IA)              → punto «Universidad»
 *   Retirement accounts · HSA accounts   → punto «Impuestos y cuentas»
 *   Investment Analysis (todo)           → punto «Cartera»
 *   Disclosures & assumptions            → punto «Supuestos del cálculo» (siempre el último)
 *   Assets, Debt, Savings, Insurance     → capas extra de las cinco áreas (Inversiones, Deudas, Ahorro, Colchón, Seguros)
 *
 * Todas las cifras salen de financial-health / investment-analysis (lo mismo que sirve el MCP).
 * Los textos del informe (narrative) van en su propia capa: en español si hay traducción
 * guardada en app/estudios/llm/<caso>.informe.json (con control de cifras) y, si no, el original.
 */
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = (n, d = 1) => { let s = (+n).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s.replace('.', ','); };
const isNum = v => typeof v === 'number' && !isNaN(v);
const M = v => !isNum(v) ? 'sin dato' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + dec(Math.abs(v) / 1e6, 2) + ' M$' : (v < 0 ? '-' : '') + miles(v) + ' $';
const Mk = v => !isNum(v) ? 'sin dato' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + dec(Math.abs(v) / 1e6, Math.abs(v) >= 1e7 ? 1 : 2) + ' M$' : Math.abs(v) >= 1e4 ? (v < 0 ? '-' : '') + miles(Math.round(Math.abs(v) / 1e3)) + ' K$' : M(v);
const P = (v, d = 0) => isNum(v) ? dec(v * 100, d) + ' %' : 'sin dato';
const PP = (v, d = 1) => isNum(v) ? (v > 0 ? '+' : '') + dec(v * 100, d) + ' %' : 'sin dato';
const fecha = iso => iso ? MES[+String(iso).slice(5, 7) - 1] + ' de ' + String(iso).slice(0, 4) : '';
const anio = iso => +String(iso).slice(0, 4);
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? null : x[k]), o) ?? null;
const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
const b = s => `<b>${s}</b>`;
const NA = v => v == null || v === 'Not applicable' || v === 'N/A' || v === '';

// ---- diccionarios (todas las etiquetas que aparecen en los cuatro casos)
const FLUJO = {
  Taxes: 'Impuestos', 'Federal Income Tax': 'Impuesto federal', 'State Income Tax': 'Impuesto estatal', 'FICA tax': 'Seguridad Social y Medicare (FICA)',
  Expenses: 'Gastos', 'Living Expenses': 'Gastos del día a día', 'Insurance payments': 'Seguros',
  Savings: 'Ahorro', '401k - Traditional savings': '401(k)', 'Brokerage account savings': 'Cuenta de bróker', 'Cash savings': 'Efectivo', 'HSA savings': 'Cuenta de salud (HSA)',
  '529 - College Savings Plan savings': 'Cuenta 529 (universidad)', 'Custodial UGMA savings': 'Cuenta a nombre de los hijos (UGMA)',
  'Housing Expenses': 'Vivienda', Mortgage: 'Hipoteca', 'Property Taxes': 'Impuesto de la vivienda', 'Home Insurance': 'Seguro de hogar', Rent: 'Alquiler', 'Renter insurance': 'Seguro del alquiler',
  'Debt Payments': 'Deudas', 'Car loan payments': 'Préstamo del coche', 'Credit card payments': 'Tarjeta', 'Student loan payments': 'Préstamo de estudios',
  'Earned income': 'Ingresos del trabajo', 'Salary and wages': 'Sueldos',
};
const CASCADA = {
  'Build minimum emergency threshold (3 months)': 'Reserva mínima para imprevistos (3 meses)', 'Address essential insurance gaps': 'Cubrir los seguros básicos',
  'Set aside cash for near-term goals': 'Apartar el efectivo de los gastos ya previstos', 'Maximize employer match — primary plan': 'Cobrar toda la aportación de la empresa (plan principal)',
  'Maximize employer match — secondary plan': 'Cobrar toda la aportación de la empresa (segundo plan)', 'Maximize HSA match': 'Cobrar la aportación a la cuenta de salud (HSA)',
  'Maximize ESPP (Employee Stock Purchase Plan)': 'Plan de compra de acciones de la empresa (ESPP)', 'Pay high-interest debt (>7%)': 'Pagar la deuda cara (más del 7 %)',
  'Build toward maximum emergency threshold (6 months)': 'Completar la reserva (6 meses)', 'Contribute to Roth IRA': 'Aportar a la Roth IRA', 'Maximize HSA': 'Llenar la cuenta de salud (HSA)',
  'Contribute to 529 accounts': 'Aportar a las cuentas 529 (universidad)', 'Maximize 401k / employer plans': 'Llenar el 401(k)', 'Invest in taxable brokerage': 'Invertir en la cuenta de bróker',
  'Pay low-interest debt (personal, auto)': 'Pagar la deuda barata (personal, coche)', 'Make extra mortgage payments': 'Adelantar pagos de la hipoteca',
};
const ESTADO_CASCADA = { Filled: 'Cubierto', 'Partially filled': 'A medias', Empty: 'Sin empezar', 'N/A': 'No aplica' };
const BUCKET = { 'Roth IRA': 'Roth IRA', HSA: 'Cuenta de salud (HSA)', '529 accounts': 'Cuentas 529 (universidad)', '401k': '401(k)' };
const CUENTA = { '401k - Roth': '401(k) Roth', '401k - Traditional': '401(k) tradicional', '529 - College Savings Plan': 'Cuenta 529 (universidad)', 'Brokerage account': 'Cuenta de bróker', 'Checking account': 'Cuenta corriente', 'Custodial UGMA': 'Cuenta UGMA (hijos)', HSA: 'Cuenta de salud (HSA)', 'Savings account': 'Cuenta de ahorro' };
const FISCAL = { TAXABLE: 'Tributa cada año', TAX_DEFERRED: 'Tributa al sacar el dinero', TAX_FREE: 'Libre de impuestos' };
const CATEG = {
  'Corporate Bond': 'Bonos de empresa', 'Diversified Emerging Markets': 'Bolsa de países emergentes', 'Foreign Large Blend': 'Bolsa internacional (grandes empresas)', 'Foreign Large Growth': 'Bolsa internacional de crecimiento',
  'High Yield Bond': 'Bonos de alto rendimiento', 'Inflation-Protected Bond': 'Bonos ligados a la inflación', 'Large Blend': 'Bolsa de EE. UU. (grandes empresas)', 'Large Growth': 'Bolsa de EE. UU. de crecimiento',
  'Large Value': 'Bolsa de EE. UU. de valor', 'Moderate Allocation': 'Fondo mixto equilibrado', 'Money Market-Taxable': 'Monetario (efectivo)', 'Trading--Leveraged Equity': 'Bolsa apalancada',
};
const SECTOR = { 'Basic Materials': 'Materias primas', 'Communication Services': 'Comunicaciones', 'Consumer Cyclical': 'Consumo cíclico', 'Consumer Defensive': 'Consumo básico', Energy: 'Energía', 'Financial Services': 'Finanzas', Healthcare: 'Salud', Industrials: 'Industria', 'Real Estate': 'Inmobiliario', Technology: 'Tecnología', Utilities: 'Servicios públicos' };
const REGION = { Africa: 'África', 'Asia - Developed': 'Asia desarrollada', 'Asia - Emerging': 'Asia emergente', Australasia: 'Australia y Nueva Zelanda', Canada: 'Canadá', 'Europe - Emerging': 'Europa emergente', 'Europe - ex Euro': 'Europa sin euro', Eurozone: 'Zona euro', Japan: 'Japón', 'Latin America': 'Latinoamérica', 'Middle East': 'Oriente Medio', 'United Kingdom': 'Reino Unido', 'United States': 'EE. UU.' };
const EVENTO = {
  '90-day tariff pause rally': 'Subida por la pausa de aranceles de 90 días (abril 2025)', 'DeepSeek AI shock': 'Sacudida por DeepSeek (IA, enero 2025)', 'Fed final hike to 5.25–5.50%': 'Última subida de tipos de la Fed, al 5,25–5,50 % (julio 2023)',
  'Fed first rate cut — 50bp': 'Primera bajada de tipos de la Fed, 0,5 puntos (septiembre 2024)', 'Fed pivot — December 2023 dot plot': 'Giro de la Fed (diciembre 2023)', 'Global selloff — VIX spikes above 60': 'Caída mundial con el VIX por encima de 60 (agosto 2024)',
  'Liberation Day tariffs announced': 'Anuncio de aranceles del «Liberation Day» (abril 2025)', 'Operation Epic Fury — US-Israel strikes on Iran': 'Ataques de EE. UU. e Israel a Irán (Operation Epic Fury)',
  'Supreme Court strikes down Liberation Day tariffs': 'El Supremo anula los aranceles del «Liberation Day»', 'Trump election win': 'Victoria electoral de Trump (noviembre 2024)', 'US-China Geneva tariff truce': 'Tregua arancelaria EE. UU.-China en Ginebra (mayo 2025)',
};
const ENTORNO = { 'Post-GFC Bull Run': 'Subida tras 2008 (2009-11)', 'Global Financial Crisis': 'Crisis de 2008 (2007-09)', 'Global Equity Sell-off': 'Caída de 2018', 'COVID-19 Pandemic Crash': 'Caída del COVID (2020)',
  'Fed Pivot Rally - Q4 2023': 'Subida por el giro de la Fed (final de 2023)', 'Geopolitical Shock - Operation Epic Fury / Hormuz Closure': 'Choque geopolítico (Irán y el estrecho de Ormuz)', 'Regional Banking Crisis (SVB / Credit Suisse)': 'Crisis de bancos regionales (SVB, Credit Suisse)', 'Tariff Shock - Liberation Day': 'Choque de aranceles del «Liberation Day»' };
const CLASE = { 'U.S. Equity': 'Bolsa EE. UU.', 'Non-U.S. Equity': 'Bolsa internacional', 'U.S. Fixed Income': 'Renta fija EE. UU.', 'Non-U.S. Fixed Income': 'Renta fija internacional', Cash: 'Efectivo', Other: 'Otros' };
const PERFIL = { Income: 'muy prudente', Conservative: 'prudente', Moderate: 'equilibrado', Growth: 'dinámico', Aggressive: 'atrevido', Dynamic: 'atrevido' };
const SEGURO = { HOMEOWNERS_INSURANCE: 'Hogar', LONG_TERM_DI: 'Incapacidad (largo plazo)', TERM_LIFE: 'Vida (temporal)', UMBRELLA_INSURANCE: 'Responsabilidad civil (umbrella)', VEHICLE_INSURANCE: 'Coche', WHOLE_LIFE: 'Vida (entera)' };
const INGRESO = { ANNUITY_INCOME: 'Renta vitalicia (anualidad)', SALARY_AND_WAGES: 'Sueldo', SOCIAL_SECURITY: 'Pensión pública (Social Security)', SOCIAL_SECURITY_SURVIVOR_BENEFIT: 'Pensión de viudedad' };
const COMPONENTE = { Subtotal: 'Subtotal', '-': '—', '[missing historical load]': 'Sin histórico de repartos', 'Qualified dividend': 'Dividendo cualificado', 'Non-qualified dividend': 'Dividendo no cualificado', Interest: 'Intereses', 'Capital gain distribution': 'Reparto de plusvalías', 'Short-term capital gain': 'Plusvalía a corto plazo', 'Long-term capital gain': 'Plusvalía a largo plazo', 'Return of capital': 'Devolución de capital' };
const META = { VACATION: 'Vacaciones', COLLEGE: 'Universidad', RETIREMENT: 'Jubilación', REAL_ESTATE_PURCHASE: 'Comprar casa', VEHICLE_PURCHASE: 'Comprar coche' };

// Texto fijo de «Disclosures & assumptions» del informe (igual en los tres PDF; no está en los JSON).
const METODO = {
  inflacion: [['General', '3 %'], ['Salud', '5 %'], ['Educación', '5 %']],
  perfiles: [['1 · Preservar capital', '5,86 %'], ['2 · Prudente', '6,67 %'], ['3 · Equilibrado', '7,30 %'], ['4 · Dinámico', '7,76 %'], ['5 · Atrevido', '8,18 %']],
  clases: [['Bolsa EE. UU.', '7,70 %'], ['Bolsa internacional', '7,63 %'], ['Renta fija EE. UU.', '5,48 %'], ['Renta fija internacional', '5,57 %'], ['Efectivo', '3,20 %'], ['Otros / alternativos', '9,17 %']],
  textos: [
    'Las proyecciones usan un único escenario fijo (no simulaciones): ingresos, gastos, impuestos y patrimonio mes a mes. No dan probabilidades ni márgenes.',
    'Impuestos: tramos federales y estatales, FICA, Medicare y ganancias de capital. No incluye el impuesto mínimo alternativo (AMT).',
    'Pensión pública (Social Security): estimada con la fórmula oficial (PIA). No se modelan WEP ni GPO.',
    'La rentabilidad esperada viene de las previsiones a largo plazo de J.P. Morgan por clase de activo; la firma puede ajustarlas.',
    'Rentabilidad y volatilidad de la cartera actual y de la propuesta: simulación de 3 años con los pesos de hoy aplicados a precios históricos (no son resultados reales), sin comisiones de asesoramiento.',
    'Datos de mercado: Morningstar (ETF y fondos) y Bavest (acciones y cripto).',
    'Invertir conlleva riesgo, incluida la pérdida del capital. Rentabilidades pasadas no garantizan las futuras. El informe apoya la conversación con el asesor y no es una recomendación de compra o venta.',
  ],
};

// Partes de cada texto del informe que van en cada punto (clave → [punto, título]).
export const NARRATIVA = {
  'fh.summary_main': ['__nota', 'Resumen del informe'], 'fh.summary_recommendations': ['__nota', 'Recomendaciones del informe'],
  'ia.summary_main': ['__nota', 'Resumen del análisis de inversiones'],
  'fh.retirement_short_observations': ['jubilacion', 'Lo que dice el informe'], 'fh.retirement_what_to_look_into': ['jubilacion', 'Para revisar'],
  'fh.assets_short_observations': ['Inversiones', 'Lo que dice el informe'], 'fh.assets_what_to_look_into': ['Inversiones', 'Para revisar'],
  'fh.debt_short_observations': ['Deudas', 'Lo que dice el informe'], 'fh.debt_what_to_look_into': ['Deudas', 'Para revisar'],
  'fh.savings_short_observations': ['Ahorro', 'Lo que dice el informe'], 'fh.savings_what_to_look_into': ['Ahorro', 'Para revisar'],
  'fh.protection_emergency_fund_short_observations': ['Colchón', 'Lo que dice el informe'],
  'fh.protection_intro': ['Seguros', 'Lo que dice el informe'], 'fh.protection_life_insurance_short_observations': ['Seguros', 'Seguro de vida'], 'fh.protection_umbrella_short_observations': ['Seguros', 'Responsabilidad civil'],
  'ia.snapshot_main': ['cartera', 'Foto de las cuentas'], 'ia.portfolio_today_intro': ['cartera', 'La tensión principal'],
  'ia.portfolio_today_what_it_needs_to_do': ['cartera', 'Lo que debería hacer la cartera'], 'ia.portfolio_today_what_its_actually_doing': ['cartera', 'Lo que hace de verdad'],
  'ia.portfolio_today_performance_timeline': ['cartera', 'Cómo se ha portado'], 'ia.portfolio_today_whats_working': ['cartera', 'Lo que funciona'],
  'ia.portfolio_today_priorities': ['cartera', 'Lo que hay que cambiar'], 'ia.recommendations_main': ['cartera', 'Lo que recomienda el análisis'],
  'ia.recommendations_scenarios': ['cartera', 'Cómo se comporta en mercados reales'],
  'ia.portfolio_today_verdict': ['impuestos', 'Cuentas de jubilación'], 'ia.portfolio_today_also_meaningful': ['impuestos', 'Cuenta de salud (HSA)'],
};

export function leerPuntos(E, fh, ia) {
  const t = (p, s) => (E.fam.pl ? p : s);
  const km = get(fh, 'key_metrics') || {}, R = km.ratios || {}, iak = get(ia, 'key_metrics') || {};
  const rg = km.retirementAndOtherGoals || {}, hh = get(fh, 'case.household') || [];
  const ad = hh.filter(p => p.role !== 'child'), ki = hh.filter(p => p.role === 'child');
  const nom = who => who === 'client' ? (ad[0] || {}).first_name : who === 'coClient' ? (ad[1] || {}).first_name : 'Conjunto';
  const fila = (lab, val) => NA(val) ? null : [lab, String(val)];
  const filas = a => a.filter(Boolean);
  const tabla = (titulo, cab, rows, nota) => rows.length ? { t: 'tabla', titulo, cab, filas: rows, nota } : null;
  const capaFilas = (titulo, rows, nota) => (rows = filas(rows)).length ? { t: 'filas', titulo, filas: rows, nota } : null;
  const k = (lab, val, sub, tono) => NA(val) ? null : { lab, val, sub: sub || '', tono: tono || '' };
  const puntos = [], extra = {};
  const add = (area, capa) => { if (!capa) return; (extra[area] = extra[area] || { capas: [] }).capas.push(capa); };

  // ---------------------------------------------------------------- Jubilación y metas
  const inv = rg.incomeVsIncomeNeeds || {}, need = rg.incomeNeedsAndWithdrawals || {}, dep = rg.assetDepletion || {}, nwr = rg.netWorthAtRetirement || {};
  const wd = rg.withdrawals || {}, og = rg.otherGoalsAndLegacy || {}, rs = R.retirementSavings || {};
  const gi = (rg.guaranteedIncome || []).slice(1), oi = (rg.otherIncome || []).slice(1);
  const cover = inv.allIncomesVsIncomeNeededExLtcCosts, agota = !NA(dep.ageWhenTheyRunOutOfLiquidAssets) ? dep.ageWhenTheyRunOutOfLiquidAssets : null;
  const gap = get(iak, 'capacity.retirementGap');
  const yearly = get(fh, 'projections.yearly') || [], cg = get(fh, 'goals.chartGoals') || [], gsum = get(fh, 'goals.goalsSummary') || [];
  const jubA = cg.filter(g => g.goalType === 'RETIREMENT').map(g => anio(g.date)), jA = jubA.length ? Math.max(...jubA) : null;
  const ret = ad.map(a => a.retirement_age);
  const estJ = agota ? 'low' : gap > 0 ? 'mid' : 'hi';
  const GI = { 'Social security': 'Pensión pública (Social Security)', 'Annuity income': 'Rentas (anualidades)', 'Pension / defined benefit': 'Pensión de empresa', 'Total guaranteed income': 'Total garantizado', 'Earned income': 'Trabajo', 'Total other income': 'Total otros ingresos' };
  puntos.push({
    id: 'jubilacion', nombre: 'Jubilación y metas', icon: 'sun', sub: 'Si el dinero llega y qué metas hay por el camino',
    cifra: isNum(cover) ? P(cover) : '—', cifraLab: 'del gasto de la jubilación cubierto', estado: estJ,
    titular: agota ? `Los ahorros líquidos se acaban a los ${agota} años.` : gap > 0 ? `Falta dinero para la jubilación: ${M(Math.round(gap))}.` : `${t('Vuestra', 'Tu')} jubilación está cubierta en el plan.`,
    conexiones: ['Ahorro', 'Inversiones', 'universidad'],
    kpis: filas([k('Jubilación', jA ? String(jA) : null, ret.length ? `a los ${lista(ret.map(String))}` : ''),
      k('Gasto cubierto', isNum(cover) ? P(cover) : null, 'sin cuidados de larga duración', estJ === 'hi' ? 'bueno' : 'coste'),
      agota ? k('Ahorros líquidos', `a los ${agota}`, 'se acaban', 'coste') : k('Al final del plan', Mk(dep.liquidAssetsAtEndOfPlan), 'en ahorros líquidos', 'bueno'),
      k(`Patrimonio al ${t('jubilaros', 'jubilarte')}`, Mk(nwr.netWorthAtRetirementAge), 'sin descontar la inflación')]),
    graf: gi.length && isNum(need.annualTotalIncomeNeededExLtcCosts) ? { tipo: 'barras', titulo: 'Gasto al año en la jubilación y de dónde sale', items: [
      { lab: 'Gasto que se necesita', v: need.annualTotalIncomeNeededExLtcCosts, txt: M(Math.round(need.annualTotalIncomeNeededExLtcCosts)) },
      ...gi.filter(r => r[2] > 0 && !/^Total/.test(r[0])).map(r => ({ lab: GI[r[0]] || r[0], v: r[2], txt: M(Math.round(r[2])), tono: 'bueno' })),
      ...oi.filter(r => r[2] > 0 && !/^Total/.test(r[0])).map(r => ({ lab: 'Otros: ' + (GI[r[0]] || r[0]).toLowerCase(), v: r[2], txt: M(Math.round(r[2])), tono: 'bueno' })),
      isNum(wd.supplementalAnnualWithdrawals) && wd.supplementalAnnualWithdrawals > 0 ? { lab: 'De los ahorros', v: wd.supplementalAnnualWithdrawals, txt: M(Math.round(wd.supplementalAnnualWithdrawals)), tono: 'coste' } : null].filter(Boolean),
      leyenda: { bueno: 'Ingresos garantizados', coste: 'Sale de los ahorros' } } : null,
    lectura: filas([
      isNum(need.annualTotalIncomeNeededExLtcCosts) ? `En la jubilación ${t('necesitaréis', 'necesitarás')} unos ${b(M(Math.round(need.annualTotalIncomeNeededExLtcCosts)))} al año de media. Los ingresos cubren el ${b(P(cover))}${isNum(inv.allIncomesVsIncomeNeeded) ? ` (el ${P(inv.allIncomesVsIncomeNeeded)} si se suman cuidados de larga duración)` : ''}.` : null,
      isNum(inv.guaranteedIncomeVsIncomeNeededExLtcCosts) ? `Casi todo viene de ingresos garantizados (pensión pública y rentas): el ${b(P(inv.guaranteedIncomeVsIncomeNeededExLtcCosts, 1))}. Otros ingresos aportan el ${P(inv.otherIncomeVsIncomeNeededExLtcCosts, 1)}.` : null,
      isNum(wd.supplementalAnnualWithdrawals) ? `De los ahorros saldrían unos ${b(M(Math.round(wd.supplementalAnnualWithdrawals)))} al año, una retirada media del ${b(P(wd.withdrawalRatio, 1))}.` : null,
      agota ? `Con el plan de hoy, los ahorros líquidos se acaban a los ${b(agota + ' años')}${!NA(dep.ageWhenTheyRunOutOfNetWorth) ? ` y el patrimonio entero a los ${dep.ageWhenTheyRunOutOfNetWorth}` : ''}.` : isNum(dep.liquidAssetsAtEndOfPlan) ? `Al final del plan quedarían ${b(M(Math.round(dep.liquidAssetsAtEndOfPlan)))} en ahorros: un margen si las cosas van peor.` : null,
      gap > 0 ? `Para cubrir toda la jubilación faltan ${b(M(Math.round(gap)))}${rs.requiredExtraSavings > 0 ? `: unos ${b(M(Math.round(rs.requiredExtraSavings)))} más de ahorro al año` : ''}.` : null,
      og.otherGoalsAfterRetirement && isNum(og.otherGoalsAfterRetirementAmount) ? `Después de ${t('jubilaros', 'jubilarte')} siguen otras metas por ${b(M(Math.round(og.otherGoalsAfterRetirementAmount)))}.` : null,
      need.ltcCostsAreEstimated && isNum(need.annualLtcCosts) ? `El cálculo principal no incluye cuidados de larga duración, que el estudio estima en ${M(Math.round(need.annualLtcCosts))} al año.` : null,
    ]),
    asesor: agota || gap > 0 ? 'Qué cambiar (ahorro, edad o gasto) para que el dinero llegue hasta el final.' : 'Lo seguras que son las pensiones y rentas que sostienen el plan, y cómo cubrir los años con poco margen.',
    capas: filas([
      capaFilas('Metas del plan', gsum.map(g => fila(META[g.subType || g.goalType] || g.goalType, g.goalType === 'RETIREMENT' ? `${jA}, a los ${lista(ret.map(String))}` : g.goalType === 'VACATION' ? `${M(g.amount)} cada año` : g.goalType === 'COLLEGE' ? `${M(g.amount)} por hijo` : `${M(g.amount)}${(cg.find(c => c.subType === g.subType) || {}).date ? ' en ' + anio(cg.find(c => c.subType === g.subType).date) : ''}`))),
      capaFilas('Cuándo llega cada meta', cg.map(g => fila(g.goalType === 'RETIREMENT' ? g.name.replace(/(.*)'s Retirement/, 'Jubilación de $1') : g.goalType === 'COLLEGE' ? g.name.replace('College ', 'Universidad de ') : META[g.subType || g.goalType] || g.name, `${fecha(g.date)}${g.termDate && g.goalType !== 'RETIREMENT' && anio(g.termDate) !== anio(g.date) ? ` hasta ${fecha(g.termDate)}` : ''}`))),
      capaFilas('El gasto en la jubilación', [fila('Al año, sin cuidados de larga duración', M(Math.round(need.annualTotalIncomeNeededExLtcCosts))), fila('Al año, con cuidados de larga duración', M(Math.round(need.annualTotalIncomeNeeded))),
        fila('Total de la jubilación, sin cuidados', M(Math.round(need.totalIncomeNeededExLtcCosts))), fila('Total, con cuidados', M(Math.round(need.totalIncomeNeeded))),
        fila('Cuidados de larga duración, al año', isNum(need.annualLtcCosts) ? `${M(Math.round(need.annualLtcCosts))}${need.ltcCostsAreEstimated ? ' (estimado)' : ''}` : null), fila('Cuidados de larga duración, total', M(Math.round(need.totalLtcCosts)))]),
      tabla('Ingresos de la jubilación', ['Fuente', 'Total', 'Media al año'], [...gi, ...oi].map(r => [GI[r[0]] || r[0], M(Math.round(r[1])), M(Math.round(r[2]))])),
      capaFilas('Qué parte del gasto cubren los ingresos', [fila('Todos los ingresos, sin cuidados', P(inv.allIncomesVsIncomeNeededExLtcCosts, 1)), fila('Ingresos garantizados, sin cuidados', P(inv.guaranteedIncomeVsIncomeNeededExLtcCosts, 1)), fila('Otros ingresos, sin cuidados', P(inv.otherIncomeVsIncomeNeededExLtcCosts, 1)),
        fila('Todos los ingresos, con cuidados', P(inv.allIncomesVsIncomeNeeded, 1)), fila('Ingresos garantizados, con cuidados', P(inv.guaranteedIncomeVsIncomeNeeded, 1)), fila('Otros ingresos, con cuidados', P(inv.otherIncomeVsIncomeNeeded, 1))]),
      capaFilas('Lo que sale de los ahorros', [fila('Al año', M(Math.round(wd.supplementalAnnualWithdrawals))), fila('En total (dólares de hoy)', M(Math.round(wd.supplementalTotalWithdrawals))), fila('Retirada media sobre los ahorros', P(wd.withdrawalRatio, 2))]),
      capaFilas('Patrimonio en la jubilación y al final', [fila(`Patrimonio al ${t('jubilaros', 'jubilarte')}`, M(Math.round(nwr.netWorthAtRetirementAge))), fila('· de él, líquido', M(Math.round(nwr.liquidAssetsAtRetirementAge))), fila('· de él, no líquido (casa, coches)', M(Math.round(nwr.nonLiquidAssetsAtRetirementAge))),
        fila('En cuentas de jubilación al jubilarse (dólares de hoy)', M(Math.round(rs.balanceInRetirementAccountsAtRetirementAgeInTodaysDollars))),
        fila('Patrimonio al final del plan', M(Math.round(dep.netWorthAtEndOfPlan))), fila('Ahorros líquidos al final del plan', M(Math.round(dep.liquidAssetsAtEndOfPlan))),
        fila('Edad a la que se acaban los ahorros líquidos', dep.ageWhenTheyRunOutOfLiquidAssets), fila('Edad a la que se acaba el patrimonio', dep.ageWhenTheyRunOutOfNetWorth),
        fila('Años que faltarían', dep.shortfallInNumberOfYears), fila('Edad de jubilación que haría falta', dep.requiredRetirementAge)]),
      capaFilas('Lo que pide la jubilación', [fila('Dinero que falta', isNum(gap) ? M(Math.round(gap)) : null), fila('Ahorro extra al año', isNum(rs.requiredExtraSavings) ? M(Math.round(rs.requiredExtraSavings)) : null),
        fila('Años hasta la jubilación', rs.yearsToRetirement), fila('Rentabilidad media supuesta', rs.averagePerformance ? P(rs.averagePerformance, 2) : null), fila('Inflación supuesta', P(rs.generalInflation, 1)),
        fila('Otras metas después de jubilarse', og.otherGoalsAfterRetirement ? M(Math.round(og.otherGoalsAfterRetirementAmount)) : 'No'), fila('Meta de herencia', og.legacyGoal ? M(og.legacyGoalAmount) : 'No hay')]),
      yearly.length ? tabla('Proyección año a año', ['Año', 'Edad', 'Patrimonio (hoy)', 'Patrimonio', 'Deudas', 'Invertible'], yearly.map(y => [String(y.year), [y.age_client ?? '—', y.age_co_client].filter(v => v != null).join(' / '), Mk(y.net_worth_todays_dollars), Mk(y.net_worth), Mk(y.total_debts), Mk(y.investable_assets)]), 'Patrimonio (hoy): en dólares de hoy, descontada la inflación.') : null,
      capaFilas('Ingresos registrados', (get(fh, 'profile.incomes') || []).map(i => fila(`${INGRESO[i.type] || i.type}${E.fam.pl && i.owner ? ' · ' + i.owner.join(', ') : ''}`, `${M(Math.round(i.yearly))} al año, ${i.starts}–${i.ends}`))),
    ]),
  });

  // ---------------------------------------------------------------- Universidad
  const ed = R.educationSavings || {};
  if (ed.doTheyHaveEducationFundingGoals) {
    const egap = ed.totalGAP || 0, gs = ed.goalsSummary || [];
    puntos.push({
      id: 'universidad', nombre: 'Universidad', icon: 'cap', sub: `Lo que falta para estudiar ${ki.length ? 'de ' + lista(ki.map(x => x.first_name)) : ''}`.trim(),
      cifra: egap > 0 ? Mk(egap) : 'Cubierta', cifraLab: egap > 0 ? 'faltan para la universidad' : 'la universidad está cubierta', estado: egap > 0 ? (ed.current529AccountsBalance > 0 ? 'mid' : 'low') : 'hi',
      titular: egap > 0 ? `${ed.current529AccountsBalance > 0 ? `Hay ${M(ed.current529AccountsBalance)} en cuentas 529` : 'No hay nada en cuentas 529'} y faltan ${M(Math.round(egap))}.` : 'La universidad está cubierta.',
      conexiones: ['Colchón', 'Ahorro', 'impuestos'],
      kpis: filas([k('Falta', egap > 0 ? Mk(egap) : null, 'en dólares de hoy', 'coste'), k('Ahorrar al año', ed.totalRequiredExtraSavings > 0 ? M(Math.round(ed.totalRequiredExtraSavings)) : null, `y subirlo un ${P(ed.savingsIncrease)} cada año`),
        k('En cuentas 529', M(ed.current529AccountsBalance || 0), ed.annualSavingsGoingTo529Accounts ? `${M(ed.annualSavingsGoingTo529Accounts)} al año` : 'sin aportaciones'), ...gs.map(g => k(g.goalName.replace('College ', ''), String(anio(g.date)), `empieza, ${dec(g.yearsToStart, 1)} años`))]),
      graf: gs.length ? { tipo: 'barras', titulo: 'Lo que falta por hijo', items: gs.map(g => ({ lab: g.goalName.replace('College ', ''), v: g.totalGAP, txt: `falta ${M(Math.round(g.totalGAP))}`, tono: g.totalGAP > 0 ? 'coste' : 'bueno' })), leyenda: { coste: 'Falta dinero', bueno: 'Cubierto' } } : null,
      lectura: filas([...gs.map(g => `${g.goalName.replace('College ', '')} (${g.kidsAge} años) empieza en ${b(fecha(g.date))}. Lleva ahorrado ${M(g.accountBalance || 0)} y faltan ${b(M(Math.round(g.totalGAP)))}.`),
        ed.totalRequiredExtraSavings > 0 ? `Para llegar, habría que ahorrar unos ${b(M(Math.round(ed.totalRequiredExtraSavings)))} más al año, subiendo un ${P(ed.savingsIncrease)} cada año. Es una cifra del primer año.` : null,
        isNum(ed.expectedPerformance) ? `El cálculo supone que ese dinero rinde un ${P(ed.expectedPerformance, 2)} al año.` : null]),
      asesor: egap > 0 ? 'Cuánto ahorrar para la universidad sin quitar dinero a lo demás, y en qué cuenta.' : '',
      capas: filas([tabla('Cada hijo, en detalle', ['', ...gs.map(g => g.goalName.replace('College ', ''))], [
        ['Edad hoy', ...gs.map(g => String(g.kidsAge))], ['Empieza', ...gs.map(g => fecha(g.date))], ['Termina', ...gs.map(g => fecha(g.termDate))], ['Años hasta empezar', ...gs.map(g => dec(g.yearsToStart, 1))],
        ['Coste al año de la meta', ...gs.map(g => M(g.goalAmount))], ['Lo que hace falta (dólares de hoy)', ...gs.map(g => M(Math.round(g.goalRequiredAmountAtToday)))], ['Ahorrado', ...gs.map(g => M(g.accountBalance || 0))],
        ['Aportación actual al año', ...gs.map(g => M(g.accountSavings || 0))], ['Falta', ...gs.map(g => M(Math.round(g.totalGAP)))], ['Ahorro necesario al año', ...gs.map(g => M(Math.round(g.requiredSavings)))],
        ['Ahorro extra al año', ...gs.map(g => M(Math.round(g.requiredExtraSavings)))], ['Lo que rinde lo ahorrado', ...gs.map(g => M(Math.round(g.expectedCapitalizationAmount)))], ['Peso en el total', ...gs.map(g => P(g.weight))]]),
        capaFilas('Totales', [fila('Metas de universidad, al año', M(ed.totalEducationGoalsAmount)), fila('Lo que hace falta en total (dólares de hoy)', M(Math.round(ed.totalEducationGoalRequiredAmountAtToday))), fila('En cuentas 529', M(ed.current529AccountsBalance || 0)),
          fila('Aportación anual a las 529', M(ed.annualSavingsGoingTo529Accounts || 0)), fila('Falta', M(Math.round(egap))), fila('Ahorro necesario al año', M(Math.round(ed.totalRequiredSavings))), fila('Ahorro extra al año', M(Math.round(ed.totalRequiredExtraSavings))),
          fila('Subida anual del ahorro', P(ed.savingsIncrease)), fila('Rentabilidad supuesta', P(ed.expectedPerformance, 2))])]),
    });
  }

  // ---------------------------------------------------------------- A dónde va cada dólar
  const cf = km.cashflowStatement || {}, out = (get(cf, 'outflows.items') || []), ins = get(cf, 'inflows') || {}, free = cf.freeCashflow || {};
  const cr = get(iak, 'savingsAndContributions.cashflowReconciliation') || {}, cs = get(iak, 'savingsAndContributions.currentSavings') || {};
  const fiable = get(iak, 'savingsAndContributions.savingsCapacity.savingsCapacityReliable') !== false;
  const sr = cs.currentSavingsRate, estF = !isNum(sr) ? 'neutro' : sr >= 0.2 && (free.total || 0) >= 0 ? 'hi' : sr >= 0.1 ? 'mid' : 'low';
  const porPersona = E.fam.pl && ad.length > 1;
  const col = it => porPersona ? [Mk(it.client), Mk(it.coClient), Mk(it.joint), Mk(it.total)] : [Mk(it.total)];
  const cabF = porPersona ? ['', nom('client'), nom('coClient'), 'Conjunto', 'Total'] : ['', 'Al año'];
  puntos.push({
    id: 'flujo', nombre: 'A dónde va cada dólar', icon: 'chart', sub: 'Del sueldo a impuestos, casa, deudas, ahorro y gastos',
    cifra: isNum(sr) ? P(sr) : '—', cifraLab: 'de lo que se gana va a ahorro', estado: estF,
    titular: `De ${M(ins.total)} al año, ${M(Math.round(get(out.find(o => o.name === 'Taxes') || {}, 'total') || 0))} son impuestos y ${(free.total || 0) >= 0 ? `sobran ${M(Math.round(free.total || 0))}` : `faltan ${M(Math.round(-free.total))} para cuadrar el año`}${fiable ? '' : ' (cifra poco fiable)'}.`,
    conexiones: ['Ahorro', 'Deudas', 'impuestos'],
    kpis: filas([k('Ingresos', Mk(ins.total), 'al año, brutos'), k('Impuestos', Mk(cr.totalTaxes), `tipo efectivo ${P(cr.effectiveTaxRate, 1)}`), k('Ahorro', isNum(sr) ? P(sr, 1) : null, M(cs.reportedAnnualSavings) + ' al año', estF === 'hi' ? 'bueno' : ''),
      k((free.total || 0) >= 0 ? 'Sobra' : 'Falta', Mk(Math.abs(free.total || 0)), fiable ? 'al año' : 'estimado: el gasto puede estar infradeclarado', fiable && free.total >= 0 ? 'bueno' : 'coste')]),
    graf: out.length ? { tipo: 'flujo', titulo: `Cómo se reparten ${M(ins.total)} al año`, total: ins.total, grupos: out.filter(o => o.total > 0).map(o => ({ lab: FLUJO[o.name] || o.name, v: o.total, partes: (o.items || []).filter(i => i.total > 0).map(i => ({ lab: FLUJO[i.name] || i.name, v: i.total })) })).concat(free.total > 0 ? [{ lab: 'Sobra', v: free.total, partes: [], sobra: true }] : []) } : null,
    lectura: filas([
      `Entran ${b(M(ins.total))} al año${porPersona ? ` (${nom('client')} ${M(ins.client)}, ${nom('coClient')} ${M(ins.coClient)})` : ''}. Los impuestos se llevan ${b(M(Math.round(cr.totalTaxes)))}, un ${P(cr.effectiveTaxRate, 1)}.`,
      isNum(sr) ? `Se ahorra el ${b(P(sr, 1))} de lo que se gana, ${M(cs.reportedAnnualSavings)} al año contando lo de la empresa. El 20 % es la referencia habitual.` : null,
      isNum(free.total) ? (free.total >= 0 ? `Al final del año sobran ${b(M(Math.round(free.total)))}.` : `Al final del año faltan ${b(M(Math.round(-free.total)))}: se gasta y se ahorra más de lo que entra.`) : null,
      cr.expensesLikelyUnderstated ? `Ojo: el gasto declarado (${M(Math.round(cr.reportedAnnualExpenses))} al año) parece bajo. Con los ingresos netos y el ahorro, el gasto real rondaría ${b(M(Math.round(cr.impliedTrueExpenses)))}; por eso lo que sobra es una cifra poco fiable.` : null,
    ]),
    asesor: cr.expensesLikelyUnderstated ? 'Confirmar el gasto real del día a día: todo el plan se apoya en esa cifra.' : '',
    capas: filas([
      tabla('Lo que entra', cabF, [['Sueldos', ...col(ins)]]),
      tabla('Lo que sale, partida a partida', cabF, out.flatMap(o => [[b(FLUJO[o.name] || o.name), ...col(o)], ...(o.items || []).map(i => ['· ' + (FLUJO[i.name] || i.name), ...col(i)])]).concat([[b('Sobra'), ...col(free)]])),
      capaFilas('Cuadre de cuentas del análisis', [fila('Ingresos brutos', M(cr.grossIncome)), fila('Impuestos', M(Math.round(cr.totalTaxes))), fila('Tipo efectivo', P(cr.effectiveTaxRate, 2)), fila('Ingresos netos estimados', M(Math.round(cr.estimatedNetIncome))),
        fila('Ahorro declarado', M(cr.reportedAnnualSavings)), fila('Pago de deudas declarado', M(cr.reportedAnnualDebtService)), fila('Gasto declarado', M(Math.round(cr.reportedAnnualExpenses))), fila('Gasto que sale de las cuentas', M(Math.round(cr.impliedTrueExpenses))),
        fila('Diferencia', `${M(Math.round(cr.cashFlowDelta))} (${P(cr.cashFlowDeltaPctOfEstimatedNetIncome, 1)} de los ingresos netos)`), fila('¿Gasto probablemente infradeclarado?', cr.expensesLikelyUnderstated ? 'Sí' : 'No')], 'Si el gasto declarado no cuadra con ingresos, impuestos y ahorro, el análisis marca las cifras de gasto y lo que sobra como poco fiables.'),
    ]),
  });

  // ---------------------------------------------------------------- Impuestos y cuentas
  const toc = get(iak, 'savingsAndContributions.taxOpportunityCheck') || {}, buckets = (toc.annualTaxSavingsByBucket || []).slice(1);
  const ahorroFiscal = buckets.reduce((s, r) => s + (isNum(r[5]) ? r[5] : 0), 0), hsa = toc.hsaCheck || {}, ptr = toc.preTaxVsRothCheck || {};
  const waterfall = (get(iak, 'savingsAndContributions.savingsWaterfall') || []).slice(1);
  const accts = get(fh, 'profile.accounts') || [], td = get(iak, 'taxDragAnalysis') || {}, roll = (td.householdRollup || []).slice(1);
  const ROLL = { 'Total annual tax cost (Table 2)': 'Impuestos al año por lo invertido en cuentas que tributan', 'Money-market drag routed to Cash sub-task': 'De ello, por monetarios (va en Efectivo)', 'In-scope tax cost (Table 2 ex-MM)': 'Coste fiscal analizado (sin monetarios)', 'Total annual tax cost saved (Table 3)': 'Impuestos que se ahorran al año por tener fondos en cuentas libres de impuestos', 'Total annual tax cost deferred (Table 4)': 'Impuestos que se aplazan al año en cuentas diferidas (se pagan al sacar)', 'NIIT contribution to Table 2': 'De ello, impuesto extra a rentas de inversión (NIIT)' };
  const taxable = (td.taxableAccountDetails || []), tdHead = taxable[0] || [];
  const matriz = {}; accts.forEach(a => { const o = (a.owner || []).length > 1 ? 'Conjunto' : (a.owner || ['—'])[0], f = FISCAL[a.tax_treatment] || a.tax_treatment; matriz[o] = matriz[o] || {}; matriz[o][f] = (matriz[o][f] || 0) + a.balance; });
  const fcols = Object.values(FISCAL).filter(f => Object.values(matriz).some(m => m[f]));
  puntos.push({
    id: 'impuestos', nombre: 'Impuestos y cuentas', icon: 'coins', sub: 'Cuentas con ventajas fiscales que quedan por usar',
    cifra: ahorroFiscal > 0 ? M(Math.round(ahorroFiscal)) : 'Sin margen', cifraLab: ahorroFiscal > 0 ? 'de impuestos al año que se podrían ahorrar' : 'las cuentas con ventaja fiscal están aprovechadas', estado: ahorroFiscal > 0 ? 'mid' : 'hi',
    titular: ahorroFiscal > 0 ? `Usando el margen de ${lista(buckets.filter(r => r[5] > 0).map(r => BUCKET[r[1]] || r[1]))}, se pagarían unos ${M(Math.round(ahorroFiscal))} menos de impuestos al año.` : 'No queda margen fiscal relevante por usar.',
    conexiones: ['flujo', 'jubilacion', 'cartera'],
    kpis: filas([k('Ahorro fiscal posible', ahorroFiscal > 0 ? M(Math.round(ahorroFiscal)) : null, 'al año', 'bueno'), k('Tramo marginal', P(ptr.currentTaxBracket), `en la jubilación, ${P(ptr.expectedTaxBracketInRetirement, 1)}`),
      ...buckets.filter(r => r[4] > 0).map(r => k(BUCKET[r[1]] || r[1], Mk(r[4]), 'de margen al año sin usar'))]),
    graf: buckets.length ? { tipo: 'barras', titulo: 'Aportación al año: lo que se pone y el máximo', items: buckets.map(r => ({ lab: BUCKET[r[1]] || r[1], v: r[2] || 0, ref: r[3] || 0, txt: `${M(r[2] || 0)} de ${M(r[3] || 0)}`, tono: (r[2] || 0) < (r[3] || 0) ? 'coste' : 'bueno' })), leyenda: { coste: 'Queda margen', bueno: 'Al máximo' } } : null,
    lectura: filas([...buckets.filter(r => r[4] > 0).map(r => `${BUCKET[r[1]] || r[1]}: hoy ${M(r[2] || 0)} al año, se puede llegar a ${M(r[3])}${isNum(r[5]) ? `; ahorraría unos ${b(M(r[5]))} de impuestos al año` : ''}.`),
      !hsa.hasHsa && hsa.maxContribution ? `La cuenta de salud (HSA) solo sirve si el seguro médico lo permite; hay que comprobarlo primero.` : null,
      isNum(ptr.taxDeferredAccountBalance) ? `En cuentas que tributan al sacar el dinero hay ${M(ptr.taxDeferredAccountBalance)}${ptr.rothConversionWindowYears ? `; queda una ventana de ${ptr.rothConversionWindowYears} años para pasar parte a Roth` : ''}.` : null,
      roll.length ? `Lo invertido en cuentas que tributan cuesta unos ${b(M(Math.round(roll[0][1])))} al año en impuestos.` : null]),
    asesor: ahorroFiscal > 0 ? 'Qué cuentas llenar primero y cuánto cabe en el presupuesto real.' : '',
    capas: filas([
      fcols.length ? tabla('Mapa de cuentas: de quién es y cómo tributa', ['', ...fcols, 'Total'], Object.entries(matriz).map(([o, m]) => [o, ...fcols.map(f => m[f] ? Mk(m[f]) : '—'), Mk(Object.values(m).reduce((s, v) => s + v, 0))])) : null,
      tabla('Todas las cuentas', ['Cuenta', 'De', 'Cómo tributa', 'Saldo', 'Aportación al año', 'Empresa'], accts.map(a => [CUENTA[a.account_type] || a.account_type, (a.owner || []).join(', '), FISCAL[a.tax_treatment] || a.tax_treatment, M(a.balance), M(a.yearly_contribution_total || 0), M(a.yearly_employer_match || 0)])),
      tabla('Margen fiscal por cuenta', ['Cuenta', 'Hoy', 'Máximo', 'Margen', 'Ahorro fiscal'], buckets.map(r => [BUCKET[r[1]] || r[1], M(r[2] || 0), M(r[3] || 0), M(r[4] || 0), isNum(r[5]) ? M(r[5]) : '—']), `Ahorro fiscal al tramo marginal actual (${P(ptr.currentTaxBracket)}).`),
      capaFilas('Cuenta de salud (HSA)', [fila('¿Tiene?', hsa.hasHsa ? 'Sí' : 'No'), fila('Saldo', M(hsa.hsaBalance || 0)), fila('Aportación actual', M(hsa.currentContributions || 0)), fila('Máximo al año', M(hsa.maxContribution)), fila('Margen', M(hsa.contributionGap)), fila('Ahorro fiscal al año', M(hsa.annualTaxSavingsAtCurrentMarginal)),
        fila(`Años hasta Medicare${porPersona ? ' · ' + nom('client') : ''}`, hsa.clientYearsToMedicare), porPersona ? fila(`Años hasta Medicare · ${nom('coClient')}`, hsa.coClientYearsToMedicare) : null]),
      capaFilas('Antes o después de impuestos (Roth)', [fila('Tramo marginal hoy', P(ptr.currentTaxBracket)), fila('Tramo esperado en la jubilación', P(ptr.expectedTaxBracketInRetirement, 2)), fila('Saldo que tributa al sacar', M(ptr.taxDeferredAccountBalance)), fila('Umbral que el análisis vigila', M(ptr.taxDeferredBalanceThreshold)),
        fila('Años de ventana para pasar a Roth', ptr.rothConversionWindowYears), fila('Años sacando más de lo obligatorio (RMD)', ptr.yearsPayingMoreRmdsThanRequired)]),
      tabla('El orden en que conviene poner cada dólar', ['#', 'Paso', 'Hoy', 'Objetivo', 'Estado'], waterfall.map(r => [String(r[0]), CASCADA[r[1]] || r[1], isNum(r[2]) ? M(r[2]) : ESTADO_CASCADA[r[2]] || String(r[2] || ''), isNum(r[3]) ? M(r[3]) : '—', ESTADO_CASCADA[r[4]] || (r[2] === 'N/A' ? 'No aplica' : String(r[4] || '—'))]), 'Es la cascada del análisis: primero la reserva y los seguros, luego la deuda cara, después las cuentas con ventaja fiscal.'),
      capaFilas('Coste fiscal de lo invertido', roll.map(r => fila(ROLL[r[0]] || r[0], M(r[1])))),
      taxable.length > 1 ? tabla('Qué genera impuestos en las cuentas que tributan', ['Cuenta', 'Fondo', 'Saldo', 'Tipo de renta', 'Impuesto al año'], taxable.slice(1).map(r => [String(r[1]), String(r[2]), M(r[3]), COMPONENTE[r[4]] || String(r[4]), isNum(r[tdHead.length - 1]) ? M(r[tdHead.length - 1]) : '—'])) : null,
    ]),
  });

  // ---------------------------------------------------------------- Cartera (análisis de inversiones)
  const pa = get(iak, 'performanceAnalysis') || {}, H = pa.household || {}, B = pa.sameRiskBenchmark || {}, gg = pa.goalGroups || [], conc = pa.concentration || {};
  const as = get(ia, 'analysis.portfolioAnalysis.allocationSnapshot') || {}, ts = get(ia, 'analysis.targetAnalysis.allocationSnapshot') || {};
  const cd = get(iak, 'concentrationAndDiversification') || {}, pos = ia.positions || [];
  const envC = get(iak, 'portfolioAnalysis.marketEnvironments') || [], envT = get(iak, 'targetAnalysis.marketEnvironments') || [];
  const g0 = gg[0] || {}, desv = isNum(g0.currentEquityPct) && isNum(g0.targetEquityPct) ? g0.currentEquityPct - g0.targetEquityPct : null;
  const tras = isNum(H.return3yAnnualized) && isNum(B.return3yAnnualized) ? H.return3yAnnualized - B.return3yAnnualized : null;
  const estC = desv != null && Math.abs(desv) >= 0.25 ? 'low' : (desv != null && Math.abs(desv) >= 0.1) || conc.isMaterialConcentration || (tras != null && tras < -0.02) ? 'mid' : 'hi';
  const apal = pos.filter(p => /Leveraged/i.test(p.category || ''));
  const filasAsig = (as.rows || []).filter(r => r.label !== 'Weighted avg ER');
  puntos.push({
    id: 'cartera', nombre: 'Cómo se ha portado la cartera', icon: 'stack', sub: 'Los últimos 3 años, frente a una cartera de referencia',
    cifra: isNum(H.return3yAnnualized) ? P(H.return3yAnnualized, 1) : '—', cifraLab: `al año en 3 años${isNum(B.return3yAnnualized) ? ` (referencia ${P(B.return3yAnnualized, 1)})` : ''}`, estado: estC,
    titular: desv != null ? `Lo invertido está un ${P(g0.currentEquityPct)} en bolsa; el perfil ${PERFIL[g0.targetProfile] || g0.targetProfile} pide un ${P(g0.targetEquityPct)}.` : 'Rentabilidad, riesgo y reparto de la cartera.',
    conexiones: ['Inversiones', 'impuestos', 'Colchón'],
    kpis: filas([k('Rentabilidad', P(H.return3yAnnualized, 1), `al año; referencia ${P(B.return3yAnnualized, 1)}`, tras != null && tras < 0 ? 'coste' : 'bueno'), k('Se mueve', P(H.volatility3y, 1), `al año; referencia ${P(B.volatility3y, 1)}`),
      k('Peor caída', isNum(H.maxDrawdown3y) ? P(Math.abs(H.maxDrawdown3y), 1) : null, H.maxDrawdownRecoveryDays ? `recuperada en ${H.maxDrawdownRecoveryDays} días` : '', 'coste'), k('En bolsa (lo invertido)', P(g0.currentEquityPct), `objetivo ${P(g0.targetEquityPct)}`, desv != null && Math.abs(desv) >= 0.1 ? 'coste' : '')]),
    graf: filasAsig.length && (ts.rows || []).length ? { tipo: 'pares', titulo: 'Reparto de hoy y el que propone el análisis', series: ['Hoy', 'Propuesto'], items: Object.keys(CLASE).map(c => { const a = (filasAsig.find(r => r.label === c) || {}).weight || 0, z = ((ts.rows || []).find(r => r.label === c) || {}).weight || 0; return { lab: CLASE[c], a: Math.max(0, a), b: Math.max(0, z) }; }).filter(x => x.a > 0.004 || x.b > 0.004) } : null,
    graf2: envC.length ? { tipo: 'pares', titulo: 'Cómo le habría ido en mercados reales', series: ['Hoy', 'Propuesto'], signo: true, items: envC.filter(e => e.type === 'historical').map(e => ({ lab: ENTORNO[e.name] || e.name, a: e.performance, b: (envT.find(x => x.name === e.name) || {}).performance })) } : null,
    lectura: filas([
      isNum(H.return3yAnnualized) ? `En los 3 años hasta ${fecha(get(pa, 'window.endDate'))}, la cartera del hogar ganó un ${b(P(H.return3yAnnualized, 1) + ' al año')} (${P(H.return3yCumulative, 1)} en total). Una cartera de referencia con el mismo reparto ganó un ${P(B.return3yAnnualized, 1)} al año.` : null,
      isNum(H.upsideCapture3y) ? `Cuando el mercado sube, se lleva ${b(dec(H.upsideCapture3y, 2) + ' veces')} lo que la referencia; cuando baja, pierde ${b(dec(H.downsideCapture3y, 2) + ' veces')}. Por cada punto de riesgo gana ${dec(H.sharpe3y, 2)} sobre el efectivo, frente a ${dec(B.sharpe3y, 2)} de la referencia.` : null,
      g0.aum ? `Contando el efectivo, solo el ${P(H.currentEquityPct)} del total está en bolsa; lo invertido en sí va al ${P(g0.currentEquityPct)} y ganó un ${P(g0.return3yAnnualized, 1)} al año.` : null,
      conc.topSectorName ? `El sector con más peso es ${b((SECTOR[conc.topSectorName] || conc.topSectorName).toLowerCase())}, con el ${P(conc.topSectorPct)} de la bolsa${conc.isMaterialConcentration ? ': una concentración que conviene vigilar' : ''}.` : null,
      apal.length ? `Hay un fondo apalancado (${apal.map(p => `${p.ticker}, ${M(p.value)} en ${p.account}`).join('; ')}): amplifica cada movimiento del mercado.` : null,
      isNum(get(ts, 'allocation.annualReturn')) ? `La propuesta pasa de ${b(P(get(as, 'allocation.standardDeviation'), 2))} a ${b(P(get(ts, 'allocation.standardDeviation'), 2))} de oscilación al año, con una rentabilidad simulada del ${P(get(ts, 'allocation.annualReturn'), 2)} (hoy ${P(get(as, 'allocation.annualReturn'), 2)}).` : null,
    ]),
    asesor: desv != null && Math.abs(desv) >= 0.1 ? `Cuánto riesgo ${t('queréis', 'quieres')} de verdad${E.fam.pl && ad[1] && ad[0].risk_profile !== ad[1].risk_profile ? ` (${ad[0].first_name} es ${PERFIL[ad[0].risk_profile]}; ${ad[1].first_name}, ${PERFIL[ad[1].risk_profile]})` : ''} y cómo acercar la cartera a ello.` : 'Si el reparto actual sigue encajando con los objetivos.',
    capas: filas([
      capaFilas('Rentabilidad y riesgo, hogar frente a referencia', [fila('Rentabilidad al año (3 años)', `${P(H.return3yAnnualized, 1)} · referencia ${P(B.return3yAnnualized, 1)}`), fila('Rentabilidad acumulada (3 años)', `${P(H.return3yCumulative, 1)} · referencia ${P(B.return3yCumulative, 1)}`),
        fila('Rentabilidad último año', `${P(H.return1yAnnualized, 1)} · referencia ${P(B.return1yAnnualized, 1)}`), fila('Volatilidad al año', `${P(H.volatility3y, 1)} · referencia ${P(B.volatility3y, 1)}`), fila('Peor caída', `${P(H.maxDrawdown3y, 1)} · referencia ${P(B.maxDrawdown3y, 1)}`),
        fila('Días en recuperarse', H.maxDrawdownRecoveryDays), fila('Rentabilidad por unidad de riesgo (Sharpe)', `${dec(H.sharpe3y, 2)} · referencia ${dec(B.sharpe3y, 2)}`), fila('Captura en subidas', dec(H.upsideCapture3y, 2)), fila('Captura en bajadas', dec(H.downsideCapture3y, 2)),
        fila('Coste de la volatilidad', isNum(H.volatilityDragDollarsPerYear) ? `${M(Math.round(H.volatilityDragDollarsPerYear))} al año (${dec(H.volatilityDragPpPerYear * 100, 2)} puntos)` : null), fila('Tipo sin riesgo usado', P(pa.riskFreeRate, 2)), fila('Periodo', `${fecha(get(pa, 'window.startDate'))} a ${fecha(get(pa, 'window.endDate'))}`)]),
      isNum(get(pa, 'gapDecomposition.totalGapPp')) ? capaFilas('De dónde sale la diferencia con la referencia', [fila('Por el reparto entre bolsa, bonos y efectivo', `${PP(get(pa, 'gapDecomposition.assetAllocationGapPp'), 2)} al año (${M(Math.round(get(pa, 'gapDecomposition.assetAllocationGapDollars')))})`), fila('Por los fondos elegidos', `${PP(get(pa, 'gapDecomposition.productPickingGapPp'), 2)} al año (${M(Math.round(get(pa, 'gapDecomposition.productPickingGapDollars')))})`), fila('Total', `${PP(get(pa, 'gapDecomposition.totalGapPp'), 2)} al año (${M(Math.round(get(pa, 'gapDecomposition.totalGapDollars')))})`)]) : null,
      tabla('Cada cuenta invertida', ['Cuenta', 'Saldo', 'Rentab. al año', 'Volatilidad', 'Sharpe'], gg.flatMap(g => g.accounts || []).map(a => [a.name, M(a.balance), P(a.return3yAnnualized, 1), P(a.volatility3y, 1), dec(a.sharpe3y, 2)])),
      ...gg.map(g => capaFilas(`Lo invertido a largo plazo (${g.accountCount} cuentas)`, [fila('Saldo', M(g.aum)), fila('Perfil objetivo', PERFIL[g.targetProfile] || g.targetProfile), fila('En bolsa, hoy y objetivo', `${P(g.currentEquityPct, 1)} → ${P(g.targetEquityPct, 1)}`), fila('En renta fija, hoy y objetivo', `${P(g.currentFixedIncomePct, 1)} → ${P(g.targetFixedIncomePct, 1)}`), fila('Años hasta el objetivo', g.timeHorizonYears),
        fila('Rentabilidad al año', P(g.return3yAnnualized, 1)), fila('Volatilidad', P(g.volatility3y, 1)), fila('Referencia con el reparto actual', g.benchmarkAtCurrentAlloc ? `${P(g.benchmarkAtCurrentAlloc.return3yAnnualized, 1)} al año, volatilidad ${P(g.benchmarkAtCurrentAlloc.volatility3y, 1)}` : null), fila('Referencia con el reparto objetivo', g.benchmarkAtTargetAlloc ? `${P(g.benchmarkAtTargetAlloc.return3yAnnualized, 1)} al año, volatilidad ${P(g.benchmarkAtTargetAlloc.volatility3y, 1)}` : null)])),
      tabla('Reparto por tipo de activo', ['', 'Hoy', 'Propuesto'], Object.keys(CLASE).map(c => [CLASE[c], P(Math.max(0, (filasAsig.find(r => r.label === c) || {}).weight || 0)), P(Math.max(0, ((ts.rows || []).find(r => r.label === c) || {}).weight || 0))]).concat([['Rentabilidad simulada al año', P(get(as, 'allocation.annualReturn'), 2), P(get(ts, 'allocation.annualReturn'), 2)], ['Volatilidad', P(get(as, 'allocation.standardDeviation'), 2), P(get(ts, 'allocation.standardDeviation'), 2)], ['Coste medio de los fondos', P((as.rows || []).find(r => r.label === 'Weighted avg ER')?.weight, 2), '—']]), 'Simulación de 3 años con los pesos de hoy; no son resultados reales.'),
      tabla('Crisis y subidas recientes: hogar frente a referencia', ['Momento', 'Caída hogar', 'Caída referencia', 'Días en recuperar'], (pa.perEventDrawdowns || []).map(e => [EVENTO[e.eventTitle] || e.eventTitle, P(get(e, 'household.drawdownPct'), 1), P(get(e, 'sameRiskBenchmark.drawdownPct'), 1), get(e, 'household.recoveryDays') != null ? String(e.household.recoveryDays) : 'sin recuperar en la ventana'])),
      tabla('Mercados reales: hoy y propuesto', ['Momento', 'Hoy', 'Propuesto'], envC.map(e => [ENTORNO[e.name] || e.name, PP(e.performance, 1), PP((envT.find(x => x.name === e.name) || {}).performance, 1)])),
      tabla('Sectores de la bolsa', ['Sector', 'Peso', 'Umbral', 'Nivel'], (cd.sectorConcentration || []).slice(1).map(r => [SECTOR[r[0]] || r[0], P(r[1], 1), String(r[2]).replace('%', ' %'), r[3] === 'Elevated' ? 'Alto' : 'Normal'])),
      tabla('Países y regiones', ['Región', 'Peso'], (cd.geographyByRegion || []).slice(1).map(r => [REGION[r[0]] || r[0], P(r[1], 1)])),
      capaFilas('Concentración', [fila('Fondos y posiciones', get(cd, 'totals.holdings')), fila('Expuesto a bolsa', M(Math.round(get(cd, 'totals.equityExposure')))), fila('Acciones sueltas', `${get(cd, 'totals.singleStockPositions') || 0} (${P(get(cd, 'totals.singleStockWeight') || 0)})`), fila('Total invertible', M(get(cd, 'totals.investablePortfolioValue')))]),
      tabla('Todos los fondos, cuenta a cuenta', ['Cuenta', 'Fondo', 'Tipo', 'Importe', 'Peso en la cuenta', 'Coste anual'], pos.map(p => [p.account, `${p.name}${p.ticker ? ' (' + p.ticker + ')' : ''}`, CATEG[p.category] || p.category || '—', M(p.value), P(p.weight_in_account), isNum(p.expense_ratio) ? P(p.expense_ratio, 2) : '—'])),
      tabla('Lo que pasaba en el mercado', ['Etapa', 'Desde', 'Hasta'], (get(ia, 'analysis.periods') || []).map(p => [p.name, fecha(p.startDate), fecha(p.endDate)]), 'Etapas del mercado en la ventana de 3 años, tal como las nombra el análisis.'),
    ]),
  });

  // ---------------------------------------------------------------- capas extra de las cinco áreas
  const pr = km.protection || {}, life = pr.lifeInsurance || {}, umb = pr.umbrellaInsurance || {};
  add('Seguros', tabla('Todas las pólizas', ['Póliza', 'De', 'Cobertura', 'Prima al año'], (get(fh, 'profile.insurance') || []).map(i => [SEGURO[i.type] || i.type, (i.owner || []).join(', '), isNum(i.coverage) ? M(i.coverage) : 'Sí (sin importe)', isNum(i.yearly_premium) ? M(i.yearly_premium) : '—'])));
  add('Deudas', tabla('Todas las deudas', ['Deuda', 'Saldo', 'Interés', 'Pago al mes'], (get(fh, 'profile.liabilities') || []).map(l => [`${l.name}${E.fam.pl && l.owner ? ' · ' + l.owner.join(', ') : ''}`, M(l.balance), isNum(l.interest_rate) ? P(l.interest_rate, 1) : '—', isNum(l.monthly_payment) ? M(l.monthly_payment) : '—'])));
  add('Ahorro', tabla('Ahorro de cada cuenta', ['Cuenta', 'De', 'Aportación al año', 'Empresa'], accts.filter(a => a.yearly_contribution_total || a.yearly_employer_match).map(a => [CUENTA[a.account_type] || a.account_type, (a.owner || []).join(', '), M(a.yearly_contribution_total || 0), M(a.yearly_employer_match || 0)])));
  add('Colchón', tabla('Efectivo cuenta a cuenta', ['Cuenta', 'Se puede usar', 'Saldo', 'En efectivo', 'Rinde hoy', 'Podría rendir'], (get(iak, 'cashNeeds.currentCashBalance') || []).slice(1).map(r => [String(r[0]), r[1] === 'Accessible' ? 'Sí' : 'No', M(r[2]), M(r[3]), isNum(r[4]) ? P(r[4], 2) : '—', isNum(r[6]) ? P(r[6], 2) : '—'])));
  add('Colchón', capaFilas('Lo que rinde el efectivo', ((get(iak, 'cashNeeds.summaryIncome') || []).slice(1)).map(r => fila(({ Liquidity: 'Reserva', 'Excess accessible': 'Exceso disponible', 'Excess inaccessible': 'Exceso no disponible', 'Operational buffer': 'Colchón operativo', '  Accessible cash': '· disponible', '  Inaccessible cash': '· no disponible', Total: 'Total' })[r[0]] || r[0], `hoy ${M(Math.round(r[1]))} al año; podría ${M(Math.round(r[2]))} (se pierden ${M(Math.round(r[3]))})`))));

  // ---------------------------------------------------------------- Supuestos del cálculo
  puntos.push({
    id: 'supuestos', nombre: 'Cómo se ha calculado', icon: 'help', sub: 'Supuestos, fuentes y avisos del informe',
    cifra: P(rs.generalInflation ?? 0.03), cifraLab: 'de inflación al año supuesta', estado: 'neutro',
    titular: `Proyección hasta los ${rg.clientProfile?.endOfPlanAge || 91} años, con un único escenario y sin comisiones.`,
    conexiones: ['jubilacion', 'cartera'],
    kpis: filas([k('Inflación', P(rs.generalInflation ?? 0.03), 'general; salud y educación 5 %'), k('Hasta los', `${rg.clientProfile?.endOfPlanAge || 91} años`, 'esperanza de vida del plan'), k('Rentabilidad media', rs.averagePerformance ? P(rs.averagePerformance, 2) : null, 'supuesta para la jubilación'), k('Periodo analizado', `${anio(get(pa, 'window.startDate'))}–${anio(get(pa, 'window.endDate'))}`, 'para la cartera')]),
    lectura: METODO.textos.slice(0, 3),
    capas: filas([
      capaFilas('Inflación supuesta', METODO.inflacion), tabla('Rentabilidad esperada por perfil', ['Perfil', 'Al año'], METODO.perfiles), tabla('Rentabilidad esperada por tipo de activo', ['Activo', 'Al año'], METODO.clases),
      capaFilas(`${t('Vuestros', 'Tus')} datos de partida`, [...ad.map(a => fila(a.first_name, `${a.age} años, jubilación a los ${a.retirement_age}, perfil ${PERFIL[a.risk_profile] || a.risk_profile}`)), ...ki.map(c => fila(c.first_name, `${c.age} años`)),
        fila('Residencia', [get(fh, 'case.city'), get(fh, 'case.state')].filter(Boolean).join(', ')), fila('Declaración de impuestos', ({ MARRIED_FILING_JOINTLY: 'Conjunta (casados)', SINGLE: 'Individual', HEAD_OF_HOUSEHOLD: 'Cabeza de familia' })[get(fh, 'case.tax_filing_status')] || get(fh, 'case.tax_filing_status')),
        fila('Tipo sin riesgo', P(pa.riskFreeRate, 2)), fila('Comisión de asesoramiento aplicada', P(get(iak, 'portfolioAnalysis.advisoryFee.effectiveAnnualRate') || 0))]),
      { t: 'texto', titulo: 'Método y avisos', parrafos: METODO.textos },
    ]),
  });

  // Página de la nota: áreas con sus puntos, topes que frenan la nota y cada paso con su efecto.
  const sc = fh.score || {}, PIL = { 'Savings and cash flow': 'Ahorro', Debt: 'Deudas', Investments: 'Inversiones', 'Liquidity and emergency fund': 'Colchón', 'Insurance and protection': 'Seguros' };
  const TOPE = { 'High revolving balance with high APR': 'Deuda de tarjeta alta y a interés alto', 'Mortality coverage ratio below threshold with dependents': 'Seguro de vida por debajo del mínimo, con personas a cargo' };
  const ESF = { low: 'bajo', medium: 'medio', high: 'alto' };
  const notaCapas = filas([
    tabla('Las cinco áreas', ['Área', 'Nota', 'Puntos'], (sc.pillars || []).map(x => [PIL[x.pillar] || x.pillar, String(x.score), x.points_shown_in_app])),
    (sc.caps_applied || []).length ? tabla('Lo que pone techo a la nota', ['Motivo', 'Nota máxima mientras siga'], sc.caps_applied.map(c => [TOPE[c.reason] || c.reason, String(c.score_capped_at)]), 'Mientras no se resuelvan, la nota no pasa de ese techo aunque lo demás mejore.') : null,
    tabla('Cada paso del plan', ['Paso', 'Esfuerzo', 'Nota', 'Quita un techo'], (E.pasos || []).map(p => [p.titulo, ESF[p.esfuerzo] || p.esfuerzo || '—', `${sc.published_score ?? ''} → ${p.nota}`, p.abre ? 'Sí' : 'No'])),
    capaFilas('La escala', [fila('Nota publicada', sc.published_score), fila('Banda', ({ critical: 'crítica', vulnerable: 'vulnerable', stable: 'estable', strong: 'fuerte', excellent: 'excelente' })[sc.band] || sc.band), fila('Escala', sc.scale ? String(sc.scale).replace(' to ', ' a ') : null)]),
  ]);
  return { puntos, extra, notaCapas };
}

// Divide un texto del informe en frases o viñetas («- **Título** — texto»).
export function trozos(txt) {
  return String(txt || '').split(/\n+|(?:^|\s)-\s(?=\*\*|[A-Z])/).map(s => s.replace(/^-\s*/, '').trim()).filter(Boolean);
}

// Control de cifras de una traducción: los mismos números que el original (en inglés 1,234.5; en español 1.234,5).
const numsEn = s => (String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).map(x => +x.replace(/,/g, '')).filter(n => n >= 10);
const numsEs = s => (String(s).match(/\d[\d.]*(?:,\d+)?/g) || []).map(x => +x.replace(/\./g, '').replace(',', '.')).filter(n => n >= 10);
// Control de cifras de un resumen corto: toda cifra del resumen está en el original (no se inventa ninguna).
export function cifrasDentro(en, es) {
  const set = new Set(numsEn(en).map(String));
  return numsEs(es).every(n => set.has(String(n)));
}
// Resumen corto en español de un texto del informe: puntos { c: cifra, t: texto, k: tono }.
// Se descarta entero si alguna cifra no está en el original.
export const TONOS = ['bien', 'mal', 'ojo', 'info', 'rev'];
export function cortoValido(en, pts) {
  if (!Array.isArray(pts) || !pts.length) return 'vacío';
  for (const p of pts) {
    if (!p || typeof p.t !== 'string' || !p.t.trim()) return 'punto sin texto';
    if (!TONOS.includes(p.k)) return `tono desconocido: ${p.k}`;
    if (!cifrasDentro(en, `${p.c || ''} ${p.t}`)) return `cifra que no está en el original: «${p.c ? p.c + ' ' : ''}${p.t}»`;
  }
  return null;
}
export function cifrasIguales(en, es) {
  const a = numsEn(en).sort((x, y) => x - y), z = numsEs(es).sort((x, y) => x - y);
  const set = new Set(z.map(String));
  return a.every(n => set.has(String(n)));
}
