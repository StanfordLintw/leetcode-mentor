'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TestCase, TestResult } from '@/lib/judge0'

export interface TestCasePanelProps {
  testCases: TestCase[]
  results?: TestResult[]
  isRunning: boolean
}

function StatusBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        passed
          ? 'bg-emerald-900/60 text-emerald-300'
          : 'bg-red-900/60 text-red-300'
      }`}
    >
      {passed ? '✅ Passed' : '❌ Failed'}
    </span>
  )
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <pre className="overflow-x-auto rounded bg-zinc-950 px-3 py-2 text-sm text-zinc-200 whitespace-pre-wrap break-words">
        {value || <span className="text-zinc-500 italic">(empty)</span>}
      </pre>
    </div>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
      {label}: <span className="text-zinc-200">{value}</span>
    </span>
  )
}

export default function TestCasePanel({
  testCases,
  results,
  isRunning,
}: TestCasePanelProps) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100">
      <Tabs defaultValue="testcases">
        <div className="border-b border-zinc-700 px-4 pt-3">
          <TabsList className="bg-zinc-800 h-9">
            <TabsTrigger
              value="testcases"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 text-sm"
            >
              Test Cases
              <span className="ml-1.5 rounded-full bg-zinc-700 px-1.5 py-0.5 text-xs leading-none data-[state=active]:bg-zinc-600">
                {testCases.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 text-sm"
            >
              Results
              {results && results.length > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs leading-none ${
                    results.every((r) => r.passed)
                      ? 'bg-emerald-800 text-emerald-200'
                      : 'bg-red-800 text-red-200'
                  }`}
                >
                  {results.filter((r) => r.passed).length}/{results.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Test Cases Tab */}
        <TabsContent value="testcases" className="m-0">
          {testCases.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-zinc-500">
              No test cases available.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {testCases.map((tc, idx) => (
                <li key={idx} className="space-y-3 p-4">
                  <p className="text-xs font-semibold text-zinc-300">
                    Case {idx + 1}
                  </p>
                  <CodeBlock label="Input" value={tc.input} />
                  <CodeBlock label="Expected Output" value={tc.expected} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="m-0">
          {isRunning ? (
            <div className="flex h-28 flex-col items-center justify-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-zinc-600 border-t-zinc-200" />
              <p className="text-sm text-zinc-400">Running test cases…</p>
            </div>
          ) : !results || results.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-zinc-500">
              Run code to see results.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {results.map((result, idx) => (
                <li key={idx} className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-300">
                      Case {idx + 1}
                    </p>
                    <StatusBadge passed={result.passed} />
                  </div>

                  <CodeBlock label="Input" value={result.input} />
                  <CodeBlock label="Expected" value={result.expected} />
                  <CodeBlock label="Actual Output" value={result.actual} />

                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.time !== null && (
                      <MetaPill label="Time" value={`${result.time}s`} />
                    )}
                    {result.memory !== null && (
                      <MetaPill
                        label="Memory"
                        value={`${(result.memory / 1024).toFixed(1)} MB`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
