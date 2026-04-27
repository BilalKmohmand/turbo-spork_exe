import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitWorkSchema, evaluateSchema, registerSchema, loginSchema, uploadKnowledgeSchema, knowledgeChunks, createRubricSchema, addSubmissionSchema, batchEvaluateSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import multer from "multer";
import { generateEmbedding, generateEmbeddings } from "./rag/embeddings";
import { chunkMathContent, detectTopic, detectDifficulty } from "./rag/chunker";
import { retrieveRelevantChunks, formatContextForAI, getKnowledgeStats } from "./rag/retrieval";
import { db } from "./db";
import fs from "fs";
import path from "path";
import crypto from "crypto";
// Dynamic import for pdf-parse to avoid ESM/CJS bundling issues
let PDFParse: any = null;
async function getPDFParse() {
  if (!PDFParse) {
    const pdfParseModule: any = await import("pdf-parse");
    PDFParse = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse || pdfParseModule.default;
  }
  return PDFParse;
}

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
  }
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.userRole !== "teacher") {
    return res.status(403).json({ error: "Teacher access required" });
  }
  next();
}

function getDesktopUserId(req: Request) {
  const header = req.headers["x-desktop-user"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return "desktop";
}

function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.userRole !== "student") {
    return res.status(403).json({ error: "Student access required" });
  }
  next();
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Ollama Local LLM Support
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED === "true";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function ollamaChat(messages: Array<{role: string, content: string}>, options?: {max_tokens?: number, temperature?: number}): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.max_tokens ?? 600,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error: ${error}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}

async function ollamaGenerate(prompt: string, options?: {max_tokens?: number, temperature?: number}): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.max_tokens ?? 600,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error: ${error}`);
  }

  const data = await response.json();
  return data.response || "";
}

// Wrapper to use Ollama if enabled, otherwise fall back to OpenAI
async function generateChatCompletion(messages: Array<{role: string, content: string}>, options?: {max_tokens?: number, temperature?: number, model?: string}): Promise<string> {
  // Try Ollama first if enabled
  if (OLLAMA_ENABLED) {
    try {
      console.log("Using Ollama for chat completion...");
      return await ollamaChat(messages, options);
    } catch (err) {
      console.warn("Ollama failed:", err);
    }
  }

  // Fall back to OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages: messages as any,
      max_completion_tokens: options?.max_tokens || 600,
      temperature: options?.temperature ?? 0.7,
    });
    return response.choices[0]?.message?.content || "";
  } catch (err: any) {
    console.warn("OpenAI failed:", err?.message || err);
  }

  // Both failed - return helpful message
  return "AI features are currently unavailable. To enable AI:\n\n1. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh\n2. Run: ollama pull llama3.2\n3. Run: ollama serve\n\nOr add OpenAI API credits at platform.openai.com";
}

function ensureString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function ensureStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => ensureString(item));
  }
  if (typeof value === "object") {
    // Convert object to array of strings
    return Object.entries(value).map(([key, val]) => `${key}: ${ensureString(val)}`);
  }
  return [ensureString(value)];
}

interface StepObject {
  title: string;
  math: string;
  reasoning: string;
}

interface QuestionResult {
  questionNumber: number;
  problemStatement: string;
  steps: StepObject[];
  answer: string;
}

interface SolveResult {
  solution: string;
  steps: StepObject[];
  explanation: string;
  problemType: "math" | "science" | "other" | "chat";
  isChat?: boolean;
  graphSpec?: {
    expressions: string[];
    title?: string;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
  };
  questions?: QuestionResult[];
}

// Clean up malformed LaTeX in AI responses
function cleanupLatex(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // 1. Fix backslash before numbers like \400 -> $400$
  cleaned = cleaned.replace(/\\(\d+)(?![a-zA-Z])/g, '$$$1$');
  
  // 2. Fix malformed patterns like \306aftera -> $306$ after a
  cleaned = cleaned.replace(/\\(\d+)([a-zA-Z]+)/g, '$$$1$ $2');
  
  // 3. Fix standalone \% outside of $ delimiters
  cleaned = cleaned.replace(/(?<!\$[^$]*)(\d+)\\%(?![^$]*\$)/g, '$$$1\\%$');
  
  // 4. Remove stray backslashes before NON-LATEX words only
  // Preserve ALL valid LaTeX commands (any length)
  const latexCommands = new Set([
    // Short commands (2-4 chars)
    'le', 'ge', 'ne', 'pm', 'mp', 'pi', 'mu', 'nu', 'xi', 'to', 'in', 'ni',
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'exp', 'lim', 'sum', 'int', 'max', 'min',
    'neq', 'leq', 'geq', 'sim', 'cup', 'cap', 'sub', 'sup', 'div', 'mod', 'gcd', 'det', 'dim',
    // Medium commands (5+ chars) 
    'times', 'approx', 'frac', 'text', 'sqrt', 'cdot', 'quad', 'left', 'right', 'begin', 'end',
    'infty', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'sigma', 'omega', 'prime',
    'overline', 'underline', 'mathbb', 'mathbf', 'mathrm', 'textbf', 'textit',
    'hline', 'vline', 'ldots', 'cdots', 'ddots', 'therefore', 'because',
    'forall', 'exists', 'nabla', 'partial', 'equiv', 'cong', 'perp', 'parallel',
    'angle', 'triangle', 'square', 'circle', 'degree', 'arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh', 'circ', 'oplus', 'otimes', 'subset', 'supset', 'implies', 'iff'
  ]);
  
  // Only strip backslashes from words that are NOT valid LaTeX commands
  cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, (match, word) => {
    // Keep all valid LaTeX commands
    if (latexCommands.has(word.toLowerCase())) {
      return match;
    }
    // Only remove backslash from clearly non-LaTeX words (6+ chars and not in set)
    if (word.length >= 6) {
      return word;
    }
    // For shorter unknown words, keep the backslash (might be a LaTeX command we don't know)
    return match;
  });
  
  return cleaned;
}

function parseSteps(steps: any): StepObject[] {
  if (!Array.isArray(steps)) return [];
  
  return steps.map((step: any) => {
    if (typeof step === 'object' && step !== null) {
      return {
        title: cleanupLatex(String(step.title || '')),
        math: String(step.math || ''),
        reasoning: cleanupLatex(String(step.reasoning || ''))
      };
    }
    // Fallback for string steps
    return {
      title: '',
      math: '',
      reasoning: cleanupLatex(String(step))
    };
  });
}

async function solveFromImage(base64Image: string, mimeType: string): Promise<SolveResult> {
  try {
    // Use GPT-4o for best vision capabilities
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `CRITICAL: Solve EVERY SINGLE problem in this image. Count all questions first, then solve each one.

IMPORTANT: If image has 6 questions, return 6 solutions. If 10 questions, return 10 solutions. NEVER skip any.

Return ONLY JSON:
{"questions":[{"questionNumber":1,"problemStatement":"problem text","steps":[{"title":"Step Name","math":"LaTeX no $","reasoning":"explanation with $math$"}],"answer":"$answer$"},{"questionNumber":2,...},{"questionNumber":3,...}],"explanation":"summary","problemType":"math","graphSpec":null}

RULES:
- Count ALL problems in image first
- Return one object per problem in questions array
- questionNumber must match the problem number
- $...$ for inline math in reasoning/answer
- "math" field: pure LaTeX, NO $ signs
- Use \\text{} for units
- SOLVE ALL - if there are 6 problems, return 6 question objects

