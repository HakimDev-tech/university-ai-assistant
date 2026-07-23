import 'pdf-parse/worker' // doit être importé AVANT pdf-parse
import { PDFParse } from 'pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/gemini'

// Dynamically import pdf-parse to avoid ESM/CJS issues
async function getPdfParseFunction() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import('pdf-parse')
  return (mod.default || mod) as (buffer: Buffer) => Promise<{
    text: string
    numpages: number
    info: Record<string, unknown>
  }>
}

// Extract text from a PDF buffer
export async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: fileBuffer })
  const result = await parser.getText()

  if (!result.text || result.text.trim().length === 0) {
    throw new Error('No text found in PDF. It may be a scanned document.')
  }
  return result.text
}

// Split text into chunks of ~750 tokens (≈3000 chars) with 150 token overlap (≈600 chars)
export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 3000,
    chunkOverlap: 600,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  })
  const chunks = await splitter.splitText(text)
  if (chunks.length === 0) {
    throw new Error('Chunking produced no chunks.')
  }
  return chunks
}

// Generate embeddings for an array of texts, processing in batches of 20
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const gemini = getGeminiClient()
  const batchSize = 20
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const response = await gemini.models.embedContent({
      model: 'gemini-embedding-001',
      contents: batch.map((text) => ({ parts: [{ text }] })),
      config: {
        outputDimensionality: 768,
      },
    })

    if (!response.embeddings || response.embeddings.length !== batch.length) {
      throw new Error(
        `Embedding generation failed: expected ${batch.length} embeddings, got ${response.embeddings?.length ?? 0}`
      )
    }

    for (const embedding of response.embeddings) {
      allEmbeddings.push(embedding.values!)
    }
  }

  return allEmbeddings
}

// Insert chunks with embeddings into document_chunks table
export async function insertChunks(
  documentId: string,
  userId: string,
  chunks: { content: string; chunkIndex: number; embedding: number[] }[]
): Promise<void> {
  const supabase = await createClient()
  const rows = chunks.map((c) => ({
    document_id: documentId,
    user_id: userId,
    content: c.content,
    embedding: c.embedding,
    chunk_index: c.chunkIndex,
  }))

  const { error } = await supabase.from('document_chunks').insert(rows)
  if (error) throw error
}