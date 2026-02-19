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
        content: `You are Gradeio, a friendly AI tutor. You can chat naturally AND solve homework.

DETECT USER INTENT:
- Casual chat (hi, thanks, how are you, etc) → Use "chat" type
- Homework/math/science questions → Use "problem" type
- "step by step" or "explain" → Detailed steps
- Quick question → Brief answer

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
            { role: "system", content: "You are Gradeio, a friendly AI homework tutor. Be warm, helpful, and brief." },
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

      // Build messages with history for context
      const systemMessage = {
        role: "system" as const,
        content: `You are Gradeio, an expert math/science tutor. Solve problems step by step.

CRITICAL - MATH FORMATTING:
- Use LaTeX for ALL math expressions
- Inline math: \\(x^2 + 2x + 1\\) or $x^2 + 2x + 1$
- Display/block math: \\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]
- NEVER use plain text for equations like "x^2 = 4" - always use LaTeX: $x^2 = 4$

FORMAT:
Step 1: [title]
[explanation with LaTeX math]

Step 2: [title]
[continue with LaTeX math...]

**Answer:** $[final answer in LaTeX]$

EXAMPLES OF CORRECT LATEX:
- Fractions: $\\frac{a}{b}$
- Exponents: $x^2$, $x^{10}$
- Square roots: $\\sqrt{x}$, $\\sqrt[3]{x}$
- Equals: $x = 5$
- Plus/minus: $\\pm$
- Greek letters: $\\alpha$, $\\beta$, $\\pi$

RULES:
- Always use LaTeX for any math symbol or equation
- Be thorough but clear
- Explain each step`,
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
      
      // Add current problem
      conversationMessages.push({ role: "user", content: problem.trim() });
      
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
      const { image, mimeType } = req.body;
      
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
            // Text only - redirect to text solving
            res.write(`data: ${JSON.stringify({ redirect: "text", problem: extractedText })}\n\n`);
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
          const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: `Analyze and help with this ${isSpreadsheet ? "spreadsheet/data" : "text"} content:

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

      // Use GPT-4o for accurate image reading
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `READ THIS IMAGE CAREFULLY. Solve every math problem you see with the ACTUAL numbers from the image.

FORMAT ALL MATH WITH LATEX:
- Use $...$ for inline math: $V = \\frac{1}{3}\\pi r^2 h$
- Use $$...$$ for display/block math equations

Example format:

**Question 7**
Find the volume of the cone with radius 9 yd and height 17 yd.

**Given:**
- Radius $r = 9$ yd
- Height $h = 17$ yd

**Solution:**
Using the cone volume formula:
$$V = \\frac{1}{3}\\pi r^2 h$$

Substituting values:
$$V = \\frac{1}{3}\\pi (9)^2 (17) = \\frac{1}{3}\\pi \\cdot 81 \\cdot 17 = \\frac{1377\\pi}{3} \\approx 1443.7 \\text{ yd}^3$$

**Answer:** $V \\approx 1443.7$ yd³

---

RULES:
- Use LaTeX for ALL mathematical expressions
- Use **bold** for section headers
- Read ACTUAL numbers from the image
- Solve ALL problems visible in the image
- Show clear step-by-step work with proper math notation`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${imageMimeType};base64,${imageBase64}`, detail: "high" },
              },
            ],
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
      const stats = await storage.getStudentStats();
      res.json(stats);
    } catch (error) {
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

  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Please provide some text to generate a quiz from" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `Generate a quiz as JSON. Format:
{"topic":"name","sections":[{"name":"Section Name","questions":[{"question":"text","options":["A","B","C","D"],"correctAnswer":0,"explanation":"why"}]}]}

Rules: 2-3 sections, 2-3 questions each (5-8 total). 4 options per question. correctAnswer=index 0-3. Keep explanations brief (1 sentence). Output ONLY valid JSON, no markdown.`
          },
          { role: "user", content: `Quiz from:\n\n${text.trim().slice(0, 3000)}` }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, try to fix incomplete JSON
        console.log("Quiz JSON parse failed, attempting recovery");
        let fixedJson = responseText;
        const openBraces = (fixedJson.match(/{/g) || []).length;
        const closeBraces = (fixedJson.match(/}/g) || []).length;
        const openBrackets = (fixedJson.match(/\[/g) || []).length;
        const closeBrackets = (fixedJson.match(/]/g) || []).length;
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedJson += ']}';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedJson += '}';
        }
        
        try {
          result = JSON.parse(fixedJson);
        } catch {
          // Final fallback - create a basic quiz structure with sections
          result = {
            topic: "Quiz",
            sections: [{
              name: "General Questions",
              questions: [{
                question: "Failed to parse AI response. Please try again.",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: 0,
                explanation: "Please regenerate the quiz."
              }]
            }]
          };
        }
      }
      
      // Transform old format (flat questions array) to new format (sections)
      if (result.questions && !result.sections) {
        result.sections = [{
          name: "General Questions",
          questions: result.questions
        }];
        delete result.questions;
      }
      
      // Ensure sections exist
      if (!result.sections || !Array.isArray(result.sections) || result.sections.length === 0) {
        result.sections = [{
          name: "General Questions",
          questions: [{
            question: "No questions could be generated. Please try again with different text.",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "Please regenerate the quiz with more detailed content."
          }]
        }];
      }
      
      res.json(result);
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 600,
        messages: [
          {
            role: "system",
            content: `You are an expert essay writer. Help students write well-structured essays.

