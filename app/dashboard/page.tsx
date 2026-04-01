'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubmissionHeatmap } from '@/components/dashboard/SubmissionHeatmap'
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Flame,
  Calendar,
  Code2,
  TrendingUp,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HeatmapEntry {
  date: string
  count: number
}

interface LanguageStat {
  language: string
  count: number
}

interface SubmissionEntry {
  id: string
  problemTitle: string
  problemSlug: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  language: string
  status: string
  runtime: number | null
  createdAt: string
}

interface CategoryStat {
  category: string
  count: number
}

interface DetailedStats {
  heatmapData: HeatmapEntry[]
  languageStats: LanguageStat[]
  submissionHistory: SubmissionEntry[]
  difficultyBreakdown: { EASY: number; MEDIUM: number; HARD: number }
  categoryStats: CategoryStat[]
  habitTracker: {
    daysPracticed: number
    currentStreak: number
    longestStreak: number
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFFICULTY_PIE_COLORS = ['#4ade80', '#facc15', '#f87171']

const STATUS_ICON: Record<string, React.ReactNode> = {
  ACCEPTED: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
  WRONG_ANSWER: <XCircle className="h-4 w-4 text-red-400 shrink-0" />,
  TIME_LIMIT: <Clock className="h-4 w-4 text-yellow-400 shrink-0" />,
  RUNTIME_ERROR: <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />,
  COMPILE_ERROR: <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0" />,
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Accepted',
  WRONG_ANSWER: 'Wrong Answer',
  TIME_LIMIT: 'Time Limit',
  RUNTIME_ERROR: 'Runtime Error',
  COMPILE_ERROR: 'Compile Error',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HARD: 'text-red-400',
}

const CATEGORY_LABELS: Record<string, string> = {
  ARRAY: 'Array',
  STRING: 'String',
  LINKED_LIST: 'Linked List',
  TREE: 'Tree',
  GRAPH: 'Graph',
  DYNAMIC_PROGRAMMING: 'DP',
  BACKTRACKING: 'Backtracking',
  BINARY_SEARCH: 'Bin Search',
  STACK_QUEUE: 'Stack/Queue',
  HASH_TABLE: 'Hash Table',
  MATH: 'Math',
  TWO_POINTERS: 'Two Ptr',
  SLIDING_WINDOW: 'Sliding Win',
  GREEDY: 'Greedy',
  HEAP: 'Heap',
  TRIE: 'Trie',
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DetailedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stats/detailed')
      .then((r) => r.json())
      .then((d: DetailedStats & { error?: string }) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const difficultyPieData = data
    ? [
        { name: 'Easy', value: data.difficultyBreakdown.EASY },
        { name: 'Medium', value: data.difficultyBreakdown.MEDIUM },
        { name: 'Hard', value: data.difficultyBreakdown.HARD },
      ]
    : []

  const categoryBarData =
    data?.categoryStats.map((c) => ({
      name: CATEGORY_LABELS[c.category] ?? c.category,
      Solved: c.count,
    })) ?? []

  const languageBarData =
    data?.languageStats.map((l) => ({
      name: l.language,
      Submissions: l.count,
    })) ?? []

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          <span className="text-sm">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="rounded-lg bg-red-950/40 border border-red-900 px-6 py-4 text-red-400 text-sm max-w-md text-center">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          Failed to load analytics: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <BrainCircuit className="h-6 w-6 text-green-400" />
            <span>LeetCode Mentor</span>
          </Link>
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <Link href="/problems" className="hover:text-white px-3 py-1">Problems</Link>
            <Link href="/dashboard" className="text-white font-medium px-3 py-1">Dashboard</Link>
            <Link href="/ai-mentor" className="hover:text-white px-3 py-1">AI Mentor</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track your progress, habits, and performance over time.
          </p>
        </div>

        {/* ── Habit Tracker ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-900/40">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Days Practiced</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {data?.habitTracker.daysPracticed ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-900/40">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {data?.habitTracker.currentStreak ?? 0}
                    <span className="text-base font-normal text-zinc-500 ml-1">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-900/40">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Longest Streak</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {data?.habitTracker.longestStreak ?? 0}
                    <span className="text-base font-normal text-zinc-500 ml-1">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Submission Heatmap ─────────────────────────────────────────────── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-400" />
              Submission Activity — Last 365 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionHeatmap data={data?.heatmapData ?? []} />
          </CardContent>
        </Card>

        {/* ── Charts Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Donut */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Solved by Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              {difficultyPieData.every((d) => d.value === 0) ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                  No solved problems yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={difficultyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {difficultyPieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={DIFFICULTY_PIE_COLORS[index]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#e4e4e7',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ color: '#a1a1aa', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Bar Chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Solved by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBarData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                  No solved problems yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryBarData} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#e4e4e7',
                      }}
                    />
                    <Bar dataKey="Solved" fill="#4ade80" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Language Distribution ─────────────────────────────────────────── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-400" />
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {languageBarData.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">
                No submission data available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={languageBarData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#e4e4e7',
                    }}
                  />
                  <Bar dataKey="Submissions" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ── Recent Activity Feed ──────────────────────────────────────────── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="bg-zinc-800 mb-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="accepted" className="text-xs">Accepted</TabsTrigger>
                <TabsTrigger value="failed" className="text-xs">Failed</TabsTrigger>
              </TabsList>

              {(['all', 'accepted', 'failed'] as const).map((tab) => {
                const filtered = (data?.submissionHistory ?? []).filter((s) => {
                  if (tab === 'accepted') return s.status === 'ACCEPTED'
                  if (tab === 'failed') return s.status !== 'ACCEPTED'
                  return true
                })

                return (
                  <TabsContent key={tab} value={tab}>
                    {filtered.length === 0 ? (
                      <p className="text-zinc-500 text-sm text-center py-6">
                        No submissions in this category.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {filtered.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors"
                          >
                            {STATUS_ICON[sub.status] ?? (
                              <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/problems/${sub.problemSlug}`}
                                  className="text-zinc-200 text-sm font-medium hover:text-white hover:underline truncate"
                                >
                                  {sub.problemTitle}
                                </Link>
                                <span
                                  className={`text-xs font-medium ${
                                    DIFFICULTY_COLORS[sub.difficulty]
                                  }`}
                                >
                                  {sub.difficulty.charAt(0) +
                                    sub.difficulty.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                                <span>{STATUS_LABELS[sub.status] ?? sub.status}</span>
                                <span>·</span>
                                <span className="font-mono">{sub.language}</span>
                                {sub.runtime != null && (
                                  <>
                                    <span>·</span>
                                    <span>{sub.runtime}ms</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-zinc-600 shrink-0">
                              {formatTimeAgo(sub.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
