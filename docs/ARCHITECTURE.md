# Margin — architecture and trust boundaries

## System map

Browser → Supabase Auth session → Next.js server routes.

Document ingestion: validate file type, size and signature → private Supabase Storage → bounded text extraction and chunking → Gemini embeddings → document_chunks.

Study conversation: verify session ownership → load persisted conversation history → embed current question → owner/document-scoped pgvector retrieval → Gemini streamed answer → validate cited IDs → persist answer and source IDs → UI expands retrieved excerpts.

## Data model

- profiles: profile row linked to auth.users.
- documents: user-owned document metadata, storage path, processing state and non-sensitive error code.
- document_chunks: extracted chunk text, owner, document, sequence index and 768-dimensional embedding.
- chat_sessions: one document per study thread in this MVP.
- chat_messages: user/assistant messages and source chunk IDs attached to an assistant answer.

The initial SQL migration is a clean-install baseline. Reconcile it with any live database before use.

## Security boundaries

### Identity and authorization

- Authenticate with supabase.auth.getUser() on server routes.
- Verify session ownership before loading conversation history or retrieving content.
- RLS protects user-owned rows. The vector RPC also checks auth.uid() = target_user_id.
- The server-only Supabase service role is used only for Storage operations that currently require it; never expose it to the browser.

### Untrusted inputs

- Treat uploaded files, extracted text, retrieved passages, and user questions as untrusted data.
- Validate request shape and cap question, file and extracted-text sizes.
- Use persisted server-side chat history; do not trust client-submitted assistant messages as authoritative conversation history.
- A prompt is not a security boundary by itself. Database ownership checks and deterministic request validation must enforce access control.

### Evidence contract

- Retrieve chunks only from the selected, user-owned document.
- Format each chunk with an explicit source number and chunk ID.
- Ask the model to cite only IDs present in context.
- At stream completion, persist only cited IDs found in the actual retrieval set.
- This validates citation membership, not semantic entailment. A future evaluation layer should test whether cited passages truly support claims.

## Current design decisions

- **One document per session:** simple and easy to reason about; multi-document collections are future work.
- **768-dimensional embeddings:** matches the current embedding request and SQL vector column. If the model/dimensions change, re-embed existing chunks and migrate the index.
- **Vector-only retrieval:** intentionally small MVP. Hybrid search and reranking require evaluation data, not assumptions.
- **Synchronous ingestion:** simple to operate but unsuitable for long documents on serverless. Move to a durable job queue before scaling.
- **Gemini as the current model provider:** no live fallback provider is configured in the current code.

## Known gaps before production

1. Rate limiting and per-account usage quotas.
2. Durable background ingestion with retry, progress and cancellation.
3. Transactional cleanup when document/session persistence fails.
4. Integration tests for auth isolation, ingestion, retrieval, citation integrity and streaming.
5. A semantic citation evaluation set, plus retrieval quality metrics.
6. Content retention, deletion and privacy UX.
7. OCR for scanned course material.
8. A race-safe, retry-safe processing state machine and idempotency key.
9. Reconcile existing Supabase schema before applying the clean-install migration.
