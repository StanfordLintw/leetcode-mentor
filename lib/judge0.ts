const JUDGE0_BASE_URL = 'https://judge0-ce.p.rapidapi.com'

const LANGUAGE_ID_MAP: Record<string, number> = {
  python: 71,
  javascript: 63,
  typescript: 74,
  java: 62,
  cpp: 54,
}

export interface Judge0Result {
  stdout: string | null
  stderr: string | null
  status: {
    id: number
    description: string
  }
  time: string | null
  memory: number | null
}

export interface TestCase {
  input: string
  expected: string
}

export interface TestResult {
  passed: boolean
  input: string
  expected: string
  actual: string
  time: string | null
  memory: number | null
}

export async function submitCode(
  code: string,
  language: string,
  stdin?: string
): Promise<Judge0Result> {
  const languageId = LANGUAGE_ID_MAP[language.toLowerCase()]
  if (languageId === undefined) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const apiKey = process.env.JUDGE0_API_KEY
  if (!apiKey) {
    throw new Error('JUDGE0_API_KEY environment variable is not set')
  }

  const response = await fetch(
    `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin ?? '',
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(
      `Judge0 API error: ${response.status} ${response.statusText} — ${errorText}`
    )
  }

  const data = await response.json()

  return {
    stdout: data.stdout ?? null,
    stderr: data.stderr ?? null,
    status: {
      id: data.status?.id ?? 0,
      description: data.status?.description ?? 'Unknown',
    },
    time: data.time ?? null,
    memory: data.memory ?? null,
  }
}

export async function runTests(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<TestResult[]> {
  const results = await Promise.all(
    testCases.map(async (testCase): Promise<TestResult> => {
      try {
        const result = await submitCode(code, language, testCase.input)

        const actual = (result.stdout ?? result.stderr ?? '').trim()
        const expected = testCase.expected.trim()
        const passed =
          result.status.id === 3 /* Accepted */ && actual === expected

        return {
          passed,
          input: testCase.input,
          expected: testCase.expected,
          actual,
          time: result.time,
          memory: result.memory,
        }
      } catch (error) {
        return {
          passed: false,
          input: testCase.input,
          expected: testCase.expected,
          actual:
            error instanceof Error
              ? `Error: ${error.message}`
              : 'Unknown error',
          time: null,
          memory: null,
        }
      }
    })
  )

  return results
}
