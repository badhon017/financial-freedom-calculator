# Financial Freedom Calculator

Works out how many years until your investments can cover your living costs — built for
Bangladeshi salaries, inflation and savings instruments.

Most retirement calculators treat the target as a fixed number. It isn't. At 9% inflation,
the ৳1.8 crore that funds your life today needs to be ৳9.9 crore in twenty years to fund the
same life. So this app draws **two rising curves** — the corpus you have and the corpus you
need — and the year they cross is your answer.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # engine + render tests
npm run build    # static site in dist/
npm run lint
```

`dist/` is plain static files — host it anywhere. Nothing leaves the browser: plans are
shared by encoding the inputs into the URL, and saved scenarios live in `localStorage`.

## What it models

- **Income** — monthly take-home pay, yearly raises as a percentage *or* a fixed taka amount,
  an optional age where salary plateaus, Eid-style bonuses with a slider for how much of each
  gets invested, and other income with its own growth rate.
- **Expenses** — what you spend now, growing at a lifestyle-inflation rate you can set higher
  than general inflation. Savings are income minus expenses, so you can watch raises get eaten.
- **Inflation** — raises both the corpus you need and the cost of living along the way.
- **The milestone** — either a number you type (in today's money or future taka, an explicit
  choice because getting it wrong is the commonest mistake in retirement planning) or derived
  from retirement spending × a safe-withdrawal multiple.
- **Life events** — one-off and repeating costs (a house, a wedding, four years of university
  fees) and windfalls (gratuity, a property sale). Each one is priced in years off your date.

## What it deliberately doesn't model

Tax, post-retirement drawdown, and market volatility. Salary is treated as take-home and
returns as post-tax; the safe-withdrawal rate stands in for whether the corpus lasts. The app
says all of this on screen rather than hiding it.

## Layout

```
src/lib/        the engine — pure functions, no React
  simulate.ts     month-by-month projection and the crossing search
  target.ts       the moving-target maths
  solve.ts        bisection: "what would it actually take?"
  sensitivity.ts  re-runs the plan with one assumption changed
  format.ts       taka formatting in lakh and crore
  url.ts          share links and saved scenarios
src/components/ inputs/, results/, ui/
src/state/      useCalculator — the single store
```

The engine is a pure function with no DOM dependency, and it's the part under test:
closed-form cross-checks (the SIP future-value formula, compound interest on an opening
balance), hand-computable traces, and every edge case that makes naive calculators lie —
returns below inflation, targets that are never reached, corpus depletion, goals larger than
the balance.
