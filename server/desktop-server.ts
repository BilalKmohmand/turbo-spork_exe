import express, { type Request, type Response } from "express";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";

type UserRole = "student" | "teacher";

type StoredUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  password: string;
};

type SafeUser = Omit<StoredUser, "password">;

type TutorSession = {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
};

type Course = {
  id: string;
  title: string;
  subject: string;
  totalLessons: number;
  progress: any[];
  createdAt: string;
};

type Quiz = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  questions?: any[];
  createdAt: string;
  attempts: number;
  status: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  audioUrl?: string | null;
  duration?: number | null;
  tags: string[];
  hasTranscript: boolean;
  createdAt: string;
};

type Essay = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  type: string;
  wordCount: number;
  content: string | null;
  status: string;
  createdAt: string;
};

function getDesktopUserId(req: Request) {
  const header = req.headers["x-desktop-user"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return "desktop";
}

const DATA_DIR = process.env.DATA_DIR || (process.platform === "win32" ? "C:\\tmp\\academia-data" : "/tmp/academia-data");

function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function loadJson<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filepath = `${DATA_DIR}/${filename}`;
  if (!fs.existsSync(filepath)) return defaultValue;
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8")) as T;
  } catch {
    return defaultValue;
  }
}

function saveJson(filename: string, data: unknown) {
  ensureDataDir();
  const filepath = `${DATA_DIR}/${filename}`;
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

const desktopUsersByEmailData = loadJson<Record<string, StoredUser>>("users-by-email.json", {});
const desktopUsersByIdData = loadJson<Record<string, StoredUser>>("users-by-id.json", {});
const desktopTutorSessionsData = loadJson<Record<string, TutorSession[]>>("tutor-sessions.json", {});
const desktopCoursesData = loadJson<Record<string, Course[]>>("courses.json", {});
const desktopQuizzesData = loadJson<Record<string, Quiz[]>>("quizzes.json", {});
const desktopNotesData = loadJson<Record<string, Note[]>>("notes.json", {});
const desktopEssaysData = loadJson<Record<string, Essay[]>>("essays.json", {});

const desktopUsersByEmail = new Map<string, StoredUser>(Object.entries(desktopUsersByEmailData));
const desktopUsersById = new Map<string, StoredUser>(Object.entries(desktopUsersByIdData));
const desktopTutorSessions = new Map<string, TutorSession[]>(Object.entries(desktopTutorSessionsData));
const desktopCourses = new Map<string, Course[]>(Object.entries(desktopCoursesData));
const desktopQuizzes = new Map<string, Quiz[]>(Object.entries(desktopQuizzesData));
const desktopNotes = new Map<string, Note[]>(Object.entries(desktopNotesData));
const desktopEssays = new Map<string, Essay[]>(Object.entries(desktopEssaysData));

function persistUsers() {
  saveJson("users-by-email.json", Object.fromEntries(desktopUsersByEmail));
  saveJson("users-by-id.json", Object.fromEntries(desktopUsersById));
}
function persistTutorSessions() {
  saveJson("tutor-sessions.json", Object.fromEntries(desktopTutorSessions));
}
function persistCourses() {
  saveJson("courses.json", Object.fromEntries(desktopCourses));
}
function persistQuizzes() {
  saveJson("quizzes.json", Object.fromEntries(desktopQuizzes));
}
function persistNotes() {
  saveJson("notes.json", Object.fromEntries(desktopNotes));
}
function persistEssays() {
  saveJson("essays.json", Object.fromEntries(desktopEssays));
}

const OLLAMA_ENABLED = (process.env.OLLAMA_ENABLED || "true") === "true";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function ollamaChat(
  messages: Array<{ role: string; content: string }>,
  options?: { max_tokens?: number; temperature?: number },
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.max_tokens ?? 800,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error: ${error}`);
  }

  const data: any = await response.json();
  return data.message?.content || "";
}

async function generateChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: { max_tokens?: number; temperature?: number },
): Promise<string> {
  if (!OLLAMA_ENABLED) {
    throw new Error("Offline AI is disabled (OLLAMA_ENABLED is false)");
  }
  return await ollamaChat(messages, options);
}

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-desktop-user"],
  }),
);
app.use(express.json({ limit: "50mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/desktop/api/auth/me", (req, res) => {
  const userId = getDesktopUserId(req);
  const user = desktopUsersById.get(userId);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post("/desktop/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body as any;
    if (!email?.trim() || !password?.trim()) return res.status(400).json({ error: "Email and password are required" });

    const normalizedEmail = String(email).toLowerCase();
    const existing = desktopUsersByEmail.get(normalizedEmail);
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      displayName: (displayName && String(displayName).trim()) || "User",
      role: role === "teacher" ? "teacher" : "student",
      password: await bcrypt.hash(String(password), 10),
    };

    desktopUsersByEmail.set(user.email, user);
    desktopUsersById.set(user.id, user);
    persistUsers();

    const { password: _pw, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to create account" });
  }
});

app.post("/desktop/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as any;
    if (!email?.trim() || !password?.trim()) return res.status(400).json({ error: "Email and password are required" });

    const user = desktopUsersByEmail.get(String(email).toLowerCase());
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(String(password), String(user.password));
    if (!ok) return res.status(400).json({ error: "Invalid email or password" });

    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to login" });
  }
});

app.post("/desktop/api/auth/logout", (_req, res) => {
  res.json({ success: true });
});

app.get("/desktop/api/tutor/sessions", (req, res) => {
  const userId = getDesktopUserId(req);
  const sessions = desktopTutorSessions.get(userId) || [];
  res.json({ sessions });
});

app.post("/desktop/api/tutor/sessions", (req, res) => {
  const userId = getDesktopUserId(req);
  const { subject = "General", title } = req.body || {};
  const session: TutorSession = {
    id: crypto.randomUUID(),
    title: title || `Tutor: ${subject}`,
    subject,
    createdAt: new Date().toISOString(),
  };
  const list = desktopTutorSessions.get(userId) || [];
  list.unshift(session);
  desktopTutorSessions.set(userId, list);
  persistTutorSessions();
  res.status(201).json({ session });
});

app.post("/desktop/api/tutor/chat", async (req, res) => {
  try {
    const { message, subject = "General" } = req.body as { message?: string; subject?: string };
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const prompt = `You are a helpful tutor. Subject: ${subject}. Answer clearly and step-by-step when needed.\n\nStudent message: ${message}`;
    const reply = await generateChatCompletion([{ role: "user", content: prompt }], { max_tokens: 900 });
    const trimmed = reply.trim();
    res.json({ reply: trimmed, response: trimmed });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to generate response" });
  }
});

app.get("/desktop/api/courses", (req, res) => {
  const userId = getDesktopUserId(req);
  const courses = desktopCourses.get(userId) || [];
  res.json({ courses });
});

app.post("/desktop/api/courses", (req, res) => {
  const userId = getDesktopUserId(req);
  const { title, subject } = req.body as { title?: string; subject?: string };
  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

  const course: Course = {
    id: crypto.randomUUID(),
    title: title.trim(),
    subject: subject || "Other",
    totalLessons: 0,
    progress: [],
    createdAt: new Date().toISOString(),
  };

  const list = desktopCourses.get(userId) || [];
  list.unshift(course);
  desktopCourses.set(userId, list);
  persistCourses();
  res.status(201).json({ course });
});

app.get("/desktop/api/quizzes", (req, res) => {
  const userId = getDesktopUserId(req);
  const quizzes = desktopQuizzes.get(userId) || [];
  res.json({ quizzes });
});

app.post("/desktop/api/quizzes/generate", async (req, res) => {
  try {
    const userId = getDesktopUserId(req);
    const { title, subject, topic, difficulty, questionCount } = req.body;

    function extractJsonArray(text: string): any[] {
      const cleaned = String(text ?? "")
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Quiz generation failed: AI did not return a JSON array");
      }
      const jsonCandidate = cleaned.slice(start, end + 1);
      const parsed = JSON.parse(jsonCandidate);
      if (!Array.isArray(parsed)) {
        throw new Error("Quiz generation failed: JSON was not an array");
      }
      return parsed;
    }

    const prompt = `Create ${questionCount || 5} ${difficulty || "medium"} difficulty multiple choice questions about: ${topic}\nSubject: ${subject}\n\nYou MUST output ONLY valid JSON (no markdown, no code fences, no extra text).\nOutput format is a JSON array exactly like:\n[{"question":"Question text?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Why this is correct"}]\n\nRules:\n- options must have exactly 4 strings\n- correctIndex must be 0,1,2, or 3\n- keep questions clear and educational`;

    let raw = await generateChatCompletion([{ role: "user", content: prompt }], { max_tokens: 2200 });
    let questions: any[];
    try {
      questions = extractJsonArray(raw);
    } catch {
      const retryPrompt = `${prompt}\n\nIMPORTANT: Output ONLY the JSON array. No other text. No markdown.`;
      raw = await generateChatCompletion([{ role: "user", content: retryPrompt }], { max_tokens: 2200 });
      questions = extractJsonArray(raw);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: "Quiz generation failed: AI did not return valid questions JSON" });
    }

    const quiz: Quiz = {
      id: crypto.randomUUID(),
      title: title || `Quiz: ${String(topic || "").slice(0, 30)}...`,
      subject: subject || "General",
      topic: topic || "",
      difficulty: difficulty || "medium",
      questionCount: questions.length,
      questions,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: "generated",
    };

    const list = desktopQuizzes.get(userId) || [];
    list.unshift(quiz);
    desktopQuizzes.set(userId, list);
    persistQuizzes();

    res.status(201).json({ quiz });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to generate quiz" });
  }
});

app.delete("/desktop/api/quizzes/:id", (req, res) => {
  const userId = getDesktopUserId(req);
  const quizzes = desktopQuizzes.get(userId) || [];
  const filtered = quizzes.filter((q: any) => q.id !== req.params.id);
  desktopQuizzes.set(userId, filtered);
  persistQuizzes();
  res.json({ success: true });
});

app.get("/desktop/api/notes", (req, res) => {
  const userId = getDesktopUserId(req);
  const notes = desktopNotes.get(userId) || [];
  res.json({ notes });
});

app.post("/desktop/api/notes", async (req, res) => {
  try {
    const userId = getDesktopUserId(req);
    const { title, content, audioUrl, duration, tags } = req.body;

    let finalContent = typeof content === "string" ? content : "";
    const safeTitle = typeof title === "string" && title.trim() ? title.trim() : "Untitled Note";

    if (!finalContent.trim()) {
      const genPrompt = `You are an expert note-taker.\n\nCreate well-structured lecture notes for a lecture titled: \"${safeTitle}\".\n\nRequirements:\n- Use short headings and bullet points\n- Include key definitions and formulas if relevant\n- Add 5 quick review questions at the end\n\nReturn plain text only.`;
      finalContent = await generateChatCompletion([{ role: "user", content: genPrompt }], { max_tokens: 1000 });
    }

    const note: Note = {
      id: crypto.randomUUID(),
      title: safeTitle,
      content: finalContent || "",
      audioUrl: audioUrl || null,
      duration: duration || null,
      tags: Array.isArray(tags) ? tags : [],
      hasTranscript: Boolean(audioUrl),
      createdAt: new Date().toISOString(),
    };

    const list = desktopNotes.get(userId) || [];
    list.unshift(note);
    desktopNotes.set(userId, list);
    persistNotes();

    res.status(201).json({ note });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to create note" });
  }
});

