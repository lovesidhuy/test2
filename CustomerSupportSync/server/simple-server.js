import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// In-memory storage for quiz sessions and results
const attempts = {};
const answers = {};

// Load questions from JSON
let QUESTIONS = [];
try {
  const questionsPath = path.join(__dirname, '../client/public/questions.json');
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
      q => q.category === parseInt(req.query.category)
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
      name: getCategoryName(id),
      color: getCategoryColor(id)
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
    const questionsPath = path.join(__dirname, '../client/public/questions.json');
    const data = fs.readFileSync(questionsPath, 'utf8');
    QUESTIONS = JSON.parse(data);
    console.log(`Reloaded ${QUESTIONS.length} questions from JSON file`);
    res.json({ success: true, count: QUESTIONS.length });
  } catch (error) {
    console.error("Error reloading questions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions for category data
function getCategoryName(id) {
  const categories = {
    1: 'JavaScript',
    2: 'React',
    3: 'Python',
    4: 'Data Structures',
    5: 'Algorithms'
  };
  return categories[id] || `Category ${id}`;
}

function getCategoryColor(id) {
  const colors = {
    1: '#f7df1e', // JavaScript yellow
    2: '#61dafb', // React blue
    3: '#3776ab', // Python blue
    4: '#4caf50', // Green for Data Structures
    5: '#ff5722'  // Orange for Algorithms
  };
  return colors[id] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

// SPA fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Quiz server running on port ${PORT}`);
});

export default app;
