import type {
  Goal,
  Inputs,
  Milestone,
  SimulationResult,
  Warning,
  YearRow,
} from './types'
import {
  inflationFactor,
  monthlyRate,
  realReturnPct,
  requiredCorpusAt,
  toRealValue,
} from './target'

/** Hard stop for the projection: 60 years out, and never past age 100. */
const MAX_YEARS = 60

export function horizonMonths(inputs: Inputs): number {
  const toHundred = Math.round((100 - inputs.currentAge) * 12)
  return Math.max(0, Math.min(MAX_YEARS * 12, toHundred))
}

interface GoalEvent {
  inflow: number
  outflow: number
}

/**
 * Flatten goals into per-month cash flows. Annual goals (school fees, say)
 * repeat for their stated number of years; amounts in today's money are
 * inflated to the year they actually land in.
 */
function buildGoalEvents(inputs: Inputs, months: number): Map<number, GoalEvent> {
  const events = new Map<number, GoalEvent>()
  for (const goal of inputs.goals) {
    const occurrences = goal.frequency === 'annual' ? Math.max(1, Math.floor(goal.years)) : 1
    const firstMonth = Math.round((goal.atAge - inputs.currentAge) * 12)
    for (let k = 0; k < occurrences; k++) {
      const monthIndex = firstMonth + k * 12
      if (monthIndex < 0 || monthIndex > months) continue
      const amount = goal.inflate
        ? goal.amount * inflationFactor(inputs.inflationPct, monthIndex)
        : goal.amount
      const existing = events.get(monthIndex) ?? { inflow: 0, outflow: 0 }
      if (goal.direction === 'inflow') existing.inflow += amount
      else existing.outflow += amount
      events.set(monthIndex, existing)
    }
  }
  return events
}

function calendarAt(inputs: Inputs, monthIndex: number) {
  const absolute = inputs.startMonth - 1 + monthIndex
  return {
    year: inputs.startYear + Math.floor(absolute / 12),
    month: (absolute % 12) + 1,
  }
}

/**
 * Project month by month and find where the corpus curve crosses the
 * (rising) milestone curve.
 *
 * Within each month: salary is raised if a raise is due, income and expenses
 * settle, last month's balance earns its return, then savings and any goal
 * flows land. The milestone is checked against the closing balance.
 */