Start with {`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 600,
    });

    let text = response.choices[0]?.message?.content || "";
    
    console.log("[solveFromImage] Raw AI response:", text.slice(0, 300));
    
    // Try to extract JSON from various formats
    let jsonText = text;
    
    // Try markdown code block first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Then try to find raw JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(jsonText);
      console.log("[solveFromImage] Parsed keys:", Object.keys(result));
      console.log("[solveFromImage] Has questions?", !!result.questions, "Is array?", Array.isArray(result.questions));
      
      // Handle new question-based format
      if (result.questions && Array.isArray(result.questions)) {
        console.log("[solveFromImage] Using question-based format, count:", result.questions.length);
        return parseQuestionBasedResponse(result);
      }
      
      console.log("[solveFromImage] Falling back to old format");
      // Fallback to old format
      return {
        solution: cleanupLatex(ensureString(result.solution) || "See steps below."),
        steps: parseSteps(result.steps),
        explanation: cleanupLatex(ensureString(result.explanation) || "Review the steps for understanding."),
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch (parseError: any) {
      console.error("[solveFromImage] JSON parse error:", parseError.message);
      console.log("[solveFromImage] Failed text:", jsonText.slice(0, 300));
      
      // Create a structured fallback from the raw text
      const cleanText = cleanupLatex(text);
      return {
        solution: "See the detailed solution below.",
        steps: [{ 
          title: "Solution", 
          math: "", 
          reasoning: cleanText
        }],
        explanation: "The problem has been solved.",
        problemType: "math",
        questions: [{
          questionNumber: 1,
          problemStatement: "Problem Solution",
          steps: [{ title: "Solution", math: "", reasoning: cleanText }],
          answer: "See the solution steps above."
        }]
      };
    }
  } catch (error: any) {
    console.error("Image solving error:", error?.message || error);
    throw new Error("Failed to solve: " + (error?.message || "Please try a clearer photo"));
  }
}

// Parse new question-based response format into SolveResult
function parseQuestionBasedResponse(result: any): SolveResult {
  const questions = result.questions || [];
  
  // Build solution summary with all answers
  const solutionParts = questions.map((q: any) => 
    `**Question ${q.questionNumber}**\n${cleanupLatex(q.answer || "")}`
  );
  const solution = solutionParts.join("\n\n");
  
  // Build steps array - each question becomes a header followed by its steps
  const allSteps: StepObject[] = [];
  
  for (const q of questions) {
    // Add question header as a step
    allSteps.push({
      title: `Question ${q.questionNumber}`,
      math: "",
      reasoning: cleanupLatex(q.problemStatement || "")
    });
    
    // Add the question's steps
    if (Array.isArray(q.steps)) {
      for (const step of q.steps) {
        allSteps.push({
          title: cleanupLatex(String(step.title || "")),
          math: String(step.math || ""),
          reasoning: cleanupLatex(String(step.reasoning || ""))
        });
      }
    }
    
    // Add the answer step
    allSteps.push({
      title: "Answer",
      math: "",
      reasoning: cleanupLatex(q.answer || "")
    });
  }
  
  return {
    solution: solution,
    steps: allSteps,
    explanation: cleanupLatex(result.explanation || "Review the steps above."),
    problemType: result.problemType || "math",
    graphSpec: result.graphSpec || undefined,
    questions: questions.map((q: any) => ({
      questionNumber: q.questionNumber,
      problemStatement: cleanupLatex(q.problemStatement || ""),
      steps: parseSteps(q.steps),
      answer: cleanupLatex(q.answer || "")
    }))
  };
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

async function solveWithAI(content: string, history: HistoryMessage[] = []): Promise<SolveResult> {
  try {
    // Build conversation messages with history for context
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: `You are TheHighGrader, a friendly AI tutor. You can chat naturally AND solve homework.

DETECT USER INTENT:
- Casual chat (hi, thanks, how are you, etc) → Use "chat" type
- Homework/math/science questions → Use "problem" type
- "step by step" or "explain" → Detailed steps
- Quick question → Brief answer

SCIENCE SPECIALIZATION:
- If user mentions "Physics", focus on physical laws, mathematical derivations, and forces.
- If user mentions "Chemistry", focus on chemical equations, periodic table trends, and molecular interactions.
- If user mentions "Biology", focus on biological systems, cellular processes, and environmental impacts.

ALWAYS respond with JSON only:

For CHAT (greetings, thanks, casual):
{"type":"chat","message":"Your friendly response here"}

For PROBLEMS (math, science, homework):
{"type":"problem","questions":[{"questionNumber":1,"problemStatement":"problem","steps":[{"title":"Step 1","math":"LaTeX no $","reasoning":"explanation with $math$"}],"answer":"final answer"}],"explanation":"summary","problemType":"math"}

Rules:
- JSON only, no markdown
- $...$ for inline math in reasoning/answer
- "math" field: pure LaTeX, no $ signs
- Be conversational and helpful
- Start response with {`,
      },
    ];
    
    // Add recent history for context (last 6 messages max to stay fast)
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    
    // Add current question
    messages.push({ role: "user", content: content });
    
    // Use GPT-5-nano for fast responses with higher token limit
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages,
    });

    let text = response.choices[0]?.message?.content || "";
    
    console.log("[solveWithAI] Raw AI response:", text.slice(0, 500));
    
    // Try to extract JSON from various formats
    let jsonText = text;
    
    // Try markdown code block first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }
    
    // Then try to find raw JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(jsonText);
      console.log("[solveWithAI] Parsed keys:", Object.keys(result));
      
      // Handle chat type (casual conversation)
      if (result.type === "chat" && result.message) {
        console.log("[solveWithAI] Chat response detected");
        return {
          solution: result.message,
          steps: [],
          explanation: "",
          problemType: "chat",
          isChat: true,
        };
      }
      
      // Handle problem type with questions array
      if (result.questions && Array.isArray(result.questions)) {
        console.log("[solveWithAI] Using question-based format, count:", result.questions.length);
        return parseQuestionBasedResponse(result);
      }
      
      // Fallback to old format
      return {
        solution: cleanupLatex(ensureString(result.solution) || "See steps below."),
        steps: parseSteps(result.steps),
        explanation: cleanupLatex(ensureString(result.explanation) || "Review the steps for understanding."),
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch (parseError: any) {
      console.error("[solveWithAI] JSON parse error:", parseError.message);
      console.log("[solveWithAI] Failed text:", jsonText.slice(0, 300));
      
      // Create a structured fallback from the raw text
      const cleanText = cleanupLatex(text);
      return {
        solution: "See the detailed solution below.",
        steps: [{ 
          title: "Solution", 
          math: "", 
          reasoning: cleanText
        }],
        explanation: "The problem has been solved.",
        problemType: "math",
        questions: [{
          questionNumber: 1,
          problemStatement: "Problem Solution",
          steps: [{ title: "Solution", math: "", reasoning: cleanText }],
          answer: "See the solution steps above."
        }]
      };
    }
  } catch (error: any) {
    console.error("AI solution error:", error?.message || error);
    throw new Error("Failed to solve: " + (error?.message || "Please try again"));
  }
}

/* ── In-memory demo rate limiter (3 per IP per 24h) ──────── */
const demoRateMap = new Map<string, { count: number; resetAt: number }>();
const DEMO_LIMIT = 3;
const DEMO_WINDOW = 24 * 60 * 60 * 1000;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /* ── Demo status check (no auth, no count consumed) ─────── */
  app.get("/api/demo/status", (req: Request, res: Response) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = demoRateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      return res.json({ remaining: DEMO_LIMIT, resetAt: now + DEMO_WINDOW, total: DEMO_LIMIT });
    }
    return res.json({ remaining: Math.max(0, DEMO_LIMIT - entry.count), resetAt: entry.resetAt, total: DEMO_LIMIT });
  });

  /* ── Full-demo endpoint (higher limit, for /demo page) ───── */
  const demoFullMap = new Map<string, { count: number; resetAt: number }>();
  app.post("/api/demo-full", async (req: Request, res: Response) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let entry = demoFullMap.get(ip);
    if (!entry || now > entry.resetAt) { entry = { count: 0, resetAt: now + 60 * 60 * 1000 }; demoFullMap.set(ip, entry); }
    if (entry.count >= 10) return res.status(429).json({ error: "Demo limit reached. Sign up for unlimited access!" });
    entry.count++;
    const remaining = 10 - entry.count;
    const { question, subject } = req.body;
    if (!question || typeof question !== "string" || question.trim().length < 2) return res.status(400).json({ error: "Please enter a question." });
    if (question.length > 600) return res.status(400).json({ error: "Question too long." });
    const systemMap: Record<string, string> = {
      Math:      "You are an expert maths tutor. Give clear, step-by-step solutions. Be concise (max 300 words). Use → for steps.",
      Physics:   "You are an expert physics tutor. Show formulas and derivations step by step. Be concise (max 300 words).",
      Chemistry: "You are an expert chemistry tutor. Show reactions with clear steps. Be concise (max 300 words).",
      Biology:   "You are an expert biology tutor. Explain biological concepts clearly. Be concise (max 300 words).",
      English:   "You are an expert English tutor. Give structured, actionable advice. Be concise (max 300 words).",
      History:   "You are an expert history tutor. Provide accurate, well-structured explanations. Be concise (max 300 words).",
      Science:   "You are an expert science tutor. Explain clearly with examples. Be concise (max 300 words).",
    };
    const system = systemMap[subject] || "You are a helpful AI tutor. Be concise and educational (max 300 words).";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.write(`data: ${JSON.stringify({ remaining })}\n\n`);
    try {
      const stream = anthropic.messages.stream({ model: "claude-opus-4-5", max_tokens: 500, system, messages: [{ role: "user", content: question.trim() }] });
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        if (res.writableEnded) break;
      }
      res.write("data: [DONE]\n\n");
    } catch { res.write(`data: ${JSON.stringify({ error: "AI unavailable, please try again." })}\n\n`); }
    res.end();
  });

  /* ── Public demo endpoint (no auth) ──────────────────────── */
  app.post("/api/demo", async (req: Request, res: Response) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let entry = demoRateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + DEMO_WINDOW };
      demoRateMap.set(ip, entry);
    }
    if (entry.count >= DEMO_LIMIT) {
      return res.status(429).json({ error: "You've used all 3 free demos for today.", resetAt: entry.resetAt, remaining: 0 });
    }
    entry.count++;
    const remaining = DEMO_LIMIT - entry.count;

    const { question, subject } = req.body;
    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return res.status(400).json({ error: "Please enter a question." });
    }
    if (question.length > 500) {
      return res.status(400).json({ error: "Question too long (max 500 chars)." });
    }

    const systemMap: Record<string, string> = {
      Math:      "You are an expert maths tutor. Give clear, step-by-step solutions using proper notation. Be concise (max 250 words). Use → for steps and wrap LaTeX in $ delimiters.",
      Physics:   "You are an expert physics tutor. Explain concepts clearly, show formulas and derivations step by step. Be concise (max 250 words).",
      Chemistry: "You are an expert chemistry tutor. Explain reactions and concepts with clear steps. Be concise (max 250 words).",
      Biology:   "You are an expert biology tutor. Explain biological concepts with clarity and structure. Be concise (max 250 words).",
      English:   "You are an expert English tutor covering grammar, essay writing, literature and comprehension. Give structured, actionable advice. Be concise (max 250 words).",
      History:   "You are an expert history tutor. Provide accurate, well-structured historical explanations with key dates and context. Be concise (max 250 words).",
    };
    const system = systemMap[subject] || "You are a helpful AI tutor. Be concise and educational (max 250 words).";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.write(`data: ${JSON.stringify({ remaining, resetAt: entry.resetAt, total: DEMO_LIMIT })}\n\n`);

    try {
      const stream = anthropic.messages.stream({
        model: "claude-opus-4-5",
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: question.trim() }],
      });

      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
        }
        if (res.writableEnded) break;
      }
      res.write("data: [DONE]\n\n");
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: "AI unavailable, please try again." })}\n\n`);
    }
    res.end();
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...safeUser } = user;
      res.status(201).json({ user: safeUser });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const user = await storage.getUserByEmail(parsed.data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(parsed.data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.patch("/api/auth/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { displayName } = req.body;
    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 1) {
      return res.status(400).json({ error: "Invalid display name" });
    }
    try {
      const updated = await storage.updateUser(req.session.userId, { displayName: displayName.trim() });
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Teacher routes
  app.get("/api/teacher/stats", async (req, res) => {
    try {
      const stats = await storage.getTeacherStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/teacher/pending", async (req, res) => {
    try {
      const submissions = await storage.getPendingSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending submissions" });
    }
  });

  app.get("/api/teacher/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const parsed = submitWorkSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const submission = await storage.createSubmission({
        ...parsed.data,
        studentName: parsed.data.studentName || "Student",
      });
      
      res.status(201).json(submission);

      (async () => {
        try {
          const aiResult = await solveWithAI(submission.content);
          await storage.updateSubmission(submission.id, {
            status: "ai_graded",
            aiSolution: aiResult.solution,
            aiSteps: aiResult.steps,
            aiExplanation: aiResult.explanation,
          });
        } catch (error) {
          console.error("Background AI solution failed:", error);
        }
      })();
    } catch (error) {
      res.status(500).json({ error: "Failed to create submission" });
    }
  });

  /* ── Multi-image endpoint ─────────────────────────────────────── */
  app.post("/api/solve-images", async (req, res) => {
    try {
      const { images, prompt } = req.body;

      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "At least one image is required" });
      }
      if (images.length > 8) {
        return res.status(400).json({ error: "Maximum 8 images allowed at once" });
      }

      const imageContent: any[] = images
        .filter((img: any) => img.base64 && img.mimeType?.startsWith("image/"))
        .map((img: any) => ({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: "high" },
        }));

      if (imageContent.length === 0) {
        return res.status(400).json({ error: "No valid images found. Please upload image files (JPG, PNG, WEBP)." });
      }

      const systemPrompt = `You are an expert AI tutor. Analyse ALL provided images carefully.
${imageContent.length > 1 ? `There are ${imageContent.length} images — address each one.` : ""}
Solve every problem shown step-by-step. Use $...$ for inline math and $$...$$ for display math.
Be thorough and educational — explain your reasoning.`;

      const textPart: any = {
        type: "text",
        text: prompt?.trim()
          ? `${prompt.trim()}\n\nPlease analyse the ${imageContent.length > 1 ? "images" : "image"} and provide a complete solution.`
          : `Please analyse ${imageContent.length > 1 ? `all ${imageContent.length} images` : "this image"} and solve every problem shown, step by step.`,
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: [textPart, ...imageContent] },
        ],
        max_completion_tokens: 2000,
      });

      const solution = response.choices[0]?.message?.content || "Could not analyse the images.";

      res.json({ solution });
    } catch (error: any) {
      console.error("Multi-image solve error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to process images" });
    }
  });

  app.post("/api/solve-image", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Image and mimeType are required" });
      }

      const isImage = mimeType.startsWith("image/");
      const isPDF = mimeType === "application/pdf";
      
      if (!isImage && !isPDF) {
        return res.status(400).json({ error: "Invalid file type. Please upload an image or PDF." });
      }

      let aiResult: SolveResult;
      
      if (isPDF) {
        // Extract text from PDF using PDFParse class
        try {
          const pdfBuffer = Buffer.from(image, "base64");
          const uint8Array = new Uint8Array(pdfBuffer);
          const PDFParseClass = await getPDFParse();
          const parser = new PDFParseClass(uint8Array);
          const pdfResult = await parser.getText();
          const extractedText = pdfResult.text?.trim().replace(/\n*-- \d+ of \d+ --\n*/g, '').trim();
          
          // Only use text if it's actually meaningful content
          const hasRealContent = extractedText && 
            extractedText.length >= 100 && 
            /[a-zA-Z]{3,}/.test(extractedText) && 
            !/^\s*\d+\s*$/.test(extractedText);
            
          if (!hasRealContent) {
            // PDF is scanned/image-based - convert to image and use GPT Vision
            console.log("PDF has minimal text, converting to image for Vision processing");
            
            try {
              // Convert PDF to PNG using pdf2pic - optimized for speed
              const { fromBuffer } = await import("pdf2pic");
              const options = {
                density: 100,  // Lower density = faster conversion
                saveFilename: "page",
                savePath: "/tmp",
                format: "png",
                width: 800,    // Smaller size for faster AI processing
                height: 1000
              };
              
              console.log("Starting PDF to image conversion...");
              const startTime = Date.now();
              const convert = fromBuffer(pdfBuffer, options);
              const pageOutput = await convert(1, { responseType: "base64" });
              console.log(`PDF conversion took ${Date.now() - startTime}ms`);
              
              if (pageOutput && pageOutput.base64) {
                console.log("PDF converted to image, sending to Vision");
                aiResult = await solveFromImage(pageOutput.base64, "image/png");
              } else {
                throw new Error("PDF to image conversion failed");
              }
            } catch (convErr: any) {
              console.error("PDF to image conversion error:", convErr?.message);
              return res.status(400).json({ 
                error: "Could not process this scanned PDF. Please take a screenshot of the problem and upload it as an image." 
              });
            }
          } else {
            console.log("PDF text extracted:", extractedText.substring(0, 200) + "...");
            aiResult = await solveWithAI(extractedText);
          }
        } catch (pdfError: any) {
          console.error("PDF parsing error:", pdfError?.message);
          return res.status(400).json({ error: "Failed to read PDF. Please try uploading an image instead." });
        }
      } else {
        // Solve directly from image
        aiResult = await solveFromImage(image, mimeType);
      }
      
      const submission = await storage.createSubmission({
        title: "Image Problem",
        studentName: "Student",
        content: "Image problem",
      });
      
      // Update with solution immediately
      await storage.updateSubmission(submission.id, {
        status: "ai_graded",
        aiSolution: aiResult.solution,
        aiSteps: aiResult.steps,
        aiExplanation: aiResult.explanation,
        problemType: aiResult.problemType,
        graphSpec: aiResult.graphSpec,
      });

      const updated = await storage.getSubmission(submission.id);
      // Include questions array in response for step-by-step display
      res.status(201).json({
        ...updated,
        questions: aiResult.questions || [],
      });
    } catch (error: any) {
      console.error("Image submission error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to process image" });
    }
  });

  // Streaming endpoint for real-time token output
  app.post("/api/solve-text-stream", async (req, res) => {
    try {
      const { problem, history = [] } = req.body;
      
      if (!problem || typeof problem !== "string" || !problem.trim()) {
        return res.status(400).json({ error: "Please enter a problem to solve" });
      }

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // Check if this is a graph request
      const graphPatterns = /\b(graph|plot|draw|sketch)\b/i;
      const hasGraphKeyword = graphPatterns.test(problem);
      const hasExpression = /y\s*=|sin|cos|tan|log|x\^|x\s*\^|\bx\b/i.test(problem);
      
      if (hasGraphKeyword && hasExpression) {
        // Extract the expression - look for y = ... or common functions
        let expression = "x^2"; // default
        
        // Try to match y = expression
        const yEqualsMatch = problem.match(/y\s*=\s*([^\s,]+(?:\s*[\+\-\*\/\^]\s*[^\s,]+)*)/i);
        if (yEqualsMatch) {
          expression = yEqualsMatch[1].trim();
        } else {
          // Try to match function names like sin(x), cos(x), etc.
          const funcMatch = problem.match(/\b(sin|cos|tan|log|ln|sqrt)\s*\(\s*x\s*\)/i);
          if (funcMatch) {
            expression = funcMatch[0];
          } else {
            // Try polynomial like x^2 + 3x
            const polyMatch = problem.match(/x\s*\^\s*\d+(?:\s*[\+\-]\s*\d*x?(?:\s*\^\s*\d+)?)+/i);
            if (polyMatch) {
              expression = polyMatch[0];
            }
          }
        }
        
        // Clean up the expression
        expression = expression.replace(/×/g, "*").replace(/÷/g, "/");
        
        // Stream the explanation
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_completion_tokens: 600,
          messages: [
            { role: "system", content: "You are a math tutor. Briefly explain the graph being shown. Describe its key features (intercepts, asymptotes, domain, range) in plain text. Don't use LaTeX." },
            { role: "user", content: `Explain the graph of y = ${expression}` }
          ],
          stream: true,
        });

        let fullText = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
          }
        }
        
        // Send graphSpec with the done message
        const graphSpec = {
          expressions: [expression],
          title: `Graph of y = ${expression}`,
          xMin: -10,
          xMax: 10,
          yMin: -10,
          yMax: 10,
        };
        
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          result: { 
            type: "graph", 
            message: fullText, 
            aiSolution: fullText,
            graphSpec 
          } 
        })}\n\n`);
        res.end();
        return;
      }

      // Check if this is casual chat
      const chatPatterns = /^(hi|hello|hey|thanks|thank you|how are you|what's up|yo|sup|good morning|good evening|bye|goodbye|ok|okay|cool|nice|great|awesome|perfect|got it|understood|help me|can you help)/i;
      const isChat = chatPatterns.test(problem.trim());

      if (isChat) {
        // Stream casual chat response
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_completion_tokens: 300,
          messages: [
            { role: "system", content: "You are TheHighGrader, a friendly AI homework tutor. Be warm, helpful, and brief." },
            { role: "user", content: problem.trim() }
          ],
          stream: true,
        });

        let fullText = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true, result: { type: "chat", message: fullText, isChat: true } })}\n\n`);
        res.end();
        return;
      }

      // Check if problem contains embedded tutor instruction
      const tutorModeMatch = problem.match(/\[TUTOR MODE: ([\s\S]*?)\]\n\nStudent question:/);
      let systemContent: string;
      let cleanedProblem = problem;

      const FORMATTING_SUFFIX = `

When responding to math or science problems, structure your answer like this:
1. One brief introductory sentence stating the approach.
2. Numbered steps using ## headings (e.g. ## Step 1: Set Up the Equation).
3. Use LaTeX for all mathematical expressions — inline: $x^2$, display: $$\\frac{a}{b}=c$$.
4. End with a ## Answer section stating the final result clearly.`;

      if (tutorModeMatch) {
        // Use the embedded instruction from the frontend, appended with formatting guidance
        systemContent = tutorModeMatch[1].trim() + FORMATTING_SUFFIX;
        // Remove the tutor mode prefix from the problem
        cleanedProblem = problem.replace(/\[TUTOR MODE: [\s\S]*?\]\n\nStudent question: /, "").trim();
      } else {
        // Fall back to default comprehensive tutor
        systemContent = `You are TheHighGrader, a friendly AI tutor skilled in math, science, English, history, and all school subjects. Help students learn by providing clear, step-by-step explanations.

For MATH and SCIENCE problems, always structure your response like this:
1. Start with one brief sentence introducing the approach or key concept.
2. Use numbered steps with ## headings (e.g. ## Step 1: Set Up the Equation).
3. Show all working clearly. Use LaTeX for every mathematical expression:
   - Inline math: $x^2 + 2x + 1$
   - Display math (own line): $$\\frac{a}{b} = c$$
4. End with a clear "## Answer" section stating the final result.

For other subjects (History, English, etc.):
- Use clear headings and bullet points where appropriate.
- Be thorough but concise.`;
      }

      const systemMessage = {
        role: "system" as const,
        content: systemContent,
      };
      
      // Include history if provided
      const conversationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [systemMessage];
      
      if (history && Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          if (msg.role === "assistant" || msg.role === "user") {
            conversationMessages.push({ role: msg.role, content: msg.content });
          }
        }
      }
      
      // Add current problem (use cleaned version without tutor mode wrapper)
      conversationMessages.push({ role: "user", content: cleanedProblem });
      
      // For homework problems - stream readable solution
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 600,
        messages: conversationMessages,
        stream: true,
      });

      let fullText = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
        }
      }

      // Send final result with parsed structure for storage
      res.write(`data: ${JSON.stringify({ done: true, result: { type: "problem", rawText: fullText, aiSolution: fullText } })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Stream error:", error?.message);
      res.write(`data: ${JSON.stringify({ error: error?.message || "Failed to solve" })}\n\n`);
      res.end();
    }
  });

  // Streaming endpoint for image/PDF solving
  app.post("/api/solve-image-stream", async (req, res) => {
    try {
      const { image, mimeType, prompt: userPrompt } = req.body;
      
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Image and mimeType are required" });
      }

      const isImage = mimeType.startsWith("image/") || 
                       ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", 
                        "image/tiff", "image/heic", "image/heif"].includes(mimeType);
      const isPDF = mimeType === "application/pdf";
      const isWord = mimeType === "application/msword" || 
                     mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const isText = mimeType.startsWith("text/") || 
                     ["application/json", "application/xml", "application/javascript",
                      "application/x-python", "application/x-sh"].includes(mimeType);
      const isSpreadsheet = mimeType === "application/vnd.ms-excel" ||
                            mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                            mimeType === "text/csv";
      
      // Accept all common file types

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let imageBase64 = image;
      let imageMimeType = mimeType;

      // Handle PDF - convert to high-quality image
      if (isPDF) {
        try {
          const pdfBuffer = Buffer.from(image, "base64");
          console.log("Converting PDF to high-quality image...");
          
          const { fromBuffer } = await import("pdf2pic");
          const convert = fromBuffer(pdfBuffer, {
            density: 200,  // High quality for clear text
            saveFilename: "page",
            savePath: "/tmp",
            format: "png",
            width: 1600,   // Large enough to read small text
            height: 2000
          });
          const pageOutput = await convert(1, { responseType: "base64" });
          
          if (pageOutput?.base64) {
            console.log("PDF converted successfully, size:", pageOutput.base64.length);
            imageBase64 = pageOutput.base64;
            imageMimeType = "image/png";
          } else {
            throw new Error("PDF conversion failed");
          }
        } catch (pdfErr: any) {
          console.error("PDF error:", pdfErr?.message);
          res.write(`data: ${JSON.stringify({ error: "Could not process PDF. Try taking a screenshot instead." })}\n\n`);
          res.end();
          return;
        }
      }

      // Handle Word documents - extract text and images
      if (isWord) {
        try {
          const mammoth = await import("mammoth");
          const wordBuffer = Buffer.from(image, "base64");
          console.log("Extracting content from Word document...");
          
          // Extract images from the Word document
          const embeddedImages: { base64: string; contentType: string }[] = [];
          
          const options = {
            buffer: wordBuffer,
            convertImage: mammoth.images.imgElement(async (imageData: any) => {
              const imgBuffer = await imageData.read();
              const base64Img = imgBuffer.toString("base64");
              const contentType = imageData.contentType || "image/png";
              embeddedImages.push({ base64: base64Img, contentType });
              return { src: `data:${contentType};base64,${base64Img}` };
            })
          };
          
          const result = await mammoth.convertToHtml(options as any);
          
          // Also get plain text
          const textResult = await mammoth.extractRawText({ buffer: wordBuffer });
          const extractedText = textResult.value.trim();
          
          console.log("Word content extracted - text length:", extractedText.length, "images:", embeddedImages.length);
          
          // If there are embedded images, process them all with vision API
          if (embeddedImages.length > 0) {
            console.log(`Processing Word document with ${embeddedImages.length} embedded images...`);
            
            // Build content array with all images for GPT-4o
            const imageContents = embeddedImages.map((img, idx) => ({
              type: "image_url" as const,
              image_url: { url: `data:${img.contentType};base64,${img.base64}`, detail: "high" as const }
            }));
            
            // Use GPT-4o to process all images at once
            const stream = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `READ ALL ${embeddedImages.length} IMAGES CAREFULLY. Solve every math problem you see with the ACTUAL numbers from each image.

${extractedText ? `Document text context: ${extractedText.substring(0, 500)}` : ""}

Format each answer EXACTLY like this (no markdown, no ### or **):

Question 1
[State the problem]

[Step title]
[Explanation and calculation]

Answer: [final answer]

Question 2
[next problem...]

RULES:
- NO markdown (no #, *, ---)
- Read ACTUAL numbers from ALL images
- Use × for multiplication, ² for squared, ³ for cubed
- Solve ALL problems from ALL images
- Plain text only, professional and clean`,
                    },
                    ...imageContents
                  ],
                },
              ],
              stream: true,
              max_completion_tokens: 800,
            });

            for await (const chunk of stream) {
              const token = chunk.choices[0]?.delta?.content || "";
              if (token) {
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
              }
            }

            res.write(`data: ${JSON.stringify({ done: true, result: { id: "", content: "Word document", status: "ai_graded" } })}\n\n`);
            res.end();
            return;
          } else if (extractedText) {
            // Text only - process inline with Claude
            const claudeClient = await import("@anthropic-ai/sdk").then(m => new m.default());
            const msgPrompt = userPrompt?.trim()
              ? `${userPrompt}\n\nDocument content:\n${extractedText.substring(0, 20000)}`
              : `Analyse the following Word document and provide a comprehensive summary, key points, and any actionable insights:\n\n${extractedText.substring(0, 20000)}`;
            const textStream = await claudeClient.messages.stream({
              model: "claude-opus-4-5",
              max_tokens: 2000,
              messages: [{ role: "user", content: msgPrompt }],
            });
            for await (const evt of textStream) {
              if (evt.type === "content_block_delta" && evt.delta.type === "text_delta") {
                res.write(`data: ${JSON.stringify({ token: evt.delta.text })}\n\n`);
              }
            }
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          } else {
            res.write(`data: ${JSON.stringify({ error: "Could not extract content from document. The file may be empty." })}\n\n`);
            res.end();
            return;
          }
        } catch (wordErr: any) {
          console.error("Word error:", wordErr?.message);
          res.write(`data: ${JSON.stringify({ error: "Could not process Word document. Please copy and paste the text instead." })}\n\n`);
          res.end();
          return;
        }
      }

      // Handle text-based files (txt, json, csv, code files, etc.)
      if (isText || isSpreadsheet) {
        try {
          const textBuffer = Buffer.from(image, "base64");
          const textContent = textBuffer.toString("utf-8");
          console.log("Processing text file, length:", textContent.length);
          
          // Stream response for text content
          const textPromptContent = userPrompt?.trim()
            ? `${userPrompt}\n\nFile content:\n${textContent.substring(0, 15000)}${textContent.length > 15000 ? "\n(Content truncated...)" : ""}`
            : `Analyse and help with this ${isSpreadsheet ? "spreadsheet/data" : "text"} file:\n\n${textContent.substring(0, 15000)}${textContent.length > 15000 ? "\n(Content truncated...)" : ""}\n\nPlease:\n1. Summarise the content\n2. Answer any questions if present\n3. Solve any problems or tasks mentioned\n4. Provide helpful insights or analysis`;
          const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: textPromptContent,
              },
            ],
            max_completion_tokens: 2000,
            stream: true,
          });

          let fullText = "";
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
            }
          }

          res.write(`data: ${JSON.stringify({ done: true, result: { aiSolution: fullText } })}\n\n`);
          res.end();
          return;
        } catch (textErr: any) {
          console.error("Text file error:", textErr?.message);
          res.write(`data: ${JSON.stringify({ error: "Could not process text file." })}\n\n`);
          res.end();
          return;
        }
      }

      // For unsupported binary file types, try to extract as text or return helpful error
      if (!isImage && !isPDF && !isWord) {
        try {
          const fileBuffer = Buffer.from(image, "base64");
          // Try to decode as UTF-8 text
          const textContent = fileBuffer.toString("utf-8");
          
          // Guard against empty content
          if (!textContent || textContent.length === 0) {
            res.write(`data: ${JSON.stringify({ error: "The file appears to be empty. Please upload a file with content." })}\n\n`);
            res.end();
            return;
          }
          
          // Check if it looks like valid text (has printable characters)
          const printableChars = (textContent.match(/[\x20-\x7E\n\r\t]/g) || []).length;
          const printableRatio = printableChars / textContent.length;
          
          if (printableRatio > 0.8 && textContent.length > 10) {
            console.log("Processing unknown file as text, length:", textContent.length);
            
            const stream = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: `Analyze and help with this content:

${textContent.substring(0, 15000)}

${textContent.length > 15000 ? "(Content truncated...)" : ""}

Please:
1. Summarize the content
2. Answer any questions if present
3. Solve any problems or tasks mentioned
4. Provide helpful insights or analysis`,
                },
              ],
              max_completion_tokens: 800,
              stream: true,
            });

            let fullText = "";
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
              }
            }

            res.write(`data: ${JSON.stringify({ done: true, result: { aiSolution: fullText } })}\n\n`);
            res.end();
            return;
          } else {
            res.write(`data: ${JSON.stringify({ error: "This file type cannot be processed. Please upload an image, PDF, Word document, or text file." })}\n\n`);
            res.end();
            return;
          }
        } catch (unknownErr: any) {
          console.error("Unknown file error:", unknownErr?.message);
          res.write(`data: ${JSON.stringify({ error: "Could not process this file. Please try a different format." })}\n\n`);
          res.end();
          return;
        }
      }

      // Use GPT-4o for accurate image/PDF reading
      const visionPromptText = userPrompt?.trim()
        ? userPrompt.trim()
        : `READ THIS IMAGE CAREFULLY. Solve every math problem you see with the ACTUAL numbers from the image.

FORMAT ALL MATH WITH LATEX:
- Use $...$ for inline math: $V = \\frac{1}{3}\\pi r^2 h$
- Use $$...$$ for display/block math equations

RULES:
- Use LaTeX for ALL mathematical expressions
- Use **bold** for section headers
- Read ACTUAL numbers from the image
- Solve ALL problems visible in the image
- Show clear step-by-step work with proper math notation`;

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: visionPromptText,
              },
              {
                type: "image_url",
                image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "high" },
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
        stream: true,
      });

      let fullText = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
        }
      }

      // Parse and save
      try {
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          const submission = await storage.createSubmission({
            title: "Image Problem",
            studentName: "Student",
            content: "Image problem",
          });
          
          const steps = result.questions?.flatMap((q: any) => 
            (q.steps || []).map((s: any) => ({ ...s, title: `Question ${q.questionNumber}: ${s.title}` }))
          ) || [];
          
          await storage.updateSubmission(submission.id, {
            status: "ai_graded",
            aiSolution: result.questions?.map((q: any) => `Q${q.questionNumber}: ${q.answer}`).join("\n") || "",
            aiSteps: steps,
            aiExplanation: result.explanation || "",
            problemType: result.problemType || "general",
          });

          res.write(`data: ${JSON.stringify({ done: true, result: { ...result, id: submission.id, aiSolution: fullText } })}\n\n`);
        }
      } catch {
        res.write(`data: ${JSON.stringify({ done: true, result: { type: "chat", aiSolution: fullText } })}\n\n`);
      }
      
      res.end();
    } catch (error: any) {
      console.error("Image stream error:", error?.message);
      res.write(`data: ${JSON.stringify({ error: error?.message || "Failed to process image" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/solve-text", async (req, res) => {
    try {
      const { problem, history = [] } = req.body;
      
      if (!problem || typeof problem !== "string" || !problem.trim()) {
        return res.status(400).json({ error: "Please enter a problem to solve" });
      }

      const aiResult = await solveWithAI(problem.trim(), history);
      
      const submission = await storage.createSubmission({
        title: "Text Problem",
        studentName: "Student",
        content: problem.trim(),
      });
      
      await storage.updateSubmission(submission.id, {
        status: "ai_graded",
        aiSolution: aiResult.solution,
        aiSteps: aiResult.steps,
        aiExplanation: aiResult.explanation,
        problemType: aiResult.problemType,
        graphSpec: aiResult.graphSpec,
      });

      const updated = await storage.getSubmission(submission.id);
      // Include questions array in response for step-by-step display
      res.status(201).json({
        ...updated,
        questions: aiResult.questions || [],
      });
    } catch (error: any) {
      console.error("Text submission error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to solve problem" });
    }
  });

  app.get("/api/submissions/:id", async (req, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  app.post("/api/submissions/:id/evaluate", async (req, res) => {
    try {
      const parsed = evaluateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      await storage.createEvaluation({
        submissionId: req.params.id,
        teacherId: req.body.teacherId,
        score: parsed.data.score,
        feedback: parsed.data.feedback,
      });

      const updated = await storage.getSubmission(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit evaluation" });
    }
  });

  app.get("/api/student/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/student/stats", async (req, res) => {
    try {
      const stats = await storage.getStudentStats(req.session.userId ? String(req.session.userId) : undefined);
      // Log for debugging
      console.log(`Stats for user ${req.session.userId}:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/teacher/queue", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      const pending = submissions.filter(s => s.status === "ai_graded");
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  app.get("/api/teacher/all-submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/teacher/stats", async (req, res) => {
    try {
      const stats = await storage.getTeacherStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  const quizUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/extract-text", quizUpload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mimeType = file.mimetype;
      const isImage = mimeType.startsWith("image/");
      const isPDF = mimeType === "application/pdf";
      const isWord = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                     mimeType === "application/msword";
      const isText = mimeType.startsWith("text/");

      if (isText) {
        const text = file.buffer.toString("utf-8").trim();
        if (!text) return res.status(400).json({ error: "File appears to be empty" });
        return res.json({ text: text.slice(0, 5000) });
      }

      if (isPDF) {
        try {
          const uint8Array = new Uint8Array(file.buffer);
          const PDFParseClass = await getPDFParse();
          const parser = new PDFParseClass(uint8Array);
          const pdfResult = await parser.getText();
          const extractedText = pdfResult.text?.trim().replace(/\n*-- \d+ of \d+ --\n*/g, '').trim();
          if (extractedText && extractedText.length >= 50 && /[a-zA-Z]{3,}/.test(extractedText)) {
            return res.json({ text: extractedText.slice(0, 5000) });
          }
          const base64 = file.buffer.toString("base64");
          try {
            const { fromBuffer } = await import("pdf2pic");
            const convert = fromBuffer(file.buffer, { density: 100, saveFilename: "page", savePath: "/tmp", format: "png", width: 800, height: 1000 });
            const pageOutput = await convert(1, { responseType: "base64" });
            if (pageOutput?.base64) {
              const visionResp = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                max_completion_tokens: 2000,
                messages: [
                  { role: "system", content: "Extract ALL text content from this image. Return only the extracted text, nothing else." },
                  { role: "user", content: [{ type: "image_url", image_url: { url: `data:image/png;base64,${pageOutput.base64}` } }] }
                ],
              });
              const text = visionResp.choices[0]?.message?.content?.trim() || "";
              if (text) return res.json({ text: text.slice(0, 5000) });
            }
          } catch {}
          return res.status(400).json({ error: "Could not extract text from this PDF. Try a different file." });
        } catch {
          return res.status(400).json({ error: "Failed to read PDF file." });
        }
      }

      if (isImage) {
        const base64 = file.buffer.toString("base64");
        const visionResp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_completion_tokens: 2000,
          messages: [
            { role: "system", content: "Extract ALL text content from this image. Include all visible text, equations, diagrams labels, etc. Return only the extracted text, nothing else." },
            { role: "user", content: [{ type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }] }
          ],
        });
        const text = visionResp.choices[0]?.message?.content?.trim() || "";
        if (!text) return res.status(400).json({ error: "Could not extract text from this image." });
        return res.json({ text: text.slice(0, 5000) });
      }

      if (isWord) {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          const text = result.value?.trim();
          if (!text) return res.status(400).json({ error: "Word document appears to be empty." });
          return res.json({ text: text.slice(0, 5000) });
        } catch {
          return res.status(400).json({ error: "Failed to read Word document." });
        }
      }

      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, image, Word document, or text file." });
    } catch (error: any) {
      console.error("Extract text error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to extract text" });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const data = {
        ...req.body,
        userId: req.session.userId,
      };
      const attempt = await storage.createQuizAttempt(data);
      res.status(201).json(attempt);
    } catch (error: any) {
      console.error("Quiz attempt error:", error);
      res.status(500).json({ error: error?.message || "Failed to save quiz attempt" });
    }
  });

  app.get("/api/quiz-attempts", requireAuth, async (req, res) => {
    try {
      const attempts = await storage.getQuizAttemptsByUser(req.session.userId!);
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  });

  /* ── Teacher Profile ────────────────────────────────────────── */
  app.get("/api/teacher/profile", requireTeacher, async (req, res) => {
    try {
      const profile = await storage.getTeacherProfile(req.session.userId!);
      res.json(profile || null);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/teacher/profile", requireTeacher, async (req, res) => {
    try {
      const { school, subjects, gradeLevel, bio } = req.body;
      const existing = await storage.getTeacherProfile(req.session.userId!);
      if (existing) {
        const updated = await storage.updateTeacherProfile(req.session.userId!, { school, subjects, gradeLevel, bio });
        return res.json(updated);
      }
      const profile = await storage.createTeacherProfile({
        userId: req.session.userId!,
        school: school || null,
        subjects: subjects || [],
        gradeLevel: gradeLevel || null,
        bio: bio || null,
      });
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  /* ── Classes ─────────────────────────────────────────────────── */
  app.get("/api/teacher/classes", requireTeacher, async (req, res) => {
    try {
      const classlist = await storage.getClassesByTeacher(req.session.userId!);
      // Add student count for each class
      const withCounts = await Promise.all(classlist.map(async (cls) => {
        const members = await storage.getMembershipsByClass(cls.id);
        return { ...cls, studentCount: members.length };
      }));
      res.json(withCounts);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  app.post("/api/teacher/classes", requireTeacher, async (req, res) => {
    try {
      const { name, subject, gradeLevel } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Class name is required" });
      // Generate unique 6-char uppercase class code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let classCode = "";
      let attempts = 0;
      do {
        classCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const existing = await storage.getClassByCode(classCode);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      const cls = await storage.createClass({
        teacherId: req.session.userId!,
        name: name.trim(),
        subject: subject || "General",
        gradeLevel: gradeLevel || null,
        classCode,
      });
      res.status(201).json({ ...cls, studentCount: 0 });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.patch("/api/teacher/profile", requireTeacher, async (req, res) => {
    try {
      const { school, subjects, gradeLevel, bio } = req.body;
      const profile = await storage.updateTeacherProfile(req.session.userId!, { school, subjects, gradeLevel, bio });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/teacher/classes/:id", requireTeacher, async (req, res) => {
    try {
      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });
      if (cls.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteClass(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  app.get("/api/teacher/classes/:id/students", requireTeacher, async (req, res) => {
    try {
      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });
      if (cls.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const members = await storage.getMembershipsByClass(req.params.id);
      // Fetch user details for each member
      const students = await Promise.all(
        members.map(async (m) => {
          const user = await storage.getUser(m.studentId);
          return {
            id: m.studentId,
            displayName: user?.displayName || "Unknown Student",
            email: user?.email || "",
            joinedAt: m.joinedAt,
          };
        })
      );
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/teacher/classes/:id/stats", requireTeacher, async (req, res) => {
    try {
      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });
      if (cls.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const members = await storage.getMembershipsByClass(req.params.id);
      const rubricList = await storage.getRubricsByTeacher(req.session.userId!, req.params.id);
      let avgScore: number | null = null;
      if (rubricList.length > 0) {
        // Get all evaluations for all rubrics in this class
        const allEvals: number[] = [];
        for (const r of rubricList) {
          const evals = await storage.getRubricEvaluationsByRubric(r.id);
          for (const ev of evals) {
            const pct = (ev.overallScore / r.totalPoints) * 100;
            allEvals.push(Math.round(pct));
          }
        }
        if (allEvals.length > 0) {
          avgScore = Math.round(allEvals.reduce((a, b) => a + b, 0) / allEvals.length);
        }
      }
      res.json({
        studentCount: members.length,
        assignmentCount: rubricList.length,
        avgScore,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  /* ── Available Public Classes (student browse) ──────────────── */
  app.get("/api/classes/available", requireAuth, requireStudent, async (req, res) => {
    try {
      const publicClasses = await storage.getPublicClasses();
      const memberships = await storage.getMembershipsByStudent(req.session.userId!);
      const enrolledIds = new Set(memberships.map(m => m.classId));
      // Attach enrollment status and teacher info
      const result = await Promise.all(publicClasses.map(async (cls) => {
        const teacher = await storage.getUser(cls.teacherId);
        const classMembers = await storage.getMembershipsByClass(cls.id);
        return {
          ...cls,
          isEnrolled: enrolledIds.has(cls.id),
          teacherName: teacher?.displayName || teacher?.email || "Teacher",
          studentCount: classMembers.length,
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch available classes" });
    }
  });

  /* ── Class Join (student) ───────────────────────────────────── */
  app.post("/api/classes/join", requireAuth, requireStudent, async (req, res) => {
    try {
      const { classCode, classId } = req.body;
      let cls;
      if (classId) {
        cls = await storage.getClass(classId);
      } else {
        if (!classCode?.trim()) return res.status(400).json({ error: "Class code is required" });
        cls = await storage.getClassByCode(classCode.trim().toUpperCase());
      }
      if (!cls) return res.status(404).json({ error: "Class not found. Check the code and try again." });
      // Check if already a member
      const memberships = await storage.getMembershipsByStudent(req.session.userId!);
      if (memberships.some(m => m.classId === cls!.id)) {
        return res.status(409).json({ error: "You are already enrolled in this class.", class: cls });
      }
      await storage.joinClass({ classId: cls.id, studentId: req.session.userId! });
      res.status(201).json({ success: true, class: cls });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to join class" });
    }
  });

  /* ── Toggle class public (teacher) ─────────────────────────── */
  app.patch("/api/teacher/classes/:id", requireTeacher, async (req, res) => {
    try {
      const { id } = req.params;
      const cls = await storage.getClass(id);
      if (!cls || cls.teacherId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { isPublic, description } = req.body;
      const updated = await storage.updateClass(id, {
        ...(typeof isPublic === "boolean" && { isPublic }),
        ...(typeof description === "string" && { description }),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update class" });
    }
  });

  app.get("/api/student/classes", requireAuth, requireStudent, async (req, res) => {
    try {
      const studentClasses = await storage.getClassesForStudent(req.session.userId!);
      res.json(studentClasses);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  /* ── Tutor Sessions ─────────────────────────────────────────── */
  app.get("/api/tutor-sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getTutorSessionsByUser(req.session.userId!);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/tutor-sessions", requireAuth, async (req, res) => {
    try {
      const { title, messages, subject } = req.body;
      const session = await storage.createTutorSession({
        userId: req.session.userId!,
        title: title || "New Conversation",
        messages: messages || [],
        subject: subject || null,
      });
      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.patch("/api/tutor-sessions/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { messages, title } = req.body;
      const session = await storage.updateTutorSession(id, { messages, title });
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  app.delete("/api/tutor-sessions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTutorSession(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.post("/api/analyze-topics", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length < 50) {
        return res.status(400).json({ error: "Please provide more text to analyze" });
      }
      const trimmed = text.trim().slice(0, 2000);
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 400,
        messages: [
          {
            role: "system",
            content: `Analyze the educational text and return JSON only:
{"topic":"main topic name","subtopics":["subtopic1","subtopic2","subtopic3"],"possibleQuestions":["Sample question 1?","Sample question 2?","Sample question 3?","Sample question 4?","Sample question 5?"],"questionCount":20}
Rules: 3-6 subtopics, 5 possible questions as examples of what can be tested, questionCount is realistic max questions from this content. JSON only.`
          },
          { role: "user", content: trimmed }
        ],
      });
      let raw = response.choices[0]?.message?.content || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) raw = match[0];
      const result = JSON.parse(raw);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to analyze topics" });
    }
  });

  /* ── YouTube transcript ──────────────────────────────────────── */
  app.post("/api/youtube-transcript", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Please provide a YouTube URL" });
      }

      // Extract video ID
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
        /[?&]v=([A-Za-z0-9_-]{11})/,
        /^([A-Za-z0-9_-]{11})$/,
      ];
      let videoId: string | null = null;
      for (const p of patterns) {
        const m = url.match(p);
        if (m) { videoId = m[1]; break; }
      }
      if (!videoId) {
        return res.status(400).json({ error: "Could not extract a valid YouTube video ID. Please use a standard youtube.com or youtu.be link." });
      }

      // Helper to decode HTML entities in titles
      const decodeHtmlEntities = (s: string) =>
        s.replace(/&amp;/g, "&")
         .replace(/&#39;/g, "'")
         .replace(/&quot;/g, '"')
         .replace(/&lt;/g, "<")
         .replace(/&gt;/g, ">");

      // Fetch the YouTube watch page
      let title = "";
      let description = "";
      let html = "";
      const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Cookie": "CONSENT=YES+cb; PREF=f6=40000000",
        },
      });
      if (pageResp.ok) {
        html = await pageResp.text();
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        title = decodeHtmlEntities(titleMatch?.[1]?.replace(/ - YouTube$/, "").trim() || "");
        const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        description = descMatch?.[1]
          ?.replace(/\\n/g, " ")
          ?.replace(/\\"/g, '"')
          ?.replace(/\\\\/g, "\\")
          ?.slice(0, 2000) || "";
      }

      // Fallback: use YouTube oEmbed API to get the title (more reliable, public API)
      if (!title) {
        try {
          const oembedResp = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          );
          if (oembedResp.ok) {
            const oembedData = await oembedResp.json() as { title?: string; author_name?: string };
            title = decodeHtmlEntities(oembedData.title || "");
          }
        } catch {
          // oEmbed also failed — fall through to final error
        }
      }

      if (!title) {
        return res.status(404).json({ error: "Video not found. Make sure the link is correct and the video is publicly accessible." });
      }

      // Try to extract caption tracks using the reliable "captions" split approach
      // Helper: fetch with timeout (ms)
      const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs: number) => {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeoutMs);
        return fetch(url, { ...options, signal: ac.signal }).finally(() => clearTimeout(timer));
      };

      let transcript = "";
      try {
        const captionsSplit = html.split('"captions":');
        if (captionsSplit.length > 1) {
          const captionsRaw = captionsSplit[1].split(',"videoDetails')[0].replace(/\n/g, "");
          const captionsData = JSON.parse(captionsRaw);
          const tracks: any[] = captionsData?.playerCaptionsTracklistRenderer?.captionTracks || [];
          const pageCookies = pageResp.headers.getSetCookie?.() || [];
          const cookieStr = "CONSENT=YES+cb; PREF=f6=40000000; " + pageCookies.map((c: string) => c.split(";")[0]).join("; ");
          const enTrack = tracks.find((t: any) => t.languageCode === "en" && !t.kind)
            || tracks.find((t: any) => t.languageCode?.startsWith("en"))
            || tracks[0];
          if (enTrack?.baseUrl) {
            for (const fmt of ["json3", "vtt", "srv3"]) {
              try {
                const txResp = await fetchWithTimeout(enTrack.baseUrl + `&fmt=${fmt}`, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Cookie": cookieStr,
                    "Referer": `https://www.youtube.com/watch?v=${videoId}`,
                    "Origin": "https://www.youtube.com",
                  },
                }, 4000);
                const txBody = await txResp.text();
                // If body is empty, YouTube is blocking — skip remaining formats
                if (!txBody || txBody.length === 0) break;
                if (txBody.length > 100) {
                  if (fmt === "json3") {
                    const txData = JSON.parse(txBody);
                    transcript = (txData.events || [])
                      .filter((e: any) => e.segs)
                      .map((e: any) => e.segs.map((s: any) => s.utf8 || "").join(""))
                      .join(" ")
                      .replace(/\[.*?\]/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 10000);
                  } else if (fmt === "vtt") {
                    transcript = txBody
                      .replace(/WEBVTT[\s\S]*?\n\n/, "")
                      .replace(/\d{2}:\d{2}[\d:.,]* --> [\d:.,\s]+\n/g, "")
                      .replace(/<[^>]+>/g, "")
                      .replace(/\[.*?\]/g, "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 10000);
                  } else {
                    transcript = txBody
                      .replace(/<[^>]+>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 10000);
                  }
                  if (transcript.length > 100) break;
                }
              } catch (_) {
                break; // timeout or error — stop trying formats
              }
            }
          }
        }
      } catch (_) {
        // Caption extraction failed — will use AI fallback
      }

      // Also try the Innertube get_transcript endpoint with the continuation params from the page
      if (transcript.length <= 100) {
        try {
          const transcriptPanelMatch = html.match(/"engagement-panel-searchable-transcript"[\s\S]*?"params":"([^"]+)"/);
          if (transcriptPanelMatch) {
            const params = decodeURIComponent(transcriptPanelMatch[1]);
            const innertubeResp = await fetchWithTimeout("https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "X-YouTube-Client-Name": "1",
                "X-YouTube-Client-Version": "2.20240101.01.00",
                "Cookie": "CONSENT=YES+cb; PREF=f6=40000000",
              },
              body: JSON.stringify({
                context: {
                  client: {
                    clientName: "WEB",
                    clientVersion: "2.20240101.01.00",
                    hl: "en",
                    gl: "US",
                  },
                },
                params,
              }),
            }, 1500);
            if (innertubeResp.ok) {
              const innertubeData = await innertubeResp.json();
              const segments = innertubeData?.actions?.[0]?.updateEngagementPanelAction?.content
                ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
                ?.transcriptSegmentListRenderer?.initialSegments || [];
              if (segments.length > 0) {
                transcript = segments
                  .map((s: any) => s?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text || "")
                  .filter(Boolean)
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 10000);
              }
            }
          }
        } catch (_) {
          // Innertube attempt failed
        }
      }

      // If transcript still unavailable, use AI to generate rich topic content
      let aiGenerated = false;
      let quizContent = transcript;
      if (transcript.length <= 100) {
        try {
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are an educational content specialist. Given a YouTube video title and description, generate a detailed, factual content brief covering what the video discusses. Include key topics, technical details, comparisons, features, and educational points that would be covered. Write in an informative style with specific facts and details. Do not mention that this is AI-generated or that you are summarizing — just write the content directly.",
              },
              {
                role: "user",
                content: `YouTube Video Title: "${title}"\n\nDescription: ${description || "(no description available)"}\n\nGenerate a detailed educational content brief (400-600 words) covering the key topics, facts, and information that this video discusses.`,
              },
            ],
            max_tokens: 800,
            temperature: 0.3,
          });
          const generatedContent = aiResp.choices[0]?.message?.content?.trim() || "";
          if (generatedContent.length > 100) {
            quizContent = generatedContent;
            aiGenerated = true;
          }
        } catch (_) {
          // AI fallback failed — use basic metadata
        }
        if (!aiGenerated) {
          quizContent = `Video: ${title}\n\nDescription: ${description}`;
        }
      }

      return res.json({
        videoId,
        title,
        description,
        transcript,
        hasTranscript: transcript.length > 100,
        aiGenerated,
        quizContent,
      });
    } catch (err: any) {
      console.error("YouTube transcript error:", err);
      return res.status(500).json({ error: "Failed to fetch video info. Make sure the video is public." });
    }
  });

  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { text, level, questionCount, quizType } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Please provide some text to generate a quiz from" });
      }

      const validLevel = ["basic", "intermediate", "advanced"].includes(level) ? level : "intermediate";
      const count = Math.max(5, Math.min(50, parseInt(questionCount) || 10));
      const validType = ["single_choice", "multiple_choice", "true_false", "fill_blank", "short_answer"].includes(quizType) ? quizType : "single_choice";

      const difficultyMap: Record<string, string> = {
        basic: "easy recall, definitions, and basic understanding",
        intermediate: "application, analysis, and moderate reasoning",
        advanced: "critical thinking, synthesis, evaluation, and complex reasoning",
      };
      const levelLabel: Record<string, string> = {
        basic: "Basic",
        intermediate: "Intermediate",
        advanced: "Advanced",
      };

      const trimmedText = text.trim().slice(0, 3000);

      let typePrompt = "";
      let formatPrompt = "";
      if (validType === "single_choice") {
        typePrompt = "single-choice (exactly 4 options, one correct answer)";
        formatPrompt = `{"topic":"name","questions":[{"type":"single_choice","question":"text","options":["A","B","C","D"],"correctAnswer":0,"explanation":"why"}]}`;
      } else if (validType === "multiple_choice") {
        typePrompt = "multiple-choice (exactly 4 options, 2 or more correct answers)";
        formatPrompt = `{"topic":"name","questions":[{"type":"multiple_choice","question":"text","options":["A","B","C","D"],"correctAnswers":[0,2],"explanation":"why"}]}`;
      } else if (validType === "true_false") {
        typePrompt = "true/false statements";
        formatPrompt = `{"topic":"name","questions":[{"type":"true_false","question":"statement text","correctAnswer":true,"explanation":"why"}]}`;
      } else if (validType === "fill_blank") {
        typePrompt = "fill-in-the-blank (use ___ for the blank in the question)";
        formatPrompt = `{"topic":"name","questions":[{"type":"fill_blank","question":"The ___ is the powerhouse of the cell.","correctAnswer":"mitochondria","explanation":"why"}]}`;
      } else if (validType === "short_answer") {
        typePrompt = "short answer (1-2 sentence answers)";
        formatPrompt = `{"topic":"name","questions":[{"type":"short_answer","question":"question text","correctAnswer":"expected answer","explanation":"detailed explanation"}]}`;
      }

      const batchSize = Math.min(count, 15);
      const batches = Math.ceil(count / batchSize);
      const batchCounts = [];
      for (let i = 0; i < batches; i++) {
        batchCounts.push(i < batches - 1 ? batchSize : count - batchSize * (batches - 1));
      }

      const generateBatch = async (batchCount: number, batchIndex: number): Promise<any> => {
        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_completion_tokens: Math.min(4000, batchCount * 300 + 300),
          messages: [
            {
              role: "system",
              content: `You are an expert educator creating high-quality quiz questions. Generate exactly ${batchCount} ${typePrompt} questions.

DIFFICULTY: ${difficultyMap[validLevel]}
${validLevel === "basic" ? "- Test recall, definitions, key terms, and simple facts from the text" : ""}
${validLevel === "intermediate" ? "- Test understanding, application, cause-and-effect, and connections between concepts" : ""}
${validLevel === "advanced" ? "- Test deep analysis, evaluation, synthesis, edge cases, and nuanced reasoning" : ""}

QUALITY RULES:
- Each question must be clearly answerable from the provided text
- Questions must be distinct - no repetition or near-duplicates
- Explanations must be informative (2 sentences: why correct + why others wrong)
- Options must be plausible distractors (not obviously wrong)
- Cover different aspects/subtopics of the text, not just one section
${batchIndex > 0 ? "- These are additional questions - ensure they cover DIFFERENT aspects from previous batches" : ""}

OUTPUT FORMAT (JSON only, no markdown):
${formatPrompt}`
            },
            { role: "user", content: `Generate ${batchCount} quiz questions from this content:\n\n${trimmedText}` }
          ],
        });
        let rt = resp.choices[0]?.message?.content || "";
        const jm = rt.match(/\{[\s\S]*\}/);
        if (jm) rt = jm[0];
        try {
          return JSON.parse(rt);
        } catch {
          let fixed = rt;
          const ob = (fixed.match(/{/g) || []).length;
          const cb = (fixed.match(/}/g) || []).length;
          const obk = (fixed.match(/\[/g) || []).length;
          const cbk = (fixed.match(/]/g) || []).length;
          for (let i = 0; i < obk - cbk; i++) fixed += ']';
          for (let i = 0; i < ob - cb; i++) fixed += '}';
          try { return JSON.parse(fixed); } catch { return null; }
        }
      }

      const batchResults = await Promise.all(batchCounts.map((bc, i) => generateBatch(bc, i)));

      let topicName = "Quiz";
      const allQuestions: any[] = [];
      for (const batch of batchResults) {
        if (!batch) continue;
        if (batch.topic && !topicName.includes(batch.topic)) topicName = batch.topic;
        if (Array.isArray(batch.questions)) {
          allQuestions.push(...batch.questions);
        }
      }

      const validQuestions = allQuestions.filter((q: any) => {
        if (!q?.question) return false;
        if (validType === "single_choice") {
          return Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === "number";
        }
        if (validType === "multiple_choice") {
          return Array.isArray(q.options) && q.options.length === 4 && Array.isArray(q.correctAnswers);
        }
        if (validType === "true_false") {
          return typeof q.correctAnswer === "boolean";
        }
        if (validType === "fill_blank" || validType === "short_answer") {
          return typeof q.correctAnswer === "string" && q.correctAnswer.length > 0;
        }
        return false;
      });

      const sectionName = `${levelLabel[validLevel]} Level`;

      if (validQuestions.length === 0) {
        return res.json({
          topic: topicName,
          level: validLevel,
          quizType: validType,
          sections: [{ name: sectionName, questions: [{ type: validType, question: "No questions could be generated. Please try again.", options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0, explanation: "Regenerate with different text." }] }]
        });
      }

      res.json({
        topic: topicName,
        level: validLevel,
        quizType: validType,
        sections: [{ name: sectionName, questions: validQuestions }]
      });
    } catch (error: any) {
      console.error("Quiz generation error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to generate quiz" });
    }
  });

  app.post("/api/generate-essay", async (req, res) => {
    try {
      const { topic, essayType, wordCount, additionalNotes } = req.body;
      
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({ error: "Please provide an essay topic" });
      }

      const targetWords = parseInt(wordCount) || 500;
      const maxWords = targetWords + 20;
      const tokenLimit = Math.max(900, Math.round(targetWords * 1.8));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: tokenLimit,
        messages: [
          {
            role: "system",
            content: `You are an expert essay writer. Help students write well-structured essays.

Respond with ONLY a JSON object:
{
  "title": "Essay title",
  "outline": ["Introduction point", "Body paragraph 1 topic", "Body paragraph 2 topic", "Conclusion point"],
  "essay": "The full essay text with proper paragraphs",
  "wordCount": ${targetWords}
}

Essay type: ${essayType || "argumentative"}
STRICT word count requirement: Write EXACTLY ${targetWords} words. The essay MUST NOT exceed ${maxWords} words. Count carefully before finishing.

Write a well-structured, coherent essay with:
- Clear introduction with thesis statement
- Well-developed body paragraphs
- Strong conclusion
- Proper transitions between paragraphs

${additionalNotes ? `Additional notes/requirements: ${additionalNotes}` : ""}

Output ONLY valid JSON.`
          },
          { role: "user", content: `Write an essay about: ${topic.trim()}` }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      
      // Try to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, try to fix incomplete JSON
        console.log("Essay JSON parse failed, attempting recovery");
        let fixedJson = responseText;
        const openBraces = (fixedJson.match(/{/g) || []).length;
        const closeBraces = (fixedJson.match(/}/g) || []).length;
        const openBrackets = (fixedJson.match(/\[/g) || []).length;
        const closeBrackets = (fixedJson.match(/]/g) || []).length;
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += '"]';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
        
        try {
          result = JSON.parse(fixedJson);
        } catch {
          // Final fallback - extract essay content
          const essayMatch = responseText.match(/"essay"\s*:\s*"([\s\S]*?)(?:"|$)/);
          const essayText = essayMatch ? essayMatch[1].replace(/\\n/g, '\n') : responseText;
          result = {
            title: topic,
            outline: ["Introduction", "Body Paragraphs", "Conclusion"],
            essay: essayText,
            wordCount: essayText.split(/\s+/).length
          };
        }
      }
      res.json(result);
    } catch (error: any) {
      console.error("Essay generation error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to generate essay" });
    }
  });

  app.post("/api/submissions/:id/followup", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Question is required" });
      }

      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const messages: Array<{role: "user" | "assistant", content: string}> = 
        (Array.isArray(submission.messages) ? submission.messages : []) as Array<{role: "user" | "assistant", content: string}>;
      messages.push({ role: "user", content: question });

      // Build full context from aiSteps (which contains all question data)
      let questionsContext = "";
      if (Array.isArray(submission.aiSteps) && submission.aiSteps.length > 0) {
        questionsContext = submission.aiSteps.map((step: any) => {
          if (step.title && step.reasoning) {
            return `${step.title}: ${step.reasoning}${step.math ? ` (Formula: ${step.math})` : ""}`;
          }
          return "";
        }).filter(Boolean).join("\n");
      }

      const systemContext = `You are TheHighGrader, a helpful AI tutor. You just solved these problems for the student:

${questionsContext || submission.aiSolution}

Explanation: ${submission.aiExplanation || "See the solutions above."}

The student is now asking a follow-up question. Answer clearly and helpfully.

FORMATTING RULES:
- Use $...$ for inline math (e.g., $V = \\frac{1}{3}Bh$)
- Use plain text for explanations
- Do NOT use markdown code blocks or ### headers
- Keep it conversational and easy to read
- Number your steps like: Step 1:, Step 2:, etc.`;

      const chatMessages = messages.map(m => ({ 
        role: m.role, 
        content: m.content 
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 800,
        messages: [
          { role: "system", content: systemContext },
          ...chatMessages,
        ],
      });

      const assistantMessage = response.choices[0]?.message?.content || "I couldn't process that question. Please try again.";
      messages.push({ role: "assistant", content: assistantMessage });

      await storage.updateSubmission(req.params.id, { messages });

      res.json({ answer: assistantMessage, messages });
    } catch (error) {
      console.error("Follow-up error:", error);
      res.status(500).json({ error: "Failed to process follow-up question" });
    }
  });

  // ===== RAG KNOWLEDGE BASE ENDPOINTS =====
  
  // Upload knowledge content (requires teacher role)
  app.post("/api/knowledge/upload", requireTeacher, async (req, res) => {
    try {
      const validation = uploadKnowledgeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const data = validation.data;
      
      // Generate embedding for the content
      const embedding = await generateEmbedding(data.content);
      
      // Insert into database
      const result = await db.insert(knowledgeChunks).values({
        content: data.content,
        embedding,
        sourceBook: data.sourceBook,
        chapter: data.chapter || null,
        section: data.section || null,
        page: data.page || null,
        topic: data.topic,
        subtopic: data.subtopic || null,
        contentType: data.contentType,
        difficulty: data.difficulty || "intermediate",
        keywords: data.keywords || [],
        relatedFormulas: data.relatedFormulas || [],
        commonMisconceptions: data.commonMisconceptions || null,
      }).returning();

      res.json({ success: true, chunk: result[0] });
    } catch (error: any) {
      console.error("Knowledge upload error:", error);
      res.status(500).json({ error: error?.message || "Failed to upload knowledge" });
    }
  });

  // Bulk upload and chunk content
  app.post("/api/knowledge/bulk-upload", requireTeacher, async (req, res) => {
    try {
      const { content, sourceBook, chapter, section, startPage } = req.body;
      
      if (!content || !sourceBook) {
        return res.status(400).json({ error: "Content and source book are required" });
      }

      // Chunk the content intelligently
      const chunks = chunkMathContent(content, {
        chunkSize: 600,
        overlap: 100,
        preserveStructure: true,
      });

      if (chunks.length === 0) {
        return res.status(400).json({ error: "No valid chunks could be created from the content" });
      }

      // Generate embeddings for all chunks
      const texts = chunks.map(c => c.content);
      const embeddings = await generateEmbeddings(texts);

      // Insert all chunks
      const insertedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const topic = detectTopic(chunk.content);
        const difficulty = detectDifficulty(chunk.content);
        
        const result = await db.insert(knowledgeChunks).values({
          content: chunk.content,
          embedding: embeddings[i],
          sourceBook,
          chapter: chapter || null,
          section: section || null,
          page: startPage ? startPage + Math.floor(i / 3) : null,
          topic,
          subtopic: null,
          contentType: chunk.contentType,
          difficulty,
          keywords: chunk.keywords,
          relatedFormulas: chunk.relatedFormulas,
          commonMisconceptions: null,
        }).returning();
        
        insertedChunks.push(result[0]);
      }

      res.json({ 
        success: true, 
        chunksCreated: insertedChunks.length,
        chunks: insertedChunks.map(c => ({
          id: c.id,
          contentType: c.contentType,
          topic: c.topic,
          difficulty: c.difficulty,
          preview: c.content.substring(0, 100) + "...",
        })),
      });
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ error: error?.message || "Failed to bulk upload knowledge" });
    }
  });

  // Search knowledge base
  app.post("/api/knowledge/search", async (req, res) => {
    try {
      const { query, topic, contentType, difficulty, topK } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const chunks = await retrieveRelevantChunks(query, {
        topK: topK || 8,
        topic,
        contentType,
        difficulty,
      });

      res.json({
        results: chunks.map(c => ({
          id: c.chunk.id,
          content: c.chunk.content,
          sourceBook: c.chunk.sourceBook,
          chapter: c.chunk.chapter,
          section: c.chunk.section,
          page: c.chunk.page,
          topic: c.chunk.topic,
          contentType: c.chunk.contentType,
          difficulty: c.chunk.difficulty,
          similarity: c.similarity,
          citation: c.citation,
          keywords: c.chunk.keywords,
          relatedFormulas: c.chunk.relatedFormulas,
        })),
      });
    } catch (error: any) {
      console.error("Knowledge search error:", error);
      res.status(500).json({ error: error?.message || "Failed to search knowledge" });
    }
  });

  // Get knowledge base stats
  app.get("/api/knowledge/stats", async (req, res) => {
    try {
      const stats = await getKnowledgeStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Knowledge stats error:", error);
      res.status(500).json({ error: error?.message || "Failed to get knowledge stats" });
    }
  });

  // Process local calculus PDF materials (admin endpoint)
  app.post("/api/knowledge/process-calculus-materials", requireTeacher, async (req, res) => {
    try {
      const CALCULUS_MATERIALS = [
        { filename: "mitres_18_001_f17_guide_ch14_1769095294279.pdf", sourceBook: "Strang's Calculus (MIT OCW)", chapter: "14", section: "Double Integrals", startPage: 526 },
        { filename: "mitres_18_001_f17_guide_ch15_1769095294291.pdf", sourceBook: "Strang's Calculus (MIT OCW)", chapter: "15", section: "Vector Calculus", startPage: 554 },
        { filename: "mitres_18_001_f17_manual_ch05_1769095294291.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "5", section: "Integrals", startPage: 181 },
        { filename: "mitres_18_001_f17_manual_ch06_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "6", section: "Exponentials and Logarithms", startPage: 234 },
        { filename: "mitres_18_001_f17_manual_ch07_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "7", section: "Integration Techniques", startPage: 287 },
        { filename: "mitres_18_001_f17_manual_ch08_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "8", section: "Applications of the Integral", startPage: 318 },
        { filename: "mitres_18_001_f17_manual_ch09_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "9", section: "Polar Coordinates", startPage: 350 },
        { filename: "mitres_18_001_f17_manual_ch10_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "10", section: "Infinite Series", startPage: 373 },
        { filename: "mitres_18_001_f17_manual_ch11_1769095294292.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "11", section: "Vectors and Matrices", startPage: 405 },
        { filename: "mitres_18_001_f17_manual_ch12_1769095294293.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "12", section: "Motion Along a Curve", startPage: 452 },
        { filename: "mitres_18_001_f17_manual_ch13_1769095294293.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "13", section: "Partial Derivatives", startPage: 475 },
        { filename: "mitres_18_001_f17_manual_ch14_1769095294293.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "14", section: "Multiple Integrals", startPage: 526 },
        { filename: "mitres_18_001_f17_manual_ch15_1769095294293.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "15", section: "Vector Calculus", startPage: 554 },
        { filename: "mitres_18_001_f17_manual_ch16_1769095294293.pdf", sourceBook: "Strang's Calculus Solutions (MIT OCW)", chapter: "16", section: "Linear Algebra", startPage: 602 },
      ];

      const results: any[] = [];
      let totalChunks = 0;

      for (const material of CALCULUS_MATERIALS) {
        const filePath = path.join(process.cwd(), "attached_assets", material.filename);
        
        if (!fs.existsSync(filePath)) {
          results.push({ file: material.filename, status: "not_found" });
          continue;
        }

        try {
          const buffer = fs.readFileSync(filePath);
          const uint8Array = new Uint8Array(buffer);
          const PDFParseClass = await getPDFParse();
          const pdfParser = new PDFParseClass(uint8Array);
          const pdfResult = await pdfParser.getText();
          const content = pdfResult.text?.trim().replace(/\n*-- \d+ of \d+ --\n*/g, '').trim() || "";

          if (content.length < 200) {
            results.push({ file: material.filename, status: "insufficient_content", chars: content.length });
            continue;
          }

          const chunks = chunkMathContent(content, {
            chunkSize: 600,
            overlap: 100,
            preserveStructure: true,
          });

          if (chunks.length === 0) {
            results.push({ file: material.filename, status: "no_chunks" });
            continue;
          }

          const texts = chunks.map(c => c.content);
          const embeddings = await generateEmbeddings(texts);

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const topic = detectTopic(chunk.content);
            const difficulty = detectDifficulty(chunk.content);
            
            await db.insert(knowledgeChunks).values({
              content: chunk.content,
              embedding: embeddings[i],
              sourceBook: material.sourceBook,
              chapter: material.chapter,
              section: material.section,
              page: material.startPage + Math.floor(i / 3),
              topic,
              subtopic: null,
              contentType: chunk.contentType,
              difficulty,
              keywords: chunk.keywords,
              relatedFormulas: chunk.relatedFormulas,
              commonMisconceptions: null,
            });
          }

          totalChunks += chunks.length;
          results.push({ 
            file: material.filename, 
            status: "success", 
            chunksCreated: chunks.length,
            chapter: material.chapter,
            section: material.section 
          });
        } catch (error: any) {
          results.push({ file: material.filename, status: "error", error: error.message });
        }
      }

      res.json({ 
        success: true, 
        totalChunksCreated: totalChunks,
        results 
      });
    } catch (error: any) {
      console.error("Process calculus materials error:", error);
      res.status(500).json({ error: error?.message || "Failed to process calculus materials" });
    }
  });

  // RAG-enhanced solve endpoint
  app.post("/api/solve-with-rag", async (req, res) => {
    try {
      const { problem, topic, difficulty, explanationFormat } = req.body;
      
      if (!problem) {
        return res.status(400).json({ error: "Problem is required" });
      }

      // Retrieve relevant knowledge chunks
      const retrievedChunks = await retrieveRelevantChunks(problem, {
        topK: 10,
        topic,
        difficulty,
      });

      const hasContext = retrievedChunks.length > 0;
      const ragContext = hasContext ? formatContextForAI(retrievedChunks) : "";

      // Build the prompt with RAG context
      const formatInstructions = {
        beginner: "Explain in simple, beginner-friendly language. Use everyday analogies and avoid jargon. Break down each step thoroughly.",
        "exam-oriented": "Provide a structured, exam-ready solution. Focus on the method that would score full marks. Include key formulas to memorize.",
        "step-by-step": "Give a detailed step-by-step breakdown with clear reasoning for each step. Show all intermediate calculations.",
      };

      const format = explanationFormat || "step-by-step";
      
      const systemPrompt = `You are an intelligent mathematics tutor with access to a comprehensive knowledge base of math textbooks.

${ragContext}

YOUR TASK: Solve the given problem by:
1. Analyzing what mathematical concepts are needed
2. Using the textbook knowledge provided above when relevant
3. Providing a clear, step-by-step solution with citations

EXPLANATION STYLE: ${formatInstructions[format as keyof typeof formatInstructions] || formatInstructions["step-by-step"]}

OUTPUT FORMAT (JSON):
{
  "solution": "The final answer clearly stated",
  "steps": [
    {
      "title": "Step 1: Identify the approach",
      "math": "Mathematical work shown here",
      "reasoning": "Explanation of why this step is taken"
    }
  ],
  "explanation": "Intuitive explanation of the overall solution",
  "problemType": "math|science|other",
  "references": [
    {
      "source": "Book name, Chapter X, Section Y",
      "relevance": "How this source helped"
    }
  ],
  "misconceptions": ["Common mistakes to avoid"],
  "graphSpec": {
    "expressions": ["y=x^2"],
    "title": "Graph title if needed"
  }
}

RULES:
- Cite textbook sources for formulas and theorems when available
- Show ALL mathematical steps clearly
- Verify your answer when possible
- Include intuitive explanations
- Note common misconceptions if relevant

Output ONLY valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Solve this problem: ${problem}` }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      
      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }

      const result = JSON.parse(responseText);
      
      // Add RAG metadata
      result.ragMetadata = {
        chunksUsed: retrievedChunks.length,
        sources: retrievedChunks.map(c => ({
          citation: c.citation,
          topic: c.chunk.topic,
          contentType: c.chunk.contentType,
          similarity: c.similarity,
        })),
      };

      res.json(result);
    } catch (error: any) {
      console.error("RAG solve error:", error);
      res.status(500).json({ error: error?.message || "Failed to solve with RAG" });
    }
  });

  const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/extract-text", docUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const mime = req.file.mimetype || "";
      const fileName = req.file.originalname || "file";
      const buffer = req.file.buffer;

      const ext = fileName.toLowerCase().split(".").pop() || "";

      if (mime === "application/pdf" || ext === "pdf") {
        try {
          const PDFParseClass = await getPDFParse();
          const uint8 = new Uint8Array(buffer);
          const parser = new PDFParseClass(uint8);
          const pdfResult = await parser.getText();
          const text = pdfResult.text?.trim().replace(/\n*-- \d+ of \d+ --\n*/g, "").trim();
          if (!text) {
            return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
          }
          return res.json({ text, fileName });
        } catch (e: any) {
          console.error("PDF extraction error:", e?.message);
          return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
        }
      }

      if (mime === "application/msword" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "doc" || ext === "docx") {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          const text = result.value?.trim();
          if (!text) {
            return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
          }
          return res.json({ text, fileName });
        } catch (e: any) {
          console.error("DOCX extraction error:", e?.message);
          return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
        }
      }

      if (mime.startsWith("text/") || mime === "application/json" || mime === "application/xml" || ["txt", "md", "csv", "json", "xml", "rtf"].includes(ext)) {
        const text = buffer.toString("utf-8").trim();
        if (!text) {
          return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
        }
        return res.json({ text, fileName });
      }

      const textAttempt = buffer.toString("utf-8").trim();
      const printable = textAttempt.replace(/[^\x20-\x7E\n\r\t]/g, "");
      if (printable.length > textAttempt.length * 0.7 && printable.length > 10) {
        return res.json({ text: printable, fileName });
      }

      return res.json({ text: "", fileName, notice: "File uploaded but no readable content found." });
    } catch (error: any) {
      console.error("Extract text error:", error);
      res.status(500).json({ error: "Failed to process file." });
    }
  });

  // Multer configuration for audio uploads
  const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  });

  // Audio transcription endpoint
  app.post("/api/transcribe", audioUpload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      // Validate mimetype
      const allowedMimeTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a"];
      const mimeType = req.file.mimetype || "audio/webm";
      if (!allowedMimeTypes.some(t => mimeType.includes(t.split("/")[1]))) {
        console.warn("Unusual audio mimetype:", mimeType);
      }

      console.log("Transcribing audio, size:", req.file.size, "type:", mimeType);

      // Use Blob for Node.js compatibility (File may not be available)
      const audioBlob = new Blob([new Uint8Array(req.file.buffer)], { type: mimeType });
      
      // Create a File-like object that OpenAI SDK accepts
      const audioFile = Object.assign(audioBlob, {
        name: "audio.webm",
        lastModified: Date.now(),
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile as any,
        model: "gpt-4o-mini-transcribe",
        language: "en",
      });

      console.log("Transcription complete, length:", transcription.text.length);

      res.json({ text: transcription.text });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: error?.message || "Transcription failed" });
    }
  });

  // Generate notes from transcript - streaming
  app.post("/api/generate-notes", async (req, res) => {
    try {
      const { transcript } = req.body;

      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "Transcript is required" });
      }

      console.log("Generating notes from transcript, length:", transcript.length);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert note-taker and study guide creator. Transform lecture transcripts into well-organized, comprehensive study notes.

