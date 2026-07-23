import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  extractTextFromPDF,
  chunkText,
  generateEmbeddings,
  insertChunks,
} from '@/services/document.service'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'text/plain']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Only PDF and TXT are allowed.' }, { status: 400 })
  }

  // Validate size (max 30 MB)
  const maxSize = 30 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large. Maximum size is 30 MB.' }, { status: 400 })
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const originalName = file.name

  // 1. Upload file to Supabase Storage (private bucket) using service role key
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const storagePath = `${user.id}/${Date.now()}_${originalName}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 })
  }

  // 2. Create document record with status 'traitement_en_cours'
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      filename: originalName,
      storage_path: storagePath,
      status: 'traitement_en_cours',
    })
    .select()
    .single()

  if (docError || !document) {
    // Cleanup the uploaded file using admin client
    await supabaseAdmin.storage.from('documents').remove([storagePath])
    return NextResponse.json({ error: 'Failed to create document record.' }, { status: 500 })
  }

  try {
    let text = ''

    // 3. Adaptive extraction based on file MIME type
    if (file.type === 'text/plain') {
      text = fileBuffer.toString('utf-8')
    } else {
      text = await extractTextFromPDF(fileBuffer)
    }

    // 4. Chunk
    const chunks = await chunkText(text)

    // 5. Embed
    const embeddings = await generateEmbeddings(chunks)

    // 6. Insert chunks with embeddings
    await insertChunks(
      document.id,
      user.id,
      chunks.map((content, idx) => ({
        content,
        chunkIndex: idx,
        embedding: embeddings[idx],
      }))
    )

    // 7. Update document status to 'traite'
    await supabase
      .from('documents')
      .update({ status: 'traite' })
      .eq('id', document.id)

    // 8. Create a chat session linked to this document
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        document_id: document.id,
        title: `Chat about ${originalName}`,
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    return NextResponse.json({
      success: true,
      documentId: document.id,
      sessionId: session.id,
    })
  } catch (err: unknown) {
    // Mark document as error
    await supabase.from('documents').update({ status: 'erreur' }).eq('id', document.id)
    console.error('Processing error:', err)
    
    const errorMessage = err instanceof Error ? err.message : 'Processing failed.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}