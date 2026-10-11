import { describe, expect, it } from 'vitest'
import { simulate, simulateWithoutGoal } from './simulate'
import { monthlyRate, requiredCorpusAt } from './target'
import { DEFAULT_INPUTS, newGoal } from './defaults'
import type { Inputs } from './types'

/** A deliberately inert baseline: no growth, no inflation, no bonus. */
function inert(overrides: Partial<Inputs> = {}): Inputs {
  return {
    ...DEFAULT_INPUTS,
    currentAge: 30,
    retirementAge: 60,
    startYear: 2026,
    startMonth: 1,
    monthlySalary: 100000,
    incrementMode: 'percent',
    incrementValue: 0,
    incrementMonth: 1,
    bonusEnabled: false,
    monthlyExpenses: 60000,
    expenseGrowthPct: 0,
    currentCorpus: 0,
    returnPct: 0,
    inflationPct: 0,
    targetMode: 'fixed',
    targetAmount: 4800000,
    targetBasis: 'future',
    goals: [],
    ...overrides,
  }
}

describe('engine fundamentals', () => {
  it('with no return and no inflation, corpus is simply savings times months', () => {
    const result = simulate(inert())
    // 40,000 saved a month hits 48,00,000 in exactly 120 months.
    expect(result.outcome).toBe('reached')
    expect(result.monthsToFreedom).toBe(120)
    expect(result.corpusAtFreedom).toBeCloseTo(4800000, 6)
    expect(result.freedomAge).toBeCloseTo(40, 6)
    expect(result.totalGrowth).toBeCloseTo(0, 6)
  })

  it('matches the closed-form future value of a fixed monthly investment', () => {
    const inputs = inert({ returnPct: 12, targetAmount: Number.MAX_SAFE_INTEGER })
    const result = simulate(inputs)
    const i = monthlyRate(12)
    const p = 40000

    for (const yearsElapsed of [1, 5, 10, 25]) {
      const n = yearsElapsed * 12
      // Ordinary annuity: contributions land at month end, so only prior
      // balances earn that month's return.
      const expected = (p * (Math.pow(1 + i, n) - 1)) / i
      const row = result.years[yearsElapsed - 1]
      expect(row.closingCorpus).toBeCloseTo(expected, 4)
    }
  })

  it('carries an opening corpus forward at compound interest', () => {
    const inputs = inert({
      currentCorpus: 1000000,
      returnPct: 10,
      monthlyExpenses: 100000, // zero savings, so only the opening balance grows
      targetAmount: Number.MAX_SAFE_INTEGER,
    })
    const result = simulate(inputs)
    const i = monthlyRate(10)
    expect(result.years[0].closingCorpus).toBeCloseTo(1000000 * Math.pow(1 + i, 12), 4)
    expect(result.years[9].closingCorpus).toBeCloseTo(1000000 * Math.pow(1 + i, 120), 4)
  })

  it('reports already-free when the opening corpus clears the target', () => {
    const result = simulate(inert({ currentCorpus: 9000000, targetAmount: 4800000 }))
    expect(result.outcome).toBe('already')
    expect(result.monthsToFreedom).toBe(0)
  })
})

describe('the split at the crossing', () => {
  it('freezes principal and growth at the freedom date, not the horizon end', () => {
    const inputs = inert({ returnPct: 11, inflationPct: 0, targetAmount: 10000000 })
    const result = simulate(inputs)
    expect(result.outcome).toBe('reached')
    // What you put in plus what it earned must be exactly the corpus that day.
    const reconstructed =
      inputs.currentCorpus + result.contributionsAtFreedom + result.growthAtFreedom
    expect(reconstructed).toBeCloseTo(result.corpusAtFreedom!, 4)
    // The horizon totals keep growing well past the crossing.
    expect(result.totalGrowth).toBeGreaterThan(result.growthAtFreedom)
  })

  it('counts goal flows as principal rather than growth', () => {
    const inputs = inert({
      currentCorpus: 100000,
      returnPct: 10,
      targetAmount: 8000000,
      goals: [newGoal({ id: 'g1', atAge: 33, amount: 500000, inflate: false })],
    })
    const result = simulate(inputs)
    const reconstructed =
      inputs.currentCorpus + result.contributionsAtFreedom + result.growthAtFreedom
    expect(reconstructed).toBeCloseTo(result.corpusAtFreedom!, 4)
  })
})

