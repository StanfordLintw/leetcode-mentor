/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import {
  FAKE_HINT,
  FAKE_CODE_REVIEW,
  FAKE_WHITEBOARD_FEEDBACK,
  FAKE_STUDY_PLAN,
} from '../__mocks__/claude'

// jest.mock is hoisted above const declarations, so we declare the factory with
// inline jest.fn() calls and resolve references with jest.mocked() after imports.
jest.mock('@/lib/claude', () => ({
  getHint: jest.fn(),
  reviewCode: jest.fn(),
  evaluateWhiteboardExplanation: jest.fn(),
  generateStudyPlan: jest.fn(),
  askInterviewQuestion: jest.fn(),
  askInterviewQuestionStream: jest.fn(),
  explainConcept: jest.fn(),
  explainConceptStream: jest.fn(),
}))

import { POST as postHint } from '@/app/api/ai/hint/route'
import { POST as postReview } from '@/app/api/ai/review/route'
import { POST as postWhiteboard } from '@/app/api/ai/whiteboard/route'
import { POST as postStudyPlan } from '@/app/api/ai/study-plan/route'
import * as claude from '@/lib/claude'

const mockGetHint = jest.mocked(claude.getHint)
const mockReviewCode = jest.mocked(claude.reviewCode)
const mockEvaluateWhiteboardExplanation = jest.mocked(claude.evaluateWhiteboardExplanation)
const mockGenerateStudyPlan = jest.mocked(claude.generateStudyPlan)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── POST /api/ai/hint ────────────────────────────────────────────────────────

describe('POST /api/ai/hint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHint.mockResolvedValue(FAKE_HINT)
  })

  it('returns { hint: string } for a valid request', async () => {
    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      hintLevel: 1,
      code: '',
    })

    const response = await postHint(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('hint')
    expect(typeof data.hint).toBe('string')
    expect(data.hint).toBe(FAKE_HINT)
  })

  it('calls getHint with the correct arguments', async () => {
    const body = {
      problemId: 'two-sum',
      hintLevel: 2 as 1 | 2 | 3,
      code: 'def twoSum(): pass',
    }

    const request = makeRequest('/api/ai/hint', body)
    await postHint(request)

    expect(mockGetHint).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'two-sum' }),
      2,
      'def twoSum(): pass'
    )
  })

  it('uses provided problem context when supplied', async () => {
    const problem = {
      id: 'two-sum',
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'EASY',
      category: 'ARRAY',
      description: 'Find two numbers that add up to target.',
    }

    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      hintLevel: 1,
      code: '',
      problem,
    })

    await postHint(request)

    expect(mockGetHint).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Two Sum', difficulty: 'EASY' }),
      1,
      ''
    )
  })

  it('returns 400 when hintLevel is missing', async () => {
    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      code: 'pass',
    })

    const response = await postHint(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when hintLevel is out of range (0)', async () => {
    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      hintLevel: 0,
      code: 'pass',
    })

    const response = await postHint(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/hintLevel/i)
  })

  it('returns 400 when hintLevel is out of range (4)', async () => {
    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      hintLevel: 4,
      code: 'pass',
    })

    const response = await postHint(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/hintLevel/i)
  })

  it('returns 500 when getHint throws', async () => {
    mockGetHint.mockRejectedValue(new Error('Claude CLI crashed'))

    const request = makeRequest('/api/ai/hint', {
      problemId: 'two-sum',
      hintLevel: 1,
      code: '',
    })

    const response = await postHint(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })
})

// ─── POST /api/ai/review ─────────────────────────────────────────────────────

describe('POST /api/ai/review', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReviewCode.mockResolvedValue(FAKE_CODE_REVIEW)
  })

  it('returns the CodeReview shape for a valid request', async () => {
    const request = makeRequest('/api/ai/review', {
      problemId: 'two-sum',
      code: 'def twoSum(nums, target): pass',
      language: 'python',
    })

    const response = await postReview(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      score: expect.any(Number),
      timeComplexity: expect.any(String),
      spaceComplexity: expect.any(String),
      feedback: expect.any(String),
      improvements: expect.any(Array),
      isOptimal: expect.any(Boolean),
    })
  })

  it('returns the exact mock review data', async () => {
    const request = makeRequest('/api/ai/review', {
      problemId: 'two-sum',
      code: 'solution here',
      language: 'python',
    })

    const response = await postReview(request)
    const data = await response.json()

    expect(data.score).toBe(FAKE_CODE_REVIEW.score)
    expect(data.timeComplexity).toBe(FAKE_CODE_REVIEW.timeComplexity)
    expect(data.spaceComplexity).toBe(FAKE_CODE_REVIEW.spaceComplexity)
    expect(data.isOptimal).toBe(FAKE_CODE_REVIEW.isOptimal)
  })

  it('calls reviewCode with correct arguments', async () => {
    const body = {
      problemId: 'two-sum',
      code: 'my solution',
      language: 'javascript',
    }

    const request = makeRequest('/api/ai/review', body)
    await postReview(request)

    expect(mockReviewCode).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'two-sum' }),
      'my solution',
      'javascript'
    )
  })

  it('returns 400 when code is missing', async () => {
    const request = makeRequest('/api/ai/review', {
      problemId: 'two-sum',
      language: 'python',
    })

    const response = await postReview(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when language is missing', async () => {
    const request = makeRequest('/api/ai/review', {
      problemId: 'two-sum',
      code: 'pass',
    })

    const response = await postReview(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 500 when reviewCode throws', async () => {
    mockReviewCode.mockRejectedValue(new Error('Claude unavailable'))

    const request = makeRequest('/api/ai/review', {
      problemId: 'two-sum',
      code: 'pass',
      language: 'python',
    })

    const response = await postReview(request)
    expect(response.status).toBe(500)
  })
})

