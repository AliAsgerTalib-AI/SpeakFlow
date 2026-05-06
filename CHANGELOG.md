# Changelog

All notable changes to SpeakFlow are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.5.0] - 2026-05-06

### ✨ Features

- **Script Annotator Tab** — New "Annotator" tab allows users to paste or upload speech/presentation text for AI-powered delivery instruction markup. Gemini inserts 8 types of inline coaching cues (PAUSE, STRESS, BREATH, LOOK_AROUND, SLOW_DOWN, SPEED_UP, LOWER_VOICE, PROJECT_VOICE) as color-coded badges within the script.
- **PDF & Text Export** — Download annotated scripts and analysis reports in multiple formats:
  - Plain text with `[INSTRUCTION: detail]` format (Copy to clipboard or Download .txt)
  - Professional PDF with metadata, tips, and formatted script
- **Enhanced Metric Display** — Improved readability of core metrics in FeedbackResults:
  - Larger font sizes (2xl–3xl for scores, xs–sm for labels)
  - Interactive hover tooltips explaining each metric's meaning and importance
  - Increased padding and spacing for better visual hierarchy
  - Consolidated metrics grid prevents duplication
- **Vocal Vitality Score** — Introduces a composite "Vocal Vitality" metric combining multiple factors:
  - Peak Flow, Strong, Building, Warming Up tier labels
  - Delta tracking showing improvement vs. golden baseline
  - Gradient-coded cards for visual feedback
- **Golden Baseline Setup** — Users can set a "golden state baseline" during onboarding to track delta improvements:
  - Captures 8 core metrics as reference point
  - Computed via `computeVitalityScore()` in `vocalEngine.ts`
  - Shown in user profile and session comparisons
- **Gender-Affirming Vocal Goals** — Added support for voice customization preferences:
  - FEMINIZATION, MASCULINIZATION, NEUTRAL, MAINTENANCE options
  - Tailored analysis context based on vocal goal
  - Stored in UserProfile with age, biological sex, neurodiversity flag
- **Benchmark Comparison by Mode** — Performance metrics now compare against professional coaching standards:
  - Mode-specific benchmarks: General, Interview, Presentation, Sales
  - Compact summary view showing current vs. professional score
  - Quick Wins section highlighting top 3 improvement opportunities
- **Public Speaking Tips** — Contextual coaching tips integrated into script generation:
  - Interview Mode: behavioral techniques, storytelling structures
  - Presentation Mode: slide integration, audience pacing
  - Sales Mode: persuasion tactics, objection handling
- **Expert Suggestion** — Single, high-impact coaching cue from Gemini summarizing the most important thing to work on

### 🐛 Bug Fixes

- **Duplicate Metrics Display** — Removed duplicate metric cards from BenchmarkComparison that were repeating FeedbackResults metrics
- **Benchmark Issues** — Fixed inconsistencies in benchmark data structure and calculations across different speaking modes
- **Web Speech API Removal** — Cleaned up deprecated Web Speech API integrations that were causing conflicts with real-time transcription
- **Auto-scroll Issues** — Improved ScrollArea behavior and auto-scroll implementation for practice content
- **Speech Recognition Status** — Resolved automatic restart loops for speech recognition; now more reliable

### 🎨 UI/UX Improvements

- **ScriptCard Refactoring** — Removed redundant instruction display; instructions now centralized in separate components
- **Debug Panel Cleanup** — Removed debug window from public UI; now logs to console only
- **ScrollArea Optimization** — Replaced problematic ScrollArea instances with simpler, more reliable scrollable divs in specific contexts
- **Auto-scroll for Reading** — Practice session text now auto-scrolls as user reads, improving focus and flow
- **Modal & Dialog Polish** — Enhanced VocalProfileSetup dialog with clearer labeling and better responsive behavior

### 🔧 Technical Improvements

- **jsPDF Integration** — Added jsPDF library for PDF generation (4.2.1)
- **Structured Annotation Schema** — New `SCRIPT_ANNOTATION_SCHEMA` in `gemini.schema.ts` for validated script markup responses
- **Type Safety** — Added 5 new TypeScript interfaces for annotation support:
  - `AnnotationInstructionType` (union of 8 instruction types)
  - `AnnotationTextSegment` & `AnnotationInstructionSegment` (discriminated union)
  - `ScriptAnnotation` (full markup response)
- **Error Handling** — Improved error messages and validation in Gemini API responses

### 📖 Documentation

