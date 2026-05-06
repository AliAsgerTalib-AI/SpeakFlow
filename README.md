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

> **Getting a Gemini API key:** Visit [Google AI Studio](https://aistudio.google.com/apikey) and create a free key. The app defaults to `gemini-3-flash-preview`.

---

## Project Structure

```
speakflow/
├── src/
│   ├── App.tsx                    # Root: sticky header + 4-tab router
│   ├── types.ts                   # SpeechFeedback, SessionLog, UserStats interfaces
│   ├── components/
│   │   ├── PracticeSession.tsx    # Scripted mode — record, highlight, analyze
│   │   ├── FreeSpeechSession.tsx  # Unscripted mode — 60s free recording
│   │   ├── Dashboard.tsx          # Recharts session history charts
│   │   ├── Glossary.tsx           # Metric reference cards
│   │   └── AudioVisualizer.tsx    # Animated waveform bars
│   ├── hooks/
│   │   └── useRecorder.ts         # MediaRecorder → base64 audio
│   └── lib/
│       ├── gemini.ts              # analyzeSpeech() + generatePracticeScript()
│       └── firebase.ts            # Firebase initialization
├── components/ui/                 # shadcn/ui primitives (button, card, badge…)
├── lib/utils.ts                   # cn() helper (clsx + tailwind-merge)
├── vite.config.ts                 # Vite config — injects GEMINI_API_KEY at build time
└── .env.example                   # Environment variable template
```

**Key data flow:**
```
useRecorder (MediaRecorder) → base64 audio
  → gemini.ts analyzeSpeech() → SpeechFeedback JSON
    → Session components render metrics
      → localStorage ('speakflow_sessions') → Dashboard charts
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-3-flash-preview` | Model ID override |

> **Note:** Variables are injected at build time via Vite's `define` config, not `import.meta.env`. Do not prefix them with `VITE_`.

---

## Roadmap

- [ ] Server-side Gemini proxy to keep the API key out of the client bundle
- [ ] Firebase Firestore sync to replace localStorage for cross-device session history
- [ ] User authentication and personal progress profiles
- [ ] Shareable session report links
- [ ] Custom script input (paste your own text)
- [ ] Mobile app (React Native / Capacitor)

---

## Contributing

Contributions are welcome. Please open an issue before submitting a PR for significant changes.

```bash
# Fork the repo, then:
git checkout -b feat/your-feature
# Make your changes
npm run lint       # Must pass before opening a PR
git push origin feat/your-feature
# Open a Pull Request
```

---

## License

MIT © 2026 [AliAsgerTalib-AI](https://github.com/AliAsgerTalib-AI)
