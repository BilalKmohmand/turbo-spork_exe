import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitWorkSchema, evaluateSchema, registerSchema, loginSchema, uploadKnowledgeSchema, knowledgeChunks } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
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
  problemType: "math" | "science" | "other";
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
    // Use GPT-5.2 for powerful problem solving with images and documents
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert math tutor like Solvely AI. Analyze this image CAREFULLY and solve ALL problems with step-by-step explanations.

CRITICAL: READ VALUES CAREFULLY FROM THE IMAGE
- Look at EVERY number label in the image precisely
- The HEIGHT of a pyramid is the PERPENDICULAR/VERTICAL height (often shown as a dashed line inside)
- Do NOT confuse slant height (along the face) with perpendicular height
- Double-check all dimensions before calculating

RESPONSE FORMAT - Return ONLY this JSON:
{
  "questions": [
    {
      "questionNumber": 1,
      "problemStatement": "Find the volume of the pyramid in problem 1.",
      "steps": [
        {"title": "Calculate the Area of the Base", "math": "B = 10 \\times 11 = 110 \\text{ in}^2", "reasoning": "The area of the rectangular base (B) is $110$ square inches. The base is a rectangle with side lengths of $10$ inches and $11$ inches."},
        {"title": "Calculate the Volume of the Pyramid", "math": "V = \\frac{1}{3}Bh = \\frac{1}{3} \\times 110 \\times 16 = \\frac{1760}{3} \\approx 586.67", "reasoning": "The volume (V) is calculated using the formula $V = \\frac{1}{3}Bh$, where B is the base area and h is the height. The height is $16$ inches."}
      ],
      "answer": "The volume of the pyramid is $586.67 \\text{ in}^3$."
    },
    {
      "questionNumber": 2,
      "problemStatement": "Find the volume of the pyramid in problem 2.",
      "steps": [
        {"title": "Calculate the Area of the Base", "math": "B = 21 \\times 9 = 189 \\text{ yd}^2", "reasoning": "The area of the rectangular base (B) is $189$ square yards. The base is a rectangle with side lengths of $21$ yards and $9$ yards."},
        {"title": "Calculate the Volume of the Pyramid", "math": "V = \\frac{1}{3} \\times 189 \\times 5 = 315", "reasoning": "The volume (V) is calculated using $V = \\frac{1}{3}Bh$. The height is $5$ yards."}
      ],
      "answer": "The volume of the pyramid is $315 \\text{ yd}^3$."
    }
  ],
  "explanation": "For each pyramid, use $V = \\frac{1}{3}Bh$, where $B$ is the area of the base and $h$ is the perpendicular height.",
  "problemType": "math",
  "graphSpec": null
}

KEY REQUIREMENTS:
1. QUESTIONS ARRAY: Each problem gets its own object with questionNumber, problemStatement, steps, and answer
2. STEP TITLES: Clear action titles like "Calculate the Area of the Base", "Calculate the Volume of the Pyramid"
3. MATH FIELD: Show the full calculation with = signs
4. ANSWER: A complete sentence with the final answer and units
5. Use $...$ for inline math in reasoning and answer fields
6. In "math" field: Write LaTeX WITHOUT $ signs
7. Use \\text{} for units: \\text{ in}^3, \\text{ cm}^2
8. Use \\times for multiplication, \\frac{a}{b} for fractions
9. SOLVE EVERY PROBLEM - do not skip any

GRAPHS: Set graphSpec to null unless explicitly asked to graph.

Output ONLY valid JSON.`,
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
      max_completion_tokens: 8192,
    });

    let text = response.choices[0]?.message?.content || "";
    
    console.log("[solveFromImage] Raw AI response:", text.slice(0, 500));
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(text);
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
      console.log("[solveFromImage] Failed text:", text.slice(0, 300));
      return {
        solution: cleanupLatex(text.slice(0, 1000) || "Solution generated."),
        steps: [{ title: "Solution", math: "", reasoning: "Review the answer above." }],
        explanation: "The problem has been solved.",
        problemType: "other",
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

async function solveWithAI(content: string): Promise<SolveResult> {
  try {
    // Use GPT-5.2 - the highest-end ChatGPT model for superior math solving
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 16384,
      messages: [
        {
          role: "system",
          content: `You are an expert math tutor like Solvely AI. Solve ALL problems with step-by-step explanations.

RESPONSE FORMAT - Return ONLY this JSON:
{
  "questions": [
    {
      "questionNumber": 1,
      "problemStatement": "Find the volume of the pyramid in problem 1.",
      "steps": [
        {"title": "Calculate the Area of the Base", "math": "B = 10 \\times 11 = 110 \\text{ in}^2", "reasoning": "The area of the rectangular base (B) is $110$ square inches. The base is a rectangle with side lengths of $10$ inches and $11$ inches."},
        {"title": "Calculate the Volume of the Pyramid", "math": "V = \\frac{1}{3}Bh = \\frac{1}{3} \\times 110 \\times 16 = \\frac{1760}{3} \\approx 586.67", "reasoning": "The volume (V) is calculated using the formula $V = \\frac{1}{3}Bh$, where B is the base area and h is the height. The height is $16$ inches."}
      ],
      "answer": "The volume of the pyramid is $586.67 \\text{ in}^3$."
    }
  ],
  "explanation": "For each pyramid, use $V = \\frac{1}{3}Bh$, where $B$ is the area of the base and $h$ is the perpendicular height.",
  "problemType": "math",
  "graphSpec": null
}

