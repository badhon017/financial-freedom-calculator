// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { decodeInputs, encodeInputs } from './url'
import { DEFAULT_INPUTS, newGoal } from './defaults'

describe('share links', () => {
  it('round-trips a plan exactly', () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      monthlySalary: 185000,
      incrementMode: 'fixed' as const,
      incrementValue: 7500,
      goals: [newGoal({ id: 'g1', name: "Child's education", atAge: 42 })],
    }
    expect(decodeInputs(encodeInputs(inputs))).toEqual(inputs)
  })

  it('survives non-ASCII goal names', () => {
    const inputs = { ...DEFAULT_INPUTS, goals: [newGoal({ id: 'g1', name: 'বাড়ি — ৳30 লাখ' })] }
    expect(decodeInputs(encodeInputs(inputs))?.goals[0].name).toBe('বাড়ি — ৳30 লাখ')
  })

  it('falls back to defaults rather than throwing on a mangled link', () => {
    expect(decodeInputs('not-base64-at-all!!')).toBeNull()
  })

  it('fills in fields a link from an older version is missing', () => {
    const partial = btoa(JSON.stringify({ monthlySalary: 50000 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const decoded = decodeInputs(partial)
    expect(decoded?.monthlySalary).toBe(50000)
    expect(decoded?.inflationPct).toBe(DEFAULT_INPUTS.inflationPct)
    expect(decoded?.goals).toEqual([])
  })
})
