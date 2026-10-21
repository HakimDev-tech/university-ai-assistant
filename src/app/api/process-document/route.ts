import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import {
  extractTextFromPDF,
  chunkText,
  generateEmbeddings,
  insertChunks,
} from '@/services/document.service'

const MAX_FILE_BYTES = 30 * 1024 * 1024
const MAX_EXTRACTED_CHARS = 1_000_000
const ALLOWED_TYPES = new Set(['application/pdf', 'text/plain'])

function safeFilename(name: string): string {
  const normalized = name.normalize('NFKC').replace(/[\\/\\\\]/g, '_').replace(/[\u0000-\u001f\u007f]/g, '')
  const safe = normalized.replace(/[^a-zA-Z0-9._() -]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120)
  return safe && safe !== '.' && safe !== '..' ? safe : 'course-material'
}

function isPdf(bytes: Uint8Array): boolean {
  return bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart upload' }, { status: 400 })
  }

  const candidate = formData.get('file')
  if (!(candidate instanceof File)) {
    return NextResponse.json({ error: 'Choose a PDF or TXT file' }, { status: 400 })
  }
  const file = candidate
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only PDF and plain-text files are supported' }, { status: 415 })
  }
  if (file.size === 0) return NextResponse.json({ error: 'The selected file is empty' }, { status: 400 })
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'The maximum file size is 30 MB' }, { status: 413 })
  }
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf' && !isPdf(fileBuffer)) {
    return NextResponse.json({ error: 'The file content does not look like a PDF' }, { status: 415 })
  }
  if (file.type === 'text/plain' && fileBuffer.includes(0)) {
    return NextResponse.json({ error: 'The text file contains binary data' }, { status: 415 })
  }

  const originalName = safeFilename(file.name)
  const storagePath = `${user.id}/${randomUUID()}_${originalName}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('Document storage upload failed')
    return NextResponse.json({ error: 'The file could not be stored' }, { status: 503 })
  }

  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      filename: originalName,
      storage_path: storagePath,
      status: 'traitement_en_cours',
      error_code: null,
    })
    .select('id')
    .single()

  if (docError || !document) {
    await supabase.storage.from('documents').remove([storagePath])
    console.error('Document record creation failed')
    return NextResponse.json({ error: 'The document could not be registered' }, { status: 503 })
  }

  try {
    const extractedText = file.type === 'text/plain'
      ? fileBuffer.toString('utf8')
      : await extractTextFromPDF(fileBuffer)

    const text = extractedText.replace(/\u0000/g, '').trim()
    if (!text) throw new Error('EMPTY_DOCUMENT')
    if (text.length > MAX_EXTRACTED_CHARS) throw new Error('DOCUMENT_TEXT_LIMIT')

    const chunks = await chunkText(text)
    const embeddings = await generateEmbeddings(chunks)
    if (embeddings.length !== chunks.length || embeddings.some(vector => vector.length !== 768 || vector.some(value => !Number.isFinite(value)))) {
      throw new Error('EMBEDDING_SHAPE_INVALID')
    }

    await insertChunks(document.id, user.id, chunks.map((content, index) => ({
      content,
      chunkIndex: index,
      embedding: embeddings[index],
    })))

    const { error: statusError } = await supabase
      .from('documents')
      .update({ status: 'traite', error_code: null })
      .eq('id', document.id)
      .eq('user_id', user.id)
    if (statusError) throw new Error('DOCUMENT_STATUS_UPDATE_FAILED')

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, document_id: document.id, title: `Study: ${originalName.slice(0, 100)}` })
      .select('id')
      .single()

    if (sessionError || !session) throw new Error('SESSION_CREATION_FAILED')

    return NextResponse.json({ success: true, documentId: document.id, sessionId: session.id })
  } catch (error: unknown) {
    const code = error instanceof Error && ['EMPTY_DOCUMENT', 'DOCUMENT_TEXT_LIMIT', 'EMBEDDING_SHAPE_INVALID'].includes(error.message)
      ? error.message
      : 'PROCESSING_FAILED'

    await supabase.from('documents')
      .update({ status: 'erreur', error_code: code })
      .eq('id', document.id)
      .eq('user_id', user.id)

    console.error('Document processing failed', { code, documentId: document.id })
    return NextResponse.json({
      error: code === 'EMPTY_DOCUMENT'
        ? 'No readable text was found in this file. Scanned PDFs need OCR.'
        : code === 'DOCUMENT_TEXT_LIMIT'
          ? 'This file contains too much extracted text for the current processing limit.'
          : 'The document could not be processed. The failed item is recorded so it can be diagnosed.',
      documentId: document.id,
      status: 'erreur',
    }, { status: 422 })
  }
}
