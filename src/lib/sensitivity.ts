import { simulate } from './simulate'
import type { Inputs, SimulationResult } from './types'

export interface SensitivityRow {
  id: string
  label: string
  /** Months the freedom date shifts; positive is later. Null means unreachable. */
  deltaMonths: number | null
  direction: 'better' | 'worse' | 'neutral'
}

interface Perturbation {
  id: string
  label: string
  apply: (inputs: Inputs) => Inputs
}

const PERTURBATIONS: Perturbation[] = [
  {
    id: 'return-up',
    label: 'Returns 1% higher',
    apply: (i) => ({ ...i, returnPct: i.returnPct + 1 }),
  },
  {
    id: 'return-down',
    label: 'Returns 1% lower',
    apply: (i) => ({ ...i, returnPct: i.returnPct - 1 }),
  },
  {
    id: 'inflation-up',
    label: 'Inflation 1% higher',
    apply: (i) => ({
      ...i,
      inflationPct: i.inflationPct + 1,
      expenseGrowthPct: i.expenseGrowthPct + 1,
    }),
  },
  {
    id: 'inflation-down',
    label: 'Inflation 1% lower',
    apply: (i) => ({
      ...i,
      inflationPct: i.inflationPct - 1,
      expenseGrowthPct: i.expenseGrowthPct - 1,
    }),
  },
  {
    id: 'expenses-up',
    label: 'You spend 10% more',
    apply: (i) => ({ ...i, monthlyExpenses: i.monthlyExpenses * 1.1 }),
  },
  {
    id: 'expenses-down',
    label: 'You spend 10% less',
    apply: (i) => ({ ...i, monthlyExpenses: i.monthlyExpenses * 0.9 }),
  },
  {
    id: 'hike-up',
    label: 'Raises 2% bigger',
    apply: (i) =>
      i.incrementMode === 'percent'
        ? { ...i, incrementValue: i.incrementValue + 2 }
        : { ...i, incrementValue: i.incrementValue * 1.2 },
  },
  {
    id: 'hike-down',
    label: 'Raises 2% smaller',
    apply: (i) =>
      i.incrementMode === 'percent'
        ? { ...i, incrementValue: Math.max(0, i.incrementValue - 2) }
        : { ...i, incrementValue: i.incrementValue * 0.8 },
  },
  {
    id: 'save-more',
    label: 'Invest ৳10,000 more a month',
    apply: (i) => ({ ...i, otherIncomeMonthly: i.otherIncomeMonthly + 10000 }),
  },
]

/**
 * How much each assumption actually moves the date. Sorted by impact, which is
 * the point: it usually shows the savings rate mattering far more than returns.
 */
export function sensitivity(inputs: Inputs, baseline: SimulationResult): SensitivityRow[] {
  const base = baseline.monthsToFreedom
  const rows = PERTURBATIONS.map(({ id, label, apply }) => {
    const months = simulate(apply(inputs)).monthsToFreedom
    const deltaMonths = base === null || months === null ? null : months - base
    return {
      id,
      label,
      deltaMonths,
      direction:
        deltaMonths === null || deltaMonths === 0
          ? ('neutral' as const)
          : deltaMonths < 0
            ? ('better' as const)
            : ('worse' as const),
    }
  })
  return rows.sort((a, b) => Math.abs(b.deltaMonths ?? 0) - Math.abs(a.deltaMonths ?? 0))
}
