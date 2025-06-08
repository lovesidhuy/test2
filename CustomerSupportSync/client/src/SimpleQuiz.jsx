import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function SimpleQuiz() {
  // State
  const [view, setView] = useState('dashboard'); // dashboard, quiz, stats, settings
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [stats, setStats] = useState({
    totalCorrect: 0,
    totalAnswered: 0,
    averageTime: 0,
    byCategory: {}
  });
  const [filter, setFilter] = useState({
    category: '',
    difficulty: '',
    count: 10,
    subject: ''
  });
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [currentSubject, setCurrentSubject] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionTimeRef = useRef(null);
  
  // Load data on mount
  useEffect(() => {
    fetchQuestions();
    loadSavedSessions();
    loadStats();
    fetchCategories();
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('quizTheme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    }
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
  
  // Fetch questions from server
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/questions');
      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        setAllQuestions(data.questions);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };
  
  // Handle option selection
  const handleSelectOption = (index) => {
    if (showAnswer) return; // Prevent changing answer after showing result
    setSelectedOption(index);
  };
  
  // Check answer
  const checkAnswer = () => {
    if (selectedOption === null) return;
    
    const now = Date.now();
    const questionTime = now - questionTimeRef.current;
    
    // Update session data
    const updatedSession = {...currentSession};
    const currentQuestionData = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestionData.answer;
    
    updatedSession.answers.push({
      questionId: currentQuestionData.id,
      selectedOption,
      isCorrect,
      timeSpent: questionTime
    });
    
    if (isCorrect) {
      updatedSession.correctCount++;
    }
    
    setCurrentSession(updatedSession);
    saveSession(updatedSession);
    updateStats(isCorrect, questionTime, currentQuestionData.category);
    
    setShowAnswer(true);
  };
  
  // Move to previous question
  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      
      // Check if we already answered this question
      const previousAnswer = currentSession.answers.find(
        a => a.questionId === questions[currentIndex - 1].id
      );
      
      if (previousAnswer) {
        setSelectedOption(previousAnswer.selectedOption);
        setShowAnswer(true); // Show the previous answer
      } else {
        setSelectedOption(null);
        setShowAnswer(false);
      }
      
      setProgress(((currentIndex) / questions.length) * 100);
      questionTimeRef.current = Date.now();
    }
  };
  
  // Move to next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      
      // Check if we already answered this question
      const nextAnswer = currentSession.answers.find(
        a => a.questionId === questions[currentIndex + 1].id
      );
      
      if (nextAnswer) {
        setSelectedOption(nextAnswer.selectedOption);
        setShowAnswer(true); // Show the previous answer
      } else {
        setSelectedOption(null);
        setShowAnswer(false);
      }
      
      setProgress(((currentIndex + 1) / questions.length) * 100);
      questionTimeRef.current = Date.now();
    } else {
      finishSession();
    }
  };
  
  // Jump to a specific question
  const jumpToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      
      // Check if we already answered this question
      const existingAnswer = currentSession.answers.find(
        a => a.questionId === questions[index].id
      );
      
      if (existingAnswer) {
        setSelectedOption(existingAnswer.selectedOption);
        setShowAnswer(true); // Show the previous answer
      } else {
        setSelectedOption(null);
        setShowAnswer(false);
      }
      
      setProgress(((index) / questions.length) * 100);
      questionTimeRef.current = Date.now();
    }
  };
  
  // Start new quiz session
  const startQuiz = () => {
    // Filter questions based on user preferences
    let filteredQuestions = [...allQuestions];
    
    // Filter by subject
    if (filter.subject) {
      filteredQuestions = filteredQuestions.filter(q => q.subject === filter.subject);
      // Set current subject
      const subject = subjects.find(s => s.id === filter.subject);
      if (subject) {
        setCurrentSubject(subject);
      }
    } else {
      setCurrentSubject(null);
    }
    
    // Filter by category
    if (filter.category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === parseInt(filter.category));
    }
    
    // Filter by difficulty
    if (filter.difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === filter.difficulty);
    }
    
    // Shuffle and limit questions
    filteredQuestions = filteredQuestions.sort(() => 0.5 - Math.random());
    if (filter.count > 0 && filteredQuestions.length > filter.count) {
      filteredQuestions = filteredQuestions.slice(0, filter.count);
    }
    
    if (filteredQuestions.length === 0) {
      alert('No questions match your criteria. Please adjust your filters.');
      return;
    }
    
    // Create a new session
    const now = Date.now();
    const newSession = {
      id: `session-${now}`,
      subjectId: filter.subject || null,
      subjectName: filter.subject ? subjects.find(s => s.id === filter.subject)?.name : 'Mixed',
      startTime: now,
      endTime: null,
      questions: filteredQuestions.map(q => q.id),
      answers: [],
      correctCount: 0,
      totalTime: 0,
      completed: false
    };
    
    setQuestions(filteredQuestions);
    setCurrentSession(newSession);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setProgress(0);
    startTimeRef.current = now;
    questionTimeRef.current = now;
    setSessions(prev => [newSession, ...prev]);
    saveSession(newSession);
    
    setView('quiz');
  };
  
  // Finish current session
  const finishSession = () => {
    const now = Date.now();
    
    // Update session data
    const updatedSession = {...currentSession};
    updatedSession.endTime = now;
    updatedSession.totalTime = now - startTimeRef.current;
    updatedSession.completed = true;
    
    setCurrentSession(updatedSession);
    saveSession(updatedSession);
    
    // Show review instead of stats
    setView('review');
  };
  
  // Load saved sessions from localStorage
  const loadSavedSessions = () => {
    try {
      const savedSessions = localStorage.getItem('quiz-sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error('Error loading saved sessions:', error);
    }
  };
  
  // Save session to localStorage
  const saveSession = (session) => {
    try {
      const updatedSessions = sessions.map(s => 
        s.id === session.id ? session : s
      );
      if (!updatedSessions.find(s => s.id === session.id)) {
        updatedSessions.unshift(session);
      }
      
      setSessions(updatedSessions);
      localStorage.setItem('quiz-sessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };
  
  // Load stats from localStorage
  const loadStats = () => {
    try {
      const savedStats = localStorage.getItem('quiz-stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  // Update stats
  const updateStats = (isCorrect, timeSpent, categoryId) => {
    setStats(prevStats => {
      // Update overall stats
      const newStats = {
        ...prevStats,
        totalAnswered: prevStats.totalAnswered + 1,
        totalCorrect: isCorrect ? prevStats.totalCorrect + 1 : prevStats.totalCorrect,
        averageTime: (prevStats.averageTime * prevStats.totalAnswered + timeSpent) / (prevStats.totalAnswered + 1)
      };
      
      // Update category stats
      const categoryKey = categoryId ? categoryId.toString() : 'unknown';
      const categoryStats = prevStats.byCategory[categoryKey] || { correct: 0, total: 0, time: 0 };
      
      newStats.byCategory = {
        ...prevStats.byCategory,
        [categoryKey]: {
          correct: isCorrect ? categoryStats.correct + 1 : categoryStats.correct,
          total: categoryStats.total + 1,
          time: (categoryStats.time * categoryStats.total + timeSpent) / (categoryStats.total + 1)
        }
      };
      
      // Save to localStorage
      localStorage.setItem('quiz-stats', JSON.stringify(newStats));
      
      return newStats;
    });
  };
  
  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  
  // Retry wrong answers from a session
  const retryWrongAnswers = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.completed) {
      return;
    }
    
    // Get all wrong answers from this session
    const wrongAnswers = session.answers.filter(a => !a.isCorrect);
    if (wrongAnswers.length === 0) {
      alert('Congratulations! You had no wrong answers in this session.');
      return;
    }
    
    // Find the corresponding questions
    const wrongQuestionIds = wrongAnswers.map(a => a.questionId);
    const wrongQuestions = allQuestions.filter(q => wrongQuestionIds.includes(q.id));
    
    if (wrongQuestions.length === 0) {
      alert('Could not find the questions for this session.');
      return;
    }
    
    // Create a new practice session with wrong questions
    const now = Date.now();
    const newSession = {
      id: `session-${now}`,
      subjectId: session.subjectId,
      subjectName: session.subjectName,
      startTime: now,
      endTime: null,
      questions: wrongQuestions.map(q => q.id),
      answers: [],
      correctCount: 0,
      totalTime: 0,
      completed: false,
      isPractice: true,
      originalSessionId: session.id
    };
    
    setQuestions(wrongQuestions);
    setCurrentSession(newSession);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setProgress(0);
    startTimeRef.current = now;
    questionTimeRef.current = now;
    setSessions(prev => [newSession, ...prev]);
    saveSession(newSession);
    
    setView('quiz');
  };
  
  // Load subjects from localStorage
  useEffect(() => {
    try {
      const savedSubjects = localStorage.getItem('quiz-subjects');
      if (savedSubjects) {
        setSubjects(JSON.parse(savedSubjects));
      }
    } catch (error) {
      console.error('Error loading saved subjects:', error);
    }
  }, []);
  
  // Handle file selection
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFileName(file.name);
    
    // Store the file content in a ref for later use
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const questionsData = JSON.parse(content);
        
        // Basic validation
        if (!Array.isArray(questionsData)) {
          setUploadMessage('Error: File must contain an array of questions');
          return;
        }
        
        // Check each question has required fields
        const isValid = questionsData.every(q => 
          q.id && q.question && Array.isArray(q.options) && 
          q.answer !== undefined && q.options.length > 0
        );
        
        if (!isValid) {
          setUploadMessage('Error: Some questions are missing required fields');
          return;
        }
        
        // Store validated questions data for upload
        fileInputRef.current.questionsData = questionsData;
        setUploadMessage('');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setUploadMessage('Error: Invalid JSON format');
      }
    };
    
    reader.readAsText(file);
  };
  
  // Upload questions and create subject
  const uploadQuestions = async () => {
    if (!fileInputRef.current.questionsData || !subjectName) {
      setUploadMessage('Error: Please select a valid questions file and enter a subject name');
      return;
    }
    
    try {
      const questionsData = fileInputRef.current.questionsData;
      
      // Create a new subject
      const subjectId = `subject-${Date.now()}`;
      const newSubject = {
        id: subjectId,
        name: subjectName,
        questionCount: questionsData.length,
        createdAt: Date.now(),
        questions: questionsData.map(q => ({ ...q, subject: subjectId }))
      };
      
      // Add subject information to each question
      const questionsWithSubject = questionsData.map(q => ({
        ...q,
        subject: subjectId
      }));
      
      // Make API call to update questions
      const response = await fetch('/api/reload-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionsWithSubject)
      });
      
      if (response.ok) {
        // Update state
        setSubjects(prev => {
          const updated = [newSubject, ...prev];
          // Save to localStorage
          localStorage.setItem('quiz-subjects', JSON.stringify(updated));
          return updated;
        });
        
        // Update questions with the new ones
        setAllQuestions(prev => {
          const updated = [...prev];
          // Remove any existing questions with the same IDs
          const newIds = questionsWithSubject.map(q => q.id);
          const filtered = updated.filter(q => !newIds.includes(q.id));
          // Add the new questions
          return [...filtered, ...questionsWithSubject];
        });
        
        setUploadMessage(`Success! Added ${questionsData.length} questions to subject "${subjectName}"`);
        setSubjectName('');
        setSelectedFileName('');
        fileInputRef.current.questionsData = null;
        
        // Refresh categories
        fetchCategories();
      } else {
        setUploadMessage('Error: Failed to upload questions to server');
      }
    } catch (error) {
      console.error('Error uploading questions:', error);
      setUploadMessage('Error: Failed to create subject');
    }
  };
  
  // Start a quiz with questions from a specific subject
  const startSubjectQuiz = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) {
      alert('Subject not found');
      return;
    }
    
    // Get questions for this subject
    const subjectQuestions = allQuestions.filter(q => q.subject === subjectId);
    
    if (subjectQuestions.length === 0) {
      alert('No questions found for this subject');
      return;
    }
    
    // Shuffle questions and limit if necessary
    const shuffledQuestions = [...subjectQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = filter.count > 0 && filter.count < shuffledQuestions.length 
      ? shuffledQuestions.slice(0, filter.count) 
      : shuffledQuestions;
    
    // Create a new session
    const now = Date.now();
    const newSession = {
      id: `session-${now}`,
      subjectId: subjectId,
      subjectName: subject.name,
      startTime: now,
      endTime: null,
      questions: selectedQuestions.map(q => q.id),
      answers: [],
      correctCount: 0,
      totalTime: 0,
      completed: false
    };
    
    setQuestions(selectedQuestions);
    setCurrentSession(newSession);
    setCurrentSubject(subject);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setProgress(0);
    startTimeRef.current = now;
    questionTimeRef.current = now;
    setSessions(prev => [newSession, ...prev]);
    saveSession(newSession);
    
    setView('quiz');
  };
  
  // View all questions in a subject
  const viewSubjectQuestions = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) {
      alert('Subject not found');
      return;
    }
    
    // Set the current subject and update the filter
    setCurrentSubject(subject);
    setFilter(prev => ({ ...prev, subject: subjectId }));
    
    // TODO: Could create a dedicated view for subject questions in the future
    setView('settings');
  };
  
  // Delete a subject and its questions
  const deleteSubject = (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject and all its questions?')) {
      return;
    }
    
    try {
      // Remove subject from subjects list
      setSubjects(prev => {
        const updated = prev.filter(s => s.id !== subjectId);
        localStorage.setItem('quiz-subjects', JSON.stringify(updated));
        return updated;
      });
      
      // Remove questions belonging to this subject
      setAllQuestions(prev => prev.filter(q => q.subject !== subjectId));
      
      // Remove any sessions related to this subject
      setSessions(prev => {
        const updated = prev.filter(s => s.subjectId !== subjectId);
        localStorage.setItem('quiz-sessions', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  };
  
  // Reset Quiz
  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setView('dashboard');
  };
  
  // Format time to mm:ss
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Delete session
  const deleteSession = (sessionId) => {
    if (confirm('Are you sure you want to delete this session?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('quiz-sessions', JSON.stringify(updatedSessions));
    }
  };
  
  // Resume session
  const resumeSession = (session) => {
    // Find the questions for this session
    const sessionQuestions = session.questions.map(qId => 
      allQuestions.find(q => q.id === qId)
    ).filter(Boolean);
    
    if (sessionQuestions.length === 0) {
      alert('Could not find questions for this session.');
      return;
    }
    
    setQuestions(sessionQuestions);
    setCurrentSession(session);
    setCurrentIndex(session.answers.length); // Resume from where they left off
    setSelectedOption(null);
    setShowAnswer(false);
    setProgress((session.answers.length / sessionQuestions.length) * 100);
    
    startTimeRef.current = Date.now() - (session.totalTime || 0);
    questionTimeRef.current = Date.now();
    
    setView('quiz');
  };
  
  // Render functions for different views
  
  // Dashboard view
  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="card dashboard-card">
        <h2 className="section-title">Start a New Quiz</h2>
        
        <div className="filter-container">
          <div className="filter-item">
            <label>Subject</label>
            <select 
              value={filter.subject} 
              onChange={e => setFilter({...filter, subject: e.target.value})}
              className="select-input"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
        
          <div className="filter-item">
            <label>Category</label>
            <select 
              value={filter.category} 
              onChange={e => setFilter({...filter, category: e.target.value})}
              className="select-input"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Difficulty</label>
            <select 
              value={filter.difficulty} 
              onChange={e => setFilter({...filter, difficulty: e.target.value})}
              className="select-input"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label>Number of Questions</label>
            <select 
              value={filter.count} 
              onChange={e => setFilter({...filter, count: parseInt(e.target.value)})}
              className="select-input"
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
              <option value="0">All Available</option>
            </select>
          </div>
        </div>
        
        <button className="primary-button start-button" onClick={startQuiz}>
          Start Quiz
        </button>
      </div>
      
      <div className="dashboard-split">
        <div className="card sessions-card">
          <h2 className="section-title">Recent Sessions</h2>
          
          {sessions.length === 0 ? (
            <div className="empty-state">No sessions yet. Start a quiz to create one!</div>
          ) : (
            <div className="sessions-list">
              {sessions.slice(0, 5).map(session => (
                <div key={session.id} className="session-item">
                  <div className="session-info">
                    <div className="session-date">
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                    <div className="session-status">
                      {session.completed ? 
                        `${session.correctCount}/${session.questions.length} correct` : 
                        'In progress'}
                    </div>
                  </div>
                  <div className="session-actions">
                    <button 
                      className="icon-button"
                      onClick={() => resumeSession(session)}
                      title={session.completed ? "Review" : "Resume"}
                    >
                      {session.completed ? '📋' : '▶️'}
                    </button>
                    <button 
                      className="icon-button delete-button"
                      onClick={() => deleteSession(session.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {sessions.length > 5 && (
                <button 
                  className="text-button view-all-button"
                  onClick={() => setView('stats')}
                >
                  View All Sessions
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="card upload-card">
          <h2 className="section-title">Manage Question Banks</h2>
          
          <div className="upload-container">
            <p>Upload your own questions JSON file:</p>
            <div className="json-upload-form">
              <div className="input-group">
                <label htmlFor="subject-name">Subject Name</label>
                <input 
                  type="text" 
                  id="subject-name" 
                  placeholder="e.g., Chemistry, JavaScript, History"
                  className="text-input"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              
              <div className="file-upload-area">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  style={{display: 'none'}}
                />
                <button 
                  className="secondary-button"
                  onClick={() => fileInputRef.current.click()}
                >
                  Select JSON File
                </button>
                <span className="file-name">
                  {selectedFileName || "No file selected"}
                </span>
              </div>
              
              <button 
                className="primary-button upload-button"
                onClick={uploadQuestions}
                disabled={!selectedFileName || !subjectName.trim()}
              >
                Upload Questions
              </button>
            </div>
            
            {uploadMessage && (
              <div className={`upload-message ${uploadMessage.startsWith('Error') ? 'error' : 'success'}`}>
                {uploadMessage}
              </div>
            )}
          </div>
          
          <div className="subject-list">
            <h3 className="subsection-title">Your Question Banks</h3>
            
            {subjects.length === 0 ? (
              <div className="empty-state">No subjects yet. Upload questions to create one!</div>
            ) : (
              <div className="subjects-grid">
                {subjects.map(subject => (
                  <div key={subject.id} className="subject-card">
                    <div className="subject-header">
                      <div className="subject-name">{subject.name}</div>
                      <div className="subject-count">{subject.questionCount} questions</div>
                    </div>
                    
                    <div className="subject-actions">
                      <button 
                        className="icon-button"
                        onClick={() => startSubjectQuiz(subject.id)}
                        title="Practice this subject"
                      >
                        ▶️
                      </button>
                      <button 
                        className="icon-button"
                        onClick={() => viewSubjectQuestions(subject.id)}
                        title="View questions"
                      >
                        📋
                      </button>
                      <button 
                        className="icon-button delete-button"
                        onClick={() => deleteSubject(subject.id)}
                        title="Delete subject"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="questions-summary">
            <div className="summary-item">
              <div className="summary-label">Total Questions</div>
              <div className="summary-value">{allQuestions.length}</div>
            </div>
            
            <div className="summary-item">
              <div className="summary-label">Subjects</div>
              <div className="summary-value">{subjects.length}</div>
            </div>
            
            <div className="summary-item">
              <div className="summary-label">Categories</div>
              <div className="summary-value">{categories.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card stats-preview-card">
        <h2 className="section-title">Your Progress</h2>
        
        <div className="stats-preview">
          <div className="stat-item">
            <div className="stat-icon">✓</div>
            <div className="stat-details">
              <div className="stat-value">
                {stats.totalAnswered > 0 
                  ? `${Math.round((stats.totalCorrect / stats.totalAnswered) * 100)}%` 
                  : 'N/A'}
              </div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">🕒</div>
            <div className="stat-details">
              <div className="stat-value">
                {stats.totalAnswered > 0 
                  ? `${formatTime(stats.averageTime)}` 
                  : 'N/A'}
              </div>
              <div className="stat-label">Avg Time per Question</div>
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-icon">📚</div>
            <div className="stat-details">
              <div className="stat-value">{stats.totalAnswered}</div>
              <div className="stat-label">Questions Answered</div>
            </div>
          </div>
        </div>
        
        <button 
          className="text-button view-stats-button"
          onClick={() => setView('stats')}
        >
          View Detailed Stats
        </button>
      </div>
    </div>
  );
  
  // Quiz view
  const renderQuiz = () => {
    if (!questions.length || currentIndex >= questions.length) {
      return (
        <div className="message">
          <h2>No questions available</h2>
          <button className="primary-button" onClick={() => setView('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      );
    }
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.answer;
    
    return (
      <div className="quiz-container">
        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-text">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <button className="text-button exit-button" onClick={resetQuiz}>
              Exit Quiz
            </button>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question card */}
        <div className="card question-card">
          <div className="question-meta">
            {currentQuestion.category && categories.length > 0 && (
              <div className="question-category" style={{
                backgroundColor: categories.find(c => c.id === currentQuestion.category)?.color + '20',
                color: categories.find(c => c.id === currentQuestion.category)?.color
              }}>
                {categories.find(c => c.id === currentQuestion.category)?.name || 'Category'}
              </div>
            )}
            
            {currentQuestion.difficulty && (
              <div className={`question-difficulty difficulty-${currentQuestion.difficulty}`}>
                {currentQuestion.difficulty}
              </div>
            )}
          </div>
          
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          {/* Options */}
          <div className="options-container">
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx} 
                className={`
                  option 
                  ${selectedOption === idx ? 'selected' : ''} 
                  ${showAnswer && idx === currentQuestion.answer ? 'correct' : ''} 
                  ${showAnswer && selectedOption === idx && idx !== currentQuestion.answer ? 'incorrect' : ''}
                `}
                onClick={() => handleSelectOption(idx)}
              >
                <div className="option-marker">{String.fromCharCode(65 + idx)}</div>
                <div className="option-text">{option}</div>
              </div>
            ))}
          </div>
          
          {/* Explanation (when answer is shown) */}
          {showAnswer && (
            <div className={`explanation ${isCorrect ? 'correct-explanation' : 'incorrect-explanation'}`}>
              <div className="result-badge">
                {isCorrect ? 'Correct! ✓' : 'Incorrect ✗'}
              </div>
              {currentQuestion.explanation && (
                <p>{currentQuestion.explanation}</p>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="button-container">
            {/* Navigation dots for quick question access */}
            <div className="question-dots">
              {questions.map((q, idx) => {
                // Find if question has been answered
                const answer = currentSession.answers.find(a => a.questionId === q.id);
                const isAnswered = Boolean(answer);
                const isCorrect = isAnswered && answer.isCorrect;
                
                return (
                  <div 
                    key={idx}
                    className={`
                      question-dot 
                      ${idx === currentIndex ? 'current' : ''} 
                      ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : ''}
                    `}
                    onClick={() => jumpToQuestion(idx)}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
            
            {/* Previous/Next navigation buttons */}
            <div className="navigation-buttons">
              <button 
                className="secondary-button prev-button"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              
              {!showAnswer ? (
                <button 
                  className="primary-button check-button"
                  disabled={selectedOption === null}
                  onClick={checkAnswer}
                >
                  Check Answer
                </button>
              ) : (
                <button 
                  className="primary-button next-button"
                  onClick={nextQuestion}
                >
                  {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Session info */}
        <div className="session-info-panel">
          <div className="session-stat">
            <div className="session-stat-label">Correct</div>
            <div className="session-stat-value">
              {currentSession?.correctCount || 0}/{currentSession?.answers?.length || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Stats view - this code was part of the review function
  // Initializing review data
  const initReviewData = () => {
    const wrongQuestions = [];
    questions.forEach((question) => {
      const answer = currentSession.answers.find(a => a.questionId === question.id);
      if (answer && !answer.isCorrect) {
        wrongQuestions.push(question);
      }
    });
    
    return (
      <div className="review-container">
        <div className="card review-summary-card">
          <h2 className="section-title">Quiz Review</h2>
          
          <div className="review-header">
            <div className="review-score">
              <div className="review-score-value">{accuracy}%</div>
              <div className="review-score-label">
                {correctCount} of {totalQuestions} correct
              </div>
            </div>
            
            <div className="review-meta">
              <div className="review-meta-item">
                <span className="review-meta-label">Date:</span>
                <span className="review-meta-value">
                  {new Date(currentSession.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="review-meta-item">
                <span className="review-meta-label">Time spent:</span>
                <span className="review-meta-value">
                  {formatTime(currentSession.totalTime || 0)}
                </span>
              </div>
            </div>
          </div>
          
          {wrongQuestions.length > 0 && (
            <div className="retry-wrong-container">
              <button 
                className="retry-wrong-button"
                onClick={() => {
                  // Start a new session with wrong questions only
                  const now = Date.now();
                  const newSession = {
                    id: `session-${now}`,
                    startTime: now,
                    endTime: null,
                    questions: wrongQuestions.map(q => q.id),
                    answers: [],
                    correctCount: 0,
                    totalTime: 0,
                    completed: false,
                    isRetry: true
                  };
                  
                  setQuestions(wrongQuestions);
                  setCurrentSession(newSession);
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setShowAnswer(false);
                  setProgress(0);
                  startTimeRef.current = now;
                  questionTimeRef.current = now;
                  setSessions(prev => [newSession, ...prev]);
                  saveSession(newSession);
                  
                  setView('quiz');
                }}
              >
                Practice {wrongQuestions.length} Incorrect Questions
              </button>
            </div>
          )}
        </div>
        
        <div className="card questions-review-card">
          <h3 className="subsection-title">Question Details</h3>
          
          <div className="questions-review-list">
            {questions.map((question, idx) => {
              const answer = currentSession.answers.find(a => a.questionId === question.id);
              const isAnswered = Boolean(answer);
              const isCorrect = isAnswered && answer.isCorrect;
              
              return (
                <div key={question.id} className={`question-review-item ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
                  <div className="question-review-header">
                    <div className="question-review-number">
                      Question {idx + 1}
                    </div>
                    <div className="question-review-status">
                      {isAnswered ? (
                        isCorrect ? 
                          <span className="status-tag correct">Correct ✓</span> : 
                          <span className="status-tag incorrect">Incorrect ✗</span>
                      ) : (
                        <span className="status-tag unanswered">Not answered</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="question-review-text">
                    {question.question}
                  </div>
                  
                  <div className="question-review-options">
                    {question.options.map((option, optIdx) => (
                      <div 
                        key={optIdx} 
                        className={`
                          question-review-option 
                          ${isAnswered && answer.selectedOption === optIdx ? 'selected' : ''} 
                          ${optIdx === question.answer ? 'correct' : ''} 
                          ${isAnswered && answer.selectedOption === optIdx && optIdx !== question.answer ? 'incorrect' : ''}
                        `}
                      >
                        <div className="option-marker">
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <div className="option-text">{option}</div>
                        {optIdx === question.answer && (
                          <div className="correct-answer-icon">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="question-review-explanation">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                  
                  {answer && (
                    <div className="question-review-time">
                      Time spent: {formatTime(answer.timeSpent || 0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="review-actions">
          <button 
            className="secondary-button"
            onClick={() => setView('dashboard')}
          >
            Back to Dashboard
          </button>
          <button 
            className="primary-button"
            onClick={() => {
              // Start a new session with the same questions
              const now = Date.now();
              const newSession = {
                id: `session-${now}`,
                startTime: now,
                endTime: null,
                questions: questions.map(q => q.id),
                answers: [],
                correctCount: 0,
                totalTime: 0,
                completed: false
              };
              
              setCurrentSession(newSession);
              setCurrentIndex(0);
              setSelectedOption(null);
              setShowAnswer(false);
              setProgress(0);
              startTimeRef.current = now;
              questionTimeRef.current = now;
              setSessions(prev => [newSession, ...prev]);
              saveSession(newSession);
              
              setView('quiz');
            }}
          >
            Retry All Questions
          </button>
        </div>
      </div>
    );
  };
  
  // This is the proper stats view function
  const renderStats = () => (
    <div className="stats-container">
      <div className="card stats-card">
        <h2 className="section-title">Your Performance</h2>
        
        <div className="stats-overview">
          <div className="stat-item large">
            <div className="stat-icon large">✓</div>
            <div className="stat-details">
              <div className="stat-value large">
                {stats.totalAnswered > 0 
                  ? `${Math.round((stats.totalCorrect / stats.totalAnswered) * 100)}%` 
                  : 'N/A'}
              </div>
              <div className="stat-label">Overall Accuracy</div>
            </div>
          </div>
          
          <div className="stat-item large">
            <div className="stat-icon large">📚</div>
            <div className="stat-details">
              <div className="stat-value large">{stats.totalAnswered}</div>
              <div className="stat-label">Total Questions Answered</div>
            </div>
          </div>
          
          <div className="stat-item large">
            <div className="stat-icon large">🕒</div>
            <div className="stat-details">
              <div className="stat-value large">
                {stats.totalAnswered > 0 
                  ? `${formatTime(stats.averageTime)}` 
                  : 'N/A'}
              </div>
              <div className="stat-label">Avg Time per Question</div>
            </div>
          </div>
        </div>
        
        <h3 className="subsection-title">Performance by Category</h3>
        
        <div className="categories-stats">
          {Object.keys(stats.byCategory).length === 0 ? (
            <div className="empty-state">No category data yet</div>
          ) : (
            <div className="category-bars">
              {Object.entries(stats.byCategory).map(([catId, catStats]) => (
                <div key={catId} className="category-bar-item">
                  <div className="category-bar-label">
                    {categories.find(c => c.id === parseInt(catId))?.name || `Category ${catId}`}
                  </div>
                  <div className="category-bar-container">
                    <div 
                      className="category-bar-fill" 
                      style={{ 
                        width: `${(catStats.correct / catStats.total) * 100}%`,
                        backgroundColor: categories.find(c => c.id === parseInt(catId))?.color || '#6366f1'
                      }}
                    ></div>
                  </div>
                  <div className="category-bar-value">
                    {Math.round((catStats.correct / catStats.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="card sessions-history-card">
        <h2 className="section-title">Session History</h2>
        
        {sessions.length === 0 ? (
          <div className="empty-state">No sessions yet</div>
        ) : (
          <div className="sessions-table">
            <div className="sessions-table-header">
              <div className="session-cell">Date</div>
              <div className="session-cell">Score</div>
              <div className="session-cell">Time</div>
              <div className="session-cell">Questions</div>
              <div className="session-cell">Actions</div>
            </div>
            
            {sessions.map(session => (
              <div key={session.id} className="sessions-table-row">
                <div className="session-cell">
                  {new Date(session.startTime).toLocaleDateString()}
                </div>
                <div className="session-cell">
                  {session.completed 
                    ? `${Math.round((session.correctCount / session.questions.length) * 100)}%` 
                    : 'In progress'}
                </div>
                <div className="session-cell">
                  {session.totalTime ? formatTime(session.totalTime) : '--:--'}
                </div>
                <div className="session-cell">
                  {session.questions.length}
                </div>
                <div className="session-cell actions">
                  <button 
                    className="icon-button"
                    onClick={() => resumeSession(session)}
                    title={session.completed ? "Review" : "Resume"}
                  >
                    {session.completed ? '📋' : '▶️'}
                  </button>
                  <button 
                    className="icon-button delete-button"
                    onClick={() => deleteSession(session.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="stats-actions">
        <button className="secondary-button" onClick={() => setView('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
  
  // Review view
  const renderReview = () => {
    if (!currentSession || !currentSession.completed) {
      return (
        <div className="message">
          <h2>No session to review</h2>
          <button className="primary-button" onClick={() => setView('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      );
    }
    
    // Get the questions for this session
    const sessionQuestions = currentSession.questions.map(qId => 
      allQuestions.find(q => q.id === qId)
    ).filter(Boolean);
    
    if (sessionQuestions.length === 0) {
      return (
        <div className="message">
          <h2>Could not find questions for this session</h2>
          <button className="primary-button" onClick={() => setView('dashboard')}>
            Back to Dashboard
          </button>
        </div>
      );
    }
    
    // Calculate stats
    const totalQuestions = sessionQuestions.length;
    const correctAnswers = currentSession.answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const averageTime = Math.round(currentSession.totalTime / totalQuestions);
    
    return (
      <div className="review-container">
        {/* Review summary */}
        <div className="card review-summary-card">
          <div className="review-header">
            <div className="review-score">
              <div className="review-score-value">{score}%</div>
              <div className="review-score-label">Score</div>
            </div>
            
            <div className="review-meta">
              <div className="review-meta-item">
                <div className="review-meta-label">Subject:</div>
                <div>{currentSession.subjectName || 'Mixed'}</div>
              </div>
              
              <div className="review-meta-item">
                <div className="review-meta-label">Date:</div>
                <div>{new Date(currentSession.endTime).toLocaleString()}</div>
              </div>
              
              <div className="review-meta-item">
                <div className="review-meta-label">Questions:</div>
                <div>{correctAnswers} correct out of {totalQuestions}</div>
              </div>
              
              <div className="review-meta-item">
                <div className="review-meta-label">Avg Time:</div>
                <div>{formatTime(averageTime)} per question</div>
              </div>
            </div>
          </div>
          
          {/* Retry wrong answers button */}
          <div className="retry-wrong-container">
            <button 
              className="retry-wrong-button"
              onClick={() => retryWrongAnswers(currentSession.id)}
            >
              Practice Wrong Questions ({totalQuestions - correctAnswers})
            </button>
          </div>
          
          <div className="review-actions">
            <button className="secondary-button" onClick={() => setView('dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
        
        {/* Questions review */}
        <div className="card questions-review-card">
          <h2 className="section-title">Question Review</h2>
          
          <div className="questions-review-list">
            {sessionQuestions.map((question, index) => {
              // Find the answer for this question
              const answer = currentSession.answers.find(a => a.questionId === question.id);
              const isAnswered = Boolean(answer);
              const isCorrect = isAnswered && answer.isCorrect;
              
              return (
                <div 
                  key={question.id} 
                  className={`question-review-item ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                >
                  <div className="question-review-header">
                    <div className="question-review-number">Question {index + 1}</div>
                    <div className={`status-tag ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : 'unanswered'}`}>
                      {isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Unanswered'}
                    </div>
                  </div>
                  
                  <div className="question-review-text">{question.question}</div>
                  
                  <div className="question-review-options">
                    {question.options.map((option, optIdx) => {
                      const isSelected = isAnswered && answer.selectedOption === optIdx;
                      const isCorrectOption = optIdx === question.answer;
                      
                      let optionClass = '';
                      if (isSelected) optionClass += ' selected';
                      if (isCorrectOption) optionClass += ' correct';
                      if (isSelected && !isCorrectOption) optionClass += ' incorrect';
                      
                      return (
                        <div 
                          key={optIdx} 
                          className={`question-review-option${optionClass}`}
                        >
                          <div className="option-marker">{String.fromCharCode(65 + optIdx)}</div>
                          <div>{option}</div>
                          {isCorrectOption && <div className="correct-answer-icon">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                  
                  {question.explanation && (
                    <div className="question-review-explanation">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                  
                  {answer && (
                    <div className="question-review-time">
                      Time: {formatTime(answer.timeSpent)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // Settings view
  const renderSettings = () => (
    <div className="settings-container">
      <div className="card settings-card">
        <h2 className="section-title">Settings</h2>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>Dark Mode</h3>
            <p>Switch between light and dark theme</p>
          </div>
          <div className="setting-control">
            <button className="toggle-button" onClick={toggleTheme}>
              {darkMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">
            <h3>Data Management</h3>
            <p>Clear your saved sessions and statistics</p>
          </div>
          <div className="setting-control">
            <button 
              className="danger-button" 
              onClick={() => {
                if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                  localStorage.removeItem('quiz-sessions');
                  localStorage.removeItem('quiz-stats');
                  setSessions([]);
                  setStats({
                    totalCorrect: 0,
                    totalAnswered: 0,
                    averageTime: 0,
                    byCategory: {}
                  });
                }
              }}
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="secondary-button" onClick={() => setView('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
  
  // Main render
  if (loading) {
    return (
      <div className="simple-quiz-container">
        <div className="loader">Loading the app...</div>
      </div>
    );
  }
  
  return (
    <div className="simple-quiz-container">
      {/* Header */}
      <header className="quiz-header">
        <h1 className="gradient-text" onClick={() => setView('dashboard')}>SmartQuiz</h1>
        <div className="nav-buttons">
          <button 
            className={`nav-button ${view === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-button ${view === 'stats' ? 'active' : ''}`} 
            onClick={() => setView('stats')}
          >
            Stats
          </button>
          <button 
            className={`nav-button ${view === 'settings' ? 'active' : ''}`} 
            onClick={() => setView('settings')}
          >
            Settings
          </button>
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      
      {/* Main content based on current view */}
      {view === 'dashboard' && renderDashboard()}
      {view === 'quiz' && renderQuiz()}
      {view === 'stats' && renderStats()}
      {view === 'settings' && renderSettings()}
      {view === 'review' && renderReview()}
    </div>
  );
}

export default SimpleQuiz;
