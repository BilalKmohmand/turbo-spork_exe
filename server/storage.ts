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
    const sampleAssignments: Assignment[] = [
      {
        id: randomUUID(),
        title: "Introduction to Python Programming",
        subject: "Computer Science",
        description: "Write a Python program that calculates the factorial of a number using recursion. Explain your approach and include comments.",
        dueDate: "2025-01-15",
        maxScore: 100,
      },
      {
        id: randomUUID(),
        title: "Essay on Climate Change",
        subject: "Environmental Science",
        description: "Write a 500-word essay discussing the main causes and effects of climate change, and propose three practical solutions.",
        dueDate: "2025-01-20",
        maxScore: 100,
      },
      {
        id: randomUUID(),
        title: "Mathematical Problem Set",
        subject: "Mathematics",
        description: "Solve the following calculus problems involving derivatives and integrals. Show all your work and explain each step.",
        dueDate: "2025-01-18",
        maxScore: 100,
      },
      {
        id: randomUUID(),
        title: "Literary Analysis: Shakespeare",
        subject: "English Literature",
        description: "Analyze the themes of ambition and guilt in Macbeth. Provide textual evidence to support your arguments.",
        dueDate: "2025-01-25",
        maxScore: 100,
      },
    ];

    sampleAssignments.forEach(a => this.assignments.set(a.id, a));
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