- **Updated README.md** — Comprehensive documentation with:
  - 27-metric feature list
  - Script Annotator walkthrough
  - Updated project structure with new components
  - Enhanced API reference with `annotateScript()` docs
  - Completed features section in roadmap
- **Metric Tooltips** — Built-in explanations for each metric via hover tooltips (no external docs needed)

### 🚀 Performance

- **Metric Render Optimization** — Reduced grid layout from 8 columns to 4 on larger screens for better readability without performance loss
- **PDF Export Performance** — Efficient PDF generation using jsPDF with proper memory cleanup

---

## [1.4.1] - 2026-05-06

### 🐛 Bug Fixes

- Fixed benchmark data structure inconsistencies
- Improved speech recognition reliability with better event handling

### 🎨 UI/UX Improvements

- Cleaned up debug logging and removed debug panel from UI
- Enhanced auto-scroll behavior for reading practice

---

## [1.4.0] - 2026-05-06

### ✨ Features

- **Public Speaking Tips** — Added contextual coaching tips for Interview, Presentation, and Sales modes integrated into script generation
- **Prompt Display Component** — New component to show generation prompts alongside practice scripts
- **Benchmark Metrics** — Initial benchmark comparison framework added
- **Vocal Vitality Score** — Composite metric combining multiple speech factors

### 🐛 Bug Fixes

- Removed deprecated Web Speech API integrations
- Fixed speech recognition conflict issues

### 🎨 UI/UX Improvements

- Separated practice script display from instructions
- Added automatic practice box initialization on mode selection
- Improved ScrollArea implementation

---

## [1.3.0] - 2026-05-05

### ✨ Features

- **Speech Recognition Display** — Real-time transcription visualization during recording
- **Auto-restart for Recognition** — Automatic speech recognition session continuation

### 🐛 Bug Fixes

- Fixed web speech API initialization

---

## [1.2.0] - 2026-05-05

### ✨ Features

- **Debug Panel** — Development tool for monitoring real-time analysis
- **Improved Scrolling** — Enhanced ScrollArea and scrollable div implementations

### 🎨 UI/UX Improvements

- Better auto-scroll for reading and feedback display

---

## [1.1.0] - 2026-05-04

### ✨ Features

- **Real-Time Transcription** — Live Web Speech API transcript display during recording
- **Practice Mode Modes** — Support for General, Interview, Presentation, and Sales speaking contexts
- **Session Dashboard** — Charts for tracking confidence and pace across sessions
- **Glossary** — Plain-language explanations of all metrics

### 🐛 Bug Fixes

- Audio encoding reliability improvements
- Gemini API response validation

---

## [1.0.0] - 2026-04-30

### ✨ Features (Initial Release)

- **Scripted Practice Mode** — Record audio while reading AI-generated scripts with real-time highlighting
- **Free Speech Lab** — Record up to 60 seconds of unscripted speech
- **21-Metric AI Analysis** — Comprehensive speech analysis including:
  - Confidence, Rhythm, Intonation, Articulation, Breath Management
  - Vocal Health, Sentiment, Filler Words, Micro-hesitations
  - Plosive Clarity, Environmental Noise, Accent Profile
- **Real-Time Transcription** — Live transcript display during recording (Web Speech API)
- **Session Persistence** — localStorage-based session storage and retrieval
- **Session Export** — Download sessions as JSON for external analysis
- **Pronunciation Feedback** — Word-level correction suggestions
- **Audio Visualization** — Animated waveform display during recording
- **Dark Mode** — Default dark theme with Tailwind CSS 4

### 🛠 Tech Stack

- React 19 + TypeScript
- Vite 6 build system
- Tailwind CSS 4 styling
- Google Gemini Flash API for speech analysis
- Firebase (initialized for future cloud features)
- Recharts for data visualization
- Motion for animations

---

## [Unreleased]

### 🔄 In Progress

- Cloud sync with Firebase Firestore
- User authentication (Google/Email)
- Advanced voice metrics (vocal health tracking)
- Custom exercise library
- Team coaching dashboard

### 📋 Planned

- Mobile app (React Native)
- Offline analysis support
- Community leaderboards
- Session sharing with reports
- Voice cloning for playback

---

## Notes

- **API Key Management:** In production, use a server-side proxy for the Gemini API key to avoid exposing it in the bundle.
- **Browser Support:** Chrome 120+, Firefox 121+, Safari 17.2+, Edge 120+
- **Session Storage:** Sessions stored in browser localStorage; consider IndexedDB for large datasets (100+ sessions).

---

*Last updated: 2026-05-06*
