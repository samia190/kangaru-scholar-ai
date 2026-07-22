import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the invokeLLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content:
            "This is a test response about Kangaru Girls High School.",
        },
      },
    ],
  })),
}));

// Helper function to create a mock context for public procedures
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// Helper function to create a mock context for protected procedures
function createProtectedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-123",
      email: "test@example.com",
      name: "Test Student",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Chat Procedures", () => {
  describe("guestChat", () => {
    it("should return a successful response for a valid guest message", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.guestChat({
        message: "Tell me about Kangaru Girls High School",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    });

    it("should handle conversation history correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const conversationHistory = [
        {
          role: "user" as const,
          content: "What is the school motto?",
        },
        {
          role: "assistant" as const,
          content: 'The school motto is "Grow in Grace".',
        },
      ];

      const result = await caller.chat.guestChat({
        message: "Can you tell me more about it?",
        conversationHistory,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should reject empty messages", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.guestChat({
          message: "",
          conversationHistory: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("studentRevision", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.studentRevision({
          message: "Help me with mathematics",
          curriculum: "8-4-4",
          subject: "Mathematics",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return a successful response for an authenticated student", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.studentRevision({
        message: "Explain quadratic equations",
        curriculum: "8-4-4",
        subject: "Mathematics",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it("should support CBC curriculum", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.studentRevision({
        message: "Help me with Biology",
        curriculum: "CBC",
        subject: "Biology",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should handle optional subject parameter", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.studentRevision({
        message: "What are the main topics in Form 1?",
        curriculum: "8-4-4",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("teacherLessonPlan", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.teacherLessonPlan({
          message: "Create a lesson plan",
          subject: "Mathematics",
          gradeLevel: "Form 1",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return a successful response for an authenticated teacher", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.teacherLessonPlan({
        message: "Create a lesson plan for quadratic equations",
        subject: "Mathematics",
        gradeLevel: "Form 3",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it("should include subject and grade level in the context", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.teacherLessonPlan({
        message: "Help me plan a lesson",
        subject: "English Literature",
        gradeLevel: "Form 4",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("teacherTimetable", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.chat.teacherTimetable({
          message: "Generate a timetable",
          subjects: ["Mathematics", "English"],
          classes: ["Form 1A", "Form 1B"],
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return a successful response for an authenticated teacher", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.teacherTimetable({
        message: "Generate a weekly timetable",
        subjects: ["Mathematics", "English", "Science"],
        classes: ["Form 1A", "Form 1B"],
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.userId).toBe(1);
    });

    it("should handle availability constraints", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.teacherTimetable({
        message: "Generate a timetable with constraints",
        subjects: ["Mathematics", "English"],
        classes: ["Form 1A"],
        availability: "Not available on Mondays",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it("should handle multiple subjects and classes", async () => {
      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.teacherTimetable({
        message: "Create a complex timetable",
        subjects: [
          "Mathematics",
          "English",
          "Science",
          "History",
          "Geography",
        ],
        classes: ["Form 1A", "Form 1B", "Form 2A", "Form 2B"],
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle LLM errors gracefully in guestChat", async () => {
      // Mock a failing LLM call
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockRejectedValueOnce(
        new Error("LLM service unavailable")
      );

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.guestChat({
        message: "Test message",
        conversationHistory: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("technical issue");
    });

    it("should handle LLM errors gracefully in studentRevision", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockRejectedValueOnce(
        new Error("LLM service unavailable")
      );

      const ctx = createProtectedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.chat.studentRevision({
        message: "Test message",
        curriculum: "8-4-4",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("technical issue");
    });
  });
});
