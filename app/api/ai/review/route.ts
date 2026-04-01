import { NextRequest, NextResponse } from 'next/server';
import { reviewCode } from '@/lib/claude';
import type { ProblemContext } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      problemId: string;
      code: string;
      language: string;
      problem?: ProblemContext;
    };

    const { code, language, problem } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: code, language' },
        { status: 400 },
      );
    }

    const problemContext: ProblemContext = problem ?? {
      id: body.problemId,
      title: 'Unknown Problem',
      slug: body.problemId,
      difficulty: 'MEDIUM',
      category: 'ARRAY',
      description: 'Problem details not available.',
    };

    const review = await reviewCode(problemContext, code, language);

    return NextResponse.json(review);
  } catch (error) {
    console.error('[AI/review] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
