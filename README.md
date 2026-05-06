<div align="center">
<img width="1200" height="475" alt="SpeakFlow Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

<h1>SpeakFlow AI</h1>
<p><strong>AI-powered public speaking coach that analyzes your voice in real time — from pace and clarity to vocal health and accent profile.</strong></p>

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232a)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&labelColor=1a1a2e)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&labelColor=1a1a2e)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white&labelColor=1a1a2e)
![Gemini](https://img.shields.io/badge/Google_Gemini-Flash-4285F4?logo=google&logoColor=white&labelColor=1a1a2e)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black&labelColor=1a1a2e)
![License](https://img.shields.io/badge/License-MIT-22c55e?labelColor=1a1a2e)

</div>

---

## Features

- **Scripted Practice Mode** — Read aloud from an AI-generated script and get word-level pronunciation feedback with real-time highlighting as you speak
- **Free Speech Lab** — Record up to 60 seconds of unscripted speech and receive a full diagnostic report
- **21-Metric AI Analysis** — Confidence, pace (WPM), rhythm, intonation, articulation, vocal resonance, breath management, vocal health (strain / glottal fry), sentiment, filler words, micro-hesitations, plosive clarity, environmental noise, and accent profile
- **Real-Time Transcription** — Live Web Speech API transcript displayed alongside your script during recording
- **Session Dashboard** — Confidence trend and pace volatility charts across all saved sessions, persisted in localStorage
- **Glossary** — Plain-language explanations of every metric, with clinical benchmarks
- **Session Export** — Download any session as a structured JSON file

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Animation | Motion (Framer Motion) |
| Charts | Recharts |
| Icons | Lucide React |
| AI Analysis | Google Gemini Flash (via `@google/genai`) |
| Audio Capture | Web Audio API (`MediaRecorder`) |
| Speech Recognition | Web Speech API (browser built-in) |
| Backend | Firebase (Firestore + Auth — initialized, optional) |
| Notifications | Sonner |

---

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repository
git clone https://github.com/AliAsgerTalib-AI/speakflow.git
cd speakflow

# 2. Install dependencies
npm install

# 3. Add your API key
cp .env.example .env
# Then edit .env and set GEMINI_API_KEY=your_key_here

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

```bash
# Other commands
npm run build    # Production build
npm run preview  # Serve the production build locally
npm run lint     # TypeScript type-check (tsc --noEmit)
```

> **Getting a Gemini API key:** Visit [Google AI Studio](https://aistudio.google.com/apikey) and create a free key. The app defaults to `gemini-2.0-flash`.

---

## Project Structure

```
speakflow/
├── src/
│   ├── App.tsx                    # Root: sticky header + 4-tab router (Motion animations)
│   ├── types.ts                   # SpeechFeedback, SessionLog, UserStats interfaces
│   ├── components/
│   │   ├── PracticeSession.tsx    # Scripted mode — record, highlight, analyze (~771 lines)
│   │   ├── FreeSpeechSession.tsx  # Unscripted mode — 60s free recording (~402 lines)
│   │   ├── Dashboard.tsx          # Recharts session history charts
│   │   ├── Glossary.tsx           # Metric reference cards
│   │   └── AudioVisualizer.tsx    # Animated waveform bars
│   ├── hooks/
│   │   ├── useRecorder.ts         # MediaRecorder → base64 audio
│   │   └── useSpeechRecognition.ts # Web Speech API integration
│   ├── lib/
│   │   ├── gemini.ts              # analyzeSpeech() + generatePracticeScript()
│   │   ├── gemini.schema.ts       # SpeechFeedback JSON schema validation
│   │   ├── firebase.ts            # Firebase initialization (auth + Firestore)
│   │   ├── errors.ts              # Error types & handling
│   │   └── wordMatching.ts        # Script word alignment utilities
│   └── index.css                  # Tailwind 4 + CSS variables (dark theme)
├── components/ui/                 # shadcn/ui primitives (button, card, badge…)
├── lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
├── vite.config.ts                 # Vite config — injects GEMINI_API_KEY at build time
├── tsconfig.json                  # Path alias: @/ → src/
└── .env.example                   # Environment variable template
```

**Data Flow:**
```
useRecorder (MediaRecorder)
  ↓
base64 audio + optional script text
  ↓
gemini.ts: analyzeSpeech() 
  ↓
SpeechFeedback JSON (27 metrics)
  ↓
Session components render feedback
  ↓
localStorage ('speakflow_sessions')
  ↓
Dashboard visualizations
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key (get from [Google AI Studio](https://aistudio.google.com/apikey)) |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Model ID override (any Gemini model works) |

> **Note:** Variables are injected at build time via Vite's `define` config using `process.env.GEMINI_API_KEY`, not `import.meta.env`. Do not prefix them with `VITE_`.

---

## Key Conventions & Architecture Notes

### Path Aliases
- `@/` maps to the project root in both `tsconfig.json` and `vite.config.ts`
- Use `@/components`, `@/hooks`, `@/lib` for clean imports

### Styling System
- **Tailwind CSS 4** with dark theme as default
- CSS variables defined in `src/index.css` for semantic colors (e.g., `--background`, `--foreground`)
- All UI components use shadcn/ui base components from `components/ui/`

### Gemini Prompt Synchronization
- The system prompt in `gemini.ts` instructs Gemini to act as a Speech Pathologist + Voice Coach
- The required **JSON schema is defined inline** in the prompt (not in a separate file)
- ⚠️ **If you add/remove fields to `SpeechFeedback` in `types.ts`, you must update the corresponding prompt in `gemini.ts`**

### State Management
- **No Redux/Context** — components manage local state with `useState`
- **Persistence:** Sessions serialized to `localStorage` under key `speakflow_sessions`
- **Firebase:** Initialized but currently bypassed in favor of localStorage (ready for cloud sync when needed)

### Audio & Speech Recognition
- Audio capture via native `MediaRecorder` API (wrapped in `useRecorder` hook)
- Optional real-time transcription via Web Speech API (`useSpeechRecognition` hook)
- All audio sent to Gemini as base64-encoded WAV/WebM

---

## Development Tips

### Running the Dev Server
```bash
npm run dev
```
- Runs on `http://localhost:3000` with HMR (hot module replacement)
- Changes to components hot-reload instantly
- Changes to environment variables require a full restart

### Type Checking
```bash
npm run lint
```
- Runs `tsc --noEmit` to check TypeScript without emitting files
- No separate test runner configured — verify UI changes manually in the browser

### Building for Production
```bash
npm run build && npm run preview
```
- `build` produces optimized bundle in `dist/`
- `preview` serves the production build locally for testing

### Browser DevTools Tips
- Open **DevTools** → **Application** → **LocalStorage** → look for `speakflow_sessions` to inspect stored session data
- Check **Network** tab when recording — you'll see requests to `generativelanguage.googleapis.com` (Gemini API)
- Console will log errors from Gemini API calls; check `.error` field in the response

---

## API Reference

### Core Functions

#### `analyzeSpeech(audioBase64, mimeType, scriptText?)`
Sends audio to Gemini and returns structured feedback.

```typescript
import { analyzeSpeech } from '@/lib/gemini';

const feedback = await analyzeSpeech(
  audioBase64,           // Base64-encoded audio
  'audio/webm',          // MIME type
  'Hello world'          // Optional script text for comparison
);
// Returns SpeechFeedback object with 27 metrics
```

#### `generatePracticeScript(topic, level)`
Generates new practice scripts for training.

```typescript
import { generatePracticeScript } from '@/lib/gemini';

const script = await generatePracticeScript(
  'business-presentation',  // Topic
  'intermediate'            // Level: beginner | intermediate | advanced
);
// Returns { title, text, estimatedDuration }
```

### Key Types

**`SpeechFeedback`** — Main analysis result (27 fields)
```typescript
interface SpeechFeedback {
  overallScore: number;
  confidence: number;
  pace: number;               // Words per minute
  articulation: number;       // 0-100
  // ... 23 more fields (see types.ts for full definition)
}
```

**`SessionLog`** — Persisted session record
```typescript
interface SessionLog {
  id: string;
  timestamp: number;
  mode: 'practice' | 'free-speech';
  feedback: SpeechFeedback;
  audioBlob?: Blob;
  scriptUsed?: string;
}
```

---

## Troubleshooting

### "Invalid API Key" Error
- Verify `GEMINI_API_KEY` is set in `.env`
- Check that the key is valid in [Google AI Studio](https://aistudio.google.com/apikey)
- Restart the dev server after updating `.env`

### Audio Recording Permission Denied
- Check browser permissions: Settings → Privacy → Microphone → Allow for localhost:3000
- On HTTPS sites, browsers require explicit permission grants

### Gemini API Rate Limiting
- Free tier: ~60 requests per minute
- If you hit limits, wait a few seconds before recording again
- Consider upgrading to a paid API plan for heavy use

### Changes to `.env` Not Reflected
- The API key is injected at build time, not runtime
- You must restart `npm run dev` after changing `.env`
- Vite's HMR only watches source files, not `.env`

### LocalStorage Not Persisting
- Check that localStorage is enabled in your browser
- Private/Incognito mode may clear storage on window close
- Some browsers disable localStorage for localhost in certain conditions; try `127.0.0.1:3000` instead

### Component Not Updating After Recording
- Verify that the `useRecorder` hook completes without errors (check console)
- Ensure `analyzeSpeech()` returns a valid `SpeechFeedback` object
- Check localStorage for the session (`DevTools` → `Application` → `LocalStorage`)

---

## Known Limitations

- **No backend API** — The app is a pure client-side SPA; Gemini API key is exposed in the bundle
  - **Workaround:** Use a backend proxy to keep the API key secret (planned feature)
- **No test runner** — Verify UI changes manually in the browser
- **LocalStorage only** — Sessions don't sync across devices
  - **Workaround:** Firebase Firestore integration is initialized and ready (planned)
- **Web Audio limitations** — Microphone access requires HTTPS (or localhost for dev)
- **Browser compatibility** — Requires modern browser with Web Audio API and MediaRecorder support
  - Tested on: Chrome 120+, Firefox 121+, Safari 17.2+, Edge 120+

---

## Roadmap

### Phase 1: Security & Backend (Q2-Q3 2026)
- [ ] **Server-side Gemini proxy** — Hide API key from client bundle
- [ ] **Firebase Firestore integration** — Cloud sync for cross-device session history
- [ ] **User authentication** — Sign in with Google/Email for personal profiles

### Phase 2: Advanced Features (Q3-Q4 2026)
- [ ] **Word-level feedback** — Highlight mispronounced words with corrections
- [ ] **Custom script input** — Users upload or paste their own text for practice
- [ ] **Accent-specific coaching** — Detect user's native accent and provide targeted tips
- [ ] **Session sharing** — Generate shareable report links with metrics

### Phase 3: Mobile & Expansion (2027)
- [ ] **React Native / Capacitor mobile app** — iOS and Android versions
- [ ] **Offline mode** — Record and analyze without internet (using local models)
- [ ] **Advanced metrics** — Vocal health metrics, emotional sentiment analysis
- [ ] **Community leaderboards** — Compare scores, friendly challenges

---

## Contributing

We welcome contributions! Before submitting a PR for significant changes, please open an issue to discuss your idea.

### Development Workflow

```bash
# 1. Fork the repo and clone locally
git clone https://github.com/YOUR_USERNAME/speakflow.git
cd speakflow

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes
# - Keep components focused (single responsibility)
# - Update types.ts if adding new SpeechFeedback fields
# - Update gemini.ts prompt if schema changes
# - Test UI changes manually: npm run dev

# 4. Lint and verify
npm run lint       # TypeScript check

# 5. Commit and push
git add .
git commit -m "feat: describe your feature"
git push origin feat/your-feature-name

# 6. Open a Pull Request on GitHub
```

### Code Style Guidelines
- **TypeScript:** Use strict typing; avoid `any`
- **Components:** Functional components with hooks
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Styling:** Tailwind utility classes (no inline styles unless absolutely necessary)
- **Comments:** Only for non-obvious logic; well-named code is self-documenting

### Areas for Contribution
- **Bug fixes** — Check [GitHub Issues](https://github.com/AliAsgerTalib-AI/speakflow/issues)
- **New speech metrics** — Enhance SpeechFeedback analysis
- **UI/UX improvements** — Polish components and animations
- **Performance optimizations** — Profile and optimize slow paths
- **Documentation** — Improve this README and inline code docs
- **Firebase integration** — Connect Firestore for cloud sync (WIP)

---

## Performance & Optimization

### Current Bottlenecks
- **Gemini API latency:** ~1-3 seconds for speech analysis (depends on audio length and API load)
- **Large session history:** Reading `localStorage` is blocking; consider pagination for 100+ sessions

### Optimization Tips
- Use **code splitting** for route-based components (Vite supports dynamic imports)
- Memoize expensive computations with `useMemo` and `useCallback`
- Profile bundle size with `npm run build` and analyze with `rollup-plugin-visualizer`
- Consider lazy-loading the Glossary tab (only needed when tab is active)
- Use `sessionStorage` for temporary data instead of `localStorage`

### Future Optimization Candidates
- [ ] IndexedDB for large session datasets (faster than localStorage)
- [ ] Service Worker for offline support
- [ ] Image compression for session thumbnails
- [ ] Debouncing for rapid API calls during testing

---

## File Editing Checklist

When modifying key files, remember to sync related files:

| File | When to Edit | Sync Required |
|---|---|---|
| `types.ts` | Adding/removing SpeechFeedback fields | Update `gemini.ts` prompt + `gemini.schema.ts` |
| `gemini.ts` | Changing analysis prompt or API model | Test with new model, verify schema still works |
| `.env.example` | Adding new env vars | Update README's "Environment Variables" section |
| `components/Glossary.tsx` | Updating metric descriptions | Keep aligned with SpeechFeedback field names |
| `vite.config.ts` | Changing build config or aliases | Verify `tsconfig.json` paths match |

---

## FAQ

**Q: Is my audio data stored?**  
A: No. Audio is sent to Gemini for analysis, but the base64 audio is only kept in-memory. Sessions are stored locally in your browser's localStorage, not on any server. Firebase is initialized but not used yet.

**Q: Can I use this offline?**  
A: No, the app requires internet to reach Gemini's API. Offline speech analysis is planned for Phase 3 (using on-device models).

**Q: What happens if I run out of Gemini API quota?**  
A: Free tier: ~1 requests per minute. If you hit the limit, you'll see an API error; wait a few seconds and try again. Upgrade to a paid plan for higher limits.

**Q: Can I delete my session history?**  
A: Yes. Use your browser's DevTools (Application → LocalStorage → clear `speakflow_sessions`) or we can add a UI button for this.

**Q: How do I deploy this to production?**  
A: Run `npm run build`, then serve the `dist/` folder on any static host (Vercel, Netlify, GitHub Pages). Remember: the API key will be exposed in the bundle—use a server-side proxy for production.

**Q: Why isn't Firebase being used?**  
A: It's initialized but not integrated yet. Phase 1 will add Firestore for cloud sync and authentication.

---

## Getting Help

- **Report a bug:** [Open an issue](https://github.com/AliAsgerTalib-AI/speakflow/issues)
- **Ask a question:** [Start a discussion](https://github.com/AliAsgerTalib-AI/speakflow/discussions)
- **Suggest a feature:** [Feature request](https://github.com/AliAsgerTalib-AI/speakflow/issues/new?template=feature_request.md)
- **Documentation:** See this README and inline code comments

---

## License

© 2026 [AliAsgerTalib-AI](https://github.com/AliAsgerTalib-AI)

---

**Thank you for using SpeakFlow!** 🎤 — Help us improve by sharing feedback and contributing.

