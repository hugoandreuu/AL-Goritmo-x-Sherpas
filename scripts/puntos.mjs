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
const MES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const miles = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dec = (n, d = 1) => { let s = (+n).toFixed(d); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); return s; };
const isNum = v => typeof v === 'number' && !isNaN(v);
const M = v => !isNum(v) ? 'no data' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + '$' + dec(Math.abs(v) / 1e6, 2) + 'M' : (v < 0 ? '-' : '') + '$' + miles(v);
const Mk = v => !isNum(v) ? 'no data' : Math.abs(v) >= 1e6 ? (v < 0 ? '-' : '') + '$' + dec(Math.abs(v) / 1e6, Math.abs(v) >= 1e7 ? 1 : 2) + 'M' : Math.abs(v) >= 1e4 ? (v < 0 ? '-' : '') + '$' + miles(Math.round(Math.abs(v) / 1e3)) + 'K' : M(v);
const P = (v, d = 0) => isNum(v) ? dec(v * 100, d) + '%' : 'no data';
const PP = (v, d = 1) => isNum(v) ? (v > 0 ? '+' : '') + dec(v * 100, d) + '%' : 'no data';
const fecha = iso => iso ? MES[+String(iso).slice(5, 7) - 1] + ' ' + String(iso).slice(0, 4) : '';
const anio = iso => +String(iso).slice(0, 4);
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? null : x[k]), o) ?? null;
const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const b = s => `<b>${s}</b>`;
const NA = v => v == null || v === 'Not applicable' || v === 'N/A' || v === '';

// ---- diccionarios (todas las etiquetas que aparecen en los cuatro casos)
const FLUJO = {
  Taxes: 'Taxes', 'Federal Income Tax': 'Federal income tax', 'State Income Tax': 'State income tax', 'FICA tax': 'Social Security and Medicare (FICA)',
  Expenses: 'Expenses', 'Living Expenses': 'Living expenses', 'Insurance payments': 'Insurance',
  Savings: 'Savings', '401k - Traditional savings': '401(k)', 'Brokerage account savings': 'Brokerage account', 'Cash savings': 'Cash', 'HSA savings': 'Health savings account (HSA)',
  '529 - College Savings Plan savings': '529 account (college)', 'Custodial UGMA savings': 'Custodial account for the kids (UGMA)',
  'Housing Expenses': 'Housing', Mortgage: 'Mortgage', 'Property Taxes': 'Property taxes', 'Home Insurance': 'Home insurance', Rent: 'Rent', 'Renter insurance': 'Renter’s insurance',
  'Debt Payments': 'Debt', 'Car loan payments': 'Car loan', 'Credit card payments': 'Credit card', 'Student loan payments': 'Student loan',
  'Earned income': 'Earned income', 'Salary and wages': 'Salary and wages',
};
const CASCADA = {
  'Build minimum emergency threshold (3 months)': 'Minimum emergency reserve (3 months)', 'Address essential insurance gaps': 'Cover the essential insurance gaps',
  'Set aside cash for near-term goals': 'Set aside cash for near-term goals', 'Maximize employer match — primary plan': 'Get the full employer match (primary plan)',
  'Maximize employer match — secondary plan': 'Get the full employer match (secondary plan)', 'Maximize HSA match': 'Get the HSA match',
  'Maximize ESPP (Employee Stock Purchase Plan)': 'Employee Stock Purchase Plan (ESPP)', 'Pay high-interest debt (>7%)': 'Pay off high-interest debt (over 7%)',
  'Build toward maximum emergency threshold (6 months)': 'Complete the reserve (6 months)', 'Contribute to Roth IRA': 'Contribute to a Roth IRA', 'Maximize HSA': 'Max out the HSA',
  'Contribute to 529 accounts': 'Contribute to 529 accounts (college)', 'Maximize 401k / employer plans': 'Max out the 401(k) / employer plans', 'Invest in taxable brokerage': 'Invest in the taxable brokerage account',
  'Pay low-interest debt (personal, auto)': 'Pay off low-interest debt (personal, auto)', 'Make extra mortgage payments': 'Make extra mortgage payments',
};
const ESTADO_CASCADA = { Filled: 'Filled', 'Partially filled': 'Partially filled', Empty: 'Empty', 'N/A': 'N/A' };
const BUCKET = { 'Roth IRA': 'Roth IRA', HSA: 'Health savings account (HSA)', '529 accounts': '529 accounts (college)', '401k': '401(k)' };
const CUENTA = { '401k - Roth': 'Roth 401(k)', '401k - Traditional': 'Traditional 401(k)', '529 - College Savings Plan': '529 account (college)', 'Brokerage account': 'Brokerage account', 'Checking account': 'Checking account', 'Custodial UGMA': 'Custodial UGMA account (kids)', HSA: 'Health savings account (HSA)', 'Savings account': 'Savings account' };
const FISCAL = { TAXABLE: 'Taxable', TAX_DEFERRED: 'Tax-deferred (taxed when you withdraw)', TAX_FREE: 'Tax-free' };
const CATEG = {
  'Corporate Bond': 'Corporate bonds', 'Diversified Emerging Markets': 'Emerging-markets stocks', 'Foreign Large Blend': 'International stocks (large companies)', 'Foreign Large Growth': 'International growth stocks',
  'High Yield Bond': 'High-yield bonds', 'Inflation-Protected Bond': 'Inflation-protected bonds', 'Large Blend': 'US stocks (large companies)', 'Large Growth': 'US growth stocks',
  'Large Value': 'US value stocks', 'Moderate Allocation': 'Balanced fund (moderate allocation)', 'Money Market-Taxable': 'Money market (cash)', 'Trading--Leveraged Equity': 'Leveraged stocks',
};
const SECTOR = { 'Basic Materials': 'Basic Materials', 'Communication Services': 'Communication Services', 'Consumer Cyclical': 'Consumer Cyclical', 'Consumer Defensive': 'Consumer Defensive', Energy: 'Energy', 'Financial Services': 'Financial Services', Healthcare: 'Healthcare', Industrials: 'Industrials', 'Real Estate': 'Real Estate', Technology: 'Technology', Utilities: 'Utilities' };
const REGION = { Africa: 'Africa', 'Asia - Developed': 'Asia (developed)', 'Asia - Emerging': 'Asia (emerging)', Australasia: 'Australasia', Canada: 'Canada', 'Europe - Emerging': 'Europe (emerging)', 'Europe - ex Euro': 'Europe ex-Euro', Eurozone: 'Eurozone', Japan: 'Japan', 'Latin America': 'Latin America', 'Middle East': 'Middle East', 'United Kingdom': 'United Kingdom', 'United States': 'United States' };
const EVENTO = {
  '90-day tariff pause rally': '90-day tariff pause rally (April 2025)', 'DeepSeek AI shock': 'DeepSeek AI shock (January 2025)', 'Fed final hike to 5.25–5.50%': 'Fed final hike to 5.25–5.50% (July 2023)',
  'Fed first rate cut — 50bp': 'Fed first rate cut, 50bp (September 2024)', 'Fed pivot — December 2023 dot plot': 'Fed pivot, December 2023 dot plot', 'Global selloff — VIX spikes above 60': 'Global selloff, VIX spikes above 60 (August 2024)',
  'Liberation Day tariffs announced': 'Liberation Day tariffs announced (April 2025)', 'Operation Epic Fury — US-Israel strikes on Iran': 'Operation Epic Fury: US-Israel strikes on Iran',
  'Supreme Court strikes down Liberation Day tariffs': 'Supreme Court strikes down Liberation Day tariffs', 'Trump election win': 'Trump election win (November 2024)', 'US-China Geneva tariff truce': 'US-China Geneva tariff truce (May 2025)',
};
const ENTORNO = { 'Post-GFC Bull Run': 'Post-GFC Bull Run (2009-11)', 'Global Financial Crisis': 'Global Financial Crisis (2007-09)', 'Global Equity Sell-off': 'Global Equity Sell-off (2018)', 'COVID-19 Pandemic Crash': 'COVID-19 Pandemic Crash (2020)',
  'Fed Pivot Rally - Q4 2023': 'Fed Pivot Rally (Q4 2023)', 'Geopolitical Shock - Operation Epic Fury / Hormuz Closure': 'Geopolitical Shock: Operation Epic Fury / Hormuz Closure', 'Regional Banking Crisis (SVB / Credit Suisse)': 'Regional Banking Crisis (SVB / Credit Suisse)', 'Tariff Shock - Liberation Day': 'Tariff Shock: Liberation Day' };