export function simulate(inputs: Inputs): SimulationResult {
  const months = horizonMonths(inputs)
  const returnRate = monthlyRate(inputs.returnPct)
  const expenseRate = monthlyRate(inputs.expenseGrowthPct)
  const otherIncomeRate = monthlyRate(inputs.otherIncomeGrowthPct)
  const goalEvents = buildGoalEvents(inputs, months)

  const retirementMonths = Math.max(0, Math.round((inputs.retirementAge - inputs.currentAge) * 12))
  const requiredAtRetirementAge = requiredCorpusAt(inputs, retirementMonths)

  let salary = inputs.monthlySalary
  let expenses = inputs.monthlyExpenses
  let otherIncome = inputs.otherIncomeMonthly
  let corpus = inputs.currentCorpus

  let totalContributions = 0
  let totalGrowth = 0
  let totalGoalOutflow = 0
  let totalGoalFlow = 0
  let depletionMonthIndex: number | null = null
  let coastMonthIndex: number | null = null
  let monthsToFreedom: number | null = null
  let corpusAtFreedom: number | null = null
  let requiredAtFreedom: number | null = null
  let contributionsAtFreedom = 0
  let growthAtFreedom = 0
  let corpusAtRetirementAge = corpus
  let sawNegativeSavings = false
  let goalDrovCorpusNegative = false

  const years: YearRow[] = []
  const milestones: Milestone[] = []
  const milestonesHit = new Set<string>()

  // Already there before contributing a single taka?
  const outcomeAlready = corpus >= requiredCorpusAt(inputs, 0) && corpus > 0
  if (outcomeAlready) {
    monthsToFreedom = 0
    corpusAtFreedom = corpus
    requiredAtFreedom = requiredCorpusAt(inputs, 0)
  }

  let bucket = {
    income: 0,
    expenses: 0,
    savings: 0,
    growth: 0,
    goalFlow: 0,
    opening: corpus,
  }

  const recordMilestone = (key: string, label: string, monthIndex: number, value: number) => {
    if (milestonesHit.has(key)) return
    milestonesHit.add(key)
    const { year } = calendarAt(inputs, monthIndex - 1)
    milestones.push({
      label,
      monthIndex,
      calendarYear: year,
      age: inputs.currentAge + monthIndex / 12,
      corpus: value,
    })
  }

  for (let m = 0; m < months; m++) {
    const { month: monthOfYear } = calendarAt(inputs, m)
    const age = inputs.currentAge + m / 12

    // Raises land on the anniversary month, never on day one.
    const growthStopped =
      inputs.salaryGrowthEndsAtAge !== null && age >= inputs.salaryGrowthEndsAtAge
    if (m > 0 && monthOfYear === inputs.incrementMonth && !growthStopped) {
      salary =
        inputs.incrementMode === 'percent'
          ? salary * (1 + inputs.incrementValue / 100)
          : salary + inputs.incrementValue
    }

    let bonus = 0
    let bonusInvested = 0
    if (inputs.bonusEnabled && monthOfYear === inputs.bonusMonth) {
      bonus = inputs.bonusMode === 'months' ? inputs.bonusValue * salary : inputs.bonusValue
      bonusInvested = (bonus * inputs.bonusInvestedPct) / 100
    }

    const income = salary + otherIncome + bonus
    // The un-invested slice of a bonus is spending, so savings stays income minus spending.
    const spend = expenses + (bonus - bonusInvested)
    const savings = income - spend
    if (savings < 0) sawNegativeSavings = true

    const growth = corpus * returnRate
    corpus += growth
    corpus += savings

    const event = goalEvents.get(m)
    const goalFlow = event ? event.inflow - event.outflow : 0
    const corpusBeforeGoal = corpus
    corpus += goalFlow
    if (event) totalGoalOutflow += event.outflow
    totalGoalFlow += goalFlow
    if (event && event.outflow > 0 && corpusBeforeGoal >= 0 && corpus < 0) {
      goalDrovCorpusNegative = true
    }

    totalContributions += savings
    totalGrowth += growth

    if (depletionMonthIndex === null && corpus < 0) depletionMonthIndex = m + 1

    const elapsed = m + 1
    const required = requiredCorpusAt(inputs, elapsed)

    if (monthsToFreedom === null && corpus >= required) {
      monthsToFreedom = elapsed
      corpusAtFreedom = corpus
      requiredAtFreedom = required
      // Freeze the principal/growth split here; the loop runs on past it.
      contributionsAtFreedom = totalContributions + totalGoalFlow
      growthAtFreedom = totalGrowth
    }

    // Coast FI: stop contributing now, let it compound, still land on target.
    if (coastMonthIndex === null && elapsed < retirementMonths && corpus > 0) {
      const compounded = corpus * Math.pow(1 + returnRate, retirementMonths - elapsed)
      if (compounded >= requiredAtRetirementAge) coastMonthIndex = elapsed
    }

    if (elapsed === retirementMonths) corpusAtRetirementAge = corpus

    if (corpus >= 1e7) recordMilestone('crore-1', 'First ৳1 crore', elapsed, corpus)
    if (corpus >= 5e7) recordMilestone('crore-5', '৳5 crore', elapsed, corpus)
    for (const share of [0.25, 0.5, 0.75]) {
      if (required > 0 && corpus >= required * share) {
        recordMilestone(`share-${share}`, `${share * 100}% of target`, elapsed, corpus)
      }
    }

    bucket.income += income
    bucket.expenses += spend
    bucket.savings += savings
    bucket.growth += growth
    bucket.goalFlow += goalFlow

    if (m % 12 === 11 || m === months - 1) {
      const index = Math.floor(m / 12)
      const { year } = calendarAt(inputs, m)
      years.push({
        index,
        calendarYear: year,
        age: Math.round((inputs.currentAge + elapsed / 12) * 10) / 10,
        income: bucket.income,
        expenses: bucket.expenses,
        savings: bucket.savings,
        growth: bucket.growth,
        goalFlow: bucket.goalFlow,
        openingCorpus: bucket.opening,
        closingCorpus: corpus,
        requiredCorpus: required,
        savingsRatePct: bucket.income > 0 ? (bucket.savings / bucket.income) * 100 : 0,
        closingCorpusReal: toRealValue(corpus, inputs.inflationPct, elapsed),
        requiredCorpusReal: toRealValue(required, inputs.inflationPct, elapsed),
      })
      bucket = { income: 0, expenses: 0, savings: 0, growth: 0, goalFlow: 0, opening: corpus }
    }

    expenses *= 1 + expenseRate
    otherIncome *= 1 + otherIncomeRate
  }

  if (retirementMonths >= months) corpusAtRetirementAge = corpus

  const realReturn = realReturnPct(inputs.returnPct, inputs.inflationPct)
  const outcome = outcomeAlready ? 'already' : monthsToFreedom !== null ? 'reached' : 'unreachable'

  const warnings: Warning[] = []
  if (realReturn <= 0) {
    warnings.push({
      code: 'inflation-outpaces-returns',
      message:
        `Your ${inputs.returnPct}% return does not beat ${inputs.inflationPct}% inflation. ` +
        'In real terms your money shrinks every year, so a target that rises with inflation ' +
        'can never be caught no matter how long you save.',
    })
  }
  if (sawNegativeSavings) {
    warnings.push({
      code: 'negative-savings',
      message:
        'Expenses exceed income in at least one year, so you are drawing down the corpus ' +
        'rather than adding to it.',
    })
  }
  if (inputs.expenseGrowthPct > inputs.incrementValue && inputs.incrementMode === 'percent') {
    warnings.push({
      code: 'expenses-grow-faster-than-salary',
      message:
        `Expenses grow at ${inputs.expenseGrowthPct}% while your salary grows at ` +
        `${inputs.incrementValue}%. Every raise is more than eaten, so your savings shrink over time.`,
    })
  }
  if (depletionMonthIndex !== null) {
    warnings.push({
      code: 'corpus-depleted',
      message: 'The corpus falls below zero in this plan — you would be borrowing to keep going.',
    })
  }
  if (goalDrovCorpusNegative) {
    warnings.push({
      code: 'goal-exceeds-corpus',
      message: 'One of your goals costs more than the corpus holds at that moment.',
    })
  }
  if (monthsToFreedom !== null && monthsToFreedom > retirementMonths) {
    warnings.push({
      code: 'after-retirement-age',
      message: `You reach the target after age ${inputs.retirementAge}, the age you said you want to stop.`,
    })
  }

  if (coastMonthIndex !== null) {
    const { year } = calendarAt(inputs, coastMonthIndex - 1)
    milestones.push({
      label: 'Coast point — can stop investing',
      monthIndex: coastMonthIndex,
      calendarYear: year,
      age: inputs.currentAge + coastMonthIndex / 12,
      corpus: years.find((y) => (y.index + 1) * 12 >= coastMonthIndex)?.closingCorpus ?? 0,
    })
  }
  milestones.sort((a, b) => a.monthIndex - b.monthIndex)

  return {
    outcome,
    monthsToFreedom,
    freedomAge: monthsToFreedom === null ? null : inputs.currentAge + monthsToFreedom / 12,
    freedomCalendarYear:
      monthsToFreedom === null ? null : calendarAt(inputs, Math.max(0, monthsToFreedom - 1)).year,
    corpusAtFreedom,
    requiredAtFreedom,
    requiredAtFreedomReal:
      requiredAtFreedom === null || monthsToFreedom === null
        ? null
        : toRealValue(requiredAtFreedom, inputs.inflationPct, monthsToFreedom),
    years,
    warnings,
    milestones,
    totalContributions,
    totalGrowth,
    totalGoalOutflow,
    contributionsAtFreedom,
    growthAtFreedom,
    depletionMonthIndex,
    coastMonthIndex,
    realReturnPct: realReturn,
    corpusAtRetirementAge,
    requiredAtRetirementAge,
    horizonMonths: months,
  }
}

/** Re-run without one goal, to price what that goal costs in years. */
export function simulateWithoutGoal(inputs: Inputs, goalId: string): SimulationResult {
  return simulate({ ...inputs, goals: inputs.goals.filter((g: Goal) => g.id !== goalId) })
}
