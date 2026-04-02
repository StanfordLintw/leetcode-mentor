/**
 * StreamingText.test.tsx
 *
 * StreamingText renders text with an optional blinking cursor. The cursor
 * blinks via a setInterval — we use fake timers to control it precisely.
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'

import StreamingText from '@/components/ai/StreamingText'

// ---------------------------------------------------------------------------
// Use fake timers for all tests so we can control cursor blink intervals
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

// ---------------------------------------------------------------------------
// Tests — text content
// ---------------------------------------------------------------------------
describe('StreamingText — text rendering', () => {
  it('renders the provided text content', () => {
    render(<StreamingText text="Hello, world!" />)
    expect(screen.getByText(/Hello, world!/)).toBeInTheDocument()
  })

  it('renders an empty string without crashing', () => {
    expect(() => render(<StreamingText text="" />)).not.toThrow()
  })

  it('renders multi-line text correctly', () => {
    render(<StreamingText text={'First line\nSecond line'} />)
    expect(screen.getByText(/First line/)).toBeInTheDocument()
  })

  it('applies whitespace-pre-wrap class to the outer span', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const outer = container.firstChild as HTMLElement
    expect(outer.className).toContain('whitespace-pre-wrap')
  })

  it('merges an extra className onto the outer span', () => {
    const { container } = render(
      <StreamingText text="Hello" className="my-custom-class" />,
    )
    const outer = container.firstChild as HTMLElement
    expect(outer.className).toContain('my-custom-class')
  })
})

// ---------------------------------------------------------------------------
// Tests — cursor element
// ---------------------------------------------------------------------------
describe('StreamingText — cursor visibility', () => {
  it('renders the cursor element by default (showCursor=true)', () => {
    const { container } = render(<StreamingText text="Hello" />)
    // The cursor span is aria-hidden
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor).toBeInTheDocument()
  })

  it('renders the cursor when showCursor is explicitly true', () => {
    const { container } = render(
      <StreamingText text="Hello" showCursor={true} />,
    )
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor).toBeInTheDocument()
  })

  it('does not render the cursor when showCursor=false', () => {
    const { container } = render(
      <StreamingText text="Hello" showCursor={false} />,
    )
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor).not.toBeInTheDocument()
  })

  it('cursor span has inline-block display class', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('inline-block')
  })

  it('cursor span has the correct width class (w-[2px])', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('w-[2px]')
  })

  it('cursor span has height class (h-[1.1em])', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('h-[1.1em]')
  })

  it('cursor has bg-current class to match parent text colour', () => {
    const { container } = render(<StreamingText text="Hi" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('bg-current')
  })
})

// ---------------------------------------------------------------------------
// Tests — cursor blinking (opacity toggling via setInterval)
// ---------------------------------------------------------------------------
describe('StreamingText — cursor blinking', () => {
  it('starts with opacity-100 (cursor visible) on first render', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('opacity-100')
  })

  it('switches to opacity-0 after one interval (530 ms)', () => {
    const { container } = render(<StreamingText text="Hello" />)
    act(() => {
      jest.advanceTimersByTime(530)
    })
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('opacity-0')
  })

  it('switches back to opacity-100 after two intervals (1060 ms)', () => {
    const { container } = render(<StreamingText text="Hello" />)
    act(() => {
      jest.advanceTimersByTime(1060)
    })
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('opacity-100')
  })

  it('toggles opacity-0 again after three intervals (1590 ms)', () => {
    const { container } = render(<StreamingText text="Hello" />)
    act(() => {
      jest.advanceTimersByTime(1590)
    })
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('opacity-0')
  })

  it('cursor does not blink when showCursor=false (no interval side-effects)', () => {
    // If no cursor is rendered, we simply verify no error is thrown when
    // timers advance.
    const { container } = render(
      <StreamingText text="Hello" showCursor={false} />,
    )
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(2000)
      })
    }).not.toThrow()
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })

  it('has a transition-opacity class for smooth fading', () => {
    const { container } = render(<StreamingText text="Hello" />)
    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('transition-opacity')
  })
})

// ---------------------------------------------------------------------------
// Tests — text updates (prop changes)
// ---------------------------------------------------------------------------
describe('StreamingText — text prop updates', () => {
  it('updates displayed text when the text prop changes', () => {
    const { rerender } = render(<StreamingText text="Initial" />)
    expect(screen.getByText(/Initial/)).toBeInTheDocument()

    rerender(<StreamingText text="Updated text" />)
    expect(screen.getByText(/Updated text/)).toBeInTheDocument()
  })

  it('cursor continues blinking after a text prop update', () => {
    const { container, rerender } = render(<StreamingText text="A" />)

    rerender(<StreamingText text="AB" />)

    act(() => {
      jest.advanceTimersByTime(530)
    })

    const cursor = container.querySelector('[aria-hidden="true"]')
    expect(cursor?.className).toContain('opacity-0')
  })
})
