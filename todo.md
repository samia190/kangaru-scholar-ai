# Project TODO: Kangaru Scholar AI

This document outlines the features and tasks for the Kangaru Scholar AI web platform.

## Phase 1: Plan architecture, database schema, and UI structure
- [x] Read relevant skills for web development and LLM integration
- [x] Initialize the web project
- [x] Define database schema for users, chat history, and other persistent data.
- [x] Outline the overall UI structure and navigation flow for Guest, Student, and Teacher portals.
  - [x] **Guest Portal:**
    - [x] Landing Page (`/`): School information, portal selector, Guest AI Chatbot.
    - [x] Guest Chat Interface (`/guest-chat`): Dedicated chat for guest queries.
  - [x] **Student Portal:**
    - [x] Student Dashboard (`/student`): Access to revision assistant.
    - [x] Revision Assistant Chat (`/student/revision`): AI chat for academic help.
  - [x] **Teacher Portal:**
    - [x] Teacher Dashboard (`/teacher`): Access to lesson planning and timetable tools.
    - [x] Lesson Planner (`/teacher/lesson-plan`): AI tool for generating lesson outlines (backend complete, UI built).
    - [x] Timetable Generator (`/teacher/timetable`): AI tool for creating timetables (backend complete, UI built).
  - [x] **Authentication:**
    - [x] Manus OAuth integration.
    - [x] Role-based redirection after login.
- [x] Select appropriate LLM models and integration strategy for each AI feature.
  - [x] **Guest AI Chatbot:** Use `llama3.2:1b:8b` for general school information queries.
  - [x] **Student Revision Assistant:** Use `qwen2.5:14b` for nuanced explanations and practice questions.
  - [x] **Teacher AI Tools (Lesson Planning, Pedagogical Questions, Timetable Generator):** Use `qwen2.5:14b` for reasoning and structured output (e.g., JSON for timetables).
  - [x] **Integration Strategy:**
    - All LLM calls will be made server-side using `invokeLLM` from `server/_core/llm`.
    - Ollama self-hosted LLM server (free, open-source, portable).
    - Each AI feature will have its own tRPC procedure in `server/routers.ts` to handle LLM interactions.
    - Authentication will be handled by `protectedProcedure` for student and teacher portals, and `publicProcedure` for the guest chatbot.
    - Chat history will be saved and retrieved using the `saveChatHistory` and `getChatHistoryByUserId` functions in `server/db.ts`.
    - The `messages` field in `chatHistories` table will store the conversation as a JSON string.

## Phase 2: Set up database schema, design system, and landing page
- [x] Implement database schema in `drizzle/schema.ts` and apply migrations.
- [x] Apply the generated Drizzle migration successfully to the database and verify the new table exists and is usable.
- [x] Establish a refined and polished design system (colors, typography, spacing) in `client/src/index.css`.
- [x] Develop the public landing page (`client/src/pages/Home.tsx`) with school information (history, contacts, motto, KCSE results, location).

## Phase 3: Build portal selector UI and guest chatbot
- [x] Create the portal selector UI on the home page for Guest, Student, and Teacher modes.
- [x] Register functional routes for `/guest-chat`, `/student`, and `/teacher` in `client/src/App.tsx`.
- [x] Create placeholder pages for GuestChat, StudentPortal, and TeacherPortal.
- [x] Implement the Guest AI chatbot on the landing page (no login required).
- [x] Integrate the Guest chatbot with `llama3.2:1b:8b` LLM (via Ollama) to answer questions about Kangaru Girls Senior School.
- [x] Create tRPC procedures for guest and student AI chatbots in `server/routers.ts`.
- [x] Implement StudentRevision chat page with curriculum and subject selection.

## Phase 4: Implement student revision portal with AI assistant
- [x] Design and implement the Student portal UI.
- [x] Develop the AI revision assistant for students (supporting 8-4-4 and CBE curricula).
- [x] Integrate student revision with `qwen2.5:14b` LLM (via Ollama).
- [x] Integrate the student AI with an LLM to answer subject questions, explain concepts, and provide practice questions.

