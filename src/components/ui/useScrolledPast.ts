import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** True once the watched element has scrolled up out of view. */
export function useScrolledPast(ref: RefObject<HTMLElement | null>): boolean {
  const [past, setPast] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return past
}
