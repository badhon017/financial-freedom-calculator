import type { Inputs } from './types'

/** 4% safe withdrawal → 25x annual expenses. */
export function corpusMultiple(swrPct: number): number {
  if (swrPct <= 0) return Infinity
  return 100 / swrPct
}

/** Monthly equivalent of an annual effective rate, so 12 months compound to it exactly. */
export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1
}

export function inflationFactor(inflationPct: number, monthIndex: number): number {
  return Math.pow(1 + inflationPct / 100, monthIndex / 12)
}

/**
 * The milestone as it stands `monthIndex` months from today, in nominal taka.
 *
 * This is the heart of the calculator: in derived mode the target rises with
 * inflation every month, because the expenses it has to fund rise too. A target
 * that sits still is the lie most retirement calculators tell.
 */
export function requiredCorpusAt(inputs: Inputs, monthIndex: number): number {
  const factor = inflationFactor(inputs.inflationPct, monthIndex)
  if (inputs.targetMode === 'derived') {
    return inputs.retirementMonthlyExpense * 12 * corpusMultiple(inputs.swrPct) * factor
  }
  return inputs.targetBasis === 'today' ? inputs.targetAmount * factor : inputs.targetAmount
}

/** Restate a future amount in today's purchasing power. */
export function toRealValue(nominal: number, inflationPct: number, monthIndex: number): number {
  return nominal / inflationFactor(inflationPct, monthIndex)
}

/** Return in excess of inflation. If this is <= 0, the target can outrun you forever. */
export function realReturnPct(returnPct: number, inflationPct: number): number {
  return ((1 + returnPct / 100) / (1 + inflationPct / 100) - 1) * 100
}
