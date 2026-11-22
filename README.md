# Prepmate AI

Prepmate AI is a desktop and web application designed for comprehensive technical and behavioral interview preparation. Built with Tauri 2.0, React 19, TypeScript, and Tailwind CSS, it provides real-time AI mock interviews, coding sandboxes, computer science online assessment practice, and automated evaluation scorecards.

---

## Overview

Preparing for high-stakes software engineering interviews requires multidimensional practice: solving algorithmic problems under time pressure, articulating design decisions, structuring behavioral answers, and mastering core computer science fundamentals. Prepmate AI unifies these requirements into a private, local-first platform with optional cloud synchronization.

---

## Key Features

### Technical Coding Studio
- Monaco-based code editor supporting JavaScript, TypeScript, and Python.
- In-browser sandboxed test runner for evaluating algorithm solutions against verified test suites.
- Socratic hints that guide problem-solving step by step without revealing answers prematurely.
- Algorithm problem catalog covering arrays, strings, two pointers, sliding window, trees, and dynamic programming.

### Core CS and Online Assessment (OA) Practice
- 100 curated multiple-choice questions across five core subjects (20 questions per subject):
  - Operating Systems
  - Database Management Systems (DBMS) and SQL
  - Computer Networks
  - Object-Oriented Programming (OOP) and Software Design
  - Data Structures and Algorithm (DSA) Complexity Theory
- Dual practice modes:
  - Practice Mode: Immediate feedback, correctness indicators, detailed explanations, and key takeaways.
  - Timed OA Simulation: 20-minute timed assessment with randomized question order and final scorecards.
- Question bookmarking, category filtering, search, and reset capability.
- AI-generated conceptual breakdowns on demand for difficult questions.

### Behavioral and Communication Coaching
- Structured answering frameworks utilizing the STAR methodology (Situation, Task, Action, Result).
- Live speech analysis with speech-to-text transcription and natural text-to-speech feedback.
- Real-time filler-word tracking (identifying words like "um", "uh", "like", and "you know").
- Speaking pace telemetry measured in words per minute (WPM).

### Real-Time Computer Vision Telemetry
- Client-side heuristic analysis monitoring eye contact and gaze direction.
- Posture detection providing real-time slouching and alignment alerts.
- Privacy-first design: All video processing occurs strictly on-device in browser memory; video feeds are never recorded or transmitted.

### Hybrid AI Model Architecture
- Local offline mode powered by Ollama, defaulting to `gemma3:4b` for private, zero-latency inference.
- Cloud model integrations supporting Google Gemini (Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0) and Groq (Llama 3.3 70B).
- Automatic local fallback: Automatically routes requests to local Ollama if cloud network connections fail.
- Connection diagnostics and local model discovery directly within application settings.

### Personalized Candidate Profile
- Profile configuration covering target roles, companies, seniority levels, education, professional experience, and technical skill sets.
- Synthesizes user experience into contextual background for customized interview prompts.
- Cloud Firestore persistence ensuring profile information stays synchronized across devices.

### Multi-User Data Isolation
- Firebase Authentication supporting email/password and Google Sign-In.
- User-scoped Cloud Firestore architecture: Each user's interview history, scorecards, candidate profile, and MCQ progress are strictly partitioned under their Firebase UID.
- Session cleanup on sign-out to prevent in-memory data bleeding between accounts.

---

## Technology Stack

- Desktop Shell: Tauri 2.0 (Rust)
- Frontend Framework: React 19
- Language: TypeScript 5.8+
- Build Tool: Vite 8
- Styling: Tailwind CSS 4
- Code Editor: Monaco Editor (`@monaco-editor/react`)
- State Management: Zustand 5
- Authentication & Database: Firebase Authentication, Cloud Firestore
- Local AI Runtime: Ollama (`gemma3:4b`)
- Cloud AI APIs: Google Gemini API, Groq Cloud API
- Icons: Lucide React

---

## Prerequisites

- Node.js: Version 18.0 or higher (Node.js 20+ LTS recommended)
- Package Manager: npm (bundled with Node.js)
- Rust Toolchain: Rust 1.80 or higher with `cargo` (required only for building native desktop executables via Tauri)
- Ollama (Optional): Required for local, offline AI model execution (install from https://ollama.com)

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/prepmate_ai.git
cd prepmate_ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root if you wish to pre-configure API keys:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here
```

API keys can also be entered directly in the application's Preferences & Models settings dialog at any time.

### 4. Run the Development Server

#### Web Browser Mode
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

#### Desktop Mode (Tauri)
```bash
npm run tauri dev
```

---

## Local AI Setup (Ollama)

To use Prepmate AI completely offline without third-party API keys:

1. Install Ollama from https://ollama.com and start the service.
2. Pull the default recommended model:
   ```bash
   ollama pull gemma3:4b
   ```
3. In Prepmate AI, open Settings > Preferences & Models.
4. Set the active provider to Ollama.
5. Verify the host URL (`http://localhost:11434`) and click Test Ollama Connection.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server for web preview |
| `npm run build` | Compiles TypeScript and builds production web assets into `dist/` |
| `npm run lint` | Runs ESLint to verify code quality |
| `npm run preview` | Previews the compiled production web build locally |
| `npm run tauri dev` | Launches the desktop application in development mode |
| `npm run build:exe` | Compiles a standalone Windows executable (`.exe`) via Tauri without bundling |
| `npm run build:installer` | Builds a complete Windows NSIS installation package |

---

## Desktop Packaging

To compile standalone Windows desktop binaries:

```bash
# Build standalone executable
npm run build:exe

# Build full installer package (.exe via NSIS)
npm run build:installer
```

Compiled binaries and installer packages are generated in:
`src-tauri/target/release/`

---

## Security and Privacy

- On-Device Vision: Web camera video streams are analyzed frame-by-frame via HTML5 Canvas API heuristics in browser memory. Video is never recorded, saved to disk, or sent over network connections.
- Secure Credentials: API keys stored locally in settings are used directly by the client against official provider endpoints.
- Cloud Data Access: Cloud Firestore security rules restrict read and write access strictly to the authenticated user matching `request.auth.uid`. Unauthenticated or cross-user access is denied by default.

---

