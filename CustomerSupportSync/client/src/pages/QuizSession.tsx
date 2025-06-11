import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DifficultyBadge from '@/components/DifficultyBadge';
import { useToast } from '@/hooks/use-toast';
import CategoryBadge from '@/components/CategoryBadge';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer?: number; // Only available in review mode
  explanation?: string;
  category: number;
  difficulty: string;
  chosen?: number | null;
  correct?: boolean;
}

interface QuizSessionProps {
  id: string;
}

const QuizSession = ({ id }: QuizSessionProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeRemaining, setTimeRemaining] = useState<number>(1800); // 30 minutes in seconds
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Fetch quiz details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/quiz/${id}`],
    retry: false,
  });

  // Fetch categories for question labels
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Initialize quiz session
  useEffect(() => {
    if (data) {
      setQuestions(data.questions || []);
      
      // Check if there's already progress
      if (data.questions) {
        // Find the first unanswered question
        const firstUnansweredIndex = data.questions.findIndex(q => q.chosen === null || q.chosen === undefined);
        
        if (firstUnansweredIndex >= 0) {
          setCurrentQuestionIndex(firstUnansweredIndex);
        }
        
        // Check if current question is already answered
        const currentQ = data.questions[currentQuestionIndex];
        if (currentQ && currentQ.chosen !== null && currentQ.chosen !== undefined) {
          setSelectedOption(currentQ.chosen);
          setIsAnswered(true);
          setIsCorrect(currentQ.correct || false);
        }
      }
    }
  }, [data, currentQuestionIndex]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update current question when changing index
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      setCurrentQuestion(questions[currentQuestionIndex]);
      const question = questions[currentQuestionIndex];
      
      // Reset state for new question if it's not already answered
      if (!question.chosen) {
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(null);
        setExplanation(null);
        setCorrectAnswer(null);
        setStartTime(new Date());
      } else {
        // Set state for already answered question
        setSelectedOption(question.chosen);
        setIsAnswered(true);
        setIsCorrect(question.correct || false);
        setExplanation(question.explanation || null);
        setCorrectAnswer(question.answer || null);
      }
    }
  }, [currentQuestionIndex, questions]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate progress percentage
  const progress = questions.length > 0
    ? ((questions.filter(q => q.chosen !== undefined && q.chosen !== null).length) / questions.length) * 100
    : 0;

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (selectedOption === null || isAnswered) return;
    
    try {
      const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
      
      const response = await apiRequest('POST', `/api/quiz/${id}/answer`, {
        questionId: currentQuestion?.id,
        chosenAnswer: selectedOption,
        timeSpent,
        isLast: currentQuestionIndex === questions.length - 1
      });
      
      const result = await response.json();
      
      setIsAnswered(true);
      setIsCorrect(result.correct);
      setExplanation(result.explanation || null);
      setCorrectAnswer(result.correctAnswer);
      
      // Update the questions array with this answer
      setQuestions(prevQuestions => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          chosen: selectedOption,
          correct: result.correct
        };
        return updatedQuestions;
      });
      
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate to next or previous question
  const handleNavigate = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Finish quiz
  const handleFinishQuiz = () => {
    navigate(`/review/${id}`);
  };

  // Find category for current question
  const findCategory = (categoryId?: number) => {
    if (!categoryId || !categoriesData?.categories) return null;
    return categoriesData.categories.find(c => c.id === categoryId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Loading Quiz...</h1>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Error Loading Quiz</h1>
        <p className="mt-2 text-neutral-600">There was a problem loading the quiz. Please try again later.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  // If no current question is available
  if (!currentQuestion) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Quiz Not Available</h1>
        <p className="mt-2 text-neutral-600">This quiz session is not available or has no questions.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const category = findCategory(currentQuestion.category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Quiz Session</h1>
      <div className="mt-2 flex items-center text-sm text-neutral-500">
        <DifficultyBadge difficulty={currentQuestion.difficulty} />
        <span className="mx-2">•</span>
        <span>{questions.length} questions</span>
        <span className="mx-2">•</span>
        <span>30 min estimated time</span>
        {category && (
          <>
            <span className="mx-2">•</span>
            <CategoryBadge category={category.name} color={category.color} />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Main quiz content */}
        <div className="col-span-12 lg:col-span-8">
          <Card>
            {/* Progress bar */}
            <Progress value={progress} className="rounded-t-lg rounded-b-none h-2" />
            
            {/* Question content */}
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center text-sm text-neutral-500">
                  <span className="material-icons text-sm mr-1">schedule</span>
                  <span>{formatTime(timeRemaining)} remaining</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg leading-6 font-medium text-neutral-900">{currentQuestion.question}</h3>
                
                <div className="mt-6 space-y-4">
                  <RadioGroup 
                    value={selectedOption?.toString() || ""} 
                    onValueChange={(value) => !isAnswered && setSelectedOption(parseInt(value))}
                  >
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index}
                        className={`bg-neutral-50 p-4 rounded-md border
                          ${isAnswered && index === selectedOption && isCorrect ? 'border-green-500 bg-green-50' : ''}
                          ${isAnswered && index === selectedOption && !isCorrect ? 'border-red-500 bg-red-50' : ''}
                          ${isAnswered && index === correctAnswer ? 'border-green-500 bg-green-50' : ''}
                          ${!isAnswered ? 'border-neutral-200 hover:bg-neutral-100 cursor-pointer' : 'cursor-default'}
                        `}
                      >
                        <div className="flex items-start">
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`option-${index}`}
                            disabled={isAnswered}
                            className="mt-1"
                          />
                          <Label 
                            htmlFor={`option-${index}`}
                            className="ml-3 text-neutral-700"
                          >
                            {option}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {isAnswered && (
                <div className="mt-6">
                  <Alert className={isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <span className="material-icons mr-2">
                      {isCorrect ? "check_circle" : "error"}
                    </span>
                    <AlertTitle>
                      {isCorrect 
                        ? "Correct!" 
                        : `Incorrect! The correct answer is: ${currentQuestion.options[correctAnswer || 0]}`
                      }
                    </AlertTitle>
                    {explanation && (
                      <AlertDescription className="mt-2">
                        {explanation}
                      </AlertDescription>
                    )}
                  </Alert>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => handleNavigate('prev')}
                >
                  <span className="material-icons mr-2 text-sm">arrow_back</span>
                  Previous
                </Button>
                
                {isAnswered ? (
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex === questions.length - 1) {
                        handleFinishQuiz();
                      } else {
                        handleNavigate('next');
                      }
                    }}
                  >
                    {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
                    <span className="material-icons ml-2 text-sm">
                      {currentQuestionIndex === questions.length - 1 ? "done_all" : "arrow_forward"}
                    </span>
                  </Button>
                ) : (
                  <Button onClick={handleSubmitAnswer}>
                    Submit Answer
                    <span className="material-icons ml-2 text-sm">check</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question navigation sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Question navigation */}
          <Card>
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h3 className="text-lg leading-6 font-medium text-neutral-900">Question Navigator</h3>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className={`p-0 w-full h-10
                      ${idx === currentQuestionIndex ? 'border-primary-300 bg-primary-100 text-primary-800' : ''}
                      ${q.chosen !== undefined && q.correct ? 'border-green-200 bg-green-100 text-green-800' : ''}
                      ${q.chosen !== undefined && !q.correct ? 'border-red-200 bg-red-100 text-red-800' : ''}
                    `}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-sm text-neutral-500">
                <div>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-100 border border-green-200"></span>
                  <span className="ml-1">Correct</span>
                </div>
                <div>
                  <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-200"></span>
                  <span className="ml-1">Incorrect</span>
                </div>
                <div>
                  <span className="inline-block w-3 h-3 rounded-full bg-primary-100 border border-primary-300"></span>
                  <span className="ml-1">Current</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz progress */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-neutral-900">Current Progress</h3>
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700">
                    {questions.filter(q => q.chosen !== undefined).length}/{questions.length} completed
                  </span>
                  <span className="text-sm font-medium text-neutral-700">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2.5" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Correct</h4>
                  <p className="mt-1 text-2xl font-semibold text-green-600">
                    {questions.filter(q => q.correct).length}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-500">Incorrect</h4>
                  <p className="mt-1 text-2xl font-semibold text-red-600">
                    {questions.filter(q => q.chosen !== undefined && !q.correct).length}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  className="w-full"
                  variant={progress === 100 ? "default" : "outline"}
                  onClick={handleFinishQuiz}
                  disabled={questions.filter(q => q.chosen !== undefined).length === 0}
                >
                  <span className="material-icons mr-2 text-sm">flag</span>
                  Finish Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;
