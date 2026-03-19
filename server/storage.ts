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
  type Course,
  type InsertCourse,
  type LessonContent,
  type InsertLessonContent,
  type LessonProgressRow,
  type InsertLessonProgress,
  type TutorSession,
  type InsertTutorSession,
  type TeacherProfile,
  type InsertTeacherProfile,
  type Class,
  type InsertClass,
  type ClassMembership,
  type InsertClassMembership,
  type QuizAttempt,
  type InsertQuizAttempt,
  users,
  submissions,
  evaluations,
  rubrics,
  rubricCriteria,
  rubricSubmissions,
  rubricEvaluations,
  quizAttempts,
  courses,
  lessonContents,
  lessonProgress,
  tutorSessions,
  teacherProfiles,
  classes,
  classMemberships,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray, gte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: { displayName?: string }): Promise<User | undefined>;
  
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
  getEvaluationsByStudent(studentId: string): Promise<Evaluation[]>;
  
  // Stats
  getStudentStats(studentId?: string): Promise<DashboardStats>;
  getTeacherStats(): Promise<DashboardStats>;

  // Quiz operations
  createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;

  // Rubric operations
  createRubric(data: InsertRubric): Promise<Rubric>;
  getRubric(id: string): Promise<Rubric | undefined>;
  getRubricsByTeacher(teacherId: string, classId?: string | null): Promise<Rubric[]>;
  getPublishedRubricsForClasses(classIds: string[]): Promise<Rubric[]>;
  publishRubric(id: string): Promise<Rubric | undefined>;
  deleteRubric(id: string): Promise<void>;
  getCriteriaByRubric(rubricId: string): Promise<RubricCriterion[]>;
  createCriteria(data: InsertRubricCriterion[]): Promise<RubricCriterion[]>;
  createRubricSubmission(data: { rubricId: string; teacherId: string; studentId?: string | null; studentName: string; title: string; content: string }): Promise<RubricSubmission>;
  getRubricSubmission(id: string): Promise<RubricSubmission | undefined>;
  getRubricSubmissionsByRubric(rubricId: string): Promise<RubricSubmission[]>;
  getRubricSubmissionByStudentAndRubric(studentId: string, rubricId: string): Promise<RubricSubmission | undefined>;
  updateRubricSubmissionStatus(id: string, status: string): Promise<void>;
  createRubricEvaluation(data: InsertRubricEvaluation): Promise<RubricEvaluation>;
  getRubricEvaluationBySubmission(submissionId: string): Promise<RubricEvaluation | undefined>;
  updateRubricEvaluation(id: string, data: { overallScore?: number; overallFeedback?: string; criteriaScores?: any; clearPushedAt?: boolean }): Promise<RubricEvaluation | undefined>;
  pushRubricEvaluation(submissionId: string): Promise<void>;
  getRubricEvaluationsByRubric(rubricId: string): Promise<RubricEvaluation[]>;
  getRubricEvaluationsByTeacher(teacherId: string): Promise<RubricEvaluation[]>;

  // Course operations
  createCourse(data: InsertCourse): Promise<Course>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByUser(userId: string): Promise<Course[]>;
  deleteCourse(id: string): Promise<void>;

  // Lesson content
  getLessonContent(courseId: string, lessonKey: string): Promise<LessonContent | undefined>;
  createLessonContent(data: InsertLessonContent): Promise<LessonContent>;

  // Lesson progress
  getLessonProgress(userId: string, courseId: string): Promise<LessonProgressRow[]>;
  markLessonComplete(data: InsertLessonProgress): Promise<LessonProgressRow>;

  // Tutor session operations
  createTutorSession(data: InsertTutorSession): Promise<TutorSession>;
  getTutorSession(id: string): Promise<TutorSession | undefined>;
  getTutorSessionsByUser(userId: string): Promise<TutorSession[]>;
  updateTutorSession(id: string, data: { messages?: any[]; title?: string; updatedAt?: Date }): Promise<TutorSession | undefined>;
  deleteTutorSession(id: string): Promise<void>;

  // Teacher profile operations
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  createTeacherProfile(data: InsertTeacherProfile): Promise<TeacherProfile>;
  updateTeacherProfile(userId: string, data: Partial<Omit<InsertTeacherProfile, 'userId'>>): Promise<TeacherProfile | undefined>;

  // Class operations
  createClass(data: InsertClass): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  getClassByCode(classCode: string): Promise<Class | undefined>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  deleteClass(id: string): Promise<void>;

  // Class membership operations
  joinClass(data: InsertClassMembership): Promise<ClassMembership>;
  getMembershipsByClass(classId: string): Promise<ClassMembership[]>;
  getMembershipsByStudent(studentId: string): Promise<ClassMembership[]>;
  getClassesForStudent(studentId: string): Promise<Class[]>;
  removeMembership(classId: string, studentId: string): Promise<void>;
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

  async updateUser(id: string, data: { displayName?: string }): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
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

    // Award points for AI solving if it just finished
    if (updated && data.status === "ai_graded" && updated.studentId) {
      const [user] = await db.select().from(users).where(eq(users.id, updated.studentId));
      if (user) {
        const pointsEarned = 50; // Flat 50 XP for solving a problem
        const newPoints = user.points + pointsEarned;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        
        const badges = [...(user.badges || [])];
        if (newLevel > user.level && !badges.includes("Level Up")) {
          badges.push(`Level ${newLevel}`);
        }
        
        await db.update(users)
          .set({ points: newPoints, level: newLevel, badges })
          .where(eq(users.id, user.id));
      }
    }

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

  async getEvaluationsByStudent(studentId: string): Promise<Evaluation[]> {
    const studentSubmissions = await db.select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId));
    if (studentSubmissions.length === 0) return [];
    const submissionIds = studentSubmissions.map(s => s.id);
    return await db.select()
      .from(evaluations)
      .where(inArray(evaluations.submissionId, submissionIds));
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
      const allEvals = await db.select().from(evaluations);
      scores = allEvals
        .filter(e => e.submissionId && reviewedIds.includes(e.submissionId))
        .map(e => e.score)
        .filter((s): s is number => s !== null && s !== undefined);
    }

    const quizzesToday = allQuizzes.filter(q => q.attemptedAt && q.attemptedAt >= today).length;
    const quizzesYesterday = allQuizzes.filter(q => q.attemptedAt && q.attemptedAt >= yesterday && q.attemptedAt < today).length;

    const user = studentId ? await this.getUser(studentId) : undefined;
    const points = user?.points || 0;
    const level = user?.level || 1;
    const nextLevelPoints = level * 1000;

    // Calculate real-time average score from all graded submissions
    const allScores = allSubmissions
      .filter(s => s.status === "ai_graded" || s.status === "teacher_reviewed")
      .map(s => {
        // If it has a teacher evaluation, use that score
        // Otherwise, we might need to parse it from the AI solution if we had one
        // For now, let's use the scores from evaluations table which is more reliable
        return 0; // Default if no evaluation
      });

    const studentEvals = studentId ? await this.getEvaluationsByStudent(studentId) : [];
    const evaluationScores = studentEvals.map(e => e.score).filter((s): s is number => s !== null);
    
    const quizScores = allQuizzes.map(q => q.score);
    const combinedScores = [...evaluationScores, ...quizScores];
    const averageScore = combinedScores.length > 0 
      ? Math.round(combinedScores.reduce((a, b) => a + b, 0) / combinedScores.length) 
      : 0;

    return {
      totalSubmissions: allSubmissions.length,
      pendingReview: allSubmissions.filter(s => s.status === "pending").length,
      aiGraded: allSubmissions.filter(s => s.status === "ai_graded").length,
      teacherReviewed: reviewed.length,
      averageScore,
      quizzesSolvedToday: quizzesToday,
      quizzesSolvedYesterday: quizzesYesterday,
      totalQuizzesSolved: allQuizzes.length,
      points,
      level,
      nextLevelPoints,
    };
  }

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(data).returning();
    
    // Add points for completing quiz: score * 2
    const pointsEarned = data.score * 2;
    const [user] = await db.select().from(users).where(eq(users.id, data.userId));
    if (user) {
      const newPoints = user.points + pointsEarned;
      const newLevel = Math.floor(newPoints / 1000) + 1;
      await db.update(users)
        .set({ points: newPoints, level: newLevel })
        .where(eq(users.id, data.userId));
    }
    
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
      quizzesSolvedToday: 0,
      quizzesSolvedYesterday: 0,
      totalQuizzesSolved: 0,
      points: 0,
      level: 1,
      nextLevelPoints: 1000,
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

  async getRubricsByTeacher(teacherId: string, classId?: string | null): Promise<Rubric[]> {
    const conditions = [eq(rubrics.teacherId, teacherId)];
    if (classId !== undefined) {
      conditions.push(classId ? eq(rubrics.classId, classId) : sql`${rubrics.classId} IS NULL`);
    }
    return await db.select().from(rubrics).where(and(...conditions)).orderBy(desc(rubrics.createdAt));
  }

  async getPublishedRubricsForClasses(classIds: string[]): Promise<Rubric[]> {
    if (classIds.length === 0) return [];
    return await db.select().from(rubrics)
      .where(and(eq(rubrics.status, "published"), inArray(rubrics.classId, classIds)))
      .orderBy(desc(rubrics.publishedAt));
  }

  async publishRubric(id: string): Promise<Rubric | undefined> {
    const [rubric] = await db.update(rubrics)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(rubrics.id, id))
      .returning();
    return rubric;
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

  async createRubricSubmission(data: { rubricId: string; teacherId: string; studentId?: string | null; studentName: string; title: string; content: string }): Promise<RubricSubmission> {
    const [sub] = await db.insert(rubricSubmissions).values({
      rubricId: data.rubricId,
      teacherId: data.teacherId,
      studentId: data.studentId || null,
      studentName: data.studentName,
      title: data.title,
      content: data.content,
      status: "submitted",
    }).returning();
    return sub;
  }

  async getRubricSubmission(id: string): Promise<RubricSubmission | undefined> {
    const [sub] = await db.select().from(rubricSubmissions).where(eq(rubricSubmissions.id, id));
    return sub;
  }

  async getRubricSubmissionsByRubric(rubricId: string): Promise<RubricSubmission[]> {
    return await db.select().from(rubricSubmissions).where(eq(rubricSubmissions.rubricId, rubricId)).orderBy(desc(rubricSubmissions.submittedAt));
  }

  async getRubricSubmissionByStudentAndRubric(studentId: string, rubricId: string): Promise<RubricSubmission | undefined> {
    const [sub] = await db.select().from(rubricSubmissions)
      .where(and(eq(rubricSubmissions.studentId, studentId), eq(rubricSubmissions.rubricId, rubricId)));
    return sub;
  }

  async updateRubricSubmissionStatus(id: string, status: string): Promise<void> {
    await db.update(rubricSubmissions).set({ status }).where(eq(rubricSubmissions.id, id));
  }

  async createRubricEvaluation(data: InsertRubricEvaluation): Promise<RubricEvaluation> {
    const [ev] = await db.insert(rubricEvaluations).values(data).returning();
    await this.updateRubricSubmissionStatus(data.submissionId, "ai_evaluated");
    return ev;
  }

  async getRubricEvaluationBySubmission(submissionId: string): Promise<RubricEvaluation | undefined> {
    const [ev] = await db.select().from(rubricEvaluations).where(eq(rubricEvaluations.submissionId, submissionId));
    return ev;
  }

  async updateRubricEvaluation(id: string, data: { overallScore?: number; overallFeedback?: string; criteriaScores?: any; clearPushedAt?: boolean }): Promise<RubricEvaluation | undefined> {
    const updateData: Record<string, any> = {};
    if (data.overallScore !== undefined) updateData.overallScore = data.overallScore;
    if (data.overallFeedback !== undefined) updateData.overallFeedback = data.overallFeedback;
    if (data.criteriaScores !== undefined) updateData.criteriaScores = data.criteriaScores;
    if (data.clearPushedAt) updateData.pushedAt = null;
    const [ev] = await db.update(rubricEvaluations).set(updateData).where(eq(rubricEvaluations.id, id)).returning();
    return ev;
  }

  async pushRubricEvaluation(submissionId: string): Promise<void> {
    await db.update(rubricEvaluations).set({ pushedAt: new Date() }).where(eq(rubricEvaluations.submissionId, submissionId));
    await db.update(rubricSubmissions).set({ status: "pushed" }).where(eq(rubricSubmissions.id, submissionId));
  }

  async getRubricEvaluationsByRubric(rubricId: string): Promise<RubricEvaluation[]> {
    return await db.select().from(rubricEvaluations).where(eq(rubricEvaluations.rubricId, rubricId)).orderBy(desc(rubricEvaluations.evaluatedAt));
  }

  async getRubricEvaluationsByTeacher(teacherId: string): Promise<RubricEvaluation[]> {
    return await db.select().from(rubricEvaluations).where(eq(rubricEvaluations.teacherId, teacherId)).orderBy(desc(rubricEvaluations.evaluatedAt));
  }

  /* ── Courses ─────────────────────────────────────────────── */
  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByUser(userId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.userId, userId)).orderBy(desc(courses.createdAt));
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(lessonProgress).where(eq(lessonProgress.courseId, id));
    await db.delete(lessonContents).where(eq(lessonContents.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  /* ── Lesson Contents ─────────────────────────────────────── */
  async getLessonContent(courseId: string, lessonKey: string): Promise<LessonContent | undefined> {
    const [lc] = await db.select().from(lessonContents)
      .where(and(eq(lessonContents.courseId, courseId), eq(lessonContents.lessonKey, lessonKey)));
    return lc;
  }

  async createLessonContent(data: InsertLessonContent): Promise<LessonContent> {
    const [lc] = await db.insert(lessonContents).values(data).returning();
    return lc;
  }

  /* ── Lesson Progress ─────────────────────────────────────── */
  async getLessonProgress(userId: string, courseId: string): Promise<LessonProgressRow[]> {
    return await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)));
  }

  async markLessonComplete(data: InsertLessonProgress): Promise<LessonProgressRow> {
    const existing = await db.select().from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, data.userId),
        eq(lessonProgress.courseId, data.courseId),
        eq(lessonProgress.lessonKey, data.lessonKey),
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(lessonProgress)
        .set({ score: data.score, completedAt: new Date() })
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
      return updated;
    }
    const [lp] = await db.insert(lessonProgress).values(data).returning();
    return lp;
  }

  /* ── Tutor Sessions ──────────────────────────────────────── */
  async createTutorSession(data: InsertTutorSession): Promise<TutorSession> {
    const [session] = await db.insert(tutorSessions).values(data).returning();
    return session;
  }

  async getTutorSession(id: string): Promise<TutorSession | undefined> {
    const [session] = await db.select().from(tutorSessions).where(eq(tutorSessions.id, id));
    return session;
  }

  async getTutorSessionsByUser(userId: string): Promise<TutorSession[]> {
    return await db.select().from(tutorSessions)
      .where(eq(tutorSessions.userId, userId))
      .orderBy(desc(tutorSessions.updatedAt));
  }

  async updateTutorSession(id: string, data: { messages?: any[]; title?: string; updatedAt?: Date }): Promise<TutorSession | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.messages !== undefined) updateData.messages = data.messages;
    if (data.title !== undefined) updateData.title = data.title;
    const [session] = await db.update(tutorSessions).set(updateData).where(eq(tutorSessions.id, id)).returning();
    return session;
  }

  async deleteTutorSession(id: string): Promise<void> {
    await db.delete(tutorSessions).where(eq(tutorSessions.id, id));
  }

  /* ── Teacher Profiles ────────────────────────────────────── */
  async getTeacherProfile(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async createTeacherProfile(data: InsertTeacherProfile): Promise<TeacherProfile> {
    const [profile] = await db.insert(teacherProfiles).values(data).returning();
    return profile;
  }

  async updateTeacherProfile(userId: string, data: Partial<Omit<InsertTeacherProfile, 'userId'>>): Promise<TeacherProfile | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    const [profile] = await db.update(teacherProfiles).set(updateData).where(eq(teacherProfiles.userId, userId)).returning();
    return profile;
  }

  /* ── Classes ─────────────────────────────────────────────── */
  async createClass(data: InsertClass): Promise<Class> {
    const [cls] = await db.insert(classes).values(data).returning();
    return cls;
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async getClassByCode(classCode: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.classCode, classCode.toUpperCase()));
    return cls;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId)).orderBy(desc(classes.createdAt));
  }

  async getPublicClasses(): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.isPublic, true)).orderBy(desc(classes.createdAt));
  }

  async updateClass(id: string, data: Partial<Pick<Class, "isPublic" | "description" | "name" | "subject" | "gradeLevel">>): Promise<Class | undefined> {
    const [updated] = await db.update(classes).set(data).where(eq(classes.id, id)).returning();
    return updated;
  }

  async deleteClass(id: string): Promise<void> {
    // Null out rubrics that reference this class (FK constraint)
    await db.update(rubrics).set({ classId: null }).where(eq(rubrics.classId, id));
    await db.delete(classMemberships).where(eq(classMemberships.classId, id));
    await db.delete(classes).where(eq(classes.id, id));
  }

  /* ── Class Memberships ───────────────────────────────────── */
  async joinClass(data: InsertClassMembership): Promise<ClassMembership> {
    const [membership] = await db.insert(classMemberships).values(data).returning();
    return membership;
  }

  async getMembershipsByClass(classId: string): Promise<ClassMembership[]> {
    return await db.select().from(classMemberships).where(eq(classMemberships.classId, classId)).orderBy(classMemberships.joinedAt);
  }

  async getMembershipsByStudent(studentId: string): Promise<ClassMembership[]> {
    return await db.select().from(classMemberships).where(eq(classMemberships.studentId, studentId));
  }

  async getClassesForStudent(studentId: string): Promise<Class[]> {
    const memberships = await this.getMembershipsByStudent(studentId);
    if (memberships.length === 0) return [];
    const classIds = memberships.map(m => m.classId);
    return await db.select().from(classes).where(inArray(classes.id, classIds));
  }

  async removeMembership(classId: string, studentId: string): Promise<void> {
    await db.delete(classMemberships)
      .where(and(eq(classMemberships.classId, classId), eq(classMemberships.studentId, studentId)));
  }
}

export const storage = new DatabaseStorage();
