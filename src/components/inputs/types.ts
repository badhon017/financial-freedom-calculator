import type { Inputs } from '../../lib/types'

export interface CardProps {
  inputs: Inputs
  update: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
  patch: (changes: Partial<Inputs>) => void
}