const CLASE = { 'U.S. Equity': 'U.S. Equity', 'Non-U.S. Equity': 'Non-U.S. Equity', 'U.S. Fixed Income': 'U.S. Fixed Income', 'Non-U.S. Fixed Income': 'Non-U.S. Fixed Income', Cash: 'Cash', Other: 'Other' };
const PERFIL = { Income: 'Income', Conservative: 'Conservative', Moderate: 'Moderate', Growth: 'Growth', Aggressive: 'Aggressive', Dynamic: 'Dynamic' };
const SEGURO = { HOMEOWNERS_INSURANCE: 'Homeowners', LONG_TERM_DI: 'Long-term disability', TERM_LIFE: 'Term life', UMBRELLA_INSURANCE: 'Umbrella liability', VEHICLE_INSURANCE: 'Vehicle', WHOLE_LIFE: 'Whole life' };
const INGRESO = { ANNUITY_INCOME: 'Annuity income', SALARY_AND_WAGES: 'Salary and wages', SOCIAL_SECURITY: 'Social Security', SOCIAL_SECURITY_SURVIVOR_BENEFIT: 'Social Security survivor benefit' };
const COMPONENTE = { Subtotal: 'Subtotal', '-': '—', '[missing historical load]': 'No distribution history', 'Qualified dividend': 'Qualified dividend', 'Non-qualified dividend': 'Non-qualified dividend', Interest: 'Interest', 'Capital gain distribution': 'Capital gain distribution', 'Short-term capital gain': 'Short-term capital gain', 'Long-term capital gain': 'Long-term capital gain', 'Return of capital': 'Return of capital' };
const META = { VACATION: 'Vacation', COLLEGE: 'College', RETIREMENT: 'Retirement', REAL_ESTATE_PURCHASE: 'Home purchase', VEHICLE_PURCHASE: 'Vehicle purchase' };

// Texto fijo de «Disclosures & assumptions» del informe (igual en los tres PDF; no está en los JSON).
const METODO = {
  inflacion: [['General', '3.00%'], ['Healthcare', '5.00%'], ['Education', '5.00%']],
  perfiles: [['1 - Capital preservation', '5.86%'], ['2 - Conservative', '6.67%'], ['3 - Moderate', '7.30%'], ['4 - Growth', '7.76%'], ['5 - Dynamic', '8.18%']],
  clases: [['U.S. Equity', '7.70%'], ['Non-U.S. Equity', '7.63%'], ['U.S. Fixed Income', '5.48%'], ['Non-U.S. Fixed Income', '5.57%'], ['Cash', '3.20%'], ['Other / Alternatives', '9.17%']],
  textos: [
    'Projections use a single-scenario, deterministic model (no Monte Carlo simulation): income, expenses, taxes and net worth month by month. No probabilities or confidence intervals.',
    'Tax modeling: federal and state income tax brackets, FICA, Medicare and capital gains. AMT not included.',
    'Social Security: estimated using the PIA formula. WEP/GPO not modeled.',
    'Expected returns come from J.P. Morgan’s Long-Term Capital Market Assumptions (LTCMA) by asset class; your firm may adjust them.',
    'Return and volatility of the current and target portfolios: 3-year backtest with today’s weights applied to historical prices (hypothetical, not actual results), gross of advisory fees.',
    'Market data: Morningstar (ETFs, mutual funds) and Bavest (direct stocks, cryptocurrency).',
    'Investing involves risk, including the possible loss of principal. Past performance does not guarantee future results. The report supports your conversation with your advisor and is not a recommendation to buy or sell any security.',
  ],
};

