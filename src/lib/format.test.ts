import { describe, expect, it } from 'vitest'
import {
  formatAxis,
  formatCompact,
  formatDuration,
  formatMonthDelta,
  formatPct,
  formatTaka,
  groupBD,
} from './format'

describe('taka formatting', () => {
  it('groups digits the South Asian way — last three, then pairs', () => {
    expect(groupBD(999)).toBe('999')
    expect(groupBD(1000)).toBe('1,000')
    expect(groupBD(100000)).toBe('1,00,000')
    expect(groupBD(12345678)).toBe('1,23,45,678')
    expect(groupBD(-250000)).toBe('-2,50,000')
    expect(formatTaka(1500000)).toBe('৳15,00,000')
  })

  it('never eats a trailing zero from a whole number', () => {
    // The bug this test exists for: ৳500 once rendered as ৳5.
    expect(formatCompact(500)).toBe('৳500')
    expect(formatCompact(100)).toBe('৳100')
    expect(formatCompact(10)).toBe('৳10')
    expect(formatPct(50, 0)).toBe('50%')
    expect(formatPct(10, 0)).toBe('10%')
    expect(formatPct(20, 0)).toBe('20%')
    expect(formatPct(100, 0)).toBe('100%')
  })

  it('still drops zeros that sit after a decimal point', () => {
    expect(formatPct(9.0, 1)).toBe('9%')
    expect(formatPct(8.5, 1)).toBe('8.5%')
    expect(formatCompact(20000000)).toBe('৳2 Cr')
    expect(formatCompact(25000000)).toBe('৳2.5 Cr')
    expect(formatCompact(1250000)).toBe('৳12.5 L')
  })

  it('speaks in lakh and crore', () => {
    expect(formatCompact(100000)).toBe('৳1 L')
    expect(formatCompact(9870000)).toBe('৳98.7 L')
    expect(formatCompact(10000000)).toBe('৳1 Cr')
    expect(formatCompact(98700000)).toBe('৳9.87 Cr')
    expect(formatCompact(-5000000)).toBe('-৳50 L')
  })

  it('keeps axis ticks short', () => {
    expect(formatAxis(2200000)).toBe('22L')
    expect(formatAxis(2000000)).toBe('20L')
    expect(formatAxis(120000000)).toBe('12Cr')
    expect(formatAxis(50000)).toBe('50K')
  })

  it('writes durations the way people say them', () => {
    expect(formatDuration(0)).toBe('0 months')
    expect(formatDuration(1)).toBe('1 month')
    expect(formatDuration(12)).toBe('1 year')
    expect(formatDuration(13)).toBe('1 year 1 month')
    expect(formatDuration(237)).toBe('19 years 9 months')
    expect(formatDuration(240)).toBe('20 years')
  })

  it('signs a shift in the date', () => {
    expect(formatMonthDelta(0)).toBe('no change')
    expect(formatMonthDelta(22)).toBe('1 yr 10 mo later')
    expect(formatMonthDelta(-16)).toBe('1 yr 4 mo sooner')
    expect(formatMonthDelta(-3)).toBe('3 mo sooner')
    expect(formatMonthDelta(24)).toBe('2 yr later')
  })
})