Your notes should include:
1. MAIN TOPICS - Clear headings for major concepts covered
2. KEY POINTS - Bullet points summarizing important information
3. DEFINITIONS - Any terms or concepts defined in the lecture
4. EXAMPLES - Important examples mentioned
5. FORMULAS/EQUATIONS - Any mathematical formulas (if applicable)
6. SUMMARY - A brief summary at the end

Format the notes in a clean, readable way that students can use for studying.
Use clear section headers and organize information logically.
Do NOT use markdown formatting - use plain text with clear structure.`,
          },
          {
            role: "user",
            content: `Please create comprehensive study notes from this lecture transcript:\n\n${transcript}`,
          },
        ],
        max_completion_tokens: 600,
      });

      const notes = completion.choices[0]?.message?.content || "";
      res.json({ notes });
    } catch (error: any) {
      console.error("Note generation error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate notes" });
    }
  });

  // ===================== RUBRIC EVALUATION SYSTEM =====================

  // Create a rubric with criteria
  app.post("/api/rubrics", requireAuth, requireTeacher, async (req, res) => {
    try {
      const parsed = createRubricSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const { name, subject, criteria } = parsed.data;
      const { gradeLevel, assignmentType, studentInstructions, estimatedTime, description, classId } = req.body;
      const totalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

      // Verify class ownership if classId provided
      if (classId) {
        const cls = await storage.getClass(classId);
        if (!cls || cls.teacherId !== req.session.userId) {
          return res.status(403).json({ error: "Forbidden: class not found or not yours" });
        }
      }

      const rubric = await storage.createRubric({
        teacherId: req.session.userId!,
        classId: classId || null,
        name,
        subject,
        totalPoints,
        gradeLevel: gradeLevel || null,
        assignmentType: assignmentType || null,
        studentInstructions: studentInstructions || null,
        estimatedTime: estimatedTime || null,
        description: description || null,
      });

      const criteriaData = criteria.map((c, i) => ({
        rubricId: rubric.id,
        name: c.name,
        description: c.description,
        maxPoints: c.maxPoints,
        orderIndex: i,
      }));

      const createdCriteria = await storage.createCriteria(criteriaData);
      res.status(201).json({ ...rubric, criteria: createdCriteria });
    } catch (error: any) {
      console.error("Create rubric error:", error);
      res.status(500).json({ error: "Failed to create rubric" });
    }
  });

  // Get all rubrics for teacher, optionally filtered by classId
  app.get("/api/rubrics", requireAuth, requireTeacher, async (req, res) => {
    try {
      const classId = req.query.classId as string | undefined;
      const myRubrics = await storage.getRubricsByTeacher(req.session.userId!, classId);
      const result = await Promise.all(myRubrics.map(async (r) => {
        const criteria = await storage.getCriteriaByRubric(r.id);
        return { ...r, criteria };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rubrics" });
    }
  });

  // Get single rubric with criteria
  app.get("/api/rubrics/:id", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubric = await storage.getRubric(req.params.id);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const criteria = await storage.getCriteriaByRubric(rubric.id);
      res.json({ ...rubric, criteria });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rubric" });
    }
  });

  // Delete rubric
  app.delete("/api/rubrics/:id", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubric = await storage.getRubric(req.params.id);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteRubric(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rubric" });
    }
  });

  // Add submission to a rubric
  app.post("/api/rubric-submissions", requireAuth, requireTeacher, async (req, res) => {
    try {
      const parsed = addSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      // Verify rubric belongs to this teacher
      const rubric = await storage.getRubric(parsed.data.rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });

      const sub = await storage.createRubricSubmission({
        ...parsed.data,
        teacherId: req.session.userId!,
      });
      res.status(201).json(sub);
    } catch (error) {
      res.status(500).json({ error: "Failed to add submission" });
    }
  });

  // Get submissions for a rubric
  app.get("/api/rubric-submissions/:rubricId", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubric = await storage.getRubric(req.params.rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const subs = await storage.getRubricSubmissionsByRubric(req.params.rubricId);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Evaluate a single submission against rubric
  app.post("/api/rubric-evaluate/:submissionId", requireAuth, requireTeacher, async (req, res) => {
    try {
      const submission = await storage.getRubricSubmission(req.params.submissionId);
      if (!submission) return res.status(404).json({ error: "Submission not found" });

      const rubric = await storage.getRubric(submission.rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });

      const criteria = await storage.getCriteriaByRubric(rubric.id);
      if (criteria.length === 0) return res.status(400).json({ error: "Rubric has no criteria" });

      const criteriaPrompt = criteria.map((c, i) => 
        `${i + 1}. "${c.name}" (max ${c.maxPoints} points): ${c.description}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 800,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a strict academic evaluator. You MUST evaluate student work ONLY using the provided rubric criteria. Do NOT add extra criteria. Score each criterion from 0 to its max points.

