'use client'

import dynamic from 'next/dynamic'
import type { OnMount } from '@monaco-editor/react'

// Lazy-load Monaco to avoid SSR issues — the bundle is large and
// references browser-only globals that would crash during server render.
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorLoadingSpinner />,
})

function EditorLoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center bg-[#1e1e1e]"
      style={{ height: '100%', minHeight: '200px' }}
      aria-label="Loading editor"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-zinc-200" />
        <span className="text-sm text-zinc-400">Loading editor…</span>
      </div>
    </div>
  )
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
}

export interface CodeEditorProps {
  code: string
  language: string
  onChange: (code: string) => void
  readOnly?: boolean
  height?: string
}

export default function CodeEditor({
  code,
  language,
  onChange,
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const monacoLanguage = MONACO_LANGUAGE_MAP[language.toLowerCase()] ?? language

  const handleMount: OnMount = (editor) => {
    // Focus the editor on mount when not read-only
    if (!readOnly) {
      editor.focus()
    }
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-md border border-zinc-700">
      <MonacoEditor
        height={height}
        language={monacoLanguage}
        value={code}
        theme="vs-dark"
        onChange={(value) => onChange(value ?? '')}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          readOnly,
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  )
}
