import { db } from "./db";
import { 
  users, users as usersTable, 
  categories, categories as categoriesTable,
  subjects, subjects as subjectsTable,

  questions, questions as questionsTable,
  attempts, attempts as attemptsTable,
  answers, answers as answersTable,
  userStats, userStats as userStatsTable,
  reviewSchedule, reviewSchedule as reviewScheduleTable,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Subject, type InsertSubject,

  type Question, type InsertQuestion,
  type Attempt, type InsertAttempt,
  type Answer, type InsertAnswer,
  type UserStats, type InsertUserStats,
  type ReviewSchedule, type InsertReviewSchedule
} from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  
  // Questions
  getQuestions(filters?: {category?: number, difficulty?: string}): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Quiz attempts

  startAttempt(userId: number, questionIds: number[]): Promise<Attempt>;

  getAttempt(id: number): Promise<Attempt | undefined>;
  getUserAttempts(userId: number): Promise<Attempt[]>;
  finishAttempt(id: number, score: number, timeSpent: number): Promise<Attempt | undefined>;
  
  // Quiz answers
  submitAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersForAttempt(attemptId: number): Promise<Answer[]>;
  
  // User stats
  getUserStats(userId: number): Promise<UserStats[]>;
  updateUserStats(stats: InsertUserStats): Promise<UserStats>;
  
  // Spaced repetition
  getReviewSchedule(userId: number): Promise<ReviewSchedule[]>;
  scheduleReview(schedule: InsertReviewSchedule): Promise<ReviewSchedule>;
  updateReviewSchedule(id: number, schedule: Partial<InsertReviewSchedule>): Promise<ReviewSchedule | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const [createdUser] = await db.insert(usersTable)
      .values({
        ...user,
        password: hashedPassword
      })
      .returning();
    
    return createdUser;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categoriesTable);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [createdCategory] = await db.insert(categoriesTable)
      .values(category)
      .returning();
    
    return createdCategory;
  }

  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjectsTable);
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [createdSubject] = await db.insert(subjectsTable)
      .values(subject)
      .returning();

    
    return createdSubject;
  }

  async getQuestions(filters?: {category?: number, difficulty?: string, subject?: number}): Promise<Question[]> {
    let query = db.select().from(questionsTable);
    
    if (filters) {
      if (filters.category !== undefined) {
        query = query.where(eq(questionsTable.category, filters.category));
      }
      
      if (filters.difficulty) {
        query = query.where(eq(questionsTable.difficulty, filters.difficulty));
      }
      
      if (filters.subject !== undefined) {
        query = query.where(eq(questionsTable.subject, filters.subject));
      }
    }
    
    return await query;
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    // Handle options if it's an array, convert to JSON string
    const options = typeof question.options === 'string' 
      ? question.options 
      : JSON.stringify(question.options);
    
    const [createdQuestion] = await db.insert(questionsTable)
      .values({
        ...question,
        options
      })
      .returning();
    
    return createdQuestion;
  }

  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    // Handle options if it's provided and is an array
    const updates = { ...question };
    if (updates.options && typeof updates.options !== 'string') {
      updates.options = JSON.stringify(updates.options);
    }
    
    const [updatedQuestion] = await db.update(questionsTable)
      .set(updates)
      .where(eq(questionsTable.id, id))
      .returning();
    
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questionsTable)
      .where(eq(questionsTable.id, id));
    
    return result.count > 0;
  }


  async startAttempt(userId: number, questionIds: number[]): Promise<Attempt> {
    const [attempt] = await db.insert(attemptsTable)
      .values({
        userId,
        totalQuestions: questionIds.length
      })
      .returning();
    
    // Initialize answers (not filled in yet)
    for (const questionId of questionIds) {
      await db.insert(answersTable)
        .values({
          attemptId: attempt.id,
          questionId
        });
    }
    
    return attempt;
  }

  async getAttempt(id: number): Promise<Attempt | undefined> {
    const [attempt] = await db.select().from(attemptsTable).where(eq(attemptsTable.id, id));
    return attempt;
  }

  async getUserAttempts(userId: number): Promise<Attempt[]> {
    return await db.select()
      .from(attemptsTable)
      .where(eq(attemptsTable.userId, userId))
      .orderBy(desc(attemptsTable.startedAt));
  }

  async finishAttempt(id: number, score: number, timeSpent: number): Promise<Attempt | undefined> {
    const [updatedAttempt] = await db.update(attemptsTable)
      .set({
        finishedAt: new Date(),
        score,
        timeSpent
      })
      .where(eq(attemptsTable.id, id))
      .returning();
    
    return updatedAttempt;
  }

  async submitAnswer(answer: InsertAnswer): Promise<Answer> {
    const [submittedAnswer] = await db.insert(answersTable)
      .values({
        ...answer,
        answeredAt: new Date()
      })
      .returning();
    
    return submittedAnswer;
  }

  async getAnswersForAttempt(attemptId: number): Promise<Answer[]> {
    return await db.select()
      .from(answersTable)
      .where(eq(answersTable.attemptId, attemptId));
  }

  async getUserStats(userId: number): Promise<UserStats[]> {
    return await db.select()
      .from(userStatsTable)
      .where(eq(userStatsTable.userId, userId));
  }

  async updateUserStats(stats: InsertUserStats): Promise<UserStats> {
    // Check if stats already exist for this user and category
    const [existingStats] = await db.select()
      .from(userStatsTable)
      .where(
        and(
          eq(userStatsTable.userId, stats.userId),
          eq(userStatsTable.categoryId, stats.categoryId)
        )
      );
    
    if (existingStats) {
      // Update existing stats
      const [updatedStats] = await db.update(userStatsTable)
        .set({
          ...stats,
          lastAttempt: new Date()
        })
        .where(eq(userStatsTable.id, existingStats.id))
        .returning();
      
      return updatedStats;
    } else {
      // Insert new stats
      const [newStats] = await db.insert(userStatsTable)
        .values({
          ...stats,
          lastAttempt: new Date()
        })
        .returning();
      
      return newStats;
    }
  }

  async getReviewSchedule(userId: number): Promise<ReviewSchedule[]> {
    return await db.select()
      .from(reviewScheduleTable)
      .where(eq(reviewScheduleTable.userId, userId));
  }

  async scheduleReview(schedule: InsertReviewSchedule): Promise<ReviewSchedule> {
    // Check if a schedule already exists for this user and question
    const [existingSchedule] = await db.select()
      .from(reviewScheduleTable)
      .where(
        and(
          eq(reviewScheduleTable.userId, schedule.userId),
          eq(reviewScheduleTable.questionId, schedule.questionId)
        )
      );
    
    if (existingSchedule) {
      // Update existing schedule
      const [updatedSchedule] = await db.update(reviewScheduleTable)
        .set(schedule)
        .where(eq(reviewScheduleTable.id, existingSchedule.id))
        .returning();
      
      return updatedSchedule;
    } else {
      // Insert new schedule
      const [newSchedule] = await db.insert(reviewScheduleTable)
        .values(schedule)
        .returning();
      
      return newSchedule;
    }
  }

  async updateReviewSchedule(id: number, schedule: Partial<InsertReviewSchedule>): Promise<ReviewSchedule | undefined> {
    const [updatedSchedule] = await db.update(reviewScheduleTable)
      .set(schedule)
      .where(eq(reviewScheduleTable.id, id))
      .returning();
    
    return updatedSchedule;
  }
}

// Export a singleton instance of the storage interface
export const storage = new DatabaseStorage();
