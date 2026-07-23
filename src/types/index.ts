// Auth
export type User = {
  id: string
  email: string
  created_at: string
}

// Document
export type DocumentStatus = 'en_attente' | 'traitement_en_cours' | 'traite' | 'erreur'

export type Document = {
  id: string
  user_id: string
  filename: string
  storage_path: string
  status: DocumentStatus
  created_at: string
}

// Chunk
export type DocumentChunk = {
  id: string
  document_id: string
  user_id: string
  content: string
  embedding: number[]
  chunk_index: number
  created_at: string
}

// Chat
export type ChatSession = {
  id: string
  user_id: string
  document_id: string
  title: string
  created_at: string
  updated_at: string
}

export type MessageSender = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  session_id: string
  user_id: string
  sender: MessageSender
  content: string
  source_chunk_ids: string[]
  created_at: string
}