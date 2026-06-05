# Health AI Avatar — Frontend Prototype

A web-based AI avatar health coach interface built as part of the Research Assistant application for the Health AI Avatar Project (Wilfrid Laurier University × McMaster University).

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/POOJAN311/health-avatar.git
cd health-avatar

# 2. Install dependencies
npm install
npm install three

# 3. Run locally
npm run dev

# 4. Open in browser
http://localhost:5173
```

> **Browser:** Safari recommended. Safari works for TTS. Chrome has limited SpeechSynthesis support.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 (Vite) |
| 3D Avatar | Three.js |
| Styling | Tailwind CSS |
| Voice Input | Browser MediaRecorder API |
| Text-to-Speech | Browser Web Speech API (SpeechSynthesis) |
| Backend | None — mock responses only |
| State Management | React useState / useRef / useCallback |

---

## Project Structure

```
src/
├── App.jsx                  # Root layout, state orchestration
├── mockResponses.js         # Simulated backend responses
└── components/
    ├── ChatInterface.jsx    # Chat UI, message flow, avatar state driver
    ├── PushToTalk.jsx       # Mic recording + simulated transcription
    ├── TextToSpeech.jsx     # SpeechSynthesis playback + waveform UI
    └── FeedbackForm.jsx     # Research feedback collection
