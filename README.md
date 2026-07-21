```markdown
# University AI Assistant

An intelligent RAG-powered assistant that lets university students upload course materials (PDF) and ask questions directly about their content. The system retrieves relevant passages from the document and generates precise, sourced answers — never inventing information.

> **Status:** MVP in development. Built as a portfolio project to demonstrate modern AI engineering practices.

## Features

- **Document Upload** — Upload PDF course materials (up to 20 MB)
- **Intelligent Chat** — Ask questions in natural language about your documents
- **Source Citations** — Every answer includes references to the exact document passages used
- **Anti-Hallucination** — If the information is not in the document, the system clearly states so
- **Streaming Responses** — Real-time, word-by-word response generation via Vercel AI SDK
- **Conversation History** — Past conversations are saved and can be resumed
- **Multi-Provider Resilience** — Primary LLM (Gemini) with automatic fallback (Groq)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | Google Gemini `text-embedding-004` (768d) |
| LLM | Google Gemini (primary) / Groq (fallback) |
| Streaming | Vercel AI SDK |
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

1. **Ingestion:** PDF uploaded → text extracted → chunked (750 tokens, 150 overlap) → embedded via Gemini → stored in `pgvector`
2. **Retrieval:** User question → embedded → similarity search (cosine) → top-k chunks retrieved (threshold: 0.65)
3. **Generation:** Retrieved chunks + conversation history → structured prompt → streamed response with inline citations

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

Run the migration file in your Supabase SQL Editor:

```bash
# The migration is located at:
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, RLS policies, and triggers.

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Protected routes (dashboard, chat)
│   ├── api/
│   │   ├── process-document/  # Ingestion pipeline
│   │   └── chat/              # Retrieval + generation
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Reusable UI components
│   └── ui/                 # Shadcn/ui components
├── lib/                    # Configuration & clients
│   ├── supabase/
│   │   ├── server.ts       # Server-side Supabase client
│   │   └── client.ts       # Browser Supabase client
│   └── utils.ts
├── services/               # Business logic
│   ├── document.service.ts # Extraction, chunking, embedding
│   └── rag.service.ts      # Retrieval, prompt building
└── types/                  # TypeScript type definitions
    └── index.ts
```

## Roadmap

- [x] Architecture design & database schema
- [x] RAG pipeline specification
- [x] Prompt engineering & anti-hallucination strategy
- [ ] MVP implementation (in progress)
  - [ ] Authentication
  - [ ] Document upload & ingestion
  - [ ] Chat interface with streaming
  - [ ] Source citations
  - [ ] Conversation history
- [ ] V2: Multi-document support, OCR, hybrid search, re-ranking
- [ ] V3: Specialized agents, quiz generation, flashcards

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Contact

Built as a portfolio project by [Your Name] — [Your LinkedIn/Twitter/Website]
```
