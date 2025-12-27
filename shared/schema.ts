import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type UserRole = "student" | "teacher";

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  maxScore: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface GraphSpec {
  expressions: string[];
  title?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentName: string;
  content: string;
  submittedAt: string;
  status: "pending" | "ai_graded" | "teacher_reviewed";
  aiSolution?: string;
  aiSteps?: string[];
  aiExplanation?: string;
  problemType?: "math" | "science" | "other";
  graphSpec?: GraphSpec;
  messages?: Message[];
  teacherScore?: number;
  teacherFeedback?: string;
  reviewedAt?: string;
}

export interface DashboardStats {
  totalAssignments: number;
  pendingSubmissions: number;
  completedSubmissions: number;
  averageScore: number;
}

export const insertAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.number().min(1).max(100).default(100),
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export const insertSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
  studentName: z.string().min(1, "Student name is required"),
  content: z.string().min(1, "Content is required"),
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export const evaluationSchema = z.object({
  submissionId: z.string().min(1),
  teacherScore: z.number().min(0).max(100),
  teacherFeedback: z.string().min(1, "Feedback is required"),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;
