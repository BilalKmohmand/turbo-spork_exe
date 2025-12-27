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

async function solveFromImage(base64Image: string, mimeType: string): Promise<{
  solution: string;
  steps: string[];
  explanation: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert tutor. Look at the homework problem in the image and solve it completely.

If there are MULTIPLE questions, solve ALL of them and combine into ONE response.

Respond with ONLY a JSON object:
{"solution": "Final answer(s) as a single string", "steps": ["Step 1: ...", "Step 2: ..."], "explanation": "Key concepts as a single string"}

CRITICAL RULES:
- solution MUST be a simple string, not an object
- steps MUST be an array of strings
- explanation MUST be a simple string
- If multiple questions, format solution as "Q1: answer1, Q2: answer2" etc.
- Output ONLY valid JSON`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Solve this homework problem. Return JSON with solution as a string, steps as string array, explanation as a string.",
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
    
    // Extract JSON from response
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
      };
    } catch {
      return {
        solution: text.slice(0, 1000) || "Solution generated.",
        steps: ["Review the answer above."],
        explanation: "The problem has been solved.",
      };
    }
  } catch (error: any) {
    console.error("Image solving error:", error?.message || error);
    throw new Error("Failed to solve: " + (error?.message || "Please try a clearer photo"));
  }
}

async function solveWithAI(content: string): Promise<{
  solution: string;
  steps: string[];
  explanation: string;
}> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: `You are an expert tutor that solves homework problems. You MUST respond with valid JSON only - no other text.

Solve the given problem and respond with this exact JSON structure:
{"solution": "final answer here", "steps": ["Step 1: description", "Step 2: description"], "explanation": "key concepts"}

Rules:
- Output ONLY the JSON object, nothing else
- No markdown, no explanations outside JSON
- Include 3-6 clear steps
- Make the solution educational`,
      messages: [
        {
          role: "user",
          content: `Solve this problem and respond with JSON only:\n\n${content}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === "text");
    let text = textContent?.type === "text" ? textContent.text : "";
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    try {
      const result = JSON.parse(text);
      return {
        solution: result.solution || "See steps below.",
        steps: Array.isArray(result.steps) ? result.steps : ["Solution provided above."],
        explanation: result.explanation || "Review the steps for understanding.",
      };
    } catch {
      // If JSON parsing fails, use the raw text as the solution
      return {
        solution: text.slice(0, 500) || "Solution generated.",
        steps: ["The AI provided a response but it wasn't in the expected format."],
        explanation: "Please review the solution above.",
      };
    }
  } catch (error: any) {
    console.error("AI solution error:", error?.message || error);
    return {
      solution: "Unable to solve at this time.",
      steps: ["Please try uploading a clearer image or a different problem."],
      explanation: "There was an issue with the AI. Please try again.",
    };
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
      });

      const updated = await storage.getSubmission(submission.id);
      res.status(201).json(updated);
    } catch (error: any) {
      console.error("Image submission error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Failed to process image" });
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
