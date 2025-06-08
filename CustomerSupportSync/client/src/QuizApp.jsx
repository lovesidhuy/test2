import React, { useState, useEffect, useRef } from 'react';

// Styling
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    margin: '0',
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  card: {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--card-shadow)',
    marginBottom: '20px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '16px',
  },
  primaryButton: {
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    color: 'white',
  },
  secondaryButton: {
    background: 'var(--secondary-button-bg)',
    color: 'var(--secondary-button-text)',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: '16px',
  },
  progressBar: {
    height: '6px',
    background: 'var(--progress-bg)',
    borderRadius: '3px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  option: {
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#6366f1',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  optionCorrect: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
  },
  optionIncorrect: {
    borderColor: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
  },
  optionCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid var(--border-color)',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: {
    borderColor: '#6366f1',
    background: '#6366f1',
  },
  optionCircleCorrect: {
    borderColor: '#10b981',
    background: '#10b981',
  },
  optionCircleIncorrect: {
    borderColor: '#ef4444',
    background: '#ef4444',
  },
  feedbackBanner: {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  correctBanner: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    color: '#10b981',
  },
  incorrectBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#ef4444',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  progressDots: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
    flexWrap: 'wrap',
    gap: '6px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'var(--progress-bg)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dotCurrent: {
    width: '16px',
    height: '16px',
  },
  dotCorrect: {
    background: '#10b981',
  },
  dotIncorrect: {
    background: '#ef4444',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  tableCell: {
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
  },
  score: {
    fontSize: '48px',
    fontWeight: '700',
    textAlign: 'center',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  },
  scoreLabel: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  statCard: {
    background: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  statIcon: {
    padding: '12px',
    borderRadius: '12px',
    marginRight: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
  },
  reviewItem: {
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
  },
  reviewQuestion: {
    fontWeight: '500',
    marginBottom: '12px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    marginRight: '8px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
};

// Main Component
function QuizApp() {
  // State
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState('welcome'); // welcome, config, quiz, result, review, history
  const [username, setUsername] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState({ visible: false, correct: false, message: '' });
  const [attemptId, setAttemptId] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  
  // Refs
  const timerRef = useRef(null);
  
  // EFFECTS
  
  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('quizTheme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    }
    
    // Load categories initially
    fetchCategories();
  }, []);
  
  // Apply theme changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('quizTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('quizTheme', 'light');
    }
  }, [darkMode]);
  
  // FETCH FUNCTIONS
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Fetch questions based on filters
  const fetchQuestions = async () => {
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
      return data.questions || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    }
  };
  
  // Fetch previous attempts
  const fetchAttempts = async () => {
    try {
      const response = await fetch('/api/attempts');
      const data = await response.json();
      setAttempts(data.attempts || []);
      setView('history');
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };
  
  // Fetch a specific attempt for review
  const fetchAttempt = async (id) => {
    try {
      const response = await fetch(`/api/quiz/${id}`);
      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setFeedback({ visible: false, correct: false, message: '' });
        setView('review');
        
        // Calculate results for display
        const correctCount = data.questions.filter(q => q.correct).length;
        setQuizResult({
          score: Math.round((correctCount / data.questions.length) * 100),
          correctCount,
          totalCount: data.questions.length,
          timeSpent: data.attempt.timeSpent || 0
        });
      }
    } catch (error) {
      console.error('Error fetching attempt:', error);
    }
  };
  
  // ACTION HANDLERS
  
  // Start a new quiz
  const startQuiz = async () => {
    const fetchedQuestions = await fetchQuestions();
    
    if (fetchedQuestions.length === 0) {
      alert('No questions available for the selected criteria');
      return;
    }
    
    // Randomly select a subset if there are many questions
    let quizQuestions = [...fetchedQuestions];
    if (quizQuestions.length > 10) {
      quizQuestions = quizQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
    }
    
    // Start the quiz session
    try {
      const response = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'Guest',
          questionIds: quizQuestions.map(q => q.id)
        })
      });
      
      const data = await response.json();
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentQuestion(0);
      setSelectedOption(null);
      setFeedback({ visible: false, correct: false, message: '' });
      setWrongQuestions([]);
      setView('quiz');
      
      // Start timers
      const now = Date.now();
      setStartTime(now);
      setQuestionStartTime(now);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Failed to start quiz');
    }
  };
  
  // Submit an answer
  const submitAnswer = async () => {
    if (selectedOption === null || !attemptId) return;
    
    const question = questions[currentQuestion];
    const now = Date.now();
    const timeSpent = questionStartTime ? now - questionStartTime : 0;
    const isLastQuestion = currentQuestion === questions.length - 1;
    
    try {
      const response = await fetch(`/api/quiz/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          chosenAnswer: selectedOption,
          timeSpent,
          isLast: isLastQuestion
        })
      });
      
      const data = await response.json();
      
      // Update question with answer data
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestion] = {
        ...question,
        chosen: selectedOption,
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation
      };
      setQuestions(updatedQuestions);
      
      // Track wrong answers for practice
      if (!data.correct) {
        setWrongQuestions(prev => [...prev, {...question, correctAnswer: data.correctAnswer}]);
      }
      
      // Show feedback
      setFeedback({
        visible: true,
        correct: data.correct,
        message: data.explanation || ''
      });
      
      // If this was the last question, prepare to show results
      if (isLastQuestion) {
        const correctCount = updatedQuestions.filter(q => q.correct).length;
        setQuizResult({
          score: Math.round((correctCount / updatedQuestions.length) * 100),
          correctCount,
          totalCount: updatedQuestions.length,
          timeSpent: now - startTime
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    }
  };
  
  // Move to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setFeedback({ visible: false, correct: false, message: '' });
      setQuestionStartTime(Date.now());
    } else if (feedback.visible) {
      // If this is the last question and we've shown feedback, show results
      setView('result');
    }
  };
  
  // Move to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevQuestion = questions[currentQuestion - 1];
      setSelectedOption(prevQuestion.chosen);
      setFeedback({
        visible: prevQuestion.chosen !== undefined,
        correct: prevQuestion.correct || false,
        message: prevQuestion.explanation || ''
      });
    }
  };
  
  // Start a practice session with wrong questions
  const practiceWrongQuestions = () => {
    if (wrongQuestions.length === 0) return;
    
    setQuestions(wrongQuestions);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setFeedback({ visible: false, correct: false, message: '' });
    setWrongQuestions([]);
    setView('quiz');
    
    // Reset timers
    const now = Date.now();
    setStartTime(now);
    setQuestionStartTime(now);
  };
  
  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };
  
  // Format time display (ms to mm:ss)
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // RENDER HELPER FUNCTIONS
  
  // Render welcome screen
  const renderWelcome = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Welcome to SmartQuiz</h2>
      <p style={{color: 'var(--text-secondary)'}}>
        Test your knowledge with personalized quizzes!
      </p>
      
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="username">Your Name</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          style={styles.input}
        />
      </div>
      
      <div style={{...styles.navButtons, justifyContent: 'center'}}>
        <button 
          style={{...styles.button, ...styles.primaryButton}}
          onClick={() => setView('config')}
        >
          Get Started
        </button>
      </div>
    </div>
  );
  
  // Render quiz configuration screen
  const renderConfig = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Configure Your Quiz</h2>
      
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="category">Category</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={styles.select}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label} htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={styles.select}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      
      <div style={styles.navButtons}>
        <button 
          style={{...styles.button, ...styles.secondaryButton}}
          onClick={fetchAttempts}
        >
          View History
        </button>
        <button 
          style={{...styles.button, ...styles.primaryButton}}
          onClick={startQuiz}
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
  
  // Render quiz question screen
  const renderQuizQuestion = () => {
    if (!questions.length) return null;
    
    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    
    return (
      <div style={styles.card}>
        <div style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px'}}>
          Question {currentQuestion + 1} of {questions.length}
        </div>
        
        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progress}%`}}></div>
        </div>
        
        {/* Progress dots */}
        <div style={styles.progressDots}>
          {questions.map((q, idx) => (
            <div
              key={idx}
              style={{
                ...styles.dot,
                ...(idx === currentQuestion ? styles.dotCurrent : {}),
                ...(q.correct === true ? styles.dotCorrect : {}),
                ...(q.correct === false ? styles.dotIncorrect : {})
              }}
              onClick={() => {
                setCurrentQuestion(idx);
                setSelectedOption(q.chosen);
                setFeedback({
                  visible: q.chosen !== undefined,
                  correct: q.correct || false,
                  message: q.explanation || ''
                });
              }}
            ></div>
          ))}
        </div>
        
        <h3 style={{fontWeight: '600', fontSize: '20px', marginBottom: '20px', color: 'var(--text-primary)'}}>
          {question.question}
        </h3>
        
        {/* Options */}
        <div>
          {question.options.map((option, idx) => (
            <div
              key={idx}
              style={{
                ...styles.option,
                ...(selectedOption === idx ? styles.optionSelected : {}),
                ...(feedback.visible && idx === question.correctAnswer ? styles.optionCorrect : {}),
                ...(feedback.visible && selectedOption === idx && idx !== question.correctAnswer ? styles.optionIncorrect : {})
              }}
              onClick={() => {
                if (!feedback.visible) {
                  setSelectedOption(idx);
                }
              }}
            >
              <div style={{
                ...styles.optionCircle,
                ...(selectedOption === idx ? styles.optionCircleSelected : {}),
                ...(feedback.visible && idx === question.correctAnswer ? styles.optionCircleCorrect : {}),
                ...(feedback.visible && selectedOption === idx && idx !== question.correctAnswer ? styles.optionCircleIncorrect : {})
              }}>
                {(feedback.visible && idx === question.correctAnswer) && '✓'}
                {(feedback.visible && selectedOption === idx && idx !== question.correctAnswer) && '✗'}
              </div>
              {option}
            </div>
          ))}
        </div>
        
        {/* Feedback */}
        {feedback.visible && (
          <div style={{
            ...styles.feedbackBanner,
            ...(feedback.correct ? styles.correctBanner : styles.incorrectBanner)
          }}>
            <div style={{fontWeight: '500', marginBottom: '4px'}}>
              {feedback.correct ? '✓ Correct!' : '✗ Incorrect!'}
            </div>
            {feedback.message && <div>{feedback.message}</div>}
          </div>
        )}
        
        {/* Navigation */}
        <div style={styles.navButtons}>
          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              ...(currentQuestion === 0 ? styles.disabledButton : {})
            }}
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          
          {!feedback.visible ? (
            <button
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(selectedOption === null ? styles.disabledButton : {})
              }}
              onClick={submitAnswer}
              disabled={selectedOption === null}
            >
              Submit
            </button>
          ) : (
            <button
              style={{...styles.button, ...styles.primaryButton}}
              onClick={nextQuestion}
            >
              {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // Render quiz result screen
  const renderResult = () => {
    if (!quizResult) return null;
    
    return (
      <div style={styles.card}>
        <h2 style={styles.title}>Quiz Completed!</h2>
        
        <div style={styles.score}>{quizResult.score}%</div>
        <div style={styles.scoreLabel}>
          You got {quizResult.correctCount} out of {quizResult.totalCount} questions correct.
        </div>
        
        {/* Stats */}
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏱️</div>
          <div>
            <div style={{fontWeight: '500'}}>Time Spent</div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              {formatTime(quizResult.timeSpent)}
            </div>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <div style={{fontWeight: '500'}}>Average Time per Question</div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              {formatTime(quizResult.timeSpent / quizResult.totalCount)}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div style={styles.buttonGroup}>
          <button
            style={{...styles.button, ...styles.secondaryButton, flex: '1'}}
            onClick={() => setView('config')}
          >
            New Quiz
          </button>
          
          <button
            style={{...styles.button, ...styles.primaryButton, flex: '1'}}
            onClick={() => setView('review')}
          >
            Review Answers
          </button>
        </div>
        
        {/* Practice wrong questions button */}
        {wrongQuestions.length > 0 && (
          <button
            style={{
              ...styles.button, 
              ...styles.secondaryButton, 
              marginTop: '10px',
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid #ef4444'
            }}
            onClick={practiceWrongQuestions}
          >
            Practice {wrongQuestions.length} Wrong Questions
          </button>
        )}
      </div>
    );
  };
  
  // Render review screen
  const renderReview = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Quiz Review</h2>
      
      {questions.map((q, idx) => (
        <div key={idx} style={styles.reviewItem}>
          <div style={{...styles.reviewQuestion, color: 'var(--text-primary)'}}>
            {idx + 1}. {q.question}
          </div>
          
          <div style={{marginBottom: '8px'}}>
            <span 
              style={{
                ...styles.badge,
                background: q.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: q.correct ? '#10b981' : '#ef4444'
              }}
            >
              {q.correct ? 'Correct' : 'Incorrect'}
            </span>
            
            {q.difficulty && (
              <span 
                style={{
                  ...styles.badge,
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1'
                }}
              >
                {q.difficulty}
              </span>
            )}
          </div>
          
          <div style={{marginBottom: '12px'}}>
            {q.options.map((option, optIdx) => (
              <div 
                key={optIdx}
                style={{
                  ...styles.option,
                  cursor: 'default',
                  padding: '8px 12px',
                  ...(optIdx === q.correctAnswer ? styles.optionCorrect : {}),
                  ...(q.chosen === optIdx && optIdx !== q.correctAnswer ? styles.optionIncorrect : {})
                }}
              >
                {option}
                {optIdx === q.correctAnswer && <span style={{marginLeft: '8px', color: '#10b981'}}>✓</span>}
                {q.chosen === optIdx && optIdx !== q.correctAnswer && <span style={{marginLeft: '8px', color: '#ef4444'}}>✗</span>}
              </div>
            ))}
          </div>
          
          {q.explanation && (
            <div style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-primary)'
            }}>
              <strong>Explanation:</strong> {q.explanation}
            </div>
          )}
        </div>
      ))}
      
      <div style={styles.buttonGroup}>
        <button
          style={{...styles.button, ...styles.secondaryButton, flex: '1'}}
          onClick={() => setView('config')}
        >
          New Quiz
        </button>
        
        {wrongQuestions.length > 0 && (
          <button
            style={{...styles.button, ...styles.primaryButton, flex: '1'}}
            onClick={practiceWrongQuestions}
          >
            Practice Wrong Questions
          </button>
        )}
      </div>
    </div>
  );
  
  // Render history screen
  const renderHistory = () => (
    <div style={styles.card}>
      <h2 style={styles.title}>Your Quiz History</h2>
      
      {attempts.length === 0 ? (
        <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-secondary)'}}>
          You haven't taken any quizzes yet.
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Date</th>
              <th style={styles.tableHeader}>Score</th>
              <th style={styles.tableHeader}>Questions</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(attempt => (
              <tr key={attempt.id}>
                <td style={styles.tableCell}>
                  {new Date(attempt.startedAt).toLocaleString()}
                </td>
                <td style={styles.tableCell}>
                  {attempt.score !== undefined ? `${attempt.score}%` : 'In Progress'}
                </td>
                <td style={styles.tableCell}>
                  {attempt.totalQuestions}
                </td>
                <td style={styles.tableCell}>
                  <button
                    style={{
                      ...styles.button,
                      ...styles.secondaryButton,
                      padding: '6px 12px',
                      fontSize: '14px'
                    }}
                    onClick={() => fetchAttempt(attempt.id)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div style={{...styles.navButtons, marginTop: '20px'}}>
        <button
          style={{...styles.button, ...styles.primaryButton}}
          onClick={() => setView('config')}
        >
          Back to Quiz
        </button>
      </div>
    </div>
  );
  
  // MAIN RENDER
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>SmartQuiz</h1>
        <button 
          style={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>
      
      {/* Main content */}
      {view === 'welcome' && renderWelcome()}
      {view === 'config' && renderConfig()}
      {view === 'quiz' && renderQuizQuestion()}
      {view === 'result' && renderResult()}
      {view === 'review' && renderReview()}
      {view === 'history' && renderHistory()}
    </div>
  );
}

export default QuizApp;