describe('salary growth and expense growth', () => {
  it('applies a percentage raise on the anniversary month, never on day one', () => {
    const inputs = inert({
      incrementValue: 10,
      incrementMonth: 1,
      startMonth: 1,
      targetAmount: Number.MAX_SAFE_INTEGER,
    })
    const result = simulate(inputs)
    // Year 1 is twelve months at the starting salary.
    expect(result.years[0].income).toBeCloseTo(100000 * 12, 6)
    // Year 2 is twelve months at +10%.
    expect(result.years[1].income).toBeCloseTo(100000 * 1.1 * 12, 6)
    expect(result.years[4].income).toBeCloseTo(100000 * Math.pow(1.1, 4) * 12, 6)
  })

  it('applies a fixed-taka raise additively', () => {
    const inputs = inert({
      incrementMode: 'fixed',
      incrementValue: 5000,
      incrementMonth: 1,
      startMonth: 1,
      targetAmount: Number.MAX_SAFE_INTEGER,
    })
    const result = simulate(inputs)
    expect(result.years[0].income).toBeCloseTo(100000 * 12, 6)
    expect(result.years[1].income).toBeCloseTo(105000 * 12, 6)
    expect(result.years[3].income).toBeCloseTo(115000 * 12, 6)
  })

  it('stops raises once salary growth plateaus', () => {
    const inputs = inert({
      incrementValue: 10,
      incrementMonth: 1,
      startMonth: 1,
      salaryGrowthEndsAtAge: 33,
      targetAmount: Number.MAX_SAFE_INTEGER,
    })
    const result = simulate(inputs)
    // Raises at ages 31, 32, 33 — the one due at 33 is blocked.
    const plateau = 100000 * Math.pow(1.1, 2) * 12
    expect(result.years[2].income).toBeCloseTo(plateau, 6)
    expect(result.years[9].income).toBeCloseTo(plateau, 6)
  })

  it('grows expenses so twelve months compound to exactly the annual rate', () => {
    const inputs = inert({ expenseGrowthPct: 9, targetAmount: Number.MAX_SAFE_INTEGER })
    const result = simulate(inputs)
    const g = monthlyRate(9)
    // Year one is a geometric series over the twelve monthly steps.
    const yearOne = 60000 * ((Math.pow(1 + g, 12) - 1) / g)
    expect(result.years[0].expenses).toBeCloseTo(yearOne, 4)
    expect(result.years[1].expenses).toBeCloseTo(yearOne * 1.09, 4)
  })

  it('warns and shrinks savings when lifestyle inflation outruns raises', () => {
    const result = simulate(
      inert({ incrementValue: 5, expenseGrowthPct: 12, targetAmount: Number.MAX_SAFE_INTEGER }),
    )
    expect(result.warnings.map((w) => w.code)).toContain('expenses-grow-faster-than-salary')
    expect(result.years[10].savings).toBeLessThan(result.years[0].savings)
  })
})

describe('the moving target', () => {
  it('raises the derived target with inflation every year', () => {
    const inputs = inert({
      targetMode: 'derived',
      retirementMonthlyExpense: 60000,
      swrPct: 4,
      inflationPct: 9,
    })
    // 60,000 a month is 7,20,000 a year; at 4% that is 25x = 1,80,00,000 today.
    expect(requiredCorpusAt(inputs, 0)).toBeCloseTo(18000000, 6)
    expect(requiredCorpusAt(inputs, 240)).toBeCloseTo(18000000 * Math.pow(1.09, 20), 4)
  })

  it('treats a target typed in today-money differently from a future number', () => {
    const base = inert({ inflationPct: 9, targetAmount: 50000000 })
    const todayMoney = simulate({ ...base, targetBasis: 'today' })
    const futureMoney = simulate({ ...base, targetBasis: 'future' })
    // The same 5 crore is a far harder goal when it has to hold its value.
    expect(requiredCorpusAt({ ...base, targetBasis: 'today' }, 120)).toBeGreaterThan(
      requiredCorpusAt({ ...base, targetBasis: 'future' }, 120),
    )
    if (todayMoney.monthsToFreedom !== null && futureMoney.monthsToFreedom !== null) {
      expect(todayMoney.monthsToFreedom).toBeGreaterThan(futureMoney.monthsToFreedom)
    }
  })

  it('agrees across both target modes when inflation is zero', () => {
    const derived = inert({
      targetMode: 'derived',
      retirementMonthlyExpense: 16000,
      swrPct: 4,
      inflationPct: 0,
    })
    // 16,000 x 12 x 25 = 48,00,000, the same number the fixed mode uses.
    const fixed = inert({ targetAmount: 4800000, inflationPct: 0 })
    expect(simulate(derived).monthsToFreedom).toBe(simulate(fixed).monthsToFreedom)
  })

  it('restates the target at the crossing back into today-money', () => {
    const result = simulate(
      inert({
        targetMode: 'derived',
        retirementMonthlyExpense: 60000,
        swrPct: 4,
        inflationPct: 9,
        returnPct: 14,
        monthlySalary: 300000,
      }),
    )
    expect(result.outcome).toBe('reached')
    // Deflating the milestone must give back the 25x of today's expenses.
    expect(result.requiredAtFreedomReal).toBeCloseTo(18000000, 2)
  })

  it('flags a target that can never be caught when returns trail inflation', () => {
    const result = simulate(
      inert({
        targetMode: 'derived',
        retirementMonthlyExpense: 60000,
        swrPct: 4,
        inflationPct: 9,
        expenseGrowthPct: 9,
        returnPct: 8,
      }),
    )
    expect(result.outcome).toBe('unreachable')
    expect(result.realReturnPct).toBeLessThan(0)
    expect(result.warnings.map((w) => w.code)).toContain('inflation-outpaces-returns')
  })
})

