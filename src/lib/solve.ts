import { simulate } from './simulate'
import type { Inputs } from './types'

/**
 * Smallest value in [lo, hi] that satisfies a monotone predicate, or null if
 * even hi fails. Used to answer "what would it actually take?".
 */
function bisect(lo: number, hi: number, ok: (x: number) => boolean, steps = 48): number | null {
  if (!ok(hi)) return null
  if (ok(lo)) return lo
  let low = lo
  let high = hi
  for (let i = 0; i < steps; i++) {
    const mid = (low + high) / 2
    if (ok(mid)) high = mid
    else low = mid
  }
  return high
}

function reachesBy(inputs: Inputs, deadlineMonths: number): boolean {
  const months = simulate(inputs).monthsToFreedom
  return months !== null && months <= deadlineMonths
}

export interface Lever {
  id: string
  label: string
  detail: string
  value: number | null
}

/** Extra taka per month into investments — a raise, a side income, anything. */
export function solveExtraMonthlySavings(inputs: Inputs, deadlineMonths: number): number | null {
  const ceiling = Math.max(inputs.monthlySalary * 10, 1000000)
  return bisect(0, ceiling, (extra) =>
    reachesBy({ ...inputs, otherIncomeMonthly: inputs.otherIncomeMonthly + extra }, deadlineMonths),
  )
}

/**
 * Living on less cuts twice: you save more now *and* the corpus you need
 * shrinks, because the target is a multiple of what you spend.
 */
export function solveExpenseCutPct(inputs: Inputs, deadlineMonths: number): number | null {
  return bisect(0, 90, (cutPct) => {
    const keep = 1 - cutPct / 100
    return reachesBy(
      {
        ...inputs,
        monthlyExpenses: inputs.monthlyExpenses * keep,
        retirementMonthlyExpense: inputs.retirementMonthlyExpense * keep,
      },
      deadlineMonths,
    )
  })
}

/** The return you would need — useful mostly for seeing when it is implausible. */
export function solveRequiredReturnPct(inputs: Inputs, deadlineMonths: number): number | null {
  return bisect(inputs.returnPct, 40, (returnPct) =>
    reachesBy({ ...inputs, returnPct }, deadlineMonths),
  )
}

/** Delaying retirement is itself a lever: how long would this plan actually need? */
export function solveLevers(inputs: Inputs, deadlineMonths: number): Lever[] {
  const extra = solveExtraMonthlySavings(inputs, deadlineMonths)
  const cut = solveExpenseCutPct(inputs, deadlineMonths)
  const ret = solveRequiredReturnPct(inputs, deadlineMonths)
  return [
    {
      id: 'extra',
      label: 'Invest more each month',
      detail: 'A raise, a side income, or simply a higher savings rate.',
      value: extra,
    },
    {
      id: 'cut',
      label: 'Spend less',
      detail: 'Cuts twice — you save more now and need a smaller corpus later.',
      value: cut,
    },
    {
      id: 'return',
      label: 'Earn a higher return',
      detail: 'The least reliable lever: you do not control it.',
      value: ret,
    },
  ]
}
