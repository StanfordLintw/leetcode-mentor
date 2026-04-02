/**
 * @jest-environment node
 */

import { EventEmitter } from 'events'
import { spawn } from 'child_process'
import {
  getHint,
  reviewCode,
  evaluateWhiteboardExplanation,
  generateStudyPlan,
  explainConcept,
  explainConceptStream,
  ProblemContext,
} from '@/lib/claude'

// ---------------------------------------------------------------------------
// Mock child_process
// ---------------------------------------------------------------------------

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}))

const mockedSpawn = spawn as jest.MockedFunction<typeof spawn>

// ---------------------------------------------------------------------------
// Helper — create a mock child process
// ---------------------------------------------------------------------------

interface MockChildProcess {
  stdin: { write: jest.Mock; end: jest.Mock }
  stdout: EventEmitter
  stderr: EventEmitter
  emit: (event: string, ...args: unknown[]) => boolean
  on: (event: string, listener: (...args: unknown[]) => void) => MockChildProcess
  _eventHandlers: Record<string, ((...args: unknown[]) => void)[]>
}

function mockSpawn(stdout: string, exitCode = 0): MockChildProcess {
  const stdoutEmitter = new EventEmitter()
  const stderrEmitter = new EventEmitter()
  const processEmitter = new EventEmitter()

  const stdinMock = {
    write: jest.fn(),
    end: jest.fn(),
  }

  const child = {
    stdin: stdinMock,
    stdout: stdoutEmitter,
    stderr: stderrEmitter,
    emit: processEmitter.emit.bind(processEmitter),
    on: processEmitter.on.bind(processEmitter),
    _eventHandlers: {} as Record<string, ((...args: unknown[]) => void)[]>,
  }

  // Schedule async emission so the promise has time to set up listeners
  setImmediate(() => {
    stdoutEmitter.emit('data', Buffer.from(stdout, 'utf8'))
    processEmitter.emit('close', exitCode)
  })

  return child as unknown as MockChildProcess
}

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const PROBLEM: ProblemContext = {
  id: '1',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'EASY',
  category: 'Array',
  description: 'Given an array of integers nums and an integer target, return indices of two numbers that add up to target.',
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
  tags: ['array', 'hash-table'],
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getHint
// ---------------------------------------------------------------------------

describe('getHint()', () => {
  it('spawns claude with correct CLI flags', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('Here is your hint.') as never)

    await getHint(PROBLEM, 1, '')

    expect(mockedSpawn).toHaveBeenCalledWith(
      'claude',
      ['-p', '--output-format', 'text'],
      expect.any(Object)
    )
  })

  it('writes the prompt to stdin (not as a CLI arg)', async () => {
    const child = mockSpawn('hint text')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, '')

    expect(child.stdin.write).toHaveBeenCalled()
    const writtenContent = child.stdin.write.mock.calls[0][0] as string
    expect(typeof writtenContent).toBe('string')
    expect(writtenContent.length).toBeGreaterThan(0)
  })

  it('calls stdin.end() after writing', async () => {
    const child = mockSpawn('hint text')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, '')

    expect(child.stdin.end).toHaveBeenCalled()
  })

  it('returns the hint text from stdout', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('Use a hash map.') as never)

    const result = await getHint(PROBLEM, 1, '')

    expect(result).toBe('Use a hash map.')
  })

  it('trims leading/trailing whitespace from the output', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('  \n  hint with spaces  \n  ') as never)

    const result = await getHint(PROBLEM, 1, '')

    expect(result).toBe('hint with spaces')
  })

  it('hint level 1 prompt contains "hint level 1"', async () => {
    const child = mockSpawn('gentle nudge')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, '')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('hint level 1')
  })

  it('hint level 2 prompt contains "hint level 2"', async () => {
    const child = mockSpawn('specific hint')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 2, '')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('hint level 2')
  })

  it('hint level 3 prompt contains "hint level 3"', async () => {
    const child = mockSpawn('concrete hint')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 3, '')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('hint level 3')
  })

  it('includes the problem title in the prompt', async () => {
    const child = mockSpawn('hint')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, '')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('Two Sum')
  })

  it('includes current code in the prompt when provided', async () => {
    const child = mockSpawn('hint')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, 'def twoSum(): pass')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('def twoSum(): pass')
  })

  it('indicates no code written when currentCode is empty', async () => {
    const child = mockSpawn('hint')
    mockedSpawn.mockReturnValueOnce(child as never)

    await getHint(PROBLEM, 1, '')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('not written any code')
  })

  it('rejects when spawn exits with non-zero code', async () => {
    const stdoutEmitter = new EventEmitter()
    const stderrEmitter = new EventEmitter()
    const processEmitter = new EventEmitter()

    const child = {
      stdin: { write: jest.fn(), end: jest.fn() },
      stdout: stdoutEmitter,
      stderr: stderrEmitter,
      on: processEmitter.on.bind(processEmitter),
    }

    mockedSpawn.mockReturnValueOnce(child as never)

    setImmediate(() => {
      stderrEmitter.emit('data', Buffer.from('something went wrong', 'utf8'))
      processEmitter.emit('close', 1)
    })

    await expect(getHint(PROBLEM, 1, '')).rejects.toThrow('Claude CLI exited with code 1')
  })
})

