# Kangaru Scholar AI Refactoring Analysis

## Project Overview

Kangaru Scholar AI is a comprehensive web platform built with React 19, Tailwind CSS 4, Express 4, tRPC 11, and Drizzle ORM. It provides AI-powered tools for guests, students, and teachers at Kangaru Girls Senior School.

## Current State Assessment

### Completed Features

The project is approximately 90% complete. The following major components have been fully implemented:

1. **Database Schema** — All tables are defined in `drizzle/schema.ts` including `users`, `chatHistories`, `revisionMaterials`, `lessonPlans`, and `timetables`. Migrations are generated and ready to apply.

2. **Backend tRPC Procedures** — Four AI-powered procedures are fully implemented in `server/routers.ts`:
   - `chat.guestChat` — Public endpoint using `gpt-5-mini`
   - `chat.studentRevision` — Protected endpoint using `claude-sonnet-4-6`
   - `chat.teacherLessonPlan` — Protected endpoint using `claude-sonnet-4-6`
   - `chat.teacherTimetable` — Protected endpoint using `claude-sonnet-4-6`

3. **Frontend Pages** — All portal pages are built:
   - `Home.tsx` — Landing page with school information and portal selector
   - `GuestChat.tsx` — Guest chatbot interface
   - `StudentPortal.tsx` — Student dashboard
   - `StudentRevision.tsx` — Revision assistant with curriculum selection
   - `TeacherPortal.tsx` — Teacher dashboard
   - `TeacherLessonPlan.tsx` — Lesson planner page
   - `TeacherTimetable.tsx` — Timetable generator page

4. **Authentication** — Manus OAuth integration with role-based access control.

5. **Design System** — Burgundy/wine color scheme with Playfair Display and Inter typography.

6. **Testing** — 17 passing Vitest tests (16 chat + 1 auth).

7. **Reusable Components** — `AIChatBox.tsx` with markdown rendering via Streamdown is available but not wired to the chat pages.

### Incomplete Tasks (from todo.md)

| Task | Status | File(s) Involved |
|------|--------|-------------------|
| Wire chat history persistence to all chat interfaces | Not done | `server/routers.ts`, `server/db.ts`, `GuestChat.tsx`, `StudentRevision.tsx` |
| Enhance guest and student chat UIs with markdown rendering | Not done | `GuestChat.tsx`, `StudentRevision.tsx` (should use `AIChatBox.tsx`) |

## LLM Integration Points

The entire LLM architecture flows through a single file:

### `server/_core/llm.ts` (Core LLM Module)

This file exports `invokeLLM()` and `listLLMModels()` functions. Currently it:

- Uses the Manus Forge API (`BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY`)
- Talks to an OpenAI-compatible endpoint at `forge.manus.im/v1/chat/completions`
- Supports models: `gpt-5-mini`, `claude-sonnet-4-6`

### `server/routers.ts` (All LLM Call Sites)

Four procedures call `invokeLLM()`:

| Procedure | Current Model | Model Purpose |
|-----------|---------------|---------------|
| `guestChat` | `gpt-5-mini` | General school information queries |
| `studentRevision` | `claude-sonnet-4-6` | Nuanced academic explanations |
| `teacherLessonPlan` | `claude-sonnet-4-6` | Structured lesson plan generation |
| `teacherTimetable` | `claude-sonnet-4-6` | Complex scheduling reasoning |

### `server/_core/env.ts` (Environment Variables)

Current LLM-related env vars:
- `BUILT_IN_FORGE_API_URL` — Manus Forge API base URL
- `BUILT_IN_FORGE_API_KEY` — Manus Forge API bearer token

## Refactoring Strategy

### LLM Replacement

The refactor will replace the Manus Forge API with **Ollama** as the self-hosted LLM provider. Ollama provides an OpenAI-compatible API, making the transition minimal. The changes are:

1. **`server/_core/llm.ts`** — Replace the Forge API URL and model names with Ollama-compatible endpoints
2. **`server/routers.ts`** — Update model references:
   - `gpt-5-mini` → `llama3.2:1b:8b` (fast, cost-free for general queries)
   - `claude-sonnet-4-6` → `qwen2.5:14b` (strong reasoning for structured tasks)
3. **`server/_core/env.ts`** — Add Ollama base URL environment variable
4. **Add `ollama` npm package** — Use the official Ollama Node.js client for cleaner integration

### Model Selection Rationale

| Feature | Old Model | New Model | Reason |
|---------|-----------|-----------|--------|
| Guest Chatbot | `gpt-5-mini` | `llama3.2:1b:8b` | Fast, efficient for Q&A |
| Student Revision | `claude-sonnet-4-6` | `qwen2.5:14b` | Strong reasoning, free |
| Teacher Lesson Plan | `claude-sonnet-4-6` | `qwen2.5:14b` | Structured output capability |
| Teacher Timetable | `claude-sonnet-4-6` | `qwen2.5:14b` | Complex scheduling logic |

### Additional Model Options

The implementation will support configurable models via environment variables, so users can swap in any Ollama-supported model:

- `llama3.2:1b:8B` — General purpose, fast
- `QWEN2.5:14B` — Strong reasoning and coding
- `MISTRAL:7B` — Good all-rounder
- `NEURAL-CHAT:7B` — Conversational focus
- `CODERAMA:7B` — Code-related tasks
