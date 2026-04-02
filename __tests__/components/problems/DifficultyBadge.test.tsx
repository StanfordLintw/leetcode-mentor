/**
 * DifficultyBadge.test.tsx
 *
 * Verifies that DifficultyBadge renders the correct label and Tailwind colour
 * classes for each of the three difficulty levels.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { DifficultyBadge } from '@/components/problems/DifficultyBadge'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderBadge(difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
  const { container } = render(<DifficultyBadge difficulty={difficulty} />)
  const badge = container.firstChild as HTMLElement
  return badge
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DifficultyBadge', () => {
  // ---- EASY ----------------------------------------------------------------
  describe('EASY difficulty', () => {
    it('renders the text "Easy"', () => {
      render(<DifficultyBadge difficulty="EASY" />)
      expect(screen.getByText('Easy')).toBeInTheDocument()
    })

    it('applies green background class (dark mode)', () => {
      const badge = renderBadge('EASY')
      expect(badge.className).toContain('text-emerald-800')
    })

    it('applies emerald border class', () => {
      const badge = renderBadge('EASY')
      expect(badge.className).toContain('border-emerald-200')
    })

    it('applies emerald background class', () => {
      const badge = renderBadge('EASY')
      expect(badge.className).toContain('bg-emerald-100')
    })

    it('does not contain yellow or red colour classes', () => {
      const badge = renderBadge('EASY')
      expect(badge.className).not.toContain('yellow')
      expect(badge.className).not.toContain('red')
    })
  })

  // ---- MEDIUM --------------------------------------------------------------
  describe('MEDIUM difficulty', () => {
    it('renders the text "Medium"', () => {
      render(<DifficultyBadge difficulty="MEDIUM" />)
      expect(screen.getByText('Medium')).toBeInTheDocument()
    })

    it('applies yellow text class', () => {
      const badge = renderBadge('MEDIUM')
      expect(badge.className).toContain('text-yellow-800')
    })

    it('applies yellow background class', () => {
      const badge = renderBadge('MEDIUM')
      expect(badge.className).toContain('bg-yellow-100')
    })

    it('applies yellow border class', () => {
      const badge = renderBadge('MEDIUM')
      expect(badge.className).toContain('border-yellow-200')
    })

    it('does not contain emerald or red colour classes', () => {
      const badge = renderBadge('MEDIUM')
      expect(badge.className).not.toContain('emerald')
      expect(badge.className).not.toContain('red')
    })
  })

  // ---- HARD ----------------------------------------------------------------
  describe('HARD difficulty', () => {
    it('renders the text "Hard"', () => {
      render(<DifficultyBadge difficulty="HARD" />)
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })

    it('applies red text class', () => {
      const badge = renderBadge('HARD')
      expect(badge.className).toContain('text-red-800')
    })

    it('applies red background class', () => {
      const badge = renderBadge('HARD')
      expect(badge.className).toContain('bg-red-100')
    })

    it('applies red border class', () => {
      const badge = renderBadge('HARD')
      expect(badge.className).toContain('border-red-200')
    })

    it('does not contain emerald or yellow colour classes', () => {
      const badge = renderBadge('HARD')
      expect(badge.className).not.toContain('emerald')
      expect(badge.className).not.toContain('yellow')
    })
  })

  // ---- Shared structure ----------------------------------------------------
  describe('shared structure', () => {
    it('renders as a <span> element', () => {
      const { container } = render(<DifficultyBadge difficulty="EASY" />)
      expect(container.firstChild?.nodeName).toBe('SPAN')
    })

    it('merges an extra className prop onto the badge', () => {
      const { container } = render(
        <DifficultyBadge difficulty="EASY" className="my-custom-class" />,
      )
      expect((container.firstChild as HTMLElement).className).toContain(
        'my-custom-class',
      )
    })

    it('always contains the base rounded-full class', () => {
      for (const d of ['EASY', 'MEDIUM', 'HARD'] as const) {
        const badge = renderBadge(d)
        expect(badge.className).toContain('rounded-full')
      }
    })
  })
})
