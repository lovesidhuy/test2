import { Badge, BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps extends Omit<BadgeProps, 'variant'> {
  category: string;
  color?: string;
  large?: boolean;
}

const CategoryBadge = ({ 
  category, 
  color = '#cccccc',
  large = false,
  className,
  ...props 
}: CategoryBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-white border-gray-200 text-gray-800 gap-1 flex items-center",
        large && "text-sm px-3 py-1",
        className
      )}
      {...props}
    >
      <span 
        className={cn(
          "inline-block w-2 h-2 rounded-full",
          large && "w-3 h-3"
        )}
        style={{ backgroundColor: color }}
      />
      {category}
    </Badge>
  );
};

export default CategoryBadge;
