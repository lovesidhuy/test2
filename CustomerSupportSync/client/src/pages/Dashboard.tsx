import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import StatsCard from "@/components/StatsCard";
import ProgressChart from "@/components/ProgressChart";
import QuizCard from "@/components/QuizCard";
import CategoryBadge from "@/components/CategoryBadge";

const Dashboard = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");

  // Fetch user's attempts
  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['/api/attempts'],
    retry: false,
  });

  // Fetch user stats
  const { data: userStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });

  // Fetch review schedule
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/reviews'],
    retry: false,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Start a new quiz session
  const startNewQuiz = async (categoryId?: number) => {
    try {
      // Fetch questions, potentially filtered by category
      const questionsResponse = await apiRequest(
        'GET', 
        categoryId ? `/api/questions?category=${categoryId}` : '/api/questions'
      );
      
      const questionsData = await questionsResponse.json();
      
      // Check if we have enough questions
      if (!questionsData.questions || questionsData.questions.length === 0) {
        return toast({
          title: "No Questions Available",
          description: "There are no questions available for this category.",
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

  // Calculate dashboard stats
  const calculateStats = () => {
    if (!attemptsData?.attempts) return {
      totalSessions: 0,
      avgScore: 0,
      masteredTopics: 0,
      avgTime: 0,
    };

    const attempts = attemptsData.attempts;
    const completedAttempts = attempts.filter(a => a.completed);
    
    // Total sessions
    const totalSessions = attempts.length;
    
    // Average score
    const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const avgScore = completedAttempts.length ? Math.round(totalScore / completedAttempts.length) : 0;
    
    // Mastered topics (categories with score > 80%)
    const masteredTopics = userStatsData?.stats 
      ? userStatsData.stats.filter(stat => 
          (stat.correctAnswers / stat.totalAttempts) * 100 >= 80
        ).length
      : 0;
    
    // Average time per quiz
    const totalTime = completedAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0);
    const avgTime = completedAttempts.length 
      ? Math.round(totalTime / completedAttempts.length / 60) // Convert to minutes
      : 0;
    
    return {
      totalSessions,
      avgScore,
      masteredTopics,
      avgTime
    };
  };

  // Get recent progress
  const getRecentProgress = () => {
    if (!attemptsData?.attempts) return [];
    
    // Get the most recent completed attempts
    return attemptsData.attempts
      .filter(a => a.completed)
      .slice(0, 3)
      .map(attempt => ({
        id: attempt.id,
        title: `Quiz ${attempt.id}`,
        score: attempt.score || 0,
        date: new Date(attempt.finishedAt).toLocaleDateString(),
        status: attempt.score >= 90 ? "Mastered" : 
                attempt.score >= 70 ? "In Progress" : "Review Needed"
      }));
  };

  // Get upcoming reviews
  const getUpcomingReviews = () => {
    if (!reviewsData?.reviews) return [];
    
    // Get the upcoming scheduled reviews
    return reviewsData.reviews.slice(0, 3).map(review => {
      // Find the category for this question
      const category = categoriesData?.categories?.find(c => c.id === review.question.category);
      
      return {
        id: review.id,
        title: review.question.question.length > 30 
          ? `${review.question.question.substring(0, 30)}...` 
          : review.question.question,
        category: category?.name || "General",
        categoryColor: category?.color || "#666",
        difficulty: review.question.difficulty,
        questionCount: 1,
        dueDate: new Date(review.nextReview).toLocaleDateString()
      };
    });
  };

  const stats = calculateStats();
  const recentProgress = getRecentProgress();
  const upcomingReviews = getUpcomingReviews();

  // Loading state
  if (attemptsLoading || statsLoading || reviewsLoading || categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <div className="mt-4">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <Button onClick={() => startNewQuiz()}>
          <span className="material-icons mr-2 text-sm">add</span>
          New Quiz Session
        </Button>
      </div>
      
      <div className="mt-6">
        {/* Stats overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Quiz Sessions"
            value={stats.totalSessions.toString()}
            icon="fact_check"
            iconColor="bg-indigo-100 text-indigo-600"
            trend={+10}
          />
          <StatsCard 
            title="Average Score"
            value={`${stats.avgScore}%`}
            icon="leaderboard" 
            iconColor="bg-green-100 text-green-600"
            trend={+5}
          />
          <StatsCard 
            title="Mastered Topics"
            value={stats.masteredTopics.toString()}
            icon="emoji_events"
            iconColor="bg-blue-100 text-blue-600"
            trend={+2}
          />
          <StatsCard 
            title="Average Time Spent"
            value={`${stats.avgTime} min`}
            icon="schedule"
            iconColor="bg-yellow-100 text-yellow-600"
            trend={-10}
            trendDirection="down"
          />
        </div>
        
        {/* Recent progress & scheduled reviews */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Recent progress */}
          <Card>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Recent Progress</h3>
              <Button variant="link" onClick={() => navigate("/analytics")}>View all</Button>
            </div>
            <CardContent className="border-t border-neutral-200 p-0">
              <div className="space-y-4 p-6">
                {recentProgress.length > 0 ? (
                  recentProgress.map((progress, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-neutral-900">{progress.title}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-neutral-500">{progress.score}% Score</span>
                            <span className="mx-2 text-neutral-300">•</span>
                            <span className="text-xs text-neutral-500">{progress.date}</span>
                          </div>
                        </div>
                        <div className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${progress.status === "Mastered" ? "bg-green-100 text-green-800" : 
                            progress.status === "In Progress" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-orange-100 text-orange-800"}
                        `}>
                          {progress.status}
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-neutral-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full
                            ${progress.status === "Mastered" ? "bg-green-500" : 
                              progress.status === "In Progress" ? "bg-yellow-500" : 
                              "bg-orange-500"}
                          `}
                          style={{ width: `${progress.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-sm">No quiz attempts yet. Start a new quiz session to track your progress.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Scheduled for review */}
          <Card>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Scheduled for Review</h3>
              <Button variant="link" onClick={() => navigate("/questions")}>Manage schedule</Button>
            </div>
            <CardContent className="border-t border-neutral-200 p-0">
              <div className="space-y-4 p-6">
                {upcomingReviews.length > 0 ? (
                  upcomingReviews.map((review, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-md p-2 flex-shrink-0">
                          <span className="material-icons text-blue-600">assignment</span>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-neutral-900">{review.title}</h4>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              <CategoryBadge category={review.category} color={review.categoryColor} />
                            </div>
                            <span className="mx-2 text-neutral-300">•</span>
                            <span className="text-xs text-neutral-500">{review.questionCount} question{review.questionCount !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-neutral-900">{review.dueDate}</span>
                        <button className="ml-4 p-1 text-neutral-400 hover:text-neutral-500 focus:outline-none focus:text-neutral-500">
                          <span className="material-icons">more_vert</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-sm">No reviews scheduled. Complete quizzes to build your review schedule.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance overview */}
        <div className="mt-6">
          <Card>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-neutral-900">Performance Overview</h3>
              <select 
                className="mt-1 block pl-3 pr-10 py-2 text-base border-neutral-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">This year</option>
                <option value="0">All time</option>
              </select>
            </div>
            <CardContent className="border-t border-neutral-200">
              <ProgressChart 
                data={userStatsData?.stats || []}
                categories={categoriesData?.categories || []} 
              />
              
              <div className="mt-6 grid grid-cols-3 gap-5">
                {userStatsData?.stats && userStatsData.stats.length > 0 ? (
                  <>
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-neutral-500">Strongest Category</h4>
                      {(() => {
                        // Find category with highest correct percentage
                        const stats = [...userStatsData.stats];
                        stats.sort((a, b) => {
                          const aPercentage = a.totalAttempts ? (a.correctAnswers / a.totalAttempts) * 100 : 0;
                          const bPercentage = b.totalAttempts ? (b.correctAnswers / b.totalAttempts) * 100 : 0;
                          return bPercentage - aPercentage;
                        });
                        
                        const topStat = stats[0];
                        if (!topStat) return <p>No data available</p>;
                        
                        const category = categoriesData?.categories?.find(c => c.id === topStat.categoryId);
                        const percentage = topStat.totalAttempts 
                          ? Math.round((topStat.correctAnswers / topStat.totalAttempts) * 100) 
                          : 0;
                          
                        return (
                          <>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{category?.name || 'Unknown'}</p>
                            <p className="text-sm text-neutral-500">{percentage}% average</p>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-neutral-500">Needs Improvement</h4>
                      {(() => {
                        // Find category with lowest correct percentage
                        const stats = [...userStatsData.stats];
                        stats.sort((a, b) => {
                          const aPercentage = a.totalAttempts ? (a.correctAnswers / a.totalAttempts) * 100 : 0;
                          const bPercentage = b.totalAttempts ? (b.correctAnswers / b.totalAttempts) * 100 : 0;
                          return aPercentage - bPercentage;
                        });
                        
                        const lowestStat = stats[0];
                        if (!lowestStat) return <p>No data available</p>;
                        
                        const category = categoriesData?.categories?.find(c => c.id === lowestStat.categoryId);
                        const percentage = lowestStat.totalAttempts 
                          ? Math.round((lowestStat.correctAnswers / lowestStat.totalAttempts) * 100) 
                          : 0;
                          
                        return (
                          <>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{category?.name || 'Unknown'}</p>
                            <p className="text-sm text-neutral-500">{percentage}% average</p>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="border border-neutral-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-neutral-500">Learning Streak</h4>
                      {(() => {
                        // Find the longest streak
                        const longestStreak = userStatsData.stats.reduce(
                          (max, stat) => Math.max(max, stat.streak || 0), 
                          0
                        );
                        
                        return (
                          <>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{longestStreak} days</p>
                            <p className="text-sm text-neutral-500">+{Math.floor(Math.random() * 5)} from last month</p>
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="col-span-3">
                    <p className="text-neutral-500 text-center">Complete quizzes to see your performance metrics.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Category quick starts */}
        {categoriesData?.categories && categoriesData.categories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Start Quiz by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categoriesData.categories.map(category => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => startNewQuiz(category.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mb-2" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
