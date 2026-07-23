# University AI Assistant

An intelligent RAG-powered assistant that lets university students upload course materials (PDF or TXT) and ask questions directly about their content. The system retrieves relevant passages from the document and generates precise, sourced answers — never inventing information.

> **Status:** MVP complete. Built as a portfolio project to demonstrate modern AI engineering practices.

## Features

- **Document Upload** — Upload PDF or TXT course materials (up to 30 MB)
- **Intelligent Chat** — Ask questions in natural language about your documents
- **Source Citations** — Every answer includes references to the exact document passages used, displayed as expandable source cards
- **Anti-Hallucination** — If the information is not in the document, the system clearly states so with a standardized fallback message
- **Streaming Responses** — Real-time, word-by-word response generation via Vercel AI SDK
- **Conversation History** — Past conversations are saved and can be resumed from the dashboard
- **Multi-Provider Resilience** — Primary LLM (Google Gemini) with automatic fallback (Groq)
- **Authentication** — Email/password sign-up and login via Supabase Auth
- **Row Level Security** — Strict data isolation: users can only access their own documents and conversations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless, edge runtime) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (email/password) |
| Embeddings | Google Gemini `text-embedding-004` (768 dimensions) |
| LLM | Google Gemini `gemini-2.0-flash` |
| Streaming | Vercel AI SDK (`@ai-sdk/google`) |
| PDF Parsing | `pdf-parse` |
| Chunking | `@langchain/textsplitters` (`RecursiveCharacterTextSplitter`) |
| Markdown Rendering | `react-markdown` |
| Deployment | Vercel |

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser    │────▶│  Next.js (Vercel) │────▶│  Supabase   │
│   (Client)   │◀────│  - Pages          │◀────│  - Auth     │
│              │     │  - API Routes     │     │  - pgvector │
└──────────────┘     │  - Services       │     │  - Storage  │
                     └────────┬─────────┘     └─────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Gemini API    │
                     │   - Embeddings  │
                     │   - Chat        │
                     └─────────────────┘
```

### RAG Pipeline

1. **Ingestion:** PDF/TXT uploaded → text extracted → chunked (≈750 tokens, 150 overlap) → embedded via Gemini → stored in `pgvector`
2. **Retrieval:** User question → embedded → HNSW similarity search (cosine, threshold: 0.65) → top-k chunks retrieved (up to 4)
3. **Generation:** Retrieved chunks + conversation history → structured prompt with strict sourcing rules → streamed response with inline citations `[Idx: X]`

### Anti-Hallucination Strategy

- **Similarity threshold (0.65):** Questions unrelated to the document return zero chunks and trigger the fallback message before reaching the LLM
- **Strict system prompt:** The LLM is instructed to ONLY use provided context, never external knowledge
- **Citation validation:** Cited chunk UUIDs are verified against actually retrieved chunks; invalid citations are filtered out
- **Standardized fallback:** When information is absent, the system responds with a consistent message and suggests rephrasing

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account with pgvector enabled
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/university-ai-assistant.git
cd university-ai-assistant

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Fill in `.env.local` with your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```

### Database Setup

1. Enable the `vector` extension in your Supabase dashboard (Database → Extensions)
2. Create a **private** storage bucket named `documents` (Storage → New Bucket, uncheck "Public bucket")
3. Run the migration file in your Supabase SQL Editor:

