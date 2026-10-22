'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Quote } from 'lucide-react'

interface SourceCardProps {
  index: number
  chunkId: string
  chunkIndex: number
  content: string
}

export default function SourceCard({ index, chunkId, chunkIndex, content }: SourceCardProps) {
  const [open, setOpen] = useState(false)
  return (
    <div id={`source-${chunkId}`} className="source-card scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Quote size={13} strokeWidth={1.5} className="shrink-0 text-brand-700" />
          <span className="font-mono text-[10px] text-ink-secondary">SOURCE {String(index + 1).padStart(2, '0')} / PASSAGE {String(chunkIndex + 1).padStart(2, '0')}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center gap-2 eyebrow"><FileText size={11} /> Retrieved excerpt</div>
          <p className="whitespace-pre-wrap text-xs leading-6 text-ink-secondary">{content}</p>
          <p className="mt-3 font-mono text-[9px] text-ink-muted">CHUNK REF · {chunkId}</p>
        </div>
      )}
    </div>
  )
}
