import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Eases a number from its previous value to the new one. Inputs here update on
 * every keystroke, so the duration is short — enough to make a big jump feel
 * like movement, not enough to lag behind typing.
 */
export function useCountUp(value: number, duration = 450): number {
  // Decided once: the only state written below happens inside a frame callback.
  const [still] = useState(
    () => prefersReducedMotion() || typeof requestAnimationFrame !== 'function',
  )
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)
  const frameRef = useRef(0)

  useEffect(() => {
    if (still) return
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      // easeOutCubic: quick off the mark, settles gently.
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = from + (value - from) * eased
      setShown(next)
      fromRef.current = next
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
      else fromRef.current = value
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration, still])

  return still ? value : shown
}
