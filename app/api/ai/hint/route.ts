import { NextRequest, NextResponse } from 'next/server';
import { getHint } from '@/lib/claude';
import type { ProblemContext } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      problemId: string;
      hintLevel: 1 | 2 | 3;
      code: string;
      problem?: ProblemContext;
    };

    const { hintLevel, code, problem } = body;

    if (!hintLevel || !code === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: hintLevel, code' },
        { status: 400 },
      );
    }

    if (hintLevel < 1 || hintLevel > 3) {
      return NextResponse.json(
        { error: 'hintLevel must be 1, 2, or 3' },
        { status: 400 },
      );
    }

    // If a full problem context was not provided, use a minimal fallback
    const problemContext: ProblemContext = problem ?? {
      id: body.problemId,
      title: 'Unknown Problem',
      slug: body.problemId,
      difficulty: 'MEDIUM',
      category: 'ARRAY',
      description: 'Problem details not available.',
    };

    const hint = await getHint(problemContext, hintLevel, code ?? '');

    return NextResponse.json({ hint });
  } catch (error) {
    console.error('[AI/hint] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