## Phase 5: Implement teacher portal with lesson planning and timetable generator
- [x] Design and implement the Teacher portal UI.
- [x] Develop AI tools for lesson planning and generating lesson plan outlines.
- [x] Integrate the teacher AI with an LLM to answer pedagogical questions.
- [x] Implement the AI-powered timetable generator (input subjects, classes, availability; output weekly timetable).
- [x] Add tRPC procedures for `teacherLessonPlan` and `teacherTimetable` in `server/routers.ts`.

## Phase 6: Add persistent chat history, test all features, and create checkpoint
- [x] Implement persistent chat history per user, stored in the database (schema created).
- [x] Wire chat history persistence to all chat interfaces (save + load via tRPC).
- [x] Conduct comprehensive testing of all features (Guest chatbot, Student AI, Teacher AI, Timetable Generator).
- [x] Ensure role-based access control is correctly implemented.
- [x] Verify consistent use of "Kangaru Girls Senior School" throughout the platform.
- [x] Perform final styling adjustments for an elegant and polished presentation.
- [x] Create a final checkpoint and prepare for delivery.

## Phase 7: Enhance AI assistant reliability and response quality
- [x] Enhance AI context and system prompts for all chatbots.
- [x] Improve error handling and fallback responses.
- [x] Test and verify improved AI responses across all portals.
  - [x] Guest chatbot with expanded school context
  - [x] Student revision assistant with guided learning
  - [x] Teacher lesson planner with structured output
  - [x] Improved error handling and fallback messages

## Phase 8: Replace Manus Forge API with free, self-hosted Ollama LLMs
- [x] Refactor `server/_core/llm.ts` to support Ollama as primary LLM provider
- [x] Update `server/_core/env.ts` with Ollama environment variables
- [x] Replace model references in `server/routers.ts` (gpt-5-mini → llama3.2:1b:8b, claude-sonnet-4-6 → qwen2.5:14b)
- [x] Ensure backward compatibility with Forge API for testing
- [x] Update PROJECT_SUMMARY.md with new architecture

## Remaining Tasks
- [x] Create vitest tests for chat tRPC procedures (16 chat tests + 1 auth test = 17 total passing)
- [x] Wire chat history persistence to all chat interfaces
- [x] Enhance guest and student chat UIs with markdown rendering and better UX

## Completed Features
- [x] All tRPC procedures fully implemented and tested
- [x] Guest, student, and teacher AI chatbots with Ollama open-source LLM integration
- [x] Teacher portal with lesson planner and timetable generator UIs
- [x] Database schema with chat history support
- [x] Elegant design system with burgundy color scheme
- [x] Role-based access control with Manus OAuth
- [x] Comprehensive error handling and fallback responses
- [x] Free, self-hosted LLMs (no API keys, no external dependencies)
- [x] Markdown rendering across all chat interfaces
- [x] Persistent chat history with database-backed save/load

## Phase 9: Migrate database from Drizzle/MySQL to Mongoose/MongoDB Atlas
- [x] Install mongoose package
- [x] Create Mongoose schemas and models (User, ChatHistory, RevisionMaterial, LessonPlan, Timetable)
- [x] Rewrite server/db.ts with Mongoose-based database helpers
- [x] Create server/_core/mongodb.ts connection manager
- [x] Update server/_core/env.ts with MONGO_URL variable
- [x] Update server/_core/index.ts to initialize MongoDB on startup
- [x] Update server/_core/context.ts to normalize MongoDB documents for tRPC context
- [x] Update server/_core/sdk.ts to use IUser type and return PlainUser shape
- [x] Update tests for string ObjectId compatibility
- [x] TypeScript check: 0 errors
- [x] Tests: 19/19 passing
- [x] Create deployment guide for Render + MongoDB Atlas + Ollama
