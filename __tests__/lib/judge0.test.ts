/**
 * @jest-environment node
 */

import { submitCode, runTests, Judge0Result, TestCase } from '@/lib/judge0'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response
}

const VALID_JUDGE0_RESULT = {
  stdout: '42\n',
  stderr: null,
  status: { id: 3, description: 'Accepted' },
  time: '0.005',
  memory: 1024,
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const originalEnv = process.env

beforeEach(() => {
  jest.resetAllMocks()
  process.env = { ...originalEnv, JUDGE0_API_KEY: 'test-api-key' }
  global.fetch = jest.fn()
})

afterAll(() => {
  process.env = originalEnv
})

// ---------------------------------------------------------------------------
// submitCode
// ---------------------------------------------------------------------------

describe('submitCode()', () => {
  describe('endpoint and headers', () => {
    it('calls the correct Judge0 submissions endpoint', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      expect(url).toContain('https://judge0-ce.p.rapidapi.com/submissions')
    })

    it('uses wait=true and base64_encoded=false query params', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      expect(url).toContain('wait=true')
      expect(url).toContain('base64_encoded=false')
    })

    it('sends POST method', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe('POST')
    })

    it('includes X-RapidAPI-Key header from environment variable', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers['X-RapidAPI-Key']).toBe('test-api-key')
    })

    it('includes X-RapidAPI-Host header', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers['X-RapidAPI-Host']).toBe('judge0-ce.p.rapidapi.com')
    })

    it('includes Content-Type: application/json header', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('language ID mapping', () => {
    const cases: Array<[string, number]> = [
      ['python', 71],
      ['javascript', 63],
      ['typescript', 74],
      ['java', 62],
      ['cpp', 54],
    ]

    test.each(cases)('maps %s → language_id %d', async (lang, expectedId) => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('code', lang)

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string)
      expect(body.language_id).toBe(expectedId)
    })

    it('is case-insensitive for language names', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'Python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string)
      expect(body.language_id).toBe(71)
    })

    it('throws for an unsupported language', async () => {
      await expect(submitCode('code', 'brainfuck')).rejects.toThrow(
        'Unsupported language: brainfuck'
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('request body', () => {
    it('sends source_code in the body', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print("hello")', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string)
      expect(body.source_code).toBe('print("hello")')
    })

    it('sends stdin when provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('import sys; print(sys.stdin.read())', 'python', '5\n3\n')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string)
      expect(body.stdin).toBe('5\n3\n')
    })

    it('sends empty string stdin when not provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      await submitCode('print(42)', 'python')

      const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(init.body as string)
      expect(body.stdin).toBe('')
    })
  })

  describe('response parsing', () => {
    it('returns a Judge0Result with stdout, stderr, status, time, memory', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(VALID_JUDGE0_RESULT)
      )

      const result = await submitCode('print(42)', 'python')

      expect(result.stdout).toBe('42\n')
      expect(result.stderr).toBeNull()
      expect(result.status.id).toBe(3)
      expect(result.status.description).toBe('Accepted')
      expect(result.time).toBe('0.005')
      expect(result.memory).toBe(1024)
    })

    it('coerces missing fields to null', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse({ status: { id: 6, description: 'Compilation Error' } })
      )

      const result = await submitCode('bad code', 'python')

      expect(result.stdout).toBeNull()
      expect(result.stderr).toBeNull()
      expect(result.time).toBeNull()
      expect(result.memory).toBeNull()
    })

    it('handles missing status object gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse({ stdout: 'ok\n' })
      )

      const result = await submitCode('print("ok")', 'python')

      expect(result.status.id).toBe(0)
      expect(result.status.description).toBe('Unknown')
    })
  })

  describe('error handling', () => {
    it('throws when JUDGE0_API_KEY is not set', async () => {
      delete process.env.JUDGE0_API_KEY

      await expect(submitCode('print(42)', 'python')).rejects.toThrow(
        'JUDGE0_API_KEY environment variable is not set'
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('throws when the API returns a non-ok HTTP status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse({ message: 'rate limited' }, false, 429)
      )

      await expect(submitCode('print(42)', 'python')).rejects.toThrow(
        'Judge0 API error: 429'
      )
    })

    it('throws on network/fetch error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

      await expect(submitCode('print(42)', 'python')).rejects.toThrow('Network failure')
    })
  })
})

