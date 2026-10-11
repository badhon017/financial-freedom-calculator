import { useMemo, useState } from 'react'
import { simulate } from '../../lib/simulate'
import { buildShareUrl, loadScenarios, saveScenarios } from '../../lib/url'
import type { Scenario } from '../../lib/url'
import { formatDuration } from '../../lib/format'
import type { Inputs } from '../../lib/types'

const MAX_SCENARIOS = 3

export function ScenarioBar({
  inputs,
  setInputs,
}: {
  inputs: Inputs
  setInputs: (inputs: Inputs) => void
}) {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios)
  const [copied, setCopied] = useState(false)

  const persist = (next: Scenario[]) => {
    setScenarios(next)
    saveScenarios(next)
  }

  const summaries = useMemo(
    () =>
      scenarios.map((scenario) => {
        const months = simulate(scenario.inputs).monthsToFreedom
        return { ...scenario, months }
      }),
    [scenarios],
  )

  const currentMonths = useMemo(() => simulate(inputs).monthsToFreedom, [inputs])

  const save = () => {
    const name = window.prompt('Name this scenario', `Scenario ${scenarios.length + 1}`)
    if (!name) return
    const next: Scenario = { id: Math.random().toString(36).slice(2, 10), name, inputs }
    persist([...scenarios, next].slice(-MAX_SCENARIOS))
  }

  const share = async () => {
    const url = buildShareUrl(inputs)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  const buttonClass =
    'rounded-md border border-hairline px-2.5 py-1.5 text-[11px] font-medium text-ink-2 transition hover:bg-sunken hover:text-ink'

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface px-3.5 py-2.5">
      <span className="text-[11px] text-ink-muted">
        {currentMonths === null ? 'Current plan: never' : `Current plan: ${formatDuration(currentMonths)}`}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {summaries.map((scenario) => (
          <span
            key={scenario.id}
            className="flex items-center gap-1 rounded-md border border-hairline bg-sunken py-1 pr-1 pl-2 text-[11px]"
          >
            <button
              type="button"
              onClick={() => setInputs(scenario.inputs)}
              className="text-ink-2 transition hover:text-ink"
              title="Load this scenario"
            >
              {scenario.name}
              <span className="ml-1.5 text-ink-muted tnum">
                {scenario.months === null ? 'never' : formatDuration(scenario.months)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => persist(scenarios.filter((item) => item.id !== scenario.id))}
              aria-label={`Delete ${scenario.name}`}
              className="rounded px-1 text-ink-muted transition hover:text-critical"
            >
              ×
            </button>
          </span>
        ))}
        {scenarios.length < MAX_SCENARIOS && (
          <button type="button" onClick={save} className={buttonClass}>
            Save scenario
          </button>
        )}
        <button type="button" onClick={share} className={buttonClass}>
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
