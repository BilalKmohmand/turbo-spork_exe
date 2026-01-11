import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitWorkSchema, evaluateSchema, registerSchema, loginSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import bcrypt from "bcryptjs";

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
}

function parseSteps(steps: any): StepObject[] {
  if (!Array.isArray(steps)) return [];
  
  return steps.map((step: any) => {
    if (typeof step === 'object' && step !== null) {
      return {
        title: String(step.title || ''),
        math: String(step.math || ''),
        reasoning: String(step.reasoning || '')
      };
    }
    // Fallback for string steps
    return {
      title: '',
      math: '',
      reasoning: String(step)
    };
  });
}

async function solveFromImage(base64Image: string, mimeType: string): Promise<SolveResult> {
  try {
    // Use GPT-5.2 for best problem solving with deep reasoning
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert math and science tutor with deep reasoning abilities. Analyze this homework problem image carefully and solve it step-by-step.

THINK THROUGH THE PROBLEM:
1. First, identify what type of problem this is (algebra, geometry, calculus, physics, chemistry, etc.)
2. Identify all given information and what we need to find
3. Plan your approach before solving
4. Execute each step with clear reasoning
5. Verify your answer makes sense

Respond with ONLY a JSON object:
{
  "solution": "Final answer with units if applicable (use LaTeX like $x = 5$ for math)",
  "steps": [
    {"title": "Identify the problem type", "math": "", "reasoning": "This is a [type] problem because..."},
    {"title": "List given information", "math": "", "reasoning": "We know that..."},
    {"title": "Step description", "math": "\\\\frac{30}{6} = 5", "reasoning": "We divide because..."}
  ],
  "explanation": "Key concepts and why this approach works. Include any formulas or theorems used.",
  "problemType": "math" or "science" or "other",
  "graphSpec": null or {"expressions": ["y=2x+1", "y=-x+3"], "title": "Visual representation", "xMin": -10, "xMax": 10, "yMin": -10, "yMax": 10}
}

STEP FORMAT - Each step MUST have all 3 fields:
- "title": Clear description of what we're doing in this step
- "math": LaTeX equation WITHOUT $$ delimiters. Use \\\\frac{a}{b} for fractions, x^2 for exponents, \\\\sqrt{x} for roots, \\\\pi for pi
- "reasoning": Explain WHY we do this step and how it connects to the solution

GRAPH RULES - Include graphSpec when the problem involves:
- Linear equations (y = mx + b)
- Quadratic functions (y = ax² + bx + c)
- Systems of equations (multiple expressions)
- Inequalities (use dashed lines for < or >)
- Trigonometric functions
- Any function that can be visualized

Output ONLY valid JSON, no markdown or explanation outside the JSON.`,
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
      max_tokens: 8192,
    });

    let text = response.choices[0]?.message?.content || "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(text);
      return {
        solution: ensureString(result.solution) || "See steps below.",
        steps: parseSteps(result.steps),
        explanation: ensureString(result.explanation) || "Review the steps for understanding.",
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch {
      return {
        solution: text.slice(0, 1000) || "Solution generated.",
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

async function solveWithAI(content: string): Promise<SolveResult> {
  try {
    // Use Claude with extended thinking for deeper reasoning
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000,
      },
      system: `You are an expert math and science tutor with deep reasoning abilities. Solve problems thoroughly with clear explanations.

APPROACH:
1. First understand what type of problem this is
2. Identify all given information and unknowns
3. Choose the best solving strategy
4. Work through each step carefully
5. Verify your answer

Respond with ONLY a JSON object:
{
  "solution": "Final answer with units if applicable (use LaTeX like $x = 5$ for math expressions)",
  "steps": [
    {"title": "Understand the problem", "math": "", "reasoning": "This is a [type] problem. We need to find..."},
    {"title": "Identify given values", "math": "", "reasoning": "We're given: ..."},
    {"title": "Apply formula/method", "math": "\\frac{30}{6} = 5", "reasoning": "We use this approach because..."},
    {"title": "Calculate result", "math": "x = 5", "reasoning": "Simplifying gives us..."},
    {"title": "Verify answer", "math": "", "reasoning": "We can check: ..."}
  ],
  "explanation": "Key concepts, formulas, and theorems used. Explain WHY the method works.",
  "problemType": "math" or "science" or "other",
  "graphSpec": null or {"expressions": ["y=2x+1", "y=-x+3"], "title": "Visual representation", "xMin": -10, "xMax": 10, "yMin": -10, "yMax": 10}
}

STEP FORMAT - Each step MUST have all 3 fields:
- "title": Clear description of what we're doing
- "math": LaTeX equation WITHOUT $$ delimiters. Examples: \\frac{a}{b}, x^2, \\sqrt{x}, \\pi, \\int_{a}^{b}
- "reasoning": Explain the WHY - connect this step to the overall solution

GRAPH RULES - ALWAYS include graphSpec when the problem involves:
- Linear equations (y = mx + b)
- Quadratic functions (y = ax² + bx + c) 
- Systems of equations (show all lines/curves)
- Polynomials and rational functions
- Trigonometric functions (sin, cos, tan)
- Exponential/logarithmic functions
- Circles, ellipses, parabolas
- Inequalities (use appropriate regions)

Format expressions for graphing as: "y=2x+1" or "x^2+y^2=4"

Output ONLY valid JSON.`,
      messages: [
        {
          role: "user",
          content: `Solve this problem step-by-step with thorough explanations. Include a graph visualization if the problem involves any equations or functions:\n\n${content}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === "text");
    let text = textContent?.type === "text" ? textContent.text : "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(text);
      return {
        solution: ensureString(result.solution) || "See steps below.",
        steps: parseSteps(result.steps),
        explanation: ensureString(result.explanation) || "Review the steps for understanding.",
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch {
      return {
        solution: text.slice(0, 1000) || "Solution generated.",
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

      if (!mimeType.startsWith("image/")) {
        return res.status(400).json({ error: "Invalid file type. Please upload an image." });
      }

      // Solve directly from image - no extraction step
      const aiResult = await solveFromImage(image, mimeType);
      
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
      res.status(201).json(updated);
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
      res.status(201).json(updated);
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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: `You are a quiz generator. Create a practice quiz from the provided text.

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

Output ONLY valid JSON.`,
        messages: [
          { role: "user", content: `Generate a quiz from this text:\n\n${text.trim()}` }
        ],
      });

      const textContent = response.content.find(block => block.type === "text");
      let responseText = textContent?.type === "text" ? textContent.text : "";
      
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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        system: `You are an expert essay writer. Help students write well-structured essays.

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

Output ONLY valid JSON.`,
        messages: [
          { role: "user", content: `Write an essay about: ${topic.trim()}` }
        ],
      });

      const textContent = response.content.find(block => block.type === "text");
      let responseText = textContent?.type === "text" ? textContent.text : "";
      
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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: systemContext,
        messages: chatMessages,
      });

      const textContent = response.content.find(block => block.type === "text");
      const assistantMessage = textContent?.type === "text" ? textContent.text : "I couldn't process that question. Please try again.";
      messages.push({ role: "assistant", content: assistantMessage });

      await storage.updateSubmission(req.params.id, { messages });

      res.json({ answer: assistantMessage, messages });
    } catch (error) {
      console.error("Follow-up error:", error);
      res.status(500).json({ error: "Failed to process follow-up question" });
    }
  });

  return httpServer;
}
