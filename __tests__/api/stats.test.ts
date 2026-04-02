/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { prisma } from '../__mocks__/prisma'

jest.mock('@/lib/db', () => ({ prisma }))

import { GET as getStats } from '@/app/api/stats/route'
import { GET as getDetailedStats } from '@/app/api/stats/detailed/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(path: string, params: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

// Shared stubs
const ACCEPTED_SUBMISSION_STUB = {
  id: 'sub-001',
  userId: 'guest',
  problemId: 'clprob001',
  code: 'pass',
  language: 'python',
  status: 'ACCEPTED',
  runtime: 42,
  memory: 16000,
  createdAt: new Date('2024-06-01T12:00:00.000Z'),
  problem: { title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY' },
}

const WRONG_SUBMISSION_STUB = {
  ...ACCEPTED_SUBMISSION_STUB,
  id: 'sub-002',
  status: 'WRONG_ANSWER',
  createdAt: new Date('2024-05-30T08:00:00.000Z'),
  problem: { title: 'Add Two Numbers', slug: 'add-two-numbers', difficulty: 'MEDIUM' },
}

const SOLVED_EASY_PROGRESS = {
  problemId: 'clprob001',
  userId: 'guest',
  solved: true,
  problem: { difficulty: 'EASY', category: 'ARRAY' },
}

const SOLVED_MEDIUM_PROGRESS = {
  problemId: 'clprob002',
  userId: 'guest',
  solved: true,
  problem: { difficulty: 'MEDIUM', category: 'DYNAMIC_PROGRAMMING' },
}

const SOLVED_HARD_PROGRESS = {
  problemId: 'clprob003',
  userId: 'guest',
  solved: true,
  problem: { difficulty: 'HARD', category: 'GRAPH' },
}

// ─── GET /api/stats ───────────────────────────────────────────────────────────

describe('GET /api/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function setupDefaultMocks() {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([
      SOLVED_EASY_PROGRESS,
      SOLVED_MEDIUM_PROGRESS,
      SOLVED_HARD_PROGRESS,
    ])
    ;(prisma.problem.groupBy as jest.Mock).mockResolvedValue([
      { category: 'ARRAY', _count: { id: 5 } },
      { category: 'DYNAMIC_PROGRAMMING', _count: { id: 3 } },
      { category: 'GRAPH', _count: { id: 2 } },
    ])
    ;(prisma.submission.findMany as jest.Mock)
      // First call: recentSubmissions
      .mockResolvedValueOnce([ACCEPTED_SUBMISSION_STUB, WRONG_SUBMISSION_STUB])
      // Second call: allAccepted for streak
      .mockResolvedValueOnce([ACCEPTED_SUBMISSION_STUB])
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])
  }

  it('returns correct shape with all required top-level fields', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('totalSolved')
    expect(data).toHaveProperty('easySolved')
    expect(data).toHaveProperty('mediumSolved')
    expect(data).toHaveProperty('hardSolved')
    expect(data).toHaveProperty('categoryStats')
    expect(data).toHaveProperty('recentSubmissions')
    expect(data).toHaveProperty('streak')
  })

  it('returns correct totalSolved count', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(data.totalSolved).toBe(3)
  })

  it('returns correct per-difficulty solved counts', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(data.easySolved).toBe(1)
    expect(data.mediumSolved).toBe(1)
    expect(data.hardSolved).toBe(1)
  })

  it('streak has current and longest fields', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(data.streak).toHaveProperty('current')
    expect(data.streak).toHaveProperty('longest')
    expect(typeof data.streak.current).toBe('number')
    expect(typeof data.streak.longest).toBe('number')
  })

  it('categoryStats is an array with category, solved, total per entry', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(Array.isArray(data.categoryStats)).toBe(true)
    expect(data.categoryStats.length).toBeGreaterThan(0)

    for (const stat of data.categoryStats) {
      expect(stat).toHaveProperty('category')
      expect(stat).toHaveProperty('solved')
      expect(stat).toHaveProperty('total')
      expect(typeof stat.category).toBe('string')
      expect(typeof stat.solved).toBe('number')
      expect(typeof stat.total).toBe('number')
    }
  })

  it('categoryStats correctly counts solved per category', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    const arrayStats = data.categoryStats.find((s: { category: string }) => s.category === 'ARRAY')
    expect(arrayStats).toBeDefined()
    expect(arrayStats.solved).toBe(1)
    expect(arrayStats.total).toBe(5)
  })

  it('recentSubmissions is an array of formatted submissions', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(Array.isArray(data.recentSubmissions)).toBe(true)
    for (const sub of data.recentSubmissions) {
      expect(sub).toHaveProperty('id')
      expect(sub).toHaveProperty('problemTitle')
      expect(sub).toHaveProperty('problemSlug')
      expect(sub).toHaveProperty('difficulty')
      expect(sub).toHaveProperty('language')
      expect(sub).toHaveProperty('status')
      expect(sub).toHaveProperty('createdAt')
      expect(typeof sub.createdAt).toBe('string')
    }
  })

  it('returns zero totals when user has no solved problems', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.problem.groupBy as jest.Mock).mockResolvedValue([
      { category: 'ARRAY', _count: { id: 10 } },
    ])
    ;(prisma.submission.findMany as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.problem.findMany as jest.Mock).mockResolvedValue([])

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)
    const data = await response.json()

    expect(data.totalSolved).toBe(0)
    expect(data.easySolved).toBe(0)
    expect(data.mediumSolved).toBe(0)
    expect(data.hardSolved).toBe(0)
    expect(data.streak.current).toBe(0)
    expect(data.streak.longest).toBe(0)
  })

  it('uses guest userId when no userId param is provided', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats')
    await getStats(request)

    expect(prisma.userProgress.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'guest' }) })
    )
  })

  it('uses the provided userId param', async () => {
    setupDefaultMocks()

    const request = makeGetRequest('/api/stats', { userId: 'user-abc' })
    await getStats(request)

    expect(prisma.userProgress.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-abc' }) })
    )
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.userProgress.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = makeGetRequest('/api/stats')
    const response = await getStats(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})

// ─── GET /api/stats/detailed ──────────────────────────────────────────────────

describe('GET /api/stats/detailed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function setupDetailedMocks() {
    const submissionsWithCategory = [
      {
        ...ACCEPTED_SUBMISSION_STUB,
        createdAt: new Date('2024-06-01T12:00:00.000Z'),
        problem: {
          title: 'Two Sum',
          slug: 'two-sum',
          difficulty: 'EASY',
          category: 'ARRAY',
        },
      },
    ]

    // submission.findMany is called 3 times:
    // 1. submissionHistory (last 100)
    // 2. heatmapRaw (last 365 days)
    // 3. allAccepted (for streak)
    ;(prisma.submission.findMany as jest.Mock)
      .mockResolvedValueOnce(submissionsWithCategory)
      .mockResolvedValueOnce([
        { createdAt: new Date('2024-06-01T12:00:00.000Z') },
        { createdAt: new Date('2024-06-01T18:00:00.000Z') },
        { createdAt: new Date('2024-05-31T09:00:00.000Z') },
      ])
      .mockResolvedValueOnce([{ createdAt: new Date('2024-06-01T12:00:00.000Z') }])

    ;(prisma.submission.groupBy as jest.Mock).mockResolvedValue([
      { language: 'python', _count: { id: 10 } },
      { language: 'javascript', _count: { id: 5 } },
    ])

    // userProgress.findMany is called twice (difficultyBreakdown, categoryBreakdown)
    ;(prisma.userProgress.findMany as jest.Mock)
      .mockResolvedValueOnce([SOLVED_EASY_PROGRESS, SOLVED_MEDIUM_PROGRESS])
      .mockResolvedValueOnce([SOLVED_EASY_PROGRESS, SOLVED_MEDIUM_PROGRESS])
  }

  it('returns 200 with all required top-level fields', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('heatmapData')
    expect(data).toHaveProperty('languageStats')
    expect(data).toHaveProperty('submissionHistory')
    expect(data).toHaveProperty('difficultyBreakdown')
    expect(data).toHaveProperty('categoryStats')
    expect(data).toHaveProperty('habitTracker')
  })

  it('heatmapData is an array of { date, count } objects', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    expect(Array.isArray(data.heatmapData)).toBe(true)
    for (const entry of data.heatmapData) {
      expect(entry).toHaveProperty('date')
      expect(entry).toHaveProperty('count')
      expect(typeof entry.date).toBe('string')
      expect(typeof entry.count).toBe('number')
      // date should be ISO date format YYYY-MM-DD
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('heatmapData aggregates multiple submissions on the same day', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    // Two submissions on 2024-06-01 should aggregate to count 2
    const juneFirst = data.heatmapData.find((d: { date: string }) => d.date === '2024-06-01')
    expect(juneFirst).toBeDefined()
    expect(juneFirst.count).toBe(2)
  })

  it('languageStats is an array of { language, count } objects', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    expect(Array.isArray(data.languageStats)).toBe(true)
    for (const stat of data.languageStats) {
      expect(stat).toHaveProperty('language')
      expect(stat).toHaveProperty('count')
      expect(typeof stat.language).toBe('string')
      expect(typeof stat.count).toBe('number')
    }
  })

  it('languageStats maps groupBy results correctly', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    const pythonStat = data.languageStats.find((s: { language: string }) => s.language === 'python')
    expect(pythonStat).toBeDefined()
    expect(pythonStat.count).toBe(10)
  })

  it('submissionHistory is an array of formatted submissions', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    expect(Array.isArray(data.submissionHistory)).toBe(true)
    for (const sub of data.submissionHistory) {
      expect(sub).toHaveProperty('id')
      expect(sub).toHaveProperty('problemTitle')
      expect(sub).toHaveProperty('problemSlug')
      expect(sub).toHaveProperty('difficulty')
      expect(sub).toHaveProperty('category')
      expect(sub).toHaveProperty('language')
      expect(sub).toHaveProperty('status')
      expect(sub).toHaveProperty('createdAt')
      expect(typeof sub.createdAt).toBe('string')
    }
  })

  it('habitTracker has daysPracticed, currentStreak, and longestStreak', async () => {
    setupDetailedMocks()

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)
    const data = await response.json()

    expect(data.habitTracker).toHaveProperty('daysPracticed')
    expect(data.habitTracker).toHaveProperty('currentStreak')
    expect(data.habitTracker).toHaveProperty('longestStreak')
    expect(typeof data.habitTracker.daysPracticed).toBe('number')
    expect(typeof data.habitTracker.currentStreak).toBe('number')
    expect(typeof data.habitTracker.longestStreak).toBe('number')
  })

  it('returns 500 when database throws', async () => {
    ;(prisma.submission.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = makeGetRequest('/api/stats/detailed')
    const response = await getDetailedStats(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
