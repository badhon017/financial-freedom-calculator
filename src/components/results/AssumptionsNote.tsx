import { Card } from '../ui/primitives'
import { Icon } from '../ui/icons'
import type { IconName } from '../ui/icons'
import { formatPct } from '../../lib/format'
import type { Inputs } from '../../lib/types'

/**
 * Stating the limits plainly is part of the product. A calculator that hides
 * them is just a confident guess. Laid out as cards rather than a bullet list
 * so the four gaps are scannable instead of a paragraph people skip.
 */
export function AssumptionsNote({ inputs }: { inputs: Inputs }) {
  const gaps: Array<{ icon: IconName; title: string; body: string }> = [
    {
      icon: 'percent',
      title: 'Tax',
      body:
        `Salary is treated as take-home and the ${formatPct(inputs.returnPct)} return as post-tax. ` +
        'Sanchayapatra carries 10% source tax and FDR interest is taxable — enter net figures, or the date will be optimistic.',
    },
    {
      icon: 'route',
      title: 'Life after the milestone',
      body:
        `The projection stops the day you hit the target. The ${formatPct(inputs.swrPct)} withdrawal rate ` +
        'stands in for whether the money lasts; there is no drawdown simulation here.',
    },
    {
      icon: 'wave',
      title: 'Bad luck in the wrong order',
      body:
        `Returns are a steady ${formatPct(inputs.returnPct)} every year. Real markets are not, and a crash ` +
        'early in retirement hurts far more than the same crash later.',
    },
    {
      icon: 'heart',
      title: 'Career breaks, illness, currency',
      body:
        'A redundancy, a long illness, or taka depreciation against the dollar will each move this date ' +
        'more than a percentage point of return will.',
    },
  ]

  return (
    <Card
      icon="shield"
      title="What this does not model"
      subtitle="So you know how much weight the number can carry"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {gaps.map((gap) => (
          <div
            key={gap.title}
            className="rounded-xl border border-hairline bg-sunken p-3 transition-colors duration-200 hover:border-ink-muted/30"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface p-1 text-ink-muted">
                <Icon name={gap.icon} />
              </span>
              <h3 className="text-xs font-semibold text-ink">{gap.title}</h3>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2">{gap.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-hairline pt-3 text-[11px] text-ink-muted">
        Treat the answer as a direction, not a date. Its real use is comparison: change one
        assumption, see which way the date moves, and by how much.
      </p>
    </Card>
  )
}
