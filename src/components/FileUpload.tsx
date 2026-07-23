'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false) // Pour l'effet visuel du drag
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setError(null)
  }

  // Gestion du Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      // Validation basique du type de fichier
      if (selected.type === "application/pdf" || selected.type === "text/plain") {
        setFile(selected)
        setError(null)
      } else {
        setError("Fichier non supporté. Veuillez choisir un PDF ou TXT.")
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
    } catch (err: unknown) { // 1. CORRECTION TS : Toujours utiliser 'unknown' pour les erreurs
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 2. CORRECTION UX : Ajout des gestionnaires de drag & drop sur la zone dédiée */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        {/* Label étendu sur toute la zone pour permettre le clic n'importe où */}
        <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
          {file ? (
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drag and drop your PDF here, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF or TXT up to 30MB
              </p>
            </div>
          )}
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-opacity"
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing... (may take up to 2 minutes)
          </span>
        ) : (
          'Upload and Process'
        )}
      </button>
    </form>
  )
}
