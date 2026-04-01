'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'

interface HeatmapData {
  date: string
  count: number
}

interface SubmissionHeatmapProps {
  data: HeatmapData[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function getCellColor(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2) return 'bg-green-900'
  if (count <= 5) return 'bg-green-700'
  return 'bg-green-500'
}

/** Build a 52×7 grid starting from (today - 364 days), aligned so column 0 = oldest Sunday */
function buildGrid(data: HeatmapData[]): { date: string; count: number }[][] {
  const countMap = new Map<string, number>(data.map((d) => [d.date, d.count]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the Sunday at or before 364 days ago
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 364)
  // Rewind to previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // Build 53 columns × 7 rows (some columns may be partial)
  const grid: { date: string; count: number }[][] = []
  const cursor = new Date(startDate)

  while (cursor <= today) {
    const week: { date: string; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().split('T')[0]
      week.push({ date: key, count: countMap.get(key) ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    grid.push(week)
  }

  return grid
}

/** Return month label positions (column index where month first appears) */
function getMonthLabels(grid: { date: string; count: number }[][]): { label: string; col: number }[] {
  const seen = new Set<string>()
  const labels: { label: string; col: number }[] = []
  grid.forEach((week, col) => {
    const firstDay = week.find((c) => c.date)
    if (!firstDay) return
    const d = parseISO(firstDay.date)
    const month = MONTHS[d.getMonth()]
    if (!seen.has(month)) {
      seen.add(month)
      labels.push({ label: month, col })
    }
  })
  return labels
}

export function SubmissionHeatmap({ data }: SubmissionHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)
  const grid = buildGrid(data)
  const monthLabels = getMonthLabels(grid)

  const CELL = 12
  const GAP = 2
  const STEP = CELL + GAP
  const LEFT_OFFSET = 28 // space for day labels
  const TOP_OFFSET = 20 // space for month labels
  const svgWidth = LEFT_OFFSET + grid.length * STEP
  const svgHeight = TOP_OFFSET + 7 * STEP

  return (
    <div className="overflow-x-auto">
      <div className="relative inline-block min-w-full">
        {/* Month labels */}
        <div
          className="relative"
          style={{ height: TOP_OFFSET, marginLeft: LEFT_OFFSET, width: grid.length * STEP }}
        >
          {monthLabels.map(({ label, col }) => (
            <span
              key={label}
              className="absolute text-[10px] text-zinc-500 select-none"
              style={{ left: col * STEP }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col" style={{ width: LEFT_OFFSET }}>
            {DAYS.map((day, i) => (
              <div
                key={day}
                className="text-[10px] text-zinc-500 select-none flex items-center"
                style={{ height: STEP, visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="flex gap-[2px] relative">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${getCellColor(cell.count)}`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLDivElement).getBoundingClientRect()
                      setTooltip({ ...cell, x: rect.left, y: rect.top })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end text-xs text-zinc-500">
          <span>Less</span>
          {['bg-zinc-800', 'bg-green-900', 'bg-green-700', 'bg-green-500'].map((cls) => (
            <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Tooltip rendered in a portal-like fixed position */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 shadow-lg"
          style={{ top: tooltip.y - 36, left: tooltip.x - 20 }}
        >
          <div className="font-medium">{format(parseISO(tooltip.date), 'MMM d, yyyy')}</div>
          <div className="text-zinc-400">{tooltip.count} submission{tooltip.count !== 1 ? 's' : ''}</div>
        </div>
      )}
    </div>
  )
}
