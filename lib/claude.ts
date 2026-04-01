import { spawn } from 'child_process'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProblemContext {
  id: string
  title: string
  slug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  description: string
  examples?: unknown
  constraints?: string[]
  hints?: string[]
  tags?: string[]
  timeComplexity?: string | null
  spaceComplexity?: string | null
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface CodeReview {
  score: number
  timeComplexity: string
  spaceComplexity: string
  feedback: string
  improvements: string[]
  isOptimal: boolean
}

export interface WhiteboardFeedback {
  score: number
  correctApproach: boolean
  feedback: string
  missingPoints: string[]
  suggestions: string[]
}

export interface StudyPlanItem {
  day: number
  problemSlugs: string[]
  focus: string
  goal: string
}

// ─── CLI Runner ───────────────────────────────────────────────────────────────

/**
 * Run `claude -p` with prompt piped via stdin.
 * Uses stdin to avoid shell injection and handle long prompts safely.
 */
function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text'], {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let output = ''
    let error = ''

    child.stdin.write(prompt, 'utf8')
    child.stdin.end()

    child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString('utf8') })
    child.stderr.on('data', (chunk: Buffer) => { error += chunk.toString('utf8') })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${error.trim()}`))
      } else {
        resolve(output.trim())
      }
    })
    child.on('error', reject)
  })
}

/**
 * Streaming version — returns a Web ReadableStream.
 * Claude CLI `--output-format stream-json` emits JSONL; we extract text deltas.
 */
function streamClaude(prompt: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn('claude', ['-p', '--output-format', 'stream-json'], {
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      child.stdin.write(prompt, 'utf8')
      child.stdin.end()

      let buffer = ''

      child.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8')
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''   // keep incomplete last line

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const obj = JSON.parse(line) as Record<string, unknown>
            // stream-json emits {type:'content_block_delta', delta:{type:'text_delta', text:'...'}}
            const delta = obj.delta as Record<string, unknown> | undefined
            if (obj.type === 'content_block_delta' && typeof delta?.text === 'string') {
              controller.enqueue(encoder.encode(delta.text))
            }
          } catch {
            // ignore malformed lines
          }
        }
      })

      child.on('close', () => {
        // flush remaining buffer
        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer) as Record<string, unknown>
            const delta = obj.delta as Record<string, unknown> | undefined
            if (obj.type === 'content_block_delta' && typeof delta?.text === 'string') {
              controller.enqueue(encoder.encode(delta.text))
            }
          } catch { /* ignore */ }
        }
        controller.close()
      })

      child.on('error', (err) => controller.error(err))
    },
  })
}

// ─── System Prompts ───────────────────────────────────────────────────────────

const MENTOR_SYSTEM = `You are an elite LeetCode mentor and software engineering interview coach with 15+ years of experience at top-tier tech companies (FAANG). Your teaching philosophy emphasizes deep understanding over memorization.

Core principles:
- Guide through Socratic questioning rather than giving direct answers
- Build intuition for problem-solving patterns
- Explain the "why" behind every approach
- Connect new problems to familiar patterns
- Encourage thinking about edge cases and trade-offs
- Use concrete examples to illustrate abstract concepts

Your communication style is encouraging, precise, clear, and progressive in complexity.`

const INTERVIEWER_SYSTEM = `You are a senior software engineer conducting a technical interview at a top-tier tech company (Google, Meta, Amazon). You follow the standard technical interview format rigorously.

Interview structure:
1. CLARIFICATION — Ask about constraints, edge cases, input/output formats
2. APPROACH — Discuss brute force first, then optimize, ask about complexity
3. CODING — Guide implementation without giving away solutions
4. ANALYSIS — Discuss complexity, edge cases, follow-up optimizations

