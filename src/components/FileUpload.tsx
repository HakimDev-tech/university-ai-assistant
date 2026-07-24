'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, Loader2 } from 'lucide-react'

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      if (
        selected.type === 'application/pdf' ||
        selected.type === 'text/plain'
      ) {
        setFile(selected)
        setError(null)
      } else {
        setError('Format non supporté. Choisis un PDF ou un fichier TXT.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      router.push(`/chat/${data.sessionId}`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Une erreur inattendue est survenue.')
      }
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          isDragActive
            ? 'scale-[1.01] border-violet-500 bg-violet-50'
            : 'border-border bg-canvas-inset hover:border-violet-300 hover:bg-violet-50/40'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex h-full w-full cursor-pointer flex-col items-center gap-3"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-200 ${
              isDragActive
                ? 'bg-violet-600 text-white'
                : 'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white'
            }`}
          >
            {file ? <FileText className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
          </div>

          {file ? (
            <p className="text-sm font-medium text-ink-primary">{file.name}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-ink-primary">
                Glisse ton PDF ici, ou clique pour parcourir
              </p>
              <p className="mt-1 text-xs text-ink-muted">PDF ou TXT jusqu&apos;à 30 Mo</p>
            </div>
          )}
        </label>
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/30 transition-all duration-150 hover:scale-[1.01] hover:bg-violet-700 disabled:pointer-events-none disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Traitement en cours... (jusqu&apos;à 2 minutes)
          </>
        ) : (
          'Envoyer et traiter'
        )}
      </button>
    </form>
  )
}
