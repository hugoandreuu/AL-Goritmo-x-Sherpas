# Study: Daniel and Emily Johnson

- Case: `daniel-emily-johnson`
- Data: `cases/` files (the same JSON the MCP serves)
- Phrases: written by the Sherpas LLM (`gpt-5-mini`, on 2026-11-14), with figure checks
- Generated: 2026-11-18

## What the LLM reads about this family

Daniel and Emily are driven above all by protecting the kids and having a liquid emergency fund. They worry about how much their insurance covers and how long their cash lasts before they have to touch it.

Why this order: We start with protection, then liquidity, the cost of the debt, and we close with the news about retirement.

## Score

Today 52 out of 100. With the plan’s steps, 60.

| Area | Score |
|---|---|
| Savings | 54 |
| Debt | 76 |
| Investments | 51 |
| Emergency fund | 85 |
| Insurance | 0 |

## Questions, in order

### 1. If something happened to one of you, how many years of household expenses would Oliver (11) and Sophia (9) have covered?

- Plan figure: **about 3 years** of household expenses (bad news)
- Source: `key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses`. Our calculation: life cover today ÷ household expenses per year
- If they get it right: “You were close. Look how far it goes.”
- If the figure is higher than they said: “A bit more, but far from what’s needed.”
- If it’s lower: “Much less than you thought.”
- To make them feel it: Today you have about **3 years** of household expenses covered. With that, Oliver, at 11, would be protected until 14; Sophia would have part of her childhood covered.
- Way out: It can be fixed, and that’s for your advisor: they bring the quotes.
- Written by the LLM: q, siente

### 2. If your income stopped tomorrow, how many months of essential expenses does your cash cover?

- Plan figure: **1.4 months** of essential expenses (bad news)
- Source: `key_metrics.facts.cash`
- If they get it right: “You knew it. Look at what the plan recommends.”
- If the figure is higher than they said: “A bit more than you thought, but short of what’s recommended.”
- If it’s lower: “Less than you thought.”
- To make them feel it: Your accessible cash covers only **1.4 months** of essential expenses. At that level, a pause in income would leave you exposed and complicate the planned vacation.
- Way out: Your plan proposes bringing that emergency fund closer to what’s recommended. How is something to go over with your advisor.
- Written by the LLM: q, siente

### 3. You pay $450 a month on your credit card. How much of that goes to interest?

- Plan figure: **$374** of every $450 goes to interest (bad news)
- Source: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Our calculation: $374 of $450, rounded to one decimal
- If they get it right: “You knew it. Look where it goes.”
- If the figure is higher than they said: “That’s {dif} more a month than you thought.”
- If it’s lower: “Less than you feared. Even so, look where it goes.”
- To make them feel it: Of the $450 you pay each month, **$374** goes to interest. That way the debt barely goes down and the cost of credit weighs heavily on the cash you have available.
- Way out: Your report flags it as your most expensive debt. How to raise the payment is something to go over with your advisor.
- Written by the LLM: q, siente

### 4. Do you have enough to retire at 62 and 60 and live on it?

- Plan figure: **Yes, it’s enough** and $260,272 is left at the end of the plan (bad news)
- Source: `key_metrics.facts.retirement`
- If they get it right: “That’s right. You’ll make it.”
- If the figure is higher than they said: “Better than you thought.”
- If it’s lower: “You’ll make it, but with less room than you thought.”
- To make them feel it: Yes: the projection holds and **$260,272** is left at the end. That gives you a small cushion for the unexpected and some peace of mind in retirement.
- Way out: It works, but with little room: the plan calculates that your retirement accounts are $1.43M short (in today’s dollars). That’s for your advisor.
- Written by the LLM: q, siente

Possible questions not used in this case: Financial Health score (52 out of 100, today); Year the card is paid off (January 2034 paying $450 a month).

## Plan steps

| Step | Who | Score after the step (alone) |
|---|---|---|
| Add life cover | With the advisor | 57 |
| Extra liability cover | With the advisor | 56 |
| Save $15,032 more a year | The family | 55 |

Combinations the plan includes: Add life cover + Extra liability cover = 60; Add life cover + Save $15,032 more a year = 60; Add life cover + Save $15,032 more a year + Extra liability cover = 60; Save $15,032 more a year + Extra liability cover = 59.

## From today to retirement

- Today: Score 52
- Step 1: Add life cover
- Step 2: Extra liability cover
- Step 3: Save $15,032 more a year
- 2033: Oliver’s college
- 2034: With no changes, the card lasts until here (Oliver, 19 · Sophia, 17)
- 2035: Sophia’s college
- 2044: Retirement (Savings last to the end)

## For the advisor

- What if one of us changes jobs, what happens to our insurance?
- What if we prioritize life insurance over saving more?

## Full LLM response

```json
{
  "lectura": "Daniel and Emily are driven above all by protecting the kids and having a liquid emergency fund. They worry about how much their insurance covers and how long their cash lasts before they have to touch it.",
  "orden": [
    "vida",
    "colchon",
    "tarjeta_interes",
    "jubilacion"
  ],
  "porque_orden": "We start with protection, then liquidity, the cost of the debt, and we close with the news about retirement.",
  "frases": [
    "We care about protecting Oliver and Sophia",
    "We want cash for the unexpected",
    "It bothers us to pay so much in interest",
    "Reaching retirement with peace of mind"
  ],
  "ganancias": [
    "We'd sleep more easily at night",
    "We'd have room for the unexpected",
    "We'd pay less in interest",
    "We could enjoy retirement"
  ],
  "abiertas": [
    "What if one of us changes jobs, what happens to our insurance?",
    "What if we prioritize life insurance over saving more?"
  ],
  "preguntas": {
    "vida": {
      "q": "If something happened to one of you, how many years of household expenses would Oliver (11) and Sophia (9) have covered?",
      "cerca": "You had it worked out",
      "mas": "That's more years than you said",
      "menos": "Fewer years than you thought",
      "siente": "Today you have about **3 years** of household expenses covered. With that, Oliver, at 11, would be protected until 14; Sophia would have part of her childhood covered.",
      "salida": "Increase your life insurance"
    },
    "colchon": {
      "q": "If your income stopped tomorrow, how many months of essential expenses does your cash cover?",
      "cerca": "You suspected it",
      "mas": "That's more months than you said",
      "menos": "Fewer months than you thought",
      "siente": "Your accessible cash covers only **1.4 months** of essential expenses. At that level, a pause in income would leave you exposed and complicate the planned vacation.",
      "salida": "Extra liability insurance"
    },
    "tarjeta_interes": {
      "q": "You pay $450 a month on your credit card. How much of that goes to interest?",
      "cerca": "You could feel it in the payments",
      "mas": "More a month than you said",
      "menos": "Less than you imagined",
      "siente": "Of the $450 you pay each month, **$374** goes to interest. That way the debt barely goes down and the cost of credit weighs heavily on the cash you have available.",
      "salida": "Extra liability insurance"
    },
    "jubilacion": {
      "q": "Do you have enough to retire at 62 and 60 and live on it?",
      "cerca": "You had it clear",
      "mas": "Better than you thought",
      "menos": "Worse than you thought",
      "siente": "Yes: the projection holds and **$260,272** is left at the end. That gives you a small cushion for the unexpected and some peace of mind in retirement.",
      "salida": "Increase your life insurance"
    }
  }
}
```