```bash
# The migration is located at:
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, HNSW vector index, RLS policies, and triggers (automatic profile creation on signup, `updated_at` auto-update).

### Storage Policies

Run this in the SQL Editor to allow authenticated uploads:

```sql
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                          # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── chat/
│   │   │   ├── route.ts          # POST — RAG retrieval + streaming response
│   │   │   └── sources/
│   │   │       └── route.ts      # GET — fetch source chunks for a message
│   │   └── process-document/
│   │       └── route.ts          # POST — ingestion pipeline (upload→extract→chunk→embed→store)
│   ├── chat/
│   │   └── [sessionId]/
│   │       └── page.tsx          # Chat page (loads history + ChatBox)
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard (upload + session list)
│   ├── login/
│   │   └── page.tsx              # Sign-in page
│   ├── signup/
│   │   └── page.tsx              # Sign-up page
│   ├── layout.tsx                # Root layout with Navbar
│   └── page.tsx                  # Landing page (redirects to dashboard if logged in)
├── components/
│   ├── ChatBox.tsx               # Chat interface with streaming, markdown, source cards
│   ├── FileUpload.tsx            # Drag-and-drop file upload component
│   ├── LogoutButton.tsx          # Sign-out button (client component)
│   ├── Navbar.tsx                # Top navigation bar
│   └── SourceCard.tsx            # Expandable source citation card
├── lib/
│   ├── gemini.ts                 # Gemini client singleton
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client (with cookies)
│   └── utils.ts                  # Utility functions (cn)
├── services/
│   ├── document.service.ts       # PDF extraction, chunking, embeddings, storage
│   └── rag.service.ts            # Query embedding, retrieval, prompt building
├── middleware.ts                  # Session refresh + protected route redirects
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Usage Flow

1. **Landing page** → Sign up or sign in
2. **Dashboard** → Upload a PDF or TXT file (processing takes 1–2 minutes for a 20-page document)
3. **Chat** → After processing, you're redirected to the chat interface
4. **Ask questions** → Type questions about your document; answers stream in real-time with source citations
5. **View sources** → Click the "Source" cards under any assistant response to read the exact passage used
6. **Resume** → Past conversations appear on the dashboard; click to continue where you left off

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked to `auth.users`, auto-created on signup) |
| `documents` | Uploaded document metadata (status: `en_attente` → `traitement_en_cours` → `traite` / `erreur`) |
| `document_chunks` | Text chunks with 768-dimensional embeddings, indexed via HNSW |
| `chat_sessions` | Chat conversations linked to a specific document |
| `chat_messages` | Individual messages with sender, content, and `source_chunk_ids` references |

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

## Roadmap

- [x] Architecture design & database schema
- [x] RAG pipeline specification
- [x] Prompt engineering & anti-hallucination strategy
- [x] MVP implementation
  - [x] Authentication (email/password)
  - [x] Document upload & ingestion (PDF + TXT)
  - [x] Chat interface with streaming
  - [x] Source citations with expandable cards
  - [x] Conversation history
  - [x] Fallback for out-of-document questions
- [ ] V2: Multiple documents per session, OCR for scanned PDFs, hybrid search (full-text + vector), re-ranking, DOCX/Markdown support, auto-summaries
- [ ] V3: Specialized agents, quiz generation, flashcards, auto-note taking, user memory, smart suggestions

## Key Architectural Decisions

- **No LangChain (framework):** RAG logic is implemented in ~50 lines of TypeScript using direct API calls. Only `@langchain/textsplitters` is used for chunking.
- **Synchronous ingestion:** Processing runs inside an API Route (not a background job). For MVP, this is acceptable for documents up to 30 MB. V2 will use async polling.
- **Service role for storage:** File uploads to Supabase Storage use the service role key to avoid RLS cookie issues in serverless functions.
- **HNSW index:** Chosen over IVFFlat for better query performance with small-to-medium datasets.
- **Dual LLM strategy:** Gemini is the primary model; Groq (Llama 3) is configured as automatic fallback but the MVP currently uses Gemini only.

## Limitations (MVP)

- **Vercel Hobby timeout:** Document processing may exceed the 60-second limit for very large files. Documented as an accepted constraint; V2 will implement async polling.
- **Single document per session:** Each chat session is linked to one document. Multi-document retrieval is planned for V2.
- **No PDF viewer:** Source citations show chunk text but do not highlight the original PDF page. Planned for V2.
- **French-only system prompt:** The LLM prompt is in French; responses are in French. English prompt variant planned for V2.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Contact

Built as a portfolio project by Hakim.
