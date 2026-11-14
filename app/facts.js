/*
 * facts.js — capa de datos.
 * Lee los dos JSON del caso y devuelve SOLO cifras ya sacadas del plan.
 * Regla: ninguna cifra se inventa. Las pocas derivadas (p. ej. 18 % × 18.000 $)
 * se calculan aquí, en código, y llevan su origen en `src`.
 * Si falta una ruta, el getter devuelve null y la pantalla que la usa se oculta.
 */
(function () {
  const CASE = 'timothy-melanie-weah';

  function get(obj, path) {
    try {
      return (path.match(/[^.[\]]+/g) || []).reduce((o, k) => (o == null ? null : o[k]), obj) ?? null;
    } catch (e) { return null; }
  }

  async function loadRaw() {
    if (window.__CASE_DATA__) return window.__CASE_DATA__;
    const base = '../cases/' + CASE + '/';
    const [fh, ia] = await Promise.all([
      fetch(base + 'financial-health.json').then(r => { if (!r.ok) throw new Error('fh'); return r.json(); }),
      fetch(base + 'investment-analysis.json').then(r => { if (!r.ok) throw new Error('ia'); return r.json(); }),
    ]);
    return { fh, ia };
  }

  const SCEN = {
    'Global Financial Crisis': 'Crisis financiera de 2008',
    'Global Equity Sell-off': 'Caída de bolsa de 2018',
    'COVID-19 Pandemic Crash': 'Caída por la COVID-19 en 2020',
  };

  function build({ fh, ia }) {
    const g = p => get(fh, p);
    const gi = p => get(ia, p);
    const hh = g('case.household') || [];
    const adults = hh.filter(p => p.role !== 'child');
    const kids = hh.filter(p => p.role === 'child');

    const card = (g('profile.liabilities') || []).find(l => /CREDIT_CARD/.test(l.type)) || {};
    const cc = g('key_metrics.debtManagement.creditCardDebt') || {};
    const moves = g('score.top_moves') || [];
    const combined = g('score.combined_moves') || [];
    const cardMove = moves[0] || {};
    const firstStep = card.balance != null && cardMove.target_amount != null ? card.balance - cardMove.target_amount : null;

    const lifeBasics = g('key_metrics.protection.lifeInsurance.lifeInsuranceCoverageBasics') || {};
    const lifeRec = g('key_metrics.protection.lifeInsurance.lifeInsuranceCoverageRecommendations') || {};
    const lifeGaps = g('key_metrics.protection.lifeInsurance.lifeInsuranceCoverageGapsAndExcess') || {};
    const expYear = g('key_metrics.ratios.investableAssetLevel.annualExpenses');
    const lifeNow = (lifeBasics.lifeInsuranceAmountClient || 0) + (lifeBasics.lifeInsuranceAmountCoClient || 0);
    const lifeMin = (lifeRec.clientMinRecommendedCoverage || 0) + (lifeRec.coClientMinRecommendedCoverage || 0);

    const cashAcc = (g('profile.accounts') || []).find(a => /Checking|Cash/i.test(a.account_type + a.name)) || {};
    const cashRate = gi('key_metrics.cashNeeds.currentCashBalance[1][4]');
    const cashFacts = g('key_metrics.facts.cash') || {};

    const goals = g('goals.chartGoals') || [];
    const goalSum = g('goals.goalsSummary') || [];
    const car = goals.find(x => x.subType === 'VEHICLE_PURCHASE');
    const home = goals.find(x => x.subType === 'REAL_ESTATE_PURCHASE');
    const carAmt = (goalSum.find(x => x.subType === 'VEHICLE_PURCHASE') || {}).amount ?? null;
    const homeAmt = (goalSum.find(x => x.subType === 'REAL_ESTATE_PURCHASE') || {}).amount ?? null;
    const colleges = goals.filter(x => x.goalType === 'COLLEGE');

    const yearly = g('projections.yearly') || [];
    const lastYear = yearly.length ? yearly[yearly.length - 1] : null;
    const retireGoal = goals.filter(x => x.goalType === 'RETIREMENT').map(x => +x.date.slice(0, 4));
    const retireYear = retireGoal.length ? Math.max(...retireGoal) : null;
    const atRetire = yearly.find(y => y.year === retireYear) || null;

    const group = gi('key_metrics.performanceAnalysis.goalGroups[0]') || {};
    const sectors = gi('key_metrics.concentrationAndDiversification.sectorConcentration') || [];
    const tech = sectors.find(r => r[0] === 'Technology');
    const upro = (gi('positions') || []).find(p => p.ticker === 'UPRO');
    const alloc = gi('analysis.summary.assetAllocation') || {};

    const accounts = (g('profile.accounts') || []).map(a => ({
      name: a.name, type: a.account_type, tax: a.tax_treatment, balance: a.balance,
      owner: (a.owner || []).join(' y '), contrib: a.yearly_contribution_client, match: a.yearly_employer_match,
    }));
    const debts = (g('profile.liabilities') || []).map(l => ({ name: l.name, type: l.type, balance: l.balance, rate: l.interest_rate, monthly: l.monthly_payment }));
    const insurance = g('profile.insurance') || [];
    const disability = insurance.filter(i => i.type === 'LONG_TERM_DI');

    const nw = g('key_metrics.netWorthStatement') || {};

    return {
      planDate: '2026-11-09',
      family: 'Weah',
      a: adults[0] ? { name: adults[0].first_name, age: adults[0].age, retire: adults[0].retirement_age, risk: adults[0].risk_profile } : null,
      b: adults[1] ? { name: adults[1].first_name, age: adults[1].age, retire: adults[1].retirement_age, risk: adults[1].risk_profile } : null,
      kids: kids.map(k => ({ name: k.first_name, age: k.age })),
      city: g('case.city'),

      card: {
        issuer: (card.name || '').replace(/\s*CC$/, '') || null,
        balance: card.balance ?? null,
        apr: card.interest_rate ?? null,
        payMonth: card.monthly_payment ?? cc.ccMonthlyPayment ?? null,
        interestMonth: cc.ccPaymentEqualToInterestRate ?? null,
        costYear: card.balance != null && card.interest_rate != null ? Math.round(card.balance * card.interest_rate) : null,
        payoff: cc.ccPayoffDate ? cc.ccPayoffDate.slice(0, 7) : null,
        src: 'profile.liabilities[0] · key_metrics.debtManagement.creditCardDebt',
      },
      firstStep: { amount: firstStep, remaining: cardMove.target_amount ?? null, src: 'score.top_moves[0]' },

      cash: {
        balance: cashAcc.balance ?? null,
        rate: cashRate,
        yieldYear: cashAcc.balance != null && cashRate != null ? Math.round(cashAcc.balance * cashRate) : null,
        accessible: get(cashFacts, 'accessibleCash.value'),
        months: +get(cashFacts, 'monthsCovered.value') || null,
        reserveMin: get(cashFacts, 'emergencyReserve.min'),
        reserveMax: get(cashFacts, 'emergencyReserve.max'),
        aboveAll: get(cashFacts, 'cashAboveTotalNeeded.value'),
        vacation: get(cashFacts, 'nearTermGoals[0].value'),
        src: 'key_metrics.facts.cash',
      },

      life: {
        nowA: lifeBasics.lifeInsuranceAmountClient ?? null, nowB: lifeBasics.lifeInsuranceAmountCoClient ?? null,
        minA: lifeRec.clientMinRecommendedCoverage ?? null, minB: lifeRec.coClientMinRecommendedCoverage ?? null,
        gapA: lifeGaps.clientShortfall ?? null, gapB: lifeGaps.coClientShortfall ?? null,
        now: lifeNow || null, min: lifeMin || null, expYear,
        yearsNow: expYear ? lifeNow / expYear : null,
        yearsMin: expYear ? lifeMin / expYear : null,
        targetA: (moves[1] || {}).target_amount ?? null,
        targetB: (() => { const n = ((combined[1] || {}).note || '').match(/\$([\d,]+)/); return n ? +n[1].replace(/,/g, '') : null; })(),
        src: 'key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses',
      },
      umbrella: {
        rec: g('key_metrics.ratios.umbrella.recommendedCoverage'),
        current: g('key_metrics.ratios.umbrella.currentCoverage'),
        netWorthExposed: g('key_metrics.protection.umbrellaInsurance.assetExposed.netWorth'),
        src: 'key_metrics.ratios.umbrella',
      },
      disability: { count: disability.length, recorded: disability.some(d => typeof d.coverage === 'number') },

      score: {
        now: g('score.published_score'),
        uncapped: null,
        pillars: g('score.pillars') || [],
        caps: g('score.caps_applied') || [],
        moves: moves.map(m => ({ title: m.title, effort: m.effort, after: m.score_after, before: m.score_before, target: m.target_amount, liftsCap: m.lifts_a_cap })),
        combined: combined.map(c => ({ moves: c.moves, after: c.score_after })),
        src: 'score',
      },

      education: {
        gap: g('key_metrics.facts.education.fundingGap.value'),
        extraYear: g('key_metrics.facts.education.extraYearlySaving.value'),
        starts: colleges.map(c => ({ name: c.name.replace('College ', ''), date: c.date.slice(0, 7) })),
        src: 'key_metrics.facts.education',
      },
      retirement: {
        year: retireYear,
        coverPct: g('key_metrics.retirementAndOtherGoals.incomeVsIncomeNeeds.allIncomesVsIncomeNeededExLtcCosts'),
        leftAtEnd: g('key_metrics.facts.retirement.savingsLeftAtPlanEnd.value'),
        gap: g('key_metrics.protection.emergencyFund.retirementAndEducationGaps.retirementGap'),
        savingsRate: g('key_metrics.ratios.savingsLevel.ratio'),
        savingsYear: g('key_metrics.ratios.savingsLevel.savingAmount'),
        matchA: (accounts.find(a => a.owner === (adults[0] || {}).first_name && a.match) || {}).match ?? null,
        matchB: (accounts.find(a => a.owner === (adults[1] || {}).first_name && a.match) || {}).match ?? null,
        netWorthAtRetireToday: atRetire ? atRetire.net_worth_todays_dollars : null,
        src: 'key_metrics.facts.retirement · ratios.savingsLevel',
      },
      goals: {
        car: car ? { amount: carAmt, date: car.date.slice(0, 7) } : null,
        home: home ? { amount: homeAmt, date: home.date.slice(0, 7) } : null,
        vacation: get(cashFacts, 'nearTermGoals[0].value'),
      },
      portfolio: {
        invested: group.aum ?? null,
        equityNow: group.currentEquityPct ?? null,
        equityTarget: group.targetEquityPct ?? null,
        targetProfile: group.targetProfile ?? null,
        tech: tech ? tech[1] : null,
        upro: upro ? upro.value : null,
        allocNow: alloc.currentEFC || null,
        allocTarget: alloc.targetEFC || null,
        accounts,
        src: 'investment-analysis.json · key_metrics.performanceAnalysis.goalGroups[0]',
      },
      scenarios: (gi('key_metrics.portfolioAnalysis.marketEnvironments') || []).filter(e => e.type === 'historical').map(e => {
        const t = (gi('key_metrics.targetAnalysis.marketEnvironments') || []).find(x => x.name === e.name);
        return { name: SCEN[e.name] || e.name, now: e.performance, target: t ? t.performance : null };
      }).filter(e => e.now < 0 && e.target != null),
      debts,
      netWorth: g('key_metrics.protection.umbrellaInsurance.assetExposed.netWorth'),
      projection: yearly.map(y => ({ year: y.year, today: y.net_worth_todays_dollars, debts: y.total_debts })),
      projectionEnd: lastYear ? { year: lastYear.year, nominal: lastYear.net_worth, today: lastYear.net_worth_todays_dollars } : null,
      _nw: nw,
    };
  }

  window.Facts = { load: async () => build(await loadRaw()), get };
})();