// ---------------------------------------------------------------------------
// reviewCode
// ---------------------------------------------------------------------------

describe('reviewCode()', () => {
  const validReview = {
    score: 85,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    feedback: 'Good solution using hash map.',
    improvements: ['Consider edge case with empty array'],
    isOptimal: true,
  }

  it('returns parsed CodeReview JSON from stdout', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn(JSON.stringify(validReview)) as never)

    const result = await reviewCode(PROBLEM, 'def twoSum(): pass', 'python')

    expect(result.score).toBe(85)
    expect(result.timeComplexity).toBe('O(n)')
    expect(result.spaceComplexity).toBe('O(n)')
    expect(result.feedback).toBe('Good solution using hash map.')
    expect(result.improvements).toEqual(['Consider edge case with empty array'])
    expect(result.isOptimal).toBe(true)
  })

  it('strips markdown code fences before parsing JSON', async () => {
    const withFences = '```json\n' + JSON.stringify(validReview) + '\n```'
    mockedSpawn.mockReturnValueOnce(mockSpawn(withFences) as never)

    const result = await reviewCode(PROBLEM, 'code', 'python')

    expect(result.score).toBe(85)
  })

  it('strips plain code fences (no language specifier) before parsing', async () => {
    const withFences = '```\n' + JSON.stringify(validReview) + '\n```'
    mockedSpawn.mockReturnValueOnce(mockSpawn(withFences) as never)

    const result = await reviewCode(PROBLEM, 'code', 'python')

    expect(result.score).toBe(85)
  })

  it('returns fallback CodeReview when JSON parsing fails', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('This is not JSON at all.') as never)

    const result = await reviewCode(PROBLEM, 'code', 'python')

    expect(result.score).toBe(0)
    expect(result.timeComplexity).toBe('Unknown')
    expect(result.spaceComplexity).toBe('Unknown')
    expect(result.feedback).toBe('This is not JSON at all.')
    expect(result.improvements).toEqual([])
    expect(result.isOptimal).toBe(false)
  })

  it('includes the submitted code in the prompt', async () => {
    const child = mockSpawn(JSON.stringify(validReview))
    mockedSpawn.mockReturnValueOnce(child as never)

    await reviewCode(PROBLEM, 'def solution(): return []', 'python')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('def solution(): return []')
  })

  it('includes the language in the prompt', async () => {
    const child = mockSpawn(JSON.stringify(validReview))
    mockedSpawn.mockReturnValueOnce(child as never)

    await reviewCode(PROBLEM, 'code', 'typescript')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('typescript')
  })
})

// ---------------------------------------------------------------------------
// evaluateWhiteboardExplanation
// ---------------------------------------------------------------------------

