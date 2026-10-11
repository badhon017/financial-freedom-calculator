import { Card, Info, MoneyField, Segmented } from '../ui/primitives'
import { Icon } from '../ui/icons'
import { SWR_OPTIONS } from '../../lib/defaults'
import { formatCompact, formatTaka } from '../../lib/format'
import { corpusMultiple, requiredCorpusAt } from '../../lib/target'
import type { CardProps } from './types'

export function TargetCard({ inputs, update, patch }: CardProps) {
  const today = requiredCorpusAt(inputs, 0)
  const atRetirement = requiredCorpusAt(
    inputs,
    Math.max(0, Math.round((inputs.retirementAge - inputs.currentAge) * 12)),
  )
  const multiple = corpusMultiple(inputs.swrPct)

  return (
    <Card icon="flag" tone="target" title="The milestone" subtitle="The corpus that buys your freedom">
      <div className="flex flex-col gap-4">
        <Segmented
          value={inputs.targetMode}
          onChange={(mode) => update('targetMode', mode)}
          options={[
            { value: 'derived', label: 'Work it out for me' },
            { value: 'fixed', label: 'I have a number' },
          ]}
        />

        {inputs.targetMode === 'derived' ? (
          <>
            <MoneyField
              label="Monthly spending retirement must cover"
              value={inputs.retirementMonthlyExpense}
              onChange={(value) => update('retirementMonthlyExpense', value)}
              hint="In today's money. The app inflates it to the year you actually get there."
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-2">
                Safe withdrawal rate
                <Info text="The share of the corpus you can draw each year and reasonably expect it to last. A lower rate means a bigger corpus and a safer retirement." />
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SWR_OPTIONS.map((option) => {
                  const active = inputs.swrPct === option.pct
                  return (
                    <button
                      key={option.pct}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update('swrPct', option.pct)}
                      className={
                        'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition ' +
                        (active
                          ? 'border-corpus bg-corpus/10 shadow-sm'
                          : 'border-hairline hover:border-ink-muted/40 hover:bg-sunken')
                      }
                    >
                      <span
                        className={
                          'text-base font-semibold tnum ' + (active ? 'text-corpus' : 'text-ink')
                        }
                      >
                        {option.multiple}
                      </span>
                      <span className="text-[11px] text-ink-2 tnum">{option.pct}%</span>
                      <span className="text-[10px] tracking-wide text-ink-muted uppercase">
                        {option.short}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-ink-muted">
                {SWR_OPTIONS.find((option) => option.pct === inputs.swrPct)?.detail}
              </p>
            </div>
          </>
        ) : (
          <>
            <MoneyField
              label="Target corpus"
              value={inputs.targetAmount}
              onChange={(value) => update('targetAmount', value)}
            />
            <Segmented
              label="That number is"
              value={inputs.targetBasis}
              onChange={(basis) => update('targetBasis', basis)}
              options={[
                { value: 'today', label: "Today's money" },
                { value: 'future', label: 'A future amount' },
              ]}
            />
            <p className="text-xs text-ink-muted">
              {inputs.targetBasis === 'today'
                ? 'The target rises with inflation so it keeps the buying power you mean today. This is almost always what people intend.'
                : 'The target stays at this nominal number, so it buys less every year. Easier to hit, and worth less when you do.'}
            </p>
            <button
              type="button"
              onClick={() =>
                patch({
                  targetMode: 'derived',
                  retirementMonthlyExpense: Math.round(
                    inputs.targetAmount / 12 / corpusMultiple(inputs.swrPct),
                  ),
                })
              }
              className="self-start rounded-md border border-hairline px-2 py-1 text-[11px] text-ink-2 transition hover:bg-sunken"
            >
              What monthly spending does this actually buy?
            </button>
          </>
        )}

        <div className="overflow-hidden rounded-xl border border-hairline bg-sunken">
          <div className="flex items-end justify-between gap-3 px-3.5 pt-3">
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
                Today
              </div>
              <div className="mt-0.5 text-xl font-semibold tracking-tight text-ink">
                {formatCompact(today)}
              </div>
            </div>
            <span className="pb-1 text-[11px] text-ink-muted">
              {inputs.targetMode === 'derived' ? `${Math.round(multiple)}× yearly spending` : 'your target'}
            </span>
          </div>

          {/* The gap between the two figures is the whole point, so it gets
              its own rung rather than a sentence underneath. */}
          <div className="flex items-center gap-2 px-3.5 py-2">
            <span className="ml-1 h-4 w-4 shrink-0 text-target">
              <Icon name="arrowDown" />
            </span>
            <span className="h-px flex-1 bg-hairline" aria-hidden />
            <span className="rounded-full bg-target/10 px-2 py-0.5 text-[11px] font-medium text-target tnum">
              + {formatCompact(atRetirement - today)} inflation
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-hairline bg-surface px-3.5 py-3">
            <div>
              <div className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
                At age {inputs.retirementAge}
              </div>
              <div className="mt-0.5 text-xl font-semibold tracking-tight text-target">
                {formatCompact(atRetirement)}
              </div>
            </div>
            <span className="pb-1 text-right text-[11px] text-ink-muted">
              exactly the same
              <br />
              buying power
            </span>
          </div>
        </div>
        <p className="-mt-1 text-[11px] text-ink-muted">
          {formatTaka(Math.round(atRetirement - today))} more taka to buy the same life. That gap is
          why a target typed in today's money has to move.
        </p>
      </div>
    </Card>
  )
}
