/**
 * CategoryBadge.test.tsx
 *
 * Verifies that CategoryBadge renders the correct label for all 16 categories,
 * shows/hides the Lucide icon based on the `showIcon` prop, and applies the
 * category-specific colour classes.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { CategoryBadge } from '@/components/problems/CategoryBadge'

// ---------------------------------------------------------------------------
// All 16 categories and their expected display labels
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { value: 'ARRAY', label: 'Array' },
  { value: 'STRING', label: 'String' },
  { value: 'LINKED_LIST', label: 'Linked List' },
  { value: 'TREE', label: 'Tree' },
  { value: 'GRAPH', label: 'Graph' },
  { value: 'DYNAMIC_PROGRAMMING', label: 'DP' },
  { value: 'BACKTRACKING', label: 'Backtracking' },
  { value: 'BINARY_SEARCH', label: 'Binary Search' },
  { value: 'STACK_QUEUE', label: 'Stack/Queue' },
  { value: 'HASH_TABLE', label: 'Hash Table' },
  { value: 'MATH', label: 'Math' },
  { value: 'TWO_POINTERS', label: 'Two Pointers' },
  { value: 'SLIDING_WINDOW', label: 'Sliding Window' },
  { value: 'GREEDY', label: 'Greedy' },
  { value: 'HEAP', label: 'Heap' },
  { value: 'TRIE', label: 'Trie' },
] as const

type Category = (typeof CATEGORIES)[number]['value']

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CategoryBadge — label rendering', () => {
  it.each(CATEGORIES)(
    'renders the correct label "$label" for category $value',
    ({ value, label }) => {
      render(<CategoryBadge category={value as Category} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )
})

describe('CategoryBadge — icon visibility', () => {
  it('renders an SVG icon when showIcon is true (default)', () => {
    const { container } = render(
      <CategoryBadge category="ARRAY" showIcon={true} />,
    )
    // Lucide icons render as <svg> elements
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders an SVG icon by default (showIcon not provided)', () => {
    const { container } = render(<CategoryBadge category="ARRAY" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('hides the SVG icon when showIcon is false', () => {
    const { container } = render(
      <CategoryBadge category="ARRAY" showIcon={false} />,
    )
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('still renders the label text when showIcon is false', () => {
    render(<CategoryBadge category="ARRAY" showIcon={false} />)
    expect(screen.getByText('Array')).toBeInTheDocument()
  })

  it('still renders the label text when showIcon is true', () => {
    render(<CategoryBadge category="TREE" showIcon={true} />)
    expect(screen.getByText('Tree')).toBeInTheDocument()
  })
})

describe('CategoryBadge — colour classes', () => {
  it('applies blue classes for ARRAY', () => {
    const { container } = render(<CategoryBadge category="ARRAY" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-blue-100')
    expect(badge.className).toContain('text-blue-800')
  })

  it('applies purple classes for STRING', () => {
    const { container } = render(<CategoryBadge category="STRING" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-purple-100')
    expect(badge.className).toContain('text-purple-800')
  })

  it('applies cyan classes for LINKED_LIST', () => {
    const { container } = render(<CategoryBadge category="LINKED_LIST" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-cyan-100')
    expect(badge.className).toContain('text-cyan-800')
  })

  it('applies green classes for TREE', () => {
    const { container } = render(<CategoryBadge category="TREE" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-800')
  })

  it('applies orange classes for DYNAMIC_PROGRAMMING', () => {
    const { container } = render(<CategoryBadge category="DYNAMIC_PROGRAMMING" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-orange-100')
    expect(badge.className).toContain('text-orange-800')
  })

  it('applies red classes for HEAP', () => {
    const { container } = render(<CategoryBadge category="HEAP" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-red-100')
    expect(badge.className).toContain('text-red-800')
  })

  it('applies pink classes for TRIE', () => {
    const { container } = render(<CategoryBadge category="TRIE" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-pink-100')
    expect(badge.className).toContain('text-pink-800')
  })
})

describe('CategoryBadge — shared structure', () => {
  it('renders as a <span> element', () => {
    const { container } = render(<CategoryBadge category="MATH" />)
    expect(container.firstChild?.nodeName).toBe('SPAN')
  })

  it('always contains the rounded-full base class', () => {
    const { container } = render(<CategoryBadge category="MATH" />)
    expect((container.firstChild as HTMLElement).className).toContain(
      'rounded-full',
    )
  })

  it('merges an extra className onto the badge', () => {
    const { container } = render(
      <CategoryBadge category="MATH" className="custom-class" />,
    )
    expect((container.firstChild as HTMLElement).className).toContain(
      'custom-class',
    )
  })
})