// ─── POST /api/ai/whiteboard ──────────────────────────────────────────────────

describe('POST /api/ai/whiteboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEvaluateWhiteboardExplanation.mockResolvedValue(FAKE_WHITEBOARD_FEEDBACK)
  })

  it('returns the WhiteboardFeedback shape for a valid request', async () => {
    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
      explanation:
        'I would use a hash map to store each number and its index. For each number, I check if its complement exists in the map. If yes, return both indices. Otherwise, add the number to the map.',
    })

    const response = await postWhiteboard(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      score: expect.any(Number),
      correctApproach: expect.any(Boolean),
      feedback: expect.any(String),
      missingPoints: expect.any(Array),
      suggestions: expect.any(Array),
    })
  })

  it('returns the exact mock whiteboard feedback', async () => {
    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
      explanation: 'Use two pointers to find the pair that sums to the target value.',
    })

    const response = await postWhiteboard(request)
    const data = await response.json()

    expect(data.score).toBe(FAKE_WHITEBOARD_FEEDBACK.score)
    expect(data.correctApproach).toBe(FAKE_WHITEBOARD_FEEDBACK.correctApproach)
    expect(data.missingPoints).toEqual(FAKE_WHITEBOARD_FEEDBACK.missingPoints)
    expect(data.suggestions).toEqual(FAKE_WHITEBOARD_FEEDBACK.suggestions)
  })

  it('calls evaluateWhiteboardExplanation with correct arguments', async () => {
    const explanation = 'I would iterate through the array and use a hash set to check complements.'

    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
      explanation,
    })

    await postWhiteboard(request)

    expect(mockEvaluateWhiteboardExplanation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'two-sum' }),
      explanation
    )
  })

  it('returns 400 when explanation is missing', async () => {
    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
    })

    const response = await postWhiteboard(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when explanation is too short (less than 10 chars)', async () => {
    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
      explanation: 'short',
    })

    const response = await postWhiteboard(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 500 when evaluateWhiteboardExplanation throws', async () => {
    mockEvaluateWhiteboardExplanation.mockRejectedValue(new Error('Claude error'))

    const request = makeRequest('/api/ai/whiteboard', {
      problemId: 'two-sum',
      explanation: 'I would use a hash map to track visited numbers and their indices.',
    })

    const response = await postWhiteboard(request)
    expect(response.status).toBe(500)
  })
})

// ─── POST /api/ai/study-plan ──────────────────────────────────────────────────

describe('POST /api/ai/study-plan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateStudyPlan.mockResolvedValue(FAKE_STUDY_PLAN)
  })

  const VALID_STUDY_PLAN_BODY = {
    weakCategories: ['DYNAMIC_PROGRAMMING', 'GRAPH'],
    targetDays: 14,
    currentLevel: 'intermediate',
  }

  it('returns an array of StudyPlanItem for a valid request', async () => {
    const request = makeRequest('/api/ai/study-plan', VALID_STUDY_PLAN_BODY)
    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('each StudyPlanItem has the expected shape', async () => {
    const request = makeRequest('/api/ai/study-plan', VALID_STUDY_PLAN_BODY)
    const response = await postStudyPlan(request)
    const data = await response.json()

    for (const item of data) {
      expect(item).toMatchObject({
        day: expect.any(Number),
        problemSlugs: expect.any(Array),
        focus: expect.any(String),
        goal: expect.any(String),
      })
    }
  })

  it('calls generateStudyPlan with correct arguments', async () => {
    const request = makeRequest('/api/ai/study-plan', VALID_STUDY_PLAN_BODY)
    await postStudyPlan(request)

    expect(mockGenerateStudyPlan).toHaveBeenCalledWith(
      ['DYNAMIC_PROGRAMMING', 'GRAPH'],
      14,
      'intermediate'
    )
  })

  it('returns 400 when weakCategories is empty', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      ...VALID_STUDY_PLAN_BODY,
      weakCategories: [],
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
    expect(data.error).toMatch(/weakCategories/i)
  })

  it('returns 400 when weakCategories is missing', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      targetDays: 7,
      currentLevel: 'beginner',
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when targetDays is 0', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      ...VALID_STUDY_PLAN_BODY,
      targetDays: 0,
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/targetDays/i)
  })

  it('returns 400 when targetDays exceeds 365', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      ...VALID_STUDY_PLAN_BODY,
      targetDays: 366,
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/targetDays/i)
  })

  it('returns 400 when currentLevel is invalid', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      ...VALID_STUDY_PLAN_BODY,
      currentLevel: 'expert',
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/currentLevel/i)
  })

  it('returns 400 when currentLevel is missing', async () => {
    const request = makeRequest('/api/ai/study-plan', {
      weakCategories: ['ARRAY'],
      targetDays: 7,
    })

    const response = await postStudyPlan(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('accepts all valid currentLevel values', async () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      jest.clearAllMocks()
      mockGenerateStudyPlan.mockResolvedValue(FAKE_STUDY_PLAN)

      const request = makeRequest('/api/ai/study-plan', {
        ...VALID_STUDY_PLAN_BODY,
        currentLevel: level,
      })

      const response = await postStudyPlan(request)
      expect(response.status).toBe(200)
    }
  })

  it('returns 500 when generateStudyPlan throws', async () => {
    mockGenerateStudyPlan.mockRejectedValue(new Error('Failed to parse study plan'))

    const request = makeRequest('/api/ai/study-plan', VALID_STUDY_PLAN_BODY)
    const response = await postStudyPlan(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
