'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { DifficultyBadge } from './DifficultyBadge'
import { CategoryBadge } from './CategoryBadge'

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

export interface ProblemRowProps {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  category: Category
  tags: string[]
  leetcodeId: number | null
  acceptance?: number
  solved?: boolean
}

export function ProblemRow({
  title,
  slug,
  difficulty,
  category,
  tags,
  leetcodeId,
  acceptance,
  solved = false,
}: ProblemRowProps) {
  return (
    <tr className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
      {/* # */}
      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 tabular-nums w-14">
        {leetcodeId ?? '—'}
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        <Link
          href={`/problems/${slug}`}
          className="text-sm font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400 transition-colors"
        >
          {title}
        </Link>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <CategoryBadge category={category} showIcon={false} />
      </td>

      {/* Difficulty */}
      <td className="px-4 py-3">
        <DifficultyBadge difficulty={difficulty} />
      </td>

      {/* Acceptance */}
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
        {acceptance !== undefined ? `${acceptance.toFixed(1)}%` : '—'}
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        {solved ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" aria-label="Solved" />
        ) : (
          <span className="text-zinc-300 dark:text-zinc-600 text-xs">—</span>
        )}
      </td>
    </tr>
  )
}
