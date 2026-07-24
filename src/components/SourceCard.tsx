'use client'

import { useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'

interface SourceCardProps {
  index: number
  chunkId: string
  content: string
}

// Cycle of accent tones so each source gets a distinct, memorable color —
// echoing a highlighter-marker system across a document.
const MARKER_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
]

export default function SourceCard({ index, chunkId, content }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const marker = MARKER_COLORS[index % MARKER_COLORS.length]

  return (
    <div
      className={`overflow-hidden rounded-xl border border-transparent bg-white shadow-sm shadow-violet-900/5 ring-1 ${marker.ring} transition-all duration-200`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-canvas-hover/60"
      >
        <span className="flex items-center gap-2">
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${marker.bg} ${marker.text}`}
          >
            {index + 1}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
            <FileText className="h-3 w-3" />
            Source {index + 1}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-muted transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="border-t border-border/60 px-3 py-2.5 text-xs leading-relaxed text-ink-secondary">
          {content.length > 300 ? content.slice(0, 300) + '...' : content}
        </div>
      )}
    </div>
  )
}
