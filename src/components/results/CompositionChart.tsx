import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_PROPS, COLORS } from './chartTokens'
import { ChartFrame, LegendSwatch, TooltipRow, TooltipShell } from './chartChrome'
import { Segmented } from '../ui/primitives'
import { formatAxis, formatCompact, formatPct } from '../../lib/format'
import { inflationFactor } from '../../lib/target'
import type { Inputs, SimulationResult } from '../../lib/types'

type Mode = 'share' | 'amount'

interface Point {
  age: number
  /** Plotted value — a percentage in share mode, taka in amount mode. */
  contributed: number
  growth: number
  /** Always the taka figures, for the tooltip. */
  contributedTaka: number
  growthTaka: number
  growthSharePct: number
}

/**
 * Splits the corpus into money you put in versus money the money made. The
 * second overtaking the first is the moment compounding starts doing the work.
 *
 * Defaults to share rather than taka. A corpus compounding for twenty years
 * makes the first year 2% of the last, so on a magnitude scale the early years
 * are an unreadable sliver — and deflating to today's money only takes that to
 * 7%, because the squashing is compounding, not inflation. The chart's question
 * is part-to-whole, so a 100% stack answers it with every year equally legible
 * and the crossover landing exactly where the split passes half. Amount mode is
 * there when you want the taka, shown in today's money.
 */
export function CompositionChart({
  inputs,
  result,
}: {
  inputs: Inputs
  result: SimulationResult
}) {
  const [mode, setMode] = useState<Mode>('share')

  const freedomYearIndex =
    result.monthsToFreedom === null ? null : Math.ceil(result.monthsToFreedom / 12)
  const lastIndex =
    freedomYearIndex === null
      ? Math.min(result.years.length, Math.round(inputs.retirementAge - inputs.currentAge))
      : Math.min(result.years.length, freedomYearIndex + 1)

  const data: Point[] = []
  let contributed = inputs.currentCorpus
  let growth = 0
  for (const row of result.years.slice(0, Math.max(3, lastIndex))) {
    contributed += row.savings + row.goalFlow
    growth += row.growth
    // Amounts are always in today's money; shares are scale-free either way.
    const deflator = inflationFactor(inputs.inflationPct, (row.index + 1) * 12)
    const real = { c: contributed / deflator, g: growth / deflator }
    const sum = real.c + real.g
    const growthSharePct = sum > 0 ? (real.g / sum) * 100 : 0
    data.push({
      age: Math.round(row.age),
      contributed: mode === 'share' ? 100 - growthSharePct : real.c,
      growth: mode === 'share' ? growthSharePct : real.g,
      contributedTaka: real.c,
      growthTaka: real.g,
      growthSharePct,
    })
  }

  const final = data[data.length - 1]
  const growthShare = final ? final.growthSharePct : 0
  const crossover = data.find((point) => point.growthSharePct > 50)

  return (
    <ChartFrame
      title="Who is doing the work"
      description="How much of the corpus is money you saved, and how much the returns made."
      controls={
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'share', label: 'Share' },
            { value: 'amount', label: 'Amount' },
          ]}
        />
      }
      legend={
        <>
          <LegendSwatch color={COLORS.corpus} label="Money you put in" />
          <LegendSwatch color={COLORS.growth} label="Compound growth" />
        </>
      }
      footnote={
        (crossover
          ? `From age ${crossover.age} the returns contribute more than you do — that is the line worth reaching. By the end, growth is ${formatPct(growthShare, 0)} of the corpus.`
          : growthShare >= 45
            ? `Growth reaches ${formatPct(growthShare, 0)} of the corpus by the finish — all but level with what you put in.`
            : `Growth reaches ${formatPct(growthShare, 0)} of the corpus — your own contributions still do most of the work.`) +
        (mode === 'share'
          ? ' Shown as a share of the corpus, so every year reads equally.'
          : " Amounts are in today's money.")
      }
    >
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
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
            <YAxis
              {...AXIS_PROPS}
              width={52}
              domain={mode === 'share' ? [0, 100] : undefined}
              tickFormatter={
                mode === 'share' ? (value: number) => `${value}%` : formatAxis
              }
            />
            <Tooltip
              cursor={{ stroke: COLORS.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as Point
                const sum = point.contributedTaka + point.growthTaka
                return (
                  <TooltipShell title={`Age ${point.age}`}>
                    <TooltipRow
                      color={COLORS.corpus}
                      label="You put in"
                      value={`${formatCompact(point.contributedTaka)} · ${formatPct(100 - point.growthSharePct, 0)}`}
                    />
                    <TooltipRow
                      color={COLORS.growth}
                      label="Growth earned"
                      value={`${formatCompact(point.growthTaka)} · ${formatPct(point.growthSharePct, 0)}`}
                    />
                    <TooltipRow label="Corpus" value={formatCompact(sum)} emphasis />
                  </TooltipShell>
                )
              }}
            />
            {/* A 2px surface stroke is the gap between stacked fills. */}
            <Area
              type="monotone"
              stackId="corpus"
              dataKey="contributed"
              name="Money you put in"
              fill={COLORS.corpus}
              fillOpacity={0.5}
              stroke={COLORS.surface}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              stackId="corpus"
              dataKey="growth"
              name="Compound growth"
              fill={COLORS.growth}
              fillOpacity={0.5}
              stroke={COLORS.surface}
              strokeWidth={2}
              isAnimationActive={false}
            />
            {mode === 'share' && (
              <ReferenceLine
                y={50}
                stroke={COLORS.surface}
                strokeWidth={1}
                strokeOpacity={0.9}
                label={{ value: 'half', position: 'right', fill: COLORS.muted, fontSize: 10 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
