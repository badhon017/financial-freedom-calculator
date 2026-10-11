import { ProgressTrack, Stat } from '../ui/primitives'
import { Icon } from '../ui/icons'
import { useCountUp } from '../ui/useCountUp'
import { formatCompact, formatPct, monthShort } from '../../lib/format'
import { requiredCorpusAt } from '../../lib/target'
import type { Inputs, SimulationResult } from '../../lib/types'

/** The month the crossing lands in, for the date chip. */
function freedomDate(inputs: Inputs, months: number) {
  const absolute = inputs.startMonth - 1 + Math.max(0, months - 1)
  return `${monthShort((absolute % 12) + 1)} ${inputs.startYear + Math.floor(absolute / 12)}`
}

function Chip({ children, icon }: { children: React.ReactNode; icon: 'calendar' | 'user' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface/70 px-2.5 py-1 text-xs font-medium text-ink-2 backdrop-blur">
      <span className="h-3.5 w-3.5 text-ink-muted">
        <Icon name={icon} />
      </span>
      {children}
    </span>
  )
}

export function HeroResult({ inputs, result }: { inputs: Inputs; result: SimulationResult }) {
  const { outcome, monthsToFreedom, freedomAge } = result

  const targetToday = requiredCorpusAt(inputs, 0)
  const progressPct = targetToday > 0 ? (inputs.currentCorpus / targetToday) * 100 : 0

  const months = monthsToFreedom ?? 0
  const animatedYears = useCountUp(Math.floor(months / 12))
  const animatedMonths = useCountUp(months % 12)

  if (outcome === 'unreachable') {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-critical/30 p-5 sm:p-7">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(90rem 28rem at 15% -30%, color-mix(in srgb, var(--critical) 14%, transparent), transparent 70%), var(--surface-1)',
          }}
        />
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-critical uppercase">
          <span className="h-4 w-4">
            <Icon name="shield" />
          </span>
          This plan does not get there
        </p>
        <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          On these assumptions, you never catch the target.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-2">
          {result.realReturnPct <= 0
            ? 'Your return does not beat inflation, so the corpus you need grows faster than the corpus you have. No amount of time fixes that — the return or the spending has to change.'
            : `Within the next ${Math.round(result.horizonMonths / 12)} years the corpus never reaches what you would need. The levers below show what would change that.`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label={`Corpus at age ${inputs.retirementAge}`}
            value={formatCompact(result.corpusAtRetirementAge)}
            tone="corpus"
          />
          <Stat
            label={`Needed at age ${inputs.retirementAge}`}
            value={formatCompact(result.requiredAtRetirementAge)}
            tone="target"
          />
          <Stat
            label="Shortfall"
            value={formatCompact(
              Math.max(0, result.requiredAtRetirementAge - result.corpusAtRetirementAge),
            )}
          />
          <Stat label="Real return" value={formatPct(result.realReturnPct)} />
        </div>
      </section>
    )
  }

  if (outcome === 'already') {
    return (
      <section className="relative overflow-hidden rounded-2xl border border-good/30 p-5 sm:p-7">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(90rem 28rem at 15% -30%, color-mix(in srgb, var(--good) 16%, transparent), transparent 70%), var(--surface-1)',
          }}
        />
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-good uppercase">
          <span className="h-4 w-4">
            <Icon name="spark" />
          </span>
          Already there
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
          Your corpus already covers the milestone.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-2">
          At {formatPct(inputs.swrPct)} a year, {formatCompact(inputs.currentCorpus)} already funds
          the spending you asked it to cover. Working now is a choice, not a requirement.
        </p>
      </section>
    )
  }

  const lateForRetirement = months > (inputs.retirementAge - inputs.currentAge) * 12
  const gapYears = Math.abs(Math.round(((freedomAge ?? 0) - inputs.retirementAge) * 10) / 10)

  return (
    <section className="relative overflow-hidden rounded-2xl border border-hairline p-5 sm:p-7">
      {/* A single soft wash in the corpus hue — the page's one piece of colour
          that is decoration rather than data. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(70rem 26rem at 8% -40%, color-mix(in srgb, var(--series-corpus) 15%, transparent), transparent 65%), radial-gradient(60rem 24rem at 95% -20%, color-mix(in srgb, var(--series-growth) 11%, transparent), transparent 65%), var(--surface-1)',
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Time to financial freedom
          </p>
          <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 tracking-tight text-ink">
            <span className="text-5xl font-semibold sm:text-7xl">
              {Math.round(animatedYears)}
              <span className="ml-1.5 text-xl font-medium text-ink-2 sm:text-2xl">
                {Math.round(animatedYears) === 1 ? 'year' : 'years'}
              </span>
            </span>
            {Math.round(animatedMonths) > 0 && (
              <span className="text-3xl font-semibold sm:text-4xl">
                {Math.round(animatedMonths)}
                <span className="ml-1.5 text-lg font-medium text-ink-2 sm:text-xl">
                  {Math.round(animatedMonths) === 1 ? 'month' : 'months'}
                </span>
              </span>
            )}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip icon="user">Age {Math.floor(freedomAge ?? 0)}</Chip>
          <Chip icon="calendar">{freedomDate(inputs, months)}</Chip>
        </div>
      </div>

      <p className="mt-3 max-w-2xl text-sm text-ink-2">
        {lateForRetirement ? (
          <>
            That is{' '}
            <span className="font-semibold text-target">{gapYears} years after</span> the age you
            hoped to stop. The levers below show what would close the gap.
          </>
        ) : (
          <>
            That is{' '}
            <span className="font-semibold text-growth">{gapYears} years before</span> the age you
            hoped to stop — you could stop working at {Math.floor(freedomAge ?? 0)} instead of{' '}
            {inputs.retirementAge}.
          </>
        )}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-4 text-xs">
          <span className="text-ink-2">
            <span className="font-semibold text-ink tnum">{formatPct(progressPct, 1)}</span> of the
            way there today
          </span>
          <span className="text-ink-muted tnum">
            {formatCompact(inputs.currentCorpus)} of {formatCompact(targetToday)}
          </span>
        </div>
        <ProgressTrack value={progressPct} label="Progress toward the corpus you need" />
        <p className="mt-2 text-[11px] text-ink-muted">
          Measured in today's money, with marks at a quarter, half and three quarters. The second
          half arrives much faster than the first — that is compounding doing the work.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Corpus you need then"
          value={formatCompact(result.requiredAtFreedom ?? 0)}
          tone="target"
          sub={`${formatCompact(result.requiredAtFreedomReal ?? 0)} in today's money`}
        />
        <Stat
          label="Corpus you will have"
          value={formatCompact(result.corpusAtFreedom ?? 0)}
          tone="corpus"
        />
        <Stat
          label="Of that, you put in"
          value={formatCompact(result.contributionsAtFreedom + inputs.currentCorpus)}
        />
        <Stat
          label="Growth did the rest"
          value={formatCompact(result.growthAtFreedom)}
          tone="growth"
          sub={
            result.corpusAtFreedom
              ? `${formatPct((result.growthAtFreedom / result.corpusAtFreedom) * 100, 0)} of the corpus`
              : undefined
          }
        />
      </div>
    </section>
  )
}
