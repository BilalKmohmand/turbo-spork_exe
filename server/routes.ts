import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema, evaluationSchema } from "@shared/schema";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

async function solveWithAI(content: string): Promise<{
  solution: string;
  steps: string[];
  explanation: string;
}> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: `You are an expert tutor that solves homework problems step by step.
When given a problem (math, science, essay question, code, etc.), provide:
1. The final answer/solution
2. Step-by-step breakdown of how to solve it
3. A brief explanation of the key concepts involved

Make your explanations clear and educational. Help the student understand HOW to solve similar problems.

Respond in JSON format only:
{
  "solution": "The final answer or solution",
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "explanation": "Brief explanation of key concepts and methods used"
}`,
      messages: [
        {
          role: "user",
          content: `Please solve this problem step by step:\n\n${content}`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === "text");
    const text = textContent?.type === "text" ? textContent.text : "{}";
    const result = JSON.parse(text);
    
    return {
      solution: result.solution || "Solution processed.",
      steps: result.steps || ["The problem has been analyzed."],
      explanation: result.explanation || "Review the solution steps above for understanding.",
    };
  } catch (error) {
    console.error("AI solution error:", error);
    return {
      solution: "Unable to process at this time.",
      steps: ["Please try again or rephrase your question."],
      explanation: "There was an issue processing your request.",
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
