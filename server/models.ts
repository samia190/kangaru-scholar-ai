import mongoose, { Schema, Document, model } from "mongoose";

// ─── Types ───

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface IChatHistory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  portalType: "guest" | "student" | "teacher";
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRevisionMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  curriculum: "8-4-4" | "CBC";
  subject: string;
  topic: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILessonPlan extends Document {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  grade: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimetable extends Document {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  name: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ───

const userSchema = new Schema<IUser>(
  {
    openId: { type: String, required: true, unique: true },
    name: { type: String, default: null },
    email: { type: String, default: null },
    loginMethod: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Compound unique index for openId
userSchema.index({ openId: 1 }, { unique: true });

const chatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    portalType: {
      type: String,
      enum: ["guest", "student", "teacher"],
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

// Index for fast lookups by user + portal type
chatHistorySchema.index({ userId: 1, portalType: 1 });
chatHistorySchema.index({ userId: 1, portalType: 1, updatedAt: -1 });

const revisionMaterialSchema = new Schema<IRevisionMaterial>(
  {
    curriculum: {
      type: String,
      enum: ["8-4-4", "CBC"],
      required: true,
    },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const lessonPlanSchema = new Schema<ILessonPlan>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

lessonPlanSchema.index({ teacherId: 1 });

const timetableSchema = new Schema<ITimetable>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    data: { type: String, required: true },
  },
  { timestamps: true }
);

timetableSchema.index({ teacherId: 1 });

// ─── Models ───

export const User = mongoose.models.User || model<IUser>("User", userSchema);
export const ChatHistory =
  mongoose.models.ChatHistory ||
  model<IChatHistory>("ChatHistory", chatHistorySchema);
export const RevisionMaterial =
  mongoose.models.RevisionMaterial ||
  model<IRevisionMaterial>("RevisionMaterial", revisionMaterialSchema);
export const LessonPlan =
  mongoose.models.LessonPlan ||
  model<ILessonPlan>("LessonPlan", lessonPlanSchema);
export const Timetable =
  mongoose.models.Timetable ||
  model<ITimetable>("Timetable", timetableSchema);
