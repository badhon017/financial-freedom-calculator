import { Card } from '../ui/primitives'
import { formatCompact, formatDuration } from '../../lib/format'
import type { SimulationResult } from '../../lib/types'

/**
 * A vertical timeline rather than a list. The filled rail is the part of the
 * journey each marker sits on, so the markers read as progress rather than rows.
 */
export function MilestoneStrip({ result }: { result: SimulationResult }) {
  if (result.milestones.length === 0) return null
  const coast = result.milestones.find((m) => m.label.startsWith('Coast'))
  const finish = result.monthsToFreedom ?? result.horizonMonths

  return (
    <Card
      icon="spark"
      tone="growth"
      title="Milestones on the way"
      subtitle="The markers you pass before the finish line"
    >
      <ol className="relative flex flex-col">
        {/* The rail runs behind the dots, from the first marker to the last. */}
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[5px] w-px"
          style={{
            background: 'linear-gradient(180deg, var(--series-corpus), var(--series-growth))',
          }}
        />
        {result.milestones.map((milestone, index) => {
          const last = index === result.milestones.length - 1
          return (
            <li key={milestone.label} className="relative flex items-center gap-3 py-2 pl-5">
              <span
                className="absolute left-0 h-[11px] w-[11px] rounded-full border-2"
                style={{
                  background: last ? 'var(--series-growth)' : 'var(--surface-1)',
                  borderColor: last ? 'var(--series-growth)' : 'var(--series-corpus)',
                }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                {milestone.label}
              </span>
              <span className="shrink-0 text-xs text-ink-muted tnum">
                age {Math.floor(milestone.age)} · {milestone.calendarYear}
              </span>
              <span className="hidden w-24 shrink-0 text-right text-xs text-ink-2 tnum sm:block">
                {formatDuration(milestone.monthIndex)}
              </span>
            </li>
          )
        })}
        <li className="relative flex items-center gap-3 py-2 pl-5">
          <span
            className="absolute left-0 flex h-[11px] w-[11px] items-center justify-center rounded-full"
            style={{ background: 'var(--series-growth)' }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-growth">
            Financially free
          </span>
          <span className="shrink-0 text-xs text-ink-2 tnum">{formatDuration(finish)}</span>
        </li>
      </ol>
      {coast && (
        <p className="mt-3 border-t border-hairline pt-3 text-[11px] text-ink-muted">
          The coast point is the underrated one: from {coast.calendarYear} you could stop investing
          entirely, never add another taka, and still land on target by your retirement age —
          {' '}{formatCompact(coast.corpus)} left alone does the rest.
        </p>
      )}
    </Card>
  )
}
