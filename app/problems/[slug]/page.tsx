'use client'

import { useState, useEffect, use } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Play,
  Send,
  Clock,
  MemoryStick,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DifficultyBadge } from '@/components/problems/DifficultyBadge'
import { CategoryBadge } from '@/components/problems/CategoryBadge'
import CodeEditor from '@/components/editor/CodeEditor'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'
type Category =
  | 'ARRAY'
  | 'STRING'
  | 'LINKED_LIST'
  | 'TREE'
  | 'GRAPH'
  | 'DYNAMIC_PROGRAMMING'
  | 'BACKTRACKING'
  | 'BINARY_SEARCH'
  | 'STACK_QUEUE'
  | 'HASH_TABLE'
  | 'MATH'
  | 'TWO_POINTERS'
  | 'SLIDING_WINDOW'
  | 'GREEDY'
  | 'HEAP'
  | 'TRIE'

interface Example {
  input: string
  output: string
  explanation?: string
}

interface StarterCode {
  python?: string
  javascript?: string
  typescript?: string
  java?: string
  cpp?: string
  [key: string]: string | undefined
}

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  category: Category
  description: string
  examples: Example[]
  constraints: string[]
  hints: string[]
  tags: string[]
  starterCode: StarterCode
  timeComplexity: string | null
  spaceComplexity: string | null
  leetcodeId: number | null
}

interface TestResult {
  passed: boolean
  input: string
  expected: string
  actual: string
  time: string | null
  memory: number | null
}

interface RunResponse {
  results: TestResult[]
  allPassed: boolean  // derived client-side from results array
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

const DEFAULT_STARTER: Record<string, string> = {
  python: '# Write your solution here\ndef solution():\n    pass\n',
  javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
  typescript: '// Write your solution here\nfunction solution(): void {\n  \n}\n',
  java: '// Write your solution here\nclass Solution {\n    public void solution() {\n        \n    }\n}\n',
  cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solution() {\n    \n}\n',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HintBlock({ hint, index }: { hint: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <span>Show Hint {index + 1}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
          {hint}
        </div>
      )}
    </div>
  )
}

