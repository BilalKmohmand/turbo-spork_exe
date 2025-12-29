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
  users,
  submissions,
  evaluations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
    
    if (studentId) {
      allSubmissions = await db.select()
        .from(submissions)
        .where(eq(submissions.studentId, studentId));
    } else {
      allSubmissions = await db.select().from(submissions);
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

    return {
      totalSubmissions: allSubmissions.length,
      pendingReview: allSubmissions.filter(s => s.status === "ai_graded").length,
      aiGraded: allSubmissions.filter(s => s.status === "ai_graded").length,
      teacherReviewed: reviewed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
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
}

export const storage = new DatabaseStorage();
