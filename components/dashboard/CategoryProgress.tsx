'use client'

import { cn } from '@/lib/utils'

interface CategoryStat {
  category: string
  solved: number
  total: number
}

interface CategoryProgressProps {
  data: CategoryStat[]
}

const CATEGORY_LABELS: Record<string, string> = {
  ARRAY: 'Array',
  STRING: 'String',
  LINKED_LIST: 'Linked List',
  TREE: 'Tree',
  GRAPH: 'Graph',
  DYNAMIC_PROGRAMMING: 'Dynamic Programming',
  BACKTRACKING: 'Backtracking',
  BINARY_SEARCH: 'Binary Search',
  STACK_QUEUE: 'Stack / Queue',
  HASH_TABLE: 'Hash Table',
  MATH: 'Math',
  TWO_POINTERS: 'Two Pointers',
  SLIDING_WINDOW: 'Sliding Window',
  GREEDY: 'Greedy',
  HEAP: 'Heap',
  TRIE: 'Trie',
}

function getBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-yellow-500'
  if (pct >= 20) return 'bg-orange-500'
  return 'bg-red-600'
}

export function CategoryProgress({ data }: CategoryProgressProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-6">
        No category data available.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((stat) => {
        const pct = stat.total > 0 ? Math.round((stat.solved / stat.total) * 100) : 0
        const label = CATEGORY_LABELS[stat.category] ?? stat.category
        return (
          <div key={stat.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300 font-medium">{label}</span>
              <span className="text-zinc-500 tabular-nums">
                {stat.solved}
                <span className="text-zinc-600">/{stat.total}</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', getBarColor(pct))}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-zinc-600 text-right">{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}
