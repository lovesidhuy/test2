import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  category?: number;
  difficulty: string;
}

interface QuestionFormProps {
  editQuestion: Question | null;
  categories: Category[];
  onSuccess: () => void;
}

const questionSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  explanation: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().min(1, 'Difficulty is required'),
  answer: z.number().min(0, 'Please select a correct answer'),
});

const QuestionForm = ({ editQuestion, categories, onSuccess }: QuestionFormProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<string[]>(
    editQuestion?.options || ['', '', '', '']
  );

  // Create form
  const form = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: editQuestion?.question || '',
      explanation: editQuestion?.explanation || '',
      category: editQuestion?.category ? String(editQuestion.category) : '',
      difficulty: editQuestion?.difficulty || 'medium',
      answer: editQuestion?.answer || 0,
    },
  });

  // Create or update question mutation
  const questionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Prepare payload
      const payload = {
        ...data,
        options,
        category: data.category ? parseInt(data.category) : undefined,
      };

      if (editQuestion) {
        // Update existing question
        return apiRequest('PUT', `/api/questions/${editQuestion.id}`, payload);
      } else {
        // Create new question
        return apiRequest('POST', '/api/questions', payload);
      }
    },
    onSuccess: () => {
      toast({
        title: `Question ${editQuestion ? 'Updated' : 'Created'}`,
        description: `The question has been successfully ${editQuestion ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${editQuestion ? 'update' : 'create'} question. Please try again.`,
        variant: "destructive",
      });
    }
  });

  // Handle option change
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Add new option
  const addOption = () => {
    setOptions([...options, '']);
  };

  // Remove option
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Error",
        description: "A question must have at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);

    // Adjust the correct answer if needed
    const currentAnswer = form.getValues('answer');
    if (index === currentAnswer) {
      form.setValue('answer', 0);
    } else if (index < currentAnswer) {
      form.setValue('answer', currentAnswer - 1);
    }
  };

  // Submit handler
  const onSubmit = (data: z.infer<typeof questionSchema>) => {
    // Validate options
    const emptyOptions = options.findIndex(opt => opt.trim() === '');
    if (emptyOptions !== -1) {
      toast({
        title: "Error",
        description: `Option ${emptyOptions + 1} is empty. All options must have content.`,
        variant: "destructive",
      });
      return;
    }

    questionMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your question" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Options</FormLabel>
          <div className="space-y-2 mt-1.5">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addOption} 
              className="mt-2"
            >
              Add Option
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correct Answer</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the correct answer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      Option {index + 1}{option ? `: ${option.substring(0, 30)}${option.length > 30 ? '...' : ''}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain why the answer is correct (optional)"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide an explanation to help users understand the correct answer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={questionMutation.isPending}>
            {questionMutation.isPending 
              ? editQuestion ? 'Updating...' : 'Creating...'
              : editQuestion ? 'Update Question' : 'Create Question'
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuestionForm;