RUBRIC CRITERIA:
${criteriaPrompt}

Respond with ONLY valid JSON:
{
  "criteriaScores": [
    {"criterionId": "ID", "criterionName": "NAME", "score": NUMBER, "maxPoints": NUMBER, "feedback": "Brief feedback"}
  ],
  "overallFeedback": "Summary feedback"
}

RULES:
- Each criterion score MUST be between 0 and its maxPoints
- Evaluate STRICTLY based on rubric descriptions
- Be fair but rigorous
- Output ONLY valid JSON`
          },
          {
            role: "user",
            content: `Student: ${submission.studentName}\nTitle: ${submission.title}\n\nSubmission:\n${submission.content}`
          }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) responseText = jsonMatch[0];

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        return res.status(500).json({ error: "AI returned invalid response, please try again" });
      }

      const criteriaScores = criteria.map((c) => {
        const aiScore = parsed.criteriaScores?.find((s: any) => 
          s.criterionName === c.name || s.criterionId === c.id
        );
        return {
          criterionId: c.id,
          criterionName: c.name,
          score: Math.min(aiScore?.score ?? 0, c.maxPoints),
          maxPoints: c.maxPoints,
          feedback: aiScore?.feedback || "No feedback",
        };
      });

      const overallScore = criteriaScores.reduce((sum, s) => sum + s.score, 0);

      const evaluation = await storage.createRubricEvaluation({
        submissionId: submission.id,
        rubricId: rubric.id,
        teacherId: req.session.userId!,
        overallScore,
        overallFeedback: parsed.overallFeedback || "Evaluation complete",
        criteriaScores,
      });

      res.json(evaluation);
    } catch (error: any) {
      console.error("Rubric evaluate error:", error);
      res.status(500).json({ error: "Failed to evaluate submission" });
    }
  });

  // Batch evaluate multiple submissions
  app.post("/api/rubric-evaluate-batch", requireAuth, requireTeacher, async (req, res) => {
    try {
      const parsed = batchEvaluateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid data" });
      }

      const results = [];
      for (const subId of parsed.data.submissionIds) {
        try {
          const evalRes = await new Promise<any>((resolve, reject) => {
            const mockReq = { params: { submissionId: subId }, session: req.session } as any;
            const mockRes = {
              json: (data: any) => resolve(data),
              status: (code: number) => ({ json: (data: any) => reject(new Error(data.error)) }),
            } as any;
            // Re-use the single evaluate logic inline
            (async () => {
              const submission = await storage.getRubricSubmission(subId);
              if (!submission) { resolve({ submissionId: subId, error: "Not found" }); return; }
              const rubric = await storage.getRubric(submission.rubricId);
              if (!rubric) { resolve({ submissionId: subId, error: "Rubric not found" }); return; }
              if (rubric.teacherId !== req.session.userId) { resolve({ submissionId: subId, error: "Forbidden" }); return; }
              const criteria = await storage.getCriteriaByRubric(rubric.id);

              const criteriaPrompt = criteria.map((c, i) => 
                `${i + 1}. "${c.name}" (max ${c.maxPoints} points): ${c.description}`
              ).join("\n");

              const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                max_completion_tokens: 800,
                temperature: 0,
                messages: [
                  {
                    role: "system",
                    content: `You are a strict academic evaluator. Evaluate ONLY using the rubric criteria. Score each criterion from 0 to its max points.

