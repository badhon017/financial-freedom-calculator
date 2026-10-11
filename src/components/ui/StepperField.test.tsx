// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { StepperField } from './primitives'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
})

/** Drive the input the way a keyboard does, through React's own event path. */
function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function blur(input: HTMLInputElement) {
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
}

function mount(initial: number, min = 15, max = 99) {
  const container = document.createElement('div')
  document.body.append(container)
  const root: Root = createRoot(container)
  const state = { value: initial }
  const render = () =>
    act(() => {
      root.render(
        <StepperField
          label="Current age"
          value={state.value}
          min={min}
          max={max}
          onChange={(next) => {
            state.value = next
            render()
          }}
        />,
      )
    })
  render()
  const input = container.querySelector('input') as HTMLInputElement
  const [minus, plus] = Array.from(container.querySelectorAll('button'))
  return { container, root, state, input, minus, plus }
}

describe('age input', () => {
  it('lets you clear the field and type a new age without fighting you', () => {
    const { state, input } = mount(30)

    act(() => input.dispatchEvent(new FocusEvent('focusin', { bubbles: true })))
    act(() => typeInto(input, ''))
    // The old behaviour clamped here and snapped the field to 15.
    expect(input.value).toBe('')
    expect(state.value).toBe(30)

    act(() => typeInto(input, '4'))
    expect(input.value).toBe('4')

    act(() => typeInto(input, '45'))
    expect(input.value).toBe('45')

    act(() => blur(input))
    expect(state.value).toBe(45)
  })

  it('clamps only once typing is finished', () => {
    const { state, input } = mount(30, 15, 99)
    act(() => typeInto(input, '8'))
    expect(state.value).toBe(30) // nothing committed mid-type
    act(() => blur(input))
    expect(state.value).toBe(15) // 8 is below the floor, corrected on blur
  })

  it('keeps a blank entry rather than turning it into zero', () => {
    const { state, input } = mount(42)
    act(() => typeInto(input, ''))
    act(() => blur(input))
    expect(state.value).toBe(42)
  })

  it('ignores letters and overlong input', () => {
    const { input } = mount(30)
    act(() => typeInto(input, '4a5'))
    expect(input.value).toBe('45')
    act(() => typeInto(input, '123456'))
    expect(input.value).toBe('123')
  })

  it('steps with the plus and minus buttons', () => {
    const { state, minus, plus } = mount(30)
    act(() => plus.click())
    expect(state.value).toBe(31)
    act(() => minus.click())
    act(() => minus.click())
    expect(state.value).toBe(29)
  })

  it('disables a stepper at its bound instead of going past it', () => {
    const atFloor = mount(15, 15, 99)
    expect(atFloor.minus.hasAttribute('disabled')).toBe(true)
    expect(atFloor.plus.hasAttribute('disabled')).toBe(false)

    const atCeiling = mount(99, 15, 99)
    expect(atCeiling.plus.hasAttribute('disabled')).toBe(true)
  })

  it('offers a numeric keypad on phones and no native spinners', () => {
    const { input } = mount(30)
    expect(input.getAttribute('inputmode')).toBe('numeric')
    expect(input.getAttribute('type')).toBe('text')
  })

  it('gives the stepper buttons a 44px touch target', () => {
    const { minus, plus } = mount(30)
    for (const button of [minus, plus]) {
      expect(button.className).toContain('h-11')
      expect(button.className).toContain('w-11')
    }
  })
})
