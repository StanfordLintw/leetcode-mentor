/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { prisma } from '../__mocks__/prisma'

jest.mock('@/lib/db', () => ({ prisma }))

import { POST as postSubmission, GET as getSubmissions } from '@/app/api/submissions/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/submissions')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

const GUEST_USER_DB = {
  id: 'user-guest-id',
  email: 'guest@leetcode-mentor.local',
  name: 'Guest',
}

const SUBMISSION_STUB = {
  id: 'sub-001',
  userId: 'user-guest-id',
  problemId: 'clprob001',
  code: 'def twoSum(nums, target): pass',
  language: 'python',
  status: 'ACCEPTED',
  runtime: null,
  memory: null,
  createdAt: new Date('2024-06-01T12:00:00.000Z'),
  problem: {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'EASY',
  },
}

// ─── POST /api/submissions ────────────────────────────────────────────────────

describe('POST /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a submission with valid data and returns 201', async () => {
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue(GUEST_USER_DB)
    ;(prisma.submission.create as jest.Mock).mockResolvedValue(SUBMISSION_STUB)

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'def twoSum(nums, target): pass',
      language: 'python',
      status: 'ACCEPTED',
    })

    const response = await postSubmission(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toMatchObject({
      id: expect.any(String),
      code: expect.any(String),
      language: 'python',
      status: 'ACCEPTED',
    })
  })

  it('returns the created submission with problem info', async () => {
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue(GUEST_USER_DB)
    ;(prisma.submission.create as jest.Mock).mockResolvedValue(SUBMISSION_STUB)

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'solution code here',
      language: 'javascript',
    })

    const response = await postSubmission(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.problem).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      difficulty: expect.stringMatching(/^(EASY|MEDIUM|HARD)$/),
    })
  })

  it('returns 400 when problemId is missing', async () => {
    const request = makePostRequest({ code: 'pass', language: 'python' })
    const response = await postSubmission(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when code is missing', async () => {
    const request = makePostRequest({ problemId: 'clprob001', language: 'python' })
    const response = await postSubmission(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when language is missing', async () => {
    const request = makePostRequest({ problemId: 'clprob001', code: 'pass' })
    const response = await postSubmission(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })

  it('upserts guest user when userId is guest', async () => {
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue(GUEST_USER_DB)
    ;(prisma.submission.create as jest.Mock).mockResolvedValue(SUBMISSION_STUB)

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'pass',
      language: 'python',
      userId: 'guest',
    })

    await postSubmission(request)

    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'guest@leetcode-mentor.local' },
        create: expect.objectContaining({ email: 'guest@leetcode-mentor.local' }),
      })
    )
  })

  it('uses provided userId and does not upsert guest', async () => {
    ;(prisma.submission.create as jest.Mock).mockResolvedValue({
      ...SUBMISSION_STUB,
      userId: 'user-123',
    })

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'pass',
      language: 'python',
      userId: 'user-123',
    })

    await postSubmission(request)

    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })

  it('defaults status to WRONG_ANSWER when not provided', async () => {
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue(GUEST_USER_DB)
    ;(prisma.submission.create as jest.Mock).mockResolvedValue(SUBMISSION_STUB)

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'pass',
      language: 'python',
    })

    await postSubmission(request)

    expect(prisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'WRONG_ANSWER' }),
      })
    )
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.user.upsert as jest.Mock).mockResolvedValue(GUEST_USER_DB)
    ;(prisma.submission.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = makePostRequest({
      problemId: 'clprob001',
      code: 'pass',
      language: 'python',
    })

    const response = await postSubmission(request)
    expect(response.status).toBe(500)
  })
})

// ─── GET /api/submissions ─────────────────────────────────────────────────────

describe('GET /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a list of submissions', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockResolvedValue([SUBMISSION_STUB])

    const request = makeGetRequest()
    const response = await getSubmissions(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
  })

  it('includes problem info in each submission', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockResolvedValue([SUBMISSION_STUB])

    const request = makeGetRequest()
    const response = await getSubmissions(request)
    const data = await response.json()

    expect(data[0]).toHaveProperty('problem')
    expect(data[0].problem).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      difficulty: expect.any(String),
    })
  })

  it('filters by userId when provided', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockResolvedValue([SUBMISSION_STUB])

    const request = makeGetRequest({ userId: 'user-123' })
    await getSubmissions(request)

    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-123' }),
      })
    )
  })

  it('filters by problemId when provided', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockResolvedValue([SUBMISSION_STUB])

    const request = makeGetRequest({ problemId: 'clprob001' })
    await getSubmissions(request)

    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ problemId: 'clprob001' }),
      })
    )
  })

  it('returns empty array when no submissions found', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockResolvedValue([])

    const request = makeGetRequest({ userId: 'no-such-user' })
    const response = await getSubmissions(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = makeGetRequest()
    const response = await getSubmissions(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
