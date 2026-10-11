import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { formatCompact, groupBD, monthName } from '../../lib/format'
import { Icon } from './icons'
import type { IconName } from './icons'
import { TONE_CLASS } from './tokens'
import type { Tone } from './tokens'

export function Card({
  title,
  subtitle,
  icon,
  tone = 'default',
  action,
  children,
}: {
  title?: string
  subtitle?: string
  icon?: IconName
  tone?: Tone
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="group rounded-2xl border border-hairline bg-surface p-4 transition-colors duration-200 hover:border-ink-muted/30 sm:p-5">
      {title && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            {icon && (
              <span
                className={
                  'mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-1.5 ' +
                  TONE_CLASS[tone]
                }
              >
                <Icon name={icon} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

/** Breaks the long input column into three readable chapters. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-1 pt-2 first:pt-0">
      <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-hairline" aria-hidden />
    </div>
  )
}

/**
 * How far along you are, with ticks at the quarter marks. The honest version of
 * a progress bar: it measures corpus against target in today's money.
 */
export function ProgressTrack({
  value,
  label,
  className = '',
}: {
  value: number
  label: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={className}>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.max(pct, 1.5)}%`,
            background: 'linear-gradient(90deg, var(--series-corpus), var(--series-growth))',
          }}
        />
        {[25, 50, 75].map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute top-0 h-full w-px bg-surface/70"
            style={{ left: `${tick}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-hairline bg-sunken px-3 py-2 text-sm text-ink tnum ' +
  'outline-none transition focus:border-corpus focus:ring-2 focus:ring-corpus/30'

/**
 * Shows grouped taka (1,23,45,678) at rest but hands you the raw digits the
 * moment you focus it, so typing never fights the formatter.
 */
export function MoneyField({
  label,
  value,
  onChange,
  hint,
  min = 0,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  min?: number
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? groupBD(value)
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-muted">
          ৳
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className={inputClass + ' pl-7'}
          value={shown}
          onFocus={() => setDraft(String(Math.round(value)))}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^\d]/g, '')
            setDraft(raw)
            onChange(Math.max(min, Number(raw || 0)))
          }}
        />
      </div>
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  suffix,
  step = 1,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  suffix?: string
  step?: number
  min?: number
  max?: number
}) {
  const id = useId()
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="number"
          className={inputClass + (suffix ? ' pr-9' : '')}
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(event) => {
            const next = Number(event.target.value)
            onChange(Number.isFinite(next) ? next : 0)
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-muted">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-ink-2">{label}</span>}
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-lg border border-hairline bg-sunken p-0.5"
      >
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ' +
                (active
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink-2')
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MonthField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index + 1} value={index + 1}>
            {monthName(index + 1)}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-ink-2">
          {label}
        </label>
        <span className="text-xs font-semibold text-ink tnum">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sunken"
      />
    </div>
  )
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <span
        className={
          'relative h-5 w-9 shrink-0 rounded-full transition ' +
          (checked ? 'bg-corpus' : 'bg-axis')
        }
      >
        <span
          className={
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ' +
            (checked ? 'left-[1.125rem]' : 'left-0.5')
          }
        />
      </span>
    </button>
  )
}

/** A quiet "?" that explains an assumption without spending layout on it. */
export function Info({ text }: { text: string }) {
  return (
    <span
      title={text}
      tabIndex={0}
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-hairline text-[10px] leading-none text-ink-muted align-middle"
      aria-label={text}
    >
      ?
    </span>
  )
}

export function Stat({
  label,
  value,
  tone = 'default',
  sub,
}: {
  label: string
  value: string
  tone?: 'default' | 'corpus' | 'target' | 'growth'
  sub?: string
}) {
  const toneClass =
    tone === 'corpus'
      ? 'text-corpus'
      : tone === 'target'
        ? 'text-target'
        : tone === 'growth'
          ? 'text-growth'
          : 'text-ink'
  return (
    <div className="rounded-xl border border-hairline bg-sunken px-3 py-2.5 transition-colors duration-200 hover:border-ink-muted/30">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className={'mt-0.5 text-lg font-semibold tracking-tight ' + toneClass}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-muted">{sub}</div>}
    </div>
  )
}

export function MoneyHint({ value }: { value: number }) {
  return <span className="text-ink-muted">{formatCompact(value)}</span>
}
