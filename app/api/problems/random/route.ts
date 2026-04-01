import { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const difficulty = searchParams.get('difficulty')?.toUpperCase()
    const userId = searchParams.get('userId') ?? 'guest'

    if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return Response.json(
        { error: 'Invalid difficulty. Must be EASY, MEDIUM, or HARD.' },
        { status: 400 }
      )
    }

    // Get problems the user has already solved
    const solved = await db.userProgress.findMany({
      where: { userId, solved: true },
      select: { problemId: true },
    })
    const solvedIds = solved.map((s) => s.problemId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...(difficulty ? { difficulty } : {}),
      ...(solvedIds.length > 0 ? { id: { notIn: solvedIds } } : {}),
    }

    const count = await db.problem.count({ where })

    if (count === 0) {
      return Response.json(
        { error: 'No unsolved problems found for the given difficulty.' },
        { status: 404 }
      )
    }

    const skip = Math.floor(Math.random() * count)

    const problem = await db.problem.findFirst({
      where,
      skip,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
      },
    })

    if (!problem) {
      return Response.json({ error: 'Problem not found.' }, { status: 404 })
    }

    return Response.json({ problem })
  } catch (error) {
    console.error('[/api/problems/random] Error:', error)
    return Response.json({ error: 'Failed to fetch random problem' }, { status: 500 })
  }
}
