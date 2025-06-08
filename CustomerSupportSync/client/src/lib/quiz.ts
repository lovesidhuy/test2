import { apiRequest } from './queryClient';

interface QuizParams {
  categoryId?: number;
  difficulty?: string;
  questionCount?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer?: number; // Only available in review mode
  explanation?: string;
  category?: number;
  difficulty: string;
  chosen?: number;
  correct?: boolean;
  timeSpent?: number;
}

export interface QuizAttempt {
  id: number;
  userId: number;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  totalQuestions: number;
  timeSpent?: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  categoryPerformance: {
    categoryId: number;
    name: string;
    color: string;
    score: number;
    questionsCount: number;
  }[];
}

/**
 * Starts a new quiz session
 */
export async function startQuiz(params: QuizParams = {}): Promise<{ attemptId: number; questions: QuizQuestion[] }> {
  try {
    // Fetch questions based on params
    let questionsEndpoint = '/api/questions';
    const queryParams = [];
    
    if (params.categoryId) {
      queryParams.push(`category=${params.categoryId}`);
    }
    
    if (params.difficulty) {
      queryParams.push(`difficulty=${params.difficulty}`);
    }
    
    if (queryParams.length > 0) {
      questionsEndpoint += `?${queryParams.join('&')}`;
    }
    
    const questionsResponse = await apiRequest('GET', questionsEndpoint);
    const questionsData = await questionsResponse.json();
    
    if (!questionsData.questions || questionsData.questions.length === 0) {
      throw new Error('No questions available for these criteria');
    }
    
    // Select random questions if questionCount is specified
    const selectedQuestions = params.questionCount
      ? questionsData.questions
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(params.questionCount, questionsData.questions.length))
      : questionsData.questions;
    
    // Start a quiz attempt with these questions
    const response = await apiRequest(
      'POST',
      '/api/quiz/start',
      { questionIds: selectedQuestions.map((q: QuizQuestion) => q.id) }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error starting quiz:', error);
    throw error;
  }
}

/**
 * Submits an answer for a question in a quiz
 */
export async function submitAnswer(
  attemptId: number,
  questionId: number,
  chosenAnswer: number,
  timeSpent: number,
  isLast: boolean = false
): Promise<{ correct: boolean; correctAnswer: number; explanation?: string }> {
  try {
    const response = await apiRequest('POST', `/api/quiz/${attemptId}/answer`, {
      questionId,
      chosenAnswer,
      timeSpent,
      isLast
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Loads a quiz attempt's details
 */
export async function getQuizAttempt(
  attemptId: number
): Promise<{ attempt: QuizAttempt; questions: QuizQuestion[] }> {
  try {
    const response = await apiRequest('GET', `/api/quiz/${attemptId}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading quiz attempt:', error);
    throw error;
  }
}

/**
 * Gets all past quiz attempts for the current user
 */
export async function getQuizAttempts(): Promise<{ attempts: QuizAttempt[] }> {
  try {
    const response = await apiRequest('GET', '/api/attempts');
    return await response.json();
  } catch (error) {
    console.error('Error loading quiz attempts:', error);
    throw error;
  }
}

/**
 * Calculate spaced repetition interval based on performance
 */
export function calculateNextReviewDate(
  isCorrect: boolean,
  consecutiveCorrect: number
): Date {
  const now = new Date();
  let daysToAdd = 1;
  
  if (isCorrect) {
    // SM-2 algorithm simplified
    switch (consecutiveCorrect) {
      case 0: daysToAdd = 1; break;
      case 1: daysToAdd = 3; break;
      case 2: daysToAdd = 7; break;
      case 3: daysToAdd = 14; break;
      case 4: daysToAdd = 30; break;
      default: daysToAdd = 60; break;
    }
  } else {
    // If incorrect, review soon
    daysToAdd = 1;
  }
  
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysToAdd);
  
  return nextDate;
}
