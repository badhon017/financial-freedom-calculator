import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_INPUTS } from '../lib/defaults'
import { simulate, simulateWithoutGoal } from '../lib/simulate'
import { sensitivity } from '../lib/sensitivity'
import { solveLevers } from '../lib/solve'
import { encodeInputs, readInputsFromUrl } from '../lib/url'
import type { Goal, Inputs } from '../lib/types'

export interface GoalImpact {
  goalId: string
  /** Months the freedom date moves because of this goal; positive is later. */
  deltaMonths: number | null
}

export function useCalculator() {
  const [inputs, setInputs] = useState<Inputs>(() => readInputsFromUrl() ?? DEFAULT_INPUTS)

  const update = useCallback(<K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }, [])

  const patch = useCallback((changes: Partial<Inputs>) => {
    setInputs((prev) => ({ ...prev, ...changes }))
  }, [])

  const setGoals = useCallback((goals: Goal[]) => {
    setInputs((prev) => ({ ...prev, goals }))
  }, [])

  const result = useMemo(() => simulate(inputs), [inputs])

  // The whole plan is only 720 monthly steps, so re-running it a dozen times
  // for sensitivity and per-goal pricing is still well under a frame.
  const sensitivityRows = useMemo(() => sensitivity(inputs, result), [inputs, result])

  const goalImpacts = useMemo<GoalImpact[]>(
    () =>
      inputs.goals.map((goal) => {
        const without = simulateWithoutGoal(inputs, goal.id)
        const deltaMonths =
          result.monthsToFreedom === null || without.monthsToFreedom === null
            ? null
            : result.monthsToFreedom - without.monthsToFreedom
        return { goalId: goal.id, deltaMonths }
      }),
    [inputs, result],
  )

  const deadlineMonths = Math.max(
    12,
    Math.round((inputs.retirementAge - inputs.currentAge) * 12),
  )

  // Only worth solving when the plan misses — otherwise it is noise.
  const needsLevers =
    result.outcome === 'unreachable' ||
    (result.monthsToFreedom !== null && result.monthsToFreedom > deadlineMonths)

  const levers = useMemo(
    () => (needsLevers ? solveLevers(inputs, deadlineMonths) : []),
    [inputs, deadlineMonths, needsLevers],
  )

  useEffect(() => {
    // Keep the address bar in sync so any view is shareable, without stacking
    // a history entry on every keystroke.
    const handle = window.setTimeout(() => {
      window.history.replaceState(null, '', `#s=${encodeInputs(inputs)}`)
    }, 400)
    return () => window.clearTimeout(handle)
  }, [inputs])

  return {
    inputs,
    setInputs,
    update,
    patch,
    setGoals,
    result,
    sensitivityRows,
    goalImpacts,
    levers,
    needsLevers,
    deadlineMonths,
  }
}
