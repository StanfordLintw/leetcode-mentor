import { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

const GUEST_USER_ID = 'guest'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') ?? GUEST_USER_ID

    // ── Submission history (last 100) ──────────────────────────────────────────
    const submissions = await db.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        problem: {
          select: { title: true, slug: true, difficulty: true, category: true },
        },
      },
    })

    const submissionHistory = submissions.map((s) => ({
      id: s.id,
      problemTitle: s.problem.title,
      problemSlug: s.problem.slug,
      difficulty: s.problem.difficulty,
      category: s.problem.category,
      language: s.language,
      status: s.status,
      runtime: s.runtime,
      memory: s.memory,
      createdAt: s.createdAt.toISOString(),
    }))

    // ── Heatmap: last 365 days ─────────────────────────────────────────────────
    const since = new Date()
    since.setDate(since.getDate() - 364)
    since.setHours(0, 0, 0, 0)

    const heatmapRaw = await db.submission.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    })

    const countByDay = heatmapRaw.reduce<Record<string, number>>((acc, s) => {
      const day = s.createdAt.toISOString().split('T')[0]
      acc[day] = (acc[day] ?? 0) + 1
      return acc
    }, {})

    const heatmapData = Object.entries(countByDay).map(([date, count]) => ({
      date,
      count,
    }))

    // ── Language distribution ──────────────────────────────────────────────────
    const languageRaw = await db.submission.groupBy({
      by: ['language'],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const languageStats = languageRaw.map((row) => ({
      language: row.language,
      count: row._count.id,
    }))

    // ── Difficulty breakdown ───────────────────────────────────────────────────
    const solvedProgress = await db.userProgress.findMany({
      where: { userId, solved: true },
      include: { problem: { select: { difficulty: true } } },
    })

    const difficultyBreakdown = {
      EASY: solvedProgress.filter((p) => p.problem.difficulty === 'EASY').length,
      MEDIUM: solvedProgress.filter((p) => p.problem.difficulty === 'MEDIUM').length,
      HARD: solvedProgress.filter((p) => p.problem.difficulty === 'HARD').length,
    }

    // ── Category breakdown (solved) ────────────────────────────────────────────
    const solvedWithCategory = await db.userProgress.findMany({
      where: { userId, solved: true },
      include: { problem: { select: { category: true } } },
    })

    const categoryMap = solvedWithCategory.reduce<Record<string, number>>((acc, p) => {
      const cat = p.problem.category
      acc[cat] = (acc[cat] ?? 0) + 1
      return acc
    }, {})

    const categoryStats = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }))

    // ── Habit tracker ──────────────────────────────────────────────────────────
    const allAccepted = await db.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const uniqueDays = [
      ...new Set(allAccepted.map((s) => s.createdAt.toISOString().split('T')[0])),
    ].sort((a, b) => b.localeCompare(a))

    const daysPracticed = uniqueDays.length

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (uniqueDays.length > 0) {
      const startFromToday = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr
      if (startFromToday) {
        currentStreak = 1
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1])
          const curr = new Date(uniqueDays[i])
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
          if (diffDays === 1) currentStreak++
          else break
        }
      }
    }

    for (let i = 0; i < uniqueDays.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prev = new Date(uniqueDays[i - 1])
        const curr = new Date(uniqueDays[i])
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    return Response.json({
      heatmapData,
      languageStats,
      submissionHistory,
      difficultyBreakdown,
      categoryStats,
      habitTracker: {
        daysPracticed,
        currentStreak,
        longestStreak,
      },
    })
  } catch (error) {
    console.error('[/api/stats/detailed] Error:', error)
    return Response.json(
      { error: 'Failed to fetch detailed stats' },
      { status: 500 }
    )
  }
}
