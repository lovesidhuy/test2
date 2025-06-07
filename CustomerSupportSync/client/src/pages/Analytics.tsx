import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import StatsCard from '@/components/StatsCard';
import ProgressChart from '@/components/ProgressChart';
import DifficultyBadge from '@/components/DifficultyBadge';
import CategoryBadge from '@/components/CategoryBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Analytics = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30");

  // Fetch user attempts
  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['/api/attempts'],
    retry: false,
  });

  // Fetch user stats
  const { data: userStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/user/stats'],
    retry: false,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Calculate analytics stats
  const calculateStats = () => {
    if (!attemptsData?.attempts) return {
      avgScore: 0,
      completionRate: 0,
      avgTimePerQuestion: 0,
      streak: 0
    };

    const attempts = attemptsData.attempts;
    const completedAttempts = attempts.filter(a => a.completed);
    
    // Average score
    const totalScore = completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const avgScore = completedAttempts.length ? Math.round(totalScore / completedAttempts.length) : 0;
    
    // Completion rate
    const completionRate = attempts.length ? Math.round((completedAttempts.length / attempts.length) * 100) : 0;
    
    // Average time per question
    let totalTimeSpent = 0;
    let totalQuestionsAnswered = 0;
    
    completedAttempts.forEach(attempt => {
      totalTimeSpent += attempt.timeSpent || 0;
      totalQuestionsAnswered += attempt.answeredQuestions || 0;
    });
    
    const avgTimePerQuestion = totalQuestionsAnswered 
      ? Math.round(totalTimeSpent / totalQuestionsAnswered) 
      : 0;
    
    // Learning streak (days in a row with completed attempts)
    let streak = 0;
    
    if (userStatsData?.stats) {
      streak = userStatsData.stats.reduce(
        (max, stat) => Math.max(max, stat.streak || 0), 
        0
      );
    }
    
    return {
      avgScore,
      completionRate,
      avgTimePerQuestion,
      streak
    };
  };

  // Find category by ID
  const findCategory = (categoryId?: number) => {
    if (!categoryId || !categoriesData?.categories) return null;
    return categoriesData.categories.find(c => c.id === categoryId);
  };

  // Format time (seconds to mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stats = calculateStats();

  // Loading state
  if (attemptsLoading || statsLoading || categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
        <div className="mt-4">
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Performance Analytics</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">This year</SelectItem>
            <SelectItem value="0">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {/* Analytics overview cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Average Score"
            value={`${stats.avgScore}%`}
            icon="insert_chart"
            iconColor="bg-indigo-100 text-indigo-600"
            trend={+5}
            linkText="View details"
          />
          <StatsCard 
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon="speed"
            iconColor="bg-blue-100 text-blue-600"
            trend={+3}
            linkText="View details"
          />
          <StatsCard 
            title="Avg Time per Question"
            value={formatTime(stats.avgTimePerQuestion)}
            icon="timer"
            iconColor="bg-green-100 text-green-600"
            trend={+8}
            trendDirection="up"
            linkText="View details"
          />
          <StatsCard 
            title="Learning Streak"
            value={`${stats.streak} days`}
            icon="calendar_today"
            iconColor="bg-yellow-100 text-yellow-600"
            trend={+3}
            linkText="View details"
          />
        </div>

        {/* Topic performance chart */}
        <Card className="mt-6">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Performance by Topic</h3>
          </div>
          <CardContent className="p-6">
            <ProgressChart 
              data={userStatsData?.stats || []}
              categories={categoriesData?.categories || []}
              height={380}
              showLabels
            />
          </CardContent>
        </Card>

        {/* Recent quiz attempts */}
        <Card className="mt-6">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Recent Quiz Attempts</h3>
            <Button variant="link" onClick={() => navigate("/")}>View all</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attemptsData?.attempts && attemptsData.attempts.length > 0 ? (
                  attemptsData.attempts.slice(0, 10).map((attempt) => {
                    // Find primary category for this attempt
                    // (This is a simplification - we'd need to fetch categories for all questions in the attempt)
                    const category = findCategory(attempt.categoryId);
                    
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">Quiz #{attempt.id}</TableCell>
                        <TableCell>
                          {attempt.finishedAt 
                            ? new Date(attempt.finishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'In Progress'
                          }
                        </TableCell>
                        <TableCell>
                          {attempt.score ? (
                            <Badge variant={attempt.score >= 80 ? "success" : attempt.score >= 60 ? "outline" : "destructive"}>
                              {attempt.score}%
                            </Badge>
                          ) : (
                            <Badge variant="outline">Incomplete</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {attempt.timeSpent ? formatTime(attempt.timeSpent) : '-'}
                        </TableCell>
                        <TableCell>
                          {category ? (
                            <CategoryBadge category={category.name} color={category.color} />
                          ) : (
                            <span className="text-sm text-neutral-500">Mixed</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="link" 
                            onClick={() => navigate(`/review/${attempt.id}`)}
                            disabled={!attempt.finishedAt}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                      No quiz attempts found. Start a quiz to see your performance data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Difficulty performance */}
        <Card className="mt-6">
          <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Performance by Difficulty</h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {['easy', 'medium', 'hard'].map(difficulty => {
                // Calculate performance for this difficulty
                // (This is a simplified approach - in a real app we'd aggregate stats from the backend)
                let total = 0;
                let correct = 0;
                
                if (attemptsData?.attempts) {
                  attemptsData.attempts.forEach(attempt => {
                    // This assumes we have question data in the attempt, which might not be the case
                    // In a real implementation, you'd want to fetch this data from the backend
                    const questions = attempt.questions || [];
                    
                    questions.forEach(q => {
                      if (q.difficulty.toLowerCase() === difficulty) {
                        total++;
                        if (q.correct) correct++;
                      }
                    });
                  });
                }
                
                const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                
                return (
                  <div key={difficulty} className="flex flex-col items-center">
                    <DifficultyBadge difficulty={difficulty} large />
                    <div className="mt-6 text-center">
                      <h4 className="text-lg font-medium text-neutral-900 mb-2">
                        {percentage}% Accuracy
                      </h4>
                      <p className="text-sm text-neutral-500">
                        {correct} correct out of {total} questions
                      </p>
                    </div>
                    <div className="mt-4 w-full max-w-xs bg-neutral-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full
                          ${difficulty === 'easy' ? 'bg-green-500' : 
                           difficulty === 'medium' ? 'bg-yellow-500' : 
                           'bg-red-500'}
                        `}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
