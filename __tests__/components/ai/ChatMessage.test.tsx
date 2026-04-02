/**
 * ChatMessage.test.tsx
 *
 * ChatMessage renders a conversation bubble for either a 'user' or 'assistant'
 * role. When isStreaming=true for an assistant message it delegates to
 * StreamingText; otherwise it renders a plain whitespace-pre-wrap div.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import ChatMessage from '@/components/ai/ChatMessage'

// ---------------------------------------------------------------------------
// Mock StreamingText so we can test ChatMessage in isolation and avoid
// setInterval side-effects in cursor blinking logic.
// ---------------------------------------------------------------------------
jest.mock('@/components/ai/StreamingText', () => ({
  __esModule: true,
  default: ({ text }: { text: string; showCursor?: boolean }) => (
    <span data-testid="streaming-text">{text}</span>
  ),
}))

// ---------------------------------------------------------------------------
// Tests — user messages
// ---------------------------------------------------------------------------
describe('ChatMessage — user role', () => {
  it('renders the message content', () => {
    render(<ChatMessage role="user" content="Hello there!" />)
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
  })

  it('renders the "You" avatar label', () => {
    render(<ChatMessage role="user" content="Hi" />)
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('positions the user message on the right (flex-row-reverse)', () => {
    const { container } = render(<ChatMessage role="user" content="Hi" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('flex-row-reverse')
  })

  it('applies blue background to the user bubble', () => {
    const { container } = render(<ChatMessage role="user" content="Hi" />)
    const bubble = container.querySelector('.bg-blue-600')
    expect(bubble).toBeInTheDocument()
  })

  it('applies blue background to the user avatar', () => {
    const { container } = render(<ChatMessage role="user" content="Hi" />)
    // The avatar div has bg-blue-600 as well
    const avatarAndBubble = container.querySelectorAll('.bg-blue-600')
    expect(avatarAndBubble.length).toBeGreaterThanOrEqual(1)
  })

  it('renders text content in a whitespace-pre-wrap div (not StreamingText)', () => {
    render(<ChatMessage role="user" content="Hello" isStreaming={true} />)
    // isStreaming is only applied for assistant messages
    expect(screen.queryByTestId('streaming-text')).not.toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('does not show the AI avatar for user messages', () => {
    render(<ChatMessage role="user" content="Hi" />)
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests — assistant messages
// ---------------------------------------------------------------------------
describe('ChatMessage — assistant role', () => {
  it('renders the message content', () => {
    render(<ChatMessage role="assistant" content="How can I help?" />)
    expect(screen.getByText('How can I help?')).toBeInTheDocument()
  })

  it('renders the "AI" avatar label', () => {
    render(<ChatMessage role="assistant" content="Hello" />)
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('positions the assistant message on the left (flex-row)', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Hello" />,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('flex-row')
    expect(wrapper.className).not.toContain('flex-row-reverse')
  })

  it('applies zinc-800 background to the assistant bubble', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Hello" />,
    )
    const bubble = container.querySelector('.bg-zinc-800')
    expect(bubble).toBeInTheDocument()
  })

  it('applies zinc-700 background to the assistant avatar', () => {
    const { container } = render(
      <ChatMessage role="assistant" content="Hello" />,
    )
    const avatar = container.querySelector('.bg-zinc-700')
    expect(avatar).toBeInTheDocument()
  })

  it('does not show the "You" avatar for assistant messages', () => {
    render(<ChatMessage role="assistant" content="Hello" />)
    expect(screen.queryByText('You')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests — streaming behaviour
// ---------------------------------------------------------------------------
describe('ChatMessage — streaming', () => {
  it('renders StreamingText when isStreaming=true for assistant', () => {
    render(
      <ChatMessage role="assistant" content="Thinking…" isStreaming={true} />,
    )
    expect(screen.getByTestId('streaming-text')).toBeInTheDocument()
  })

  it('passes the content text to StreamingText', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Streamed response"
        isStreaming={true}
      />,
    )
    expect(screen.getByTestId('streaming-text')).toHaveTextContent(
      'Streamed response',
    )
  })

  it('does not render StreamingText when isStreaming=false for assistant', () => {
    render(
      <ChatMessage
        role="assistant"
        content="Final answer"
        isStreaming={false}
      />,
    )
    expect(screen.queryByTestId('streaming-text')).not.toBeInTheDocument()
    expect(screen.getByText('Final answer')).toBeInTheDocument()
  })

  it('does not render StreamingText when isStreaming is omitted (default false)', () => {
    render(<ChatMessage role="assistant" content="Static response" />)
    expect(screen.queryByTestId('streaming-text')).not.toBeInTheDocument()
  })

  it('uses the plain div renderer for user messages even when isStreaming=true', () => {
    render(
      <ChatMessage role="user" content="User message" isStreaming={true} />,
    )
    expect(screen.queryByTestId('streaming-text')).not.toBeInTheDocument()
    expect(screen.getByText('User message')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tests — content rendering
// ---------------------------------------------------------------------------
describe('ChatMessage — content rendering', () => {
  it('renders multi-line content correctly for assistant', () => {
    const { container } = render(
      <ChatMessage role="assistant" content={'Line 1\nLine 2'} />,
    )
    // The content lives in a whitespace-pre-wrap div; check textContent directly
    const contentDiv = container.querySelector('.whitespace-pre-wrap')
    expect(contentDiv).not.toBeNull()
    expect(contentDiv!.textContent).toContain('Line 1')
    expect(contentDiv!.textContent).toContain('Line 2')
  })

  it('renders multi-line content correctly for user', () => {
    const { container } = render(
      <ChatMessage role="user" content={'Line 1\nLine 2'} />,
    )
    const contentDiv = container.querySelector('.whitespace-pre-wrap')
    expect(contentDiv).not.toBeNull()
    expect(contentDiv!.textContent).toContain('Line 1')
    expect(contentDiv!.textContent).toContain('Line 2')
  })

  it('renders empty string content without error', () => {
    expect(() =>
      render(<ChatMessage role="user" content="" />),
    ).not.toThrow()
  })
})
