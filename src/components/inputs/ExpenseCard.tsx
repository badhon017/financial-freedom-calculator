import { Card, Info, MoneyField, NumberField } from '../ui/primitives'
import { formatCompact, formatPct } from '../../lib/format'
import type { CardProps } from './types'

export function ExpenseCard({ inputs, update }: CardProps) {
  const income = inputs.monthlySalary + inputs.otherIncomeMonthly
  const savings = income - inputs.monthlyExpenses
  const rate = income > 0 ? (savings / income) * 100 : 0
  const healthy = rate >= 20
  const lifestyleCreep = inputs.expenseGrowthPct > inputs.inflationPct

  return (
    <Card icon="cart" tone="target" title="Expenses" subtitle="What you actually spend each month">
      <div className="flex flex-col gap-4">
        <MoneyField
          label="Monthly expenses"
          value={inputs.monthlyExpenses}
          onChange={(value) => update('monthlyExpenses', value)}
          hint="Rent, food, transport, school fees — everything that leaves the account."
        />

        <div className="flex flex-col gap-1.5">
          <NumberField
            label="Expenses grow each year by"
            value={inputs.expenseGrowthPct}
            onChange={(value) => update('expenseGrowthPct', value)}
            suffix="%"
            step={0.5}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => update('expenseGrowthPct', inputs.inflationPct)}
              className="rounded-md border border-hairline px-2 py-1 text-[11px] text-ink-2 transition hover:bg-sunken"
            >
              Match inflation ({formatPct(inputs.inflationPct)})
            </button>
            {lifestyleCreep && (
              <span className="text-[11px] text-ink-muted">
                Lifestyle creep: spending outpaces inflation.
              </span>
            )}
          </div>
        </div>

        <div
          className={
            'rounded-lg border px-3 py-2.5 ' +
            (savings < 0
              ? 'border-critical/40 bg-critical/5'
              : 'border-hairline bg-sunken')
          }
        >
          <div className="text-[11px] text-ink-muted">You invest each month</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span
              className={
                'text-lg font-semibold tracking-tight ' +
                (savings < 0 ? 'text-critical' : 'text-corpus')
              }
            >
              {formatCompact(savings)}
            </span>
            <span className="text-xs text-ink-muted tnum">
              {formatPct(rate)} savings rate
              <Info text="Savings rate is the single strongest lever on your freedom date — stronger, usually, than the return you earn." />
            </span>
          </div>
          {savings < 0 && (
            <p className="mt-1 text-[11px] text-critical">
              You are spending more than you earn, so the corpus shrinks.
            </p>
          )}
          {savings >= 0 && !healthy && (
            <p className="mt-1 text-[11px] text-ink-muted">
              Below 20% — the date will be a long way out.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
