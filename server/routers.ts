import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import {
  loadChatHistory as loadChatHistoryFromDb,
  saveChatHistory as saveChatHistoryToDb,
} from "./db";
import { z } from "zod";

// ─── Model Configuration (Ollama open-source models) ───
// Change these to use different models. Examples:
// - llama3.1:8b (general purpose, good for chat)
// - qwen2.5:14b (strong reasoning, good for teachers)
// - mistral:7b (fast, good for general chat)
// - deepseek-coder:6.7b (code-focused)
const GUEST_MODEL = "llama3.2:1b";
const STUDENT_MODEL = "qwen2.5:1.5b";
const TEACHER_MODEL = "qwen2.5:1.5b";

// ─── Guest Chat System Prompt ───
const GUEST_SYSTEM_PROMPT = `You are the AI assistant for Kangaru Girls High School in Kenya. You help visitors learn about the school. Key facts:

- School Name: Kangaru Girls High School
- Founded: 1989
- Motto: "Grow in Grace"
- Category: Extra County
- Mean Score (KCSE): 7.385
- Email: info@kangarugirls.sc.ke
- Phone: +254 XXX XXX XXX
- Location: Embu County, Kenya

You should be warm, welcoming, and informative. Answer questions about the school's history, academics, facilities, admissions, contacts, and achievements. If you don't know something, say so honestly and suggest they contact the school directly.`;

// ─── Student Revision System Prompt ───
const STUDENT_SYSTEM_PROMPT = `You are an AI revision assistant for students at Kangaru Girls High School in Kenya. You help students with their studies across both the 8-4-4 and CBC (Competency-Based Curriculum) systems.

When helping students:
- Explain concepts clearly and in age-appropriate language
- Provide examples and analogies
- Offer practice questions when appropriate
- Encourage critical thinking and understanding, not just memorization
- Reference the Kenyan curriculum context
- Format your responses with clear headings, bullet points, and examples

Always be encouraging and supportive.`;

// ─── Teacher Lesson Plan System Prompt ───
const TEACHER_LESSON_SYSTEM_PROMPT = `You are an AI lesson planning assistant for teachers at Kangaru Girls High School in Kenya. You help teachers create comprehensive, well-structured lesson plans.

When creating lesson plans, always include:
1. Lesson Title and Objectives (specific, measurable)
2. Target Grade/Class Level
3. Duration (typically 40-80 minutes)
4. Teaching Materials Needed
5. Introduction/Warm-up (5-10 minutes)
6. Main Lesson Content (step-by-step activities)
7. Student Activities/Practice
8. Assessment/Evaluation methods
9. Conclusion/Summary
10. Homework/Follow-up (if applicable)
11. Differentiation strategies (for varying ability levels)

Format with clear headings, bullet points, and numbered steps. Be practical and aligned with the Kenyan 8-4-4 and CBC curricula.`;

// ─── Teacher Timetable System Prompt ───
const TEACHER_TIMETABLE_SYSTEM_PROMPT = `You are an AI timetable scheduling assistant for teachers at Kangaru Girls High School in Kenya. You help teachers create organized weekly timetables.

When creating timetables:
- Use a Monday-Friday school week format
- Typical school hours: 8:00 AM - 4:00 PM
- Include breaks (short break ~10:30 AM, lunch ~12:30 PM)
- Balance subjects across the week
- Consider that morning sessions are best for heavy subjects (Math, Sciences)
- Afternoon sessions for practical subjects and electives
- Format as a clear table with days and time slots
- Include the teacher's subjects, class assignments, and any constraints

Be organized, practical, and consider real school scheduling constraints.`;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  chat: router({
    // ─── Guest Chat (public, no auth required) ───
    guestChat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { message, conversationHistory } = input;

          // Build messages for the LLM
          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: GUEST_SYSTEM_PROMPT },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: GUEST_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            return { success: true, message: response };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
          };
        } catch (error) {
          console.error("[GuestChat] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
          };
        }
      }),

    // ─── Student Revision (requires auth) ───
    studentRevision: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          curriculum: z.enum(["8-4-4", "CBC"]).default("8-4-4"),
          subject: z.string().optional(),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const { message, curriculum, subject, conversationHistory } = input;
          const userId = ctx.user.id;

          // Build enhanced system prompt with curriculum context
          const systemPrompt = `${STUDENT_SYSTEM_PROMPT}\n\nThe student is using the ${curriculum} curriculum${
            subject ? ` and studying ${subject}` : ""
          }.`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: STUDENT_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "student", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[StudentRevision] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Teacher Lesson Plan (requires auth) ───
    teacherLessonPlan: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subject: z.string().min(1, "Subject is required"),
          gradeLevel: z.string().min(1, "Grade level is required"),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const { message, subject, gradeLevel, conversationHistory } = input;
          const userId = ctx.user.id;

          const systemPrompt = `${TEACHER_LESSON_SYSTEM_PROMPT}\n\nThe teacher is planning for ${subject} at ${gradeLevel} level.`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: TEACHER_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "teacher", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[TeacherLessonPlan] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Teacher Timetable (requires auth) ───
    teacherTimetable: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subjects: z.array(z.string()).min(1, "At least one subject is required"),
          classes: z.array(z.string()).min(1, "At least one class is required"),
          availability: z.string().optional(),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const {
            message,
            subjects,
            classes,
            availability,
            conversationHistory,
          } = input;
          const userId = ctx.user.id;

          const systemPrompt = `${TEACHER_TIMETABLE_SYSTEM_PROMPT}\n\nTeacher details:\n- Subjects: ${subjects.join(", ")}\n- Classes: ${classes.join(", ")}${
            availability ? `\n- Availability constraints: ${availability}` : ""
          }`;

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: message },
          ];

          const result = await invokeLLM({
            model: TEACHER_MODEL,
            messages: messages.map((m) => ({
              role: m.role as "user" | "system" | "assistant",
              content: m.content,
            })),
          });

          const response = result.choices?.[0]?.message?.content;

          if (typeof response === "string" && response.trim()) {
            // Save chat history
            const updatedHistory = [
              ...conversationHistory,
              { role: "user" as const, content: message },
              { role: "assistant" as const, content: response },
            ];
            await saveChatHistoryToDb(userId, "teacher", updatedHistory);

            return {
              success: true,
              message: response,
              userId,
            };
          }

          return {
            success: false,
            message: "I couldn't generate a response. Please try again.",
            userId,
          };
        } catch (error) {
          console.error("[TeacherTimetable] Error:", error);
          return {
            success: false,
            message:
              "Sorry, there's a technical issue right now. Please try again later.",
            userId: ctx.user.id,
          };
        }
      }),

    // ─── Load Chat History ───
    loadChatHistory: protectedProcedure
      .input(
        z.object({
          portalType: z.enum(["guest", "student", "teacher"]),
        })
      )
      .query(async ({ input, ctx }) => {
        try {
          const messages = await loadChatHistoryFromDb(
            ctx.user.id,
            input.portalType
          );

          return {
            success: true,
            messages: messages || [],
          };
        } catch (error) {
          console.error("[LoadChatHistory] Error:", error);
          return { success: true, messages: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
