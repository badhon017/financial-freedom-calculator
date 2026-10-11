import { useEffect, useRef, useState } from 'react'
import { useCalculator } from './state/useCalculator'
import { DEFAULT_INPUTS } from './lib/defaults'
import { SectionLabel } from './components/ui/primitives'
import { Icon } from './components/ui/icons'
import { useScrolledPast } from './components/ui/useScrolledPast'
import { formatDuration } from './lib/format'
import { ProfileCard } from './components/inputs/ProfileCard'
import { IncomeCard } from './components/inputs/IncomeCard'
import { ExpenseCard } from './components/inputs/ExpenseCard'
import { InflationCard } from './components/inputs/InflationCard'
import { InvestmentCard } from './components/inputs/InvestmentCard'
import { TargetCard } from './components/inputs/TargetCard'
import { GoalsCard } from './components/inputs/GoalsCard'
import { HeroResult } from './components/results/HeroResult'
import { Warnings } from './components/results/Warnings'
import { CrossingChart } from './components/results/CrossingChart'
import { CompositionChart } from './components/results/CompositionChart'
import { CashflowChart } from './components/results/CashflowChart'
import { SensitivityPanel } from './components/results/SensitivityPanel'
import { MilestoneStrip } from './components/results/MilestoneStrip'
import { LeversPanel } from './components/results/LeversPanel'
import { YearTable } from './components/results/YearTable'
import { AssumptionsNote } from './components/results/AssumptionsNote'
import { ScenarioBar } from './components/results/ScenarioBar'

type Theme = 'light' | 'dark'

function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('ff-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('ff-theme', theme)
    } catch {
      // Private windows block storage; the toggle still works for this session.
    }
  }, [theme])
  return [theme, () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))]
}

const headerButton =
  'flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[11px] font-medium text-ink-2 transition hover:bg-sunken hover:text-ink'

export default function App() {
  const {
    inputs,
    setInputs,
    update,
    patch,
    setGoals,
    result,
    sensitivityRows,
    goalImpacts,
    levers,
    deadlineMonths,
  } = useCalculator()
  const [theme, toggleTheme] = useTheme()
  const heroRef = useRef<HTMLDivElement>(null)
  // Once the headline scrolls away, the header carries the answer instead, so
  // changing an input near the bottom still shows its effect.
  const scrolledPastHero = useScrolledPast(heroRef)
  const reached = result.outcome !== 'unreachable'

  const cardProps = { inputs, update, patch }

  return (
    <div className="min-h-dvh bg-plane">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-1.5 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--series-corpus), var(--series-growth))',
            }}
          >
            <Icon name="flag" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-ink">
              Financial Freedom Calculator
            </h1>
            {scrolledPastHero ? (
              <p className="flex items-center gap-1.5 text-[11px] text-ink-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: reached ? 'var(--series-growth)' : 'var(--critical)' }}
                  aria-hidden
                />
                <span className="font-semibold text-ink tnum">
                  {reached && result.monthsToFreedom !== null
                    ? formatDuration(result.monthsToFreedom)
                    : 'Target not reached'}
                </span>
                {reached && result.freedomAge !== null && (
                  <span className="text-ink-muted tnum">
                    · age {Math.floor(result.freedomAge)} · {result.freedomCalendarYear}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-[11px] text-ink-muted">
                Built for Bangladeshi salaries, inflation and savings instruments
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setInputs(DEFAULT_INPUTS)} className={headerButton}>
              Reset
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className={headerButton}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div ref={heroRef}>
          <HeroResult inputs={inputs} result={result} />
        </div>
        <Warnings result={result} />
        <ScenarioBar inputs={inputs} setInputs={setInputs} />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <SectionLabel>Where you are now</SectionLabel>
            <ProfileCard {...cardProps} />
            <IncomeCard {...cardProps} />
            <ExpenseCard {...cardProps} />

            <SectionLabel>What you assume</SectionLabel>
            <InflationCard {...cardProps} />
            <InvestmentCard {...cardProps} />

            <SectionLabel>Where you are going</SectionLabel>
            <TargetCard {...cardProps} />
            <GoalsCard inputs={inputs} setGoals={setGoals} impacts={goalImpacts} />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <CrossingChart inputs={inputs} result={result} />
            <LeversPanel levers={levers} inputs={inputs} deadlineMonths={deadlineMonths} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <CompositionChart inputs={inputs} result={result} />
              <CashflowChart inputs={inputs} result={result} />
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <SensitivityPanel rows={sensitivityRows} />
              <MilestoneStrip result={result} />
            </div>
            <YearTable inputs={inputs} result={result} />
            <AssumptionsNote inputs={inputs} />
          </div>
        </div>

        <footer className="py-4 text-center text-[11px] text-ink-muted">
          Everything stays in your browser — nothing is uploaded. Share a plan with the link button;
          the assumptions travel inside the URL.
        </footer>
      </main>
    </div>
  )
}
