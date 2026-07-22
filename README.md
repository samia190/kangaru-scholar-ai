# Kangaru Scholar AI

A comprehensive, self-hosted AI-powered educational platform for Kangaru Girls High School in Embu County, Kenya. Built with free, open-source LLMs and fully portable — no external API keys or paid services required.

## Features

The platform serves three distinct user groups through dedicated portals.

**Guest Portal** — Anyone can access the guest chatbot without signing in. The AI answers questions about the school's history, motto, academic performance, facilities, admissions, and contact information. It uses a fast general-purpose model optimized for conversational responses.

**Student Portal** — Authenticated students can access the revision assistant, which supports both the 8-4-4 and CBC curricula. The AI explains concepts, generates practice questions, and provides guided learning tailored to the student's subject and grade level. Chat history persists across sessions.

**Teacher Portal** — Authenticated teachers can use the lesson planner to generate structured lesson plans with objectives, activities, assessments, and resource lists. The timetable generator creates optimized weekly schedules based on subjects, classes, and availability constraints. Both tools save conversation history for future reference.

## Architecture

The project uses a full-stack TypeScript architecture with React on the frontend and Express on the backend, communicating via tRPC.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Tailwind CSS 4 | Responsive UI with burgundy theme |
| Backend | Express 4 + tRPC 11 | Type-safe API with authentication |
| Database | MySQL/TiDB + Drizzle ORM | Persistent storage for users, chat history |
| Authentication | Manus OAuth | Role-based access control |
| AI (LLM) | Ollama (self-hosted) | Free, portable open-source models |

## AI Models (Free & Self-Hosted)

All AI features run on free, open-source models via Ollama. The platform is completely independent — no API keys, no payments, no vendor lock-in.

| Feature | Model | Description |
|---------|-------|-------------|
| Guest Chatbot | `llama3.1:8b` | Fast general-purpose model for school information |
| Student Revision | `qwen2.5:14b` | Strong reasoning for explanations and practice questions |
| Lesson Planner | `qwen2.5:14b` | Structured reasoning for lesson plan generation |
| Timetable Generator | `qwen2.5:14b` | Structured reasoning for schedule optimization |

## Setup and Deployment

### Prerequisites

1. Node.js 22+ and pnpm
2. MySQL or TiDB database
3. Ollama installed and running on the server

### Installing Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull llama3.1:8b
ollama pull qwen2.5:14b

# Verify it's running
curl http://localhost:11434/api/tags
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=mysql://user:password@host:3306/kangaru_scholar
JWT_SECRET=your-random-secret-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://auth.manus.im
OLLAMA_BASE_URL=http://localhost:11434
```

The `OLLAMA_BASE_URL` tells the application where to find the Ollama server. If Ollama is running on the same machine, `http://localhost:11434` works. For remote Ollama servers, use the appropriate URL.

### Running Locally

```bash
pnpm install
pnpm dev
```

### Running Tests

```bash
pnpm test
```

All 17 tests pass, covering guest chatbot, student revision, teacher lesson planner, teacher timetable generator, and error handling.

## Project Structure

```
kangaru-scholar-ai/
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx              # Landing page with portal selector
│       │   ├── GuestChat.tsx         # Guest AI chatbot
│       │   ├── StudentPortal.tsx     # Student dashboard
│       │   ├── StudentRevision.tsx   # Revision assistant
│       │   ├── TeacherPortal.tsx     # Teacher dashboard
│       │   ├── TeacherLessonPlan.tsx # Lesson planner
│       │   └── TeacherTimetable.tsx  # Timetable generator
│       ├── components/
│       │   └── AIChatBox.tsx         # Reusable chat with markdown
│       └── App.tsx                   # Routing configuration
├── server/
│   ├── routers.ts                    # All tRPC procedures
│   ├── db.ts                         # Database helpers
│   ├── chat.test.ts                  # Chat procedure tests
│   └── _core/
│       ├── llm.ts                    # Ollama LLM integration
│       └── env.ts                    # Environment configuration
├── drizzle/
│   └── schema.ts                     # Database schema
└── todo.md                           # Implementation tracking
```

## Key Design Decisions

**Self-hosted AI over external APIs** — The platform uses Ollama instead of Manus Forge API or any paid LLM service. This means it can be deployed anywhere without depending on external infrastructure or API keys.

**Model fallback strategy** — The LLM module (`server/_core/llm.ts`) automatically maps old model names to open-source equivalents when Ollama is configured, and falls back to the Forge API for testing without Ollama installed.

**Chat history persistence** — All chat conversations are saved to the database and loaded when users return. This provides continuity across sessions for both students and teachers.

**Markdown rendering** — All AI responses support markdown formatting via the `AIChatBox` component and Streamdown, providing rich formatted output for lesson plans, timetables, and educational content.

## License

Proprietary — Kangaru Girls High School.
