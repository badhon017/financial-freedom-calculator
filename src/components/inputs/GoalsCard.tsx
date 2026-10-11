import { Card, Info } from '../ui/primitives'
import { Icon } from '../ui/icons'
import { GOAL_PRESETS, newGoal } from '../../lib/defaults'
import { formatCompact, formatDuration, groupBD } from '../../lib/format'
import type { Goal, Inputs } from '../../lib/types'
import type { GoalImpact } from '../../state/useCalculator'

export function GoalsCard({
  inputs,
  setGoals,
  impacts,
}: {
  inputs: Inputs
  setGoals: (goals: Goal[]) => void
  impacts: GoalImpact[]
}) {
  const update = (id: string, changes: Partial<Goal>) =>
    setGoals(inputs.goals.map((goal) => (goal.id === id ? { ...goal, ...changes } : goal)))
  const remove = (id: string) => setGoals(inputs.goals.filter((goal) => goal.id !== id))

  const fieldClass =
    'w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-xs text-ink tnum outline-none focus:border-corpus'

  return (
    <Card
      icon="route"
      title="Life happens"
      subtitle="Big one-off costs and windfalls along the way"
    >
      <div className="flex flex-col gap-3">
        {inputs.goals.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline bg-sunken/60 px-3.5 py-4 text-center">
            <span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface p-1.5 text-ink-muted">
              <Icon name="route" />
            </span>
            <p className="text-xs text-ink-2">
              A house, a wedding, four years of university fees — these are what actually move a
              freedom date.
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">
              Add one below and you will see exactly what it costs you in years.
            </p>
          </div>
        )}

        {inputs.goals.map((goal) => {
          const impact = impacts.find((item) => item.goalId === goal.id)
          const years = goal.atAge - inputs.currentAge
          return (
            <div key={goal.id} className="rounded-lg border border-hairline bg-sunken p-3">
              <div className="flex items-center gap-2">
                <input
                  value={goal.name}
                  onChange={(event) => update(goal.id, { name: event.target.value })}
                  aria-label="Goal name"
                  className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-medium text-ink outline-none hover:border-hairline focus:border-corpus"
                />
                <button
                  type="button"
                  onClick={() => remove(goal.id)}
                  aria-label={`Remove ${goal.name}`}
                  className="rounded-md px-2 py-1 text-xs text-ink-muted transition hover:bg-critical/10 hover:text-critical"
                >
                  Remove
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-ink-muted">Amount ৳</span>
                  <input
                    value={groupBD(goal.amount)}
                    onChange={(event) =>
                      update(goal.id, {
                        amount: Number(event.target.value.replace(/[^\d]/g, '') || 0),
                      })
                    }
                    inputMode="numeric"
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-ink-muted">At age</span>
                  <input
                    type="number"
                    value={goal.atAge}
                    min={inputs.currentAge}
                    onChange={(event) => update(goal.id, { atAge: Number(event.target.value) })}
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-ink-muted">Direction</span>
                  <select
                    value={goal.direction}
                    onChange={(event) =>
                      update(goal.id, { direction: event.target.value as Goal['direction'] })
                    }
                    className={fieldClass}
                  >
                    <option value="outflow">Costs money</option>
                    <option value="inflow">Brings money</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-ink-muted">Repeats</span>
                  <select
                    value={goal.frequency === 'once' ? 'once' : String(goal.years)}
                    onChange={(event) =>
                      update(
                        goal.id,
                        event.target.value === 'once'
                          ? { frequency: 'once', years: 1 }
                          : { frequency: 'annual', years: Number(event.target.value) },
                      )
                    }
                    className={fieldClass}
                  >
                    <option value="once">Once</option>
                    {[2, 3, 4, 5, 10, 15, 18].map((count) => (
                      <option key={count} value={count}>
                        {count} years
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <input
                    type="checkbox"
                    checked={goal.inflate}
                    onChange={(event) => update(goal.id, { inflate: event.target.checked })}
                    className="accent-[var(--series-corpus)]"
                  />
                  Amount is in today's money
                  <Info text="Tick this and the cost is inflated to the year it lands — a 30 lakh house today is far more than 30 lakh in twelve years." />
                </label>
                {impact && impact.deltaMonths !== null && impact.deltaMonths !== 0 && (
                  <span
                    className={
                      'rounded-md px-2 py-0.5 text-[11px] font-medium ' +
                      (impact.deltaMonths > 0
                        ? 'bg-target/10 text-target'
                        : 'bg-corpus/10 text-corpus')
                    }
                  >
                    {impact.deltaMonths > 0 ? 'Delays freedom by ' : 'Brings freedom forward '}
                    {formatDuration(Math.abs(impact.deltaMonths))}
                  </span>
                )}
                {goal.frequency === 'annual' && (
                  <span className="text-[11px] text-ink-muted tnum">
                    {formatCompact(goal.amount * goal.years)} total, from {years} years out
                  </span>
                )}
              </div>
            </div>
          )
        })}

        <div className="flex flex-col gap-2.5 border-t border-hairline pt-3">
          {([
            ['outflow', 'Costs', 'var(--series-target)'],
            ['inflow', 'Windfalls', 'var(--series-growth)'],
          ] as const).map(([direction, heading, dot]) => (
            <div key={direction}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: dot }}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
                  {heading}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_PRESETS.filter((preset) => preset.direction === direction).map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setGoals([
                        ...inputs.goals,
                        newGoal({
                          ...preset,
                          atAge: Math.min(inputs.retirementAge - 1, inputs.currentAge + 5),
                        }),
                      ])
                    }
                    className="rounded-lg border border-hairline px-2.5 py-1 text-[11px] text-ink-2 transition hover:border-ink-muted/40 hover:bg-sunken hover:text-ink"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
