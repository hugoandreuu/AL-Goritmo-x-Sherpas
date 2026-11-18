# Study: Samantha Lewis

- Case: `samantha-lewis`
- Data: `cases/` files (the same JSON the MCP serves)
- Phrases: written by the Sherpas LLM (`gpt-5-mini`, on 2026-11-14), with figure checks
- Generated: 2026-11-18

## What the LLM reads about this family

Samantha's priority is protecting Ethan and Ava and making sure she has long-term peace of mind. What will move her most is knowing how long her savings last. She will also care about the concentration of her investments and confirming that her emergency fund is enough.

Why this order: First the most critical point (retirement), then the specific investment that worries her, then good news about her emergency fund, and finally the overall result.

## Score

Today 82 out of 100. With the plan’s steps, 84.

| Area | Score |
|---|---|
| Savings | 75 |
| Debt | 100 |
| Investments | 66 |
| Emergency fund | 100 |
| Insurance | 71 |

## Questions, in order

### 1. Do you have enough to retire at 65 and live on it?

- Plan figure: **until age 73** your savings last (bad news)
- Source: `key_metrics.facts.retirement`
- If they get it right: “You saw it coming. Look how far it goes.”
- If the figure is higher than they said: “The report says it falls short.”
- If it’s lower: “The report says otherwise.”
- To make them feel it: With this plan, your savings run out at **age 73**. That leaves part of your retirement expenses uncovered later on.
- Way out: It’s one of the first things to go over with your advisor: how much to save and when to retire.
- Written by the LLM: q, siente

### 2. Of everything you have invested, what share is in a single fund?

- Plan figure: **39%** in a single fund (VTI) (bad news)
- Source: `score.top_moves`
- If they get it right: “You knew it.”
- If the figure is higher than they said: “More than you thought.”
- If it’s lower: “Less than you thought. Even so, the report sees it as high.”
- To make them feel it: Today **39%** of what you've invested is in a single fund, VTI. The plan proposes bringing it to **25%**, so you don't depend so much on one position and your portfolio is better balanced.
- Way out: What to sell and when is something to go over with your advisor.
- Written by the LLM: q, siente

### 3. If your income stopped tomorrow, how many months of essential expenses does your cash cover?

- Plan figure: **7.9 months** of essential expenses (good news)
- Source: `key_metrics.facts.cash`
- If they get it right: “That’s right. You’re doing well here.”
- If the figure is higher than they said: “More than you thought.”
- If it’s lower: “A bit less than you thought, but above the recommended minimum.”
- To make them feel it: Your cash covers **7.9 months** of essential expenses, above the recommended reserve. That gives you room to handle Ethan's payments and the unexpected without immediate stress.
- Way out: This one is done. No need to touch it.
- Written by the LLM: q, siente

### 4. From 0 to 100, what Financial Health score do you think your report gives you?

- Plan figure: **82** out of 100, today (good news)
- Source: `score.published_score · score.pillars`
- If they get it right: “You knew it.”
- If the figure is higher than they said: “Better than you thought.”
- If it’s lower: “Lower than you thought.”
- To make them feel it: Your plan's health today is **82 out of 100**. With the plan's steps the score can go up and give more certainty about handling retirement and the kids' education.
- Way out: With the steps in your plan, it reaches 84.
- Written by the LLM: q, siente

## Plan steps

| Step | Who | Score after the step (alone) |
|---|---|---|
| Insure your home | With the advisor | 84 |
| Spread your investments better | With the advisor | 83 |
| Take a little risk out of your investments | With the advisor | 83 |

The plan doesn’t give the score for several steps together; the app doesn’t invent it.

## From today to retirement

- Today: Score 82
- Step 1: Insure your home
- Step 2: Spread your investments better
- Step 3: Take a little risk out of your investments
- 2028: Ava’s college
- 2030: The home ($500,000)
- 2044: Retirement
- 2053: Savings run out here (At age 73, according to your report)

## For the advisor

- How do we prioritize retirement or college?
- Can we reduce my concentration without losing returns?
- What should I go over with you in the meeting?

## Full LLM response

```json
{
  "lectura": "Samantha's priority is protecting Ethan and Ava and making sure she has long-term peace of mind. What will move her most is knowing how long her savings last. She will also care about the concentration of her investments and confirming that her emergency fund is enough.",
  "orden": [
    "jubilacion",
    "concentracion",
    "colchon",
    "nota"
  ],
  "porque_orden": "First the most critical point (retirement), then the specific investment that worries her, then good news about her emergency fund, and finally the overall result.",
  "frases": [
    "That Ethan and Ava are covered",
    "Having enough to retire",
    "Not running out of cash",
    "Not depending on a single fund"
  ],
  "ganancias": [
    "I'd sleep without fear about future money",
    "I could plan trips without stress",
    "I'd pay for college without strain",
    "I'd review my investments calmly"
  ],
  "abiertas": [
    "How do we prioritize retirement or college?",
    "Can we reduce my concentration without losing returns?",
    "What should I go over with you in the meeting?"
  ],
  "preguntas": {
    "jubilacion": {
      "q": "Do you have enough to retire at 65 and live on it?",
      "cerca": "Almost: it doesn't last the whole retirement",
      "mas": "Better than you thought {tu}",
      "menos": "Worse than you thought {tu}",
      "siente": "With this plan, your savings run out at **age 73**. That leaves part of your retirement expenses uncovered later on.",
      "salida": "Spread your investments better"
    },
    "concentracion": {
      "q": "Of everything you have invested, what share is in a single fund?",
      "cerca": "That concentrates a lot in a single fund",
      "mas": "There's more exposure than you thought {tu}",
      "menos": "Less than you thought {tu}",
      "siente": "Today **39%** of what you've invested is in a single fund, VTI. The plan proposes bringing it to **25%**, so you don't depend so much on one position and your portfolio is better balanced.",
      "salida": "Lower the risk of your investments a little"
    },
    "colchon": {
      "q": "If your income stopped tomorrow, how many months of essential expenses does your cash cover?",
      "cerca": "You have more of an emergency fund than expected",
      "mas": "You have more room than you thought {tu}",
      "menos": "You have less room than you thought {tu}",
      "siente": "Your cash covers **7.9 months** of essential expenses, above the recommended reserve. That gives you room to handle Ethan's payments and the unexpected without immediate stress.",
      "salida": "Insure your home"
    },
    "nota": {
      "q": "From 0 to 100, what Financial Health score do you think your plan gives you?",
      "cerca": "You're very close to the real score",
      "mas": "Your perception is better than the real score {tu}",
      "menos": "Your perception is worse than the real score {tu}",
      "siente": "Your plan's health today is **82 out of 100**. With the plan's steps the score can go up and give more certainty about handling retirement and the kids' education.",
      "salida": "Insure your home"
    }
  }
}
```
