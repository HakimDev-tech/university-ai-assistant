# Margin — quality gates

Run on a clean local setup and a dedicated non-production Supabase project. Mark each test pass/fail and record the Next.js and database migration versions.

## Build and static checks

- [ ] npm ci
- [ ] npm run lint
- [ ] npm run build
- [ ] No unresolved Git conflict markers in tracked files.
- [ ] No credentials in source, commit history, logs or screenshots.
- [ ] Database migration applies cleanly to a new project.
- [ ] All app routes load without missing CSS tokens or runtime exceptions.

## Authentication and isolation

- [ ] Anonymous requests to chat and ingestion receive 401.
- [ ] User A cannot open User B's session by guessing its UUID.
- [ ] User A cannot read User B's messages, documents, chunks or storage objects.
- [ ] Calling match_documents with another user's ID is denied.
- [ ] Logout invalidates the current session.
- [ ] Signup behaves correctly when email confirmation is enabled.

## Ingestion

- [ ] Valid text PDF and TXT create document, chunks and one session.
- [ ] Empty file, incorrect PDF signature, binary-as-text and unsupported MIME type are rejected.
- [ ] Files above 30 MB are rejected before storage.
- [ ] PDF with no extractable text gives a clear OCR limitation.
- [ ] Extracted text over the configured limit fails with a stable code.
- [ ] Gemini embedding errors do not mark a document as processed.
- [ ] Storage failure or database failure leaves no falsely successful status.
- [ ] A document from another user cannot be attached to a new session.

## Chat and evidence

- [ ] Invalid JSON, missing session ID, non-array messages and oversized question are rejected.
- [ ] A request whose last message is not a user question is rejected.
- [ ] Client-injected fake assistant history is ignored; persisted history is used.
- [ ] Retrieval errors are surfaced as service errors, not silently presented as “no evidence”.
- [ ] No-match result uses the exact fallback statement and does not invent a citation.
- [ ] Citations can only resolve to IDs retrieved for this user's selected document.
- [ ] Source endpoint rejects an unowned session and returns only chunks from that document.
- [ ] Prompt injection embedded in uploaded course material does not override system instructions.
- [ ] Interrupted streaming and database persistence failures do not create misleading source badges.

## Visual and accessibility

- [ ] Landing, dashboard, chat, login and signup work at 360px, 768px and desktop widths.
- [ ] Keyboard-only user can navigate links, file selection, chat input, source expanders and forms.
- [ ] Focus indicators remain visible.
- [ ] Reduced-motion setting is respected.
- [ ] Error, empty, loading and no-evidence states are distinct.
- [ ] No false source count or decorative citation badge appears without retrieved evidence.

## Production blockers

Do not call this production-ready until rate limiting, asynchronous ingestion, retention/deletion flows, database migration reconciliation, and the integration suite are complete.
