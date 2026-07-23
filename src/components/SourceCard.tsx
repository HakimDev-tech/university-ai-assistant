'use client'

import { useState } from 'react'

interface SourceCardProps {
  index: number
  chunkId: string
  content: string
}

export default function SourceCard({ index, chunkId, content }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-2 border-l-2 border-blue-400 pl-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        📄 Source {index + 1}
        {expanded ? ' ▲' : ' ▼'}
      </button>

      {expanded && (
        <div className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
          <p className="text-gray-400 mb-1">ID: {chunkId.slice(0, 8)}...</p>
          <p>{content}</p>
        </div>
      )}
    </div>
  )
}