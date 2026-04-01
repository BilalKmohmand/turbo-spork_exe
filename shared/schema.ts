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
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  badges: text("badges").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

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

// Quiz attempts to track history and stats
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  topic: text("topic").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  difficulty: text("difficulty").notNull(),
  quizType: text("quiz_type").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ 
  id: true, 
  attemptedAt: true 
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Update DashboardStats to include quiz data
export interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  aiGraded: number;
  teacherReviewed: number;
  averageScore: number;
  quizzesSolvedToday: number;
  quizzesSolvedYesterday: number;
  totalQuizzesSolved: number;
  points: number;
  level: number;
  nextLevelPoints: number;
}

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

export interface QuestionObject {
  questionNumber: number;
  problemStatement: string;
  steps: StepObject[];
  answer: string;
}

// Validation schemas for API
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .refine(v => v.trim().length > 0, "Password cannot be only spaces")
    .refine(v => /[a-zA-Z]/.test(v), "Password must contain at least one letter"),
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

// Rubrics table for teacher evaluation criteria
export const rubrics = pgTable("rubrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  classId: varchar("class_id").references(() => classes.id),
  name: text("name").notNull(),
  subject: text("subject").notNull().default("General"),
  totalPoints: integer("total_points").notNull().default(100),
  description: text("description"),
  gradeLevel: text("grade_level"),
  assignmentType: text("assignment_type"),
  studentInstructions: text("student_instructions"),
  estimatedTime: text("estimated_time"),
  status: text("status").notNull().default("draft"), // draft | published
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rubricCriteria = pgTable("rubric_criteria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rubricId: varchar("rubric_id").references(() => rubrics.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  maxPoints: integer("max_points").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const rubricSubmissions = pgTable("rubric_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rubricId: varchar("rubric_id").references(() => rubrics.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  studentId: varchar("student_id").references(() => users.id),
  studentName: text("student_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("submitted"), // submitted | ai_evaluated | pushed
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const rubricEvaluations = pgTable("rubric_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => rubricSubmissions.id).notNull(),
  rubricId: varchar("rubric_id").references(() => rubrics.id).notNull(),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  overallScore: integer("overall_score").notNull(),
  overallFeedback: text("overall_feedback").notNull(),
  criteriaScores: jsonb("criteria_scores").notNull(), // [{criterionId, criterionName, score, maxPoints, feedback}]
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
  pushedAt: timestamp("pushed_at"),
});

// Rubric insert schemas
export const insertRubricSchema = createInsertSchema(rubrics).omit({ id: true, createdAt: true });
export const insertRubricCriterionSchema = createInsertSchema(rubricCriteria).omit({ id: true });
export const insertRubricSubmissionSchema = createInsertSchema(rubricSubmissions).omit({ id: true, submittedAt: true, status: true, teacherId: true });
export const insertRubricEvaluationSchema = createInsertSchema(rubricEvaluations).omit({ id: true, evaluatedAt: true });

// Rubric types
export type Rubric = typeof rubrics.$inferSelect;
export type InsertRubric = z.infer<typeof insertRubricSchema>;
export type RubricCriterion = typeof rubricCriteria.$inferSelect;
export type InsertRubricCriterion = z.infer<typeof insertRubricCriterionSchema>;
export type RubricSubmission = typeof rubricSubmissions.$inferSelect;
export type InsertRubricSubmission = z.infer<typeof insertRubricSubmissionSchema>;
export type RubricEvaluation = typeof rubricEvaluations.$inferSelect;
export type InsertRubricEvaluation = z.infer<typeof insertRubricEvaluationSchema>;

export interface CriterionScore {
  criterionId: string;
  criterionName: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

// Rubric validation schemas
export const createRubricSchema = z.object({
  name: z.string().min(1, "Rubric name is required"),
  subject: z.string().min(1, "Subject is required"),
  criteria: z.array(z.object({
    name: z.string().min(1, "Criterion name is required"),
    description: z.string().min(1, "Description is required"),
    maxPoints: z.number().min(1, "Points must be at least 1"),
  })).min(1, "At least one criterion is required"),
});

export const addSubmissionSchema = z.object({
  rubricId: z.string().min(1),
  studentName: z.string().min(1, "Student name is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const batchEvaluateSchema = z.object({
  submissionIds: z.array(z.string()).min(1, "At least one submission required"),
});

// ── AI Courses ─────────────────────────────────────────────────────

export interface CourseLesson {
  title: string;
  duration: string;
}

export interface CourseChapter {
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  audience: text("audience").notNull().default("general"),
  description: text("description").notNull(),
  coverEmoji: text("cover_emoji").notNull().default("📚"),
  chapters: jsonb("chapters").notNull().$type<CourseChapter[]>(),
  totalLessons: integer("total_lessons").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessonContents = pgTable("lesson_contents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  lessonKey: text("lesson_key").notNull(),
  content: text("content").notNull(),
  quiz: jsonb("quiz").notNull().$type<QuizQuestion[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  lessonKey: text("lesson_key").notNull(),
  score: integer("score"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertLessonContentSchema = createInsertSchema(lessonContents).omit({ id: true, createdAt: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, completedAt: true });

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type LessonContent = typeof lessonContents.$inferSelect;
export type InsertLessonContent = z.infer<typeof insertLessonContentSchema>;
export type LessonProgressRow = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;

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

// Tutor chat sessions for persistent history
export const tutorSessions = pgTable("tutor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull().default("New Conversation"),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTutorSessionSchema = createInsertSchema(tutorSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TutorSession = typeof tutorSessions.$inferSelect;
export type InsertTutorSession = z.infer<typeof insertTutorSessionSchema>;

// ── Teacher Profile ─────────────────────────────────────────────
export const teacherProfiles = pgTable("teacher_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  school: text("school"),
  subjects: text("subjects").array().notNull().default(sql`'{}'::text[]`),
  gradeLevel: text("grade_level"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;

// ── Classes ─────────────────────────────────────────────────────
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull().default("General"),
  gradeLevel: text("grade_level"),
  classCode: varchar("class_code", { length: 8 }).notNull().unique(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

// ── Class Memberships ────────────────────────────────────────────
export const classMemberships = pgTable("class_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertClassMembershipSchema = createInsertSchema(classMemberships).omit({ id: true, joinedAt: true });
export type ClassMembership = typeof classMemberships.$inferSelect;
export type InsertClassMembership = z.infer<typeof insertClassMembershipSchema>;

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
