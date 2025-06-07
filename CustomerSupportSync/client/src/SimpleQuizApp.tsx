import React, { useState, useEffect } from 'react';
import './index.css';

interface Question {
  id: string;
  question: string;
  options: string[];
  answer?: number;
  explanation?: string;
  category: number;
  difficulty: string;
  chosen?: number;
  correct?: boolean;
}

interface Attempt {
  id: string;
  user: string;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  totalQuestions: number;
  timeSpent?: number;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

const SimpleQuizApp = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    visible: boolean;
    correct: boolean;
    explanation?: string;
    correctAnswer?: number;
  }>({ visible: false, correct: false });
  const [username, setUsername] = useState('guest');
  const [showLogin, setShowLogin] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [showAttempts, setShowAttempts] = useState(false);
  const [result, setResult] = useState({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
  });

  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  // UI Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch categories from the API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Start a new quiz
  const startQuiz = async () => {
    try {
      let url = '/api/questions';
      const params = [];
      
      if (selectedCategory) {
        params.push(`category=${selectedCategory}`);
      }
      
      if (selectedDifficulty) {
        params.push(`difficulty=${selectedDifficulty}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        alert('No questions available for the selected criteria');
        return;
      }
      
      // Randomly select questions if there are too many
      let selectedQuestions = [...data.questions];
      if (selectedQuestions.length > 10) {
        selectedQuestions = selectedQuestions
          .sort(() => 0.5 - Math.random())
          .slice(0, 10);
      }
      
      // Start the quiz session on the server
      const startResponse = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          questionIds: selectedQuestions.map(q => q.id)
        })
      });
      
      const startData = await startResponse.json();
      setAttemptId(startData.attemptId);
      setQuestions(startData.questions || []);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setFeedback({ visible: false, correct: false });
      setQuizStarted(true);
      setQuizFinished(false);
      setIsReviewMode(false);
      
      // Start timer
      const now = Date.now();
      setStartTime(now);
      setQuestionStartTime(now);
      setTotalTime(0);
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz. Please try again.');
    }
  };

  // Submit answer for current question
  const submitAnswer = async () => {
    if (selectedOption === null || !attemptId) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const now = Date.now();
    const timeSpent = questionStartTime ? now - questionStartTime : 0;
    
    try {
      const isLast = currentQuestionIndex === questions.length - 1;
      
      const response = await fetch(`/api/quiz/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          chosenAnswer: selectedOption,
          timeSpent,
          isLast
        })
      });
      
      const data = await response.json();
      
      // Update the questions array with the user's choice
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        chosen: selectedOption,
        correct: data.correct
      };
      setQuestions(updatedQuestions);
      
      // Show feedback
      setFeedback({
        visible: true,
        correct: data.correct,
        explanation: data.explanation,
        correctAnswer: data.correctAnswer
      });
      
      // Update total time
      setTotalTime(prev => prev + timeSpent);
      
      // If this was the last question, show results
      if (isLast) {
        const correctAnswers = updatedQuestions.filter(q => q.correct).length;
        setResult({
          score: Math.round((correctAnswers / updatedQuestions.length) * 100),
          totalQuestions: updatedQuestions.length,
          correctAnswers
        });
        setQuizFinished(true);
      }
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setFeedback({ visible: false, correct: false });
      setQuestionStartTime(Date.now());
    }
  };

  // Move to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      setSelectedOption(prevQuestion.chosen ?? null);
      setFeedback({ 
        visible: prevQuestion.chosen !== undefined,
        correct: prevQuestion.correct || false
      });
    }
  };

  // Fetch previous attempts
  const fetchAttempts = async () => {
    try {
      const response = await fetch('/api/attempts');
      const data = await response.json();
      setAttempts(data.attempts || []);
      setShowAttempts(true);
      setQuizStarted(false);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      alert('Failed to fetch attempts');
    }
  };

  // Load a previous attempt for review
  const loadAttempt = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/quiz/${attemptId}`);
      const data = await response.json();
      
      if (!data.questions || data.questions.length === 0) {
        alert('No questions found for this attempt');
        return;
      }
      
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAttemptId(attemptId);
      setIsReviewMode(true);
      setQuizStarted(true);
      setShowAttempts(false);
      
      // Calculate results
      const correctAnswers = data.questions.filter((q: Question) => q.correct).length;
      setResult({
        score: Math.round((correctAnswers / data.questions.length) * 100),
        totalQuestions: data.questions.length,
        correctAnswers
      });
      
    } catch (error) {
      console.error('Error loading attempt:', error);
      alert('Failed to load attempt');
    }
  };

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Progress dots for navigation
  const renderProgressDots = () => {
    return (
      <div className="flex justify-center my-3 space-x-1">
        {questions.map((q, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentQuestionIndex 
                ? 'bg-primary-600 w-5' 
                : q.chosen !== undefined 
                  ? q.correct 
                    ? 'bg-green-500' 
                    : 'bg-red-500' 
                  : 'bg-gray-300'
            }`}
            onClick={() => {
              setCurrentQuestionIndex(idx);
              setSelectedOption(q.chosen ?? null);
              setFeedback({ 
                visible: q.chosen !== undefined,
                correct: q.correct || false
              });
            }}
          />
        ))}
      </div>
    );
  };

  // Login form
  const renderLoginForm = () => (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Enter Your Name</h2>
      <input
        type="text"
        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => {
          if (username.trim()) {
            setShowLogin(false);
          } else {
            alert('Please enter your name');
          }
        }}
      >
        Start Quiz
      </button>
    </div>
  );

  // Quiz configuration screen
  const renderQuizConfig = () => (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Configure Your Quiz</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Difficulty
        </label>
        <select
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          value={selectedDifficulty || ''}
          onChange={(e) => setSelectedDifficulty(e.target.value || null)}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      
      <div className="flex space-x-2">
        <button
          className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={startQuiz}
        >
          Start Quiz
        </button>
        <button
          className="p-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
          onClick={fetchAttempts}
        >
          View History
        </button>
      </div>
    </div>
  );

  // Quiz question display
  const renderQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-6">
          <div 
            className="bg-blue-600 h-1.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        
        {renderProgressDots()}
        
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          {currentQuestion.question}
        </h2>
        
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, idx) => (
            <div
              key={idx}
              className={`p-3 border rounded cursor-pointer transition-all ${
                isReviewMode
                  ? idx === currentQuestion.answer
                    ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-700'
                    : idx === currentQuestion.chosen && idx !== currentQuestion.answer
                    ? 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                  : selectedOption === idx
                  ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-700'
                  : feedback.visible
                  ? idx === feedback.correctAnswer
                    ? 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-700'
                    : idx === selectedOption
                    ? 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
              onClick={() => {
                if (!isReviewMode && !feedback.visible) {
                  setSelectedOption(idx);
                }
              }}
            >
              <div className="flex items-start">
                <div 
                  className={`mr-3 mt-0.5 flex-shrink-0 w-5 h-5 border rounded-full ${
                    isReviewMode
                      ? idx === currentQuestion.answer
                        ? 'bg-green-500 border-green-500'
                        : idx === currentQuestion.chosen
                        ? 'bg-red-500 border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                      : selectedOption === idx
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                ></div>
                <span className="text-gray-800 dark:text-white">{option}</span>
              </div>
            </div>
          ))}
        </div>
        
        {feedback.visible && !isReviewMode && (
          <div className={`p-4 mb-6 rounded-md ${feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            <div className="font-bold mb-1">
              {feedback.correct ? '✅ Correct!' : '❌ Incorrect!'}
            </div>
            {feedback.explanation && (
              <div className="text-sm">{feedback.explanation}</div>
            )}
          </div>
        )}
        
        {isReviewMode && currentQuestion.explanation && (
          <div className="p-4 mb-6 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <div className="font-bold mb-1">Explanation:</div>
            <div className="text-sm">{currentQuestion.explanation}</div>
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          
          {!isReviewMode && (
            feedback.visible ? (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                onClick={nextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
                onClick={submitAnswer}
                disabled={selectedOption === null}
              >
                Check Answer
              </button>
            )
          )}
          
          {isReviewMode && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  };

  // Quiz results screen
  const renderResults = () => (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Quiz Complete!</h2>
      
      <div className="mb-6">
        <div className="text-5xl font-bold text-blue-500">{result.score}%</div>
        <p className="text-gray-600 dark:text-gray-400">
          You got {result.correctAnswers} out of {result.totalQuestions} questions correct
        </p>
      </div>
      
      {totalTime > 0 && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-gray-700 dark:text-gray-300">
            Total time: {formatTime(totalTime)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Average time per question: {formatTime(totalTime / questions.length)}
          </p>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button
          className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => {
            setIsReviewMode(true);
            setCurrentQuestionIndex(0);
          }}
        >
          Review Answers
        </button>
        <button
          className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-700"
          onClick={() => {
            setQuizStarted(false);
            setQuizFinished(false);
          }}
        >
          New Quiz
        </button>
      </div>
    </div>
  );

  // Previous attempts screen
  const renderAttempts = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Your Quiz History</h2>
      
      {attempts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          You haven't taken any quizzes yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {attempts.map(attempt => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {new Date(attempt.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {attempt.score !== undefined ? `${attempt.score}%` : 'In Progress'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {attempt.totalQuestions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => loadAttempt(attempt.id)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6">
        <button
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          onClick={() => {
            setShowAttempts(false);
          }}
        >
          Back to Quiz
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {showLogin ? (
        renderLoginForm()
      ) : showAttempts ? (
        renderAttempts()
      ) : !quizStarted ? (
        renderQuizConfig()
      ) : quizFinished && !isReviewMode ? (
        renderResults()
      ) : (
        renderQuestion()
      )}
    </div>
  );
};

export default SimpleQuizApp;
