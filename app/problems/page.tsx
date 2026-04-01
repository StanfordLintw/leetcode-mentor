'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProblemRow } from '@/components/problems/ProblemRow'
import { DifficultyBadge } from '@/components/problems/DifficultyBadge'

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

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  category: Category
  tags: string[]
  leetcodeId: number | null
}

interface ProblemsResponse {
  problems: Problem[]
  total: number
  page: number
  totalPages: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'ARRAY', label: 'Array' },
  { value: 'STRING', label: 'String' },
  { value: 'LINKED_LIST', label: 'Linked List' },
  { value: 'TREE', label: 'Tree' },
  { value: 'GRAPH', label: 'Graph' },
  { value: 'DYNAMIC_PROGRAMMING', label: 'Dynamic Programming' },
  { value: 'BACKTRACKING', label: 'Backtracking' },
  { value: 'BINARY_SEARCH', label: 'Binary Search' },
  { value: 'STACK_QUEUE', label: 'Stack / Queue' },
  { value: 'HASH_TABLE', label: 'Hash Table' },
  { value: 'MATH', label: 'Math' },
  { value: 'TWO_POINTERS', label: 'Two Pointers' },
  { value: 'SLIDING_WINDOW', label: 'Sliding Window' },
  { value: 'GREEDY', label: 'Greedy' },
  { value: 'HEAP', label: 'Heap' },
  { value: 'TRIE', label: 'Trie' },
]

// Mock acceptance rates — replaced by real data when the API provides them
function mockAcceptance(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff
  }
  return 30 + Math.abs(hash % 50)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<'ALL' | Difficulty>('ALL')
  const [category, setCategory] = useState<'ALL' | Category>('ALL')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [difficulty, category])

  const fetchProblems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (difficulty !== 'ALL') params.set('difficulty', difficulty)
      if (category !== 'ALL') params.set('category', category)
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/problems?${params}`)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data: ProblemsResponse = await res.json()
      setProblems(data.problems)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problems')
    } finally {
      setIsLoading(false)
    }
  }, [page, difficulty, category, debouncedSearch])

  useEffect(() => {
    void fetchProblems()
  }, [fetchProblems])

  // ─── Summary counts ─────────────────────────────────────────────────────────
  const easyCt = problems.filter((p) => p.difficulty === 'EASY').length
  const mediumCt = problems.filter((p) => p.difficulty === 'MEDIUM').length
  const hardCt = problems.filter((p) => p.difficulty === 'HARD').length

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Problem Bank
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isLoading ? 'Loading…' : `${total} problem${total !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            {!isLoading && total > 0 && (
              <div className="flex items-center gap-3">
                <DifficultyBadge difficulty="EASY" />
                <span className="text-sm text-zinc-500">{easyCt}</span>
                <DifficultyBadge difficulty="MEDIUM" />
                <span className="text-sm text-zinc-500">{mediumCt}</span>
                <DifficultyBadge difficulty="HARD" />
                <span className="text-sm text-zinc-500">{hardCt}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filter bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search problems or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />

            {/* Difficulty filter */}
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as typeof difficulty)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Category filter */}
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as typeof category)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 w-14">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Acceptance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 w-16">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                            style={{ width: j === 1 ? '60%' : '40%' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : problems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      No problems found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  problems.map((problem) => (
                    <ProblemRow
                      key={problem.id}
                      {...problem}
                      acceptance={mockAcceptance(problem.id)}
                      solved={false}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages} &middot; {total} problems
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
