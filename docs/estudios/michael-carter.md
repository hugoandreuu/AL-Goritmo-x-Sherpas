# Study: Michael Carter

- Case: `michael-carter`
- Data: `cases/` files (the same JSON the MCP serves)
- Phrases: written by the Sherpas LLM (`gpt-5-mini`, on 2026-11-14), with figure checks
- Generated: 2026-11-18

## What the LLM reads about this family

He cares about being able to buy the house without draining his emergency fund, while not cutting back on his retirement. What will move him most is seeing how many months of expenses his cash covers. He will also react strongly to how long his savings last.

Why this order: Liquidity and the house first, then retirement; we close with the score and good news on the credit card

## Score

Today 26 out of 100. With the plan’s steps, 62.

| Area | Score |
|---|---|
| Savings | 0 |
| Debt | 78 |
| Investments | 42 |
| Emergency fund | 22 |
| Insurance | 18 |

## Questions, in order

### 1. If your income stopped tomorrow, how many months of expenses do you think your cash covers?

- Plan figure: **3.2 months** of essential expenses (bad news)
- Source: `key_metrics.facts.cash`
- If they get it right: “You knew it. Look at what the plan recommends.”
- If the figure is higher than they said: “A bit more than you thought, but short of what’s recommended.”
- If it’s lower: “Less than you thought.”
- To make them feel it: Michael, your cash covers **3.2 months** of essential expenses. The recommended reserve is 5 to 6 months; if you set aside your short-term goals, the months covered drop to **0**.
- Way out: Your plan proposes bringing that emergency fund closer to what’s recommended. How is something to go over with your advisor.
- Written by the LLM: q, siente

### 2. Do you have enough to retire at 58 and live on it?

- Plan figure: **until age 85** your savings last (bad news)
- Source: `key_metrics.facts.retirement`
- If they get it right: “You saw it coming. Look how far it goes.”
- If the figure is higher than they said: “The report says it falls short.”
- If it’s lower: “The report says otherwise.”
- To make them feel it: Michael, according to the report your savings run out at **age 85**, while your goal is to retire at 58. Guaranteed income covers 34% of projected spending.
- Way out: Your plan has a step for this, and with it alone the score goes from 26 to 62.
- Written by the LLM: q, siente

### 3. From 0 to 100, what Financial Health score do you think your report gives you?

- Plan figure: **26** out of 100, today (bad news)
- Source: `score.published_score · score.pillars`
- If they get it right: “You knew it.”
- If the figure is higher than they said: “Better than you thought.”
- If it’s lower: “Lower than you thought.”
- To make them feel it: Your score today is **26 out of 100**, Michael. It sums up that the order of your money (house, emergency fund, savings) needs sorting out.
- Way out: With the steps in your plan, it reaches 62.
- Written by the LLM: q, siente

### 4. You pay $200 a month on your credit card. How much of that goes to interest?

- Plan figure: **$58** of every $200 goes to interest (good news)
- Source: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Our calculation: $58 of $200, rounded to one decimal
- If they get it right: “That’s right. Here the debt does go down.”
- If the figure is higher than they said: “A bit more than you thought, but the debt is going down.”
- If it’s lower: “Less than you feared.”
- To make them feel it: Of your $200 a month, **$58** goes to interest. That portion slows down paying off the balance and the monthly relief.
- Way out: Your plan says to keep paying it: it’s on track.
- Written by the LLM: q, siente

## Plan steps

| Step | Who | Score after the step (alone) |
|---|---|---|
| Extra liability cover | With the advisor | 31 |
| Withdraw less from your savings in retirement | With the advisor | 62 |
| Raise the growth share of your investments | With the advisor | 31 |

The plan doesn’t give the score for several steps together; the app doesn’t invent it.

## From today to retirement

- Today: Score 26
- Step 1: Extra liability cover
- Step 2: Withdraw less from your savings in retirement
- Step 3: Raise the growth share of your investments
- 2027: The home ($550,000)
- 2028: Card paid off
- 2047: Retirement
- 2075: Savings run out here (At age 85, according to your report)

## For the advisor

- Can we buy the house and keep the emergency fund?
- What would have to change for my savings to last?
- How much would it cost to raise my insurance or add an umbrella policy?

## Full LLM response

```json
{
  "lectura": "He cares about being able to buy the house without draining his emergency fund, while not cutting back on his retirement. What will move him most is seeing how many months of expenses his cash covers. He will also react strongly to how long his savings last.",
  "orden": [
    "colchon",
    "jubilacion",
    "nota",
    "tarjeta_interes"
  ],
  "porque_orden": "Liquidity and the house first, then retirement; we close with the score and good news on the credit card",
  "frases": [
    "Having the money for the house",
    "Not falling short for retirement",
    "Knowing if I'm on the right track",
    "Paying less on the credit card"
  ],
  "ganancias": [
    "I'd sleep better at night",
    "I could plan my retirement calmly",
    "I'd see the point of what I save",
    "I'd have more room each month"
  ],
  "abiertas": [
    "Can we buy the house and keep the emergency fund?",
    "What would have to change for my savings to last?",
    "How much would it cost to raise my insurance or add an umbrella policy?"
  ],
  "preguntas": {
    "colchon": {
      "q": "If your income stopped tomorrow, how many months of expenses do you think your cash covers?",
      "cerca": "You had a similar idea",
      "mas": "That's more months than you said ({tu})",
      "menos": "Less than you thought ({tu})",
      "siente": "Michael, your cash covers **3.2 months** of essential expenses. The recommended reserve is 5 to 6 months; if you set aside your short-term goals, the months covered drop to **0**.",
      "salida": "Work out with your advisor how the house and the emergency fund fit together"
    },
    "jubilacion": {
      "q": "Do you have enough to retire at 58 and live on it?",
      "cerca": "Your instinct was close",
      "mas": "It's better than you thought ({tu})",
      "menos": "It's worse than you thought ({tu})",
      "siente": "Michael, according to the plan your savings run out at **age 85**, while your goal is to retire at 58. Guaranteed income covers 34% of projected spending.",
      "salida": "Draw less from your savings in retirement"
    },
    "nota": {
      "q": "From 0 to 100, what Financial Health score do you think your plan gives you?",
      "cerca": "You weren't far off",
      "mas": "That's more points than you said ({tu})",
      "menos": "That's fewer points than you said ({tu})",
      "siente": "Your score today is **26 out of 100**, Michael. It sums up that the order of your money (house, emergency fund, savings) needs sorting out.",
      "salida": "Increase the growth-oriented part of your investments"
    },
    "tarjeta_interes": {
      "q": "You pay $200 a month on your credit card. How much of that goes to interest?",
      "cerca": "You knew it well",
      "mas": "More goes to interest than you said ({tu})",
      "menos": "Less interest than you thought ({tu})",
      "siente": "Of your $200 a month, **$58** goes to interest. That portion slows down paying off the balance and the monthly relief.",
      "salida": "Talk to your advisor to prioritize payments and look at options"
    }
  }
}
```
