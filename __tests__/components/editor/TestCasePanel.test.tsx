/**
 * TestCasePanel.test.tsx
 *
 * TestCasePanel uses Radix Tabs (via shadcn/ui) and renders two tabs:
 *  - "Test Cases" — static input/expected-output for each TestCase
 *  - "Results"    — live results from a code run, with pass/fail badges
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import TestCasePanel from '@/components/editor/TestCasePanel'
import type { TestCase, TestResult } from '@/lib/judge0'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const TEST_CASES: TestCase[] = [
  { input: '[2,7,11,15]\n9', expected: '[0,1]' },
  { input: '[3,2,4]\n6', expected: '[1,2]' },
]

const PASSING_RESULTS: TestResult[] = [
  {
    passed: true,
    input: '[2,7,11,15]\n9',
    expected: '[0,1]',
    actual: '[0,1]',
    time: '0.05',
    memory: 10240,
  },
  {
    passed: true,
    input: '[3,2,4]\n6',
    expected: '[1,2]',
    actual: '[1,2]',
    time: '0.03',
    memory: 9216,
  },
]

const MIXED_RESULTS: TestResult[] = [
  {
    passed: true,
    input: '[2,7,11,15]\n9',
    expected: '[0,1]',
    actual: '[0,1]',
    time: '0.05',
    memory: 10240,
  },
  {
    passed: false,
    input: '[3,2,4]\n6',
    expected: '[1,2]',
    actual: '[0,2]',
    time: '0.04',
    memory: 9728,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TestCasePanel — Test Cases tab (default)', () => {
  it('renders the "Test Cases" tab trigger by default', () => {
    render(
      <TestCasePanel testCases={TEST_CASES} isRunning={false} />,
    )
    expect(screen.getByRole('tab', { name: /test cases/i })).toBeInTheDocument()
  })

  it('renders the "Results" tab trigger', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    expect(screen.getByRole('tab', { name: /results/i })).toBeInTheDocument()
  })

  it('shows the test case count badge in the "Test Cases" tab', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    // The badge text is the numeric count; it lives inside the trigger
    const trigger = screen.getByRole('tab', { name: /test cases/i })
    expect(trigger).toHaveTextContent('2')
  })

  it('shows the label "Input" for each test case', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    const inputLabels = screen.getAllByText('Input')
    expect(inputLabels).toHaveLength(TEST_CASES.length)
  })

  it('shows the label "Expected Output" for each test case', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    const expectedLabels = screen.getAllByText('Expected Output')
    expect(expectedLabels).toHaveLength(TEST_CASES.length)
  })

  it('renders the input value of the first test case', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    // Multi-line strings in <pre> elements: use a function matcher because
    // RTL normalizes whitespace in getByText.
    expect(
      screen.getByText((_, el) =>
        el?.tagName === 'PRE' &&
        (el.textContent ?? '').includes('[2,7,11,15]') || false,
      ),
    ).toBeInTheDocument()
  })

  it('renders the expected output of the first test case', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    expect(screen.getByText('[0,1]')).toBeInTheDocument()
  })

  it('labels each test case with its 1-based index', () => {
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    expect(screen.getByText('Case 1')).toBeInTheDocument()
    expect(screen.getByText('Case 2')).toBeInTheDocument()
  })

  it('shows "No test cases available." when testCases is empty', () => {
    render(<TestCasePanel testCases={[]} isRunning={false} />)
    expect(screen.getByText('No test cases available.')).toBeInTheDocument()
  })
})

describe('TestCasePanel — Results tab', () => {
  it('switches to the Results tab when clicked', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    // "Run code to see results." should NOT appear because we have results
    expect(screen.queryByText('Run code to see results.')).not.toBeInTheDocument()
  })

  it('shows "Run code to see results." when results tab is open and results is empty', async () => {
    const user = userEvent.setup()
    render(<TestCasePanel testCases={TEST_CASES} results={[]} isRunning={false} />)
    await user.click(screen.getByRole('tab', { name: /results/i }))
    expect(screen.getByText('Run code to see results.')).toBeInTheDocument()
  })

  it('shows "Run code to see results." when results is undefined and results tab is open', async () => {
    const user = userEvent.setup()
    render(<TestCasePanel testCases={TEST_CASES} isRunning={false} />)
    await user.click(screen.getByRole('tab', { name: /results/i }))
    expect(screen.getByText('Run code to see results.')).toBeInTheDocument()
  })

  it('shows a loading spinner when isRunning=true and results tab is open', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel testCases={TEST_CASES} isRunning={true} />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    expect(screen.getByText('Running test cases…')).toBeInTheDocument()
  })

  it('does not show results list while isRunning=true', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={true}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    expect(screen.queryByText('✅ Passed')).not.toBeInTheDocument()
  })

  it('shows "✅ Passed" badge for a passing result', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    const badges = screen.getAllByText('✅ Passed')
    expect(badges.length).toBe(PASSING_RESULTS.length)
  })

  it('shows "❌ Failed" badge for a failing result', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={MIXED_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    expect(screen.getByText('❌ Failed')).toBeInTheDocument()
  })

  it('shows time information for each result', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    // MetaPill renders "Time: 0.05s"
    expect(screen.getByText('0.05s')).toBeInTheDocument()
    expect(screen.getByText('0.03s')).toBeInTheDocument()
  })

  it('shows memory information for each result', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    // 10240 bytes → 10.0 MB
    expect(screen.getByText('10.0 MB')).toBeInTheDocument()
    // 9216 bytes → 9.0 MB
    expect(screen.getByText('9.0 MB')).toBeInTheDocument()
  })

  it('does not show time pill when time is null', async () => {
    const user = userEvent.setup()
    const resultsWithNullTime: TestResult[] = [
      {
        passed: false,
        input: 'x',
        expected: 'y',
        actual: 'z',
        time: null,
        memory: null,
      },
    ]
    render(
      <TestCasePanel
        testCases={[{ input: 'x', expected: 'y' }]}
        results={resultsWithNullTime}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    // Time and Memory labels should not appear
    expect(screen.queryByText(/Time:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Memory:/)).not.toBeInTheDocument()
  })

  it('shows the pass ratio badge in the Results tab trigger when results exist', () => {
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={MIXED_RESULTS}
        isRunning={false}
      />,
    )
    // 1 out of 2 passed → "1/2"
    const trigger = screen.getByRole('tab', { name: /results/i })
    expect(trigger).toHaveTextContent('1/2')
  })

  it('shows a green pass-ratio badge when all results pass', () => {
    const { container } = render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    // Find the badge span inside the Results trigger
    const badge = container.querySelector('.bg-emerald-800')
    expect(badge).toBeInTheDocument()
  })

  it('shows a red pass-ratio badge when some results fail', () => {
    const { container } = render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={MIXED_RESULTS}
        isRunning={false}
      />,
    )
    const badge = container.querySelector('.bg-red-800')
    expect(badge).toBeInTheDocument()
  })

  it('renders "Actual Output" label for each result', async () => {
    const user = userEvent.setup()
    render(
      <TestCasePanel
        testCases={TEST_CASES}
        results={PASSING_RESULTS}
        isRunning={false}
      />,
    )
    await user.click(screen.getByRole('tab', { name: /results/i }))
    const labels = screen.getAllByText('Actual Output')
    expect(labels).toHaveLength(PASSING_RESULTS.length)
  })
})
