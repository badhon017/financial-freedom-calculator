import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_PROPS, COLORS } from './chartTokens'
import { ChartFrame, LegendSwatch, TooltipRow, TooltipShell } from './chartChrome'
import { Segmented } from '../ui/primitives'
import { formatAxis, formatCompact, formatPct } from '../../lib/format'
import { inflationFactor } from '../../lib/target'
import type { Inputs, SimulationResult } from '../../lib/types'

type Basis = 'real' | 'nominal'

interface Point {
  age: number
  spent: number
  invested: number
  income: number
  rate: number
}

/**
 * Each bar is one year's income split into what you spent and what you kept.
 *
 * Defaults to today's money, because in nominal taka a 10% raise compounding
 * for fifteen years makes the final bar dwarf the first — the early years
 * collapse to slivers and the savings-rate story, which is the point of the
 * chart, becomes unreadable. Deflating puts every year on a comparable scale.
 *
 * Deliberately not a second axis for the savings rate: two y-scales on one plot
 * invent a relationship. The rate lives in the tooltip and the footnote.
 */
export function CashflowChart({
  inputs,
  result,
}: {
  inputs: Inputs
  result: SimulationResult
}) {
  const [basis, setBasis] = useState<Basis>('real')

  const freedomYearIndex =
    result.monthsToFreedom === null ? result.years.length : Math.ceil(result.monthsToFreedom / 12)
  const shown = Math.min(result.years.length, Math.max(5, Math.min(freedomYearIndex + 1, 25)))

  const data: Point[] = result.years.slice(0, shown).map((row) => {
    const deflator =
      basis === 'real' ? inflationFactor(inputs.inflationPct, (row.index + 1) * 12) : 1
    return {
      age: Math.round(row.age),
      spent: Math.max(0, row.expenses / deflator),
      invested: Math.max(0, row.savings / deflator),
      income: row.income / deflator,
      rate: row.savingsRatePct,
    }
  })

  const first = data[0]
  const last = data[data.length - 1]

  // In real terms a 10% raise against 9% inflation is barely a raise at all.
  // Worth saying plainly — it is the single most deflating thing the model knows.
  const realGrowth =
    basis === 'real' && first && last && first.income > 0
      ? (last.income / first.income - 1) * 100
      : null

  return (
    <ChartFrame
      title="Where the money goes"
      description="Every year's income, split into what you spend and what you keep."
      controls={
        <Segmented
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'real', label: "Today's money" },
            { value: 'nominal', label: 'Future taka' },
          ]}
        />
      }
      legend={
        <>
          <LegendSwatch color={COLORS.corpus} label="Invested" />
          <LegendSwatch color={COLORS.target} label="Spent" />
        </>
      }
      footnote={
        first && last
          ? `Savings rate moves from ${formatPct(first.rate, 0)} at age ${first.age} to ${formatPct(last.rate, 0)} at age ${last.age}.` +
            (realGrowth === null
              ? ' Shown in future taka, so later bars dwarf earlier ones; switch to today’s money to compare years.'
              : ` Shown in today's money, so the bars stay comparable. Across ${data.length} years your income changes ${formatPct(realGrowth, 0)} in real buying power` +
                (inputs.incrementMode === 'percent'
                  ? ` — a ${formatPct(inputs.incrementValue, 1)} raise against ${formatPct(inputs.inflationPct, 1)} inflation is less of a raise than it looks.`
                  : '.'))
          : undefined
      }
    >
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={COLORS.grid} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="age"
              {...AXIS_PROPS}
              minTickGap={14}
              label={{
                value: 'Your age',
                position: 'insideBottom',
                offset: -10,
                fill: COLORS.muted,
                fontSize: 11,
              }}
            />
            <YAxis {...AXIS_PROPS} width={52} tickFormatter={formatAxis} />
            <Tooltip
              cursor={{ fill: COLORS.grid, fillOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as Point
                return (
                  <TooltipShell title={`Age ${point.age}`}>
                    <TooltipRow label="Income" value={formatCompact(point.income)} />
                    <TooltipRow
                      color={COLORS.target}
                      label="Spent"
                      value={formatCompact(point.spent)}
                    />
                    <TooltipRow
                      color={COLORS.corpus}
                      label="Invested"
                      value={formatCompact(point.invested)}
                    />
                    <TooltipRow label="Savings rate" value={formatPct(point.rate, 0)} emphasis />
                  </TooltipShell>
                )
              }}
            />
            <Bar
              dataKey="spent"
              stackId="flow"
              name="Spent"
              fill={COLORS.target}
              fillOpacity={0.55}
              stroke={COLORS.surface}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Bar
              dataKey="invested"
              stackId="flow"
              name="Invested"
              fill={COLORS.corpus}
              stroke={COLORS.surface}
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
