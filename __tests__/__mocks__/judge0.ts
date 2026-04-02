import type { TestCase, TestResult, Judge0Result } from '@/lib/judge0'

export const FAKE_TEST_RESULTS: TestResult[] = [
  {
    passed: true,
    input: '[2,7,11,15]\n9',
    expected: '[0,1]',
    actual: '[0,1]',
    time: '0.042',
    memory: 9216,
  },
  {
    passed: false,
    input: '[3,2,4]\n6',
    expected: '[1,2]',
    actual: '[0,2]',
    time: '0.038',
    memory: 9100,
  },
]

export const FAKE_JUDGE0_RESULT: Judge0Result = {
  stdout: '[0,1]\n',
  stderr: null,
  status: { id: 3, description: 'Accepted' },
  time: '0.042',
  memory: 9216,
}

export const runTests = jest.fn().mockResolvedValue(FAKE_TEST_RESULTS)

export const submitCode = jest.fn().mockResolvedValue(FAKE_JUDGE0_RESULT)

export type { TestCase, TestResult, Judge0Result }
