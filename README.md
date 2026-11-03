# Prepmate AI 🎙️💻👁️

**Prepmate AI** is a high-performance desktop application for AI-powered mock interview preparation built with **Tauri 2.0 (Rust)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

It simulates high-stakes technical, behavioral, and system design interviews calibrated against the hiring bars of top tech companies (Google, Meta, Amazon, Apple, Netflix, Stripe, etc.).

---

## ✨ Key Features

### 1. 🎙️ Voice-to-Voice Real-Time Interview Loop
- **Hands-Free Conversational AI**: Speak directly with your AI interviewer; answers are transcribed with Speech-to-Text (STT) and the interviewer responds with natural Text-to-Speech (TTS).
- **Speech Telemetry**: Real-time filler-word tracking (`um`, `uh`, `like`, `you know`) and pace tracking (Words Per Minute).
- **Audio Controls**: Quick toggle between hands-free voice mode and typed chat fallback.

### 2. 💻 Technical Coding & DSA Sandbox
- **Monaco Code Editor**: Powered by the same code engine as VS Code, with full syntax highlighting for JavaScript, TypeScript, and Python.
- **Embedded Test Runner**: Execute your solution against verified unit test cases with console logging and execution timer.
- **Socratic Hints**: Progressive, multi-stage hints without spoiling the optimal solution.

### 3. 👥 Behavioral & STAR Framework Guidance
- **STAR Real-Time Guide**: Breaks down behavioral stories into **S**ituation, **T**ask, **A**ction, and quantifiable **R**esult.
- **"I" vs "We" Rule Enforcement**: Guides candidates to emphasize their individual technical and leadership contributions.

### 4. 👁️ Real-Time Computer Vision Telemetry
- **Eye Contact Tracking**: Heuristic tracking ensuring your gaze remains centered with the interviewer rather than looking down or away.
- **Posture Alerts**: Detects slouching or poor posture and provides live HUD warnings.
- **Client-Side Privacy**: All vision heuristics run strictly on-device in real-time; video is never uploaded or recorded to cloud servers.

### 5. ⚡ Hybrid AI Engine (Cloud + Local Fallback)
- **Multi-Provider Support**: Choose between Google Gemini (Gemini 1.5 Flash / Pro, Gemini 2.0), OpenAI (GPT-4o, GPT-4o-mini), and Groq (Llama 3.3).
- **Local Ollama Fallback**: Run 100% offline and private sessions with local models (`llama3.2`, `deepseek-r1`, `qwen2.5-coder`). If your cloud API key is missing or offline, Prepmate AI seamlessly routes to your local Ollama instance.

### 6. 📄 Resume & Job Description Tailoring
- Upload your resume (`.txt`, `.md`, or paste) to automatically extract your tech stack, seniority, and key projects.
- Enter your target company and role for personalized interview questions.

### 7. 📊 Post-Interview Scorecard & Report
- **Hiring Recommendation**: Strong Hire, Hire, Lean Hire, Lean No Hire, or No Hire.
- **Score Breakdown**: Technical Accuracy, Problem Solving, Communication, STAR Structure, and Non-Verbal Presence.
- **Actionable Feedback**: Specific strengths, areas for improvement, and exportable Markdown report.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v24)
- **Rust & Cargo**: Rust 1.80+ (MSVC toolchain on Windows)
- *(Optional)* **Ollama**: For local offline AI models ([ollama.ai](https://ollama.ai))

### Development

#### 1. Run in Desktop Mode (Tauri + Webview2)
```bash
npm run tauri dev
```

#### 2. Run in Browser Preview Mode (Fast Web Dev)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building Native Desktop Binary (.exe)
```bash
npm run tauri build
```
The compiled Windows `.exe` installer will be located in:
`src-tauri/target/release/bundle/nsis/`

---

## 🛠️ Project Structure

```
aiipl/
├── src/
│   ├── types/               # TypeScript data models (Interview, Settings, Code)
│   ├── services/
│   │   ├── aiService.ts     # Hybrid AI engine (Gemini, OpenAI, Groq, Ollama)
│   │   ├── speechService.ts # Hands-free STT and natural TTS
│   │   ├── visionService.ts # Real-time eye contact & posture heuristics
│   │   ├── codeRunner.ts    # Sandboxed JS/Python test case runner
│   │   └── resumeParser.ts  # Resume skill & seniority extractor
│   ├── data/
│   │   ├── dsaProblems.ts   # Curated LeetCode-style algorithm problems
│   │   └── behavioralBank.ts# STAR behavioral questions
│   ├── store/
│   │   └── interviewStore.ts# Zustand global session & history state
│   ├── components/
│   │   ├── layout/          # Header, Sidebar
│   │   ├── dashboard/       # Performance gauges & track selector
│   │   ├── setup/           # Role, company, resume & config wizard
│   │   ├── interview/       # Live Studio: Monaco editor, avatar, webcam HUD
│   │   ├── report/          # Comprehensive scorecard & debrief
│   │   ├── history/         # Past session archives
│   │   └── settings/        # API keys, Ollama setup, voice & camera
│   ├── App.tsx              # Application root
│   └── main.tsx
├── src-tauri/               # Tauri 2.0 Rust desktop backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       └── lib.rs
└── package.json
```

---

## 🔒 Privacy & Security
- **API Keys**: Stored solely in local browser storage (`localStorage`); never shared or logged.
- **Webcam & Mic**: Processed in real-time in memory via the browser MediaStream and Canvas APIs; no video feeds are uploaded or stored externally.
