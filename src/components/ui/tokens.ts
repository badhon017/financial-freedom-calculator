/** Tinted icon chips, keyed to the same three series hues the charts use. */
export const TONE_CLASS = {
  default: 'text-ink-2 bg-sunken',
  corpus: 'text-corpus bg-corpus/10',
  target: 'text-target bg-target/10',
  growth: 'text-growth bg-growth/10',
} as const

export type Tone = keyof typeof TONE_CLASS
