'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Language {
  value: string
  label: string
  icon: string
}

const LANGUAGES: Language[] = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
]

export interface LanguageSelectorProps {
  value: string
  onChange: (lang: string) => void
}

export default function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps) {
  const selected = LANGUAGES.find((l) => l.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="w-[180px] bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-zinc-500"
        aria-label="Select programming language"
      >
        <SelectValue>
          {selected ? (
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{selected.icon}</span>
              <span>{selected.label}</span>
            </span>
          ) : (
            'Select language'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
        {LANGUAGES.map((lang) => (
          <SelectItem
            key={lang.value}
            value={lang.value}
            className="focus:bg-zinc-700 focus:text-zinc-100 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{lang.icon}</span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
