import { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

const GUEST_USER_ID = 'guest'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') ?? GUEST_USER_ID

    // ── Solved counts by difficulty ────────────────────────────────────────────
    const solvedProgress = await db.userProgress.findMany({
      where: { userId, solved: true },
      include: { problem: { select: { difficulty: true, category: true } } },
    })

    const totalSolved = solvedProgress.length
    const easySolved = solvedProgress.filter((p) => p.problem.difficulty === 'EASY').length
    const mediumSolved = solvedProgress.filter((p) => p.problem.difficulty === 'MEDIUM').length
    const hardSolved = solvedProgress.filter((p) => p.problem.difficulty === 'HARD').length

    // ── Category stats ─────────────────────────────────────────────────────────
    const allProblems = await db.problem.groupBy({
      by: ['category'],
      _count: { id: true },
    })

    const solvedByCategory = solvedProgress.reduce<Record<string, number>>((acc, p) => {
      const cat = p.problem.category
      acc[cat] = (acc[cat] ?? 0) + 1
      return acc
    }, {})

    const categoryStats = allProblems.map((row) => ({
      category: row.category,
      solved: solvedByCategory[row.category] ?? 0,
      total: row._count.id,
    }))

    // ── Recent submissions ─────────────────────────────────────────────────────
    const recentSubmissions = await db.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    })

    const formattedSubmissions = recentSubmissions.map((s) => ({
      id: s.id,
      problemTitle: s.problem.title,
      problemSlug: s.problem.slug,
      difficulty: s.problem.difficulty,
      language: s.language,
      status: s.status,
      runtime: s.runtime,
      memory: s.memory,
      createdAt: s.createdAt.toISOString(),
    }))

    // ── Streak calculation ─────────────────────────────────────────────────────
    const allAccepted = await db.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    const uniqueDays = [
      ...new Set(allAccepted.map((s) => s.createdAt.toISOString().split('T')[0])),
    ].sort((a, b) => b.localeCompare(a))

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Current streak: consecutive days ending today or yesterday
    if (uniqueDays.length > 0) {
      const startFromToday = uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr
      if (startFromToday) {
        currentStreak = 1
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = new Date(uniqueDays[i - 1])
          const curr = new Date(uniqueDays[i])
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // Longest streak
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

    // ── Recommended problems: unsolved mediums ─────────────────────────────────
    const solvedProblemIds = solvedProgress.map((p) => p.problemId)

    const recommended = await db.problem.findMany({
      where: {
        difficulty: 'MEDIUM',
        id: { notIn: solvedProblemIds.length > 0 ? solvedProblemIds : ['__none__'] },
      },
      take: 3,
      select: { id: true, title: true, slug: true, difficulty: true, category: true },
    })

    return Response.json({
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      categoryStats,
      recentSubmissions: formattedSubmissions,
      streak: { current: currentStreak, longest: longestStreak },
      recommended,
    })
  } catch (error) {
    console.error('[/api/stats] Error:', error)
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
