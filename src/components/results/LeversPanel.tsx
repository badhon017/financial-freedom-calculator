import { Card } from '../ui/primitives'
import { formatCompact, formatPct } from '../../lib/format'
import type { Lever } from '../../lib/solve'
import type { Inputs } from '../../lib/types'

function describe(lever: Lever, inputs: Inputs): string | null {
  if (lever.value === null) return null
  if (lever.id === 'extra') return `${formatCompact(Math.ceil(lever.value / 500) * 500)} a month more`
  if (lever.id === 'cut')
    return `Spend ${formatPct(lever.value, 0)} less — about ${formatCompact(
      (inputs.monthlyExpenses * lever.value) / 100,
    )} a month`
  if (lever.id === 'return') return `Earn ${formatPct(lever.value)} instead of ${formatPct(inputs.returnPct)}`
  return null
}

/**
 * Only shown when the plan misses. Each lever is solved by re-running the
 * projection, so the numbers are what it would genuinely take — not a rule of
 * thumb.
 */
export function LeversPanel({
  levers,
  inputs,
  deadlineMonths,
}: {
  levers: Lever[]
  inputs: Inputs
  deadlineMonths: number
}) {
  if (levers.length === 0) return null
  const usable = levers.filter((lever) => lever.value !== null && lever.value > 0)

  return (
    <Card
      icon="shield"
      tone="corpus"
      title={`What would get you there by age ${inputs.retirementAge}`}
      subtitle={`Each of these, on its own, closes the gap within ${Math.round(deadlineMonths / 12)} years`}
    >
      <div className="flex flex-col gap-2">
        {usable.map((lever) => (
          <div
            key={lever.id}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-hairline bg-sunken px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium text-ink">{lever.label}</div>
              <div className="text-[11px] text-ink-muted">{lever.detail}</div>
            </div>
            <div className="text-sm font-semibold text-corpus tnum">
              {describe(lever, inputs)}
            </div>
          </div>
        ))}
        {usable.length === 0 && (
          <p className="text-xs text-ink-2">
            None of the usual levers close this gap on their own. The target itself is the thing to
            revisit — a lower retirement spend, or a later date.
          </p>
        )}
        {levers.some((lever) => lever.value === null) && (
          <p className="text-[11px] text-ink-muted">
            Levers shown as unavailable cannot close the gap at any plausible setting.
          </p>
        )}
      </div>
    </Card>
  )
}
