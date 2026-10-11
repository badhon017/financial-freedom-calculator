import type { SimulationResult } from '../../lib/types'

const TONE = {
  'inflation-outpaces-returns': 'critical',
  'corpus-depleted': 'critical',
  'goal-exceeds-corpus': 'critical',
  'negative-savings': 'warning',
  'expenses-grow-faster-than-salary': 'warning',
  'after-retirement-age': 'warning',
} as const

/** Status colour never carries the meaning alone — each row has an icon and a label. */
export function Warnings({ result }: { result: SimulationResult }) {
  if (result.warnings.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {result.warnings.map((warning) => {
        const tone = TONE[warning.code]
        const critical = tone === 'critical'
        return (
          <div
            key={warning.code}
            role="status"
            className={
              'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs ' +
              (critical
                ? 'border-critical/30 bg-critical/5 text-ink'
                : 'border-warning/40 bg-warning/5 text-ink')
            }
          >
            <span
              aria-hidden
              className={
                'mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ' +
                (critical ? 'bg-critical' : 'bg-warning')
              }
            >
              !
            </span>
            <span>
              <span className="font-medium">{critical ? 'Problem: ' : 'Heads up: '}</span>
              {warning.message}
            </span>
          </div>
        )
      })}
    </div>
  )
}