RUBRIC CRITERIA:
${criteriaPrompt}

Respond with ONLY valid JSON:
{"criteriaScores":[{"criterionId":"ID","criterionName":"NAME","score":NUMBER,"maxPoints":NUMBER,"feedback":"Brief feedback"}],"overallFeedback":"Summary"}

RULES: Each score MUST be 0 to maxPoints. Evaluate strictly. Output ONLY JSON.`
                  },
                  { role: "user", content: `Student: ${submission.studentName}\nTitle: ${submission.title}\n\n${submission.content}` }
                ],
              });

              let text = response.choices[0]?.message?.content || "";
              const jm = text.match(/\{[\s\S]*\}/);
              if (jm) text = jm[0];
              let aiResult: any;
              try {
                aiResult = JSON.parse(text);
              } catch {
                resolve({ submissionId: subId, error: "AI response was not valid JSON" });
                return;
              }

              const criteriaScores = criteria.map((c) => {
                const s = aiResult.criteriaScores?.find((x: any) => x.criterionName === c.name || x.criterionId === c.id);
                return { criterionId: c.id, criterionName: c.name, score: Math.min(s?.score ?? 0, c.maxPoints), maxPoints: c.maxPoints, feedback: s?.feedback || "No feedback" };
              });
              const overallScore = criteriaScores.reduce((sum, s) => sum + s.score, 0);

              const evaluation = await storage.createRubricEvaluation({
                submissionId: submission.id, rubricId: rubric.id, teacherId: req.session.userId!,
                overallScore, overallFeedback: aiResult.overallFeedback || "Evaluation complete", criteriaScores,
              });
              resolve(evaluation);
            })();
          });
          results.push(evalRes);
        } catch (err: any) {
          results.push({ submissionId: subId, error: err.message });
        }
      }

      res.json({ results, evaluated: results.filter((r: any) => !r.error).length, total: parsed.data.submissionIds.length });
    } catch (error) {
      res.status(500).json({ error: "Batch evaluation failed" });
    }
  });

  // Get evaluation history for a rubric (spreadsheet data)
  app.get("/api/rubric-evaluations/:rubricId", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubric = await storage.getRubric(req.params.rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const evals = await storage.getRubricEvaluationsByRubric(req.params.rubricId);
      const subs = await storage.getRubricSubmissionsByRubric(req.params.rubricId);
      const criteria = await storage.getCriteriaByRubric(req.params.rubricId);

      const history = evals.map(ev => {
        const sub = subs.find(s => s.id === ev.submissionId);
        return {
          ...ev,
          studentName: sub?.studentName || "Unknown",
          submissionTitle: sub?.title || "Untitled",
          submittedAt: sub?.submittedAt,
        };
      });

      res.json({ history, criteria });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation history" });
    }
  });

  // Get all evaluations for teacher (across all rubrics)
  app.get("/api/rubric-evaluations", requireAuth, requireTeacher, async (req, res) => {
    try {
      const evals = await storage.getRubricEvaluationsByTeacher(req.session.userId!);
      res.json(evals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluations" });
    }
  });

  // Publish a rubric/assignment
  app.patch("/api/rubrics/:id/publish", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubric = await storage.getRubric(req.params.id);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      if (!rubric.classId) return res.status(400).json({ error: "Assignment must be assigned to a class before publishing" });
      const updated = await storage.publishRubric(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to publish rubric" });
    }
  });

  // Get all student submissions for a rubric (teacher view) with evaluation
  app.get("/api/teacher/rubric-submissions", requireAuth, requireTeacher, async (req, res) => {
    try {
      const rubricId = req.query.rubricId as string;
      if (!rubricId) return res.status(400).json({ error: "rubricId is required" });
      const rubric = await storage.getRubric(rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const subs = await storage.getRubricSubmissionsByRubric(rubricId);
      const result = await Promise.all(subs.map(async (sub) => {
        const evaluation = await storage.getRubricEvaluationBySubmission(sub.id);
        let studentUser = null;
        if (sub.studentId) {
          studentUser = await storage.getUser(sub.studentId);
        }
        return { ...sub, evaluation: evaluation || null, studentDisplayName: studentUser?.displayName || sub.studentName };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Push evaluation to student
  app.patch("/api/teacher/rubric-submissions/:id/push", requireAuth, requireTeacher, async (req, res) => {
    try {
      const submission = await storage.getRubricSubmission(req.params.id);
      if (!submission) return res.status(404).json({ error: "Submission not found" });
      const rubric = await storage.getRubric(submission.rubricId);
      if (!rubric || rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const evaluation = await storage.getRubricEvaluationBySubmission(submission.id);
      if (!evaluation) return res.status(400).json({ error: "No evaluation to push" });
      await storage.pushRubricEvaluation(submission.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to push evaluation" });
    }
  });

  // Re-evaluate a submission (teacher)
  app.post("/api/teacher/rubric-submissions/:id/reevaluate", requireAuth, requireTeacher, async (req, res) => {
    try {
      const submission = await storage.getRubricSubmission(req.params.id);
      if (!submission) return res.status(404).json({ error: "Submission not found" });
      const rubric = await storage.getRubric(submission.rubricId);
      if (!rubric) return res.status(404).json({ error: "Rubric not found" });
      if (rubric.teacherId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const criteria = await storage.getCriteriaByRubric(rubric.id);
      if (criteria.length === 0) return res.status(400).json({ error: "Rubric has no criteria" });

      const criteriaPrompt = criteria.map((c, i) =>
        `${i + 1}. "${c.name}" (max ${c.maxPoints} points): ${c.description}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 800,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a strict academic evaluator. Evaluate ONLY using the rubric criteria. Score each criterion from 0 to its max points.

