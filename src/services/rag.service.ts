import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/gemini'
import type { ModelMessage } from "ai";

// Embed a single text (the user question)
type RetrievedChunk = {
  id: string
  chunkIndex: number
  content: string,
  similarity?: number
}

// Output dimensionality must match the pgvector column (vector(768)) and the
// dimensionality used when embedding document chunks in generateEmbeddings().
// gemini-embedding-001 defaults to 3072 dims, which pgvector's HNSW/IVFFlat
// indexes cannot support (2000-dim hard limit), so we request 768 explicitly.
const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_DIMENSIONS = 768

export async function embedQuery(text: string): Promise<number[]> {
  const gemini = getGeminiClient()
  const response = await gemini.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  })

  const embeddingValues = response.embeddings?.[0]?.values

  if (!embeddingValues) {
    throw new Error('Failed to generate embedding for query: values are undefined')
  }

  return embeddingValues
}

// 1. Définition de la structure exacte retournée par la fonction RPC Supabase
interface MatchDocumentsResult {
  chunk_id: string
  content: string
  chunk_index: number | null
  similarity: number
}

// Retrieve relevant chunks from the document
export async function retrieveChunks(
  embedding: number[],
  userId: string,
  documentId: string,
  threshold: number = 0.65,
  topK: number = 4
): Promise<RetrievedChunk[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    target_user_id: userId,
    target_document_id: documentId,
    match_threshold: threshold,
    match_count: topK,
  })

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`)
  }

  const rows = (data ?? []) as MatchDocumentsResult[]

  return rows.map((row) => ({
    id: row.chunk_id,
    content: row.content,
    chunkIndex: row.chunk_index ?? 0,
    similarity: row.similarity,
  }))
}

// Format chunks for the context block
export function formatChunksForContext(
  chunks: RetrievedChunk[]
): string {
  return chunks
    .map(
      (chunk) =>
        `[SOURCE ID: ${chunk.id} | CHUNK_INDEX: ${chunk.chunkIndex}]\n${chunk.content}`
    )
    .join('\n\n')
}

// Build the array of messages for the AI SDK.
// Note: this returns a leading `role: 'system'` message for backward
// compatibility with older prompt-building call sites. AI SDK 7 rejects
// system-role messages inside `messages`/`prompt` by default, so callers
// using streamText/generateText in v7 should pass the system prompt via the
// top-level `instructions` option instead, and filter this system message out
// (or use allowSystemInMessages: true only for trusted, server-assembled
// arrays like this one).
export function buildPromptMessages(
  systemPrompt: string,
  history: {
    role: 'user' | 'assistant'
    content: string
  }[],
  context: string,
  question: string
): ModelMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...history,
    {
      role: 'user',
      content: `You must answer ONLY using the information contained in the document context below while strictly following the system instructions.

=== VALID DOCUMENT CONTEXT ===

${context || 'No relevant context found in documents.'}

=== USER QUESTION ===

${question}

=== RESPONSE ===`,
    },
  ]
}