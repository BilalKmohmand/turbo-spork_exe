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
  type GraphSpec
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private submissions: Map<string, Submission>;
  private evaluations: Map<string, Evaluation>;

  constructor() {
    this.users = new Map();
    this.submissions = new Map();
    this.evaluations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email,
      displayName: insertUser.displayName,
      password: insertUser.password,
      role: insertUser.role || "student",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createSubmission(data: Partial<InsertSubmission> & { content: string; studentName: string; title: string }): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = {
      id,
      studentId: data.studentId || null,
      studentName: data.studentName,
      title: data.title,
      subject: data.subject || "General",
      content: data.content,
      fileUrl: data.fileUrl || null,
      status: data.status || "pending",
      aiSolution: null,
      aiSteps: null,
      aiExplanation: null,
      problemType: data.problemType || "other",
      graphSpec: null,
      messages: null,
      submittedAt: new Date(),
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(s => s.studentId === studentId)
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values()).sort(
      (a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
    );
  }

  async getPendingSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(s => s.status === "ai_graded")
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }

  async updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | undefined> {
    const existing = this.submissions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data };
    this.submissions.set(id, updated);
    return updated;
  }

  async createEvaluation(data: InsertEvaluation): Promise<Evaluation> {
    const id = randomUUID();
    const evaluation: Evaluation = {
      id,
      submissionId: data.submissionId || null,
      teacherId: data.teacherId || null,
      score: data.score || null,
      feedback: data.feedback || null,
      reviewedAt: new Date(),
    };
    this.evaluations.set(id, evaluation);
    
    // Update submission status
    if (data.submissionId) {
      const submission = this.submissions.get(data.submissionId);
      if (submission) {
        submission.status = "teacher_reviewed";
        this.submissions.set(data.submissionId, submission);
      }
    }
    
    return evaluation;
  }

  async getEvaluationBySubmission(submissionId: string): Promise<Evaluation | undefined> {
    return Array.from(this.evaluations.values()).find(
      (eval_) => eval_.submissionId === submissionId
    );
  }

  async getStudentStats(studentId?: string): Promise<DashboardStats> {
    let allSubmissions = Array.from(this.submissions.values());
    if (studentId) {
      allSubmissions = allSubmissions.filter(s => s.studentId === studentId);
    }

    const reviewed = allSubmissions.filter(s => s.status === "teacher_reviewed");
    const scores = reviewed
      .map(s => {
        const eval_ = Array.from(this.evaluations.values()).find(e => e.submissionId === s.id);
        return eval_?.score;
      })
      .filter((s): s is number => s !== null && s !== undefined);

    return {
      totalSubmissions: allSubmissions.length,
      pendingReview: allSubmissions.filter(s => s.status === "ai_graded").length,
      aiGraded: allSubmissions.filter(s => s.status === "ai_graded").length,
      teacherReviewed: reviewed.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }

  async getTeacherStats(): Promise<DashboardStats> {
    const allSubmissions = Array.from(this.submissions.values());
    const reviewed = allSubmissions.filter(s => s.status === "teacher_reviewed");
    const scores = Array.from(this.evaluations.values())
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

export const storage = new MemStorage();