RUBRIC CRITERIA:
${criteriaPrompt}

Respond with ONLY valid JSON:
{"criteriaScores":[{"criterionId":"ID","criterionName":"NAME","score":NUMBER,"maxPoints":NUMBER,"feedback":"Brief feedback"}],"overallFeedback":"Summary"}

RULES: Each score MUST be 0 to maxPoints. Output ONLY JSON.`
          },
          { role: "user", content: `Student: ${submission.studentName}\nTitle: ${submission.title}\n\n${submission.content}` }
        ],
      });

      let text = response.choices[0]?.message?.content || "";
      const jm = text.match(/\{[\s\S]*\}/);
      if (jm) text = jm[0];
      let parsed: any;
      try { parsed = JSON.parse(text); } catch {
        return res.status(500).json({ error: "AI returned invalid response" });
      }

      const criteriaScores = criteria.map((c) => {
        const s = parsed.criteriaScores?.find((x: any) => x.criterionName === c.name || x.criterionId === c.id);
        return { criterionId: c.id, criterionName: c.name, score: Math.min(s?.score ?? 0, c.maxPoints), maxPoints: c.maxPoints, feedback: s?.feedback || "No feedback" };
      });
      const overallScore = criteriaScores.reduce((sum, s) => sum + s.score, 0);

      // Update or create evaluation
      const existing = await storage.getRubricEvaluationBySubmission(submission.id);
      let evaluation;
      if (existing) {
        evaluation = await storage.updateRubricEvaluation(existing.id, {
          overallScore,
          overallFeedback: parsed.overallFeedback || "Re-evaluation complete",
          criteriaScores,
          clearPushedAt: true,
        });
        await storage.updateRubricSubmissionStatus(submission.id, "ai_evaluated");
      } else {
        evaluation = await storage.createRubricEvaluation({
          submissionId: submission.id,
          rubricId: rubric.id,
          teacherId: req.session.userId!,
          overallScore,
          overallFeedback: parsed.overallFeedback || "Evaluation complete",
          criteriaScores,
        });
      }

      res.json(evaluation);
    } catch (error: any) {
      console.error("Re-evaluate error:", error);
      res.status(500).json({ error: "Failed to re-evaluate submission" });
    }
  });

  /* ── Student Assignment Routes ─────────────────────────────────── */

  // Get published assignments for all classes the student has joined
  app.get("/api/student/assignments", requireAuth, requireStudent, async (req, res) => {
    try {
      const studentClasses = await storage.getClassesForStudent(req.session.userId!);
      const classIds = studentClasses.map(c => c.id);
      const publishedRubrics = await storage.getPublishedRubricsForClasses(classIds);

      const result = await Promise.all(publishedRubrics.map(async (rubric) => {
        const criteria = await storage.getCriteriaByRubric(rubric.id);
        const submission = await storage.getRubricSubmissionByStudentAndRubric(req.session.userId!, rubric.id);
        let evaluation = null;
        if (submission) {
          evaluation = await storage.getRubricEvaluationBySubmission(submission.id);
        }
        const cls = studentClasses.find(c => c.id === rubric.classId);
        return {
          ...rubric,
          criteria,
          className: cls?.name || null,
          submission: submission || null,
          evaluation: evaluation && submission?.status === "pushed" ? evaluation : null,
        };
      }));

      res.json(result);
    } catch (error) {
      console.error("Student assignments error:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Student submits answer for an assignment
  app.post("/api/student/assignments/:rubricId/submit", requireAuth, requireStudent, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: "Answer content is required" });

      const rubric = await storage.getRubric(req.params.rubricId);
      if (!rubric) return res.status(404).json({ error: "Assignment not found" });
      if (rubric.status !== "published") return res.status(400).json({ error: "Assignment is not published" });

      // Check student is in the class
      const studentClasses = await storage.getClassesForStudent(req.session.userId!);
      const classIds = studentClasses.map(c => c.id);
      if (rubric.classId && !classIds.includes(rubric.classId)) {
        return res.status(403).json({ error: "You are not in this class" });
      }

      // Check for existing submission
      const existing = await storage.getRubricSubmissionByStudentAndRubric(req.session.userId!, rubric.id);
      if (existing) return res.status(400).json({ error: "You have already submitted this assignment" });

      const studentUser = await storage.getUser(req.session.userId!);
      const submission = await storage.createRubricSubmission({
        rubricId: rubric.id,
        teacherId: rubric.teacherId,
        studentId: req.session.userId!,
        studentName: studentUser?.displayName || "Student",
        title: rubric.name,
        content: content.trim(),
      });

      // Auto-evaluate using AI
      const criteria = await storage.getCriteriaByRubric(rubric.id);
      if (criteria.length > 0) {
        try {
          const criteriaPrompt = criteria.map((c, i) =>
            `${i + 1}. "${c.name}" (max ${c.maxPoints} points): ${c.description}`
          ).join("\n");

          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_completion_tokens: 800,
            messages: [
              {
                role: "system",
                content: `You are a strict academic evaluator. Evaluate ONLY using the rubric criteria. Score each criterion from 0 to its max points.

RUBRIC CRITERIA:
${criteriaPrompt}

Respond with ONLY valid JSON:
{"criteriaScores":[{"criterionId":"ID","criterionName":"NAME","score":NUMBER,"maxPoints":NUMBER,"feedback":"Brief feedback"}],"overallFeedback":"Summary"}

RULES: Each score MUST be 0 to maxPoints. Output ONLY JSON.`
              },
              { role: "user", content: `Student: ${studentUser?.displayName || "Student"}\nTitle: ${rubric.name}\n\n${content.trim()}` }
            ],
          });

          let text = response.choices[0]?.message?.content || "";
          const jm = text.match(/\{[\s\S]*\}/);
          if (jm) text = jm[0];
          let parsed: any;
          try { parsed = JSON.parse(text); } catch { parsed = null; }

          if (parsed) {
            const criteriaScores = criteria.map((c) => {
              const s = parsed.criteriaScores?.find((x: any) => x.criterionName === c.name || x.criterionId === c.id);
              return { criterionId: c.id, criterionName: c.name, score: Math.min(s?.score ?? 0, c.maxPoints), maxPoints: c.maxPoints, feedback: s?.feedback || "No feedback" };
            });
            const overallScore = criteriaScores.reduce((sum, s) => sum + s.score, 0);

            await storage.createRubricEvaluation({
              submissionId: submission.id,
              rubricId: rubric.id,
              teacherId: rubric.teacherId,
              overallScore,
              overallFeedback: parsed.overallFeedback || "Evaluation complete",
              criteriaScores,
            });
          }
        } catch (aiErr) {
          console.error("AI evaluation error after student submit:", aiErr);
        }
      }

      res.status(201).json(submission);
    } catch (error: any) {
      console.error("Student submit error:", error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // Get student's result for a specific assignment (only if pushed)
  app.get("/api/student/assignments/:rubricId/result", requireAuth, requireStudent, async (req, res) => {
    try {
      const submission = await storage.getRubricSubmissionByStudentAndRubric(req.session.userId!, req.params.rubricId);
      if (!submission) return res.status(404).json({ error: "No submission found" });
      if (submission.status !== "pushed") return res.status(400).json({ error: "Result not yet available" });
      const evaluation = await storage.getRubricEvaluationBySubmission(submission.id);
      res.json({ submission, evaluation });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch result" });
    }
  });

  app.post("/api/quick-evaluate", requireAuth, requireTeacher, async (req, res) => {
    try {
      const { criteria, studentName, content, classId } = req.body;

      // If classId provided, verify ownership
      if (classId) {
        const cls = await storage.getClass(classId);
        if (!cls || cls.teacherId !== req.session.userId) {
          return res.status(403).json({ error: "Forbidden: class not found or not yours" });
        }
      }

      if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        return res.status(400).json({ error: "Please add at least one criterion" });
      }
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Please provide student work to evaluate" });
      }

      const validCriteria = criteria.filter((c: any) => c.name && c.maxPoints > 0);
      if (validCriteria.length === 0) {
        return res.status(400).json({ error: "Each criterion needs a name and points" });
      }

      const criteriaPrompt = validCriteria.map((c: any, i: number) =>
        `${i + 1}. "${c.name}" (max ${c.maxPoints} pts)${c.description ? `: ${c.description}` : ""}`
      ).join("\n");

      const totalMaxPoints = validCriteria.reduce((s: number, c: any) => s + c.maxPoints, 0);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 1500,
        messages: [
          {
            role: "system",
            content: `You are an academic evaluator. Evaluate student work against these criteria:
${criteriaPrompt}

