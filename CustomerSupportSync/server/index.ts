import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

// Create our simple Express app
const app = express();
app.use(express.json());

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// In-memory storage for quiz sessions and results
const attempts: Record<string, any> = {};
const answers: Record<string, any[]> = {};

// Load questions from JSON
let QUESTIONS: any[] = [];
try {
  const questionsPath = path.join(process.cwd(), "client/public/questions.json");
  const data = fs.readFileSync(questionsPath, 'utf8');
  QUESTIONS = JSON.parse(data);
  console.log(`Loaded ${QUESTIONS.length} questions from JSON file`);
} catch (error) {
  console.error("Error loading questions:", error);
}

// API Routes
// Get all questions (optionally filtered)
app.get('/api/questions', (req, res) => {
  let filteredQuestions = [...QUESTIONS];
  
  // Apply category filter if provided
  if (req.query.category) {
    filteredQuestions = filteredQuestions.filter(
      q => q.category === parseInt(req.query.category as string)
    );
  }
  
  // Apply difficulty filter if provided
  if (req.query.difficulty) {
    filteredQuestions = filteredQuestions.filter(
      q => q.difficulty === req.query.difficulty
    );
  }
  
  res.json({ questions: filteredQuestions });
});

// Get categories derived from questions
app.get('/api/categories', (req, res) => {
  // Extract unique categories from questions
  const categoryIds = Array.from(
    new Set(QUESTIONS.map(q => q.category))
  ).filter(Boolean);
  
  const categories = categoryIds.map(id => {
    return {
      id,
      name: getCategoryName(id as number),
      color: getCategoryColor(id as number)
    };
  });
  
  res.json({ categories });
});

// Start a new quiz attempt
app.post('/api/quiz/start', (req, res) => {
  const user = req.body.username || 'guest';
  const questionIds = req.body.questionIds || QUESTIONS.map(q => q.id);
  
  const attemptId = uuid();
  const startedAt = new Date().toISOString();
  
  attempts[attemptId] = {
    id: attemptId,
    user,
    startedAt,
    totalQuestions: questionIds.length
  };
  
  answers[attemptId] = [];
  
  // Get the full questions but remove answers to prevent cheating
  const quizQuestions = QUESTIONS
    .filter(q => questionIds.includes(q.id))
    .map(q => {
      const { answer, explanation, ...rest } = q;
      return rest;
    });
  
  res.json({ attemptId, questions: quizQuestions });
});

// Submit answer for a question
app.post('/api/quiz/:attemptId/answer', (req, res) => {
  const { attemptId } = req.params;
  const { questionId, chosenAnswer, timeSpent, isLast } = req.body;
  
  if (!attempts[attemptId]) {
    return res.status(404).json({ message: 'Attempt not found' });
  }
  
  // Find the question
  const question = QUESTIONS.find(q => q.id === questionId);
  
  if (!question) {
    return res.status(400).json({ message: 'Question not found' });
  }
  
  const correct = question.answer === chosenAnswer;
  
  // Store answer
  answers[attemptId].push({
    questionId,
    chosenAnswer,
    correct,
    timeSpent: timeSpent || 0
  });
  
  // If this is the last question, update the attempt with completion data
  if (isLast) {
    const correctAnswers = answers[attemptId].filter(a => a.correct).length;
    const score = Math.round((correctAnswers / attempts[attemptId].totalQuestions) * 100);
    
    attempts[attemptId] = {
      ...attempts[attemptId],
      finishedAt: new Date().toISOString(),
      score,
      timeSpent: answers[attemptId].reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    };
  }
  
  res.json({
    correct,
    correctAnswer: question.answer,
    explanation: question.explanation
  });
});

// Get a quiz attempt (for review)
app.get('/api/quiz/:attemptId', (req, res) => {
  const { attemptId } = req.params;
  const attempt = attempts[attemptId];
  
  if (!attempt) {
    return res.status(404).json({ message: 'Attempt not found' });
  }
  
  // For review, include the answers and full question data
  const attemptAnswers = answers[attemptId] || [];
  const questions = QUESTIONS
    .filter(q => attemptAnswers.some(a => a.questionId === q.id))
    .map(q => {
      const answer = attemptAnswers.find(a => a.questionId === q.id);
      return {
        ...q,
        chosen: answer ? answer.chosenAnswer : undefined,
        correct: answer ? answer.correct : undefined,
        timeSpent: answer ? answer.timeSpent : undefined
      };
    });
  
  res.json({ attempt, questions });
});

// Get all past quiz attempts
app.get('/api/attempts', (req, res) => {
  const allAttempts = Object.values(attempts);
  res.json({ attempts: allAttempts });
});

// Custom endpoint to reload questions from JSON
app.post('/api/reload-questions', (req, res) => {
  try {
    const questionsPath = path.join(process.cwd(), "client/public/questions.json");
    const data = fs.readFileSync(questionsPath, 'utf8');
    QUESTIONS = JSON.parse(data);
    console.log(`Reloaded ${QUESTIONS.length} questions from JSON file`);
    res.json({ success: true, count: QUESTIONS.length });
  } catch (error: any) {
    console.error("Error reloading questions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions for category data
function getCategoryName(id: number): string {
  const categories: Record<number, string> = {
    1: 'JavaScript',
    2: 'React',
    3: 'Python',
    4: 'Data Structures',
    5: 'Algorithms'
  };
  return categories[id] || `Category ${id}`;
}

function getCategoryColor(id: number): string {
  const colors: Record<number, string> = {
    1: '#f7df1e', // JavaScript yellow
    2: '#61dafb', // React blue
    3: '#3776ab', // Python blue
    4: '#4caf50', // Green for Data Structures
    5: '#ff5722'  // Orange for Algorithms
  };
  return colors[id] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

(async () => {
  // Create HTTP server
  const server = createServer(app);

  // Importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    //@ts-ignore
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
