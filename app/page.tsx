'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { CategoryProgress } from '@/components/dashboard/CategoryProgress'
import {
  CheckCircle2,
  Trophy,
  Flame,
  BarChart3,
  Shuffle,
  Zap,
  BookOpen,
  BrainCircuit,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CategoryStat {
  category: string
  solved: number
  total: number
}

interface Submission {
  id: string
  problemTitle: string
  problemSlug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  language: string
  status: string
  runtime: number | null
  createdAt: string
}

interface RecommendedProblem {
  id: string
  title: string
  slug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
}

interface Stats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  categoryStats: CategoryStat[]
  recentSubmissions: Submission[]
  streak: { current: number; longest: number }
  recommended: RecommendedProblem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-green-900/50 text-green-400 border-green-800',
  MEDIUM: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  HARD: 'bg-red-900/50 text-red-400 border-red-800',
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: 'text-green-400',
  WRONG_ANSWER: 'text-red-400',
  TIME_LIMIT: 'text-yellow-400',
  RUNTIME_ERROR: 'text-orange-400',
  COMPILE_ERROR: 'text-zinc-400',
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT: 'Time Limit',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILE_ERROR: 'Compile Error',
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const CATEGORY_LABELS: Record<string, string> = {
  ARRAY: 'Array',
  STRING: 'String',
  LINKED_LIST: 'Linked List',
  TREE: 'Tree',
  GRAPH: 'Graph',
  DYNAMIC_PROGRAMMING: 'DP',
  BACKTRACKING: 'Backtracking',
  BINARY_SEARCH: 'Binary Search',
  STACK_QUEUE: 'Stack/Queue',
  HASH_TABLE: 'Hash Table',
  MATH: 'Math',
  TWO_POINTERS: 'Two Pointers',
  SLIDING_WINDOW: 'Sliding Window',
  GREEDY: 'Greedy',
  HEAP: 'Heap',
  TRIE: 'Trie',
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [randomLoading, setRandomLoading] = useState<'EASY' | 'MEDIUM' | 'HARD' | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data: Stats & { error?: string }) => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRandomProblem = useCallback(
    async (difficulty: 'EASY' | 'MEDIUM' | 'HARD') => {
      setRandomLoading(difficulty)
      try {
        const res = await fetch(`/api/problems/random?difficulty=${difficulty}`)
        const data = await res.json()
        if (data.problem?.slug) {
          router.push(`/problems/${data.problem.slug}`)
        }
      } catch {
        // ignore
      } finally {
        setRandomLoading(null)
      }
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <BrainCircuit className="h-6 w-6 text-green-400" />
            <span>LeetCode Mentor</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/problems">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Problems
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Dashboard
              </Button>
            </Link>
            <Link href="/ai-mentor">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                AI Mentor
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Hero greeting ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Keep up your practice streak and track your progress below.
          </p>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-zinc-900 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-950/40 border border-red-900 px-4 py-3 text-red-400 text-sm">
            Failed to load stats: {error}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Solved"
              value={stats.totalSolved}
              subtitle="problems completed"
              icon={Trophy}
              color="purple"
            />
            <StatsCard
              title="Easy Solved"
              value={stats.easySolved}
              subtitle="easy problems"
              icon={CheckCircle2}
              color="green"
            />
            <StatsCard
              title="Medium Solved"
              value={stats.mediumSolved}
              subtitle="medium problems"
              icon={BarChart3}
              color="yellow"
            />
            <StatsCard
              title="Hard Solved"
              value={stats.hardSolved}
              subtitle="hard problems"
              icon={Flame}
              color="red"
            />
          </div>
        ) : null}

        {/* ── Middle row: category progress + streak ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Progress */}
          <div className="lg:col-span-2">
            <Card className="bg-zinc-900 border-zinc-800 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Category Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 rounded bg-zinc-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <CategoryProgress data={stats?.categoryStats ?? []} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Streak + Study Streak Hint */}
          <div className="flex flex-col gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="h-16 rounded bg-zinc-800 animate-pulse" />
                ) : (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-orange-400">
                        {stats?.streak.current ?? 0}
                      </span>
                      <span className="text-zinc-400 text-sm mb-1">
                        day{stats?.streak.current !== 1 ? 's' : ''} current
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500">
                      Longest:{' '}
                      <span className="text-zinc-300 font-medium">
                        {stats?.streak.longest ?? 0} days
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Study Streak Calendar Hint */}
            <Card className="bg-zinc-900 border-zinc-800 border-dashed">
              <CardContent className="pt-5 text-center space-y-2">
                <Clock className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-500 text-sm">
                  Full study streak calendar and submission heatmap available in the{' '}
                  <Link href="/dashboard" className="text-green-400 hover:underline">
                    Dashboard
                  </Link>
                  .
                </p>
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    View Full Analytics
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Recent Submissions ─────────────────────────────────────────────── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : !stats?.recentSubmissions.length ? (
              <p className="text-zinc-500 text-sm text-center py-8">No submissions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                      <th className="text-left px-6 py-3 font-medium">Problem</th>
                      <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                      <th className="text-left px-4 py-3 font-medium">Language</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-6 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map((sub, i) => (
                      <tr
                        key={sub.id}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                          i === stats.recentSubmissions.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-6 py-3">
                          <Link
                            href={`/problems/${sub.problemSlug}`}
                            className="text-zinc-200 hover:text-white hover:underline font-medium"
                          >
                            {sub.problemTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                              DIFFICULTY_COLORS[sub.difficulty]
                            }`}
                          >
                            {sub.difficulty.charAt(0) + sub.difficulty.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                          {sub.language}
                        </td>
                        <td
                          className={`px-4 py-3 font-medium ${
                            STATUS_COLORS[sub.status] ?? 'text-zinc-400'
                          }`}
                        >
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-500 text-xs">
                          {formatTimeAgo(sub.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Bottom row: Recommended + Quick Actions ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommended Problems */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                Recommended Problems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : !stats?.recommended.length ? (
                <p className="text-zinc-500 text-sm">No recommendations available.</p>
              ) : (
                stats.recommended.map((problem) => (
                  <Link
                    key={problem.id}
                    href={`/problems/${problem.slug}`}
                    className="flex items-center justify-between rounded-lg px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div>
                      <p className="text-zinc-200 font-medium text-sm group-hover:text-white">
                        {problem.title}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {CATEGORY_LABELS[problem.category] ?? problem.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                          DIFFICULTY_COLORS[problem.difficulty]
                        }`}
                      >
                        {problem.difficulty.charAt(0) +
                          problem.difficulty.slice(1).toLowerCase()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-green-800 hover:bg-green-700 text-white border-0 justify-start gap-3 h-12"
                onClick={() => handleRandomProblem('EASY')}
                disabled={randomLoading !== null}
              >
                {randomLoading === 'EASY' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                <div className="text-left">
                  <div className="font-medium text-sm">Practice Random Easy</div>
                  <div className="text-xs text-green-300">Warm up with an easy problem</div>
                </div>
              </Button>

              <Button
                className="w-full bg-yellow-800 hover:bg-yellow-700 text-white border-0 justify-start gap-3 h-12"
                onClick={() => handleRandomProblem('MEDIUM')}
                disabled={randomLoading !== null}
              >
                {randomLoading === 'MEDIUM' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4" />
                )}
                <div className="text-left">
                  <div className="font-medium text-sm">Practice Random Medium</div>
                  <div className="text-xs text-yellow-300">Challenge yourself</div>
                </div>
              </Button>

              <Button
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 justify-start gap-3 h-12"
                onClick={() => router.push('/interview')}
              >
                <BrainCircuit className="h-4 w-4 text-purple-400" />
                <div className="text-left">
                  <div className="font-medium text-sm">Start Interview Mode</div>
                  <div className="text-xs text-zinc-400">Timed mock interview session</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
