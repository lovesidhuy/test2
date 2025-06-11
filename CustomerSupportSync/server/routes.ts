import { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import fs from "fs";
import path from "path";

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "quiz_app_secret_key";

// Load initial questions from JSON if the database is empty
async function seedQuestionsIfEmpty() {
  try {
    // Check if there are any questions in the database
    const existingQuestions = await storage.getQuestions();
    
    if (existingQuestions.length === 0) {
      console.log('No questions found in database, seeding from JSON file...');
      
      // Load questions from the JSON file
      const questionsPath = path.join(process.cwd(), "client/public/questions.json");
      const data = fs.readFileSync(questionsPath, 'utf8');
      const questions = JSON.parse(data);
      
      // Create default categories if they don't exist
      const categories = [
        { id: 1, name: 'JavaScript', color: '#f7df1e' },
        { id: 2, name: 'React', color: '#61dafb' },
        { id: 3, name: 'Python', color: '#3776ab' },
        { id: 4, name: 'Data Structures', color: '#4caf50' },
        { id: 5, name: 'Algorithms', color: '#ff5722' }
      ];
      
      for (const category of categories) {
        const existingCategory = await storage.getCategoryById(category.id);
        if (!existingCategory) {
          await storage.createCategory({ name: category.name, color: category.color });
          console.log(`Created category: ${category.name}`);
        }
      }
      
      // Import each question
      for (const question of questions) {
        await storage.createQuestion({
          question: question.question,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          category: question.category,
          difficulty: question.difficulty
        });
      }
      
      console.log(`Successfully imported ${questions.length} questions`);
    }
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
}

// Token validation middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.body.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create default subjects if needed
  try {
    const subjects = await storage.getSubjects();
    if (subjects.length === 0) {
      // Create some default subjects
      const defaultSubjects = [
        { name: "JavaScript", description: "JavaScript programming language questions" },
        { name: "React", description: "React framework and library questions" },
        { name: "Data Structures", description: "Common data structures and algorithms" }
      ];
      
      for (const subject of defaultSubjects) {
        await storage.createSubject(subject);
        console.log(`Created subject: ${subject.name}`);
      }
    }
  } catch (error) {
    console.error("Error creating default subjects:", error);
  }
  // Create HTTP server
  const server = createServer(app);
  
  // Seed initial data if needed
  await seedQuestionsIfEmpty();

  // User authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, displayName } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create user
      const user = await storage.createUser({
        username,
        password, // Will be hashed in storage
        email,
        displayName
      });

      // Create token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '24h'
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error registering user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '24h'
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Error logging in" });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.body.user;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Subjects endpoints
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json({ subjects });
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ message: "Error fetching subjects" });
    }
  });

  app.post('/api/subjects', async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Validate input
      if (!name) {
        return res.status(400).json({ message: "Subject name is required" });
      }
      
      const subject = await storage.createSubject({ name, description });
      res.status(201).json({ subject });
    } catch (error) {
      console.error("Create subject error:", error);
      res.status(500).json({ message: "Error creating subject" });
    }
  });



  // Import questions endpoint
  app.post('/api/import/questions', async (req, res) => {
    try {
      const { questions, subjectId } = req.body;
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "No questions provided" });
      }
      
      // Import each question
      const importedQuestions = [];
      for (const q of questions) {
        // Format options as a JSON string if it's an array
        const options = Array.isArray(q.options) ? JSON.stringify(q.options) : q.options;
        
        const question = await storage.createQuestion({
          question: q.question,
          options,
          answer: q.answer,
          explanation: q.explanation || null,
          category: q.category || null,
          subject: subjectId || null,
          difficulty: q.difficulty || 'medium'
        });
        
        importedQuestions.push(question);
      }
      
      res.status(201).json({ 
        message: `Successfully imported ${importedQuestions.length} questions`, 
        questions: importedQuestions
      });
    } catch (error) {
      console.error("Import questions error:", error);
      res.status(500).json({ message: "Error importing questions" });
    }
  });

  // Categories endpoints
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json({ categories });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  // Subjects endpoints
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json({ subjects });
    } catch (error) {
      console.error("Get subjects error:", error);
      res.status(500).json({ message: "Error fetching subjects" });
    }
  });
  
  app.post('/api/subjects', async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Subject name is required" });
      }
      
      const subject = await storage.createSubject({ name });
      res.status(201).json({ subject });
    } catch (error) {
      console.error("Create subject error:", error);
      res.status(500).json({ message: "Error creating subject" });
    }
  });


  // Questions endpoints
  app.get('/api/questions', async (req, res) => {
    try {
      const { category, difficulty, subject } = req.query;
      const filters: { category?: number; difficulty?: string; subject?: number } = {};

      if (category) filters.category = Number(category);
      if (difficulty) filters.difficulty = difficulty as string;
      if (subject) filters.subject = Number(subject);

      const questions = await storage.getQuestions(filters);
      
      // Parse options from JSON string
      const parsedQuestions = questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      res.json({ questions: parsedQuestions });
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ message: "Error fetching questions" });
    }
  });

  // Quiz attempts endpoints
  app.post('/api/quiz/start', async (req, res) => {
    try {
      // For simplicity in our demo, allow guest mode without authentication
      const userId = req.body.user?.userId || 1; // Use user ID if authenticated, or default to 1
    const { questionIds, quizSetId } = req.body;

      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ message: "Question IDs are required" });
      }


      const attempt = await storage.startAttempt(userId, questionIds);

      // Get questions for the attempt
      const questions = await Promise.all(
        questionIds.map(async id => {
          const question = await storage.getQuestionById(id);
          if (!question) return null;
          return {
            ...question,
            options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
            // Remove the answer to prevent cheating
            answer: undefined
          };
        })
      );

      // Filter out any questions that couldn't be found
      const validQuestions = questions.filter(q => q !== null);

      res.status(201).json({ 
        attemptId: attempt.id,
        questions: validQuestions
      });
    } catch (error) {
      console.error("Start quiz error:", error);
      res.status(500).json({ message: "Error starting quiz" });
    }
  });

  app.post('/api/quiz/:id/answer', async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const { questionId, chosenAnswer, timeSpent, isLast } = req.body;

      // Validate inputs
      if (questionId === undefined || chosenAnswer === undefined) {
        return res.status(400).json({ message: "Question ID and chosen answer are required" });
      }

      // Get the question to check if answer is correct
      const question = await storage.getQuestionById(questionId);

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Check if answer is correct
      const correct = question.answer === chosenAnswer;

      // Submit the answer
      await storage.submitAnswer({
        attemptId,
        questionId,
        chosenAnswer,
        correct,
        timeSpent: timeSpent || 0
      });

      // If this is the last question, finish the attempt
      if (isLast) {
        // Get all answers for this attempt to calculate score
        const answers = await storage.getAnswersForAttempt(attemptId);
        const correctAnswers = answers.filter(a => a.correct).length;
        const totalAnswers = answers.length;
        const score = Math.round((correctAnswers / totalAnswers) * 100);
        
        // Calculate total time spent
        const totalTimeSpent = answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);
        
        // Update the attempt
        await storage.finishAttempt(attemptId, score, totalTimeSpent);
      }

      res.json({ 
        correct,
        correctAnswer: question.answer,
        explanation: question.explanation 
      });
    } catch (error) {
      console.error("Submit answer error:", error);
      res.status(500).json({ message: "Error submitting answer" });
    }
  });

  app.get('/api/quiz/:id', async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attempt = await storage.getAttempt(attemptId);

      if (!attempt) {
        return res.status(404).json({ message: "Quiz attempt not found" });
      }

      // Get answers for this attempt
      const answers = await storage.getAnswersForAttempt(attemptId);

      // Get the questions
      const questions = await Promise.all(
        answers.map(async answer => {
          const question = await storage.getQuestionById(answer.questionId);
          if (!question) return null;
          return {
            ...question,
            options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
            chosen: answer.chosenAnswer,
            correct: answer.correct,
            timeSpent: answer.timeSpent
          };
        })
      );

      // Filter out any questions that couldn't be found
      const validQuestions = questions.filter(q => q !== null);

      res.json({ 
        attempt,
        questions: validQuestions
      });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({ message: "Error fetching quiz" });
    }
  });

  app.post('/api/quiz/finish', async (req, res) => {
    try {
      // For simplicity in our demo, allow guest mode without authentication
      const userId = req.body.user?.userId || 1; // Use user ID if authenticated, or default to 1

      const { questionIds, score, answers } = req.body;

      
      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ message: "Question IDs are required" });
      }
      
      // Create a new attempt


      const attempt = await storage.startAttempt(userId, questionIds);
      
      // Record all answers
      if (answers && Array.isArray(answers)) {
        for (const answer of answers) {
          const question = await storage.getQuestionById(answer.questionId);
          if (question) {
            const correct = question.answer === answer.answer;
            
            await storage.submitAnswer({
              attemptId: attempt.id,
              questionId: answer.questionId,
              chosenAnswer: answer.answer,
              correct,
              timeSpent: 0 // We could track time per question in a future version
            });
          }
        }
      }
      
      // Finish the attempt with the provided score
      const finishedAttempt = await storage.finishAttempt(
        attempt.id, 
        score || 0, 
        0 // We could track total time in a future version
      );
      
      res.status(201).json({ 
        attemptId: attempt.id,
        success: true 
      });
    } catch (error) {
      console.error("Finish quiz error:", error);
      res.status(500).json({ message: "Error finishing quiz" });
    }
  });

  app.get('/api/attempts', async (req, res) => {
    try {
      // For simplicity in our demo, allow guest mode without authentication
      const userId = req.body.user?.userId || 1; // Use user ID if authenticated, or default to 1
      const attempts = await storage.getUserAttempts(userId);
      res.json({ attempts });
    } catch (error) {
      console.error("Get attempts error:", error);
      res.status(500).json({ message: "Error fetching attempts" });
    }
  });

  app.get('/api/user/stats', async (req, res) => {
    try {
      // For simplicity in our demo, allow guest mode without authentication
      const userId = req.body.user?.userId || 1; // Use user ID if authenticated, or default to 1
      const stats = await storage.getUserStats(userId);
      
      // Enhance the stats with category info
      const enhancedStats = await Promise.all(
        stats.map(async stat => {
          const category = await storage.getCategoryById(stat.categoryId);
          return {
            ...stat,
            category: category ? {
              id: category.id,
              name: category.name,
              color: category.color
            } : undefined
          };
        })
      );
      
      res.json({ stats: enhancedStats });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Error fetching user stats" });
    }
  });

  // Import questions endpoint
  app.post('/api/import/questions', async (req, res) => {
    try {
      const { questions, subjectId } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Invalid questions format" });
      }
      
      if (!subjectId) {
        return res.status(400).json({ message: "Subject ID is required" });
      }
      
      // Validate the subject exists
      const subject = await storage.getSubjectById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Process and save each question
      const importedQuestions = [];
      
      for (const q of questions) {
        // Validate question format
        if (!q.question || !q.options || !Array.isArray(q.options) || q.answer === undefined) {
          console.warn("Skipping invalid question:", q);
          continue;
        }
        
        try {
          // Create the question with subject reference
          const newQuestion = await storage.createQuestion({
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation || null,
            category: q.category || null,
            difficulty: q.difficulty || "medium",
            subject: subjectId
          });
          
          importedQuestions.push(newQuestion);
        } catch (err) {
          console.error("Error importing question:", err);
        }
      }
      
      res.status(201).json({ 
        success: true,
        count: importedQuestions.length,
        questions: importedQuestions 
      });
    } catch (error) {
      console.error("Import questions error:", error);
      res.status(500).json({ message: "Error importing questions" });
    }
  });

  app.get('/api/reviews', async (req, res) => {
    try {
      // For simplicity in our demo, allow guest mode without authentication
      const userId = req.body.user?.userId || 1; // Use user ID if authenticated, or default to 1
      
      // Get scheduled reviews
      const reviews = await storage.getReviewSchedule(userId);
      
      // Only include reviews that are due today or earlier
      const now = new Date();
      const dueReviews = reviews.filter(review => {
        const reviewDate = new Date(review.nextReview || '');
        return reviewDate <= now;
      });
      
      // Get the full questions
      const reviewDetails = await Promise.all(
        dueReviews.map(async review => {
          const question = await storage.getQuestionById(review.questionId);
          if (!question) return null;
          
          const category = question.category 
            ? await storage.getCategoryById(question.category)
            : null;
          
          return {
            id: review.id,
            questionId: question.id,
            question: question.question,
            difficulty: question.difficulty,
            category: category ? {
              id: category.id,
              name: category.name,
              color: category.color
            } : null,
            dueDate: review.nextReview,
            interval: review.interval
          };
        })
      );
      
      // Filter out any null values
      const validReviews = reviewDetails.filter(r => r !== null);
      
      res.json({ reviews: validReviews });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Error fetching reviews" });
    }
  });

  return server;
}
