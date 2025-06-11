import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from '@/components/ui/checkbox';
import QuestionForm from '@/components/QuestionForm';
import DifficultyBadge from '@/components/DifficultyBadge';
import CategoryBadge from '@/components/CategoryBadge';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  category?: number;
  difficulty: string;
  chosen?: number | null;
  correct?: boolean;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

const QuestionBank = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for filters and pagination
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const PAGE_SIZE = 10;

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/questions'],
    retry: false,
  });

  // Fetch categories for filter
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      return apiRequest('DELETE', `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete question.",
        variant: "destructive",
      });
    }
  });

  // Handle question deletion
  const handleDeleteQuestion = (questionId: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  // Handle question edit
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setIsAddDialogOpen(true);
  };

  // Filter and paginate questions
  const getFilteredQuestions = () => {
    if (!questionsData?.questions) return [];

    let filtered = [...questionsData.questions];

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(q => q.category === parseInt(categoryFilter));
    }

    // Apply difficulty filter
    if (difficultyFilter) {
      filtered = filtered.filter(q => q.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) || 
        q.options.some(opt => opt.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredQuestions = getFilteredQuestions();
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  
  // Get current page of questions
  const currentQuestions = filteredQuestions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(currentQuestions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  // Handle individual question selection
  const handleSelectQuestion = (checked: boolean, questionId: number) => {
    if (checked) {
      setSelectedQuestions([...selectedQuestions, questionId]);
    } else {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    }
  };

  // Find category by ID
  const findCategory = (categoryId?: number) => {
    if (!categoryId || !categoriesData?.categories) return null;
    return categoriesData.categories.find(c => c.id === categoryId);
  };

  // Loading state
  if (questionsLoading || categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Question Bank</h1>
        <div className="mt-4">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Question Bank</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingQuestion(null)}>
              <span className="material-icons mr-2 text-sm">add</span>
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion 
                  ? 'Update question details below.' 
                  : 'Fill in the details to add a new question to the bank.'}
              </DialogDescription>
            </DialogHeader>
            <QuestionForm 
              editQuestion={editingQuestion}
              categories={categoriesData?.categories || []}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                setEditingQuestion(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-neutral-700">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categoriesData?.categories && categoriesData.categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="difficulty-filter" className="block text-sm font-medium text-neutral-700">Difficulty</label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger id="difficulty-filter">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="mastered">Mastered</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="not_attempted">Not Attempted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="search-questions" className="block text-sm font-medium text-neutral-700">Search</label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-neutral-400 text-sm">search</span>
                </div>
                <Input
                  type="text"
                  id="search-questions"
                  placeholder="Search questions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedQuestions.length === currentQuestions.length && currentQuestions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Attempted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentQuestions.length > 0 ? (
                currentQuestions.map((question) => {
                  const category = findCategory(question.category);
                  
                  return (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={(checked) => handleSelectQuestion(!!checked, question.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-md truncate">
                        {question.question}
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <CategoryBadge category={category.name} color={category.color} />
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DifficultyBadge difficulty={question.difficulty} />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Not Attempted
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        Never
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditQuestion(question)}
                          className="mr-1"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <span className="material-icons text-sm text-red-600">delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                    No questions found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="py-4 px-6 border-t border-neutral-200">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuestionBank;