// ---------------------------------------------------------------------------
// runTests
// ---------------------------------------------------------------------------

describe('runTests()', () => {
  const testCases: TestCase[] = [
    { input: '2\n3\n', expected: '5' },
    { input: '10\n20\n', expected: '30' },
  ]

  it('returns an array of the same length as the input testCases', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' })
    )

    const results = await runTests('code', 'python', testCases)

    expect(results).toHaveLength(testCases.length)
  })

  it('calls fetch (submitCode) once per test case', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' })
    )

    await runTests('code', 'python', testCases)

    expect(global.fetch).toHaveBeenCalledTimes(testCases.length)
  })

  it('marks result as passed when status id is 3 and stdout matches expected (trimmed)', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' }))
      .mockResolvedValueOnce(makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '30\n' }))

    const results = await runTests('code', 'python', testCases)

    expect(results[0].passed).toBe(true)
    expect(results[1].passed).toBe(true)
  })

  it('marks result as passed: false when status id is not 3 (e.g., TLE)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({
        stdout: '5\n',
        stderr: null,
        status: { id: 5, description: 'Time Limit Exceeded' },
        time: '5.000',
        memory: 4096,
      })
    )

    const results = await runTests('code', 'python', [testCases[0]])

    expect(results[0].passed).toBe(false)
  })

  it('marks result as passed: false when stdout does not match expected', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '99\n' })
    )

    const results = await runTests('code', 'python', [testCases[0]])

    expect(results[0].passed).toBe(false)
  })

  it('trims whitespace when comparing stdout to expected', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '  5  \n' })
    )

    const results = await runTests('code', 'python', [{ input: '', expected: '5' }])

    expect(results[0].passed).toBe(true)
  })

  it('returns actual output from stdout', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '42\n' })
    )

    const results = await runTests('code', 'python', [{ input: '', expected: '99' }])

    expect(results[0].actual).toBe('42')
  })

  it('falls back to stderr for actual output when stdout is null', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({
        stdout: null,
        stderr: 'NameError: name x is not defined\n',
        status: { id: 11, description: 'Runtime Error' },
        time: null,
        memory: null,
      })
    )

    const results = await runTests('code', 'python', [{ input: '', expected: '5' }])

    expect(results[0].actual).toBe('NameError: name x is not defined')
    expect(results[0].passed).toBe(false)
  })

  it('handles test case where submitCode throws — returns passed: false with error message', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

    const results = await runTests('code', 'python', [testCases[0]])

    expect(results[0].passed).toBe(false)
    expect(results[0].actual).toContain('Error: Network failure')
    expect(results[0].time).toBeNull()
    expect(results[0].memory).toBeNull()
  })

  it('runs all test cases in parallel — all results present even if some fail', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' }))
      .mockRejectedValueOnce(new Error('timeout'))

    const results = await runTests('code', 'python', testCases)

    expect(results).toHaveLength(2)
    expect(results[0].passed).toBe(true)
    expect(results[1].passed).toBe(false)
  })

  it('preserves input and expected fields in each result', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' })
    )

    const results = await runTests('code', 'python', [testCases[0]])

    expect(results[0].input).toBe(testCases[0].input)
    expect(results[0].expected).toBe(testCases[0].expected)
  })

  it('returns time and memory fields from Judge0 result', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      makeFetchResponse({ ...VALID_JUDGE0_RESULT, stdout: '5\n' })
    )

    const results = await runTests('code', 'python', [testCases[0]])

    expect(results[0].time).toBe('0.005')
    expect(results[0].memory).toBe(1024)
  })

  it('handles empty test cases array', async () => {
    const results = await runTests('code', 'python', [])
    expect(results).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
