import { Badge, BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps extends Omit<BadgeProps, 'variant'> {
  difficulty: string;
  large?: boolean;
}

const DifficultyBadge = ({ 
  difficulty, 
  large = false,
  className,
  ...props 
}: DifficultyBadgeProps) => {
  let badgeColor = '';
  const lowerDifficulty = difficulty.toLowerCase();

  if (lowerDifficulty === 'easy') {
    badgeColor = 'bg-green-100 text-green-800 hover:bg-green-200';
  } else if (lowerDifficulty === 'medium') {
    badgeColor = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
  } else if (lowerDifficulty === 'hard') {
    badgeColor = 'bg-red-100 text-red-800 hover:bg-red-200';
  }

  return (
    <Badge
      className={cn(
        badgeColor,
        large && "text-sm px-3 py-1",
        className
      )}
      {...props}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  );
};

export default DifficultyBadge;
