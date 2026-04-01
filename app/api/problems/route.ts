import type { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const difficulty = searchParams.get('difficulty')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10))
    )
    const skip = (page - 1) * limit

    // Build the where clause dynamically
    const where: Record<string, unknown> = {}

    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = difficulty
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (search && search.trim() !== '') {
      const term = search.trim()
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ]
    }

    const [problems, total] = await Promise.all([
      db.problem.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          category: true,
          tags: true,
          leetcodeId: true,
        },
        orderBy: [{ leetcodeId: 'asc' }, { title: 'asc' }],
        skip,
        take: limit,
      }),
      db.problem.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return Response.json({ problems, total, page, totalPages })
  } catch (error) {
    console.error('[GET /api/problems]', error)
    return Response.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    )
  }
}
