import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema, evaluationSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

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

interface SolveResult {
  solution: string;
  steps: string[];
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

async function solveFromImage(base64Image: string, mimeType: string): Promise<SolveResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert tutor. Solve the homework problem in the image completely.

Respond with ONLY a JSON object:
{
  "solution": "Final answer as a string",
  "steps": ["Step 1: ...", "Step 2: ..."],
  "explanation": "Key concepts",
  "problemType": "math" or "science" or "other",
  "graphSpec": null or {"expressions": ["y=2x+1", "y=x^2"], "title": "Graph", "xMin": -10, "xMax": 10, "yMin": -10, "yMax": 10}
}

RULES:
- All text fields MUST be simple strings
- problemType: use "math" for algebra, calculus, geometry; "science" for physics, chemistry; "other" for everything else
- graphSpec: ONLY include if the problem involves graphable functions, equations, or inequalities. Use Desmos-compatible expressions (e.g., "y=2x+1", "y=x^2-4", "y=sin(x)")
- If multiple questions, combine answers into one solution string
- Output ONLY valid JSON`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Solve this problem completely. Include graphSpec if it involves graphable equations.",
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
      max_tokens: 4096,
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
        steps: ensureStringArray(result.steps),
        explanation: ensureString(result.explanation) || "Review the steps for understanding.",
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch {
      return {
        solution: text.slice(0, 1000) || "Solution generated.",
        steps: ["Review the answer above."],
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
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: `You are an expert tutor. Solve the homework problem completely.

Respond with ONLY a JSON object:
{
  "solution": "Final answer as a string",
  "steps": ["Step 1: ...", "Step 2: ..."],
  "explanation": "Key concepts",
  "problemType": "math" or "science" or "other",
  "graphSpec": null or {"expressions": ["y=2x+1", "y=x^2"], "title": "Graph", "xMin": -10, "xMax": 10, "yMin": -10, "yMax": 10}
}

RULES:
- All text fields MUST be simple strings
- problemType: use "math" for algebra, calculus, geometry; "science" for physics, chemistry; "other" for everything else
- graphSpec: ONLY include if the problem involves graphable functions, equations, or inequalities. Use Desmos-compatible expressions (e.g., "y=2x+1", "y=x^2-4", "y=sin(x)")
- If multiple questions, combine answers into one solution string
- Output ONLY valid JSON`,
      messages: [
        {
          role: "user",
          content: `Solve this problem completely. Include graphSpec if it involves graphable equations:\n\n${content}`,
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
        steps: ensureStringArray(result.steps),
        explanation: ensureString(result.explanation) || "Review the steps for understanding.",
        problemType: result.problemType || "other",
        graphSpec: result.graphSpec || undefined,
      };
    } catch {
      return {
        solution: text.slice(0, 1000) || "Solution generated.",
        steps: ["Review the answer above."],
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
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.post("/api/submissions", async (req, res) => {
    try {
      const parsed = insertSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const submission = await storage.createSubmission(parsed.data);
      
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
        assignmentId: "general",
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
        assignmentId: "general",
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
      const parsed = evaluationSchema.omit({ submissionId: true }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      const updated = await storage.updateSubmission(req.params.id, {
        status: "teacher_reviewed",
        teacherScore: parsed.data.teacherScore,
        teacherFeedback: parsed.data.teacherFeedback,
        reviewedAt: new Date().toISOString(),
      });

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

      const messages = submission.messages || [];
      messages.push({ role: "user", content: question });

      const systemContext = `You are a helpful tutor. The student previously submitted this problem:
      
${submission.content}

And you provided this solution:
${submission.aiSolution}

Steps: ${submission.aiSteps?.join("\n")}

Explanation: ${submission.aiExplanation}

Now the student has a follow-up question. Answer it clearly and helpfully to deepen their understanding.`;

      const chatMessages: Array<{role: "user" | "assistant", content: string}> = messages.map(m => ({ 
        role: m.role as "user" | "assistant", 
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