Respond with ONLY valid JSON (no markdown):
{"scores":[{"name":"CRITERION_NAME","score":NUMBER,"maxPoints":NUMBER,"feedback":"1-2 sentence feedback"}],"overallScore":NUMBER,"totalMaxPoints":${totalMaxPoints},"summary":"2-3 sentence summary of the document","strengths":["strength 1","strength 2"],"weaknesses":["weakness 1","weakness 2"],"suggestions":["suggestion 1","suggestion 2"]}`
          },
          {
            role: "user",
            content: `${studentName ? `Student: ${studentName}\n` : ""}Work:\n${content.trim().slice(0, 4000)}`
          }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) responseText = jsonMatch[0];

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        return res.status(500).json({ error: "AI returned invalid response, please try again" });
      }

      const scores = validCriteria.map((c: any) => {
        const aiScore = parsed.scores?.find((s: any) =>
          s.name?.toLowerCase() === c.name.toLowerCase()
        ) || parsed.scores?.find((_s: any, i: number) =>
          i === validCriteria.indexOf(c)
        );
        return {
          name: c.name,
          score: Math.min(aiScore?.score ?? 0, c.maxPoints),
          maxPoints: c.maxPoints,
          feedback: aiScore?.feedback || "No feedback",
        };
      });

      const overallScore = scores.reduce((s: number, c: any) => s + c.score, 0);

      res.json({
        scores,
        overallScore,
        totalMaxPoints,
        summary: parsed.summary || "Evaluation complete.",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        studentName: studentName || "Student",
        evaluatedAt: new Date().toISOString(),
        classId: classId || null,
      });
    } catch (error: any) {
      console.error("Quick evaluate error:", error);
      res.status(500).json({ error: "Failed to evaluate. Please try again." });
    }
  });

  /* ── AI Assignment Generator ───────────────────────────────────── */
  app.post("/api/generate-assignment", requireAuth, requireTeacher, async (req, res) => {
    try {
      const { topic, subject, gradeLevel, assignmentType, additionalInstructions = "" } = req.body;
      if (!topic || !subject || !gradeLevel || !assignmentType) {
        return res.status(400).json({ error: "Topic, subject, grade level, and assignment type are required" });
      }

      const assignmentTypeGuide: Record<string, string> = {
        "Essay": "Write the actual essay PROMPT/QUESTION the student must answer. Include: the specific question or thesis to argue, required length (word count), structural requirements (intro, body paragraphs, conclusion), and any source requirements.",
        "Research Paper": "Write the specific research question or topic the student must investigate. Include: thesis guidance, required number of sources, citation style (APA/MLA), section structure, and minimum page count.",
        "Lab Report": "Write the full experiment setup: hypothesis to test, materials list, step-by-step procedure, data table templates the student must fill in, and what to include in their analysis and conclusion.",
        "Short Answer": "Write 6-10 actual short-answer questions the student must answer. Number each question. Make them specific, thought-provoking, and directly tied to the topic. Each question should require 2-5 sentences to answer.",
        "Multiple Choice Quiz": "Write 10 actual multiple choice questions for STUDENTS, each with 4 options labeled A, B, C, D. Do NOT reveal or mark the correct answer in the student instructions — students must figure out the answer themselves. The correct answers should only appear in the grading criteria, not in the questions.",
        "Creative Writing": "Write the specific creative writing prompt including: the scenario or starting line, genre requirements, required length, any character or setting constraints, and what elements must be included.",
        "Math Problem Set": "Write 8-12 actual numbered math problems the student must solve. Start with simpler problems and increase in difficulty. Show the exact equations, numbers, and what to calculate. Do NOT describe problems — write the actual math.",
        "Presentation": "Write the specific presentation topic and requirements: number of slides, time limit, required sections (intro, main points, conclusion), visual requirements, and the specific argument or information to cover.",
        "Case Study": "Write the actual case study scenario in detail: the situation, relevant background data/facts, the specific questions the student must analyze and answer, and what decisions or recommendations they must make.",
        "Book Report": "Write the specific book analysis requirements: which aspects to analyze (plot, characters, themes, writing style), required length, specific discussion questions to address, and how to structure the report.",
        "Project": "Write the full project brief: the specific deliverable, step-by-step requirements, materials or resources needed, timeline/milestones, and what the final submission must include.",
        "Debate": "Write the specific debate proposition (e.g., 'This house believes that...'). Include: which side to argue, required argument structure, evidence requirements, rebuttal expectations, and format (written or oral).",
      };

      const contentGuide = assignmentTypeGuide[assignmentType] || "Write the actual assignment content — specific questions, problems, or prompts the student must respond to directly.";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 2500,
        messages: [
          {
            role: "system",
            content: `You are an expert teacher creating a COMPLETE, READY-TO-USE assignment. Your job is to generate the ACTUAL assignment content — not a description of what the student should do, but the real problems, questions, prompts, or tasks themselves.

Respond with ONLY valid JSON in this exact format:
{
  "title": "Specific descriptive assignment title",
  "studentInstructions": "The complete assignment content here",
  "estimatedTime": "e.g. 45 minutes, 2 hours, 1 week",
  "criteria": [
    { "name": "Criterion Name", "description": "What this evaluates and what excellent work looks like", "maxPoints": 25 },
    ...
  ]
}

CRITICAL RULE for studentInstructions:
${contentGuide}

The studentInstructions field MUST contain the actual assignment — real questions, real problems, real prompts. NOT generic descriptions like "you will complete 10 problems" or "you will write about the topic." Write the actual content students work on.

Additional rules:
- Address students directly ("You will..." or imperative form)
- Make content appropriate for: ${gradeLevel}
- Generate 4-5 rubric criteria specific to this assignment type
- Criteria total points MUST add up to exactly 100
- Output ONLY valid JSON, nothing else`
          },
          {
            role: "user",
            content: `Topic: "${topic}"
