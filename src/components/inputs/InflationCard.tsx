import { Card, Info, NumberField } from '../ui/primitives'
import type { CardProps } from './types'

export function InflationCard({ inputs, update, patch }: CardProps) {
  return (
    <Card icon="inflation" tone="target" title="Inflation" subtitle="The quiet force that moves your target">
      <NumberField
        label="General inflation"
        value={inputs.inflationPct}
        onChange={(value) => update('inflationPct', value)}
        suffix="%"
        step={0.5}
        hint="Bangladesh CPI has run roughly 9–11% in recent years."
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[6, 7.5, 9, 11].map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => patch({ inflationPct: rate, expenseGrowthPct: rate })}
            className={
              'rounded-md border px-2 py-1 text-[11px] transition ' +
              (inputs.inflationPct === rate
                ? 'border-corpus bg-corpus/10 text-corpus'
                : 'border-hairline text-ink-2 hover:bg-sunken')
            }
          >
            {rate}%
          </button>
        ))}
        <span className="text-[11px] text-ink-muted">
          sets expense growth too
          <Info text="Inflation does two jobs here: it raises the corpus you need, and it raises what your life costs along the way." />
        </span>
      </div>
    </Card>
  )
}
