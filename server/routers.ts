import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, studentProcedure, teacherProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import {
  loadChatHistory as loadChatHistoryFromDb,
  saveChatHistory as saveChatHistoryToDb,
} from "./db";
import { z } from "zod";

// ─── Model Configuration (Ollama open-source models) ───
const GUEST_MODEL = undefined;
const STUDENT_MODEL = undefined;
const TEACHER_MODEL = undefined;

// ─── Guest Chat System Prompt ───
const GUEST_SYSTEM_PROMPT = `You are the AI assistant for Kangaru Girls Senior School in Kenya. You help visitors learn about the school. Key facts:

- School Name: Kangaru Girls Senior School
- Founded: 1989
- Motto: "Grow in Grace"
- Category: Extra County
- Mean Score (KCSE): 7.385
- Email: info@kangarugirls.sc.ke
- Phone: +254796214804
- Location: Embu County, Kenya
- Principal: Margaret Muthoni Mbogo

You should be warm, welcoming, and informative. Answer questions about the school's history, academics, facilities, admissions, contacts, and achievements. If you don't know something, say so honestly and suggest they contact the school directly.`;

// ─── Student Revision System Prompt ───
const STUDENT_SYSTEM_PROMPT = `You are an AI revision assistant for students at Kangaru Girls Senior School in Kenya. You help students with their studies across both the 8-4-4 and CBE (Competency-Based Curriculum) systems.

When helping students:
- Explain concepts clearly and in age-appropriate language
- Provide examples and analogies
- Offer practice questions when appropriate
- Encourage critical thinking and understanding, not just memorization
- Reference the Kenyan curriculum context
- Format your responses with clear headings, bullet points, and examples

Always be encouraging and supportive.`;

// ─── Teacher Lesson Plan System Prompt ───
const TEACHER_LESSON_SYSTEM_PROMPT = `You are an AI lesson planning assistant for teachers at Kangaru Girls Senior School in Kenya. You help teachers create comprehensive, well-structured lesson plans.

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

Format with clear headings, bullet points, and numbered steps. Be practical and aligned with the Kenyan 8-4-4 and CBE curricula.`;

// ─── Teacher Timetable System Prompt ───
const TEACHER_TIMETABLE_SYSTEM_PROMPT = `You are an AI timetable scheduling assistant for teachers at Kangaru Girls Senior School in Kenya. You help teachers create organized weekly timetables.

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
            message: "Could not generate a response. Please try again or contact the school directly.",
          };
        } catch (error) {
          console.error("[GuestChat] Error:", error);
          return {
            success: false,
            message: "Sorry, there's a technical issue right now. Please try again later.",
          };
        }
      }),

    // ─── Student Revision (requires student role) ───
    studentRevision: studentProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          curriculum: z.enum(["8-4-4", "CBE"]).default("8-4-4"),
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
            // Save to chat history using website user ID
            await saveChatHistoryToDb(userId, "student", {
              role: "user",
              content: message,
            });
            await saveChatHistoryToDb(userId, "student", {
              role: "assistant",
              content: response,
            });

            return { success: true, message: response };
          }

          return {
            success: false,
            message: "Could not generate a response. Please try again.",
          };
        } catch (error) {
          console.error("[StudentRevision] Error:", error);
          return {
            success: false,
            message: "An error occurred. Please try again later.",
          };
        }
      }),

    // ─── Teacher Lesson Plan (requires teacher role) ───
    teacherLessonPlan: teacherProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subject: z.string(),
          gradeLevel: z.string(),
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

          const systemPrompt = `${TEACHER_LESSON_SYSTEM_PROMPT}\n\nCreating lesson plan for ${subject} at ${gradeLevel}.`;

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
            await saveChatHistoryToDb(userId, "teacher", {
              role: "user",
              content: message,
            });
            await saveChatHistoryToDb(userId, "teacher", {
              role: "assistant",
              content: response,
            });

            return { success: true, message: response };
          }

          return {
            success: false,
            message: "Could not generate a response. Please try again.",
          };
        } catch (error) {
          console.error("[TeacherLessonPlan] Error:", error);
          return {
            success: false,
            message: "An error occurred. Please try again later.",
          };
        }
      }),

    // ─── Teacher Timetable (requires teacher role) ───
    teacherTimetable: teacherProcedure
      .input(
        z.object({
          message: z.string().min(1, "Message is required"),
          subjects: z.array(z.string()),
          classes: z.array(z.string()),
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
          const { message, subjects, classes, availability, conversationHistory } = input;
          const userId = ctx.user.id;

          const systemPrompt = `${TEACHER_TIMETABLE_SYSTEM_PROMPT}\n\nTeacher teaches: ${subjects.join(", ")}\nClasses: ${classes.join(", ")}${
            availability ? `\nAvailability constraints: ${availability}` : ""
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
            await saveChatHistoryToDb(userId, "teacher", {
              role: "user",
              content: message,
            });
            await saveChatHistoryToDb(userId, "teacher", {
              role: "assistant",
              content: response,
            });

            return { success: true, message: response };
          }

          return {
            success: false,
            message: "Could not generate a response. Please try again.",
          };
        } catch (error) {
          console.error("[TeacherTimetable] Error:", error);
          return {
            success: false,
            message: "An error occurred. Please try again later.",
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
          const history = await loadChatHistoryFromDb(
            ctx.user.id,
            input.portalType
          );
          return history || [];
        } catch (error) {
          console.error("[LoadChatHistory] Error:", error);
          return [];
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
