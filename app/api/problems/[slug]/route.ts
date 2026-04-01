import type { NextRequest } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const problem = await db.problem.findUnique({
      where: { slug },
    })

    if (!problem) {
      return Response.json({ error: 'Problem not found' }, { status: 404 })
    }

    return Response.json(problem)
  } catch (error) {
    console.error('[GET /api/problems/[slug]]', error)
    return Response.json(
      { error: 'Failed to fetch problem' },
      { status: 500 }
    )
  }
}
