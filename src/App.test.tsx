// @vitest-environment jsdom
import { describe, expect, it, beforeAll } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  // jsdom has no layout engine, so Recharts' ResponsiveContainer measures zero
  // unless we give it a box to work with.
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 900 })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 400 })
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 900, height: 400, top: 0, left: 0, right: 900, bottom: 400, x: 0, y: 0 }) as DOMRect
  // Recharts sizes itself from ResizeObserver, so the mock has to report a box.
  globalThis.ResizeObserver = class {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element) {
      this.callback(
        [{ target, contentRect: { width: 900, height: 400 } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
})

describe('the page', () => {
  it('mounts the whole calculator and shows a real answer', async () => {
    // React key warnings and Recharts complaints surface here, not in a UI.
    const errors: unknown[] = []
    const realError = console.error
    const realWarn = console.warn
    console.error = (...args: unknown[]) => errors.push(args)
    console.warn = (...args: unknown[]) => errors.push(args)

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(<App />)
    })

    const text = container.textContent ?? ''
    expect(text).toContain('Financial Freedom Calculator')
    expect(text).toContain('Time to financial freedom')
    // The default Bangladeshi plan should land somewhere believable.
    expect(text).toMatch(/\d+ years/)
    expect(text).toContain('The chase')
    expect(text).toContain('Year by year')
    expect(text).toContain('What this does not model')
    // Charts actually drew marks rather than failing silently.
    expect(container.querySelectorAll('svg.recharts-surface').length).toBeGreaterThanOrEqual(3)

    // The pieces that carry the visual design, not just the numbers.
    const progress = container.querySelector('[role="progressbar"]')
    expect(progress).not.toBeNull()
    const pct = Number(progress!.getAttribute('aria-valuenow'))
    expect(pct).toBeGreaterThanOrEqual(0)
    expect(pct).toBeLessThanOrEqual(100)
    expect(text).toContain('of the way there today')
    // Three chapter headings break up the input column.
    expect(text).toContain('Where you are now')
    expect(text).toContain('What you assume')
    expect(text).toContain('Where you are going')
    // Card icons render as real SVG, not empty spans.
    expect(container.querySelectorAll('svg[viewBox="0 0 24 24"]').length).toBeGreaterThanOrEqual(8)
    // Milestone timeline ends on the finish marker.
    expect(text).toContain('Financially free')
    // The cashflow chart defaults to today's money so early bars stay visible.
    expect(text).toContain('the bars stay comparable')
    // Composition chart defaults to a share stack, so no year is a sliver.
    expect(text).toContain('every year reads equally')
    // Safe-withdrawal choices lead with the corpus multiple, equal height.
    expect(text).toContain('25×')
    expect(text).toContain('33×')
    expect(text).toContain('Classic')
    // The target panel shows the inflation gap as its own rung.
    expect(text).toContain('inflation')
    expect(text).toContain('buying power')
    // Goal presets are split by direction.
    expect(text).toContain('Costs')
    expect(text).toContain('Windfalls')
    // The limits are a scannable grid, not a bullet list.
    for (const gap of ['Tax', 'Life after the milestone', 'Bad luck in the wrong order']) {
      expect(text).toContain(gap)
    }
    expect(container.querySelectorAll('ul').length).toBe(0)

    await act(async () => {
      root.unmount()
    })
    container.remove()
    console.error = realError
    console.warn = realWarn
    expect(errors).toEqual([])
  })
})
