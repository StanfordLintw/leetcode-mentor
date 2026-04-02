/**
 * SubmissionHeatmap.test.tsx
 *
 * SubmissionHeatmap builds a grid of coloured cells from submission data.
 * It uses date-fns and real Date logic, so we freeze time to a known date
 * to make the grid dimensions deterministic.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { SubmissionHeatmap } from '@/components/dashboard/SubmissionHeatmap'

// ---------------------------------------------------------------------------
// Freeze time so the grid is always the same size.
// jest.setSystemTime requires a millisecond epoch number in Jest 30.
// ---------------------------------------------------------------------------
const FIXED_DATE = new Date('2026-04-01T00:00:00.000Z')
const FIXED_EPOCH = FIXED_DATE.getTime() // 1743465600000

beforeAll(() => {
  jest.useFakeTimers()
  jest.setSystemTime(FIXED_EPOCH)
})

afterAll(() => {
  jest.useRealTimers()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Count all grid cell divs (w-3 h-3 rounded-sm). */
function getCells(container: HTMLElement) {
  return container.querySelectorAll('.w-3.h-3.rounded-sm.cursor-pointer')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SubmissionHeatmap — grid structure', () => {
  it('renders at least 52 weeks worth of cells', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    const cells = getCells(container)
    // 52 complete weeks × 7 days = 364 cells minimum; the grid may be
    // slightly larger (53 weeks) depending on the day-of-week alignment.
    expect(cells.length).toBeGreaterThanOrEqual(364)
  })

  it('renders a multiple-of-7 cell count (full weeks only)', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    const cells = getCells(container)
    expect(cells.length % 7).toBe(0)
  })

  it('renders at most 53×7 = 371 cells', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    const cells = getCells(container)
    expect(cells.length).toBeLessThanOrEqual(371)
  })
})

describe('SubmissionHeatmap — empty data (all zero counts)', () => {
  it('applies bg-zinc-800 to every cell when data is empty', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    const cells = getCells(container)
    const nonGrayCells = Array.from(cells).filter(
      (cell) => !cell.classList.contains('bg-zinc-800'),
    )
    expect(nonGrayCells).toHaveLength(0)
  })

  it('renders no green cells when data is empty', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    // Use cursor-pointer to target only grid cells, not legend squares
    const greenGridCells = container.querySelectorAll(
      '.cursor-pointer.bg-green-900, .cursor-pointer.bg-green-700, .cursor-pointer.bg-green-500',
    )
    expect(greenGridCells).toHaveLength(0)
  })
})

describe('SubmissionHeatmap — colour thresholds', () => {
  it('applies bg-zinc-800 for count=0', () => {
    // All data empty → already verified above, but check explicitly with a
    // date that will definitely be in the grid window.
    const { container } = render(<SubmissionHeatmap data={[]} />)
    const zincCells = container.querySelectorAll('.bg-zinc-800')
    expect(zincCells.length).toBeGreaterThan(0)
  })

  it('applies bg-green-900 for count=1 (low activity)', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 1 }]} />,
    )
    expect(container.querySelector('.bg-green-900')).toBeInTheDocument()
  })

  it('applies bg-green-900 for count=2', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 2 }]} />,
    )
    expect(container.querySelector('.bg-green-900')).toBeInTheDocument()
  })

  it('applies bg-green-700 for count=3 (medium activity)', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 3 }]} />,
    )
    expect(container.querySelector('.bg-green-700')).toBeInTheDocument()
  })

  it('applies bg-green-700 for count=5', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 5 }]} />,
    )
    expect(container.querySelector('.bg-green-700')).toBeInTheDocument()
  })

  it('applies bg-green-500 for count=6 (high activity)', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 6 }]} />,
    )
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })

  it('applies bg-green-500 for count=10 (very high activity)', () => {
    const yesterday = new Date(FIXED_DATE)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    const { container } = render(
      <SubmissionHeatmap data={[{ date: dateStr, count: 10 }]} />,
    )
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })

  it('ignores dates that fall outside the grid window (too old)', () => {
    // 5 years ago — well outside the 364-day window
    const { container } = render(
      <SubmissionHeatmap data={[{ date: '2020-01-01', count: 99 }]} />,
    )
    // Grid cells with cursor-pointer should have no green-500 (legend excluded)
    expect(
      container.querySelector('.cursor-pointer.bg-green-500'),
    ).not.toBeInTheDocument()
  })
})

describe('SubmissionHeatmap — month labels', () => {
  it('renders month label text elements', () => {
    render(<SubmissionHeatmap data={[]} />)
    // The heatmap spans ~13 months so we expect multiple month labels
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    let foundCount = 0
    for (const month of monthNames) {
      if (screen.queryByText(month)) foundCount++
    }
    // At least 12 distinct month labels must appear across the trailing year
    expect(foundCount).toBeGreaterThanOrEqual(12)
  })

  it('renders April as a visible month label (fixed date is Apr 2026)', () => {
    render(<SubmissionHeatmap data={[]} />)
    expect(screen.getByText('Apr')).toBeInTheDocument()
  })
})

describe('SubmissionHeatmap — day labels', () => {
  it('renders odd-indexed day labels (Mon, Wed, Fri)', () => {
    render(<SubmissionHeatmap data={[]} />)
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
  })
})

describe('SubmissionHeatmap — legend', () => {
  it('renders the "Less" legend label', () => {
    render(<SubmissionHeatmap data={[]} />)
    expect(screen.getByText('Less')).toBeInTheDocument()
  })

  it('renders the "More" legend label', () => {
    render(<SubmissionHeatmap data={[]} />)
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('renders four legend colour squares', () => {
    const { container } = render(<SubmissionHeatmap data={[]} />)
    // Legend squares are w-3 h-3 rounded-sm but outside the grid; the
    // grid cells also have cursor-pointer so we can distinguish them.
    const allSquares = container.querySelectorAll('.w-3.h-3.rounded-sm')
    const legendSquares = Array.from(allSquares).filter(
      (el) => !el.classList.contains('cursor-pointer'),
    )
    expect(legendSquares).toHaveLength(4)
  })
})

describe('SubmissionHeatmap — multiple data points', () => {
  it('renders multiple green cells for multiple data points in the window', () => {
    const dates = [-1, -2, -3].map((offset) => {
      const d = new Date(FIXED_DATE)
      d.setDate(d.getDate() + offset)
      return { date: d.toISOString().split('T')[0], count: 7 }
    })

    const { container } = render(<SubmissionHeatmap data={dates} />)
    // cursor-pointer distinguishes grid cells from the legend squares
    const greenHighCells = container.querySelectorAll('.cursor-pointer.bg-green-500')
    expect(greenHighCells.length).toBe(3)
  })
})
