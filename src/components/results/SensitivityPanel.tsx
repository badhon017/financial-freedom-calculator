import { Card, Info } from '../ui/primitives'
import { formatMonthDelta } from '../../lib/format'
import type { SensitivityRow } from '../../lib/sensitivity'

/**
 * A diverging bar list around a zero line: left is sooner, right is later.
 * Plain HTML rather than a chart library — the rows are short and the signed
 * text label means colour is never the only cue.
 */
export function SensitivityPanel({ rows }: { rows: SensitivityRow[] }) {
  const widest = Math.max(1, ...rows.map((row) => Math.abs(row.deltaMonths ?? 0)))
  const strongest = rows.find((row) => row.deltaMonths !== null && row.deltaMonths !== 0)

  return (
    <Card
      icon="scale"
      title="Which assumption actually matters"
      subtitle="How far each change moves your freedom date"
      action={
        <Info text="Every row re-runs the whole projection with one assumption changed and nothing else. Sorted by impact." />
      }
    >
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const delta = row.deltaMonths
          const width = delta === null ? 0 : (Math.abs(delta) / widest) * 50
          const later = (delta ?? 0) > 0
          return (
            <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[11rem_1fr_6.5rem]">
              <span className="truncate text-xs text-ink-2">{row.label}</span>
              <div className="relative hidden h-4 sm:block">
                <div className="absolute inset-y-0 left-1/2 w-px bg-axis" aria-hidden />
                {delta !== null && delta !== 0 && (
                  <div
                    className="absolute inset-y-0.5 rounded-[3px]"
                    style={{
                      width: `${width}%`,
                      left: later ? '50%' : `${50 - width}%`,
                      background: later ? 'var(--diverge-late)' : 'var(--series-corpus)',
                    }}
                    aria-hidden
                  />
                )}
              </div>
              <span
                className={
                  'text-right text-xs tnum ' +
                  (delta === null
                    ? 'text-ink-muted'
                    : later
                      ? 'text-[var(--diverge-late)]'
                      : delta === 0
                        ? 'text-ink-muted'
                        : 'text-corpus')
                }
              >
                {delta === null ? 'never gets there' : formatMonthDelta(delta)}
              </span>
            </div>
          )
        })}
      </div>
      {strongest && (
        <p className="mt-3 border-t border-hairline pt-3 text-[11px] text-ink-muted">
          Biggest single lever here: <span className="text-ink-2">{strongest.label}</span>. Notice
          how far the spending rows move the date compared with the return rows — the part you
          control usually matters more than the part you do not.
        </p>
      )}
    </Card>
  )
}
