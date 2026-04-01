import { NextRequest, NextResponse } from 'next/server';
import { evaluateWhiteboardExplanation } from '@/lib/claude';
import type { ProblemContext } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      problemId: string;
      explanation: string;
      problem?: ProblemContext;
    };

    const { explanation, problem } = body;

    if (!explanation || explanation.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed explanation (at least a few sentences).' },
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

    const feedback = await evaluateWhiteboardExplanation(problemContext, explanation);

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('[AI/whiteboard] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
