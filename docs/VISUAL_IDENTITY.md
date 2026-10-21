# Margin — visual identity v2

## Positioning
**Margin / Make knowledge traceable. Keep the source.**

Margin is a study system for students who want to check how an answer relates to their course material. The product should feel like a precise research instrument—not a generic AI companion, a productivity dashboard, or a nostalgic stationery brand.

## Visual concept: the annotated source

The signature mark is a blue archive tile containing a simplified document outline, a blue reading margin and a coral annotation. It represents the product loop: source → margin note → checkable explanation. It must be reused from `src/components/MarginMark.tsx` and `public/margin-mark.svg`; do not replace it with a typed letter, emoji, generic book icon, or AI sparkle.

## Palette

- Signal blue: `#2455E8` — primary actions, active navigation, source links.
- Carbon ink: `#171B22` — high-priority text and dark editorial panel.
- Paper: `#FBFAF6` — reading and form surfaces.
- Technical mist: `#F1F2F5` — app canvas.
- Rule: `#D9DBE2` — structural divisions.
- Annotation coral: `#E85B43` — rare annotation emphasis.
- Muted: `#686D78` — secondary copy.

Avoid purple/blue gradients, neon, glassmorphism, giant rounded cards and decorative AI imagery. Blue is a functional signal, not a gradient background.

## Typography and composition

- Newsreader: large editorial statements, document titles and section headings.
- DM Sans: interface and reading text.
- IBM Plex Mono: evidence IDs, section indexes, metadata and labels.
- Use a strict baseline grid, fine rules and asymmetrical columns. The dark field-guide panel and source-document mark are signature elements.
- Keep body copy readable and sentence-case. Monospaced uppercase is only for short metadata labels.

## Product behavior is the identity

- Show source passages next to the answer they support.
- No fake usage metrics, fake activity, decorative citation badges or unsupported accuracy claims.
- Distinguish no relevant evidence from a service error.
- Error messages must tell the user what they can do next, while logs must not expose secrets or document contents.
- Keep mobile layouts calm and functional; keyboard focus and reduced-motion behavior are mandatory.

## Voice

Prefer: “Open the passage behind this answer.” / “The material does not contain enough evidence.” / “Your source stays the reference.”

Avoid: “Unlock your potential”, “AI superpower”, “100% accurate”, “revolutionize learning”, and generic cheerleading.
