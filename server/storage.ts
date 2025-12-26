import { type User, type InsertUser, type Assignment, type Submission, type DashboardStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAssignments(): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  
  createSubmission(data: { assignmentId: string; studentName: string; content: string }): Promise<Submission>;
  getSubmission(id: string): Promise<Submission | undefined>;
  getAllSubmissions(): Promise<Submission[]>;
  updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | undefined>;
  
  getStudentStats(): Promise<DashboardStats>;
  getTeacherStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private assignments: Map<string, Assignment>;
  private submissions: Map<string, Submission>;

  constructor() {
    this.users = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const generalAssignment: Assignment = {
      id: "general",
      title: "General Submission",
      subject: "General",
      description: "Submit any work for AI evaluation",
      dueDate: "2099-12-31",
      maxScore: 100,
    };
    this.assignments.set(generalAssignment.id, generalAssignment);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async createSubmission(data: { assignmentId: string; studentName: string; content: string }): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = {
      id,
      assignmentId: data.assignmentId,
      studentName: data.studentName,
      content: data.content,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return Array.from(this.submissions.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async updateSubmission(id: string, data: Partial<Submission>): Promise<Submission | undefined> {
    const existing = this.submissions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data };
    this.submissions.set(id, updated);
    return updated;
  }

  async getStudentStats(): Promise<DashboardStats> {
    const allSubmissions = Array.from(this.submissions.values());
    const gradedSubmissions = allSubmissions.filter(s => s.status !== "pending");
    
    const scores = gradedSubmissions
      .filter(s => s.aiScore !== undefined)
      .map(s => s.aiScore!);
    
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      totalAssignments: this.assignments.size,
      pendingSubmissions: allSubmissions.filter(s => s.status === "pending").length,
      completedSubmissions: allSubmissions.filter(s => s.status === "teacher_reviewed").length,
      averageScore,
    };
  }

  async getTeacherStats(): Promise<DashboardStats> {
    const allSubmissions = Array.from(this.submissions.values());
    const gradedSubmissions = allSubmissions.filter(s => s.aiScore !== undefined);
    
    const scores = gradedSubmissions.map(s => s.aiScore!);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      totalAssignments: allSubmissions.length,
      pendingSubmissions: allSubmissions.filter(s => s.status === "ai_graded").length,
      completedSubmissions: allSubmissions.filter(s => s.status === "teacher_reviewed").length,
      averageScore,
    };
  }
}

export const storage = new MemStorage();
