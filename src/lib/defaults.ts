import type { Goal, Inputs } from './types'

/**
 * Assumed post-tax annual returns for instruments a Bangladeshi saver actually
 * uses. These are starting points to be edited, not promises — Sanchayapatra
 * rates are set by the government and equity returns are anyone's guess.
 */
export interface Instrument {
  id: string
  name: string
  note: string
  returnPct: number
}

export const INSTRUMENTS: Instrument[] = [
  { id: 'sanchayapatra', name: 'Sanchayapatra', note: 'Govt. savings certificate, after 10% source tax', returnPct: 11 },
  { id: 'dps', name: 'DPS', note: 'Bank deposit pension scheme', returnPct: 9 },
  { id: 'fdr', name: 'FDR', note: 'Fixed deposit', returnPct: 8.5 },
  { id: 'equity', name: 'DSE equity / mutual funds', note: 'Long-run average, volatile year to year', returnPct: 13 },
  { id: 'gold', name: 'Gold', note: 'Long-run average', returnPct: 10 },
]

export const SWR_OPTIONS = [
  {
    pct: 4,
    multiple: '25×',
    short: 'Classic',
    detail: 'The original rule of thumb, drawn from decades of US market history.',
  },
  {
    pct: 3.5,
    multiple: '29×',
    short: 'Safer',
    detail: 'A margin for error. Costs you a bigger corpus, buys you a calmer retirement.',
  },
  {
    pct: 3,
    multiple: '33×',
    short: 'Safest',
    detail: 'Sensible where inflation runs high, as it does in Bangladesh.',
  },
]

export const GOAL_PRESETS: Array<Pick<Goal, 'name' | 'amount' | 'direction' | 'frequency' | 'years'>> = [
  { name: "Child's education", amount: 400000, direction: 'outflow', frequency: 'annual', years: 4 },
  { name: 'Home down payment', amount: 3000000, direction: 'outflow', frequency: 'once', years: 1 },
  { name: 'Wedding', amount: 1500000, direction: 'outflow', frequency: 'once', years: 1 },
  { name: 'Hajj', amount: 800000, direction: 'outflow', frequency: 'once', years: 1 },
  { name: 'Car', amount: 2500000, direction: 'outflow', frequency: 'once', years: 1 },
  { name: 'Gratuity / PF payout', amount: 2000000, direction: 'inflow', frequency: 'once', years: 1 },
  { name: 'Property sale', amount: 5000000, direction: 'inflow', frequency: 'once', years: 1 },
  { name: 'Inheritance', amount: 3000000, direction: 'inflow', frequency: 'once', years: 1 },
]

const now = new Date()

export const DEFAULT_INPUTS: Inputs = {
  currentAge: 30,
  retirementAge: 60,
  startYear: now.getFullYear(),
  startMonth: now.getMonth() + 1,

  monthlySalary: 100000,
  incrementMode: 'percent',
  incrementValue: 10,
  incrementMonth: 1,
  salaryGrowthEndsAtAge: null,

  // Two Eid bonuses are close to universal here.
  bonusEnabled: true,
  bonusMode: 'months',
  bonusValue: 2,
  bonusMonth: 6,
  bonusInvestedPct: 50,

  otherIncomeMonthly: 0,
  otherIncomeGrowthPct: 0,

  monthlyExpenses: 60000,
  expenseGrowthPct: 9,

  currentCorpus: 500000,
  returnPct: 11,

  inflationPct: 9,

  targetMode: 'derived',
  targetAmount: 50000000,
  targetBasis: 'today',
  retirementMonthlyExpense: 60000,
  swrPct: 4,

  goals: [],
}

export function newGoal(preset?: Partial<Goal>): Goal {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: 'New goal',
    atAge: DEFAULT_INPUTS.currentAge + 5,
    amount: 1000000,
    direction: 'outflow',
    frequency: 'once',
    years: 1,
    inflate: true,
    ...preset,
  }
}
