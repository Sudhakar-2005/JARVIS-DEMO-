# 🤖 J.A.R.V.I.S. — Desktop AI Companion

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-00D9FF?style=for-the-badge&logo=google-gemini&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-Enabled-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Powered%20By-Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
</p>

<p align="center">
  <b>A Personal AI Companion Inspired by Tony Stark's J.A.R.V.I.S.</b>
</p>

<p align="center">
  An intelligent desktop assistant designed to bring conversational AI, voice interaction, system awareness, visual intelligence, and automation into a unified experience.
</p>

---

## 🚀 Introduction

What if your computer had an intelligent assistant that could understand your instructions, communicate naturally, analyze your screen, retrieve information, and help manage your digital workspace?

**J.A.R.V.I.S. (Just A Rather Very Intelligent System)** is an experimental AI-powered desktop companion inspired by the fictional assistant from the Iron Man universe.

The project combines Google's Gemini AI, a React-based interactive interface, an Express backend, and a downloadable Python assistant framework to create a futuristic personal computing experience.

The objective is to move beyond traditional chatbot interactions and explore a more intelligent, context-aware, and action-oriented desktop assistant.

---

## ✨ Key Features

### 🧠 1. AI Intelligence & Conversation
- Gemini-powered conversational intelligence.
- Natural language command understanding.
- Context-aware responses.
- Structured function calling.
- Intelligent fallback command handling.

### 🎙️ 2. Voice & Visual Interaction
- Microphone permission support.
- Camera permission support.
- Voice-oriented assistant interaction.
- Screen and image analysis workflows.
- Interactive visual assistant interface.

### 🖥️ 3. Desktop System Intelligence
- System-state awareness.
- Volume and brightness control action requests.
- Battery and power-status queries.
- Application launching requests.
- Window-management action requests.
- Workspace-related operations.

*Actual desktop control depends on the available client-side or native integrations.*

### 🌐 4. Web & Environmental Intelligence
- Weather information using Open-Meteo.
- Location-based weather lookup.
- Web search summaries using DuckDuckGo.
- Gemini-powered visual analysis.
- External API integrations.

### 🧩 5. Memory Management
- User memory context.
- Memory categorization.
- Memory addition and deletion requests.
- Context injection into AI conversations.
- Personalized assistant interaction.

### 📦 6. Standalone Python Assistant
J.A.R.V.I.S. includes a downloadable Python assistant package generated dynamically by the backend.

The generated package contains:

- Standalone assistant script.
- Voice input and output modules.
- Wake phrase detection.
- System action modules.
- File management.
- Undo history.
- Task planning scaffold.
- Plugin and skill architecture.
- Memory and configuration files.
- Windows, Linux, and Android-oriented launch scripts.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animations | Motion |
| Icons | Lucide React |
| Backend | Node.js, Express |
| AI Engine | Google Gemini API |
| Data Visualization | Recharts |
| Packaging | JSZip |
| Configuration | dotenv |
| Weather API | Open-Meteo |
| Search Integration | DuckDuckGo Instant Answers |

---

## 🏗️ System Architecture

```text
                 USER INTERACTION
                        |
                        v
              +--------------------+
              |    J.A.R.V.I.S.    |
              |    React HUD UI    |
              +--------------------+
                        |
                        v
              +--------------------+
              |    Express API     |
              |    Backend Core    |
              +--------------------+
                        |
         +--------------+--------------+
         |              |              |
         v              v              v
    Gemini AI       External APIs   Python Export
         |              |              |
         v              v              v
    Intelligence    Weather/Search   Desktop
    & Function      & Vision         Assistant
    Calling         Integrations     Framework
         |              |              |
         +--------------+--------------+
                        |
                        v
              STRUCTURED RESPONSES
                        |
                        v
                USER INTERACTION
```

---

## 📂 Project Structure

```text
JARVIS-DEMO/
│
├── public/
│
├── src/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── services/
│   ├── spatial/
│   ├── utils/
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server.ts
├── index.html
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
├── metadata.json
└── .env.example
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- Bun or npm
- Google Gemini API Key

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sudhakar-2005/JARVIS-DEMO-.git

cd JARVIS-DEMO-
```

### Step 2: Install Dependencies

Using Bun:

```bash
bun install
```

Alternatively, using npm:

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory.

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Get your API key from:

https://aistudio.google.com/app/apikey

**Important:** Never upload your actual API key to GitHub.

### Step 4: Run the Application

Using Bun:

```bash
bun run dev
```

Using npm:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### Step 5: Production Build

```bash
bun run build
```

---

## 🔌 API Endpoints

The Express backend provides the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/weather` | Retrieves weather information |
| POST | `/api/web-search` | Performs search-summary retrieval |
| GET | `/api/neural-sync` | Checks API connectivity and latency |
| POST | `/api/vision/analyze` | Performs image-based analysis |
| POST | `/api/jarvis/chat` | Processes AI conversations |
| GET | `/api/download-python-app` | Downloads the Python assistant package |

---

## 🐍 Python Assistant Architecture

The downloadable Python package follows a modular architecture.

```text
J.A.R.V.I.S. PYTHON CORE
          |
          |
    +-----+------+
    |            |
    v            v
Voice Input   Wake Word
    |            |
    +------+-----+
           |
           v
      AI INTELLIGENCE
           |
     +-----+------+
     |            |
     v            v
 Task Planner   Memory
     |            |
     +------+-----+
            |
            v
     ACTION EXECUTION
            |
    +-------+-------+
    |       |       |
    v       v       v
 System   Files   Plugins
 Control  Manager Skills
```

The generated Python framework is a starting point for extending the assistant into a more independent desktop application.

---

## 🔐 Security Considerations

Security is important when building an AI assistant capable of interacting with a user's system.

- API credentials must remain server-side.
- AI-generated actions should be validated before execution.
- Sensitive operations should require user authorization.
- File operations should be restricted to approved directories.
- Microphone, camera, and screen access should require explicit consent.
- Public deployments should implement authentication, rate limiting, and appropriate request validation.

---

## 🗺️ Future Roadmap

The following are potential development directions:

- [ ] Advanced offline AI capabilities.
- [ ] More reliable wake-word detection.
- [ ] Improved speech recognition and voice synthesis.
- [ ] Advanced cross-platform desktop integration.
- [ ] Secure computer-use automation.
- [ ] Improved long-term memory architecture.
- [ ] Multi-agent task execution.
- [ ] Advanced plugin ecosystem.
- [ ] Mobile companion application.
- [ ] User-controlled automation and approval workflows.

---

## 🎯 Project Vision

The long-term vision of J.A.R.V.I.S. is to explore the next generation of personal computing assistants.

Instead of interacting with computers through applications, menus, and repetitive manual operations, users should be able to communicate their intentions naturally.

J.A.R.V.I.S. explores how conversational intelligence, contextual awareness, visual understanding, and controlled automation can work together to create a more intuitive computing experience.

---

## 👨‍💻 Developer

**Sudhakar B**

AI Developer | Agentic AI Enthusiast | Forward Deployment Engineering

GitHub: https://github.com/Sudhakar-2005

---

## ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub.

Your support motivates further development and experimentation.

---

<p align="center">
  <b>J.A.R.V.I.S. — Your Personal AI. Your Digital Companion.</b>
</p>

<p align="center">
  <i>"Sometimes, you gotta run before you can walk."</i>
</p>