```

---

## Features

### 1. Chat Interface
- User types a health question and receives a simulated AI response
- Messages display with timestamps, typing indicator, and smooth animations
- **Source badge** appears on responses that reference evidence documents
- **Safety banner** (`role="alert"`) appears prominently for high-risk responses
- Keyboard accessible: Enter to send, Shift+Enter for new line

### 2. Avatar States (Three.js)

The avatar is a 3D icosahedron with two orbit rings and a particle field, all built in Three.js. Every state transition is **smoothly interpolated** — no hard cuts. The avatar lerps color, pulse speed, rotation speed, and ring opacity on every animation frame.

| State | Color | Behaviour | Trigger |
|---|---|---|---|
| `idle` | Teal | Slow gentle pulse | Default / after response ends |
| `listening` | Green | Fast pulse, bright rings | Mic button held |
| `thinking` | Amber | Fast rotation, dim rings | Waiting for response |
| `speaking` | Blue | Rhythmic pulse, full rings | TTS playback active |
| `supportive` | Emerald | Calm warm glow | Normal health response |
| `warning` | Red | Rapid pulse, intense red rings | `guardrail_triggered: true` |

The **state legend** on the left panel is clickable — each item previews that avatar state instantly, useful for demos and screenshots.

### 3. Push-to-Talk Voice Input
- Uses the **browser MediaRecorder API** to genuinely request microphone permission and record audio
- Visual states: idle → requesting permission → recording (red button + pulse rings + live timer) → processing (spinner) → done
- Auto-stops after 30 seconds
- Works on mouse, touch (pointer events), and keyboard (Space/Enter)
- **Simulated transcription:** since no speech-to-text backend is available, a sample health question is injected into the chat after an 800ms delay. In production this would POST the audio blob to a Whisper or cloud STT endpoint.

### 4. Text-to-Speech Playback
- Uses the **browser Web Speech API** (SpeechSynthesis) — zero dependencies, no API key
- Auto-speaks each new assistant response
- Prefers a calm English voice (Samantha, Karen, Daniel, or Google US English) with fallback to any available English voice
- Animated waveform in the TTS bar reflects speaking state
- Manual play/stop button and collapsible speed + volume controls
- **Chrome fix:** unlocks audio context on first user gesture; keepalive interval (pause/resume every 10s) prevents Chrome's known SpeechSynthesis timeout bug, works fine with safari
- **Voice loading fix:** waits for `voiceschanged` event before speaking to avoid Chrome's async voice loading issue

### 5. Mock Backend Responses

Defined in `src/mockResponses.js`. The `getResponse(userMessage)` function matches keywords and returns the appropriate response object.

**Normal response example:**
```json
{
  "answer": "Headaches can have many causes including tension, dehydration, or stress...",
  "evidence_used": [
    { "document_id": "doc_3", "chunk_id": "chunk_7" }
  ],
  "guardrail_triggered": false,
  "emotion_state": "supportive",
  "safety_message": null
}
```

**High-risk response example:**
```json
{
  "answer": "Your symptoms may require urgent medical attention...",
  "evidence_used": [],
  "guardrail_triggered": true,
  "emotion_state": "warning",
  "safety_message": "⚠️ This may be a medical emergency. Call 911 immediately."
}
```

Covered topics: headache, chest pain / cardiac emergency, diabetes, medication, mental health crisis, sleep, blood pressure, and a default fallback.

### 6. Research Feedback Form
- Appears as a modal after 2 user exchanges
- 4 star-rating questions: ease of use, avatar clarity, response clarity, trust
- 1 optional open text comment
- Validates that all star questions are answered before submission
- On submit: logs a structured JSON object to the console and stores it in `window.__lastFeedback`
- In production this would POST to a research data collection API

### 7. Responsive & Accessible Design
- Stacks to single column on screens under 768px
- All buttons have `aria-label` attributes
- Safety banners use `role="alert"` and `aria-live="assertive"`
- Chat messages use `aria-live="polite"`
- Avatar has `role="img"` with descriptive `aria-label`
- Full keyboard navigation (Tab, Enter, Space)
- Sufficient color contrast throughout

---

## Limitations

- **No real speech-to-text:** push-to-talk records genuine audio but transcription is simulated. A Whisper or cloud STT integration would be needed for production.
- **No real backend:** all responses come from a local keyword-matching mock. A RAG/LLM API would replace `mockResponses.js`.
- **Chrome SpeechSynthesis reliability:** the Web Speech API has known bugs in Chrome (audio context unlocking, voice loading timing, 15s timeout). Workarounds are in place but a dedicated TTS API (ElevenLabs, Google Cloud TTS) would be more reliable in production.
- **Avatar is geometric, not humanoid:** the Three.js sphere communicates state clearly through color and motion but is not a character avatar. A Rive, Ready Player Me, or custom rigged character would be more engaging for patients.
- **No session persistence:** conversation history resets on page refresh.
- **Feedback is console-only:** no backend storage for research data.

---

## What I Would Build Over 4 Months

1. **Real STT integration** — connect the MediaRecorder output to a Whisper API endpoint for genuine voice-to-text transcription
2. **Humanoid avatar** — replace the geometric Three.js sphere with a Rive or Ready Player Me character with lip-sync tied to TTS audio output
3. **RAG/LLM backend connection** — wire the chat interface to the actual backend API being developed separately
4. **Dedicated TTS API** — replace Web Speech API with ElevenLabs or Google Cloud TTS for consistent cross-browser audio and more natural voice quality
5. **Session persistence** — save conversation history to localStorage or a backend so users can return to previous sessions
6. **Accessibility audit** — full WCAG 2.1 AA audit, screen reader testing with NVDA/VoiceOver, and cognitive load review with health domain experts
7. **Research analytics** — proper feedback submission to a database, session logging, and A/B testing infrastructure for avatar state effectiveness
8. **Patient onboarding flow** — welcome screen, consent form, and guided first interaction for users unfamiliar with AI health tools

---

## AI Tool Use Disclosure

This prototype was developed with assistance from **Claude (Anthropic)** as an AI coding tool.

**What Claude was used for:**
- Generating the initial structure and boilerplate for each React component
- Suggesting the Chrome SpeechSynthesis keepalive and voice-loading fixes
- Writing CSS styles and layout code
- Drafting this README

**What I personally reviewed, modified, and validated:**
- All component logic was written line by line and tested in the browser
- The Three.js avatar state system and animation loop were understood, adjusted, and debugged personally
- The integration between all components (ChatInterface → TextToSpeech → avatar state flow) was wired and debugged personally, including identifying and fixing the avatar state race condition and Chrome TTS silence bug
- Mock responses, keyword matching, and health content were reviewed for appropriateness
- All accessibility attributes were verified manually

AI assistance accelerated development of the boilerplate and styling. The architecture decisions, debugging, integration work, and domain-appropriate design choices were done by me.