describe('evaluateWhiteboardExplanation()', () => {
  const validFeedback = {
    score: 75,
    correctApproach: true,
    feedback: 'Good explanation overall.',
    missingPoints: ['Forgot to mention edge cases'],
    suggestions: ['Walk through a concrete example'],
  }

  it('returns parsed WhiteboardFeedback JSON from stdout', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn(JSON.stringify(validFeedback)) as never)

    const result = await evaluateWhiteboardExplanation(
      PROBLEM,
      'I would use a hash map to store seen values.'
    )

    expect(result.score).toBe(75)
    expect(result.correctApproach).toBe(true)
    expect(result.feedback).toBe('Good explanation overall.')
    expect(result.missingPoints).toEqual(['Forgot to mention edge cases'])
    expect(result.suggestions).toEqual(['Walk through a concrete example'])
  })

  it('includes the explanation in the prompt', async () => {
    const child = mockSpawn(JSON.stringify(validFeedback))
    mockedSpawn.mockReturnValueOnce(child as never)

    await evaluateWhiteboardExplanation(PROBLEM, 'My approach is to iterate once.')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('My approach is to iterate once.')
  })

  it('returns fallback WhiteboardFeedback on JSON parse failure', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('Not valid JSON response') as never)

    const result = await evaluateWhiteboardExplanation(PROBLEM, 'some explanation')

    expect(result.score).toBe(0)
    expect(result.correctApproach).toBe(false)
    expect(result.feedback).toBe('Not valid JSON response')
    expect(result.missingPoints).toEqual([])
    expect(result.suggestions).toEqual([])
  })

  it('strips markdown fences before parsing JSON', async () => {
    const withFences = '```json\n' + JSON.stringify(validFeedback) + '\n```'
    mockedSpawn.mockReturnValueOnce(mockSpawn(withFences) as never)

    const result = await evaluateWhiteboardExplanation(PROBLEM, 'explanation')

    expect(result.score).toBe(75)
  })
})

// ---------------------------------------------------------------------------
// generateStudyPlan
// ---------------------------------------------------------------------------

