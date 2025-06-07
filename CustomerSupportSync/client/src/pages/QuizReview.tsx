import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import DifficultyBadge from '@/components/DifficultyBadge';
import CategoryBadge from '@/components/CategoryBadge';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

interface QuizReviewProps {
  id: string;
}

const QuizReview = ({ id }: QuizReviewProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  // Fetch quiz review data
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/quiz/${id}`],
    retry: false,
  });

  // Fetch categories for question labels
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Calculate quiz stats when data is loaded
  useEffect(() => {
    if (data?.questions) {
      const total = data.questions.length;
      const correct = data.questions.filter((q: any) => q.correct).length;
      setScore(Math.round((correct / total) * 100));
      setTotalQuestions(total);
      
      // Sum up time spent on each question
      const time = data.questions.reduce((acc: number, q: any) => acc + (q.timeSpent || 0), 0);
      setTimeSpent(time);
    }
  }, [data]);

  // Format time for display (seconds to mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format full time including hours if needed
  const formatFullTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins} minute${mins !== 1 ? 's' : ''}${secs > 0 ? ` ${secs} second${secs !== 1 ? 's' : ''}` : ''}`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  // Calculate average time per question
  const avgTimePerQuestion = totalQuestions ? Math.round(timeSpent / totalQuestions) : 0;

  // Filter questions based on current filter
  const filteredQuestions = data?.questions ? 
    filter === 'all' ? data.questions :
    filter === 'correct' ? data.questions.filter((q: any) => q.correct) :
    data.questions.filter((q: any) => !q.correct)
    : [];

  // Find category for given category id
  const findCategory = (categoryId?: number) => {
    if (!categoryId || !categoriesData?.categories) return null;
    return categoriesData.categories.find(c => c.id === categoryId);
  };

  // Start a new quiz
  const startNewQuiz = async () => {
    try {
      // Fetch questions
      const questionsResponse = await apiRequest('GET', '/api/questions');
      const questionsData = await questionsResponse.json();
      
      // Check if we have enough questions
      if (!questionsData.questions || questionsData.questions.length === 0) {
        return toast({
          title: "No Questions Available",
          description: "There are no questions available at the moment.",
          variant: "destructive",
        });
      }

      // Select up to 15 random questions
      const selectedQuestions = questionsData.questions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(15, questionsData.questions.length));

      // Start a new quiz attempt with these questions
      const response = await apiRequest(
        'POST',
        '/api/quiz/start',
        { questionIds: selectedQuestions.map(q => q.id) }
      );
      
      const data = await response.json();
      
      // Navigate to the quiz session
      navigate(`/quiz/${data.attemptId}`);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      toast({
        title: "Error Starting Quiz",
        description: "There was a problem starting a new quiz session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Practice incorrect questions
  const practiceIncorrect = async () => {
    try {
      // Get the incorrect questions from this attempt
      const incorrectQuestions = data.questions.filter((q: any) => !q.correct);
      
      if (incorrectQuestions.length === 0) {
        return toast({
          title: "No Incorrect Questions",
          description: "There are no incorrect questions to practice.",
          variant: "success",
        });
      }

      // Start a new quiz attempt with these questions
      const response = await apiRequest(
        'POST',
        '/api/quiz/start',
        { questionIds: incorrectQuestions.map(q => q.id) }
      );
      
      const responseData = await response.json();
      
      // Navigate to the quiz session
      navigate(`/quiz/${responseData.attemptId}`);
    } catch (error) {
      console.error("Failed to start practice quiz:", error);
      toast({
        title: "Error Starting Practice",
        description: "There was a problem starting the practice session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Loading Quiz Review...</h1>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Error Loading Quiz Review</h1>
        <p className="mt-2 text-neutral-600">There was a problem loading the quiz review. Please try again later.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Quiz Review</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Completed on {new Date(data.attempt.finishedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <span className="material-icons mr-1 text-sm">dashboard</span>
            Dashboard
          </Button>
          <Button variant="outline" onClick={startNewQuiz}>
            <span className="material-icons mr-1 text-sm">add</span>
            New Quiz
          </Button>
          <Button onClick={practiceIncorrect}>
            <span className="material-icons mr-1 text-sm">replay</span>
            Practice Incorrect
          </Button>
        </div>
      </div>

      {/* Quiz summary card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Score</h3>
              <p className="mt-2 text-3xl font-bold text-blue-900">{score}%</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Correct Answers</h3>
              <p className="mt-2 text-3xl font-bold text-green-900">
                {data.questions.filter((q: any) => q.correct).length}/{totalQuestions}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Time Spent</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-900">{formatFullTime(timeSpent)}</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Avg Time per Question</h3>
              <p className="mt-2 text-3xl font-bold text-purple-900">{formatTime(avgTimePerQuestion)}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-3">Performance by Category</h3>
            <div className="space-y-4">
              {categoriesData?.categories && categoriesData.categories.map(category => {
                // Filter questions for this category
                const categoryQuestions = data.questions.filter((q: any) => q.category === category.id);
                if (categoryQuestions.length === 0) return null;
                
                // Calculate stats for this category
                const correct = categoryQuestions.filter((q: any) => q.correct).length;
                const percentage = Math.round((correct / categoryQuestions.length) * 100);
                
                return (
                  <div key={category.id} className="bg-neutral-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h4 className="text-sm font-medium text-neutral-900">{category.name}</h4>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{correct}/{categoryQuestions.length}</span> correct
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: category.color 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question review section */}
      <div className="mt-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-neutral-900">Question Review</h2>
            <div className="mt-3 sm:mt-0 flex space-x-2">
              <Button 
                variant={filter === 'all' ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({data.questions.length})
              </Button>
              <Button 
                variant={filter === 'correct' ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter('correct')}
              >
                Correct ({data.questions.filter((q: any) => q.correct).length})
              </Button>
              <Button 
                variant={filter === 'incorrect' ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilter('incorrect')}
              >
                Incorrect ({data.questions.filter((q: any) => !q.correct).length})
              </Button>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question: any, index: number) => {
                  const category = findCategory(question.category);
                  
                  return (
                    <div key={question.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div className="flex items-center">
                          <Badge variant={question.correct ? "success" : "destructive"} className="mr-2">
                            Question {index + 1}
                          </Badge>
                          {category && (
                            <CategoryBadge category={category.name} color={category.color} />
                          )}
                          <DifficultyBadge difficulty={question.difficulty} className="ml-2" />
                        </div>
                        <div className="mt-2 sm:mt-0 text-sm text-neutral-500">
                          Time spent: {formatTime(question.timeSpent || 0)}
                        </div>
                      </div>
                      
                      <h3 className="text-base font-medium text-neutral-900 mb-3">{question.question}</h3>
                      
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <div 
                            key={optionIndex}
                            className={`p-3 rounded-md text-sm
                              ${optionIndex === question.answer ? 'bg-green-50 border border-green-200' : ''}
                              ${optionIndex === question.chosen && optionIndex !== question.answer ? 'bg-red-50 border border-red-200' : ''}
                              ${optionIndex !== question.answer && optionIndex !== question.chosen ? 'bg-neutral-50 border border-neutral-200' : ''}
                            `}
                          >
                            <div className="flex">
                              <span className="flex-shrink-0 w-5">
                                {optionIndex === question.answer && (
                                  <span className="material-icons text-green-600 text-sm">check_circle</span>
                                )}
                                {optionIndex === question.chosen && optionIndex !== question.answer && (
                                  <span className="material-icons text-red-600 text-sm">cancel</span>
                                )}
                              </span>
                              <span>{option}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {question.explanation && (
                        <Alert className="mt-4 bg-blue-50 border-blue-200">
                          <span className="material-icons mr-2 text-blue-600">info</span>
                          <AlertTitle>Explanation</AlertTitle>
                          <AlertDescription>
                            {question.explanation}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-neutral-500 py-8">No questions match the selected filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizReview;
