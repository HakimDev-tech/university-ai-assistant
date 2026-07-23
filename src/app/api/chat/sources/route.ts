import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ChatMessageRow {
  id: string
  session_id: string
  source_chunk_ids: string[] | null
}

interface DocumentChunkRow {
  id: string
  chunk_index: number
  content: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const messageId = searchParams.get('messageId')

  if (!sessionId || !messageId) {
    return new Response('Missing sessionId or messageId', { status: 400 })
  }

  // Verify the session belongs to the user before looking up messages.
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return new Response('Session not found', { status: 404 })
  }

  // messageId here is the client-generated UIMessage id (e.g. "msg_xxx"),
  // set server-side via generateMessageId in /api/chat and stored in
  // client_message_id — not the row's own uuid primary key.
  const { data: message, error: messageError } = await supabase
    .from('chat_messages')
    .select('id, session_id, source_chunk_ids')
    .eq('session_id', sessionId)
    .eq('client_message_id', messageId)
    .single<ChatMessageRow>()

  if (messageError || !message) {
    return new Response(JSON.stringify({ sources: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sourceChunkIds = message.source_chunk_ids ?? []
  if (sourceChunkIds.length === 0) {
    return new Response(JSON.stringify({ sources: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: chunks, error: chunksError } = await supabase
    .from('document_chunks')
    .select('id, chunk_index, content')
    .in('id', sourceChunkIds)

  if (chunksError) {
    console.error('Failed to load source chunks:', chunksError)
    return new Response(JSON.stringify({ sources: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const typedChunks = (chunks ?? []) as DocumentChunkRow[]

  // Preserve citation order as they appeared in source_chunk_ids.
  const orderedSources = sourceChunkIds
    .map((id) => typedChunks.find((c) => c.id === id))
    .filter((c): c is DocumentChunkRow => Boolean(c))
    .map((c) => ({
      id: c.id,
      chunkIndex: c.chunk_index,
      content: c.content,
    }))

  return new Response(JSON.stringify({ sources: orderedSources }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}