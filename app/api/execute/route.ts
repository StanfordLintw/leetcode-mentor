import type { NextRequest } from 'next/server'
import { runTests } from '@/lib/judge0'
import type { TestCase, TestResult } from '@/lib/judge0'

interface ExecuteRequestBody {
  code: string
  language: string
  testCases: TestCase[]
}

interface ExecuteResponseBody {
  results: TestResult[]
}

interface ErrorResponseBody {
  error: string
}

export async function POST(
  request: NextRequest
): Promise<Response> {
  let body: ExecuteRequestBody

  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON in request body.' } satisfies ErrorResponseBody,
      { status: 400 }
    )
  }

  const { code, language, testCases } = body

  if (typeof code !== 'string' || !code.trim()) {
    return Response.json(
      { error: 'Missing or empty "code" field.' } satisfies ErrorResponseBody,
      { status: 400 }
    )
  }

  if (typeof language !== 'string' || !language.trim()) {
    return Response.json(
      { error: 'Missing or empty "language" field.' } satisfies ErrorResponseBody,
      { status: 400 }
    )
  }

  if (!Array.isArray(testCases)) {
    return Response.json(
      { error: '"testCases" must be an array.' } satisfies ErrorResponseBody,
      { status: 400 }
    )
  }

  // Validate each test case has the expected shape
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    if (
      typeof tc?.input !== 'string' ||
      typeof tc?.expected !== 'string'
    ) {
      return Response.json(
        {
          error: `testCases[${i}] must have "input" (string) and "expected" (string) fields.`,
        } satisfies ErrorResponseBody,
        { status: 400 }
      )
    }
  }

  try {
    const results = await runTests(code, language, testCases)
    return Response.json({ results } satisfies ExecuteResponseBody)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred.'
    console.error('[/api/execute] Judge0 error:', error)
    return Response.json(
      { error: message } satisfies ErrorResponseBody,
      { status: 502 }
    )
  }
}
