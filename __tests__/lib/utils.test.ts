/**
 * @jest-environment node
 */

import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('merges multiple class name strings', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('excludes falsy conditional values', () => {
    expect(cn('base', false && 'falsy-false', null, undefined, 0 && 'zero', '')).toBe('base')
  })

  it('includes truthy conditional class names', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
  })

  it('handles object syntax — includes keys whose value is true', () => {
    expect(cn({ 'text-red': true, 'text-blue': false })).toBe('text-red')
  })

  it('handles object syntax — excludes all falsy keys', () => {
    expect(cn({ hidden: false, invisible: false })).toBe('')
  })

  it('handles object syntax — includes multiple truthy keys', () => {
    const result = cn({ 'font-bold': true, 'text-lg': true, italic: false })
    expect(result).toContain('font-bold')
    expect(result).toContain('text-lg')
    expect(result).not.toContain('italic')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles nested arrays', () => {
    expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz')
  })

  it('handles mixed input types (strings, objects, arrays)', () => {
    const result = cn('base', ['array-class'], { 'obj-class': true })
    expect(result).toContain('base')
    expect(result).toContain('array-class')
    expect(result).toContain('obj-class')
  })

  it('resolves Tailwind conflicts — later class wins for background color', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('resolves Tailwind conflicts — later class wins for text color', () => {
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500')
  })

  it('resolves Tailwind conflicts — later class wins for padding', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('resolves Tailwind conflicts across array and string inputs', () => {
    expect(cn(['bg-red-500'], 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('resolves Tailwind conflicts across object and string inputs', () => {
    expect(cn({ 'bg-red-500': true }, 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('does not drop non-conflicting classes when resolving conflicts', () => {
    const result = cn('p-2', 'font-bold', 'p-4')
    expect(result).toContain('font-bold')
    expect(result).toContain('p-4')
    expect(result).not.toContain('p-2')
  })

  it('handles a single class name string', () => {
    expect(cn('only-class')).toBe('only-class')
  })

  it('handles conditional object inside an array', () => {
    expect(cn([{ 'text-red': true, 'text-blue': false }])).toBe('text-red')
  })
})
