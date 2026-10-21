# Margin — visual identity

## Positioning

**Margin / Study from the source.**

Margin is an academic study instrument, not a generic AI companion. Its differentiator is source traceability: students should be able to move from an answer to the retrieved passage that supports it.

## Art direction: editorial field notes

The interface takes cues from annotated course readers, library catalogues, paper margins and technical notebooks. It should feel considered, calm and precise—not futuristic, playful or corporate SaaS.

### Palette

- Canvas: warm paper #F4F1E8
- Primary surface: #FBFAF6
- Primary ink: #202923
- Secondary ink: #5D665D
- Margin/rust accent: #B85B43
- Fine rule: #D9D5CA
- Muted note panel: #E9E5D9

The rust accent is for actions, evidence marks and selected states. Avoid purple/blue AI gradients, neon glows, glassmorphism and decorative blobs.

### Typography

- **Newsreader:** editorial headlines and document titles.
- **DM Sans:** reading and interface copy.
- **IBM Plex Mono:** metadata, source indexes, timestamps and small uppercase labels.

Use large editorial headlines sparingly. Monospaced text is metadata, not body copy. Keep paragraphs readable and line lengths controlled.

### Signature elements

1. The lowercase m. wordmark in a thin outlined square.
2. Small uppercase labels such as SOURCE 03 / PASSAGE 12.
3. Fine rules that organize content instead of rounded card grids.
4. Paper-like source excerpts with a visible annotation edge.
5. Numbered steps and evidence metadata, never fake product metrics.
6. Direct labels that explain the state: retrieving, source found, no supporting passage, processing failed.

### Layout

- Desktop uses a broad editorial column with an evidence panel.
- Workspace is task-first: add source, return to study thread.
- Chat is a reading surface; sources remain adjacent to the answer that uses them.
- Mobile collapses into one column with preserved hierarchy and touch targets.
- Motion is subtle and respects reduced-motion settings.

### Voice

Use concise, academically useful language. Avoid phrases such as unlock your potential, revolutionize learning, your AI superpower, generic praise, emoji-heavy labels and unsupported claims of accuracy.

Preferred:
- “Study with the source. Not the guess.”
- “Open the passage that supports this answer.”
- “The material does not provide enough evidence to answer this.”
- “This source was retrieved; verify that it supports the claim.”

Avoid:
- “Your all-in-one AI learning copilot.”
- “100% hallucination-free.”
- “Instantly master any subject.”

### Product behavior is part of the brand

The interface must not imply evidence that the retrieval system did not return. A source count must reflect actual stored source IDs. If retrieval fails, distinguish service failure from a legitimate no-match result. A citation is a route to inspect evidence, not a decorative trust badge.
