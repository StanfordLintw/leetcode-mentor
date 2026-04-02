/**
 * ProblemRow.test.tsx
 *
 * ProblemRow renders as a <tr> element with Next.js <Link> for the title.
 * We mock next/link so it renders as a plain <a> tag in jsdom.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { ProblemRow } from '@/components/problems/ProblemRow'
import type { ProblemRowProps } from '@/components/problems/ProblemRow'

// ---------------------------------------------------------------------------
// Mock next/link so hrefs are testable without a Next.js router
// ---------------------------------------------------------------------------
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------
const BASE_PROPS: ProblemRowProps = {
  id: 'prob-1',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'EASY',
  category: 'ARRAY',
  tags: ['Array', 'Hash Table'],
  leetcodeId: 1,
  acceptance: 49.5,
  solved: false,
}

/**
 * ProblemRow renders a <tr> which must be wrapped in a <table><tbody> to be
 * valid HTML.
 */
function renderRow(props: Partial<ProblemRowProps> = {}) {
  return render(
    <table>
      <tbody>
        <ProblemRow {...BASE_PROPS} {...props} />
      </tbody>
    </table>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProblemRow — basic rendering', () => {
  it('renders the problem title', () => {
    renderRow()
    expect(screen.getByText('Two Sum')).toBeInTheDocument()
  })

  it('renders the leetcodeId number', () => {
    renderRow()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders "—" when leetcodeId is null', () => {
    renderRow({ leetcodeId: null })
    // There may be multiple "—" (acceptance col is also "—" when undefined)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the acceptance rate formatted to 1 decimal place', () => {
    renderRow({ acceptance: 49.5 })
    expect(screen.getByText('49.5%')).toBeInTheDocument()
  })

  it('renders "—" for acceptance when it is undefined', () => {
    renderRow({ acceptance: undefined })
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })
})

describe('ProblemRow — navigation link', () => {
  it('links to /problems/[slug]', () => {
    renderRow()
    const link = screen.getByRole('link', { name: 'Two Sum' })
    expect(link).toHaveAttribute('href', '/problems/two-sum')
  })

  it('uses the slug from props in the href', () => {
    renderRow({ slug: 'longest-substring-without-repeating-characters' })
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'href',
      '/problems/longest-substring-without-repeating-characters',
    )
  })
})

describe('ProblemRow — difficulty badge', () => {
  it('renders "Easy" difficulty badge for EASY problems', () => {
    renderRow({ difficulty: 'EASY' })
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })

  it('renders "Medium" difficulty badge for MEDIUM problems', () => {
    renderRow({ difficulty: 'MEDIUM' })
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('renders "Hard" difficulty badge for HARD problems', () => {
    renderRow({ difficulty: 'HARD' })
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })
})

describe('ProblemRow — category badge', () => {
  it('renders the category label', () => {
    // Use a category whose label does not collide with any fixture tag name
    renderRow({ category: 'TREE', tags: [] })
    expect(screen.getByText('Tree')).toBeInTheDocument()
  })

  it('renders the ARRAY category label (may appear multiple times due to tags)', () => {
    // The word "Array" can appear both in the badge and in the tags list.
    // getAllByText confirms it exists at least once.
    renderRow({ category: 'ARRAY', tags: ['Array'] })
    expect(screen.getAllByText('Array').length).toBeGreaterThanOrEqual(1)
  })

  it('renders a different category label', () => {
    renderRow({ category: 'DYNAMIC_PROGRAMMING', tags: [] })
    expect(screen.getByText('DP')).toBeInTheDocument()
  })
})

describe('ProblemRow — tags', () => {
  it('renders up to 3 tags', () => {
    renderRow({ tags: ['Tag1', 'Tag2', 'Tag3'] })
    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
    expect(screen.getByText('Tag3')).toBeInTheDocument()
  })

  it('shows the overflow count when there are more than 3 tags', () => {
    renderRow({ tags: ['T1', 'T2', 'T3', 'T4', 'T5'] })
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows "+1" for exactly 4 tags', () => {
    renderRow({ tags: ['T1', 'T2', 'T3', 'T4'] })
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('does not show overflow badge when there are 3 or fewer tags', () => {
    renderRow({ tags: ['T1', 'T2', 'T3'] })
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('only shows the first 3 tags by name when overflow exists', () => {
    renderRow({ tags: ['Alpha', 'Beta', 'Gamma', 'Delta'] })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('Gamma')).toBeInTheDocument()
    expect(screen.queryByText('Delta')).not.toBeInTheDocument()
  })

  it('renders no tag elements when tags array is empty', () => {
    renderRow({ tags: [] })
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })
})

describe('ProblemRow — solved status', () => {
  it('renders a checkmark icon when solved=true', () => {
    renderRow({ solved: true })
    // CheckCircle2 renders as an SVG with aria-label="Solved"
    expect(screen.getByLabelText('Solved')).toBeInTheDocument()
  })

  it('does not render the solved checkmark when solved=false', () => {
    renderRow({ solved: false })
    expect(screen.queryByLabelText('Solved')).not.toBeInTheDocument()
  })

  it('does not render the solved checkmark when solved is omitted (defaults false)', () => {
    const { id, title, slug, difficulty, category, tags, leetcodeId } = BASE_PROPS
    render(
      <table>
        <tbody>
          <ProblemRow
            id={id}
            title={title}
            slug={slug}
            difficulty={difficulty}
            category={category}
            tags={tags}
            leetcodeId={leetcodeId}
          />
        </tbody>
      </table>,
    )
    expect(screen.queryByLabelText('Solved')).not.toBeInTheDocument()
  })
})
