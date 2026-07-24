import mongoose from "mongoose";
import {
  User,
  ChatHistory,
  RevisionMaterial,
  LessonPlan,
  Timetable,
} from "./models";
import type { IUser } from "./models";
import { ENV } from "./_core/env";
import { ensureConnection } from "./_core/mongodb";

// ─── User Helpers ───

/**
 * Upsert a user by openId (create or update).
 * Matches the same signature as the Drizzle version.
 */
export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
}): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  if (!(await ensureConnection())) {
    console.warn("[Database] Cannot upsert user: MongoDB not connected");
    return;
  }

  try {
    const updateSet: Record<string, unknown> = {};

    // Assign nullable text fields
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      updateSet.role = "admin";
    }

    if (!updateSet.lastSignedIn) {
      updateSet.lastSignedIn = new Date();
    }

    // Use findOneAndUpdate with upsert to match the Drizzle behavior
    await User.findOneAndUpdate(
      { openId: user.openId },
      {
        $set: {
          ...updateSet,
          openId: user.openId,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

/**
 * Get a user by their openId.
 * Returns a User-shaped object compatible with the existing auth flow.
 */
export async function getUserByOpenId(openId: string): Promise<IUser | undefined> {
  if (!(await ensureConnection())) {
    console.warn("[Database] Cannot get user: MongoDB not connected");
    return undefined;
  }

  try {
    const user = await User.findOne({ openId });
    return user ?? undefined;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return undefined;
  }
}

// ─── Chat History ───

export async function saveChatHistory(
  userId: number | mongoose.Types.ObjectId | string,
  portalType: "guest" | "student" | "teacher",
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<void> {
  if (!(await ensureConnection())) {
    console.warn("[Database] Cannot save chat history: MongoDB not connected");
    return;
  }

  try {
    const userIdObj =
      typeof userId === "string" || userId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(userId as string)
        : userId;

    // Upsert: create new or update existing
    await ChatHistory.findOneAndUpdate(
      { userId: userIdObj, portalType },
      {
        $set: {
          userId: userIdObj,
          portalType,
          messages,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("[Database] Failed to save chat history:", error);
    throw error;
  }
}

export async function loadChatHistory(
  userId: number | mongoose.Types.ObjectId | string,
  portalType: "guest" | "student" | "teacher"
): Promise<Array<{ role: "user" | "assistant"; content: string }> | null> {
  if (!(await ensureConnection())) {
    return null;
  }

  try {
    const userIdObj =
      typeof userId === "string" || userId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(userId as string)
        : userId;

    const chatHistory = await ChatHistory.findOne({
      userId: userIdObj,
      portalType,
    }).sort({ updatedAt: -1 }).limit(1);

    if (!chatHistory) return null;

    return chatHistory.messages
      .filter((m: { role: string; content: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }));
  } catch (error) {
    console.error("[Database] Failed to load chat history:", error);
    return null;
  }
}

// ─── Revision Materials ───

export async function saveRevisionMaterial(data: {
  curriculum: "8-4-4" | "CBE";
  subject: string;
  topic: string;
  content: string;
}): Promise<void> {
  if (!(await ensureConnection())) return;

  try {
    await RevisionMaterial.create(data);
  } catch (error) {
    console.error("[Database] Failed to save revision material:", error);
  }
}

// ─── Lesson Plans ───

export async function saveLessonPlan(data: {
  teacherId: number | mongoose.Types.ObjectId | string;
  title: string;
  subject: string;
  grade: string;
  content: string;
}): Promise<void> {
  if (!(await ensureConnection())) return;

  try {
    const teacherIdObj =
      typeof data.teacherId === "string" ||
      data.teacherId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(data.teacherId as string)
        : data.teacherId;

    await LessonPlan.create({
      ...data,
      teacherId: teacherIdObj,
    });
  } catch (error) {
    console.error("[Database] Failed to save lesson plan:", error);
  }
}

export async function loadLessonPlans(teacherId: number | mongoose.Types.ObjectId | string) {
  if (!(await ensureConnection())) return [];

  try {
    const teacherIdObj =
      typeof teacherId === "string" || teacherId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(teacherId as string)
        : teacherId;

    return await LessonPlan.find({ teacherId: teacherIdObj })
      .sort({ createdAt: -1 })
      .limit(50);
  } catch (error) {
    console.error("[Database] Failed to load lesson plans:", error);
    return [];
  }
}

// ─── Timetables ───

export async function saveTimetable(data: {
  teacherId: number | mongoose.Types.ObjectId | string;
  name: string;
  data: string;
}): Promise<void> {
  if (!(await ensureConnection())) return;

  try {
    const teacherIdObj =
      typeof data.teacherId === "string" ||
      data.teacherId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(data.teacherId as string)
        : data.teacherId;

    await Timetable.create({
      ...data,
      teacherId: teacherIdObj,
    });
  } catch (error) {
    console.error("[Database] Failed to save timetable:", error);
  }
}

export async function loadTimetables(teacherId: number | mongoose.Types.ObjectId | string) {
  if (!(await ensureConnection())) return [];

  try {
    const teacherIdObj =
      typeof teacherId === "string" || teacherId instanceof mongoose.Types.ObjectId
        ? new mongoose.Types.ObjectId(teacherId as string)
        : teacherId;

    return await Timetable.find({ teacherId: teacherIdObj })
      .sort({ createdAt: -1 })
      .limit(50);
  } catch (error) {
    console.error("[Database] Failed to load timetables:", error);
    return [];
  }
}