Respond with ONLY a JSON object:
{
  "title": "Essay title",
  "outline": ["Introduction point", "Body paragraph 1 topic", "Body paragraph 2 topic", "Conclusion point"],
  "essay": "The full essay text with proper paragraphs",
  "wordCount": 500
}

Essay type: ${essayType || "argumentative"}
Target word count: approximately ${wordCount || 500} words

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

      const systemContext = `You are Gradeio, a helpful AI tutor. You just solved these problems for the student:

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

  app.post("/api/extract-text", requireAuth, docUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const mime = req.file.mimetype || "";
      const fileName = req.file.originalname || "file";
      const buffer = req.file.buffer;

      if (mime === "application/pdf") {
        try {
          const pdfParse = await getPDFParse();
          const data = await pdfParse(buffer);
          const text = data.text?.trim();
          if (!text) {
            return res.status(400).json({ error: "Could not extract text from this PDF. It may be a scanned image." });
          }
          return res.json({ text, fileName });
        } catch (e: any) {
          return res.status(400).json({ error: "Failed to read PDF. The file may be corrupted." });
        }
      }

      if (mime === "application/msword" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          const text = result.value?.trim();
          if (!text) {
            return res.status(400).json({ error: "Could not extract text from this Word document." });
          }
          return res.json({ text, fileName });
        } catch (e: any) {
          return res.status(400).json({ error: "Failed to read Word document." });
        }
      }

      if (mime.startsWith("text/") || mime === "application/json" || mime === "application/xml") {
        const text = buffer.toString("utf-8").trim();
        if (!text) {
          return res.status(400).json({ error: "The file appears to be empty." });
        }
        return res.json({ text, fileName });
      }

      const textAttempt = buffer.toString("utf-8").trim();
      const printable = textAttempt.replace(/[^\x20-\x7E\n\r\t]/g, "");
      if (printable.length > textAttempt.length * 0.7 && printable.length > 10) {
        return res.json({ text: printable, fileName });
      }

      return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, Word document, or text file." });
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
      const audioBlob = new Blob([req.file.buffer], { type: mimeType });
      
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
      const totalPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);

      const rubric = await storage.createRubric({
        teacherId: req.session.userId!,
        name,
        subject,
        totalPoints,
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

  // Get all rubrics for teacher
  app.get("/api/rubrics", requireAuth, requireTeacher, async (req, res) => {
    try {
      const myRubrics = await storage.getRubricsByTeacher(req.session.userId!);
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
      const criteria = await storage.getCriteriaByRubric(rubric.id);
      res.json({ ...rubric, criteria });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rubric" });
    }
  });

  // Delete rubric
  app.delete("/api/rubrics/:id", requireAuth, requireTeacher, async (req, res) => {
    try {
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

      const criteria = await storage.getCriteriaByRubric(rubric.id);
      if (criteria.length === 0) return res.status(400).json({ error: "Rubric has no criteria" });

      const criteriaPrompt = criteria.map((c, i) => 
        `${i + 1}. "${c.name}" (max ${c.maxPoints} points): ${c.description}`
      ).join("\n");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 800,
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
              const criteria = await storage.getCriteriaByRubric(rubric.id);

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

  app.post("/api/quick-evaluate", requireAuth, requireTeacher, async (req, res) => {
    try {
      const { criteria, studentName, content } = req.body;

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
        `${i + 1}. "${c.name}" (max ${c.maxPoints} points)${c.description ? `: ${c.description}` : ""}`
      ).join("\n");

      const totalMaxPoints = validCriteria.reduce((s: number, c: any) => s + c.maxPoints, 0);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 800,
        messages: [
          {
            role: "system",
            content: `You are an academic evaluator. Evaluate student work using ONLY these criteria:

${criteriaPrompt}

Respond with ONLY valid JSON:
{
  "scores": [
    {"name": "CRITERION_NAME", "score": NUMBER, "maxPoints": NUMBER, "feedback": "Brief feedback"}
  ],
  "overallScore": NUMBER,
  "totalMaxPoints": ${totalMaxPoints},
  "overallFeedback": "Summary feedback with strengths and areas for improvement"
}

RULES:
- Score each criterion from 0 to its max points
- Be fair but rigorous
- Output ONLY valid JSON`
          },
          {
            role: "user",
            content: `${studentName ? `Student: ${studentName}\n\n` : ""}Student Work:\n${content.trim()}`
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
        const aiScore = parsed.scores?.find((s: any) => s.name === c.name);
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
        overallFeedback: parsed.overallFeedback || "Evaluation complete",
        studentName: studentName || "Student",
        evaluatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Quick evaluate error:", error);
      res.status(500).json({ error: "Failed to evaluate. Please try again." });
    }
  });

  return httpServer;
}
