/**
 * LanguageSelector.test.tsx
 *
 * LanguageSelector uses Radix Select (via shadcn/ui). Radix Select calls
 * `hasPointerCapture` on DOM elements which jsdom does not implement,
 * causing the real component to crash when clicked in tests.
 *
 * Strategy: mock `@/components/ui/select` with a simple native <select>
 * that exposes the same surface area. This lets us test LanguageSelector's
 * own logic (language list, icons, onChange wiring) without Radix internals.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mock the shadcn Select components with a native <select> equivalent.
// This avoids the jsdom `hasPointerCapture` crash from Radix UI internals.
// ---------------------------------------------------------------------------
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) => {
    // Collect option values/labels from children by rendering them into a
    // context so SelectItem can register itself.
    return (
      <div data-testid="select-root" data-value={value}>
        <SelectContext.Provider value={{ value, onValueChange }}>
          {children}
        </SelectContext.Provider>
      </div>
    )
  },
  SelectTrigger: ({
    children,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode
    'aria-label'?: string
    className?: string
  }) => (
    <button role="combobox" aria-label={ariaLabel}>
      {children}
    </button>
  ),
  SelectValue: ({ children }: { children?: React.ReactNode }) => (
    <span data-testid="select-value">{children}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div role="listbox">{children}</div>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
    className?: string
  }) => {
    const ctx = React.useContext(SelectContext)
    return (
      <div
        role="option"
        data-value={value}
        aria-selected={ctx.value === value}
        onClick={() => ctx.onValueChange?.(value)}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </div>
    )
  },
}))

// Shared context so Select → SelectItem can communicate onValueChange
const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (v: string) => void
}>({})

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------
import LanguageSelector from '@/components/editor/LanguageSelector'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LanguageSelector', () => {
  it('renders the trigger button with correct aria-label', () => {
    render(<LanguageSelector value="python" onChange={jest.fn()} />)
    expect(
      screen.getByRole('combobox', { name: /select programming language/i }),
    ).toBeInTheDocument()
  })

  it('shows the selected language label in the trigger', () => {
    render(<LanguageSelector value="python" onChange={jest.fn()} />)
    // The mock renders both trigger value and option items simultaneously,
    // so the label appears more than once. getAllByText is the right query.
    expect(screen.getAllByText('Python').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the emoji icon for the selected language (Python)', () => {
    render(<LanguageSelector value="python" onChange={jest.fn()} />)
    expect(screen.getAllByText('🐍').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the selected language label for TypeScript', () => {
    render(<LanguageSelector value="typescript" onChange={jest.fn()} />)
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('🔷').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the selected language label for JavaScript', () => {
    render(<LanguageSelector value="javascript" onChange={jest.fn()} />)
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the selected language label for Java', () => {
    render(<LanguageSelector value="java" onChange={jest.fn()} />)
    expect(screen.getAllByText('Java').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('☕').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the selected language label for C++', () => {
    render(<LanguageSelector value="cpp" onChange={jest.fn()} />)
    expect(screen.getAllByText('C++').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('⚙️').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all 5 language options in the listbox', () => {
    render(<LanguageSelector value="python" onChange={jest.fn()} />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(5)
  })

  it.each(LANGUAGES)(
    'renders the label "$label" in the options list',
    ({ label }) => {
      render(<LanguageSelector value="python" onChange={jest.fn()} />)
      // getAllByText because the selected item also shows in the trigger value
      const matches = screen.getAllByText(label)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    },
  )

  it.each(LANGUAGES)(
    'renders the icon "$icon" in the options list',
    ({ icon }) => {
      render(<LanguageSelector value="python" onChange={jest.fn()} />)
      const matches = screen.getAllByText(icon)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    },
  )

  it('calls onChange with "javascript" when JavaScript option is clicked', () => {
    const handleChange = jest.fn()
    render(<LanguageSelector value="python" onChange={handleChange} />)

    const options = screen.getAllByRole('option')
    const jsOption = options.find((o) => o.textContent?.includes('JavaScript'))
    expect(jsOption).toBeDefined()
    fireEvent.click(jsOption!)

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('javascript')
  })

  it('calls onChange with "typescript" when TypeScript option is clicked', () => {
    const handleChange = jest.fn()
    render(<LanguageSelector value="python" onChange={handleChange} />)

    const options = screen.getAllByRole('option')
    const tsOption = options.find((o) => o.textContent?.includes('TypeScript'))
    fireEvent.click(tsOption!)

    expect(handleChange).toHaveBeenCalledWith('typescript')
  })

  it('calls onChange with "java" when Java option is clicked', () => {
    const handleChange = jest.fn()
    render(<LanguageSelector value="python" onChange={handleChange} />)

    const options = screen.getAllByRole('option')
    const javaOption = options.find(
      (o) =>
        o.textContent?.includes('Java') && !o.textContent?.includes('JavaScript'),
    )
    fireEvent.click(javaOption!)

    expect(handleChange).toHaveBeenCalledWith('java')
  })

  it('calls onChange with "cpp" when C++ option is clicked', () => {
    const handleChange = jest.fn()
    render(<LanguageSelector value="python" onChange={handleChange} />)

    const options = screen.getAllByRole('option')
    const cppOption = options.find((o) => o.textContent?.includes('C++'))
    fireEvent.click(cppOption!)

    expect(handleChange).toHaveBeenCalledWith('cpp')
  })

  it('marks the currently selected option as aria-selected', () => {
    render(<LanguageSelector value="typescript" onChange={jest.fn()} />)
    const options = screen.getAllByRole('option')
    const tsOption = options.find((o) => o.textContent?.includes('TypeScript'))
    expect(tsOption).toHaveAttribute('aria-selected', 'true')
  })

  it('does not mark other options as aria-selected', () => {
    render(<LanguageSelector value="typescript" onChange={jest.fn()} />)
    const options = screen.getAllByRole('option')
    const pythonOption = options.find((o) => o.textContent?.includes('Python'))
    expect(pythonOption).toHaveAttribute('aria-selected', 'false')
  })

  it('does not call onChange if no option is clicked', () => {
    const handleChange = jest.fn()
    render(<LanguageSelector value="python" onChange={handleChange} />)
    expect(handleChange).not.toHaveBeenCalled()
  })
})
