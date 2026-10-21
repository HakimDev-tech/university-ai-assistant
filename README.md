# Margin — Study from the source

Margin is a source-first study desk for university material. Upload a course PDF or plain-text file, ask a question, and inspect the passages that support the response.

The product principle is deliberately narrow: **an answer should be checkable against the material it claims to explain.** Margin is not a general-purpose chatbot and does not promise that every generated answer is correct.

## Product principles

- **Evidence before fluency.** Retrieve passages from the selected document before generating a response.
- **Visible provenance.** Answers can link back to the source chunks that were retrieved.
- **Fail honestly.** When retrieval finds no relevant passage, the assistant should say the material does not contain enough evidence.
- **Private by account.** Authenticated users should only access their own documents, chunks, study threads and messages.
- **A study instrument, not an AI template.** The interface uses editorial typography, paper-like surfaces, restrained color, source annotations and a clear information hierarchy.

## Current capabilities

- Email/password authentication with Supabase Auth.
- PDF and TXT upload, extraction, chunking and Gemini embeddings.
- Document-specific vector retrieval using Supabase PostgreSQL + pgvector.
- Streaming answers using the Vercel AI SDK and Gemini.
- Saved study conversations and expandable source excerpts.
- Owner-scoped Row Level Security policies in the database migration.

## Stack

| Layer | Implementation |
|---|---|
| Product UI | Next.js App Router, React, Tailwind CSS v4 |
| Identity | Supabase Auth |
| Data and access | PostgreSQL, Supabase RLS, pgvector |
| Document processing | pdf-parse, @langchain/textsplitters |
| Embeddings | Gemini gemini-embedding-001, 768 dimensions |
| Answer generation | Gemini gemini-2.5-flash via AI SDK |
| Streaming | ai, @ai-sdk/react, @ai-sdk/google |
| Deployment target | Vercel / Node-compatible runtime for ingestion |

## Local setup

Requirements: Node.js compatible with the installed Next.js version, npm, a Supabase project and a Google AI Studio API key.

1. Clone this repository and enter its directory.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Fill in the Supabase project URL, public anon key, server-only service role key and Gemini API key.
5. Review and run the database migration described below.
6. Run npm run dev. Use npm run lint and npm run build before deployment.

Never commit .env.local, service-role keys or provider credentials. The service-role key is server-only and must never be prefixed with NEXT_PUBLIC_.

## Database

Review and run supabase/migrations/001_initial_schema.sql in the Supabase SQL editor for a **new or empty project**. It creates the tables, vector index, retrieval RPC, ownership policies and private Storage bucket used by the current code.

Do not run the initial migration blindly against a database containing existing production data. Compare the live schema and take a backup first. The application has not been integration-tested against your Supabase project.

## Architecture

1. **Authenticate.** The server verifies the Supabase user and confirms that the study session belongs to them.
2. **Ingest.** Validate file type/size, store it in a private bucket, extract bounded text, split it into chunks, generate 768-dimensional embeddings and persist the chunks.
3. **Retrieve.** Embed the current question and search only the selected document and authenticated user's chunks.
4. **Answer.** Pass retrieved excerpts as untrusted evidence to Gemini, stream the answer and validate cited chunk IDs against the retrieved set before storing them.
5. **Inspect.** The UI lets the student expand the source excerpts attached to a response.

See docs/ARCHITECTURE.md, docs/VISUAL_IDENTITY.md and docs/QUALITY_GATES.md for implementation boundaries and release checks.

## Known limitations — do not mistake these for solved problems

- The ingestion route is synchronous. Large documents can exceed serverless execution limits; background jobs are not implemented.
- Scanned PDFs need OCR, which is not implemented.
- Retrieval uses a single vector similarity threshold. Hybrid search, reranking and evaluation-based threshold tuning are not implemented.
- This is not yet a validated production release. Rate limiting, usage quotas, background ingestion, robust streaming failure recovery and automated integration tests remain to be implemented.
- Citation ID validation verifies that cited IDs came from retrieved chunks; it does not prove that every generated claim is semantically supported by its citation.
- The database migration is a clean-install baseline. Existing database migrations and live data must be reconciled before rollout.

## Project status

The refactor/learning-desk-v2 branch introduces the Margin identity, rebuilt core screens, stricter request and ingestion validation, a reproducible database migration, and updated architecture/verification docs. Review the pull request and run the release checks before merging into main.
