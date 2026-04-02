/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { prisma } from '../__mocks__/prisma'

// Mock @/lib/db before importing route handlers
jest.mock('@/lib/db', () => ({ prisma }))

// Import route handlers after mocks are set up
import { GET as getProblems } from '@/app/api/problems/route'
import { GET as getProblemBySlug } from '@/app/api/problems/[slug]/route'
import { GET as getRandomProblem } from '@/app/api/problems/random/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

const PROBLEM_STUB = {
  id: 'clprob001',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'EASY',
  category: 'ARRAY',
  tags: ['array', 'hash-table'],
  leetcodeId: 1,
}

const FULL_PROBLEM_STUB = {
  ...PROBLEM_STUB,
  description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  examples: [],
  constraints: ['2 <= nums.length <= 10^4'],
  hints: [],
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

// ─── GET /api/problems ────────────────────────────────────────────────────────

describe('GET /api/problems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a paginated problem list with correct shape', async () => {
    const problems = [PROBLEM_STUB]
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue(problems)
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(1)

    const request = makeGetRequest('/api/problems')
    const response = await getProblems(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      problems,
      total: 1,
      page: 1,
      totalPages: 1,
    })
  })

  it('filters by difficulty EASY', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([PROBLEM_STUB])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(1)

    const request = makeGetRequest('/api/problems', { difficulty: 'EASY' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    expect(prisma.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficulty: 'EASY' }),
      })
    )
  })

  it('filters by difficulty MEDIUM', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(0)

    const request = makeGetRequest('/api/problems', { difficulty: 'MEDIUM' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    expect(prisma.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficulty: 'MEDIUM' }),
      })
    )
  })

  it('filters by difficulty HARD', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(0)

    const request = makeGetRequest('/api/problems', { difficulty: 'HARD' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    expect(prisma.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ difficulty: 'HARD' }),
      })
    )
  })

  it('does not add difficulty filter when difficulty=ALL', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([PROBLEM_STUB])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(1)

    const request = makeGetRequest('/api/problems', { difficulty: 'ALL' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    const call = (prisma.problem.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where).not.toHaveProperty('difficulty')
  })

  it('filters by category', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([PROBLEM_STUB])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(1)

    const request = makeGetRequest('/api/problems', { category: 'ARRAY' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    expect(prisma.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'ARRAY' }),
      })
    )
  })

  it('does not add category filter when category=ALL', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(0)

    const request = makeGetRequest('/api/problems', { category: 'ALL' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    const call = (prisma.problem.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where).not.toHaveProperty('category')
  })

  it('filters by search query with OR clause', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([PROBLEM_STUB])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(1)

    const request = makeGetRequest('/api/problems', { search: 'two sum' })
    const response = await getProblems(request)

    expect(response.status).toBe(200)
    const call = (prisma.problem.findMany as jest.Mock).mock.calls[0][0]
    expect(call.where).toHaveProperty('OR')
    expect(call.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: expect.objectContaining({ contains: 'two sum' }) }),
        expect.objectContaining({ tags: expect.objectContaining({ has: 'two sum' }) }),
      ])
    )
  })

  it('handles empty results gracefully', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(0)

    const request = makeGetRequest('/api/problems', { search: 'nonexistent-xyz' })
    const response = await getProblems(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      problems: [],
      total: 0,
      page: 1,
      totalPages: 0,
    })
  })

  it('respects page and limit parameters', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(50)

    const request = makeGetRequest('/api/problems', { page: '3', limit: '10' })
    const response = await getProblems(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(3)
    expect(data.totalPages).toBe(5)
    expect(prisma.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.problem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    ;(prisma.problem.count as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = makeGetRequest('/api/problems')
    const response = await getProblems(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})

// ─── GET /api/problems/[slug] ─────────────────────────────────────────────────

describe('GET /api/problems/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function makeSlugRequest(slug: string): [NextRequest, { params: Promise<{ slug: string }> }] {
    const url = `http://localhost/api/problems/${slug}`
    const request = new NextRequest(url)
    const context = { params: Promise.resolve({ slug }) }
    return [request, context]
  }

  it('returns a problem by slug', async () => {
    ;(prisma.problem.findUnique as jest.Mock).mockResolvedValue(FULL_PROBLEM_STUB)

    const [request, context] = makeSlugRequest('two-sum')
    const response = await getProblemBySlug(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.slug).toBe('two-sum')
    expect(data.title).toBe('Two Sum')
    expect(prisma.problem.findUnique).toHaveBeenCalledWith({ where: { slug: 'two-sum' } })
  })

  it('returns 404 when slug not found', async () => {
    ;(prisma.problem.findUnique as jest.Mock).mockResolvedValue(null)

    const [request, context] = makeSlugRequest('does-not-exist')
    const response = await getProblemBySlug(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error', 'Problem not found')
  })

  it('returns full problem data shape', async () => {
    ;(prisma.problem.findUnique as jest.Mock).mockResolvedValue(FULL_PROBLEM_STUB)

    const [request, context] = makeSlugRequest('two-sum')
    const response = await getProblemBySlug(request, context)
    const data = await response.json()

    expect(data).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      slug: expect.any(String),
      difficulty: expect.stringMatching(/^(EASY|MEDIUM|HARD)$/),
      category: expect.any(String),
    })
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.problem.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const [request, context] = makeSlugRequest('two-sum')
    const response = await getProblemBySlug(request, context)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})

// ─── GET /api/problems/random ─────────────────────────────────────────────────

describe('GET /api/problems/random', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a random problem', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(10)
    ;(prisma.problem.findFirst as jest.Mock).mockResolvedValue(PROBLEM_STUB)

    const request = makeGetRequest('/api/problems/random')
    const response = await getRandomProblem(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('problem')
    expect(data.problem).toMatchObject({
      id: expect.any(String),
      slug: expect.any(String),
      title: expect.any(String),
      difficulty: expect.any(String),
      category: expect.any(String),
    })
  })

  it('respects the difficulty filter', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(5)
    ;(prisma.problem.findFirst as jest.Mock).mockResolvedValue({ ...PROBLEM_STUB, difficulty: 'HARD' })

    const request = makeGetRequest('/api/problems/random', { difficulty: 'hard' })
    const response = await getRandomProblem(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.problem.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ difficulty: 'HARD' }) })
    )
    expect(data.problem.difficulty).toBe('HARD')
  })

  it('excludes already-solved problems', async () => {
    const solved = [{ problemId: 'clprob001' }]
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue(solved)
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(9)
    ;(prisma.problem.findFirst as jest.Mock).mockResolvedValue({ ...PROBLEM_STUB, id: 'clprob002' })

    const request = makeGetRequest('/api/problems/random')
    const response = await getRandomProblem(request)

    expect(response.status).toBe(200)
    expect(prisma.problem.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { notIn: ['clprob001'] } }),
      })
    )
  })

  it('returns 404 when no problems match', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.count as jest.Mock).mockResolvedValue(0)

    const request = makeGetRequest('/api/problems/random', { difficulty: 'HARD' })
    const response = await getRandomProblem(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error')
  })

  it('returns 400 for invalid difficulty', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([])

    const request = makeGetRequest('/api/problems/random', { difficulty: 'EXTREME' })
    const response = await getRandomProblem(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty('error')
  })
})
