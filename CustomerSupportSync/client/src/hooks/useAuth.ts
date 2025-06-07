import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import { apiRequest } from '@/lib/queryClient';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export function useAuthState() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }
      
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear it
          localStorage.removeItem('auth_token');
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [token]);
  
  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const register = async (
    username: string, 
    password: string, 
    email?: string, 
    displayName?: string
  ) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', { 
        username, 
        password, 
        email, 
        displayName 
      });
      
      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  };
}
