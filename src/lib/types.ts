/** How the yearly salary increment is expressed. */
export type IncrementMode = 'percent' | 'fixed'

/** Annual bonus expressed as months-of-salary or a flat amount. */
export type BonusMode = 'months' | 'fixed'

/** Whether the milestone is a number you typed or one derived from expenses. */
export type TargetMode = 'fixed' | 'derived'

/** Whether an amount is stated in today's purchasing power or future taka. */
export type MoneyBasis = 'today' | 'future'

export type GoalDirection = 'outflow' | 'inflow'
export type GoalFrequency = 'once' | 'annual'

export interface Goal {
  id: string
  name: string
  /** Age at which the first occurrence lands. */
  atAge: number
  /** Amount per occurrence, in today's money when `inflate` is true. */
  amount: number
  direction: GoalDirection
  frequency: GoalFrequency
  /** Number of yearly occurrences; only used when frequency is 'annual'. */
  years: number
  inflate: boolean
}

export interface Inputs {
  currentAge: number
  retirementAge: number
  startYear: number
  /** 1-12. */
  startMonth: number

  /** Take-home (in-hand) pay per month. */
  monthlySalary: number
  incrementMode: IncrementMode
  /** Percent when mode is 'percent', taka added to monthly pay when 'fixed'. */
  incrementValue: number
  /** 1-12: the month raises land in. */
  incrementMonth: number
  /** Salary stops growing at this age; null means it never plateaus. */
  salaryGrowthEndsAtAge: number | null

  bonusEnabled: boolean
  bonusMode: BonusMode
  bonusValue: number
  bonusMonth: number
  /** 0-100: share of the bonus that gets invested rather than spent. */
  bonusInvestedPct: number

  otherIncomeMonthly: number
  otherIncomeGrowthPct: number

  monthlyExpenses: number
  /** Lifestyle inflation — defaults to general inflation but can run hotter. */
  expenseGrowthPct: number

  currentCorpus: number
  /** Expected annual return, post-tax. */
  returnPct: number

  inflationPct: number

  targetMode: TargetMode
  targetAmount: number
  targetBasis: MoneyBasis
  /** Monthly spending you want retirement to fund, in today's money. */
  retirementMonthlyExpense: number
  /** Safe withdrawal rate; the corpus multiple is 100 / swrPct. */
  swrPct: number

  goals: Goal[]
}

export interface YearRow {
  /** 0-based year offset from the start of the projection. */
  index: number
  calendarYear: number
  age: number
  income: number
  expenses: number
  savings: number
  growth: number
  /** Net goal flow for the year; negative means money left the corpus. */
  goalFlow: number
  openingCorpus: number
  closingCorpus: number
  /** The milestone as it stands at the end of this year. */
  requiredCorpus: number
  savingsRatePct: number
  /** Closing corpus expressed in today's purchasing power. */
  closingCorpusReal: number
  requiredCorpusReal: number
}

export type Outcome = 'reached' | 'already' | 'unreachable'

export type WarningCode =
  | 'negative-savings'
  | 'inflation-outpaces-returns'
  | 'expenses-grow-faster-than-salary'
  | 'corpus-depleted'
  | 'after-retirement-age'
  | 'goal-exceeds-corpus'

export interface Warning {
  code: WarningCode
  message: string
}

export interface Milestone {
  label: string
  monthIndex: number
  calendarYear: number
  age: number
  corpus: number
}

export interface SimulationResult {
  outcome: Outcome
  /** Months from the start of the projection to the crossing. */
  monthsToFreedom: number | null
  freedomAge: number | null
  freedomCalendarYear: number | null
  corpusAtFreedom: number | null
  requiredAtFreedom: number | null
  /** The milestone at the crossing, restated in today's purchasing power. */
  requiredAtFreedomReal: number | null

  years: YearRow[]
  warnings: Warning[]
  milestones: Milestone[]

  /** Totals across the whole projected horizon. */
  totalContributions: number
  totalGrowth: number
  totalGoalOutflow: number

  /**
   * The same split frozen at the crossing — what you had actually put in, and
   * what the returns had made, on the day you became free. Horizon totals keep
   * climbing long past that point, so they are the wrong number to show.
   */
  contributionsAtFreedom: number
  growthAtFreedom: number

  /** Month the corpus first goes below zero, if it ever does. */
  depletionMonthIndex: number | null
  /** Month after which you could stop contributing and still land on target. */
  coastMonthIndex: number | null

  realReturnPct: number
  /** Corpus and milestone at retirement age, reached or not. */
  corpusAtRetirementAge: number
  requiredAtRetirementAge: number
  horizonMonths: number
}