Subject: ${subject}
Grade Level: ${gradeLevel}
Assignment Type: ${assignmentType}
${additionalInstructions ? `Additional Requirements: ${additionalInstructions}` : ""}`
          }
        ],
      });

      let text = response.choices[0]?.message?.content?.trim() || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) text = match[0];

      let parsed: any;
      try { parsed = JSON.parse(text); } catch {
        return res.status(500).json({ error: "AI returned invalid response, please try again" });
      }

      res.json({
        title: parsed.title || "",
        studentInstructions: parsed.studentInstructions || "",
        estimatedTime: parsed.estimatedTime || "",
        criteria: parsed.criteria || [],
      });
    } catch (error: any) {
      console.error("Generate assignment error:", error);
      res.status(500).json({ error: "Failed to generate assignment" });
    }
  });

  /* ── Report Card Generator ─────────────────────────────────────── */
  app.post("/api/generate-report-card", requireAuth, requireTeacher, async (req, res) => {
    try {
      const { studentName, subject, grade, tone = "encouraging", notes = "", classId } = req.body;

      // If classId provided, verify ownership
      if (classId) {
        const cls = await storage.getClass(classId);
        if (!cls || cls.teacherId !== req.session.userId) {
          return res.status(403).json({ error: "Forbidden: class not found or not yours" });
        }
      }
      if (!studentName || !subject || !grade) {
        return res.status(400).json({ error: "Student name, subject, and grade are required" });
      }

      const toneInstructions: Record<string, string> = {
        encouraging: "Write in a warm, encouraging tone that motivates the student and celebrates progress.",
        formal: "Write in a formal, professional tone suitable for official school records.",
        constructive: "Write in a constructive tone that balances strengths with clear, actionable areas for improvement.",
        detailed: "Write in a detailed, comprehensive tone covering multiple aspects of the student's performance.",
      };

      const gradeDescriptions: Record<string, string> = {
        A: "excellent performance, consistently exceeding expectations",
        B: "good performance, meeting and often exceeding expectations",
        C: "satisfactory performance, meeting expectations",
        D: "performance that needs improvement, often below expectations",
        F: "performance that is significantly below expectations and requires immediate intervention",
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are an experienced teacher writing professional report card comments. Write exactly ONE paragraph (3-5 sentences) for a student's report card. ${toneInstructions[tone] || toneInstructions.encouraging}
            
Rules:
- Use the student's first name naturally
- Reference their specific subject
- Match the performance level described
- Sound authentic, not generic
- Do NOT use buzzwords like "journey" or "leverage"
- Output ONLY the comment paragraph, nothing else`
          },
          {
            role: "user",
            content: `Student: ${studentName}
Subject: ${subject}
Grade: ${grade} (${gradeDescriptions[grade] || "average performance"})
Tone: ${tone}
${notes ? `Teacher notes: ${notes}` : ""}`
          }
        ],
      });

      const comment = response.choices[0]?.message?.content?.trim() || "";
      res.json({ comment, tone, studentName, subject, grade, classId: classId || null });
    } catch (error: any) {
      console.error("Report card error:", error);
      res.status(500).json({ error: "Failed to generate report card comment" });
    }
  });

  /* ── Course API ────────────────────────────────────────────────── */

  // Create a basic course (non-AI). Used by the desktop app.
  app.post("/api/courses", requireAuth, async (req, res) => {
    try {
      const { title, subject } = req.body as { title?: string; subject?: string };
      if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

      const course = await storage.createCourse({
        userId: req.session.userId!,
        title: title.trim(),
        topic: title.trim(),
        difficulty: "beginner",
        audience: "general",
        description: "",
        coverEmoji: "📚",
        chapters: [],
        totalLessons: 0,
      });

      res.status(201).json(course);
    } catch (error: any) {
      console.error("Course create error:", error);
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // Generate a new AI course
  app.post("/api/courses/generate", requireAuth, async (req, res) => {
    try {
      const { topic, difficulty = "beginner", audience = "general learners" } = req.body;
      if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

      const prompt = `You are a world-class instructional designer. Create a comprehensive, well-structured course outline.

Topic: ${topic}
Difficulty: ${difficulty}
Target Audience: ${audience}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Engaging course title",
  "description": "2-3 sentences describing what students will learn and why it matters",
  "coverEmoji": "single relevant emoji",
  "chapters": [
    {
      "title": "Chapter title",
      "description": "One sentence describing this chapter",
      "lessons": [
        { "title": "Lesson title", "duration": "X min" }
      ]
    }
  ]
}

Requirements:
- 4-6 chapters
- Each chapter: 3-5 lessons
- Lesson durations: 5-15 minutes
- Titles should be clear and engaging
- Progress logically from fundamentals to advanced concepts`;

      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      });

      let raw = (response.content[0] as any).text?.trim() || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return res.status(500).json({ error: "AI returned invalid structure. Please try again." });

      let parsed: any;
      try { parsed = JSON.parse(jsonMatch[0]); } catch {
        return res.status(500).json({ error: "Failed to parse course structure. Please try again." });
      }

      const totalLessons = parsed.chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0);

      const course = await storage.createCourse({
        userId: req.session.userId!,
        title: parsed.title || topic,
        topic,
        difficulty,
        audience,
        description: parsed.description || "",
        coverEmoji: parsed.coverEmoji || "📚",
        chapters: parsed.chapters || [],
        totalLessons,
      });

      res.status(201).json(course);
    } catch (error: any) {
      console.error("Course generate error:", error?.message);
      res.status(500).json({ error: "Failed to generate course. Please try again." });
    }
  });

  // List user's courses
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const userCourses = await storage.getCoursesByUser(req.session.userId!);
      const coursesWithProgress = await Promise.all(
        userCourses.map(async (course) => {
          const progress = await storage.getLessonProgress(req.session.userId!, course.id);
          return { ...course, progress };
        })
      );
      res.json(coursesWithProgress);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get single course
  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.userId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const progress = await storage.getLessonProgress(req.session.userId!, req.params.id);
      res.json({ ...course, progress });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Delete course
  app.delete("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.userId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      await storage.deleteCourse(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Get or generate lesson content
  app.post("/api/courses/:id/lesson/:lessonKey", requireAuth, async (req, res) => {
    try {
      const { id, lessonKey } = req.params;
      const course = await storage.getCourse(id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.userId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });

      // Return cached content if available
      const cached = await storage.getLessonContent(id, lessonKey);
      if (cached) return res.json(cached);

      // Parse lesson key: "chapterIdx-lessonIdx"
      const [chIdx, lIdx] = lessonKey.split("-").map(Number);
      const chapter = (course.chapters as any[])[chIdx];
      const lesson = chapter?.lessons?.[lIdx];
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });

      const prompt = `You are an expert educator creating a detailed lesson.

Course: "${course.title}" (${course.difficulty})
Chapter: "${chapter.title}"
Lesson: "${lesson.title}"
Target Audience: ${course.audience}

Write your response in EXACTLY this two-section format — do not deviate:

===CONTENT===
Write the full lesson here in markdown. Use ## for main sections, ### for sub-sections, **bold** for key terms, - for bullet lists. For mathematical expressions use $inline math$ and $$display math$$. Include: introduction, core concepts with examples, practical applications, and a key takeaways summary. Minimum 500 words. Do NOT use JSON or code blocks with curly braces.

===QUIZ===
[{"question":"Question text?","options":["A option","B option","C option","D option"],"correctIndex":0,"explanation":"Why A is correct."},{"question":"...","options":["...","...","...","..."],"correctIndex":1,"explanation":"..."},{"question":"...","options":["...","...","...","..."],"correctIndex":2,"explanation":"..."},{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]

The quiz JSON array must contain exactly 4 questions. Each correctIndex is 0-3.`;

      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (response.content[0] as any).text?.trim() || "";

      // Parse the two-section format
      const contentMatch = raw.match(/===CONTENT===\s*([\s\S]*?)(?:===QUIZ===|$)/);
      const quizMatch    = raw.match(/===QUIZ===\s*([\s\S]*?)$/);

      const lessonContent = contentMatch?.[1]?.trim() || "";
      let quizData: any[] = [];

      if (quizMatch?.[1]) {
        const quizRaw = quizMatch[1].trim();
        const arrMatch = quizRaw.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          try { quizData = JSON.parse(arrMatch[0]); } catch {
            quizData = [];
          }
        }
      }

      if (!lessonContent) {
        return res.status(500).json({ error: "AI returned empty lesson content. Please try again." });
      }

      const lc = await storage.createLessonContent({
        courseId: id,
        lessonKey,
        content: lessonContent,
        quiz: quizData,
      });

      res.json(lc);
    } catch (error: any) {
      console.error("Lesson generate error:", error?.message);
      res.status(500).json({ error: "Failed to generate lesson content. Please try again." });
    }
  });

  // Mark lesson as complete
  app.post("/api/courses/:id/lesson/:lessonKey/complete", requireAuth, async (req, res) => {
    try {
      const { id, lessonKey } = req.params;
      const { score } = req.body;
      const course = await storage.getCourse(id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.userId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });

      const lp = await storage.markLessonComplete({
        userId: req.session.userId!,
        courseId: id,
        lessonKey,
        score: typeof score === "number" ? score : null,
      });
      res.json(lp);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to save progress" });
    }
  });

  // Get lesson progress for a course
  app.get("/api/courses/:id/progress", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      if (course.userId !== req.session.userId) return res.status(403).json({ error: "Forbidden" });
      const progress = await storage.getLessonProgress(req.session.userId!, req.params.id);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  /* ── Research Assessment (file upload) ───────────────────────── */
  const researchUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 5 },
  });

  async function extractTextFromBuffer(buffer: Buffer, mime: string, name: string): Promise<string> {
    const ext = name.toLowerCase().split(".").pop() || "";

    if (mime === "application/pdf" || ext === "pdf") {
      try {
        const PDFParseClass = await getPDFParse();
        const parser = new PDFParseClass(new Uint8Array(buffer));
        const r = await parser.getText();
        return r.text?.trim().replace(/\n*-- \d+ of \d+ --\n*/g, "").trim() || "";
      } catch { return ""; }
    }

    if (mime.includes("word") || ["doc", "docx"].includes(ext)) {
      try {
        const mammoth = await import("mammoth");
        const r = await mammoth.extractRawText({ buffer });
        return r.value?.trim() || "";
      } catch { return ""; }
    }

    if (mime.startsWith("text/") || ["txt","md","csv","rtf"].includes(ext)) {
      return buffer.toString("utf-8").slice(0, 30000);
    }

    if (mime.startsWith("image/") || ["jpg","jpeg","png","webp","gif"].includes(ext)) {
      try {
        const b64 = buffer.toString("base64");
        const imgMime = mime.startsWith("image/") ? mime : "image/jpeg";
        const visionResp = await openai.chat.completions.create({
          model: "gpt-4o",
          max_completion_tokens: 1500,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${imgMime};base64,${b64}`, detail: "high" } },
              { type: "text", text: "Extract all text and key information visible in this image. If it's a chart or diagram, describe the data and insights. If it's a research document, extract all readable text." }
            ],
          }],
        });
        return visionResp.choices[0]?.message?.content?.trim() || "";
      } catch { return ""; }
    }

    try {
      const text = buffer.toString("utf-8");
      const ratio = (text.match(/[\x20-\x7E\n\r\t]/g) || []).length / text.length;
      return ratio > 0.8 ? text.slice(0, 20000) : "";
    } catch { return ""; }
  }

  async function runResearchAssess(prompt: string): Promise<{ assessment: string; sources: { title: string; url: string }[] }> {
    const response = await (openai as any).responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: prompt,
    });

    let assessmentText = "";
    const sources: { title: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    for (const item of (response.output || [])) {
      if (item.type === "message") {
        for (const content of (item.content || [])) {
          if (content.type === "output_text") {
            assessmentText = content.text || "";
            for (const ann of (content.annotations || [])) {
              if (ann.type === "url_citation" && ann.url && !seenUrls.has(ann.url)) {
                seenUrls.add(ann.url);
                sources.push({ title: ann.title || ann.url, url: ann.url });
              }
            }
          }
        }
      }
    }
    return { assessment: assessmentText, sources };
  }

  app.post("/api/research-assess-file", requireAuth, researchUpload.array("files", 5), async (req, res) => {
    try {
      const { topic, type } = req.body as { topic: string; type: string };
      const files = (req.files || []) as Express.Multer.File[];

      if (!topic?.trim() && !files.length) {
        return res.status(400).json({ error: "Topic or files are required" });
      }

      // Extract text from all uploaded files
      const extractedParts: string[] = [];
      for (const file of files) {
        const extracted = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
        if (extracted) {
          extractedParts.push(`--- File: ${file.originalname} ---\n${extracted.slice(0, 20000)}`);
        }
      }

      const combinedFileText = extractedParts.join("\n\n");
      const topicLine = topic?.trim() || "Research project (see uploaded files)";

      let prompt = "";
      if (type === "essay") {
        prompt = `You are an expert academic research evaluator. A student has submitted a research project for assessment.\n\nTopic: ${topicLine}\n\n${combinedFileText ? `Uploaded content:\n${combinedFileText}\n\n` : ""}Use web search to find authoritative and current sources on this topic. Then provide a thorough assessment covering:\n\n**Overall Grade** (A/B/C/D/F) — with clear justification\n**Strengths** — what the research does well\n**Weaknesses & Gaps** — missing arguments, evidence, or perspectives\n**Factual Accuracy** — verify key claims against current sources\n**Missing Key Sources** — important works the student should cite\n**Recommendations** — specific, actionable improvements\n\nReference the web sources you found to support your evaluation.`;
      } else if (type === "factcheck") {
        prompt = `You are an expert fact-checker. Please verify the following research claims or statements:\n\nTopic: ${topicLine}\n\n${combinedFileText ? `Content to verify:\n${combinedFileText}\n\n` : ""}Search the web for authoritative sources to verify or refute each claim. Provide:\n\n**Verdict for each claim** — True / False / Partially True / Unverified\n**Evidence** — sources that confirm or contradict the claim\n**Corrections** — accurate information where claims are wrong\n**Overall Credibility Score** (1-10) — with explanation`;
      } else {
        prompt = `You are an expert research analyst. Conduct a thorough research assessment on the following topic:\n\n"${topicLine}"\n\n${combinedFileText ? `Uploaded research materials:\n${combinedFileText}\n\n` : ""}Search the web for the most current, authoritative sources. Provide:\n\n**Topic Overview** — current state of knowledge\n**Key Findings** — major discoveries and consensus views\n**Debates & Controversies** — where experts disagree\n**Source Quality Assessment** — evaluation of available literature\n**Research Gaps** — what is still unknown or understudied\n**Top Recommended Sources** — the best references for further study`;
      }

      const { assessment, sources } = await runResearchAssess(prompt);
      if (!assessment) return res.status(500).json({ error: "No assessment generated. Please try again." });

      res.json({ assessment, sources, type, filesProcessed: files.length });
    } catch (err: any) {
      console.error("Research assess file error:", err);
      res.status(500).json({ error: err.message || "Assessment failed" });
    }
  });

  /* ── Research Assessment (text only) ─────────────────────────── */
  app.post("/api/research-assess", requireAuth, async (req, res) => {
    try {
      const { topic, text, type } = req.body as { topic: string; text?: string; type: string };
      if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

      let prompt = "";
      if (type === "essay") {
        prompt = `You are an expert academic research evaluator. A student has submitted a research essay for assessment.\n\nTopic: ${topic.trim()}\n\nEssay/Paper:\n${(text || "").trim() || "(No essay text provided — evaluate the topic only)"}\n\nUse web search to find authoritative and current sources on this topic. Then provide a thorough assessment covering:\n\n**Overall Grade** (A/B/C/D/F) — with clear justification\n**Strengths** — what the research does well\n**Weaknesses & Gaps** — missing arguments, evidence, or perspectives\n**Factual Accuracy** — verify key claims against current sources\n**Missing Key Sources** — important works the student should cite\n**Recommendations** — specific, actionable improvements\n\nReference the web sources you found to support your evaluation.`;
      } else if (type === "factcheck") {
        prompt = `You are an expert fact-checker. Please verify the following claims or research statements:\n\n${(text || topic).trim()}\n\nSearch the web for authoritative sources to verify or refute each claim. Provide:\n\n**Verdict for each claim** — True / False / Partially True / Unverified\n**Evidence** — sources that confirm or contradict the claim\n**Corrections** — accurate information where claims are wrong\n**Overall Credibility Score** (1-10) — with explanation\n\nBe precise and cite your sources.`;
      } else {
        prompt = `You are an expert research analyst. Conduct a thorough research assessment on the following topic:\n\n"${topic.trim()}"\n\nSearch the web for the most current, authoritative, and peer-reviewed sources. Provide:\n\n**Topic Overview** — current state of knowledge\n**Key Findings** — major discoveries and consensus views\n**Debates & Controversies** — where experts disagree\n**Source Quality Assessment** — evaluation of available literature\n**Research Gaps** — what is still unknown or understudied\n**Top Recommended Sources** — the best references for further study\n**Research Difficulty** — how challenging this topic is to research (Easy/Moderate/Hard)\n\nInclude specific sources found during your web search.`;
      }

      const { assessment, sources } = await runResearchAssess(prompt);
      if (!assessment) return res.status(500).json({ error: "No assessment generated. Please try again." });

      res.json({ assessment, sources, type });
    } catch (err: any) {
      console.error("Research assess error:", err);
      res.status(500).json({ error: err.message || "Assessment failed" });
    }
  });

  /* ── Desktop App Compatibility Routes ───────────────────────── */
  
  // Tutor sessions (compatibility - desktop uses /api/tutor/sessions)
  app.get("/api/tutor/sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getTutorSessionsByUser(req.session.userId!);
      res.json({ sessions: sessions.map(s => ({ id: s.id, title: s.title, createdAt: s.createdAt })) });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/tutor/chat", requireAuth, async (req, res) => {
    try {
      const { message, subject, history } = req.body;
      if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

      // Simple AI tutor response using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI tutor for students. ${subject ? `Focus on ${subject}. ` : ""}Provide clear, educational explanations. Be encouraging and help students learn.`,
          },
          ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message },
        ],
        max_completion_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
      res.json({ response });
    } catch (error: any) {
      console.error("Tutor chat error:", error);
      res.status(500).json({ error: "Failed to get response" });
    }
  });

  // Desktop data persistence using JSON files
  const DATA_DIR = process.env.DATA_DIR || "/tmp/academia-data";

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

  // Initialize Maps with persisted data
  const desktopCoursesData = loadJson<Record<string, any[]>>("courses.json", {});
  const desktopTutorSessionsData = loadJson<Record<string, any[]>>("tutor-sessions.json", {});
  const desktopQuizzesData = loadJson<Record<string, any[]>>("quizzes.json", {});
  const desktopNotesData = loadJson<Record<string, any[]>>("notes.json", {});
  const desktopEssaysData = loadJson<Record<string, any[]>>("essays.json", {});
  const desktopUsersByEmailData = loadJson<Record<string, any>>("users-by-email.json", {});
  const desktopUsersByIdData = loadJson<Record<string, any>>("users-by-id.json", {});

  const desktopCourses = new Map<string, any[]>(Object.entries(desktopCoursesData));
  const desktopTutorSessions = new Map<string, any[]>(Object.entries(desktopTutorSessionsData));
  const desktopQuizzes = new Map<string, any[]>(Object.entries(desktopQuizzesData));
  const desktopNotes = new Map<string, any[]>(Object.entries(desktopNotesData));
  const desktopEssays = new Map<string, any[]>(Object.entries(desktopEssaysData));
  const desktopUsersByEmail = new Map<string, any>(Object.entries(desktopUsersByEmailData));
  const desktopUsersById = new Map<string, any>(Object.entries(desktopUsersByIdData));

  // Persist functions
  function persistCourses() { saveJson("courses.json", Object.fromEntries(desktopCourses)); }
  function persistTutorSessions() { saveJson("tutor-sessions.json", Object.fromEntries(desktopTutorSessions)); }
  function persistQuizzes() { saveJson("quizzes.json", Object.fromEntries(desktopQuizzes)); }
  function persistNotes() { saveJson("notes.json", Object.fromEntries(desktopNotes)); }
  function persistEssays() { saveJson("essays.json", Object.fromEntries(desktopEssays)); }
  function persistUsers() {
    saveJson("users-by-email.json", Object.fromEntries(desktopUsersByEmail));
    saveJson("users-by-id.json", Object.fromEntries(desktopUsersById));
  }

  app.get("/desktop/api/auth/me", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const user = desktopUsersById.get(userId);
      if (!user) return res.status(401).json({ error: "Authentication required" });
      const { password: _pw, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/desktop/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName, role } = req.body as any;
      if (!email?.trim() || !password?.trim()) return res.status(400).json({ error: "Email and password are required" });

      const existing = desktopUsersByEmail.get(String(email).toLowerCase());
      if (existing) return res.status(400).json({ error: "Email already registered" });

      const user = {
        id: crypto.randomUUID(),
        email: String(email).toLowerCase(),
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
      console.error("Desktop register error:", error);
      res.status(500).json({ error: "Failed to create account" });
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
      console.error("Desktop login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/desktop/api/auth/logout", async (_req, res) => {
    res.json({ success: true });
  });

  app.get("/desktop/api/tutor/sessions", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const sessions = desktopTutorSessions.get(userId) || [];
      res.json({ sessions });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch tutor sessions" });
    }
  });

  app.post("/desktop/api/tutor/sessions", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { subject = "General", title } = req.body || {};
      const session = {
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
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create tutor session" });
    }
  });

  app.post("/desktop/api/tutor/chat", async (req, res) => {
    try {
      const { message, subject = "General" } = req.body as { message?: string; subject?: string };
      if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

      const prompt = `You are a helpful tutor. Subject: ${subject}. Answer clearly and step-by-step when needed.\n\nStudent message: ${message}`;
      const reply = await generateChatCompletion(
        [{ role: "user", content: prompt }],
        { max_tokens: 800 }
      );

      const trimmed = reply.trim();
      res.json({ reply: trimmed, response: trimmed });
    } catch (error: any) {
      console.error("Desktop tutor chat error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.get("/desktop/api/courses", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const courses = desktopCourses.get(userId) || [];
      res.json({ courses });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.post("/desktop/api/courses", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { title, subject } = req.body as { title?: string; subject?: string };
      if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

      const course = {
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
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  app.get("/desktop/api/quizzes", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const quizzes = desktopQuizzes.get(userId) || [];
      res.json({ quizzes });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.post("/desktop/api/quizzes", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { title, subject, topic, difficulty, questionCount } = req.body;

      const quiz = {
        id: crypto.randomUUID(),
        title: title || "Untitled Quiz",
        subject: subject || "General",
        topic: topic || "",
        difficulty: difficulty || "medium",
        questionCount: questionCount || 5,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: "draft",
      };

      const list = desktopQuizzes.get(userId) || [];
      list.unshift(quiz);
      desktopQuizzes.set(userId, list);
      persistQuizzes();

      res.status(201).json({ quiz });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  app.post("/desktop/api/quizzes/generate", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { title, subject, topic, difficulty, questionCount } = req.body;

      const prompt = `Create ${questionCount || 5} ${difficulty || "medium"} difficulty multiple choice questions about: ${topic}
Subject: ${subject}

You MUST output ONLY valid JSON (no markdown, no code fences, no extra text).
Output format is a JSON array exactly like:
[{"question":"Question text?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Why this is correct"}]

Rules:
- options must have exactly 4 strings
- correctIndex must be 0,1,2, or 3
- keep questions clear and educational`;

      const parseQuestionsFromAi = async (raw: unknown): Promise<any[]> => {
        const cleaned = String(raw ?? "")
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const match = cleaned.match(/\[[\s\S]*\]/);
        const jsonCandidate = match ? match[0] : cleaned;
        const parsed = JSON.parse(jsonCandidate);

        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).questions)) {
          return (parsed as any).questions;
        }
        return [];
      };

      let text = await generateChatCompletion(
        [{ role: "user", content: prompt }],
        { max_tokens: 2000 }
      );

      let questions: any[] = [];
      try {
        questions = await parseQuestionsFromAi(text);
      } catch {
        questions = [];
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        // One retry with stricter formatting instruction
        const retryPrompt = `${prompt}\n\nYour previous response was not valid JSON. Return ONLY the JSON now.`;
        text = await generateChatCompletion(
          [{ role: "user", content: retryPrompt }],
          { max_tokens: 2000 }
        );

        try {
          questions = await parseQuestionsFromAi(text);
        } catch {
          questions = [];
        }
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(500).json({ error: "Quiz generation failed: AI did not return valid questions JSON" });
      }

      const quiz = {
        id: crypto.randomUUID(),
        title: title || `Quiz: ${String(topic || "").slice(0, 30)}...`,
        subject: subject || "General",
        topic: topic || "",
        difficulty: difficulty || "medium",
        questionCount: questions.length || (questionCount || 5),
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
      console.error("Desktop quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  app.delete("/desktop/api/quizzes/:id", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const quizzes = desktopQuizzes.get(userId) || [];
      const filtered = quizzes.filter((q: any) => q.id !== req.params.id);
      desktopQuizzes.set(userId, filtered);
      persistQuizzes();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  app.get("/desktop/api/notes", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const notes = desktopNotes.get(userId) || [];
      res.json({ notes });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/desktop/api/notes", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { title, content, audioUrl, duration, tags } = req.body;

      let finalContent = typeof content === "string" ? content : "";
      const safeTitle = typeof title === "string" && title.trim() ? title.trim() : "Untitled Note";

      // If no content is provided, generate helpful lecture notes so the user doesn't see an empty note.
      if (!finalContent.trim()) {
        const genPrompt = `You are an expert note-taker.

Create well-structured lecture notes for a lecture titled: "${safeTitle}".

Requirements:
- Use short headings and bullet points
- Include key definitions and formulas if relevant
- Add 5 quick review questions at the end

Return plain text only.`;

        finalContent = await generateChatCompletion(
          [{ role: "user", content: genPrompt }],
          { max_tokens: 900 }
        );
      }

      const note = {
        id: crypto.randomUUID(),
        title: safeTitle,
        content: finalContent || "",
        audioUrl: audioUrl || null,
        duration: duration || null,
        tags: tags || [],
        hasTranscript: Boolean(audioUrl),
        createdAt: new Date().toISOString(),
      };

      const list = desktopNotes.get(userId) || [];
      list.unshift(note);
      desktopNotes.set(userId, list);
      persistNotes();

      res.status(201).json({ note });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.delete("/desktop/api/notes/:id", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const notes = desktopNotes.get(userId) || [];
      const filtered = notes.filter((n: any) => n.id !== req.params.id);
      desktopNotes.set(userId, filtered);
      persistNotes();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.get("/desktop/api/essays", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const essays = desktopEssays.get(userId) || [];
      res.json({ essays });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch essays" });
    }
  });

  app.post("/desktop/api/essays", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const { title, topic, subject, type, wordCount } = req.body;

      const essay = {
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
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create essay" });
    }
  });

  app.post("/desktop/api/essays/:id/generate", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const essays = desktopEssays.get(userId) || [];
      const essayIndex = essays.findIndex((e: any) => e.id === req.params.id);
      if (essayIndex === -1) return res.status(404).json({ error: "Essay not found" });

      const essay = essays[essayIndex];

      const prompt = `Write a ${essay.wordCount || 500}-word ${essay.type} essay about: ${essay.topic}\nSubject: ${essay.subject}\n\nWrite a well-structured essay with introduction, body paragraphs, and conclusion. Use academic tone.`;

      const content = await generateChatCompletion(
        [{ role: "user", content: prompt }],
        { max_tokens: 2000 }
      );
      essay.content = content;
      essay.status = "generated";
      essays[essayIndex] = essay;
      desktopEssays.set(userId, essays);
      persistEssays();

      res.json({ essay, content });
    } catch (error: any) {
      console.error("Desktop essay generation error:", error);
      res.status(500).json({ error: "Failed to generate essay" });
    }
  });

  app.delete("/desktop/api/essays/:id", async (req, res) => {
    try {
      const userId = getDesktopUserId(req);
      const essays = desktopEssays.get(userId) || [];
      const filtered = essays.filter((e: any) => e.id !== req.params.id);
      desktopEssays.set(userId, filtered);
      persistEssays();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete essay" });
    }
  });

  // In-memory storage for desktop app features (quizzes, notes, essays)
  const desktopQuizzesWeb = new Map<string, any[]>();
  const desktopNotesWeb = new Map<string, any[]>();
  const desktopEssaysWeb = new Map<string, any[]>();

  // Quizzes API
  app.get("/api/quizzes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const quizzes = desktopQuizzesWeb.get(userId) || [];
      res.json({ quizzes });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  app.post("/api/quizzes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { title, subject, topic, difficulty, questionCount } = req.body;
      
      const quiz = {
        id: crypto.randomUUID(),
        title: title || "Untitled Quiz",
        subject: subject || "General",
        topic: topic || "",
        difficulty: difficulty || "medium",
        questionCount: questionCount || 5,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: "draft",
      };

      const userQuizzes = desktopQuizzesWeb.get(userId) || [];
      userQuizzes.unshift(quiz);
      desktopQuizzesWeb.set(userId, userQuizzes);

      res.status(201).json({ quiz });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  app.post("/api/quizzes/generate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { title, subject, topic, difficulty, questionCount } = req.body;
      
      // Generate quiz questions using AI
      const prompt = `Create ${questionCount || 5} ${difficulty || "medium"} difficulty multiple choice questions about: ${topic}
Subject: ${subject}

Return ONLY a JSON array in this format:
[{"question":"Question text?","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"Why this is correct"}]

Make questions educational and clear.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2000,
      });

      let questions = [];
      try {
        const text = completion.choices[0]?.message?.content || "[]";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) questions = JSON.parse(match[0]);
      } catch {
        questions = [];
      }

      const quiz = {
        id: crypto.randomUUID(),
        title: title || `Quiz: ${topic.slice(0, 30)}...`,
        subject: subject || "General",
        topic: topic || "",
        difficulty: difficulty || "medium",
        questionCount: questions.length || (questionCount || 5),
        questions,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: "generated",
      };

      const userQuizzes = desktopQuizzes.get(userId) || [];
      userQuizzes.unshift(quiz);
      desktopQuizzes.set(userId, userQuizzes);

      res.status(201).json({ quiz });
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  app.delete("/api/quizzes/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const quizzes = desktopQuizzesWeb.get(userId) || [];
      const filtered = quizzes.filter((q: any) => q.id !== req.params.id);
      desktopQuizzesWeb.set(userId, filtered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  // Notes API
  app.get("/api/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notes = desktopNotesWeb.get(userId) || [];
      res.json({ notes });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { title, content, audioUrl, duration, tags } = req.body;
      
      const note = {
        id: crypto.randomUUID(),
        title: title || "Untitled Note",
        content: content || "",
        audioUrl: audioUrl || null,
        duration: duration || null,
        tags: tags || [],
        hasTranscript: false,
        createdAt: new Date().toISOString(),
      };

      const userNotes = desktopNotesWeb.get(userId) || [];
      userNotes.unshift(note);
      desktopNotesWeb.set(userId, userNotes);

      res.status(201).json({ note });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notes = desktopNotesWeb.get(userId) || [];
      const filtered = notes.filter((n: any) => n.id !== req.params.id);
      desktopNotesWeb.set(userId, filtered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Essays API
  app.get("/api/essays", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const essays = desktopEssaysWeb.get(userId) || [];
      res.json({ essays });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch essays" });
    }
  });

  app.post("/api/essays", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { title, topic, subject, type, wordCount } = req.body;
      
      const essay = {
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

      const userEssays = desktopEssaysWeb.get(userId) || [];
      userEssays.unshift(essay);
      desktopEssaysWeb.set(userId, userEssays);

      res.status(201).json({ essay });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create essay" });
    }
  });

  app.post("/api/essays/:id/generate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const essays = desktopEssaysWeb.get(userId) || [];
      const essayIndex = essays.findIndex((e: any) => e.id === req.params.id);
      
      if (essayIndex === -1) return res.status(404).json({ error: "Essay not found" });
      
      const essay = essays[essayIndex];
      
      // Generate essay content using AI
      const prompt = `Write a ${essay.wordCount || 500}-word ${essay.type} essay about: ${essay.topic}
Subject: ${essay.subject}

Write a well-structured essay with introduction, body paragraphs, and conclusion. Use academic tone.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || "";
      
      essay.content = content;
      essay.status = "generated";
      essays[essayIndex] = essay;
      desktopEssaysWeb.set(userId, essays);

      res.json({ essay, content });
    } catch (error: any) {
      console.error("Essay generation error:", error);
      res.status(500).json({ error: "Failed to generate essay" });
    }
  });

  app.delete("/api/essays/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const essays = desktopEssaysWeb.get(userId) || [];
      const filtered = essays.filter((e: any) => e.id !== req.params.id);
      desktopEssaysWeb.set(userId, filtered);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete essay" });
    }
  });

  return httpServer;
}
