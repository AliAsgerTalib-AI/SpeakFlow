# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # TypeScript compile + Vite production build
npm run preview   # Serve production build locally
npm run lint      # ESLint check
```

No test runner is configured. Verify UI changes by running the dev server and testing in-browser.

## Environment

Copy `.env.example` to `.env` and set:
- `GEMINI_API_KEY` — required; used by Vite's `define` to inject the key at build time (see `vite.config.ts`)
- `GEMINI_MODEL` — optional; defaults to `gemini-3-flash-preview`

The API key is injected via Vite's `define` config (not `import.meta.env`), so `process.env.GEMINI_API_KEY` is replaced at bundle time.

## Architecture

**React 19 + Vite SPA** — no server-side rendering, no API routes.

```
src/App.tsx                   # Root: sticky header + 4-tab router (Motion animations)
src/components/
  PracticeSession.tsx          # Scripted mode: script → record → Gemini analysis (~771 lines)
  FreeSpeechSession.tsx        # Unscripted 60s recording → same analysis pipeline (~402 lines)
  Dashboard.tsx                # Recharts visualizations reading localStorage
  Glossary.tsx                 # Static 16-metric reference cards
src/hooks/useRecorder.ts       # MediaRecorder → base64 audio (used by both session components)
src/lib/gemini.ts              # All Gemini API calls: analyzeSpeech() + generatePracticeScript()
src/lib/firebase.ts            # Firebase init only (db + auth exports; not actively used in UI)
src/types.ts                   # SpeechFeedback (27 fields), SessionLog, UserStats interfaces
components/ui/                 # shadcn/base-nova components (button, card, badge, dialog, etc.)
lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
```

## Data Flow

1. `useRecorder` captures audio via `MediaRecorder` API and converts to base64
2. `analyzeSpeech(audioBase64, mimeType, scriptText?)` in `gemini.ts` sends audio to Gemini with a structured prompt requesting a 21-field JSON response
3. Gemini returns a `SpeechFeedback` object rendered by the session components
4. Completed sessions are serialized to `localStorage` under key `speakflow_sessions` (Dashboard reads this key)
5. Firebase (`db`, `auth`) is initialized but the UI currently bypasses it in favor of localStorage

## Key Conventions

- **Path alias:** `@/` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`)
- **Styling:** Tailwind CSS 4 dark theme; CSS variables defined in `src/index.css`; shadcn components live in `components/ui/` (root level, not `src/`)
- **Gemini prompt:** The system prompt in `gemini.ts` instructs the model to act as both a Speech Pathologist and Voice Coach; the required JSON schema is inline in the prompt — changes to `SpeechFeedback` in `types.ts` must be reflected there
- **Session persistence:** `SessionLog` objects are appended to the `speakflow_sessions` localStorage array by the session components after analysis completes
