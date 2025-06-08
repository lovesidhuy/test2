import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface UserStat {
  id: number;
  userId: number;
  categoryId: number;
  totalAttempts: number;
  correctAnswers: number;
  avgTimePerQuestion?: number;
  lastAttempt?: string;
  streak?: number;
  category?: {
    id: number;
    name: string;
    color: string;
  };
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface ProgressChartProps {
  data: UserStat[];
  categories: Category[];
  height?: number;
  showLabels?: boolean;
}

const ProgressChart = ({ data, categories, height = 300, showLabels = false }: ProgressChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'score' | 'time' | 'attempts'>('score');

  // Process data for chart
  useEffect(() => {
    if (!data || !categories) return;
    
    // Merge category information with stats
    const enrichedData = data.map(stat => {
      const category = categories.find(c => c.id === stat.categoryId);
      return {
        ...stat,
        category,
      };
    });
    
    // Format data for chart
    const formattedData = enrichedData.map(stat => {
      // Calculate score percentage
      const scorePercentage = stat.totalAttempts > 0 
        ? Math.round((stat.correctAnswers / stat.totalAttempts) * 100) 
        : 0;
      
      // Format time in minutes
      const timeInMinutes = stat.avgTimePerQuestion 
        ? Math.round(stat.avgTimePerQuestion / 60 * 10) / 10 
        : 0;
      
      return {
        name: stat.category?.name || `Category ${stat.categoryId}`,
        score: scorePercentage,
        time: stat.avgTimePerQuestion || 0,
        timeFormatted: timeInMinutes,
        attempts: stat.totalAttempts,
        color: stat.category?.color || '#cccccc',
      };
    });
    
    setChartData(formattedData);
  }, [data, categories]);

  // Format tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="bg-white p-2 shadow-md border border-neutral-200">
          <CardContent className="p-2">
            <p className="font-bold">{label}</p>
            {chartType === 'score' && (
              <p className="text-sm">{`Score: ${payload[0].value}%`}</p>
            )}
            {chartType === 'time' && (
              <p className="text-sm">{`Avg. Time: ${payload[0].payload.timeFormatted} min`}</p>
            )}
            {chartType === 'attempts' && (
              <p className="text-sm">{`Total Attempts: ${payload[0].value}`}</p>
            )}
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div>
      <Tabs 
        value={chartType} 
        onValueChange={(value) => setChartType(value as 'score' | 'time' | 'attempts')} 
        className="mb-4 w-full max-w-xs mx-auto"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="attempts">Attempts</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: showLabels ? 50 : 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={showLabels ? -45 : 0}
              textAnchor={showLabels ? "end" : "middle"}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={chartType === 'score' ? [0, 100] : [0, 'auto']}
              tickFormatter={value => {
                if (chartType === 'score') return `${value}%`;
                if (chartType === 'time') return `${Math.round(value / 60)}m`;
                return value;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLabels && <Legend />}
            <Bar 
              dataKey={chartType} 
              name={chartType === 'score' ? 'Score' : chartType === 'time' ? 'Time' : 'Attempts'}
              fill={({ color }) => color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-neutral-500">
          No data available. Complete quizzes to see your progress.
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
