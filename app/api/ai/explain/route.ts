import { NextRequest } from 'next/server';
import { explainConceptStream } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      concept: string;
      level: 'beginner' | 'intermediate' | 'advanced';
    };

    const { concept, level } = body;

    if (!concept || concept.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: concept' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!level || !validLevels.includes(level)) {
      return new Response(
        JSON.stringify({ error: `level must be one of: ${validLevels.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const readable = explainConceptStream(concept.trim(), level);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[AI/explain] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
