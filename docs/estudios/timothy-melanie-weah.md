# Study: Timothy and Melanie Weah

- Case: `timothy-melanie-weah`
- Data: `cases/` files (the same JSON the MCP serves)
- Phrases: written by the Sherpas LLM (`gpt-5-mini`, on 2026-11-14), with figure checks
- Generated: 2026-11-18

## What the LLM reads about this family

They care about protecting the kids and deciding what to do with the excess cash. Seeing how much of the credit card payment is interest will move them more than other figures.

Why this order: First the hidden cost that drains liquidity, then protecting the family, the overall score, and we end with the good news about the emergency fund.

## Score

Today 60 out of 100. With the plan’s steps, 78.

| Area | Score |
|---|---|
| Savings | 86 |
| Debt | 58 |
| Investments | 56 |
| Emergency fund | 100 |
| Insurance | 37 |

## Questions, in order

### 1. You pay $300 a month on your credit card. How much of that goes to interest?

- Plan figure: **$270** of every $300 goes to interest (bad news)
- Source: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Our calculation: $270 of $300, rounded to one decimal
- If they get it right: “You knew it. Look where it goes.”
- If the figure is higher than they said: “That’s {dif} more a month than you thought.”
- If it’s lower: “Less than you feared. Even so, look where it goes.”
- To make them feel it: Of every **$300** you pay, **$270** is interest. That means your payment barely reduces the debt and keeps the monthly burden high.
- Way out: The way out is in your plan: pay $6,800 on the card.
- Written by the LLM: q, siente

### 2. If something happened to one of you, how many years of household expenses would Liam (6) and Josh (3) have covered?

- Plan figure: **about 2 years** of household expenses (bad news)
- Source: `key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses`. Our calculation: life cover today ÷ household expenses per year
- If they get it right: “You were close. Look how far it goes.”
- If the figure is higher than they said: “A bit more, but far from what’s needed.”
- If it’s lower: “Much less than you thought.”
- To make them feel it: Today you have **$250,000** in life insurance, equal to **about 2 years** of household expenses for Liam and Josh; with that coverage Liam would be protected until around age 8.
- Way out: It can be fixed, and that’s for your advisor: they bring the quotes.
- Written by the LLM: q, siente

### 3. From 0 to 100, what Financial Health score do you think your report gives you?

- Plan figure: **60** out of 100, today (bad news)
- Source: `score.published_score · score.pillars`
- If they get it right: “You knew it.”
- If the figure is higher than they said: “Better than you thought.”
- If it’s lower: “Lower than you thought.”
- To make them feel it: The plan's overall score is **60** out of 100. It reflects strengths such as the emergency fund and clear weaknesses in insurance.
- Way out: With the steps in your plan, it reaches 78.
- Written by the LLM: q, siente

### 4. If your income stopped tomorrow, how many months of essential expenses does your cash cover?

- Plan figure: **16 months** of essential expenses (good news)
- Source: `key_metrics.facts.cash`
- If they get it right: “That’s right. You’re doing well here.”
- If the figure is higher than they said: “More than you thought.”
- If it’s lower: “A bit less than you thought, but above the recommended minimum.”
- To make them feel it: Your cash covers **16 months** of essential expenses. That gives you room to decide calmly and use part of the excess for other priorities.
- Way out: Part of that cash is what your plan proposes to use to pay down the card.
- Written by the LLM: q, siente

Possible questions not used in this case: Year the card is paid off (September 2039 paying $300 a month); Retirement (Yes, it’s enough and $2.37M is left at the end of the plan).

## Plan steps

| Step | Who | Score after the step (alone) |
|---|---|---|
| Pay $6,800 on the card | The family | 62 |
| Add life cover | With the advisor | 60 |
| Extra liability cover | With the advisor | 60 |

Combinations the plan includes: Pay $6,800 on the card + Add life cover + Extra liability cover = 78; Pay $6,800 on the card + Add life cover = 73; Pay $6,800 on the card + Extra liability cover = 62; Add life cover + Extra liability cover = 60.

## From today to retirement

- Today: Score 60
- Step 1: Pay $6,800 on the card
- Step 2: Add life cover
- Step 3: Extra liability cover
- 2028: The car ($45,000)
- 2030: The home ($600,000)
- 2038: Liam’s college
- 2039: With no changes, the card lasts until here (Liam, 19 · Josh, 16)
- 2041: Josh’s college
- 2048: Retirement (Savings last to the end)

## For the advisor

- If we pay off part of the credit card today, how does the plan change?
- Exactly how much life insurance do we need to feel at ease?
- In what order should we use the excess cash?

## Full LLM response

```json
{
  "lectura": "They care about protecting the kids and deciding what to do with the excess cash. Seeing how much of the credit card payment is interest will move them more than other figures.",
  "orden": [
    "tarjeta_interes",
    "vida",
    "nota",
    "colchon"
  ],
  "porque_orden": "First the hidden cost that drains liquidity, then protecting the family, the overall score, and we end with the good news about the emergency fund.",
  "frases": [
    "I worry our money goes to interest",
    "I want Liam and Josh to be covered",
    "Having room to buy a house and a car",
    "An emergency fund that gives us peace of mind"
  ],
  "ganancias": [
    "We'd sleep without checking our phones",
    "We'd have peace of mind to plan",
    "We'd save more clearly each month",
    "We could decide the next step calmly"
  ],
  "abiertas": [
    "If we pay off part of the credit card today, how does the plan change?",
    "Exactly how much life insurance do we need to feel at ease?",
    "In what order should we use the excess cash?"
  ],
  "preguntas": {
    "tarjeta_interes": {
      "q": "You pay $300 a month on your credit card. How much of that goes to interest?",
      "cerca": "You'd noticed: almost all of it goes to interest",
      "siente": "Of every **$300** you pay, **$270** is interest. That means your payment barely reduces the debt and keeps the monthly burden high.",
      "salida": "Pay $6,800 off the credit card"
    },
    "vida": {
      "q": "If something happened to one of you, how many years of household expenses would Liam (6) and Josh (3) have covered?",
      "cerca": "You had it clear: it only covers a few years of expenses",
      "siente": "Today you have **$250,000** in life insurance, equal to **about 2 years** of household expenses for Liam and Josh; with that coverage Liam would be protected until around age 8.",
      "salida": "Increase your life insurance"
    },
    "nota": {
      "q": "From 0 to 100, what Financial Health score do you think your plan gives you?",
      "cerca": "You got it: the plan's score is 60",
      "siente": "The plan's overall score is **60** out of 100. It reflects strengths such as the emergency fund and clear weaknesses in insurance.",
      "salida": "Meeting with the advisor"
    },
    "colchon": {
      "q": "If your income stopped tomorrow, how many months of essential expenses does your cash cover?",
      "cerca": "Perfect: you have a solid emergency fund",
      "siente": "Your cash covers **16 months** of essential expenses. That gives you room to decide calmly and use part of the excess for other priorities.",
      "salida": "Meeting with the advisor"
    }
  }
}
```
