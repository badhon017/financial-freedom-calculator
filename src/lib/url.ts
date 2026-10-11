import { DEFAULT_INPUTS } from './defaults'
import type { Inputs } from './types'

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeInputs(inputs: Inputs): string {
  return toBase64Url(JSON.stringify(inputs))
}

/**
 * Decode a shared link. Anything missing or malformed falls back to defaults
 * rather than throwing — a bad link should still render a usable page.
 */
export function decodeInputs(encoded: string): Inputs | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<Inputs>
    if (typeof parsed !== 'object' || parsed === null) return null
    const merged: Inputs = { ...DEFAULT_INPUTS, ...parsed }
    merged.goals = Array.isArray(parsed.goals) ? parsed.goals : []
    for (const key of Object.keys(DEFAULT_INPUTS) as Array<keyof Inputs>) {
      const fallback = DEFAULT_INPUTS[key]
      if (typeof fallback === 'number' && typeof merged[key] !== 'number') {
        ;(merged as unknown as Record<string, unknown>)[key] = fallback
      }
    }
    return merged
  } catch {
    return null
  }
}

export function readInputsFromUrl(): Inputs | null {
  const hash = window.location.hash.replace(/^#s=/, '')
  if (!hash || hash === window.location.hash) return null
  return decodeInputs(hash)
}

export function buildShareUrl(inputs: Inputs): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#s=${encodeInputs(inputs)}`
}

const SCENARIO_KEY = 'ff-scenarios-v1'

export interface Scenario {
  id: string
  name: string
  inputs: Inputs
}

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(SCENARIO_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Scenario[]) : []
  } catch {
    return []
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  try {
    localStorage.setItem(SCENARIO_KEY, JSON.stringify(scenarios))
  } catch {
    // Storage can be unavailable (private windows, blocked site data); the app
    // still works, you just lose saved scenarios.
  }
}
