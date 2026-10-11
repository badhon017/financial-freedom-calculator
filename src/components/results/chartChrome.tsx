import type { ReactNode } from 'react'

export function ChartFrame({
  title,
  description,
  legend,
  controls,
  children,
  footnote,
}: {
  title: string
  description?: string
  legend?: ReactNode
  controls?: ReactNode
  children: ReactNode
  footnote?: string
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-200 hover:border-ink-muted/30 sm:p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
        {controls}
      </header>
      {legend && <div className="mb-2 flex flex-wrap items-center gap-4">{legend}</div>}
      {children}
      {footnote && <p className="mt-3 text-[11px] text-ink-muted">{footnote}</p>}
    </section>
  )
}

/** A legend is always present for two or more series — identity is never colour alone. */
export function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  )
}

export function TooltipShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-lg">
      <div className="mb-1 text-[11px] font-medium text-ink-2">{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

export function TooltipRow({
  color,
  label,
  value,
  emphasis,
}: {
  color?: string
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-6 text-xs">
      <span className="flex items-center gap-1.5 text-ink-2">
        {color && (
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
        )}
        {label}
      </span>
      <span className={'tnum ' + (emphasis ? 'font-semibold text-ink' : 'text-ink')}>{value}</span>
    </div>
  )
}