KEY REQUIREMENTS:
1. QUESTIONS ARRAY: Each problem gets its own object with questionNumber, problemStatement, steps, and answer
2. STEP TITLES: Clear action titles like "Calculate the Area of the Base", "Calculate the Volume"
3. MATH FIELD: Show the full calculation with = signs
4. ANSWER: A complete sentence with the final answer and units
5. Use $...$ for inline math in reasoning and answer fields
6. In "math" field: Write LaTeX WITHOUT $ signs
7. Use \\text{} for units: \\text{ in}^3, \\text{ cm}^2
8. Use \\times for multiplication, \\frac{a}{b} for fractions
9. SOLVE EVERY PROBLEM - do not skip any

GRAPHS: Set graphSpec to null unless explicitly asked to graph.

Output ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Solve this problem with clear steps:\n\n${content}`,
        },
      ],
    });

    let text = response.choices[0]?.message?.content || "";
    
    console.log("[solveWithAI] Raw AI response:", text.slice(0, 500));
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(text);
      console.log("[solveWithAI] Parsed keys:", Object.keys(result));
      console.log("[solveWithAI] Has questions?", !!result.questions, "Is array?", Array.isArray(result.questions));
      
      // Handle new question-based format
      if (result.questions && Array.isArray(result.questions)) {
        console.log("[solveWithAI] Using question-based format, count:", result.questions.length);
        return parseQuestionBasedResponse(result);
      }
      
      console.log("[solveWithAI] Falling back to old format");
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
      console.log("[solveWithAI] Failed text:", text.slice(0, 300));
      return {
        solution: cleanupLatex(text.slice(0, 1000) || "Solution generated."),
        steps: [{ title: "Solution", math: "", reasoning: "Review the answer above." }],
        explanation: "The problem has been solved.",
        problemType: "other",
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
          
          if (!extractedText || extractedText.length < 10) {
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
      // Include questions array in response for Solvely-style display
      res.status(201).json({
        ...updated,
        questions: aiResult.questions || [],
      });
    } catch (error: any) {
      console.error("Image submission error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to process image" });
    }
  });

  app.post("/api/solve-text", async (req, res) => {
    try {
      const { problem } = req.body;
      
      if (!problem || typeof problem !== "string" || !problem.trim()) {
        return res.status(400).json({ error: "Please enter a problem to solve" });
      }

      const aiResult = await solveWithAI(problem.trim());
      
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
      // Include questions array in response for Solvely-style display
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
      
      if (!text || typeof text !== "string" || text.trim().length < 50) {
        return res.status(400).json({ error: "Please provide at least 50 characters of text" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `You are a quiz generator. Create a practice quiz from the provided text.

Respond with ONLY a JSON object:
{
  "topic": "Brief topic name",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is the correct answer"
    }
  ]
}

Create 5-7 multiple choice questions that test understanding of the key concepts.
Each question should have exactly 4 options.
correctAnswer is the index (0-3) of the correct option.

Output ONLY valid JSON.`
          },
          { role: "user", content: `Generate a quiz from this text:\n\n${text.trim()}` }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("Quiz generation error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to generate quiz" });
    }
  });

  app.post("/api/generate-essay", async (req, res) => {
    try {
      const { topic, type, wordCount, notes } = req.body;
      
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({ error: "Please provide an essay topic" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 8192,
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

Essay type: ${type || "argumentative"}
Target word count: approximately ${wordCount || 500} words

Write a well-structured, coherent essay with:
- Clear introduction with thesis statement
- Well-developed body paragraphs
- Strong conclusion
- Proper transitions between paragraphs

${notes ? `Additional notes/requirements: ${notes}` : ""}

Output ONLY valid JSON.`
          },
          { role: "user", content: `Write an essay about: ${topic.trim()}` }
        ],
      });

      let responseText = response.choices[0]?.message?.content || "";
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      const result = JSON.parse(responseText);
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

      const systemContext = `You are a helpful tutor. The student previously submitted this problem:
      
${submission.content}

And you provided this solution:
${submission.aiSolution}

Steps: ${Array.isArray(submission.aiSteps) ? submission.aiSteps.map((s: any) => s.reasoning || s).join("\n") : ""}

Explanation: ${submission.aiExplanation}

Now the student has a follow-up question. Answer it clearly and helpfully to deepen their understanding.`;

      const chatMessages = messages.map(m => ({ 
        role: m.role, 
        content: m.content 
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 1024,
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
        model: "gpt-5.2",
        max_completion_tokens: 16384,
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

  return httpServer;
}
