'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, LoaderCircle, ArrowUpRight, X } from 'lucide-react'

const MAX_BYTES = 30 * 1024 * 1024

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function chooseFile(selected: File | null) {
    setError(null)
    if (!selected) { setFile(null); return }
    if (!['application/pdf', 'text/plain'].includes(selected.type)) {
      setFile(null)
      setError('This format is not supported. Choose a PDF or plain-text file.')
      return
    }
    if (selected.size === 0) {
      setFile(null)
      setError('This file is empty.')
      return
    }
    if (selected.size > MAX_BYTES) {
      setFile(null)
      setError('The file exceeds the 30 MB limit.')
      return
    }
    setFile(selected)
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true)
    if (e.type === 'dragleave') setIsDragActive(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    chooseFile(e.dataTransfer.files?.[0] ?? null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file || uploading) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/process-document', { method: 'POST', body: formData })
      const data: { error?: string; sessionId?: string } = await res.json()
      if (!res.ok) throw new Error(data.error || 'The document could not be processed.')
      if (!data.sessionId) throw new Error('Processing completed without a conversation link.')
      router.push(`/chat/${data.sessionId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`upload-zone px-5 py-8 sm:px-8 ${isDragActive ? 'is-active' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={e => chooseFile(e.target.files?.[0] ?? null)}
          className="sr-only"
          id="file-upload"
          aria-describedby="upload-hint"
        />
        {file ? (
          <div className="flex w-full max-w-md items-center gap-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-surface"><FileText size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="mt-1 font-mono text-[10px] text-ink-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to process</p>
            </div>
            <button type="button" onClick={() => { chooseFile(null); if (inputRef.current) inputRef.current.value = '' }} className="p-2 text-ink-muted hover:text-error" aria-label="Remove selected file"><X size={15} /></button>
          </div>
        ) : (
          <>
            <div className="mb-4 grid h-11 w-11 place-items-center border border-border bg-surface"><UploadCloud size={20} strokeWidth={1.4} /></div>
            <p className="text-sm font-semibold">Drop a course file here</p>
            <p id="upload-hint" className="mt-2 text-xs text-ink-muted">PDF or TXT · Up to 30 MB</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary mt-5 !min-h-9 !px-3">Choose file <ArrowUpRight size={13} /></button>
          </>
        )}
      </div>

      {error && <p role="alert" className="border border-error/25 bg-error-bg px-3 py-2 text-xs leading-5 text-error">{error}</p>}

      <button type="submit" disabled={!file || uploading} className="btn-primary w-full">
        {uploading ? <><LoaderCircle size={15} className="animate-spin" /> Preparing source…</> : <>Prepare document <ArrowUpRight size={14} /></>}
      </button>
      <p className="text-center text-[10px] leading-5 text-ink-muted">Text extraction and indexing happen before the study thread opens. Scanned PDFs currently require OCR outside this version.</p>
    </form>
  )
}
