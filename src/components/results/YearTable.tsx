import { useState } from 'react'
import { Card } from '../ui/primitives'
import { Icon } from '../ui/icons'
import { formatCompact, groupBD } from '../../lib/format'
import type { Inputs, SimulationResult } from '../../lib/types'

const COLUMNS = [
  'Age',
  'Year',
  'Income',
  'Spent',
  'Invested',
  'Growth',
  'Goals',
  'Corpus',
  'Needed',
  'Gap',
  'Rate',
] as const

function toCsv(result: SimulationResult): string {
  const header = COLUMNS.join(',')
  const rows = result.years.map((row) =>
    [
      row.age,
      row.calendarYear,
      Math.round(row.income),
      Math.round(row.expenses),
      Math.round(row.savings),
      Math.round(row.growth),
      Math.round(row.goalFlow),
      Math.round(row.closingCorpus),
      Math.round(row.requiredCorpus),
      Math.round(row.closingCorpus - row.requiredCorpus),
      row.savingsRatePct.toFixed(1),
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

/**
 * The full numbers. This is also the relief for the chart colours that sit
 * below 3:1 contrast on the light surface — every value is readable as text.
 */
export function YearTable({ inputs, result }: { inputs: Inputs; result: SimulationResult }) {
  const [expanded, setExpanded] = useState(false)
  const freedomYearIndex =
    result.monthsToFreedom === null ? null : Math.ceil(result.monthsToFreedom / 12)
  const defaultRows = Math.min(
    result.years.length,
    freedomYearIndex === null ? 20 : freedomYearIndex + 2,
  )
  const rows = expanded ? result.years : result.years.slice(0, defaultRows)

  const download = () => {
    const blob = new Blob([toCsv(result)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'financial-freedom-projection.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card
      icon="table"
      title="Year by year"
      subtitle="Every figure behind the charts"
      action={
        <button
          type="button"
          onClick={download}
          className="rounded-md border border-hairline px-2.5 py-1.5 text-[11px] font-medium text-ink-2 transition hover:bg-sunken hover:text-ink"
        >
          Download CSV
        </button>
      }
    >
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[46rem] border-collapse text-xs">
          <thead>
            <tr className="border-b border-hairline text-left">
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={
                    'px-2 py-2 font-medium text-ink-muted first:pl-4 last:pr-4 sm:first:pl-5 sm:last:pr-5 ' +
                    (column === 'Age' || column === 'Year' ? 'text-left' : 'text-right')
                  }
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tnum">
            {rows.map((row) => {
              const gap = row.closingCorpus - row.requiredCorpus
              const free = gap >= 0
              return (
                <tr
                  key={row.index}
                  className={
                    'border-b border-hairline/60 ' +
                    (free ? 'bg-good/5' : '')
                  }
                >
                  <td className="px-2 py-1.5 text-ink first:pl-4 sm:first:pl-5">
                    {Math.round(row.age)}
                  </td>
                  <td className="px-2 py-1.5 text-ink-muted">{row.calendarYear}</td>
                  <td className="px-2 py-1.5 text-right text-ink-2">{formatCompact(row.income)}</td>
                  <td className="px-2 py-1.5 text-right text-ink-2">
                    {formatCompact(row.expenses)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink">{formatCompact(row.savings)}</td>
                  <td className="px-2 py-1.5 text-right text-growth">
                    {formatCompact(row.growth)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink-muted">
                    {row.goalFlow === 0 ? '—' : formatCompact(row.goalFlow)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium text-corpus">
                    {formatCompact(row.closingCorpus)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-target">
                    {formatCompact(row.requiredCorpus)}
                  </td>
                  <td
                    className={
                      'px-2 py-1.5 text-right ' + (free ? 'text-good' : 'text-ink-muted')
                    }
                  >
                    {free ? '+' : ''}
                    {formatCompact(gap)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-ink-2 last:pr-4 sm:last:pr-5">
                    {row.savingsRatePct.toFixed(0)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {result.years.length > defaultRows && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-hairline py-2 text-[11px] font-medium text-ink-2 transition hover:border-ink-muted/40 hover:bg-sunken hover:text-ink"
        >
          {expanded
            ? 'Show fewer years'
            : `Show all ${result.years.length} years, to age ${inputs.currentAge + result.years.length}`}
          <span
            className={'h-3.5 w-3.5 transition-transform ' + (expanded ? 'rotate-180' : '')}
            aria-hidden
          >
            <Icon name="arrowDown" />
          </span>
        </button>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-ink-muted">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-good/20 ring-1 ring-good/40" aria-hidden />
        Shaded rows are years where the corpus already covers what you would need. Figures are in
        future taka — the milestone is ৳{groupBD(result.requiredAtFreedom ?? 0)} at the crossing.
      </p>
    </Card>
  )
}
