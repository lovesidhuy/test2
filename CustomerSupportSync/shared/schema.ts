import { mysqlTable, text, serial, int, timestamp, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Categories for questions
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  color: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Subjects for organizing question sets
export const subjects = mysqlTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  description: true,
});

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

// Question model with difficulty, category, and subject
export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON string of options array
  answer: int("answer").notNull(), // Index of correct answer
  explanation: text("explanation"), // Explanation of the answer
  category: int("category").references(() => categories.id),
  subject: int("subject").references(() => subjects.id),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  question: true,
  options: true,
  answer: true,
  explanation: true,
  category: true,
  subject: true,
  difficulty: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Quiz attempts
export const attempts = mysqlTable("attempts", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
  score: int("score"),
  totalQuestions: int("total_questions").notNull(),
  timeSpent: int("time_spent"), // in seconds
});

export const insertAttemptSchema = createInsertSchema(attempts).pick({
  userId: true,
  totalQuestions: true,
});

export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;

// Quiz answers for each attempt
export const answers = mysqlTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: int("attempt_id").references(() => attempts.id),
  questionId: int("question_id").references(() => questions.id),
  chosenAnswer: int("chosen_answer"),
  correct: boolean("correct"),
  timeSpent: int("time_spent"), // in seconds
  answeredAt: timestamp("answered_at"),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  attemptId: true,
  questionId: true,
  chosenAnswer: true,
  correct: true,
  timeSpent: true,
});

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

// User performance stats by category
export const userStats = mysqlTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  categoryId: int("category_id").references(() => categories.id),
  totalAttempts: int("total_attempts").default(0),
  correctAnswers: int("correct_answers").default(0),
  avgTimePerQuestion: int("avg_time_per_question"),
  lastAttempt: timestamp("last_attempt"),
  streak: int("streak").default(0),
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  categoryId: true,
  totalAttempts: true,
  correctAnswers: true,
  avgTimePerQuestion: true,
  streak: true,
});

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

// Spaced repetition for user learning
export const reviewSchedule = mysqlTable("review_schedule", {
  id: serial("id").primaryKey(),
  userId: int("user_id").references(() => users.id),
  questionId: int("question_id").references(() => questions.id),
  nextReview: timestamp("next_review"),
  interval: int("interval").default(1), // days until next review
  easeFactor: int("ease_factor").default(250), // multiplier for spaced repetition
  consecutive: int("consecutive").default(0), // consecutive correct answers
});

export const insertReviewScheduleSchema = createInsertSchema(reviewSchedule).pick({
  userId: true,
  questionId: true,
  nextReview: true,
  interval: true,
  easeFactor: true,
  consecutive: true,
});

export type InsertReviewSchedule = z.infer<typeof insertReviewScheduleSchema>;
export type ReviewSchedule = typeof reviewSchedule.$inferSelect;
