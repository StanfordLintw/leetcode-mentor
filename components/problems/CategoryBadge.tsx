import { cn } from '@/lib/utils'
import {
  LayoutList,
  Type,
  Link,
  TreePine,
  Network,
  Zap,
  RotateCcw,
  SplitSquareHorizontal,
  Layers,
  Hash,
  Calculator,
  ArrowLeftRight,
  Gauge,
  TrendingUp,
  Triangle,
  BookOpen,
} from 'lucide-react'

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

interface CategoryBadgeProps {
  category: Category
  showIcon?: boolean
  className?: string
}

type CategoryConfig = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  ARRAY: {
    label: 'Array',
    icon: LayoutList,
    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  STRING: {
    label: 'String',
    icon: Type,
    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  },
  LINKED_LIST: {
    label: 'Linked List',
    icon: Link,
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  },
  TREE: {
    label: 'Tree',
    icon: TreePine,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  GRAPH: {
    label: 'Graph',
    icon: Network,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  },
  DYNAMIC_PROGRAMMING: {
    label: 'DP',
    icon: Zap,
    className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  },
  BACKTRACKING: {
    label: 'Backtracking',
    icon: RotateCcw,
    className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  },
  BINARY_SEARCH: {
    label: 'Binary Search',
    icon: SplitSquareHorizontal,
    className: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  },
  STACK_QUEUE: {
    label: 'Stack/Queue',
    icon: Layers,
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
  HASH_TABLE: {
    label: 'Hash Table',
    icon: Hash,
    className: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800',
  },
  MATH: {
    label: 'Math',
    icon: Calculator,
    className: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  },
  TWO_POINTERS: {
    label: 'Two Pointers',
    icon: ArrowLeftRight,
    className: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  },
  SLIDING_WINDOW: {
    label: 'Sliding Window',
    icon: Gauge,
    className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800',
  },
  GREEDY: {
    label: 'Greedy',
    icon: TrendingUp,
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  HEAP: {
    label: 'Heap',
    icon: Triangle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
  TRIE: {
    label: 'Trie',
    icon: BookOpen,
    className: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  },
}

export function CategoryBadge({
  category,
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}
