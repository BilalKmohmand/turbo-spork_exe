import { 
  type User, 
  type InsertUser, 
  type Submission, 
  type InsertSubmission,
  type Evaluation,
  type InsertEvaluation,
  type DashboardStats,
  type StepObject,
  type Message,
  type GraphSpec,
  type Rubric,
  type InsertRubric,
  type RubricCriterion,
  type InsertRubricCriterion,
  type RubricSubmission,
  type InsertRubricSubmission,
  type RubricEvaluation,
  type InsertRubricEvaluation,
  users,
  submissions,
  evaluations,
  rubrics,
  rubricCriteria,
  rubricSubmissions,
  rubricEvaluations,
  quizAttempts,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Submission operations
  createSubmission(data: Partial<InsertSubmission> & { content: string; studentName: string; title: string }): Promise<Submission>;
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;
  getPendingSubmissions(): Promise<Submission[]>;
  updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | undefined>;
  
  // Evaluation operations
  createEvaluation(data: InsertEvaluation): Promise<Evaluation>;
  getEvaluationBySubmission(submissionId: string): Promise<Evaluation | undefined>;
  
  // Stats
  getStudentStats(studentId?: string): Promise<DashboardStats>;
  getTeacherStats(): Promise<DashboardStats>;

  // Quiz operations
  createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;

  // Rubric operations
  createRubric(data: InsertRubric): Promise<Rubric>;
  getRubric(id: string): Promise<Rubric | undefined>;
  getRubricsByTeacher(teacherId: string): Promise<Rubric[]>;
  deleteRubric(id: string): Promise<void>;
  getCriteriaByRubric(rubricId: string): Promise<RubricCriterion[]>;
  createCriteria(data: InsertRubricCriterion[]): Promise<RubricCriterion[]>;
  createRubricSubmission(data: InsertRubricSubmission): Promise<RubricSubmission>;
  getRubricSubmission(id: string): Promise<RubricSubmission | undefined>;
  getRubricSubmissionsByRubric(rubricId: string): Promise<RubricSubmission[]>;
  updateRubricSubmissionStatus(id: string, status: string): Promise<void>;
  createRubricEvaluation(data: InsertRubricEvaluation): Promise<RubricEvaluation>;
  getRubricEvaluationsByRubric(rubricId: string): Promise<RubricEvaluation[]>;
  getRubricEvaluationsByTeacher(teacherId: string): Promise<RubricEvaluation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      email: insertUser.email,
      displayName: insertUser.displayName,
      password: insertUser.password,
      role: insertUser.role || "student",
    }).returning();
    return user;
  }

  async createSubmission(data: Partial<InsertSubmission> & { content: string; studentName: string; title: string }): Promise<Submission> {
    const [submission] = await db.insert(submissions).values({
      studentId: data.studentId || null,
      studentName: data.studentName,
      title: data.title,
      subject: data.subject || "General",
      content: data.content,
      fileUrl: data.fileUrl || null,
      status: data.status || "pending",
      problemType: data.problemType || "other",
    }).returning();
    return submission;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .orderBy(desc(submissions.submittedAt));
  }

  async getPendingSubmissions(): Promise<Submission[]> {
    return await db.select()
      .from(submissions)
      .where(eq(submissions.status, "ai_graded"))
      .orderBy(desc(submissions.submittedAt));
  }

  async updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | undefined> {
    const updateData: Record<string, any> = {};
    
    if (data.status !== undefined) updateData.status = data.status;
    if (data.aiSolution !== undefined) updateData.aiSolution = data.aiSolution;
    if (data.aiSteps !== undefined) updateData.aiSteps = data.aiSteps;
    if (data.aiExplanation !== undefined) updateData.aiExplanation = data.aiExplanation;
    if (data.problemType !== undefined) updateData.problemType = data.problemType;
    if (data.graphSpec !== undefined) updateData.graphSpec = data.graphSpec;
    if (data.messages !== undefined) updateData.messages = data.messages;
    
    if (Object.keys(updateData).length === 0) {
      return this.getSubmission(id);
    }
    
    const [updated] = await db.update(submissions)
      .set(updateData)
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  async createEvaluation(data: InsertEvaluation): Promise<Evaluation> {
    const [evaluation] = await db.insert(evaluations).values({
      submissionId: data.submissionId || null,
      teacherId: data.teacherId || null,
      score: data.score || null,
      feedback: data.feedback || null,
    }).returning();
    
    // Update submission status
    if (data.submissionId) {
      await db.update(submissions)
        .set({ status: "teacher_reviewed" })
        .where(eq(submissions.id, data.submissionId));
    }
    
    return evaluation;
  }

  async getEvaluationBySubmission(submissionId: string): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select()
      .from(evaluations)
      .where(eq(evaluations.submissionId, submissionId));
    return evaluation;
  }

  async getStudentStats(studentId?: string): Promise<DashboardStats> {
    let allSubmissions: Submission[];
    let allQuizzes: QuizAttempt[];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (studentId) {
      allSubmissions = await db.select()
        .from(submissions)
        .where(eq(submissions.studentId, studentId));
      allQuizzes = await db.select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, studentId));
    } else {
      allSubmissions = await db.select().from(submissions);
      allQuizzes = await db.select().from(quizAttempts);
    }

    const reviewed = allSubmissions.filter(s => s.status === "teacher_reviewed");
    const reviewedIds = reviewed.map(s => s.id);
    
    let scores: number[] = [];
    if (reviewedIds.length > 0) {
      const evals = await db.select().from(evaluations);
      scores = evals
        .filter(e => e.submissionId && reviewedIds.includes(e.submissionId))
        .map(e => e.score)
        .filter((s): s is number => s !== null && s !== undefined);
    }

    const quizzesToday = allQuizzes.filter(q => q.attemptedAt && q.attemptedAt >= today).length;
    const quizzesYesterday = allQuizzes.filter(q => q.attemptedAt && q.attemptedAt >= yesterday && q.attemptedAt < today).length;

    return {
      totalSubmissions: allSubmissions.length,
      pendingReview: allSubmissions.filter(s => s.status === "ai_graded").length,
      aiGraded: allSubmissions.filter(s => s.status === "ai_graded").length,
      teacherReviewed: reviewed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      quizzesSolvedToday: quizzesToday,
      quizzesSolvedYesterday: quizzesYesterday,
      totalQuizzesSolved: allQuizzes.length,
    };
  }

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(data).returning();
    return attempt;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db.select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.attemptedAt));
  }

  async getTeacherStats(): Promise<DashboardStats> {
    const allSubmissions = await db.select().from(submissions);
    const reviewed = allSubmissions.filter(s => s.status === "teacher_reviewed");
    
    const allEvals = await db.select().from(evaluations);
    const scores = allEvals
      .map(e => e.score)
      .filter((s): s is number => s !== null && s !== undefined);

    return {
      totalSubmissions: allSubmissions.length,
      pendingReview: allSubmissions.filter(s => s.status === "ai_graded").length,
      aiGraded: allSubmissions.filter(s => s.status === "ai_graded").length,
      teacherReviewed: reviewed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }

  // Rubric operations
  async createRubric(data: InsertRubric): Promise<Rubric> {
    const [rubric] = await db.insert(rubrics).values(data).returning();
    return rubric;
  }

  async getRubric(id: string): Promise<Rubric | undefined> {
    const [rubric] = await db.select().from(rubrics).where(eq(rubrics.id, id));
    return rubric;
  }

  async getRubricsByTeacher(teacherId: string): Promise<Rubric[]> {
    return await db.select().from(rubrics).where(eq(rubrics.teacherId, teacherId)).orderBy(desc(rubrics.createdAt));
  }

  async deleteRubric(id: string): Promise<void> {
    await db.delete(rubricEvaluations).where(eq(rubricEvaluations.rubricId, id));
    await db.delete(rubricSubmissions).where(eq(rubricSubmissions.rubricId, id));
    await db.delete(rubricCriteria).where(eq(rubricCriteria.rubricId, id));
    await db.delete(rubrics).where(eq(rubrics.id, id));
  }

  async getCriteriaByRubric(rubricId: string): Promise<RubricCriterion[]> {
    return await db.select().from(rubricCriteria).where(eq(rubricCriteria.rubricId, rubricId)).orderBy(rubricCriteria.orderIndex);
  }

  async createCriteria(data: InsertRubricCriterion[]): Promise<RubricCriterion[]> {
    if (data.length === 0) return [];
    return await db.insert(rubricCriteria).values(data).returning();
  }

  async createRubricSubmission(data: InsertRubricSubmission): Promise<RubricSubmission> {
    const [sub] = await db.insert(rubricSubmissions).values(data).returning();
    return sub;
  }

  async getRubricSubmission(id: string): Promise<RubricSubmission | undefined> {
    const [sub] = await db.select().from(rubricSubmissions).where(eq(rubricSubmissions.id, id));
    return sub;
  }

  async getRubricSubmissionsByRubric(rubricId: string): Promise<RubricSubmission[]> {
    return await db.select().from(rubricSubmissions).where(eq(rubricSubmissions.rubricId, rubricId)).orderBy(desc(rubricSubmissions.submittedAt));
  }

  async updateRubricSubmissionStatus(id: string, status: string): Promise<void> {
    await db.update(rubricSubmissions).set({ status }).where(eq(rubricSubmissions.id, id));
  }

  async createRubricEvaluation(data: InsertRubricEvaluation): Promise<RubricEvaluation> {
    const [ev] = await db.insert(rubricEvaluations).values(data).returning();
    await this.updateRubricSubmissionStatus(data.submissionId, "evaluated");
    return ev;
  }

  async getRubricEvaluationsByRubric(rubricId: string): Promise<RubricEvaluation[]> {
    return await db.select().from(rubricEvaluations).where(eq(rubricEvaluations.rubricId, rubricId)).orderBy(desc(rubricEvaluations.evaluatedAt));
  }

  async getRubricEvaluationsByTeacher(teacherId: string): Promise<RubricEvaluation[]> {
    return await db.select().from(rubricEvaluations).where(eq(rubricEvaluations.teacherId, teacherId)).orderBy(desc(rubricEvaluations.evaluatedAt));
  }
}

export const storage = new DatabaseStorage();
