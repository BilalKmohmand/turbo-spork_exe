import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, vector, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, relations } from "drizzle-orm";

// Users table with role support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // "student" | "teacher"
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  evaluations: many(evaluations),
}));

// Submissions table for student work
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id),
  studentName: text("student_name").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default("General"),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  status: text("status").notNull().default("pending"), // pending | ai_graded | teacher_reviewed
  aiSolution: text("ai_solution"),
  aiSteps: jsonb("ai_steps"),
  aiExplanation: text("ai_explanation"),
  problemType: text("problem_type").default("other"),
  graphSpec: jsonb("graph_spec"),
  messages: jsonb("messages"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const submissionsRelations = relations(submissions, ({ one }) => ({
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
  evaluation: one(evaluations),
}));

// Evaluations table for teacher reviews
export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => submissions.id).unique(),
  teacherId: varchar("teacher_id").references(() => users.id),
  score: integer("score"),
  feedback: text("feedback"),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
});

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  submission: one(submissions, {
    fields: [evaluations.submissionId],
    references: [submissions.id],
  }),
  teacher: one(users, {
    fields: [evaluations.teacherId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({ 
  id: true, 
  submittedAt: true,
  aiSolution: true,
  aiSteps: true,
  aiExplanation: true,
  graphSpec: true,
  messages: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  reviewedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserRole = "student" | "teacher";

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

// Additional types for the app
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

export interface StepObject {
  title: string;
  math: string;
  reasoning: string;
}

export interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  aiGraded: number;
  teacherReviewed: number;
  averageScore: number;
}

// Validation schemas for API
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

export const submitWorkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  studentName: z.string().optional(),
});

export const evaluateSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1, "Feedback is required"),
});

// Knowledge chunks table for RAG system
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  sourceBook: text("source_book").notNull(),
  chapter: text("chapter"),
  section: text("section"),
  page: integer("page"),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  contentType: text("content_type").notNull().default("general"), // definition | theorem | formula | example | exercise | explanation
  difficulty: text("difficulty").default("intermediate"), // beginner | intermediate | advanced
  keywords: text("keywords").array(),
  relatedFormulas: text("related_formulas").array(),
  commonMisconceptions: text("common_misconceptions"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("knowledge_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  index("knowledge_topic_idx").on(table.topic),
  index("knowledge_content_type_idx").on(table.contentType),
]);

export const insertKnowledgeChunkSchema = createInsertSchema(knowledgeChunks).omit({
  id: true,
  createdAt: true,
  embedding: true,
});

export type InsertKnowledgeChunk = z.infer<typeof insertKnowledgeChunkSchema>;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;

// Schema for uploading knowledge content
export const uploadKnowledgeSchema = z.object({
  content: z.string().min(1, "Content is required"),
  sourceBook: z.string().min(1, "Source book is required"),
  chapter: z.string().optional(),
  section: z.string().optional(),
  page: z.number().optional(),
  topic: z.string().min(1, "Topic is required"),
  subtopic: z.string().optional(),
  contentType: z.enum(["definition", "theorem", "formula", "example", "exercise", "explanation", "general"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  keywords: z.array(z.string()).optional(),
  relatedFormulas: z.array(z.string()).optional(),
  commonMisconceptions: z.string().optional(),
});
