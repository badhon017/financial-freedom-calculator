import { describe, expect, it } from 'vitest'
import { simulate } from './simulate'
import {
  solveExpenseCutPct,
  solveExtraMonthlySavings,
  solveLevers,
  solveRequiredReturnPct,
} from './solve'
import { DEFAULT_INPUTS } from './defaults'
import type { Inputs } from './types'

/** A plan that genuinely misses: modest pay, a target well out of reach. */
function missing(overrides: Partial<Inputs> = {}): Inputs {
  return {
    ...DEFAULT_INPUTS,
    currentAge: 35,
    retirementAge: 55,
    startYear: 2026,
    startMonth: 1,
    monthlySalary: 80000,
    incrementValue: 6,
    incrementMonth: 1,
    bonusEnabled: false,
    monthlyExpenses: 65000,
    expenseGrowthPct: 9,
    inflationPct: 9,
    returnPct: 11,
    currentCorpus: 200000,
    targetMode: 'derived',
    retirementMonthlyExpense: 80000,
    swrPct: 4,
    goals: [],
    ...overrides,
  }
}

const DEADLINE = 20 * 12

describe('the levers', () => {
  it('confirms the baseline plan really does miss the deadline', () => {
    const months = simulate(missing()).monthsToFreedom
    expect(months === null || months > DEADLINE).toBe(true)
  })

  it('finds an extra monthly amount that actually closes the gap', () => {
    const extra = solveExtraMonthlySavings(missing(), DEADLINE)
    expect(extra).not.toBeNull()
    const inputs = missing()
    const fixed = simulate({ ...inputs, otherIncomeMonthly: inputs.otherIncomeMonthly + extra! })
    expect(fixed.monthsToFreedom).not.toBeNull()
    expect(fixed.monthsToFreedom!).toBeLessThanOrEqual(DEADLINE)
  })

  it('returns the smallest extra that works, not any old number', () => {
    const inputs = missing()
    const extra = solveExtraMonthlySavings(inputs, DEADLINE)!
    // A tenth less must fail, or the answer was not minimal.
    const short = simulate({ ...inputs, otherIncomeMonthly: extra * 0.9 }).monthsToFreedom
    expect(short === null || short > DEADLINE).toBe(true)
  })

  it('prices a spending cut, which pulls double duty on the target', () => {
    const inputs = missing()
    const cut = solveExpenseCutPct(inputs, DEADLINE)
    expect(cut).not.toBeNull()
    const keep = 1 - cut! / 100
    const fixed = simulate({
      ...inputs,
      monthlyExpenses: inputs.monthlyExpenses * keep,
      retirementMonthlyExpense: inputs.retirementMonthlyExpense * keep,
    })
    expect(fixed.monthsToFreedom!).toBeLessThanOrEqual(DEADLINE)
  })

  it('finds the return that would be needed, and it is above the current one', () => {
    const inputs = missing()
    const needed = solveRequiredReturnPct(inputs, DEADLINE)
    expect(needed).not.toBeNull()
    expect(needed!).toBeGreaterThan(inputs.returnPct)
    expect(simulate({ ...inputs, returnPct: needed! }).monthsToFreedom!).toBeLessThanOrEqual(DEADLINE)
  })

  it('reports a lever as unavailable rather than inventing a number', () => {
    // Nothing fixes a plan where the target is a thousand crore in five years.
    const hopeless = missing({ targetMode: 'fixed', targetAmount: 1e13, retirementAge: 40 })
    const levers = solveLevers(hopeless, 5 * 12)
    expect(levers.some((lever) => lever.value === null)).toBe(true)
  })

  it('asks for nothing when the plan already makes the deadline', () => {
    const comfortable = missing({ monthlySalary: 400000, monthlyExpenses: 80000 })
    expect(solveExtraMonthlySavings(comfortable, DEADLINE)).toBe(0)
  })
})
