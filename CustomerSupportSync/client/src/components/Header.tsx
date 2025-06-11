import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/providers/ThemeProvider';

const Header = () => {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Get user data
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  // Get notifications (placeholder)
  const notifications = [
    {
      id: 1,
      title: 'New quiz assigned: Data Structures',
      time: '2 hours ago',
      icon: 'assignment',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-500',
    },
    {
      id: 2,
      title: 'You scored 92% on JavaScript Basics!',
      time: '1 day ago',
      icon: 'check_circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-500',
    },
    {
      id: 3,
      title: 'Monthly progress report is available',
      time: '3 days ago',
      icon: 'receipt_long',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
    },
  ];

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get display name or username
  const displayName = userData?.user?.displayName || userData?.user?.username || 'User';
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white shadow-sm z-10 fixed top-0 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              type="button"
              className="px-4 text-neutral-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <span className="material-icons">menu</span>
            </button>
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div 
                className="h-8 w-auto text-primary-600 font-bold text-xl flex items-center cursor-pointer"
                onClick={() => navigate('/')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.666 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                QuizMaster Pro
              </div>
            </div>
          </div>
          
          {/* Right side navigation items */}
          <div className="flex items-center">
            {/* Search */}
            <div className="flex-1 flex md:ml-0 mr-4 relative max-w-sm hidden md:block">
              <Input
                type="search"
                placeholder="Search"
                className="pl-10"
                prefixIcon={<span className="material-icons text-neutral-400 text-sm">search</span>}
              />
            </div>
            
            {/* Notifications */}
            <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="sr-only">View notifications</span>
                  <span className="material-icons">notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="py-3 cursor-pointer">
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 ${notification.iconBg} rounded-full h-8 w-8 flex items-center justify-center ${notification.iconColor}`}>
                          <span className="material-icons text-sm">{notification.icon}</span>
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                          <p className="text-xs text-neutral-500">{notification.time}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center">
                  <Button variant="link" className="w-full text-xs">View all notifications</Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-3 flex items-center" size="sm">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                      alt={displayName}
                    />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">{displayName}</span>
                  <span className="material-icons text-neutral-400 ml-1">arrow_drop_down</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <span className="material-icons mr-2 text-sm">person</span>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile?tab=settings')}>
                  <span className="material-icons mr-2 text-sm">settings</span>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <span className="material-icons mr-2 text-sm">logout</span>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" className="ml-3 rounded-full" onClick={toggleTheme}>
              <span className="sr-only">Toggle dark mode</span>
              <span className="material-icons">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