// Partes de cada texto del informe que van en cada punto (clave → [punto, título]).
export const NARRATIVA = {
  'fh.summary_main': ['__nota', 'Report summary'], 'fh.summary_recommendations': ['__nota', 'Report recommendations'],
  'ia.summary_main': ['__nota', 'Investment analysis summary'],
  'fh.retirement_short_observations': ['jubilacion', 'What the report says'], 'fh.retirement_what_to_look_into': ['jubilacion', 'What to look into'],
  'fh.assets_short_observations': ['Investments', 'What the report says'], 'fh.assets_what_to_look_into': ['Investments', 'What to look into'],
  'fh.debt_short_observations': ['Debt', 'What the report says'], 'fh.debt_what_to_look_into': ['Debt', 'What to look into'],
  'fh.savings_short_observations': ['Savings', 'What the report says'], 'fh.savings_what_to_look_into': ['Savings', 'What to look into'],
  'fh.protection_emergency_fund_short_observations': ['Emergency fund', 'What the report says'],
  'fh.protection_intro': ['Insurance', 'What the report says'], 'fh.protection_life_insurance_short_observations': ['Insurance', 'Life insurance'], 'fh.protection_umbrella_short_observations': ['Insurance', 'Umbrella liability'],
  'ia.snapshot_main': ['cartera', 'Snapshot'], 'ia.portfolio_today_intro': ['cartera', 'The main tension'],
  'ia.portfolio_today_what_it_needs_to_do': ['cartera', 'What the portfolio needs to do'], 'ia.portfolio_today_what_its_actually_doing': ['cartera', 'What it’s actually doing'],
  'ia.portfolio_today_performance_timeline': ['cartera', 'Performance timeline'], 'ia.portfolio_today_whats_working': ['cartera', 'What’s working'],
  'ia.portfolio_today_priorities': ['cartera', 'Priorities'], 'ia.recommendations_main': ['cartera', 'What the analysis recommends'],
  'ia.recommendations_scenarios': ['cartera', 'How it holds up in real markets'],
  'ia.portfolio_today_verdict': ['impuestos', 'Retirement accounts'], 'ia.portfolio_today_also_meaningful': ['impuestos', 'Health savings account (HSA)'],
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
  const GI = { 'Social security': 'Social Security', 'Annuity income': 'Annuity income', 'Pension / defined benefit': 'Pension / defined benefit', 'Total guaranteed income': 'Total guaranteed income', 'Earned income': 'Earned income', 'Total other income': 'Total other income' };
  puntos.push({
    id: 'jubilacion', nombre: 'Retirement & goals', icon: 'sun', sub: 'Whether the money lasts, and the goals along the way',
    cifra: isNum(cover) ? P(cover) : '—', cifraLab: 'of retirement spending covered', estado: estJ,
    titular: agota ? `Liquid savings run out at age ${agota}.` : gap > 0 ? `Retirement is short: ${M(Math.round(gap))}.` : `Your retirement is covered in the plan.`,
    conexiones: ['Savings', 'Investments', 'universidad'],
    kpis: filas([k('Retirement', jA ? String(jA) : null, ret.length ? `at ${lista(ret.map(String))}` : ''),
      k('Spending covered', isNum(cover) ? P(cover) : null, 'excluding long-term care', estJ === 'hi' ? 'bueno' : 'coste'),
      agota ? k('Liquid savings', `at age ${agota}`, 'run out', 'coste') : k('At the end of the plan', Mk(dep.liquidAssetsAtEndOfPlan), 'in liquid savings', 'bueno'),
      k(`Net worth at retirement`, Mk(nwr.netWorthAtRetirementAge), 'not adjusted for inflation')]),
    graf: gi.length && isNum(need.annualTotalIncomeNeededExLtcCosts) ? { tipo: 'barras', titulo: 'Yearly spending in retirement, and where it comes from', items: [
      { lab: 'Spending needed', v: need.annualTotalIncomeNeededExLtcCosts, txt: M(Math.round(need.annualTotalIncomeNeededExLtcCosts)) },
      ...gi.filter(r => r[2] > 0 && !/^Total/.test(r[0])).map(r => ({ lab: GI[r[0]] || r[0], v: r[2], txt: M(Math.round(r[2])), tono: 'bueno' })),
      ...oi.filter(r => r[2] > 0 && !/^Total/.test(r[0])).map(r => ({ lab: 'Other: ' + (GI[r[0]] || r[0]).toLowerCase(), v: r[2], txt: M(Math.round(r[2])), tono: 'bueno' })),
      isNum(wd.supplementalAnnualWithdrawals) && wd.supplementalAnnualWithdrawals > 0 ? { lab: 'From savings', v: wd.supplementalAnnualWithdrawals, txt: M(Math.round(wd.supplementalAnnualWithdrawals)), tono: 'coste' } : null].filter(Boolean),
      leyenda: { bueno: 'Guaranteed income', coste: 'Comes from savings' } } : null,
    lectura: filas([
      isNum(need.annualTotalIncomeNeededExLtcCosts) ? `In retirement you’ll need about ${b(M(Math.round(need.annualTotalIncomeNeededExLtcCosts)))} a year on average. Income covers ${b(P(cover))}${isNum(inv.allIncomesVsIncomeNeeded) ? ` (${P(inv.allIncomesVsIncomeNeeded)} once long-term care costs are included)` : ''}.` : null,
      isNum(inv.guaranteedIncomeVsIncomeNeededExLtcCosts) ? `Almost all of it comes from guaranteed income (Social Security and annuities): ${b(P(inv.guaranteedIncomeVsIncomeNeededExLtcCosts, 1))}. Other income adds ${P(inv.otherIncomeVsIncomeNeededExLtcCosts, 1)}.` : null,
      isNum(wd.supplementalAnnualWithdrawals) ? `About ${b(M(Math.round(wd.supplementalAnnualWithdrawals)))} a year would come from savings, an average withdrawal rate of ${b(P(wd.withdrawalRatio, 1))}.` : null,
      agota ? `With today’s plan, liquid savings run out at age ${b(agota)}${!NA(dep.ageWhenTheyRunOutOfNetWorth) ? ` and total net worth at ${dep.ageWhenTheyRunOutOfNetWorth}` : ''}.` : isNum(dep.liquidAssetsAtEndOfPlan) ? `At the end of the plan, ${b(M(Math.round(dep.liquidAssetsAtEndOfPlan)))} would be left in savings: a cushion if things go worse.` : null,
      gap > 0 ? `To cover all of retirement, ${b(M(Math.round(gap)))} is missing${rs.requiredExtraSavings > 0 ? `: about ${b(M(Math.round(rs.requiredExtraSavings)))} more in savings a year` : ''}.` : null,
      og.otherGoalsAfterRetirement && isNum(og.otherGoalsAfterRetirementAmount) ? `After you retire, other goals add up to ${b(M(Math.round(og.otherGoalsAfterRetirementAmount)))}.` : null,
      need.ltcCostsAreEstimated && isNum(need.annualLtcCosts) ? `The main calculation excludes long-term care, which the analysis estimates at ${M(Math.round(need.annualLtcCosts))} a year.` : null,
    ]),
    asesor: agota || gap > 0 ? 'What to change (savings, age or spending) so the money lasts to the end.' : 'How secure the pensions and annuities behind the plan are, and how to cover the years with little room.',
    capas: filas([
      capaFilas('Goals in the plan', gsum.map(g => fila(META[g.subType || g.goalType] || g.goalType, g.goalType === 'RETIREMENT' ? `${jA}, at ${lista(ret.map(String))}` : g.goalType === 'VACATION' ? `${M(g.amount)} every year` : g.goalType === 'COLLEGE' ? `${M(g.amount)} per child` : `${M(g.amount)}${(cg.find(c => c.subType === g.subType) || {}).date ? ' in ' + anio(cg.find(c => c.subType === g.subType).date) : ''}`))),
      capaFilas('When each goal arrives', cg.map(g => fila(g.goalType === 'RETIREMENT' ? g.name.replace(/(.*)'s Retirement/, '$1’s retirement') : g.goalType === 'COLLEGE' ? g.name.replace('College ', 'College: ') : META[g.subType || g.goalType] || g.name, `${fecha(g.date)}${g.termDate && g.goalType !== 'RETIREMENT' && anio(g.termDate) !== anio(g.date) ? ` to ${fecha(g.termDate)}` : ''}`))),
      capaFilas('Spending in retirement', [fila('Per year, excluding long-term care', M(Math.round(need.annualTotalIncomeNeededExLtcCosts))), fila('Per year, including long-term care', M(Math.round(need.annualTotalIncomeNeeded))),
        fila('Retirement total, excluding care', M(Math.round(need.totalIncomeNeededExLtcCosts))), fila('Total, including care', M(Math.round(need.totalIncomeNeeded))),
        fila('Long-term care, per year', isNum(need.annualLtcCosts) ? `${M(Math.round(need.annualLtcCosts))}${need.ltcCostsAreEstimated ? ' (estimado)' : ''}` : null), fila('Long-term care, total', M(Math.round(need.totalLtcCosts)))]),
      tabla('Retirement income', ['Fuente', 'Total', 'Average per year'], [...gi, ...oi].map(r => [GI[r[0]] || r[0], M(Math.round(r[1])), M(Math.round(r[2]))])),
      capaFilas('Share of spending covered by income', [fila('All income, excluding care', P(inv.allIncomesVsIncomeNeededExLtcCosts, 1)), fila('Guaranteed income, excluding care', P(inv.guaranteedIncomeVsIncomeNeededExLtcCosts, 1)), fila('Other income, excluding care', P(inv.otherIncomeVsIncomeNeededExLtcCosts, 1)),
        fila('All income, including care', P(inv.allIncomesVsIncomeNeeded, 1)), fila('Guaranteed income, including care', P(inv.guaranteedIncomeVsIncomeNeeded, 1)), fila('Other income, including care', P(inv.otherIncomeVsIncomeNeeded, 1))]),
      capaFilas('Withdrawals from savings', [fila('Per year', M(Math.round(wd.supplementalAnnualWithdrawals))), fila('Total (today’s dollars)', M(Math.round(wd.supplementalTotalWithdrawals))), fila('Average withdrawal rate', P(wd.withdrawalRatio, 2))]),
      capaFilas('Net worth at retirement and at the end', [fila(`Net worth at retirement`, M(Math.round(nwr.netWorthAtRetirementAge))), fila('· of which, liquid', M(Math.round(nwr.liquidAssetsAtRetirementAge))), fila('· of which, illiquid (home, cars)', M(Math.round(nwr.nonLiquidAssetsAtRetirementAge))),
        fila('In retirement accounts at retirement (today’s dollars)', M(Math.round(rs.balanceInRetirementAccountsAtRetirementAgeInTodaysDollars))),
        fila('Net worth at the end of the plan', M(Math.round(dep.netWorthAtEndOfPlan))), fila('Liquid savings at the end of the plan', M(Math.round(dep.liquidAssetsAtEndOfPlan))),
        fila('Age when liquid savings run out', dep.ageWhenTheyRunOutOfLiquidAssets), fila('Age when net worth runs out', dep.ageWhenTheyRunOutOfNetWorth),
        fila('Years short', dep.shortfallInNumberOfYears), fila('Retirement age that would be needed', dep.requiredRetirementAge)]),
      capaFilas('What retirement needs', [fila('Retirement gap', isNum(gap) ? M(Math.round(gap)) : null), fila('Extra savings per year', isNum(rs.requiredExtraSavings) ? M(Math.round(rs.requiredExtraSavings)) : null),
        fila('Years to retirement', rs.yearsToRetirement), fila('Assumed average return', rs.averagePerformance ? P(rs.averagePerformance, 2) : null), fila('Assumed inflation', P(rs.generalInflation, 1)),
        fila('Other goals after retirement', og.otherGoalsAfterRetirement ? M(Math.round(og.otherGoalsAfterRetirementAmount)) : 'No'), fila('Legacy goal', og.legacyGoal ? M(og.legacyGoalAmount) : 'None')]),
      yearly.length ? tabla('Year-by-year projection', ['Year', 'Age', 'Net worth (today’s $)', 'Net worth', 'Debt', 'Investable'], yearly.map(y => [String(y.year), [y.age_client ?? '—', y.age_co_client].filter(v => v != null).join(' / '), Mk(y.net_worth_todays_dollars), Mk(y.net_worth), Mk(y.total_debts), Mk(y.investable_assets)]), 'Net worth (today’s $): in today’s dollars, adjusted for inflation.') : null,
      capaFilas('Income on record', (get(fh, 'profile.incomes') || []).map(i => fila(`${INGRESO[i.type] || i.type}${E.fam.pl && i.owner ? ' · ' + i.owner.join(', ') : ''}`, `${M(Math.round(i.yearly))} a year, ${i.starts}–${i.ends}`))),
    ]),
  });

  // ---------------------------------------------------------------- Universidad
  const ed = R.educationSavings || {};
  if (ed.doTheyHaveEducationFundingGoals) {
    const egap = ed.totalGAP || 0, gs = ed.goalsSummary || [];
    puntos.push({
      id: 'universidad', nombre: 'College', icon: 'cap', sub: `What’s missing for ${ki.length ? lista(ki.map(x => x.first_name)) + '’s ' : ''}education`.trim(),
      cifra: egap > 0 ? Mk(egap) : 'Covered', cifraLab: egap > 0 ? 'short for college' : 'college is covered', estado: egap > 0 ? (ed.current529AccountsBalance > 0 ? 'mid' : 'low') : 'hi',
      titular: egap > 0 ? `${ed.current529AccountsBalance > 0 ? `There is ${M(ed.current529AccountsBalance)} in 529 accounts` : 'Nothing is saved in 529 accounts'} and ${M(Math.round(egap))} is missing.` : 'College is covered.',
      conexiones: ['Emergency fund', 'Savings', 'impuestos'],
      kpis: filas([k('Gap', egap > 0 ? Mk(egap) : null, 'in today’s dollars', 'coste'), k('Save per year', ed.totalRequiredExtraSavings > 0 ? M(Math.round(ed.totalRequiredExtraSavings)) : null, `and raise it ${P(ed.savingsIncrease)} each year`),
        k('In 529 accounts', M(ed.current529AccountsBalance || 0), ed.annualSavingsGoingTo529Accounts ? `${M(ed.annualSavingsGoingTo529Accounts)} a year` : 'no contributions'), ...gs.map(g => k(g.goalName.replace('College ', ''), String(anio(g.date)), `starts in ${dec(g.yearsToStart, 1)} years`))]),
      graf: gs.length ? { tipo: 'barras', titulo: 'Gap per child', items: gs.map(g => ({ lab: g.goalName.replace('College ', ''), v: g.totalGAP, txt: `gap ${M(Math.round(g.totalGAP))}`, tono: g.totalGAP > 0 ? 'coste' : 'bueno' })), leyenda: { coste: 'Gap', bueno: 'Covered' } } : null,
      lectura: filas([...gs.map(g => `${g.goalName.replace('College ', '')} (${g.kidsAge}) starts college in ${b(fecha(g.date))}. Saved so far: ${M(g.accountBalance || 0)}; ${b(M(Math.round(g.totalGAP)))} is missing.`),
        ed.totalRequiredExtraSavings > 0 ? `To get there, you’d need to save about ${b(M(Math.round(ed.totalRequiredExtraSavings)))} more a year, rising ${P(ed.savingsIncrease)} each year. That’s a first-year figure.` : null,
        isNum(ed.expectedPerformance) ? `The calculation assumes that money earns ${P(ed.expectedPerformance, 2)} a year.` : null]),
      asesor: egap > 0 ? 'How much to save for college without taking money from everything else, and in which account.' : '',
      capas: filas([tabla('Each child, in detail', ['', ...gs.map(g => g.goalName.replace('College ', ''))], [
        ['Age today', ...gs.map(g => String(g.kidsAge))], ['Starts', ...gs.map(g => fecha(g.date))], ['Termina', ...gs.map(g => fecha(g.termDate))], ['Years until it starts', ...gs.map(g => dec(g.yearsToStart, 1))],
        ['Yearly cost of the goal', ...gs.map(g => M(g.goalAmount))], ['What’s needed (today’s dollars)', ...gs.map(g => M(Math.round(g.goalRequiredAmountAtToday)))], ['Saved', ...gs.map(g => M(g.accountBalance || 0))],
        ['Current yearly contribution', ...gs.map(g => M(g.accountSavings || 0))], ['Gap', ...gs.map(g => M(Math.round(g.totalGAP)))], ['Saving needed per year', ...gs.map(g => M(Math.round(g.requiredSavings)))],
        ['Extra saving per year', ...gs.map(g => M(Math.round(g.requiredExtraSavings)))], ['What the savings earn', ...gs.map(g => M(Math.round(g.expectedCapitalizationAmount)))], ['Share of the total', ...gs.map(g => P(g.weight))]]),
        capaFilas('Totales', [fila('College goals, per year', M(ed.totalEducationGoalsAmount)), fila('Total needed (today’s dollars)', M(Math.round(ed.totalEducationGoalRequiredAmountAtToday))), fila('In 529 accounts', M(ed.current529AccountsBalance || 0)),
          fila('Yearly contribution to 529s', M(ed.annualSavingsGoingTo529Accounts || 0)), fila('Gap', M(Math.round(egap))), fila('Saving needed per year', M(Math.round(ed.totalRequiredSavings))), fila('Extra saving per year', M(Math.round(ed.totalRequiredExtraSavings))),
          fila('Yearly increase in saving', P(ed.savingsIncrease)), fila('Assumed return', P(ed.expectedPerformance, 2))])]),
    });
  }

  // ---------------------------------------------------------------- A dónde va cada dólar
  const cf = km.cashflowStatement || {}, out = (get(cf, 'outflows.items') || []), ins = get(cf, 'inflows') || {}, free = cf.freeCashflow || {};
  const cr = get(iak, 'savingsAndContributions.cashflowReconciliation') || {}, cs = get(iak, 'savingsAndContributions.currentSavings') || {};
  const fiable = get(iak, 'savingsAndContributions.savingsCapacity.savingsCapacityReliable') !== false;
  const sr = cs.currentSavingsRate, estF = !isNum(sr) ? 'neutro' : sr >= 0.2 && (free.total || 0) >= 0 ? 'hi' : sr >= 0.1 ? 'mid' : 'low';
  const porPersona = E.fam.pl && ad.length > 1;
  const col = it => porPersona ? [Mk(it.client), Mk(it.coClient), Mk(it.joint), Mk(it.total)] : [Mk(it.total)];
  const cabF = porPersona ? ['', nom('client'), nom('coClient'), 'Conjunto', 'Total'] : ['', 'Per year'];
  puntos.push({
    id: 'flujo', nombre: 'Where every dollar goes', icon: 'chart', sub: 'From paycheck to taxes, home, debt, savings and spending',
    cifra: isNum(sr) ? P(sr) : '—', cifraLab: 'of what you earn goes to savings', estado: estF,
    titular: `Of ${M(ins.total)} a year, ${M(Math.round(get(out.find(o => o.name === 'Taxes') || {}, 'total') || 0))} goes to taxes and ${(free.total || 0) >= 0 ? `${M(Math.round(free.total || 0))} is left over` : `${M(Math.round(-free.total))} is missing to balance the year`}${fiable ? '' : ' (low-confidence figure)'}.`,
    conexiones: ['Savings', 'Debt', 'impuestos'],
    kpis: filas([k('Income', Mk(ins.total), 'a year, gross'), k('Taxes', Mk(cr.totalTaxes), `effective rate ${P(cr.effectiveTaxRate, 1)}`), k('Savings', isNum(sr) ? P(sr, 1) : null, M(cs.reportedAnnualSavings) + ' a year', estF === 'hi' ? 'bueno' : ''),
      k((free.total || 0) >= 0 ? 'Left over' : 'Gap', Mk(Math.abs(free.total || 0)), fiable ? 'a year' : 'estimated: expenses may be underreported', fiable && free.total >= 0 ? 'bueno' : 'coste')]),
    graf: out.length ? { tipo: 'flujo', titulo: `How ${M(ins.total)} a year is split`, total: ins.total, grupos: out.filter(o => o.total > 0).map(o => ({ lab: FLUJO[o.name] || o.name, v: o.total, partes: (o.items || []).filter(i => i.total > 0).map(i => ({ lab: FLUJO[i.name] || i.name, v: i.total })) })).concat(free.total > 0 ? [{ lab: 'Left over', v: free.total, partes: [], sobra: true }] : []) } : null,
    lectura: filas([
      `${b(M(ins.total))} comes in each year${porPersona ? ` (${nom('client')} ${M(ins.client)}, ${nom('coClient')} ${M(ins.coClient)})` : ''}. Taxes take ${b(M(Math.round(cr.totalTaxes)))}, ${P(cr.effectiveTaxRate, 1)}.`,
      isNum(sr) ? `You save ${b(P(sr, 1))} of what you earn, ${M(cs.reportedAnnualSavings)} a year including the employer’s part. 20% is the usual benchmark.` : null,
      isNum(free.total) ? (free.total >= 0 ? `At the end of the year, ${b(M(Math.round(free.total)))} is left over.` : `At the end of the year you’re ${b(M(Math.round(-free.total)))} short: more is spent and saved than comes in.`) : null,
      cr.expensesLikelyUnderstated ? `Heads up: reported expenses (${M(Math.round(cr.reportedAnnualExpenses))} a year) look low. Based on net income and savings, real spending would be around ${b(M(Math.round(cr.impliedTrueExpenses)))}; that’s why what’s left over is a low-confidence figure.` : null,
    ]),
    asesor: cr.expensesLikelyUnderstated ? 'Confirm your real day-to-day spending: the whole plan rests on that figure.' : '',
    capas: filas([
      tabla('What comes in', cabF, [['Sueldos', ...col(ins)]]),
      tabla('What goes out, line by line', cabF, out.flatMap(o => [[b(FLUJO[o.name] || o.name), ...col(o)], ...(o.items || []).map(i => ['· ' + (FLUJO[i.name] || i.name), ...col(i)])]).concat([[b('Left over'), ...col(free)]])),
      capaFilas('Cash flow reconciliation from the analysis', [fila('Gross income', M(cr.grossIncome)), fila('Taxes', M(Math.round(cr.totalTaxes))), fila('Effective tax rate', P(cr.effectiveTaxRate, 2)), fila('Estimated net income', M(Math.round(cr.estimatedNetIncome))),
        fila('Reported savings', M(cr.reportedAnnualSavings)), fila('Reported debt payments', M(cr.reportedAnnualDebtService)), fila('Reported expenses', M(Math.round(cr.reportedAnnualExpenses))), fila('Spending that leaves the accounts', M(Math.round(cr.impliedTrueExpenses))),
        fila('Difference', `${M(Math.round(cr.cashFlowDelta))} (${P(cr.cashFlowDeltaPctOfEstimatedNetIncome, 1)} of net income)`), fila('Expenses likely underreported?', cr.expensesLikelyUnderstated ? 'Yes' : 'No')], 'If reported expenses don’t add up against income, taxes and savings, the analysis marks the spending and surplus figures as low-confidence.'),
    ]),
  });

  // ---------------------------------------------------------------- Impuestos y cuentas
  const toc = get(iak, 'savingsAndContributions.taxOpportunityCheck') || {}, buckets = (toc.annualTaxSavingsByBucket || []).slice(1);
  const ahorroFiscal = buckets.reduce((s, r) => s + (isNum(r[5]) ? r[5] : 0), 0), hsa = toc.hsaCheck || {}, ptr = toc.preTaxVsRothCheck || {};
  const waterfall = (get(iak, 'savingsAndContributions.savingsWaterfall') || []).slice(1);
  const accts = get(fh, 'profile.accounts') || [], td = get(iak, 'taxDragAnalysis') || {}, roll = (td.householdRollup || []).slice(1);
  const ROLL = { 'Total annual tax cost (Table 2)': 'Taxes per year on investments in taxable accounts', 'Money-market drag routed to Cash sub-task': 'Of which, from money market funds (counted in Cash)', 'In-scope tax cost (Table 2 ex-MM)': 'Tax cost analyzed (excluding money market)', 'Total annual tax cost saved (Table 3)': 'Taxes saved per year by holding funds in tax-free accounts', 'Total annual tax cost deferred (Table 4)': 'Taxes deferred per year in tax-deferred accounts (paid on withdrawal)', 'NIIT contribution to Table 2': 'Of which, Net Investment Income Tax (NIIT)' };
  const taxable = (td.taxableAccountDetails || []), tdHead = taxable[0] || [];
  const matriz = {}; accts.forEach(a => { const o = (a.owner || []).length > 1 ? 'Conjunto' : (a.owner || ['—'])[0], f = FISCAL[a.tax_treatment] || a.tax_treatment; matriz[o] = matriz[o] || {}; matriz[o][f] = (matriz[o][f] || 0) + a.balance; });
  const fcols = Object.values(FISCAL).filter(f => Object.values(matriz).some(m => m[f]));
  puntos.push({
    id: 'impuestos', nombre: 'Taxes & accounts', icon: 'coins', sub: 'Tax-advantaged room still unused',
    cifra: ahorroFiscal > 0 ? M(Math.round(ahorroFiscal)) : 'No room left', cifraLab: ahorroFiscal > 0 ? 'in taxes a year that could be saved' : 'tax-advantaged accounts are being used', estado: ahorroFiscal > 0 ? 'mid' : 'hi',
    titular: ahorroFiscal > 0 ? `Using the room in ${lista(buckets.filter(r => r[5] > 0).map(r => BUCKET[r[1]] || r[1]))}, you’d pay about ${M(Math.round(ahorroFiscal))} less in taxes a year.` : 'There’s no meaningful tax room left to use.',
    conexiones: ['flujo', 'jubilacion', 'cartera'],
    kpis: filas([k('Possible tax savings', ahorroFiscal > 0 ? M(Math.round(ahorroFiscal)) : null, 'a year', 'bueno'), k('Marginal bracket', P(ptr.currentTaxBracket), `in retirement, ${P(ptr.expectedTaxBracketInRetirement, 1)}`),
      ...buckets.filter(r => r[4] > 0).map(r => k(BUCKET[r[1]] || r[1], Mk(r[4]), 'of unused room a year'))]),
    graf: buckets.length ? { tipo: 'barras', titulo: 'Yearly contribution: what goes in and the maximum', items: buckets.map(r => ({ lab: BUCKET[r[1]] || r[1], v: r[2] || 0, ref: r[3] || 0, txt: `${M(r[2] || 0)} of ${M(r[3] || 0)}`, tono: (r[2] || 0) < (r[3] || 0) ? 'coste' : 'bueno' })), leyenda: { coste: 'Room left', bueno: 'Maxed out' } } : null,
    lectura: filas([...buckets.filter(r => r[4] > 0).map(r => `${BUCKET[r[1]] || r[1]}: today ${M(r[2] || 0)} a year, up to ${M(r[3])} allowed${isNum(r[5]) ? `; it would save about ${b(M(r[5]))} in taxes a year` : ''}.`),
      !hsa.hasHsa && hsa.maxContribution ? `The health savings account (HSA) only works if your health plan allows it; check that first.` : null,
      isNum(ptr.taxDeferredAccountBalance) ? `There is ${M(ptr.taxDeferredAccountBalance)} in tax-deferred accounts${ptr.rothConversionWindowYears ? `; a ${ptr.rothConversionWindowYears}-year window remains to convert part of it to Roth` : ''}.` : null,
      roll.length ? `Investments in taxable accounts cost about ${b(M(Math.round(roll[0][1])))} a year in taxes.` : null]),
    asesor: ahorroFiscal > 0 ? 'Which accounts to fill first, and how much fits in the real budget.' : '',
    capas: filas([
      fcols.length ? tabla('Account map: whose it is and how it’s taxed', ['', ...fcols, 'Total'], Object.entries(matriz).map(([o, m]) => [o, ...fcols.map(f => m[f] ? Mk(m[f]) : '—'), Mk(Object.values(m).reduce((s, v) => s + v, 0))])) : null,
      tabla('All accounts', ['Account', 'Owner', 'Tax treatment', 'Balance', 'Yearly contribution', 'Employer'], accts.map(a => [CUENTA[a.account_type] || a.account_type, (a.owner || []).join(', '), FISCAL[a.tax_treatment] || a.tax_treatment, M(a.balance), M(a.yearly_contribution_total || 0), M(a.yearly_employer_match || 0)])),
      tabla('Tax room per account', ['Account', 'Today', 'Maximum', 'Room', 'Tax savings'], buckets.map(r => [BUCKET[r[1]] || r[1], M(r[2] || 0), M(r[3] || 0), M(r[4] || 0), isNum(r[5]) ? M(r[5]) : '—']), `Tax savings at the current marginal bracket (${P(ptr.currentTaxBracket)}).`),
      capaFilas('Health savings account (HSA)', [fila('Has one?', hsa.hasHsa ? 'Yes' : 'No'), fila('Balance', M(hsa.hsaBalance || 0)), fila('Current contribution', M(hsa.currentContributions || 0)), fila('Yearly maximum', M(hsa.maxContribution)), fila('Room', M(hsa.contributionGap)), fila('Tax savings per year', M(hsa.annualTaxSavingsAtCurrentMarginal)),
        fila(`Years until Medicare${porPersona ? ' · ' + nom('client') : ''}`, hsa.clientYearsToMedicare), porPersona ? fila(`Years until Medicare · ${nom('coClient')}`, hsa.coClientYearsToMedicare) : null]),
      capaFilas('Pre-tax or after-tax (Roth)', [fila('Marginal bracket today', P(ptr.currentTaxBracket)), fila('Expected bracket in retirement', P(ptr.expectedTaxBracketInRetirement, 2)), fila('Tax-deferred balance', M(ptr.taxDeferredAccountBalance)), fila('Threshold the analysis watches', M(ptr.taxDeferredBalanceThreshold)),
        fila('Roth conversion window (years)', ptr.rothConversionWindowYears), fila('Years withdrawing more than required (RMD)', ptr.yearsPayingMoreRmdsThanRequired)]),
      tabla('The order in which to put each dollar', ['#', 'Step', 'Today', 'Target', 'Status'], waterfall.map(r => [String(r[0]), CASCADA[r[1]] || r[1], isNum(r[2]) ? M(r[2]) : ESTADO_CASCADA[r[2]] || String(r[2] || ''), isNum(r[3]) ? M(r[3]) : '—', ESTADO_CASCADA[r[4]] || (r[2] === 'N/A' ? 'N/A' : String(r[4] || '—'))]), 'This is the analysis’s savings waterfall: first the reserve and insurance, then high-interest debt, then tax-advantaged accounts.'),
      capaFilas('Tax cost of investments', roll.map(r => fila(ROLL[r[0]] || r[0], M(r[1])))),
      taxable.length > 1 ? tabla('What generates taxes in taxable accounts', ['Account', 'Fund', 'Balance', 'Income type', 'Tax per year'], taxable.slice(1).map(r => [String(r[1]), String(r[2]), M(r[3]), COMPONENTE[r[4]] || String(r[4]), isNum(r[tdHead.length - 1]) ? M(r[tdHead.length - 1]) : '—'])) : null,
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
    id: 'cartera', nombre: 'How the portfolio has performed', icon: 'stack', sub: 'The last 3 years, against a benchmark portfolio',
    cifra: isNum(H.return3yAnnualized) ? P(H.return3yAnnualized, 1) : '—', cifraLab: `a year over 3 years${isNum(B.return3yAnnualized) ? ` (benchmark ${P(B.return3yAnnualized, 1)})` : ''}`, estado: estC,
    titular: desv != null ? `Investments are ${P(g0.currentEquityPct)} in stocks; the ${PERFIL[g0.targetProfile] || g0.targetProfile} profile calls for ${P(g0.targetEquityPct)}.` : 'Portfolio return, risk and mix.',
    conexiones: ['Investments', 'impuestos', 'Emergency fund'],
    kpis: filas([k('Return', P(H.return3yAnnualized, 1), `a year; benchmark ${P(B.return3yAnnualized, 1)}`, tras != null && tras < 0 ? 'coste' : 'bueno'), k('Volatility', P(H.volatility3y, 1), `a year; benchmark ${P(B.volatility3y, 1)}`),
      k('Worst drop', isNum(H.maxDrawdown3y) ? P(Math.abs(H.maxDrawdown3y), 1) : null, H.maxDrawdownRecoveryDays ? `recovered in ${H.maxDrawdownRecoveryDays} days` : '', 'coste'), k('In stocks (of investments)', P(g0.currentEquityPct), `target ${P(g0.targetEquityPct)}`, desv != null && Math.abs(desv) >= 0.1 ? 'coste' : '')]),
    graf: filasAsig.length && (ts.rows || []).length ? { tipo: 'pares', titulo: 'Today’s mix and the one the analysis proposes', series: ['Today', 'Proposed'], items: Object.keys(CLASE).map(c => { const a = (filasAsig.find(r => r.label === c) || {}).weight || 0, z = ((ts.rows || []).find(r => r.label === c) || {}).weight || 0; return { lab: CLASE[c], a: Math.max(0, a), b: Math.max(0, z) }; }).filter(x => x.a > 0.004 || x.b > 0.004) } : null,
    graf2: envC.length ? { tipo: 'pares', titulo: 'How it would have done in real markets', series: ['Today', 'Proposed'], signo: true, items: envC.filter(e => e.type === 'historical').map(e => ({ lab: ENTORNO[e.name] || e.name, a: e.performance, b: (envT.find(x => x.name === e.name) || {}).performance })) } : null,
    lectura: filas([
      isNum(H.return3yAnnualized) ? `In the 3 years to ${fecha(get(pa, 'window.endDate'))}, the household portfolio returned ${b(P(H.return3yAnnualized, 1) + ' a year')} (${P(H.return3yCumulative, 1)} in total). A benchmark portfolio with the same mix returned ${P(B.return3yAnnualized, 1)} a year.` : null,
      isNum(H.upsideCapture3y) ? `When the market rises, it captures ${b(dec(H.upsideCapture3y, 2) + ' times')} what the benchmark does; when it falls, it loses ${b(dec(H.downsideCapture3y, 2) + ' times')} as much. Per unit of risk it earns ${dec(H.sharpe3y, 2)} over cash, against ${dec(B.sharpe3y, 2)} for the benchmark.` : null,
      g0.aum ? `Counting cash, only ${P(H.currentEquityPct)} of the total is in stocks; the investments themselves are ${P(g0.currentEquityPct)} in stocks and returned ${P(g0.return3yAnnualized, 1)} a year.` : null,
      conc.topSectorName ? `The largest sector is ${b((SECTOR[conc.topSectorName] || conc.topSectorName))}, at ${P(conc.topSectorPct)} of stocks${conc.isMaterialConcentration ? ': a concentration worth watching' : ''}.` : null,
      apal.length ? `There is a leveraged fund (${apal.map(p => `${p.ticker}, ${M(p.value)} in ${p.account}`).join('; ')}): it amplifies every market move.` : null,
      isNum(get(ts, 'allocation.annualReturn')) ? `The proposal goes from ${b(P(get(as, 'allocation.standardDeviation'), 2))} to ${b(P(get(ts, 'allocation.standardDeviation'), 2))} of yearly volatility, with a backtested return of ${P(get(ts, 'allocation.annualReturn'), 2)} (today ${P(get(as, 'allocation.annualReturn'), 2)}).` : null,
    ]),
    asesor: desv != null && Math.abs(desv) >= 0.1 ? `How much risk you really want${E.fam.pl && ad[1] && ad[0].risk_profile !== ad[1].risk_profile ? ` (${ad[0].first_name} is ${PERFIL[ad[0].risk_profile]}; ${ad[1].first_name} is ${PERFIL[ad[1].risk_profile]})` : ''}, and how to bring the portfolio closer to it.` : 'Whether the current mix still fits your goals.',
    capas: filas([
      capaFilas('Return and risk, household vs. benchmark', [fila('Annualized return (3 years)', `${P(H.return3yAnnualized, 1)} · benchmark ${P(B.return3yAnnualized, 1)}`), fila('Cumulative return (3 years)', `${P(H.return3yCumulative, 1)} · benchmark ${P(B.return3yCumulative, 1)}`),
        fila('Return, last year', `${P(H.return1yAnnualized, 1)} · benchmark ${P(B.return1yAnnualized, 1)}`), fila('Annual volatility', `${P(H.volatility3y, 1)} · benchmark ${P(B.volatility3y, 1)}`), fila('Worst drop', `${P(H.maxDrawdown3y, 1)} · benchmark ${P(B.maxDrawdown3y, 1)}`),
        fila('Days to recover', H.maxDrawdownRecoveryDays), fila('Return per unit of risk (Sharpe)', `${dec(H.sharpe3y, 2)} · benchmark ${dec(B.sharpe3y, 2)}`), fila('Upside capture', dec(H.upsideCapture3y, 2)), fila('Downside capture', dec(H.downsideCapture3y, 2)),
        fila('Volatility drag', isNum(H.volatilityDragDollarsPerYear) ? `${M(Math.round(H.volatilityDragDollarsPerYear))} a year (${dec(H.volatilityDragPpPerYear * 100, 2)} points)` : null), fila('Risk-free rate used', P(pa.riskFreeRate, 2)), fila('Periodo', `${fecha(get(pa, 'window.startDate'))} to ${fecha(get(pa, 'window.endDate'))}`)]),
      isNum(get(pa, 'gapDecomposition.totalGapPp')) ? capaFilas('Where the gap with the benchmark comes from', [fila('Asset allocation (stocks, bonds and cash)', `${PP(get(pa, 'gapDecomposition.assetAllocationGapPp'), 2)} a year (${M(Math.round(get(pa, 'gapDecomposition.assetAllocationGapDollars')))})`), fila('Fund selection', `${PP(get(pa, 'gapDecomposition.productPickingGapPp'), 2)} a year (${M(Math.round(get(pa, 'gapDecomposition.productPickingGapDollars')))})`), fila('Total', `${PP(get(pa, 'gapDecomposition.totalGapPp'), 2)} a year (${M(Math.round(get(pa, 'gapDecomposition.totalGapDollars')))})`)]) : null,
      tabla('Each invested account', ['Account', 'Balance', 'Return / yr', 'Volatility', 'Sharpe'], gg.flatMap(g => g.accounts || []).map(a => [a.name, M(a.balance), P(a.return3yAnnualized, 1), P(a.volatility3y, 1), dec(a.sharpe3y, 2)])),
      ...gg.map(g => capaFilas(`Long-term investments (${g.accountCount} accounts)`, [fila('Balance', M(g.aum)), fila('Target profile', PERFIL[g.targetProfile] || g.targetProfile), fila('In stocks, today and target', `${P(g.currentEquityPct, 1)} → ${P(g.targetEquityPct, 1)}`), fila('In bonds, today and target', `${P(g.currentFixedIncomePct, 1)} → ${P(g.targetFixedIncomePct, 1)}`), fila('Years to goal', g.timeHorizonYears),
        fila('Return per year', P(g.return3yAnnualized, 1)), fila('Volatility', P(g.volatility3y, 1)), fila('Benchmark at the current mix', g.benchmarkAtCurrentAlloc ? `${P(g.benchmarkAtCurrentAlloc.return3yAnnualized, 1)} a year, volatility ${P(g.benchmarkAtCurrentAlloc.volatility3y, 1)}` : null), fila('Benchmark at the target mix', g.benchmarkAtTargetAlloc ? `${P(g.benchmarkAtTargetAlloc.return3yAnnualized, 1)} a year, volatility ${P(g.benchmarkAtTargetAlloc.volatility3y, 1)}` : null)])),
      tabla('Mix by asset class', ['', 'Today', 'Proposed'], Object.keys(CLASE).map(c => [CLASE[c], P(Math.max(0, (filasAsig.find(r => r.label === c) || {}).weight || 0)), P(Math.max(0, ((ts.rows || []).find(r => r.label === c) || {}).weight || 0))]).concat([['Backtested return per year', P(get(as, 'allocation.annualReturn'), 2), P(get(ts, 'allocation.annualReturn'), 2)], ['Volatility', P(get(as, 'allocation.standardDeviation'), 2), P(get(ts, 'allocation.standardDeviation'), 2)], ['Average fund cost', P((as.rows || []).find(r => r.label === 'Weighted avg ER')?.weight, 2), '—']]), '3-year backtest with today’s weights; not actual results.'),
      tabla('Recent crises and rallies: household vs. benchmark', ['Momento', 'Household drop', 'Benchmark drop', 'Days to recover'], (pa.perEventDrawdowns || []).map(e => [EVENTO[e.eventTitle] || e.eventTitle, P(get(e, 'household.drawdownPct'), 1), P(get(e, 'sameRiskBenchmark.drawdownPct'), 1), get(e, 'household.recoveryDays') != null ? String(e.household.recoveryDays) : 'not recovered within the window'])),
      tabla('Real markets: today and proposed', ['Momento', 'Today', 'Proposed'], envC.map(e => [ENTORNO[e.name] || e.name, PP(e.performance, 1), PP((envT.find(x => x.name === e.name) || {}).performance, 1)])),
      tabla('Stock sectors', ['Sector', 'Weight', 'Threshold', 'Level'], (cd.sectorConcentration || []).slice(1).map(r => [SECTOR[r[0]] || r[0], P(r[1], 1), String(r[2]).replace('%', ' %'), r[3] === 'Elevated' ? 'Elevated' : 'Normal'])),
      tabla('Countries and regions', ['Region', 'Weight'], (cd.geographyByRegion || []).slice(1).map(r => [REGION[r[0]] || r[0], P(r[1], 1)])),
      capaFilas('Concentration', [fila('Funds and positions', get(cd, 'totals.holdings')), fila('Equity exposure', M(Math.round(get(cd, 'totals.equityExposure')))), fila('Individual stocks', `${get(cd, 'totals.singleStockPositions') || 0} (${P(get(cd, 'totals.singleStockWeight') || 0)})`), fila('Total investable', M(get(cd, 'totals.investablePortfolioValue')))]),
      tabla('All funds, account by account', ['Account', 'Fund', 'Type', 'Amount', 'Weight in account', 'Annual cost'], pos.map(p => [p.account, `${p.name}${p.ticker ? ' (' + p.ticker + ')' : ''}`, CATEG[p.category] || p.category || '—', M(p.value), P(p.weight_in_account), isNum(p.expense_ratio) ? P(p.expense_ratio, 2) : '—'])),
      tabla('What was happening in the market', ['Etapa', 'From', 'To'], (get(ia, 'analysis.periods') || []).map(p => [p.name, fecha(p.startDate), fecha(p.endDate)]), 'Market phases in the 3-year window, as the analysis names them.'),
    ]),
  });

  // ---------------------------------------------------------------- capas extra de las cinco áreas
  const pr = km.protection || {}, life = pr.lifeInsurance || {}, umb = pr.umbrellaInsurance || {};
  add('Insurance', tabla('All policies', ['Policy', 'Owner', 'Coverage', 'Yearly premium'], (get(fh, 'profile.insurance') || []).map(i => [SEGURO[i.type] || i.type, (i.owner || []).join(', '), isNum(i.coverage) ? M(i.coverage) : 'Yes (no amount)', isNum(i.yearly_premium) ? M(i.yearly_premium) : '—'])));
  add('Debt', tabla('All debts', ['Debt', 'Balance', 'Interest', 'Monthly payment'], (get(fh, 'profile.liabilities') || []).map(l => [`${l.name}${E.fam.pl && l.owner ? ' · ' + l.owner.join(', ') : ''}`, M(l.balance), isNum(l.interest_rate) ? P(l.interest_rate, 1) : '—', isNum(l.monthly_payment) ? M(l.monthly_payment) : '—'])));
  add('Savings', tabla('Savings by account', ['Account', 'Owner', 'Yearly contribution', 'Employer'], accts.filter(a => a.yearly_contribution_total || a.yearly_employer_match).map(a => [CUENTA[a.account_type] || a.account_type, (a.owner || []).join(', '), M(a.yearly_contribution_total || 0), M(a.yearly_employer_match || 0)])));
  add('Emergency fund', tabla('Cash, account by account', ['Account', 'Accessible', 'Balance', 'In cash', 'Earns today', 'Could earn'], (get(iak, 'cashNeeds.currentCashBalance') || []).slice(1).map(r => [String(r[0]), r[1] === 'Accessible' ? 'Yes' : 'No', M(r[2]), M(r[3]), isNum(r[4]) ? P(r[4], 2) : '—', isNum(r[6]) ? P(r[6], 2) : '—'])));
  add('Emergency fund', capaFilas('What the cash earns', ((get(iak, 'cashNeeds.summaryIncome') || []).slice(1)).map(r => fila(({ Liquidity: 'Reserve', 'Excess accessible': 'Accessible excess', 'Excess inaccessible': 'Inaccessible excess', 'Operational buffer': 'Operating cushion', '  Accessible cash': '· accessible', '  Inaccessible cash': '· not accessible', Total: 'Total' })[r[0]] || r[0], `today ${M(Math.round(r[1]))} a year; it could earn ${M(Math.round(r[2]))} (${M(Math.round(r[3]))} lost)`))));

  // ---------------------------------------------------------------- Supuestos del cálculo
  puntos.push({
    id: 'supuestos', nombre: 'How it was calculated', icon: 'help', sub: 'Assumptions, sources and disclosures from the report',
    cifra: P(rs.generalInflation ?? 0.03), cifraLab: 'assumed inflation per year', estado: 'neutro',
    titular: `Projection to age ${rg.clientProfile?.endOfPlanAge || 91}, single scenario, gross of fees.`,
    conexiones: ['jubilacion', 'cartera'],
    kpis: filas([k('Inflation', P(rs.generalInflation ?? 0.03), 'general; healthcare and education 5%'), k('Through age', `${rg.clientProfile?.endOfPlanAge || 91}`, 'life expectancy in the plan'), k('Average return', rs.averagePerformance ? P(rs.averagePerformance, 2) : null, 'assumed for retirement'), k('Period analyzed', `${anio(get(pa, 'window.startDate'))}–${anio(get(pa, 'window.endDate'))}`, 'for the portfolio')]),
    lectura: METODO.textos.slice(0, 3),
    capas: filas([
      capaFilas('Assumed inflation', METODO.inflacion), tabla('Expected return by risk profile', ['Profile', 'Per year'], METODO.perfiles), tabla('Expected return by asset class', ['Asset class', 'Per year'], METODO.clases),
      capaFilas(`Your starting data`, [...ad.map(a => fila(a.first_name, `${a.age}, retiring at ${a.retirement_age}, ${PERFIL[a.risk_profile] || a.risk_profile} profile`)), ...ki.map(c => fila(c.first_name, `${c.age}`)),
        fila('Residence', [get(fh, 'case.city'), get(fh, 'case.state')].filter(Boolean).join(', ')), fila('Tax filing status', ({ MARRIED_FILING_JOINTLY: 'Married filing jointly', SINGLE: 'Single', HEAD_OF_HOUSEHOLD: 'Head of household' })[get(fh, 'case.tax_filing_status')] || get(fh, 'case.tax_filing_status')),
        fila('Risk-free rate', P(pa.riskFreeRate, 2)), fila('Advisory fee applied', P(get(iak, 'portfolioAnalysis.advisoryFee.effectiveAnnualRate') || 0))]),
      { t: 'texto', titulo: 'Method and disclosures', parrafos: METODO.textos },
    ]),
  });

  // Página de la nota: áreas con sus puntos, topes que frenan la nota y cada paso con su efecto.
  const sc = fh.score || {}, PIL = { 'Savings and cash flow': 'Savings', Debt: 'Debt', Investments: 'Investments', 'Liquidity and emergency fund': 'Emergency fund', 'Insurance and protection': 'Insurance' };
  const TOPE = { 'High revolving balance with high APR': 'High revolving balance with high APR', 'Mortality coverage ratio below threshold with dependents': 'Life cover below the minimum, with dependents' };
  const ESF = { low: 'low', medium: 'medium', high: 'high' };
  const notaCapas = filas([
    tabla('The five areas', ['Area', 'Score', 'Points'], (sc.pillars || []).map(x => [PIL[x.pillar] || x.pillar, String(x.score), x.points_shown_in_app])),
    (sc.caps_applied || []).length ? tabla('What caps the score', ['Reason', 'Highest score while it remains'], sc.caps_applied.map(c => [TOPE[c.reason] || c.reason, String(c.score_capped_at)]), 'Until these are resolved, the score can’t go above that cap, even if everything else improves.') : null,
    tabla('Each plan step', ['Step', 'Effort', 'Score', 'Removes a cap'], (E.pasos || []).map(p => [p.titulo, ESF[p.esfuerzo] || p.esfuerzo || '—', `${sc.published_score ?? ''} → ${p.nota}`, p.abre ? 'Yes' : 'No'])),
    capaFilas('The scale', [fila('Published score', sc.published_score), fila('Band', ({ critical: 'critical', vulnerable: 'vulnerable', stable: 'stable', strong: 'strong', excellent: 'excellent' })[sc.band] || sc.band), fila('Scale', sc.scale ? String(sc.scale) : null)]),
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
  return numsEn(es).every(n => set.has(String(n)));
}
// Resumen corto en español de un texto del informe: puntos { c: cifra, t: texto, k: tono }.
// Se descarta entero si alguna cifra no está en el original.
export const TONOS = ['bien', 'mal', 'ojo', 'info', 'rev'];
export function cortoValido(en, pts) {
  if (!Array.isArray(pts) || !pts.length) return 'empty';
  for (const p of pts) {
    if (!p || typeof p.t !== 'string' || !p.t.trim()) return 'point without text';
    if (!TONOS.includes(p.k)) return `unknown tone: ${p.k}`;
    if (!cifrasDentro(en, `${p.c || ''} ${p.t}`)) return `figure not in the original: “${p.c ? p.c + ' ' : ''}${p.t}”`;
  }
  return null;
}
export function cifrasIguales(en, es) {
  const a = numsEn(en).sort((x, y) => x - y), z = numsEs(es).sort((x, y) => x - y);
  const set = new Set(z.map(String));
  return a.every(n => set.has(String(n)));
}
