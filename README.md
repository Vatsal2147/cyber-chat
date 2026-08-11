# Gemini :: Link — cyberpunk chat + reactive Three.js tunnel

## What this is
A full chat frontend for a Next.js + Gemini app: glass HUD chat panel floating
over a full-bleed Three.js tunnel (your original tunnel-flight scene, now
reactive — it flies faster and blooms brighter while a reply is streaming in).

## Set up
```bash
npm install
cp .env.local.example .env.local   # then paste your real Gemini API key
npm run dev
```
Open http://localhost:3000.

## Dropping this into your existing repo
This was built to match your project's exact versions (Next 16.3, React 19,
`@google/genai`, Tailwind v4), so it should merge cleanly:

- Copy `app/`, `components/`, `lib/` into your project (they won't collide
  with anything except `app/page.tsx`/`app/layout.tsx`/`app/globals.css`,
  which this replaces).
- Merge `package.json` dependencies if you already have your own (you mainly
  need `three` and `@types/three` added).
- If you already have `app/api/chat/route.ts` with your own Gemini logic,
  keep yours — just make sure it streams plain text and accepts
  `{ messages: [{ role: "user" | "assistant", content: string }] }`, since
  that's the contract `ChatPanel.tsx` expects. Otherwise use the one included
  here.

## Files that matter
- `app/api/chat/route.ts` — streams Gemini's response back as plain text
  using `ai.models.generateContentStream`.
- `components/ChatPanel.tsx` — the glass chat UI, reads the stream chunk by
  chunk and reports streaming on/off to the page.
- `components/ThreeTunnel.tsx` — your tunnel scene, now a React component.
  Takes an `intensity` prop (0–1) and smoothly ramps camera speed, bloom
  strength, and tube hue with it. Drag to look around — OrbitControls is
  still live.
- `lib/spline.ts` — your original flight-path control points, typed.

## Notes
- The API route uses the Node runtime (not Edge) since `@google/genai` needs
  it.
- Model defaults to `gemini-2.5-flash`; override with `GEMINI_MODEL` in
  `.env.local`.