describe('generateStudyPlan()', () => {
  const validPlan = [
    {
      day: 1,
      problemSlugs: ['two-sum', 'contains-duplicate'],
      focus: 'Hash Maps',
      goal: 'Understand O(n) lookup with hash maps',
    },
    {
      day: 2,
      problemSlugs: ['valid-anagram'],
      focus: 'String Hashing',
      goal: 'Apply hash maps to string problems',
    },
  ]

  it('returns parsed StudyPlanItem[] from stdout', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn(JSON.stringify(validPlan)) as never)

    const result = await generateStudyPlan(['arrays', 'hash-maps'], 7, 'beginner')

    expect(result).toHaveLength(2)
    expect(result[0].day).toBe(1)
    expect(result[0].problemSlugs).toEqual(['two-sum', 'contains-duplicate'])
    expect(result[0].focus).toBe('Hash Maps')
    expect(result[0].goal).toBe('Understand O(n) lookup with hash maps')
  })

  it('includes weakCategories in the prompt', async () => {
    const child = mockSpawn(JSON.stringify(validPlan))
    mockedSpawn.mockReturnValueOnce(child as never)

    await generateStudyPlan(['arrays', 'dynamic-programming'], 7, 'intermediate')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('arrays')
    expect(prompt).toContain('dynamic-programming')
  })

  it('includes targetDays in the prompt', async () => {
    const child = mockSpawn(JSON.stringify(validPlan))
    mockedSpawn.mockReturnValueOnce(child as never)

    await generateStudyPlan(['trees'], 14, 'beginner')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('14')
  })

  it('throws an error (does not use fallback) when JSON parsing fails', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('Not valid JSON') as never)

    await expect(
      generateStudyPlan(['arrays'], 7, 'beginner')
    ).rejects.toThrow('Failed to parse study plan')
  })

  it('strips markdown fences before parsing', async () => {
    const withFences = '```json\n' + JSON.stringify(validPlan) + '\n```'
    mockedSpawn.mockReturnValueOnce(mockSpawn(withFences) as never)

    const result = await generateStudyPlan(['arrays'], 7, 'beginner')

    expect(result).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// explainConcept
// ---------------------------------------------------------------------------

describe('explainConcept()', () => {
  it('returns the explanation text from stdout', async () => {
    mockedSpawn.mockReturnValueOnce(
      mockSpawn('# Binary Search\n\nBinary search is an efficient algorithm...') as never
    )

    const result = await explainConcept('Binary Search', 'beginner')

    expect(result).toBe('# Binary Search\n\nBinary search is an efficient algorithm...')
  })

  it('includes the concept name in the prompt', async () => {
    const child = mockSpawn('explanation text')
    mockedSpawn.mockReturnValueOnce(child as never)

    await explainConcept('Dynamic Programming', 'intermediate')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('Dynamic Programming')
  })

  it('includes level-appropriate guidance in the prompt for beginner', async () => {
    const child = mockSpawn('explanation')
    mockedSpawn.mockReturnValueOnce(child as never)

    await explainConcept('Hash Maps', 'beginner')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('beginner')
  })

  it('includes level-appropriate guidance in the prompt for intermediate', async () => {
    const child = mockSpawn('explanation')
    mockedSpawn.mockReturnValueOnce(child as never)

    await explainConcept('Hash Maps', 'intermediate')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('intermediate')
  })

  it('includes level-appropriate guidance in the prompt for advanced', async () => {
    const child = mockSpawn('explanation')
    mockedSpawn.mockReturnValueOnce(child as never)

    await explainConcept('Hash Maps', 'advanced')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt.toLowerCase()).toContain('advanced')
  })

  it('spawns claude with the correct CLI flags', async () => {
    mockedSpawn.mockReturnValueOnce(mockSpawn('explanation') as never)

    await explainConcept('Graphs', 'advanced')

    expect(mockedSpawn).toHaveBeenCalledWith(
      'claude',
      ['-p', '--output-format', 'text'],
      expect.any(Object)
    )
  })
})

// ---------------------------------------------------------------------------
// explainConceptStream (tests streamClaude indirectly)
// ---------------------------------------------------------------------------

describe('explainConceptStream()', () => {
  function makeStreamSpawn(jsonLines: string[]): MockChildProcess {
    const stdoutEmitter = new EventEmitter()
    const stderrEmitter = new EventEmitter()
    const processEmitter = new EventEmitter()

    const child = {
      stdin: { write: jest.fn(), end: jest.fn() },
      stdout: stdoutEmitter,
      stderr: stderrEmitter,
      on: processEmitter.on.bind(processEmitter),
    }

    setImmediate(() => {
      for (const line of jsonLines) {
        stdoutEmitter.emit('data', Buffer.from(line + '\n', 'utf8'))
      }
      processEmitter.emit('close', 0)
    })

    return child as unknown as MockChildProcess
  }

  async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
    const decoder = new TextDecoder()
    const reader = stream.getReader()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value)
    }
    return result
  }

  it('returns a ReadableStream', () => {
    const streamLines = [
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }),
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')

    expect(stream).toBeInstanceOf(ReadableStream)
  })

  it('stream emits text deltas parsed from stream-json JSONL', async () => {
    const streamLines = [
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }),
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } }),
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')
    const result = await collectStream(stream)

    expect(result).toBe('Hello world')
  })

  it('skips events that are not content_block_delta type', async () => {
    const streamLines = [
      JSON.stringify({ type: 'message_start', message: { id: 'msg_1' } }),
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Real text' } }),
      JSON.stringify({ type: 'message_stop' }),
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')
    const result = await collectStream(stream)

    expect(result).toBe('Real text')
  })

  it('handles malformed JSON lines gracefully — skips them without error', async () => {
    const streamLines = [
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Before' } }),
      'this is { not valid json',
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: ' After' } }),
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')
    const result = await collectStream(stream)

    expect(result).toBe('Before After')
  })

  it('handles empty lines gracefully — skips blank lines', async () => {
    const streamLines = [
      '',
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Content' } }),
      '',
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')
    const result = await collectStream(stream)

    expect(result).toBe('Content')
  })

  it('spawns claude with --output-format stream-json flag', () => {
    const streamLines: string[] = []
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    explainConceptStream('Graphs', 'beginner')

    expect(mockedSpawn).toHaveBeenCalledWith(
      'claude',
      ['-p', '--output-format', 'stream-json'],
      expect.any(Object)
    )
  })

  it('includes concept name in the streaming prompt', () => {
    const streamLines: string[] = []
    const child = makeStreamSpawn(streamLines)
    mockedSpawn.mockReturnValueOnce(child as never)

    explainConceptStream('Linked Lists', 'beginner')

    const prompt = child.stdin.write.mock.calls[0][0] as string
    expect(prompt).toContain('Linked Lists')
  })

  it('stream closes after all data is consumed', async () => {
    const streamLines = [
      JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Done' } }),
    ]
    mockedSpawn.mockReturnValueOnce(makeStreamSpawn(streamLines) as never)

    const stream = explainConceptStream('Graphs', 'beginner')
    const reader = stream.getReader()

    const chunks: string[] = []
    const decoder = new TextDecoder()

    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (result.value) {
        chunks.push(decoder.decode(result.value))
      }
    }

    expect(chunks.join('')).toBe('Done')
  })
})
