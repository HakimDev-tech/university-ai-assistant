'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, Trash2, X } from 'lucide-react'

export default function ChatSessionActions({ sessionId, title }: { sessionId: string; title: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function rename() {
    if (!value.trim() || value.trim() === title) { setEditing(false); return }
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: value.trim() }),
      })
      if (!res.ok) throw new Error('Rename failed')
      setEditing(false); router.refresh()
    } catch { setError('The title could not be saved.') } finally { setBusy(false) }
  }

  async function remove() {
    if (!window.confirm('Delete this conversation and its complete version history? This cannot be undone.')) return
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.replace('/dashboard'); router.refresh()
    } catch { setError('The conversation could not be deleted.') } finally { setBusy(false) }
  }

  return (
    <div className="session-actions">
      {editing ? (
        <div className="session-rename">
          <input aria-label="Conversation name" maxLength={120} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void rename(); if (e.key === 'Escape') setEditing(false) }} autoFocus />
          <button type="button" aria-label="Save title" disabled={busy || !value.trim()} onClick={() => void rename()}><Check size={15} /></button>
          <button type="button" aria-label="Cancel rename" onClick={() => { setValue(title); setEditing(false) }}><X size={15} /></button>
        </div>
      ) : (
        <>
          <button type="button" className="icon-action" aria-label="Rename conversation" onClick={() => setEditing(true)}><Pencil size={15} /><span>Rename</span></button>
          <button type="button" className="icon-action icon-action-danger" aria-label="Delete conversation" disabled={busy} onClick={() => void remove()}><Trash2 size={15} /><span>Delete</span></button>
        </>
      )}
      {error && <span role="alert" className="session-action-error">{error}</span>}
    </div>
  )
}
