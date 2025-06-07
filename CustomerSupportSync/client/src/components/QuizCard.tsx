import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DifficultyBadge from './DifficultyBadge';
import CategoryBadge from './CategoryBadge';

interface QuizCardProps {
  id: number;
  title: string;
  category?: {
    name: string;
    color: string;
  };
  difficulty?: string;
  questionCount: number;
  progress?: number;
  score?: number;
  dueDate?: string;
  status?: 'In Progress' | 'Completed' | 'Not Started' | 'Mastered' | 'Review Needed' | 'In Progress';
  className?: string;
}

const QuizCard = ({
  id,
  title,
  category,
  difficulty,
  questionCount,
  progress = 0,
  score,
  dueDate,
  status = 'Not Started',
  className = '',
}: QuizCardProps) => {
  const [, navigate] = useLocation();

  // Handle action button click
  const handleAction = () => {
    if (status === 'In Progress' || status === 'Not Started') {
      navigate(`/quiz/${id}`);
    } else if (status === 'Completed' || status === 'Mastered' || status === 'Review Needed') {
      navigate(`/review/${id}`);
    }
  };

  // Get status badge variant
  const getStatusBadge = () => {
    switch (status) {
      case 'Mastered':
        return <Badge variant="success">{status}</Badge>;
      case 'Completed':
        return <Badge variant="outline">{status}</Badge>;
      case 'In Progress':
        return <Badge variant="secondary">{status}</Badge>;
      case 'Review Needed':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get button text based on status
  const getButtonText = () => {
    switch (status) {
      case 'In Progress':
        return 'Continue';
      case 'Completed':
      case 'Mastered':
      case 'Review Needed':
        return 'Review';
      default:
        return 'Start';
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg text-neutral-900 mb-2">{title}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {category && (
            <CategoryBadge category={category.name} color={category.color} />
          )}
          
          {difficulty && (
            <DifficultyBadge difficulty={difficulty} />
          )}
          
          <Badge variant="outline" className="bg-neutral-50">
            {questionCount} question{questionCount !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {progress > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {score !== undefined && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-sm">
              <span className="material-icons text-green-500 text-sm">leaderboard</span>
              Score: <span className="font-semibold">{score}%</span>
            </div>
          </div>
        )}
        
        {dueDate && (
          <div className="mb-3 text-sm text-neutral-600">
            <div className="flex items-center gap-1">
              <span className="material-icons text-sm">event</span>
              Due: {dueDate}
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleAction}
          variant={status === 'Not Started' ? 'outline' : 'default'}
          className="mt-2 w-full"
        >
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizCard;
