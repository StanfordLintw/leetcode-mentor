import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: LucideIcon
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'default'
}

const colorMap: Record<NonNullable<StatsCardProps['color']>, string> = {
  default: 'text-foreground',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
}

const iconBgMap: Record<NonNullable<StatsCardProps['color']>, string> = {
  default: 'bg-zinc-800',
  green: 'bg-green-900/40',
  yellow: 'bg-yellow-900/40',
  red: 'bg-red-900/40',
  blue: 'bg-blue-900/40',
  purple: 'bg-purple-900/40',
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'default',
}: StatsCardProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconBgMap[color])}>
            <Icon className={cn('h-4 w-4', colorMap[color])} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold', colorMap[color])}>{value}</div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
