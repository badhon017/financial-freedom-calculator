import { Card, Info, MoneyField, MonthField, NumberField, Segmented, SliderField, Switch } from '../ui/primitives'
import { formatCompact } from '../../lib/format'
import type { CardProps } from './types'

export function IncomeCard({ inputs, update, patch }: CardProps) {
  const annual = inputs.monthlySalary * 12 + inputs.otherIncomeMonthly * 12
  return (
    <Card
      icon="wallet"
      tone="corpus"
      title="Income"
      subtitle={`${formatCompact(annual)} a year before bonus`}
    >
      <div className="flex flex-col gap-4">
        <MoneyField
          label="Monthly take-home salary"
          value={inputs.monthlySalary}
          onChange={(value) => update('monthlySalary', value)}
          hint="In-hand pay, after tax and deductions."
        />

        <div className="grid grid-cols-2 gap-3">
          <Segmented
            label="Yearly increment"
            value={inputs.incrementMode}
            onChange={(mode) =>
              patch({ incrementMode: mode, incrementValue: mode === 'percent' ? 10 : 5000 })
            }
            options={[
              { value: 'percent', label: 'Percent' },
              { value: 'fixed', label: 'Fixed ৳' },
            ]}
          />
          {inputs.incrementMode === 'percent' ? (
            <NumberField
              label="Raise each year"
              value={inputs.incrementValue}
              onChange={(value) => update('incrementValue', value)}
              suffix="%"
              step={0.5}
            />
          ) : (
            <MoneyField
              label="Added to monthly pay"
              value={inputs.incrementValue}
              onChange={(value) => update('incrementValue', value)}
            />
          )}
        </div>

        <MonthField
          label="Raises land in"
          value={inputs.incrementMonth}
          onChange={(value) => update('incrementMonth', value)}
        />

        <div className="rounded-lg border border-hairline bg-sunken p-3">
          <Switch
            label="Salary stops growing at some age"
            checked={inputs.salaryGrowthEndsAtAge !== null}
            onChange={(on) => update('salaryGrowthEndsAtAge', on ? 50 : null)}
          />
          {inputs.salaryGrowthEndsAtAge !== null && (
            <div className="mt-3">
              <NumberField
                label="Plateau age"
                value={inputs.salaryGrowthEndsAtAge}
                onChange={(value) => update('salaryGrowthEndsAtAge', value)}
                hint="Most careers flatten out well before retirement."
                suffix="yrs"
              />
            </div>
          )}
        </div>

        <details className="group rounded-lg border border-hairline bg-sunken p-3">
          <summary className="cursor-pointer list-none text-xs font-medium text-ink-2 [&::-webkit-details-marker]:hidden">
            Bonus and other income
            <span className="float-right text-ink-muted group-open:rotate-180 inline-block transition">⌄</span>
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            <Switch
              label="I get an annual bonus"
              checked={inputs.bonusEnabled}
              onChange={(on) => update('bonusEnabled', on)}
            />
            {inputs.bonusEnabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Segmented
                    label="Bonus is"
                    value={inputs.bonusMode}
                    onChange={(mode) =>
                      patch({ bonusMode: mode, bonusValue: mode === 'months' ? 2 : 100000 })
                    }
                    options={[
                      { value: 'months', label: "Months' pay" },
                      { value: 'fixed', label: 'Fixed ৳' },
                    ]}
                  />
                  {inputs.bonusMode === 'months' ? (
                    <NumberField
                      label="How many months"
                      value={inputs.bonusValue}
                      onChange={(value) => update('bonusValue', value)}
                      step={0.5}
                      suffix="mo"
                    />
                  ) : (
                    <MoneyField
                      label="Bonus amount"
                      value={inputs.bonusValue}
                      onChange={(value) => update('bonusValue', value)}
                    />
                  )}
                </div>
                <MonthField
                  label="Bonus month"
                  value={inputs.bonusMonth}
                  onChange={(value) => update('bonusMonth', value)}
                />
                <SliderField
                  label="Share of bonus invested"
                  value={inputs.bonusInvestedPct}
                  onChange={(value) => update('bonusInvestedPct', value)}
                  min={0}
                  max={100}
                  step={5}
                  format={(value) => `${value}%`}
                />
              </>
            )}
            <MoneyField
              label="Other monthly income"
              value={inputs.otherIncomeMonthly}
              onChange={(value) => update('otherIncomeMonthly', value)}
              hint="Rent, freelancing, a second job."
            />
            {inputs.otherIncomeMonthly > 0 && (
              <NumberField
                label="Other income grows"
                value={inputs.otherIncomeGrowthPct}
                onChange={(value) => update('otherIncomeGrowthPct', value)}
                suffix="%"
                step={0.5}
              />
            )}
          </div>
        </details>

        <p className="text-xs text-ink-muted">
          Salary is take-home, so there is no tax step in this model.
          <Info text="This calculator does not model income tax or capital-gains tax. Enter pay after tax, and enter returns after tax — Sanchayapatra has 10% source tax, and FDR interest is taxed too." />
        </p>
      </div>
    </Card>
  )
}
