/**
 * Chart colours are CSS custom properties, so light/dark swaps happen in CSS
 * rather than in React state. SVG presentation attributes resolve var() fine.
 */
export const COLORS = {
  corpus: 'var(--series-corpus)',
  target: 'var(--series-target)',
  growth: 'var(--series-growth)',
  surface: 'var(--surface-1)',
  grid: 'var(--grid)',
  axis: 'var(--axis)',
  muted: 'var(--ink-muted)',
  late: 'var(--diverge-late)',
} as const

export const AXIS_PROPS = {
  stroke: COLORS.axis,
  tick: { fill: COLORS.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: COLORS.axis },
} as const