app.delete("/desktop/api/notes/:id", (req, res) => {
  const userId = getDesktopUserId(req);
  const notes = desktopNotes.get(userId) || [];
  const filtered = notes.filter((n: any) => n.id !== req.params.id);
  desktopNotes.set(userId, filtered);
  persistNotes();
  res.json({ success: true });
});

app.get("/desktop/api/essays", (req, res) => {
  const userId = getDesktopUserId(req);
  const essays = desktopEssays.get(userId) || [];
  res.json({ essays });
});

app.post("/desktop/api/essays", (req, res) => {
  const userId = getDesktopUserId(req);
  const { title, topic, subject, type, wordCount } = req.body;

  const essay: Essay = {
    id: crypto.randomUUID(),
    title: title || "Untitled Essay",
    topic: topic || "",
    subject: subject || "General",
    type: type || "argumentative",
    wordCount: wordCount || 500,
    content: null,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  const list = desktopEssays.get(userId) || [];
  list.unshift(essay);
  desktopEssays.set(userId, list);
  persistEssays();

  res.status(201).json({ essay });
});

app.post("/desktop/api/essays/:id/generate", async (req, res) => {
  try {
    const userId = getDesktopUserId(req);
    const essays = desktopEssays.get(userId) || [];
    const idx = essays.findIndex((e: any) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Essay not found" });

    const essay = essays[idx];
    const prompt = `Write a ${essay.wordCount || 500}-word ${essay.type} essay about: ${essay.topic}\nSubject: ${essay.subject}\n\nWrite a well-structured essay with introduction, body paragraphs, and conclusion. Use academic tone.`;

    const content = await generateChatCompletion([{ role: "user", content: prompt }], { max_tokens: 2200 });

    essay.content = content;
    essay.status = "generated";
    essays[idx] = essay;
    desktopEssays.set(userId, essays);
    persistEssays();

    res.json({ essay, content });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to generate essay" });
  }
});

app.delete("/desktop/api/essays/:id", (req, res) => {
  const userId = getDesktopUserId(req);
  const essays = desktopEssays.get(userId) || [];
  const filtered = essays.filter((e: any) => e.id !== req.params.id);
  desktopEssays.set(userId, filtered);
  persistEssays();
  res.json({ success: true });
});

const port = parseInt(process.env.PORT || "5050", 10);
app.listen(port, "127.0.0.1", () => {
  console.log(`desktop server listening on ${port}`);
});
