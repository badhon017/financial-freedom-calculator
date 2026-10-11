import { useState } from 'react'
import { Card, Info, MoneyField, NumberField } from '../ui/primitives'
import { INSTRUMENTS } from '../../lib/defaults'
import { formatPct } from '../../lib/format'
import { realReturnPct } from '../../lib/target'
import type { CardProps } from './types'

/** Blend the instrument returns by weight, so the headline rate isn't a guess. */
function blendedReturn(weights: Record<string, number>): number | null {
  const total = INSTRUMENTS.reduce((sum, item) => sum + (weights[item.id] || 0), 0)
  if (total <= 0) return null
  return (
    INSTRUMENTS.reduce((sum, item) => sum + (weights[item.id] || 0) * item.returnPct, 0) / total
  )
}

export function InvestmentCard({ inputs, update }: CardProps) {
  const [weights, setWeights] = useState<Record<string, number>>({
    sanchayapatra: 40,
    dps: 20,
    fdr: 0,
    equity: 30,
    gold: 10,
  })
  const blended = blendedReturn(weights)
  const real = realReturnPct(inputs.returnPct, inputs.inflationPct)

  return (
    <Card icon="bank" tone="growth" title="Investments" subtitle="What you already have, and what it earns">
      <div className="flex flex-col gap-4">
        <MoneyField
          label="Corpus today"
          value={inputs.currentCorpus}
          onChange={(value) => update('currentCorpus', value)}
          hint="Everything already invested: savings certificates, DPS, shares, gold."
        />

        <NumberField
          label="Expected annual return"
          value={inputs.returnPct}
          onChange={(value) => update('returnPct', value)}
          suffix="%"
          step={0.5}
          hint="After tax. This is a long-run average, not a promise."
        />

        <div
          className={
            'rounded-lg border px-3 py-2 text-xs ' +
            (real <= 0 ? 'border-critical/40 bg-critical/5 text-critical' : 'border-hairline bg-sunken text-ink-2')
          }
        >
          <span className="tnum font-semibold">{formatPct(real)}</span> real return after{' '}
          {formatPct(inputs.inflationPct)} inflation
          <Info text="Real return is what your money actually gains in purchasing power. If it is zero or negative, a target that rises with inflation can never be caught." />
          {real <= 0 && (
            <p className="mt-1">Inflation is eating everything you earn. The target will outrun you.</p>
          )}
        </div>

        <details className="group rounded-lg border border-hairline bg-sunken p-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-ink-2 [&::-webkit-details-marker]:hidden">
            Work it out from a portfolio mix
            <span className="float-right text-ink-muted group-open:rotate-180 inline-block transition">⌄</span>
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {INSTRUMENTS.map((instrument) => (
              <div key={instrument.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-ink">{instrument.name}</div>
                  <div className="truncate text-[11px] text-ink-muted">
                    {instrument.note} · {formatPct(instrument.returnPct)}
                  </div>
                </div>
                <div className="relative w-20 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weights[instrument.id] ?? 0}
                    onChange={(event) =>
                      setWeights((prev) => ({
                        ...prev,
                        [instrument.id]: Math.max(0, Number(event.target.value) || 0),
                      }))
                    }
                    aria-label={`${instrument.name} allocation`}
                    className="w-full rounded-md border border-hairline bg-surface py-1.5 pr-6 pl-2 text-xs text-ink tnum outline-none focus:border-corpus"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-ink-muted">
                    %
                  </span>
                </div>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-hairline pt-3">
              <span className="text-xs text-ink-2">
                Blended:{' '}
                <span className="font-semibold text-ink tnum">
                  {blended === null ? '—' : formatPct(blended, 2)}
                </span>
              </span>
              <button
                type="button"
                disabled={blended === null}
                onClick={() => blended !== null && update('returnPct', Math.round(blended * 10) / 10)}
                className="rounded-md bg-corpus px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Use this rate
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">
              Weights are normalised, so they need not add to 100.
            </p>
          </div>
        </details>
      </div>
    </Card>
  )
}
