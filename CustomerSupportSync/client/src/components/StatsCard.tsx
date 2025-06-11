import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  linkText?: string;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  value,
  icon,
  iconColor,
  trend,
  trendDirection = 'up',
  linkText,
  onClick,
}: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconColor.includes('bg-') ? iconColor : 'bg-primary-100'} rounded-md p-3`}>
            <span className={`material-icons ${iconColor.includes('text-') ? iconColor : 'text-primary-600'}`}>{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-neutral-900">{value}</div>
                
                {trend !== undefined && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trendDirection === 'up' 
                      ? trend >= 0 ? 'text-green-600' : 'text-red-600' 
                      : trend >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span className="material-icons text-xs self-center">
                      {trendDirection === 'up' 
                        ? trend >= 0 ? 'arrow_upward' : 'arrow_downward'
                        : trend >= 0 ? 'arrow_upward' : 'arrow_downward'
                      }
                    </span>
                    <span className="sr-only">
                      {trendDirection === 'up' 
                        ? trend >= 0 ? 'Increased by' : 'Decreased by'
                        : trend >= 0 ? 'Increased by' : 'Decreased by'
                      }
                    </span>
                    {Math.abs(trend)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
        
        {linkText && (
          <div className="mt-3 text-sm">
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium text-primary-600 hover:text-primary-800"
              onClick={onClick}
            >
              {linkText}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