describe('goals and lump sums', () => {
  it('pushes the freedom date out by the cost of a one-off goal', () => {
    const base = inert()
    const withGoal: Inputs = {
      ...base,
      goals: [newGoal({ id: 'g1', atAge: 33, amount: 1200000, inflate: false })],
    }
    const after = simulate(withGoal)
    const without = simulateWithoutGoal(withGoal, 'g1')
    expect(after.monthsToFreedom).not.toBeNull()
    // 12,00,000 pulled out of a 40,000/month plan with no returns costs 30 months.
    expect(after.monthsToFreedom! - without.monthsToFreedom!).toBe(30)
  })

  it('repeats an annual goal for its stated number of years', () => {
    const inputs = inert({
      targetAmount: Number.MAX_SAFE_INTEGER,
      goals: [
        newGoal({ id: 'g1', atAge: 32, amount: 100000, years: 3, frequency: 'annual', inflate: false }),
      ],
    })
    const result = simulate(inputs)
    expect(result.totalGoalOutflow).toBeCloseTo(300000, 6)
  })

  it('inflates a goal priced in today-money to the year it lands', () => {
    const inputs = inert({
      inflationPct: 9,
      targetAmount: Number.MAX_SAFE_INTEGER,
      goals: [newGoal({ id: 'g1', atAge: 40, amount: 1000000, inflate: true })],
    })
    const result = simulate(inputs)
    expect(result.totalGoalOutflow).toBeCloseTo(1000000 * Math.pow(1.09, 10), 2)
  })

  it('adds a windfall to the corpus and brings the date forward', () => {
    const base = inert()
    const withWindfall: Inputs = {
      ...base,
      goals: [newGoal({ id: 'g1', atAge: 33, amount: 1200000, direction: 'inflow', inflate: false })],
    }
    expect(simulate(withWindfall).monthsToFreedom).toBe(90)
    expect(simulate(base).monthsToFreedom).toBe(120)
  })
})

describe('warnings and edge cases', () => {
  it('reports unreachable rather than a nonsense date', () => {
    const result = simulate(inert({ targetAmount: 1e15 }))
    expect(result.outcome).toBe('unreachable')
    expect(result.monthsToFreedom).toBeNull()
  })

  it('detects drawdown when expenses exceed income', () => {
    const result = simulate(inert({ monthlyExpenses: 150000, currentCorpus: 1000000 }))
    expect(result.warnings.map((w) => w.code)).toContain('negative-savings')
    expect(result.warnings.map((w) => w.code)).toContain('corpus-depleted')
    expect(result.depletionMonthIndex).toBe(21)
  })

  it('flags reaching the target later than the retirement age', () => {
    const result = simulate(inert({ retirementAge: 35, targetAmount: 4800000 }))
    expect(result.monthsToFreedom).toBe(120)
    expect(result.warnings.map((w) => w.code)).toContain('after-retirement-age')
  })

  it('never projects past age 100', () => {
    expect(simulate(inert({ currentAge: 95 })).horizonMonths).toBe(60)
    expect(simulate(inert({ currentAge: 30 })).horizonMonths).toBe(720)
  })

  it('finds a coast point before the freedom date', () => {
    const result = simulate(
      inert({ returnPct: 12, inflationPct: 0, targetAmount: 20000000, retirementAge: 60 }),
    )
    expect(result.coastMonthIndex).not.toBeNull()
    expect(result.coastMonthIndex!).toBeLessThan(result.monthsToFreedom!)
  })
})

describe('bonus handling', () => {
  it('invests only the chosen share of a bonus', () => {
    const inputs = inert({
      bonusEnabled: true,
      bonusMode: 'months',
      bonusValue: 2,
      bonusMonth: 6,
      bonusInvestedPct: 50,
      targetAmount: Number.MAX_SAFE_INTEGER,
    })
    const result = simulate(inputs)
    // Savings rise by half of a two-month bonus; the other half is spending.
    const withoutBonus = simulate({ ...inputs, bonusEnabled: false })
    expect(result.years[0].savings - withoutBonus.years[0].savings).toBeCloseTo(100000, 6)
    expect(result.years[0].income - withoutBonus.years[0].income).toBeCloseTo(200000, 6)
  })
})
