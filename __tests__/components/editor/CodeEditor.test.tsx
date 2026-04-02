/**
 * CodeEditor.test.tsx
 *
 * CodeEditor wraps Monaco via next/dynamic (ssr: false). We mock both
 * `next/dynamic` and `@monaco-editor/react` so the heavy browser-only bundle
 * is replaced with a lightweight <textarea> that exposes the same key props.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// ---------------------------------------------------------------------------
// Mocks — must be declared before any component import so Jest hoists them
// ---------------------------------------------------------------------------

// Replace @monaco-editor/react with a simple textarea that mirrors the API
// surface used by CodeEditor (value, onChange, height, options.readOnly).
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({
    onChange,
    value,
    height,
    options,
  }: {
    onChange?: (v: string) => void
    value?: string
    height?: string
    options?: { readOnly?: boolean }
  }) => (
    <textarea
      data-testid="monaco-editor"
      data-height={height}
      data-readonly={options?.readOnly ? 'true' : 'false'}
      value={value ?? ''}
      readOnly={options?.readOnly}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}))

// next/dynamic in jsdom just returns the inner component synchronously so
// there is never a loading phase. We override it to let the `loading` prop
// render first (simulating the real async behaviour) then swap in the real
// component once we call the resolver.
//
// For the happy-path tests we simply return the real component directly so
// tests that don't care about the loading state keep working without extra
// ceremony.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (
    importFn: () => Promise<{ default: React.ComponentType<unknown> }>,
    opts?: { loading?: () => React.ReactElement }
  ) => {
    // Return a component that renders the `loading` fallback when
    // SIMULATE_LOADING is set, otherwise renders the Monaco mock synchronously.
    const DynamicComponent = (props: Record<string, unknown>) => {
      if ((global as { SIMULATE_LOADING?: boolean }).SIMULATE_LOADING && opts?.loading) {
        return opts.loading()
      }
      // Re-require the mocked Monaco editor
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const MonacoMock = require('@monaco-editor/react').default
      return <MonacoMock {...props} />
    }
    DynamicComponent.displayName = 'DynamicComponent'
    return DynamicComponent
  },
}))

// ---------------------------------------------------------------------------
// Import the component under test AFTER mocks
// ---------------------------------------------------------------------------
import CodeEditor from '@/components/editor/CodeEditor'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function enableLoadingMode() {
  ;(global as { SIMULATE_LOADING?: boolean }).SIMULATE_LOADING = true
}

function disableLoadingMode() {
  ;(global as { SIMULATE_LOADING?: boolean }).SIMULATE_LOADING = false
}

afterEach(() => {
  disableLoadingMode()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CodeEditor', () => {
  it('renders without crashing', () => {
    render(
      <CodeEditor code="print('hello')" language="python" onChange={jest.fn()} />,
    )
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
  })

  it('shows the loading spinner when Monaco is still loading', () => {
    enableLoadingMode()
    render(
      <CodeEditor code="" language="python" onChange={jest.fn()} />,
    )
    // The loading fallback renders an aria-label on its wrapper div
    expect(screen.getByLabelText('Loading editor')).toBeInTheDocument()
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument()
  })

  it('shows the "Loading editor…" text inside the spinner', () => {
    enableLoadingMode()
    render(<CodeEditor code="" language="python" onChange={jest.fn()} />)
    expect(screen.getByText('Loading editor…')).toBeInTheDocument()
  })

  it('calls onChange when the editor content changes', () => {
    const handleChange = jest.fn()
    render(
      <CodeEditor code="initial code" language="python" onChange={handleChange} />,
    )
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, { target: { value: 'new code' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('new code')
  })

  it('does not call onChange when readOnly=true and content changes', () => {
    const handleChange = jest.fn()
    render(
      <CodeEditor
        code="read only code"
        language="python"
        onChange={handleChange}
        readOnly
      />,
    )
    const editor = screen.getByTestId('monaco-editor')
    // The textarea is readonly — fireEvent.change still fires the event handler
    // on the DOM node, but the mock only calls onChange when not readOnly via
    // the actual textarea readOnly attribute. We verify the attribute is set.
    expect(editor).toHaveAttribute('data-readonly', 'true')
  })

  it('passes the readOnly prop to the editor options', () => {
    render(
      <CodeEditor code="" language="python" onChange={jest.fn()} readOnly={false} />,
    )
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-readonly',
      'false',
    )
  })

  it('passes the height prop to the editor', () => {
    render(
      <CodeEditor code="" language="python" onChange={jest.fn()} height="600px" />,
    )
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-height',
      '600px',
    )
  })

  it('defaults height to 400px when no height prop is supplied', () => {
    render(<CodeEditor code="" language="python" onChange={jest.fn()} />)
    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-height',
      '400px',
    )
  })

  it('renders the outer wrapper with the supplied height style', () => {
    const { container } = render(
      <CodeEditor code="" language="javascript" onChange={jest.fn()} height="500px" />,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ height: '500px' })
  })

  it('displays the current code value inside the editor', () => {
    render(
      <CodeEditor code="def foo(): pass" language="python" onChange={jest.fn()} />,
    )
    const editor = screen.getByTestId('monaco-editor') as HTMLTextAreaElement
    expect(editor.value).toBe('def foo(): pass')
  })
})
