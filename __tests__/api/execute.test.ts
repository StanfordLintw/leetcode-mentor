/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { FAKE_TEST_RESULTS } from '../__mocks__/judge0'

// Mock @/lib/judge0 before importing the route.
// jest.mock is hoisted, so we cannot reference const variables in the factory —
// use jest.fn() inline and obtain the ref via jest.mocked() after import.
jest.mock('@/lib/judge0', () => ({
  runTests: jest.fn(),
  submitCode: jest.fn(),
}))

import { POST as postExecute } from '@/app/api/execute/route'
import * as judge0 from '@/lib/judge0'

const mockRunTests = jest.mocked(judge0.runTests)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  code: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i',
  language: 'python',
  testCases: [
    { input: '[2,7,11,15]\n9', expected: '[0,1]' },
    { input: '[3,2,4]\n6', expected: '[1,2]' },
  ],
}

// ─── POST /api/execute ────────────────────────────────────────────────────────

describe('POST /api/execute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunTests.mockResolvedValue(FAKE_TEST_RESULTS)
  })

  it('calls runTests with the correct code, language, and testCases', async () => {
    const request = makeRequest(VALID_BODY)
    await postExecute(request)

    expect(mockRunTests).toHaveBeenCalledWith(
      VALID_BODY.code,
      VALID_BODY.language,
      VALID_BODY.testCases
    )
  })

  it('returns 200 with a results array', async () => {
    const request = makeRequest(VALID_BODY)
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('results')
    expect(Array.isArray(data.results)).toBe(true)
  })

  it('each result has the expected shape', async () => {
    const request = makeRequest(VALID_BODY)
    const response = await postExecute(request)
    const data = await response.json()

    for (const result of data.results) {
      expect(result).toMatchObject({
        passed: expect.any(Boolean),
        input: expect.any(String),
        expected: expect.any(String),
        actual: expect.any(String),
      })
      // time and memory can be null or their respective types
      expect(['string', 'object']).toContain(typeof result.time)
      expect(['number', 'object']).toContain(typeof result.memory)
    }
  })

  it('returns 400 when code is missing', async () => {
    const request = makeRequest({ language: 'python', testCases: [] })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when code is an empty string', async () => {
    const request = makeRequest({ code: '   ', language: 'python', testCases: [] })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/code/i)
  })

  it('returns 400 when language is missing', async () => {
    const request = makeRequest({ code: 'pass', testCases: [] })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when language is an empty string', async () => {
    const request = makeRequest({ code: 'pass', language: '', testCases: [] })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/language/i)
  })

  it('returns 400 when testCases is not an array', async () => {
    const request = makeRequest({ code: 'pass', language: 'python', testCases: 'bad' })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/testCases/i)
  })

  it('returns 400 when a test case is missing the input field', async () => {
    const request = makeRequest({
      code: 'pass',
      language: 'python',
      testCases: [{ expected: '[0,1]' }],
    })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when a test case is missing the expected field', async () => {
    const request = makeRequest({
      code: 'pass',
      language: 'python',
      testCases: [{ input: '[2,7]\n9' }],
    })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json {{',
    })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 502 when Judge0 throws an error', async () => {
    mockRunTests.mockRejectedValue(new Error('Judge0 API error: 503 Service Unavailable'))

    const request = makeRequest(VALID_BODY)
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data).toHaveProperty('error')
    expect(typeof data.error).toBe('string')
  })

  it('includes the Judge0 error message in the 502 response', async () => {
    const errorMessage = 'Judge0 API error: quota exceeded'
    mockRunTests.mockRejectedValue(new Error(errorMessage))

    const request = makeRequest(VALID_BODY)
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(502)
    expect(data.error).toBe(errorMessage)
  })

  it('handles empty testCases array gracefully', async () => {
    mockRunTests.mockResolvedValue([])

    const request = makeRequest({ ...VALID_BODY, testCases: [] })
    const response = await postExecute(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toEqual([])
  })
})
