/**
 * StatsCard.test.tsx
 *
 * StatsCard is a server-compatible component (no 'use client') that wraps
 * shadcn Card components. Tests verify content rendering and Tailwind colour
 * classes derived from the `color` prop.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Trophy, BookOpen, Target, TrendingUp } from 'lucide-react'

import { StatsCard } from '@/components/dashboard/StatsCard'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('StatsCard — basic content', () => {
  it('renders the title', () => {
    render(<StatsCard title="Problems Solved" value={42} />)
    expect(screen.getByText('Problems Solved')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<StatsCard title="Problems Solved" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<StatsCard title="Acceptance" value="73.2%" />)
    expect(screen.getByText('73.2%')).toBeInTheDocument()
  })

  it('renders the subtitle when provided', () => {
    render(
      <StatsCard title="Score" value={100} subtitle="Top 5% this week" />,
    )
    expect(screen.getByText('Top 5% this week')).toBeInTheDocument()
  })

  it('does not render a subtitle element when subtitle is omitted', () => {
    render(<StatsCard title="Score" value={100} />)
    // No <p> with text-zinc-500 should be in the document
    expect(screen.queryByText(/top/i)).not.toBeInTheDocument()
  })
})

describe('StatsCard — icon rendering', () => {
  it('renders an SVG icon when the icon prop is provided', () => {
    const { container } = render(
      <StatsCard title="Trophies" value={3} icon={Trophy} />,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('does not render an icon container when the icon prop is omitted', () => {
    const { container } = render(<StatsCard title="Score" value={10} />)
    // There should be no svg if no icon is passed
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('renders different icons correctly', () => {
    const { container: c1 } = render(
      <StatsCard title="Books" value={5} icon={BookOpen} />,
    )
    const { container: c2 } = render(
      <StatsCard title="Target" value={7} icon={Target} />,
    )
    expect(c1.querySelector('svg')).toBeInTheDocument()
    expect(c2.querySelector('svg')).toBeInTheDocument()
  })
})

describe('StatsCard — colour classes', () => {
  it('applies green text class to the value when color="green"', () => {
    const { container } = render(
      <StatsCard title="Easy" value={10} color="green" />,
    )
    const valueEl = container.querySelector('.text-green-400')
    expect(valueEl).toBeInTheDocument()
    expect(valueEl).toHaveTextContent('10')
  })

  it('applies green icon background class when color="green"', () => {
    const { container } = render(
      <StatsCard title="Easy" value={10} color="green" icon={Trophy} />,
    )
    expect(container.querySelector('.bg-green-900\\/40')).toBeInTheDocument()
  })

  it('applies yellow text class to the value when color="yellow"', () => {
    const { container } = render(
      <StatsCard title="Medium" value={5} color="yellow" />,
    )
    expect(container.querySelector('.text-yellow-400')).toBeInTheDocument()
  })

  it('applies yellow icon background when color="yellow"', () => {
    const { container } = render(
      <StatsCard title="Medium" value={5} color="yellow" icon={Trophy} />,
    )
    expect(container.querySelector('.bg-yellow-900\\/40')).toBeInTheDocument()
  })

  it('applies red text class to the value when color="red"', () => {
    const { container } = render(
      <StatsCard title="Hard" value={2} color="red" />,
    )
    expect(container.querySelector('.text-red-400')).toBeInTheDocument()
  })

  it('applies red icon background when color="red"', () => {
    const { container } = render(
      <StatsCard title="Hard" value={2} color="red" icon={Trophy} />,
    )
    expect(container.querySelector('.bg-red-900\\/40')).toBeInTheDocument()
  })

  it('applies blue text class to the value when color="blue"', () => {
    const { container } = render(
      <StatsCard title="Total" value={100} color="blue" />,
    )
    expect(container.querySelector('.text-blue-400')).toBeInTheDocument()
  })

  it('applies purple text class to the value when color="purple"', () => {
    const { container } = render(
      <StatsCard title="Streak" value={7} color="purple" />,
    )
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument()
  })

  it('applies default text-foreground class when color is omitted', () => {
    const { container } = render(<StatsCard title="Default" value={0} />)
    expect(container.querySelector('.text-foreground')).toBeInTheDocument()
  })

  it('applies default zinc icon background when color="default"', () => {
    const { container } = render(
      <StatsCard title="Default" value={0} color="default" icon={TrendingUp} />,
    )
    expect(container.querySelector('.bg-zinc-800')).toBeInTheDocument()
  })

  it('applies the correct icon colour class when color="blue"', () => {
    const { container } = render(
      <StatsCard title="Total" value={100} color="blue" icon={Trophy} />,
    )
    // Icon wrapper should have blue-900/40 bg
    expect(container.querySelector('.bg-blue-900\\/40')).toBeInTheDocument()
    // Icon svg should have blue-400 text
    expect(container.querySelector('.text-blue-400 svg, svg.text-blue-400')).toBeInTheDocument()
  })
})

describe('StatsCard — card structure', () => {
  it('uses dark card background (bg-zinc-900)', () => {
    const { container } = render(<StatsCard title="T" value={1} />)
    expect(container.querySelector('.bg-zinc-900')).toBeInTheDocument()
  })

  it('renders the value in bold large font', () => {
    const { container } = render(<StatsCard title="T" value={999} />)
    const valueEl = container.querySelector('.text-3xl.font-bold')
    expect(valueEl).toBeInTheDocument()
    expect(valueEl).toHaveTextContent('999')
  })

  it('renders title with muted zinc-400 style', () => {
    const { container } = render(<StatsCard title="My Title" value={0} />)
    const titleEl = container.querySelector('.text-zinc-400')
    expect(titleEl).toBeInTheDocument()
    expect(titleEl).toHaveTextContent('My Title')
  })
})
