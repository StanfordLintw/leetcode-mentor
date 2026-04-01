import { NextRequest, NextResponse } from 'next/server';
import { generateStudyPlan } from '@/lib/claude';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      weakCategories: string[];
      targetDays: number;
      currentLevel: string;
    };

    const { weakCategories, targetDays, currentLevel } = body;

    if (!weakCategories || weakCategories.length === 0) {
      return NextResponse.json(
        { error: 'weakCategories must be a non-empty array.' },
        { status: 400 },
      );
    }

    if (!targetDays || targetDays < 1 || targetDays > 365) {
      return NextResponse.json(
        { error: 'targetDays must be between 1 and 365.' },
        { status: 400 },
      );
    }

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!currentLevel || !validLevels.includes(currentLevel)) {
      return NextResponse.json(
        { error: `currentLevel must be one of: ${validLevels.join(', ')}` },
        { status: 400 },
      );
    }

    const plan = await generateStudyPlan(weakCategories, targetDays, currentLevel);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[AI/study-plan] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
