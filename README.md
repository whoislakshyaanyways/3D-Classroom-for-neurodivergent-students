# 🎓 3D AI Classroom for Neurodivergent Students

An immersive, accessible **3D AI-powered classroom** built with React Three Fiber, WebXR, and AI APIs — designed to support neurodivergent learners through interactive voice-driven lessons and a personalized AI tutor.

> **Built for students who learn differently.** Teacher Naoki delivers spoken lessons with 3D lip-sync, displays content on a live chalkboard, and answers questions in real time — all inside a full 3D classroom you can enter in VR.

---

## ✨ Features

- 🧑‍🏫 **3D AI Teacher (Naoki)** — Animates, blinks, and lip-syncs while speaking
- 🏫 **Two Classroom Modes** — Desktop 3D view or full VR (Meta Quest / WebXR)
- 🗣️ **Voice Input** — Speak questions using the in-world mic orb; transcribed via Groq Whisper
- ⌨️ **Text Input** — Type questions into the chat box in normal mode
- 📚 **Lesson 1: Our Five Senses** — A structured 8-step guided science lesson that auto-plays with Teacher Naoki speaking and displaying slides on the 3D blackboard
- 🤖 **Normal AI Assistance** — Ask any question on any subject; teacher answers with explanation and key takeaways
- 🖤 **Live 3D Chalkboard** — Displays question, answer, explanation, and key points in VR using a Canvas-based GPU texture
- 🔊 **TTS with Fallback** — Uses ElevenLabs for premium voice; auto-falls back to free Google TTS if quota is exceeded
- 📱 **VR-ready** — Works on Meta Quest browser via WebXR; full head-tracking and 3D interaction

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| 3D / VR | React Three Fiber, Three.js, @react-three/drei, @react-three/xr |
| AI (Q&A) | Groq API (LLaMA / GPT-compatible, via OpenAI SDK) |
| Speech-to-Text | Groq Whisper (`whisper-large-v3-turbo`) |
| Text-to-Speech | ElevenLabs (primary) → Google TTS (free fallback) |
| State Management | Zustand |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** v18 or later — [Download here](https://nodejs.org)
- **npm** or **yarn**
- API keys (see step 3)

### 2. Clone the Repository

```bash
git clone https://github.com/whoislakshyaanyways/3D-Classroom-for-neurodivergent-students.git
cd 3D-Classroom-for-neurodivergent-students
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a file called `.env.local` in the root of the project:

```bash
touch .env.local
```

Then open it and add your API keys:

```env
# Required: Groq API key — used for AI Q&A and Whisper speech-to-text
# Get it free at: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Optional: ElevenLabs — for premium AI voice (Teacher Naoki)
# If not set or quota exceeded, the app auto-falls back to free Google TTS
# Get it at: https://elevenlabs.io
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

> **Note:** `.env.local` is in `.gitignore` and will never be committed. Never share your API keys publicly.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 API Keys Guide

### Groq API Key (Required)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to **API Keys** and create a new key
4. Paste it as `GROQ_API_KEY` in your `.env.local`

The free tier is very generous (thousands of requests per day).

### ElevenLabs API Key (Optional)
1. Go to [elevenlabs.io](https://elevenlabs.io) and sign up
2. Go to your **Profile → API Keys**
3. Copy your key and paste as `ELEVENLABS_API_KEY`

> If you skip this or run out of ElevenLabs credits, the app **automatically uses free Google TTS** — no setup needed, no errors.

---

## 🥽 Using VR Mode (Meta Quest)

1. Make sure your computer and Meta Quest headset are on the **same Wi-Fi network**
2. Start the dev server: `npm run dev`
3. Find your computer's local IP address:
   - **Mac/Linux:** `ifconfig | grep "inet "` → look for something like `192.168.x.x`
   - **Windows:** `ipconfig` → look for IPv4 address
4. On Meta Quest, open the **Quest Browser** and navigate to `http://192.168.x.x:3000`
5. Tap the **🥽 VR Mode** or **Enter VR** button
6. The 3D classroom will appear in 360° — look around with full head-tracking!
7. Tap the **glowing mic orb** on the desk to ask Teacher Naoki a question by voice

> **Tip:** For a secure HTTPS connection (required for microphone in VR), you can use a free tunnel:
> ```bash
> npx localtunnel --port 3000
> ```
> Then open the HTTPS URL shown in your Quest browser.

---

## 📚 How to Use

### Normal AI Assistance Mode
1. Click **🤖 Normal AI** in the top-left
2. Type a question in the text box at the bottom, or record your voice with the 🎤 button
3. Teacher Naoki will speak the answer and display it on the classroom board

### Lesson 1: Five Senses (Structured Lesson)
1. Click **📚 Lesson 1: Senses** in the top-left
2. Teacher Naoki automatically starts teaching the lesson from the beginning
3. Use **Previous / Next** buttons to navigate between lesson parts
4. Use **Replay Teacher** to hear a part again
5. At the end, ask any follow-up questions by voice or text — Naoki will answer in the context of the lesson

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/route.js        # AI Q&A endpoint (Groq LLM)
│   │   ├── stt/route.js       # Speech-to-text (Groq Whisper)
│   │   └── tts/route.js       # Text-to-speech (ElevenLabs + Google fallback)
│   └── page.js                # App entry point
├── components/
│   ├── Experience.jsx         # Main 3D scene + mode switcher
│   ├── Teacher.jsx            # 3D animated teacher with lip-sync
│   ├── VRBoard.jsx            # Live 3D chalkboard (CanvasTexture)
│   ├── VRVoiceButton.jsx      # In-world 3D mic orb for voice input
│   ├── VRModeButton.jsx       # VR mode toggle button
│   ├── Lesson1View.jsx        # Desktop lesson UI with navigation
│   ├── MessagesList.jsx       # Q&A message feed (normal mode)
│   ├── TypingBox.jsx          # Text + voice input bar
│   └── BoardSettings.jsx      # Mode selector (Normal / Lesson 1)
├── hooks/
│   └── useAITeacher.js        # Central Zustand store for all app state
└── data/
    └── lessons.js             # Lesson 1 content: Five Senses curriculum
```

---

## 🧩 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for AI completions and Whisper STT |
| `ELEVENLABS_API_KEY` | ⚡ Optional | ElevenLabs key for premium AI voice |
| `ELEVENLABS_VOICE_ID` | ⚡ Optional | ElevenLabs voice ID (default: `JBFqnCBsd6RMkjVDRZzb`) |
| `GROQ_MODEL` | ⚡ Optional | Override the Groq model (default: `openai/gpt-oss-20b`) |
| `ELEVENLABS_MODEL` | ⚡ Optional | Override the ElevenLabs model (default: `eleven_multilingual_v2`) |

---

## 🛠️ Production Build

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Pull requests are welcome! If you want to add a new lesson, a new teacher character, or improve accessibility features, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT License — feel free to use, modify, and distribute with attribution.

---

## 🙏 Credits

- 3D Teacher models from [Ready Player Me](https://readyplayer.me)
- Classroom 3D models by the original project creators
- Built with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Three.js](https://threejs.org), [Next.js](https://nextjs.org)
- AI powered by [Groq](https://groq.com) and [ElevenLabs](https://elevenlabs.io)
