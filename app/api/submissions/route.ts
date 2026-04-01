import type { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      problemId,
      code,
      language,
      userId = 'guest',
      status = 'WRONG_ANSWER',
    } = body as {
      problemId: string
      code: string
      language: string
      userId?: string
      status?: string
    }

    if (!problemId || !code || !language) {
      return Response.json(
        { error: 'problemId, code, and language are required' },
        { status: 400 }
      )
    }

    // Resolve the user — create a guest record if needed
    let resolvedUserId = userId
    if (userId === 'guest') {
      const guestUser = await db.user.upsert({
        where: { email: 'guest@leetcode-mentor.local' },
        create: {
          email: 'guest@leetcode-mentor.local',
          name: 'Guest',
        },
        update: {},
      })
      resolvedUserId = guestUser.id
    }

    const submission = await db.submission.create({
      data: {
        userId: resolvedUserId,
        problemId,
        code,
        language,
        status: status as
          | 'ACCEPTED'
          | 'WRONG_ANSWER'
          | 'TIME_LIMIT'
          | 'RUNTIME_ERROR'
          | 'COMPILE_ERROR',
      },
      include: {
        problem: {
          select: { title: true, slug: true, difficulty: true },
        },
      },
    })

    return Response.json(submission, { status: 201 })
  } catch (error) {
    console.error('[POST /api/submissions]', error)
    return Response.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const userId = searchParams.get('userId')
    const problemId = searchParams.get('problemId')
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    )

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (problemId) where.problemId = problemId

    const submissions = await db.submission.findMany({
      where,
      include: {
        problem: {
          select: { title: true, slug: true, difficulty: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return Response.json(submissions)
  } catch (error) {
    console.error('[GET /api/submissions]', error)
    return Response.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
