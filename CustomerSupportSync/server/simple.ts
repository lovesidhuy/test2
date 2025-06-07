import express from "express";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

// Create a simple server that doesn't use a database
const app = express();
app.use(express.json());

// In-memory storage for attempts
const attempts: Record<string, any> = {};
const answers: Record<string, any[]> = {};

// Load questions from JSON file
let QUESTIONS: any[] = [];
try {
  const questionsPath = path.join(process.cwd(), "client/public/questions.json");
  const data = fs.readFileSync(questionsPath, 'utf8');
  QUESTIONS = JSON.parse(data);
  console.log(`Loaded ${QUESTIONS.length} questions from JSON file`);
} catch (error) {
  console.error("Error loading questions:", error);
  QUESTIONS = []; // Default to empty array if file not found
}

// API Routes

// Get all questions (with optional filters)
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
  
  // Get the full questions but remove answers and explanations
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

// Get all past attempts
app.get('/api/attempts', (req, res) => {
  const allAttempts = Object.values(attempts);
  res.json({ attempts: allAttempts });
});

// Get all categories derived from questions
app.get('/api/categories', (req, res) => {
  // Extract unique categories from questions
  const uniqueCategories = Array.from(
    new Set(QUESTIONS.map(q => q.category))
  ).filter(Boolean);
  
  const categories = uniqueCategories.map(id => {
    // Map category IDs to names
    const categoryName = getCategoryName(id as number);
    return {
      id,
      name: categoryName,
      color: getCategoryColor(id as number)
    };
  });
  
  res.json({ categories });
});

// Simple auth (no real auth, just return token for any username/password)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  res.json({
    user: {
      id: 1,
      username,
      displayName: username,
      email: `${username}@example.com`
    },
    token: 'dummy-token'
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, email, displayName } = req.body;
  
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: 1,
      username,
      displayName: displayName || username,
      email: email || `${username}@example.com`
    }
  });
});

app.get('/api/auth/user', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Just return a dummy user
  res.json({
    user: {
      id: 1,
      username: 'user',
      displayName: 'Test User',
      email: 'user@example.com'
    }
  });
});

// Stub for user stats endpoint
app.get('/api/user/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Generate stats based on categories in questions
  const uniqueCategories = Array.from(
    new Set(QUESTIONS.map(q => q.category))
  ).filter(Boolean);
  
  const stats = uniqueCategories.map(categoryId => {
    return {
      id: Math.floor(Math.random() * 1000),
      userId: 1,
      categoryId,
      totalAttempts: Math.floor(Math.random() * 10) + 1,
      correctAnswers: Math.floor(Math.random() * 20) + 5,
      avgTimePerQuestion: Math.floor(Math.random() * 30) + 10,
      streak: Math.floor(Math.random() * 5),
      category: {
        id: categoryId,
        name: getCategoryName(categoryId as number),
        color: getCategoryColor(categoryId as number)
      }
    };
  });
  
  res.json({ stats });
});

// Reviews endpoint stub
app.get('/api/reviews', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.json({ reviews: [] });
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

export default app;
