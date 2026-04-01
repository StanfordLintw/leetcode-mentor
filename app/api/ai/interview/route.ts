import { NextRequest } from 'next/server';
import { askInterviewQuestionStream } from '@/lib/claude';
import type { ProblemContext, Message } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      problemId: string;
      stage: 'clarification' | 'approach' | 'coding' | 'analysis';
      conversationHistory: Message[];
      problem?: ProblemContext;
    };

    const { stage, conversationHistory, problem } = body;

    if (!stage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: stage' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const validStages = ['clarification', 'approach', 'coding', 'analysis'];
    if (!validStages.includes(stage)) {
      return new Response(
        JSON.stringify({ error: `stage must be one of: ${validStages.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
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

    const readable = askInterviewQuestionStream(
      problemContext,
      stage,
      conversationHistory ?? [],
    );

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[AI/interview] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
