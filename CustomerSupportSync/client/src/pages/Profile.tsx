import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional()
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;

const Profile = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  
  // Get user data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Get attempts data
  const { data: attemptsData } = useQuery({
    queryKey: ['/api/attempts'],
    retry: false,
  });

  // Profile update form
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userData?.user?.displayName || '',
      email: userData?.user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  // Update form when user data loads
  if (userData?.user && form.getValues().displayName === '') {
    form.reset({
      displayName: userData.user.displayName || '',
      email: userData.user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiRequest('POST', '/api/auth/update-profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      form.reset({
        ...form.getValues(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please check your password and try again.",
        variant: "destructive",
      });
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/auth/delete-account');
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
      logout();
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete your account. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
        <div className="mt-4">
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Profile</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage your account settings and preferences
      </p>

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your display name"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              This name will be displayed to other users.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your email address"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormDescription>
                              We'll use this for notifications and account recovery.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Separator className="my-4" />
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Your current password"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Required to confirm changes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="New password"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave blank to keep current password
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirm new password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Username</h3>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{userData?.user?.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Member Since</h3>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">
                        {userData?.user?.createdAt 
                          ? formatDate(userData.user.createdAt)
                          : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Completed Quizzes</h3>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">
                        {attemptsData?.attempts?.filter(a => a.completed).length || 0}
                      </p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending}
                        className="w-full"
                      >
                        <span className="material-icons mr-2 text-sm">delete_forever</span>
                        {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                      </Button>
                      <p className="mt-2 text-xs text-neutral-500 text-center">
                        This action is irreversible. All your data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attemptsData?.attempts && attemptsData.attempts.length > 0 ? (
                      attemptsData.attempts.slice(0, 10).map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">
                            Completed Quiz #{attempt.id}
                          </TableCell>
                          <TableCell>
                            {attempt.finishedAt 
                              ? formatDate(attempt.finishedAt)
                              : 'In Progress'
                            }
                          </TableCell>
                          <TableCell>
                            {attempt.score !== undefined ? `${attempt.score}%` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="link" 
                              onClick={() => window.location.href = `/review/${attempt.id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-neutral-500">
                          No activity to display yet. Start taking quizzes to see your history.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emails" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-neutral-500">
                        Receive emails about new quizzes and study recommendations
                      </p>
                    </div>
                    <Switch id="emails" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="progress-tracking" className="text-base">Progress Tracking</Label>
                      <p className="text-sm text-neutral-500">
                        Allow the system to track your progress and adapt questions
                      </p>
                    </div>
                    <Switch id="progress-tracking" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="spaced-repetition" className="text-base">Spaced Repetition</Label>
                      <p className="text-sm text-neutral-500">
                        Schedule reviews of questions based on your performance
                      </p>
                    </div>
                    <Switch id="spaced-repetition" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-sharing" className="text-base">Anonymous Data Sharing</Label>
                      <p className="text-sm text-neutral-500">
                        Share anonymous usage data to help improve the platform
                      </p>
                    </div>
                    <Switch id="data-sharing" />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Preferences</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