Persona: Professional but friendly. Ask ONE focused question at a time. Never give away solutions directly.`

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatProblem(p: ProblemContext): string {
  const parts = [
    `Problem: ${p.title} (${p.difficulty})`,
    `Category: ${p.category}`,
    `Description: ${p.description}`,
  ]
  if (p.constraints?.length) parts.push(`Constraints:\n${p.constraints.map(c => `  - ${c}`).join('\n')}`)
  if (p.tags?.length) parts.push(`Tags: ${p.tags.join(', ')}`)
  if (p.timeComplexity) parts.push(`Expected Time Complexity: ${p.timeComplexity}`)
  if (p.spaceComplexity) parts.push(`Expected Space Complexity: ${p.spaceComplexity}`)
  return parts.join('\n')
}

function buildPrompt(system: string, userMessage: string): string {
  return `${system}\n\n---\n\n${userMessage}`
}

// ─── getHint ──────────────────────────────────────────────────────────────────

export async function getHint(
  problem: ProblemContext,
  hintLevel: 1 | 2 | 3,
  currentCode: string,
): Promise<string> {
  const guidelines: Record<1 | 2 | 3, string> = {
    1: 'Very gentle nudge — mention the general problem-solving category or a related concept. Do NOT mention specific algorithms. Keep it to 2-3 sentences.',
    2: 'Specific hint — mention the data structure or algorithmic pattern. Explain WHY it is relevant. 3-4 sentences.',
    3: 'Concrete hint — outline the high-level approach. Describe key steps without writing code. Include time/space complexity. 4-6 sentences.',
  }

  const codeContext = currentCode.trim()
    ? `\n\nStudent's current code:\n\`\`\`\n${currentCode}\n\`\`\``
    : '\n\nStudent has not written any code yet.'

  const userMessage = `${formatProblem(problem)}${codeContext}

Student requested hint level ${hintLevel}/3.
Guideline: ${guidelines[hintLevel]}

Deliver the hint directly — no preamble.`

  return runClaude(buildPrompt(MENTOR_SYSTEM, userMessage))
}

// ─── reviewCode ───────────────────────────────────────────────────────────────

export async function reviewCode(
  problem: ProblemContext,
  code: string,
  language: string,
): Promise<CodeReview> {
  const userMessage = `${formatProblem(problem)}

Student submitted this ${language} solution:

\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Perform a comprehensive code review. Respond with a valid JSON object ONLY — no markdown fences, no explanation:

{
  "score": <integer 0-100>,
  "timeComplexity": "<Big O>",
  "spaceComplexity": "<Big O>",
  "feedback": "<2-4 sentence overall assessment>",
  "improvements": ["<actionable suggestion>", ...],
  "isOptimal": <true|false>
}

Scoring: 90-100 optimal, 75-89 minor issues, 60-74 suboptimal complexity, 40-59 partially correct, 0-39 fundamentally flawed.`

  const raw = await runClaude(buildPrompt(MENTOR_SYSTEM, userMessage))

  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(cleaned) as CodeReview
  } catch {
    return { score: 0, timeComplexity: 'Unknown', spaceComplexity: 'Unknown', feedback: raw, improvements: [], isOptimal: false }
  }
}

// ─── askInterviewQuestion ─────────────────────────────────────────────────────

export async function askInterviewQuestion(
  problem: ProblemContext,
  stage: 'clarification' | 'approach' | 'coding' | 'analysis',
  conversationHistory: Message[],
): Promise<string> {
  const stageCtx: Record<string, string> = {
    clarification: 'CLARIFICATION stage: ask about edge cases, constraints, and ambiguities. Do NOT hint at solutions.',
    approach: 'APPROACH stage: ask the candidate to walk through their thinking and discuss time/space complexity.',
    coding: 'CODING stage: observe and guide implementation. Point out issues subtly.',
    analysis: 'ANALYSIS stage: discuss complexity, alternatives, scalability, and follow-up questions.',
  }

  const historyText = conversationHistory.length
    ? conversationHistory.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n\n')
    : '[Interview is starting. Introduce yourself briefly and present the problem.]'

  const userMessage = `${formatProblem(problem)}

Current stage: ${stage.toUpperCase()}
${stageCtx[stage]}

Conversation so far:
${historyText}

Respond as the interviewer. Ask ONE focused question or make ONE observation.`

  return runClaude(buildPrompt(INTERVIEWER_SYSTEM, userMessage))
}

export function askInterviewQuestionStream(
  problem: ProblemContext,
  stage: 'clarification' | 'approach' | 'coding' | 'analysis',
  conversationHistory: Message[],
): ReadableStream<Uint8Array> {
  const stageCtx: Record<string, string> = {
    clarification: 'CLARIFICATION stage: ask about edge cases and constraints.',
    approach: 'APPROACH stage: discuss thinking and complexity.',
    coding: 'CODING stage: guide implementation.',
    analysis: 'ANALYSIS stage: discuss trade-offs and follow-ups.',
  }

  const historyText = conversationHistory.length
    ? conversationHistory.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n\n')
    : '[Interview is starting. Introduce yourself and present the problem.]'

  const userMessage = `${formatProblem(problem)}

Current stage: ${stage.toUpperCase()}
${stageCtx[stage]}

Conversation so far:
${historyText}

Respond as the interviewer. Ask ONE focused question.`

  return streamClaude(buildPrompt(INTERVIEWER_SYSTEM, userMessage))
}