function TestResultCard({ result, index }: { result: TestResult; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden text-sm',
        result.passed
          ? 'border-emerald-200 dark:border-emerald-800/60'
          : 'border-red-200 dark:border-red-800/60'
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2 font-medium transition-colors',
          result.passed
            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
            : 'bg-red-50 text-red-800 hover:bg-red-100/70 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
        )}
      >
        <span className="flex items-center gap-2">
          {result.passed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 opacity-60" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-60" />
        )}
      </button>

      {expanded && (
        <div className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Input</span>
            <pre className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result.input}</pre>
          </div>
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Expected</span>
            <pre className="mt-1 font-mono text-xs text-emerald-700 dark:text-emerald-400 whitespace-pre-wrap">{result.expected}</pre>
          </div>
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Output</span>
            <pre className={cn(
              'mt-1 font-mono text-xs whitespace-pre-wrap',
              result.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            )}>{result.actual || '(empty)'}</pre>
          </div>
          {(result.time || result.memory) && (
            <div className="flex gap-4 px-3 py-2">
              {result.time && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />{result.time}s
                </span>
              )}
              {result.memory && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <MemoryStick className="h-3 w-3" />{result.memory} KB
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runResults, setRunResults] = useState<RunResponse | null>(null)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch problem
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    fetch(`/api/problems/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Problem not found (${res.status})`)
        return res.json() as Promise<Problem>
      })
      .then((data) => {
        setProblem(data)
        // Pre-fill starter code for the active language
        const starter =
          (data.starterCode as StarterCode)?.[language] ??
          DEFAULT_STARTER[language] ??
          ''
        setCode(starter)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load problem')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Swap starter code when language changes
  function handleLanguageChange(lang: string) {
    setLanguage(lang)
    if (problem) {
      const starter =
        (problem.starterCode as StarterCode)?.[lang] ??
        DEFAULT_STARTER[lang] ??
        ''
      setCode(starter)
    }
    setRunResults(null)
    setSubmitStatus(null)
    setSubmitError(null)
  }

  // Run against sample test cases
  async function handleRun() {
    if (!problem) return
    setIsRunning(true)
    setRunResults(null)
    setSubmitStatus(null)
    setSubmitError(null)
    try {
      const examples = Array.isArray(problem.examples) ? problem.examples : []
      const testCases = examples.map((ex) => ({
        input: ex.input,
        expected: ex.output,
      }))
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, testCases }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Run failed')
      const results: TestResult[] = data.results ?? []
      setRunResults({
        results,
        allPassed: results.length > 0 && results.every((r) => r.passed),
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setIsRunning(false)
    }
  }

  // Submit solution
  async function handleSubmit() {
    if (!problem) return
    setIsSubmitting(true)
    setSubmitStatus(null)
    setSubmitError(null)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code,
          language,
          userId: 'guest',
          status: 'WRONG_ANSWER', // actual verdict comes from judge
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSubmitStatus(data.status ?? 'SUBMITTED')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Loading / error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-500">Loading problem…</p>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/50 dark:bg-red-900/20">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <p className="font-medium text-red-700 dark:text-red-400">
            {error ?? 'Problem not found'}
          </p>
        </div>
      </div>
    )
  }

  const examples = Array.isArray(problem.examples) ? problem.examples : []

  // ─── Layout ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Top nav bar */}
      <header className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <a
          href="/problems"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          ← Problems
        </a>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {problem.leetcodeId ? `${problem.leetcodeId}. ` : ''}{problem.title}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
      </header>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: problem description (40%) ── */}
        <div className="flex w-2/5 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Tabs defaultValue="description" className="flex flex-1 flex-col">
            <TabsList className="shrink-0 justify-start rounded-none border-b border-zinc-200 bg-transparent px-4 dark:border-zinc-800">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Description
              </TabsTrigger>
              <TabsTrigger value="hints" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Hints {problem.hints.length > 0 && `(${problem.hints.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Title + badges */}
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  {problem.leetcodeId ? `${problem.leetcodeId}. ` : ''}{problem.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <CategoryBadge category={problem.category} />
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>

              {/* Examples */}
              {examples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Examples
                  </h3>
                  {examples.map((ex, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40 space-y-2"
                    >
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Example {i + 1}
                      </p>
                      <div className="font-mono text-sm space-y-1">
                        <div>
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Input: </span>
                          <span className="text-zinc-800 dark:text-zinc-200">{ex.input}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Output: </span>
                          <span className="text-zinc-800 dark:text-zinc-200">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                            <span className="font-semibold">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {problem.constraints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Constraints
                  </h3>
                  <ul className="space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                        <code className="font-mono text-xs">{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Complexity */}
              {(problem.timeComplexity || problem.spaceComplexity) && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/10">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Complexity
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {problem.timeComplexity && (
                      <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        Time: <code className="font-mono text-xs">{problem.timeComplexity}</code>
                      </span>
                    )}
                    {problem.spaceComplexity && (
                      <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <MemoryStick className="h-3.5 w-3.5 text-blue-500" />
                        Space: <code className="font-mono text-xs">{problem.spaceComplexity}</code>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="hints" className="flex-1 overflow-y-auto p-5">
              {problem.hints.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No hints available for this problem.
                </p>
              ) : (
                <div className="space-y-2">
                  {problem.hints.map((hint, i) => (
                    <HintBlock key={i} hint={hint} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right panel: editor + test cases (60%) ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Language selector + action buttons */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="h-8 gap-1.5 text-xs"
              >
                {isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {isRunning ? 'Running…' : 'Run'}
              </Button>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={code}
              language={language}
              onChange={setCode}
              height="100%"
            />
          </div>

          {/* Test case / results panel */}
          <div className="shrink-0 max-h-56 overflow-y-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <Tabs defaultValue="testcases">
              <TabsList className="w-full justify-start rounded-none border-b border-zinc-200 bg-transparent px-4 dark:border-zinc-800">
                <TabsTrigger value="testcases" className="rounded-none border-b-2 border-transparent text-xs data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-none border-b-2 border-transparent text-xs data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                  Results
                  {runResults && (
                    <span className={cn(
                      'ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold',
                      runResults.allPassed
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    )}>
                      {runResults.results.filter((r) => r.passed).length}/{runResults.results.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="testcases" className="p-4">
                {examples.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No test cases available.</p>
                ) : (
                  <div className="space-y-2">
                    {examples.map((ex, i) => (
                      <div key={i} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                        <p className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                          Case {i + 1}
                        </p>
                        <div className="font-mono text-xs space-y-0.5">
                          <div>
                            <span className="text-zinc-500">Input: </span>
                            <span className="text-zinc-800 dark:text-zinc-200">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Expected: </span>
                            <span className="text-zinc-800 dark:text-zinc-200">{ex.output}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="results" className="p-4">
                {/* Submit status */}
                {submitStatus && (
                  <div className={cn(
                    'mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                    submitStatus === 'ACCEPTED'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400'
                  )}>
                    {submitStatus === 'ACCEPTED' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    Submission recorded: {submitStatus.replace('_', ' ')}
                  </div>
                )}

                {submitError && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {submitError}
                  </div>
                )}

                {!runResults && !submitStatus && !submitError ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Run your code to see test results here.
                  </p>
                ) : runResults ? (
                  <div className="space-y-2">
                    <div className={cn(
                      'mb-2 text-sm font-semibold',
                      runResults.allPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {runResults.allPassed ? 'All test cases passed!' : `${runResults.results.filter(r => r.passed).length} / ${runResults.results.length} test cases passed`}
                    </div>
                    {runResults.results.map((result, i) => (
                      <TestResultCard key={i} result={result} index={i} />
                    ))}
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
