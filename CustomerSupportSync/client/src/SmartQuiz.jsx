import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from './lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  FileQuestion,
  Import,
  RotateCw,
  Upload,
  XCircle,
  Timer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpenCheck,
  Folder,
  List
} from 'lucide-react';

function SmartQuiz() {
  // State variables
  const [activeTab, setActiveTab] = useState('quiz');
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importSubject, setImportSubject] = useState('');
  const [attemptHistory, setAttemptHistory] = useState([]);
  const { toast } = useToast();

  // Fetch subjects when component mounts
  useEffect(() => {
    fetchSubjects();
    fetchAttempts();
  }, []);

  // Fetch questions when subject changes
  useEffect(() => {
    if (currentSubject) {
      fetchQuestions(currentSubject);
    }
  }, [currentSubject]);

  // Fetch subjects from API
  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/subjects', { method: 'GET' });
      if (response.subjects && response.subjects.length > 0) {
        setSubjects(response.subjects);
        setCurrentSubject(response.subjects[0].id);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subjects. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Fetch questions for a specific subject
  const fetchQuestions = async (subjectId) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('/api/questions?subject=' + subjectId, { method: 'GET' });
      if (response.questions) {
        // Shuffle questions for the quiz
        const shuffledQuestions = [...response.questions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Fetch attempt history
  const fetchAttempts = async () => {
    try {
      const response = await apiRequest('/api/attempts', { method: 'GET' });
      if (response.attempts) {
        setAttemptHistory(response.attempts);
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
    }
  };

  // Start a new quiz
  const startQuiz = () => {
    if (questions.length === 0) {
      toast({
        title: 'No Questions',
        description: 'There are no questions available for this subject.',
        variant: 'destructive',
      });
      return;
    }
    
    setAnswers({});
    setCurrentQuestion(0);
    setQuizStarted(true);
    setQuizCompleted(false);
    setShowResults(false);
  };

  // Handle question selection
  const handleAnswer = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    });
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeQuiz();
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Complete the quiz and show results
  const completeQuiz = async () => {
    try {
      setIsLoading(true);

      // Calculate score
      let correctCount = 0;
      const questionsWithAnswers = questions.map((q, index) => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) correctCount++;
        
        return {
          ...q,
          userAnswer,
          isCorrect
        };
      });
      
      const score = Math.round((correctCount / questions.length) * 100);
      
      // Save attempt to server
      const attemptData = {
        questionIds: questions.map(q => q.id),
        score,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answer
        }))
      };
      
      await apiRequest('/api/quiz/finish', {
        method: 'POST',
        data: attemptData
      });
      
      setQuestions(questionsWithAnswers);
      setQuizCompleted(true);
      setShowResults(true);
      setIsLoading(false);
      
      // Fetch updated attempts after completing
      fetchAttempts();
      
      toast({
        title: 'Quiz Completed!',
        description: `Your score: ${score}%`,
        variant: score >= 70 ? 'default' : 'destructive',
      });
      
    } catch (error) {
      console.error('Error completing quiz:', error);
      setIsLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to save quiz results. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle file upload for question import
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/json') {
        toast({
          title: 'Invalid File',
          description: 'Please select a JSON file.',
          variant: 'destructive',
        });
        return;
      }
      setImportFile(file);
    }
  };

  // Import questions from JSON file
  const importQuestions = async () => {
    if (!importFile || !importSubject) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and subject.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Read the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const questions = JSON.parse(e.target.result);
          
          // Validate questions format
          if (!Array.isArray(questions)) {
            throw new Error('Invalid format: Questions must be an array');
          }
          
          // Send to server
          const response = await apiRequest('/api/import/questions', {
            method: 'POST',
            data: {
              questions,
              subjectId: parseInt(importSubject)
            }
          });
          
          setImportDialogOpen(false);
          setImportFile(null);
          setImportSubject('');
          
          toast({
            title: 'Import Successful',
            description: `Imported ${response.questions?.length || 0} questions successfully.`,
          });
          
          // Refresh subjects and questions
          fetchSubjects();
          if (currentSubject) {
            fetchQuestions(currentSubject);
          }
          
        } catch (error) {
          console.error('Error parsing JSON:', error);
          toast({
            title: 'Invalid JSON',
            description: 'The selected file contains invalid JSON data.',
            variant: 'destructive',
          });
        }
        
        setIsLoading(false);
      };
      
      reader.readAsText(importFile);
      
    } catch (error) {
      console.error('Error importing questions:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import questions. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Create a new subject
  const createSubject = async (name) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('/api/subjects', {
        method: 'POST',
        data: { name }
      });
      
      if (response.subject) {
        fetchSubjects();
        toast({
          title: 'Subject Created',
          description: `Subject "${name}" has been created.`,
        });
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subject. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Render question view
  const renderQuestion = () => {
    if (!quizStarted || questions.length === 0) {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>Select a subject and start your quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={currentSubject} 
                  onValueChange={(value) => setCurrentSubject(value)}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline">
              <Import className="mr-2 h-4 w-4" />
              Import Questions
            </Button>
            <Button onClick={startQuiz} disabled={!currentSubject || isLoading || questions.length === 0}>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (showResults) {
      return renderResults();
    }

    const question = questions[currentQuestion];
    const userAnswer = answers[question.id];
    
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Question {currentQuestion + 1} of {questions.length}</CardTitle>
            <Badge variant="outline">{question.difficulty}</Badge>
          </div>
          <Progress value={(currentQuestion + 1) / questions.length * 100} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium">{question.question}</div>
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={userAnswer === index ? "default" : "outline"}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(question.id, index)}
              >
                {String.fromCharCode(65 + index)}. {option}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={prevQuestion} disabled={currentQuestion === 0} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={nextQuestion} disabled={userAnswer === undefined}>
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            {currentQuestion === questions.length - 1 ? 
              <CheckCircle className="ml-2 h-4 w-4" /> : 
              <ChevronRight className="ml-2 h-4 w-4" />
            }
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render quiz results
  const renderResults = () => {
    // Count correct answers
    const correctCount = questions.filter(q => answers[q.id] === q.answer).length;
    const score = Math.round((correctCount / questions.length) * 100);
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>
            You scored {correctCount} out of {questions.length} ({score}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center p-4">
            <div className="w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center text-3xl font-bold">
              {score}%
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isCorrect = answers[question.id] === question.answer;
              
              return (
                <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-2">
                    {isCorrect ? 
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> : 
                      <XCircle className="h-5 w-5 text-red-500 mt-1" />
                    }
                    <div>
                      <div className="font-medium mb-2">{index + 1}. {question.question}</div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium">Your answer:</span> {question.options[answers[question.id]]}
                        </div>
                        {!isCorrect && (
                          <div className="mb-1 text-green-700">
                            <span className="font-medium">Correct answer:</span> {question.options[question.answer]}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-gray-700">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setQuizStarted(false);
            setQuizCompleted(false);
            setShowResults(false);
          }}>
            <BookOpen className="mr-2 h-4 w-4" />
            New Quiz
          </Button>
          <Button onClick={() => {
            setShowResults(false);
            setCurrentQuestion(0);
          }}>
            <RotateCw className="mr-2 h-4 w-4" />
            Review Questions
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render attempt history
  const renderHistory = () => {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quiz History</CardTitle>
          <CardDescription>Your past quiz attempts and scores</CardDescription>
        </CardHeader>
        <CardContent>
          {attemptHistory.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <FileQuestion className="mx-auto h-12 w-12 mb-2 text-gray-400" />
              <p>No quiz attempts yet. Start a quiz to see your history!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attemptHistory.map((attempt, index) => (
                <Card key={index} className="w-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Quiz #{attempt.id}</CardTitle>
                      {attempt.score !== null && (
                        <Badge variant={attempt.score >= 70 ? "default" : "outline"}>
                          {attempt.score}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {new Date(attempt.startedAt).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <FileQuestion className="mr-1 h-4 w-4" />
                        {attempt.totalQuestions} questions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">SmartQuiz</h1>
          <p className="text-gray-500">Test your knowledge with adaptive quizzes</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="quiz">
              <BookOpen className="mr-2 h-4 w-4" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="history">
              <BarChart3 className="mr-2 h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="quiz" className="space-y-4">
            {renderQuestion()}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {renderHistory()}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Import Questions Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload a JSON file containing quiz questions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Select Subject</Label>
              <Select value={importSubject} onValueChange={setImportSubject}>
                <SelectTrigger id="import-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">JSON File</Label>
              <Input
                type="file"
                id="file"
                accept=".json"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500">
                The JSON file should contain an array of question objects
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Folder className="mr-2 h-4 w-4" />
                  Create New Subject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create New Subject</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter a name for the new subject category
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    id="new-subject"
                    placeholder="Subject name"
                    className="mb-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    const subjectName = document.getElementById('new-subject').value;
                    if (subjectName) {
                      createSubject(subjectName);
                    }
                  }}>Create</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={importQuestions} disabled={!importFile || !importSubject}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SmartQuiz;
