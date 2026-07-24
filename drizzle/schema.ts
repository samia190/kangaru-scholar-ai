import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chat histories for guest, student, and teacher portals.
 */
export const chatHistories = mysqlTable("chatHistories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  portalType: mysqlEnum("portalType", ["guest", "student", "teacher"]).notNull(),
  messages: text("messages").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatHistory = typeof chatHistories.$inferSelect;
export type InsertChatHistory = typeof chatHistories.$inferInsert;

/**
 * Revision materials for student portal.
 */
export const revisionMaterials = mysqlTable("revisionMaterials", {
  id: int("id").autoincrement().primaryKey(),
  curriculum: mysqlEnum("curriculum", ["8-4-4", "CBE"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RevisionMaterial = typeof revisionMaterials.$inferSelect;
export type InsertRevisionMaterial = typeof revisionMaterials.$inferInsert;

/**
 * Lesson plans for teacher portal.
 */
export const lessonPlans = mysqlTable("lessonPlans", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type InsertLessonPlan = typeof lessonPlans.$inferInsert;

/**
 * Timetables for teacher portal.
 */
export const timetables = mysqlTable("timetables", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Timetable = typeof timetables.$inferSelect;
export type InsertTimetable = typeof timetables.$inferInsert;
