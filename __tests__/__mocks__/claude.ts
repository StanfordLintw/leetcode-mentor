import type {
  ProblemContext,
  CodeReview,
  WhiteboardFeedback,
  StudyPlanItem,
  Message,
} from '@/lib/claude'

export const FAKE_HINT = 'Think about using a hash map to track elements you have seen.'

export const FAKE_CODE_REVIEW: CodeReview = {
  score: 85,
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  feedback: 'Good solution with correct logic and clean code structure.',
  improvements: ['Consider using early return for cleaner control flow.'],
  isOptimal: true,
}

export const FAKE_WHITEBOARD_FEEDBACK: WhiteboardFeedback = {
  score: 78,
  correctApproach: true,
  feedback: 'You correctly identified the two-pointer technique.',
  missingPoints: ['Did not mention edge case for empty input.'],
  suggestions: ['Elaborate on how you handle duplicate elements.'],
}

export const FAKE_STUDY_PLAN: StudyPlanItem[] = [
  {
    day: 1,
    problemSlugs: ['two-sum', 'contains-duplicate'],
    focus: 'Hash Maps',
    goal: 'Understand when and how to use hash maps for O(1) lookup.',
  },
  {
    day: 2,
    problemSlugs: ['valid-anagram'],
    focus: 'Strings',
    goal: 'Practice character frequency counting.',
  },
]

export const FAKE_INTERVIEW_QUESTION =
  'Can you walk me through your approach before writing any code?'

export const FAKE_EXPLANATION =
  'A hash map is a data structure that maps keys to values for efficient O(1) lookup.'

export const getHint = jest.fn().mockResolvedValue(FAKE_HINT)

export const reviewCode = jest.fn().mockResolvedValue(FAKE_CODE_REVIEW)

export const evaluateWhiteboardExplanation = jest
  .fn()
  .mockResolvedValue(FAKE_WHITEBOARD_FEEDBACK)

export const generateStudyPlan = jest.fn().mockResolvedValue(FAKE_STUDY_PLAN)

export const askInterviewQuestion = jest
  .fn()
  .mockResolvedValue(FAKE_INTERVIEW_QUESTION)

export const askInterviewQuestionStream = jest.fn().mockReturnValue(
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(FAKE_INTERVIEW_QUESTION))
      controller.close()
    },
  })
)

export const explainConcept = jest.fn().mockResolvedValue(FAKE_EXPLANATION)

export const explainConceptStream = jest.fn().mockReturnValue(
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(FAKE_EXPLANATION))
      controller.close()
    },
  })
)

// Re-export types so test files can import them from this mock path if needed
export type { ProblemContext, CodeReview, WhiteboardFeedback, StudyPlanItem, Message }
