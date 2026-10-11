import { useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Segmented } from '../ui/primitives'
import { AXIS_PROPS, COLORS } from './chartTokens'
import { ChartFrame, LegendSwatch, TooltipRow, TooltipShell } from './chartChrome'
import { formatAxis, formatCompact } from '../../lib/format'
import type { Inputs, SimulationResult } from '../../lib/types'

type Basis = 'nominal' | 'real'

interface Point {
  age: number
  calendarYear: number
  corpus: number
  target: number
}

export function CrossingChart({
  inputs,
  result,
}: {
  inputs: Inputs
  result: SimulationResult
}) {
  const [basis, setBasis] = useState<Basis>('nominal')

  // Past the crossing the chase is over, so stop a few years after it.
  const freedomYearIndex =
    result.monthsToFreedom === null ? null : Math.ceil(result.monthsToFreedom / 12)
  const lastIndex =
    freedomYearIndex === null
      ? Math.min(result.years.length, Math.round(inputs.retirementAge - inputs.currentAge) + 5)
      : Math.min(result.years.length, freedomYearIndex + 3)

  const data: Point[] = result.years.slice(0, Math.max(3, lastIndex)).map((row) => ({
    age: Math.round(row.age),
    calendarYear: row.calendarYear,
    corpus: basis === 'nominal' ? row.closingCorpus : row.closingCorpusReal,
    target: basis === 'nominal' ? row.requiredCorpus : row.requiredCorpusReal,
  }))

  const crossingAge =
    result.freedomAge === null ? null : Math.round(result.freedomAge * 10) / 10
  const crossingPoint =
    crossingAge === null ? null : data.find((point) => point.age >= Math.round(crossingAge))

  return (
    <ChartFrame
      title="The chase"
      description="Your corpus against the corpus you need. Both climb — freedom is where they meet."
      controls={
        <Segmented
          value={basis}
          onChange={setBasis}
          options={[
            { value: 'nominal', label: 'Future taka' },
            { value: 'real', label: "Today's money" },
          ]}
        />
      }
      legend={
        <>
          <LegendSwatch color={COLORS.corpus} label="Your corpus" />
          <LegendSwatch color={COLORS.target} label="Corpus you need" />
        </>
      }
      footnote={
        basis === 'real'
          ? "In today's money the target is flat — it only looks like it runs away because inflation makes the taka smaller."
          : 'The target rises every year because the life it has to fund gets more expensive every year.'
      }
    >
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
            <defs>
              <linearGradient id="corpusFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.corpus} stopOpacity={0.22} />
                <stop offset="100%" stopColor={COLORS.corpus} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COLORS.grid} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="age"
              {...AXIS_PROPS}
              // Centred, so it cannot collide with the final tick; minTickGap
              // lets Recharts drop ticks rather than overlap them when narrow.
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
              cursor={{ stroke: COLORS.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as Point
                const gap = point.corpus - point.target
                return (
                  <TooltipShell title={`Age ${point.age} · ${point.calendarYear}`}>
                    <TooltipRow
                      color={COLORS.corpus}
                      label="Your corpus"
                      value={formatCompact(point.corpus)}
                    />
                    <TooltipRow
                      color={COLORS.target}
                      label="You need"
                      value={formatCompact(point.target)}
                    />
                    <TooltipRow
                      label={gap >= 0 ? 'Surplus' : 'Still short'}
                      value={formatCompact(Math.abs(gap))}
                      emphasis
                    />
                  </TooltipShell>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="corpus"
              name="Your corpus"
              stroke={COLORS.corpus}
              strokeWidth={2}
              fill="url(#corpusFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Corpus you need"
              stroke={COLORS.target}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.surface }}
              isAnimationActive={false}
            />
            {crossingPoint && (
              <>
                <ReferenceLine
                  x={crossingPoint.age}
                  stroke={COLORS.axis}
                  strokeWidth={1}
                  label={{
                    value: 'Free',
                    position: 'top',
                    fill: COLORS.muted,
                    fontSize: 11,
                  }}
                />
                <ReferenceDot
                  x={crossingPoint.age}
                  y={crossingPoint.corpus}
                  r={5}
                  fill={COLORS.corpus}
                  stroke={COLORS.surface}
                  strokeWidth={2}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