// ─── evaluateWhiteboardExplanation ───────────────────────────────────────────

export async function evaluateWhiteboardExplanation(
  problem: ProblemContext,
  explanation: string,
): Promise<WhiteboardFeedback> {
  const userMessage = `${formatProblem(problem)}

Student's verbal explanation (no code):
"""
${explanation}
"""

Evaluate for correctness, clarity, and completeness. Respond with valid JSON ONLY:

{
  "score": <integer 0-100>,
  "correctApproach": <true|false>,
  "feedback": "<2-4 sentence overall assessment>",
  "missingPoints": ["<missing concept or edge case>", ...],
  "suggestions": ["<actionable suggestion>", ...]
}

Scoring: 90-100 complete, 75-89 minor gaps, 60-74 mostly correct, 40-59 partial, 0-39 incorrect.`

  const raw = await runClaude(buildPrompt(MENTOR_SYSTEM, userMessage))

  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(cleaned) as WhiteboardFeedback
  } catch {
    return { score: 0, correctApproach: false, feedback: raw, missingPoints: [], suggestions: [] }
  }
}

// ─── generateStudyPlan ────────────────────────────────────────────────────────

export async function generateStudyPlan(
  weakCategories: string[],
  targetDays: number,
  currentLevel: string,
): Promise<StudyPlanItem[]> {
  const levelGuide = currentLevel === 'beginner'
    ? 'Focus mostly on Easy (70%) with some Medium (30%)'
    : currentLevel === 'intermediate'
      ? 'Mix Easy (20%), Medium (60%), Hard (20%)'
      : 'Focus on Medium (40%) and Hard (60%)'

  const userMessage = `Create a personalized LeetCode study plan.

Weak categories: ${weakCategories.join(', ')}
Study duration: ${targetDays} days
Level: ${currentLevel} — ${levelGuide}

Respond with a valid JSON array ONLY — no markdown:

[
  {
    "day": <number>,
    "problemSlugs": ["<leetcode-slug>"],
    "focus": "<primary concept>",
    "goal": "<what student should understand by end of day>"
  }
]

Rules: 1-3 problems per day, real LeetCode slugs, progressively harder, revisit weak topics every 3-4 days.`

  const raw = await runClaude(buildPrompt(MENTOR_SYSTEM, userMessage))

  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(cleaned) as StudyPlanItem[]
  } catch {
    throw new Error('Failed to parse study plan')
  }
}

// ─── explainConcept ───────────────────────────────────────────────────────────

export async function explainConcept(
  concept: string,
  level: 'beginner' | 'intermediate' | 'advanced',
): Promise<string> {
  const levelGuide = {
    beginner: 'Simple language, analogies, step-by-step examples. No prior knowledge assumed.',
    intermediate: 'Assume basic DS&A familiarity. Focus on implementation, patterns, complexity.',
    advanced: 'Edge cases, optimizations, proofs, variations, real-world applications.',
  }

  const userMessage = `Explain: "${concept}"
Level: ${level} — ${levelGuide[level]}

Structure:
1. **What it is** — definition
2. **Why it matters** — when to use in LeetCode/interviews
3. **How it works** — mechanics with example
4. **Key patterns** — common problem patterns
5. **Common pitfalls** — beginner mistakes
6. **Practice problems** — 3-5 LeetCode problems with difficulty

Use markdown formatting.`

  return runClaude(buildPrompt(MENTOR_SYSTEM, userMessage))
}

export function explainConceptStream(
  concept: string,
  level: 'beginner' | 'intermediate' | 'advanced',
): ReadableStream<Uint8Array> {
  const levelGuide = {
    beginner: 'Simple language, analogies, step-by-step examples.',
    intermediate: 'Implementation, patterns, complexity analysis.',
    advanced: 'Edge cases, optimizations, proofs, real-world applications.',
  }

  const userMessage = `Explain: "${concept}"
Level: ${level} — ${levelGuide[level]}

Structure: What it is, Why it matters, How it works, Key patterns, Common pitfalls, Practice problems.
Use markdown formatting.`

  return streamClaude(buildPrompt(MENTOR_SYSTEM, userMessage))
}
