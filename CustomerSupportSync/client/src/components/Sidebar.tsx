import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMobile } from '@/hooks/use-mobile';

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { isMobile, isLg } = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Fetch categories for sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else if (isLg && !isOpen) {
      setIsOpen(true);
    }
  }, [location, isMobile, isLg]);

  // Listen for sidebar toggle event from header
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed lg:relative inset-y-0 pt-16 lg:pt-0 z-50 w-64 bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <ScrollArea className="h-full">
          <div className="px-3 py-4 flex flex-col h-full">
            <nav className="mt-5 space-y-1">
              <Button
                variant="ghost"
                className={`w-full justify-start ${isActive('/') ? 'bg-primary-50 text-primary-600' : ''}`}
                onClick={() => navigate('/')}
              >
                <span className="material-icons mr-3 text-inherit">dashboard</span>
                Dashboard
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start ${location.includes('/quiz/') ? 'bg-primary-50 text-primary-600' : ''}`}
                onClick={() => navigate('/')}
              >
                <span className="material-icons mr-3 text-inherit">quiz</span>
                My Quizzes
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start ${isActive('/analytics') ? 'bg-primary-50 text-primary-600' : ''}`}
                onClick={() => navigate('/analytics')}
              >
                <span className="material-icons mr-3 text-inherit">insights</span>
                Analytics
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start ${isActive('/questions') ? 'bg-primary-50 text-primary-600' : ''}`}
                onClick={() => navigate('/questions')}
              >
                <span className="material-icons mr-3 text-inherit">question_answer</span>
                Question Bank
              </Button>
              
              <Button
                variant="ghost"
                className={`w-full justify-start ${isActive('/profile') ? 'bg-primary-50 text-primary-600' : ''}`}
                onClick={() => navigate('/profile')}
              >
                <span className="material-icons mr-3 text-inherit">person</span>
                Profile
              </Button>
            </nav>
            
            {categoriesData?.categories && (
              <>
                <div className="mt-6 px-3">
                  <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Categories
                  </h3>
                  <div className="mt-2 space-y-1">
                    {categoriesData.categories.map((category) => (
                      <Button
                        key={category.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => navigate(`/questions?category=${category.id}`)}
                      >
                        <span 
                          className="w-2 h-2 mr-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-auto p-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary-800">Need help?</h4>
                <p className="mt-1 text-xs text-primary-600">Get support with our documentation and tutorials.</p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs text-primary-700 hover:text-primary-900">
                  View documentation
                  <span className="material-icons ml-1 text-xs">arrow_forward</span>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;
