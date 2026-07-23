import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embedQuery, retrieveChunks, formatChunksForContext, buildPromptMessages } from '@/services/rag.service'
import { google } from '@ai-sdk/google'
import {
  streamText,
  createUIMessageStreamResponse,
  toUIMessageStream,
  createIdGenerator,
  type ModelMessage,
} from 'ai'

export const runtime = 'edge'

const SYSTEM_PROMPT = `ROLE

You are an enterprise-grade AI document assistant operating inside a secure Retrieval-Augmented Generation (RAG) system.

Your only source of truth is the document context explicitly provided to you.

Never use outside knowledge.

--------------------------------------------------

STRICT RULES

1. Answer ONLY using information explicitly contained inside the provided document context.

2. If the context is empty or does not contain the answer, respond exactly with:

"I couldn't find relevant information in the document to answer your question."

3. Never guess.

4. Never infer.

5. Never hallucinate.

6. Never answer using your own knowledge.

7. Never mention chunks, embeddings, vector search, RAG, retrieval, or internal implementation.

--------------------------------------------------

CITATIONS

Every factual statement must end with a citation using this exact format:

[Idx: X](chunk_uuid)

Example:

Employees may work remotely two days per week.
[Idx: 14](8f3b9d4e-1234-5678-abcd-ef0123456789)

Never invent citations.

Only cite chunks that actually exist.

--------------------------------------------------

STYLE

- Professional
- Concise
- Markdown
- Bullet lists when useful
- Clear formatting`

interface IncomingMessagePart {
  type: string
  text?: string
}

interface IncomingMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: IncomingMessagePart[]
}

interface RequestBody {
  sessionId: string
  messages: IncomingMessage[]
}

interface ChatSession {
  document_id: string
  title: string
}

interface DocumentChunkRow {
  id: string
  chunk_index: number
}

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

// UIMessage in AI SDK v5+/v7 carries text in `parts`, not `content`.
// Support both shapes defensively.
function extractText(message: IncomingMessage | undefined): string {
  if (!message) return ''
  if (message.content) return message.content
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text)
      .join('')
  }
  return ''
}

// Deterministic, server-side message IDs so the assistant message ID
// generated here matches the ID the client receives via useChat/sendMessage,
// letting /api/chat/sources look the message up by the same ID.
const generateMessageId = createIdGenerator({ prefix: 'msg', size: 16 })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { sessionId, messages } = (await req.json()) as RequestBody

  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('document_id, title')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single<ChatSession>()

  if (sessionError || !session) {
    return new Response('Session not found', { status: 404 })
  }

  const documentId = session.document_id

  const lastUserMessage = extractText(messages[messages.length - 1])
  if (!lastUserMessage) {
    return new Response('No question provided', { status: 400 })
  }

  const { error: insertUserMsgError } = await supabase.from('chat_messages').insert({
    session_id: sessionId,
    user_id: user.id,
    sender: 'user',
    content: lastUserMessage,
  })
  if (insertUserMsgError) console.error('Failed to save user message:', insertUserMsgError)

  let queryEmbedding: number[]
  try {
    queryEmbedding = await embedQuery(lastUserMessage)
  } catch (err: unknown) {
    console.error('Embedding error:', err)
    return new Response(JSON.stringify({ error: 'Failed to process question' }), { status: 500 })
  }

  let chunks: Awaited<ReturnType<typeof retrieveChunks>>
  try {
    chunks = await retrieveChunks(queryEmbedding, user.id, documentId, 0.65, 4)
  } catch (err: unknown) {
    console.error('Retrieval error:', err)
    chunks = []
  }

  let contextBlock = ''
  const usedChunkIds: string[] = []
  if (chunks.length > 0) {
    const chunkIds = chunks.map(c => c.id)
    const { data: fullChunks } = await supabase
      .from('document_chunks')
      .select('id, chunk_index')
      .in('id', chunkIds)

    const typedFullChunks = (fullChunks as DocumentChunkRow[] | null) ?? []
    const chunkMap = new Map<string, number>(typedFullChunks.map(c => [c.id, c.chunk_index]))

    const formattedChunks = chunks.map(c => ({
      id: c.id,
      chunkIndex: chunkMap.get(c.id) ?? 0,
      content: c.content,
    }))
    contextBlock = formatChunksForContext(formattedChunks)
    usedChunkIds.push(...formattedChunks.map(c => c.id))
  }

  const historyMsgs: HistoryMessage[] = messages
    .slice(-6)
    .filter((m: IncomingMessage) => m.role === 'user' || m.role === 'assistant')
    .map((m: IncomingMessage) => ({ role: m.role as 'user' | 'assistant', content: extractText(m) }))

  const promptMessages = buildPromptMessages(
    SYSTEM_PROMPT,
    historyMsgs,
    contextBlock,
    lastUserMessage
  ) as Array<{ role: string; content: unknown }>

  // AI SDK 7 rejects `role: 'system'` messages inside `messages` by default;
  // system instructions must be passed via the top-level `instructions` option.
  const nonSystemPromptMessages = promptMessages.filter((m) => m.role !== 'system')

  const coreMessages: ModelMessage[] = nonSystemPromptMessages.map((m) => {
    const contentString = typeof m.content === 'string'
      ? m.content
      : JSON.stringify(m.content)

    return {
      role: (m.role === 'user' || m.role === 'assistant' ? m.role : 'user') as 'user' | 'assistant',
      content: contentString,
    }
  })

  const result = streamText({
    model: google('gemini-2.0-flash'),
    instructions: SYSTEM_PROMPT,
    messages: coreMessages,
  })

  const uiStream = toUIMessageStream({
    stream: result.stream,
    generateMessageId,
    onEnd: async ({ responseMessage }) => {
      // Extract the plain text back out of the UIMessage parts to run the
      // citation-extraction regex and to store a flat `content` column.
      const text = (responseMessage.parts ?? [])
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')

      const regex = /\[Idx: \d+\]\((.*?)\)/g
      const citedUUIDs = [...text.matchAll(regex)].map((m) => m[1])
      const validSourceIds = citedUUIDs.filter((id) => usedChunkIds.includes(id))

      const { error: insertAssistantError } = await supabase.from('chat_messages').insert({
        client_message_id: responseMessage.id,
        session_id: sessionId,
        user_id: user.id,
        sender: 'assistant',
        content: text,
        source_chunk_ids: validSourceIds,
      })
      if (insertAssistantError) console.error('Failed to save assistant message:', insertAssistantError)
    },
  })

  return createUIMessageStreamResponse({
    stream: uiStream,
  })
}