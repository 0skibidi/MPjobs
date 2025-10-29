import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'employer' | 'jobseeker' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  checkForToken: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user data on component mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        // Only set authentication state if BOTH user data and token exist
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('Initialized auth state from localStorage:', userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // If there's an error, clear all auth data for consistency
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      // If either user data or token is missing, ensure logged out state
      if (storedUser || token) {
        console.warn('Inconsistent auth state detected: User data or token missing');
        // Clean up by removing both to maintain consistency
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Helper to check if token exists
  const checkForToken = (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  };

  const login = (userData: User, token: string) => {
    console.log('Login called with user data and token');
    
    if (!token) {
      console.error('Cannot login: Token is required');
      return;
    }
    
    // First save the token
    localStorage.setItem('token', token);
    console.log('Token saved to localStorage');
    
    // Then set the user data and auth state
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User logged in:', userData);
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };
  
  const refreshAuth = async (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Attempting to refresh authentication');
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found for authentication refresh');
          logout();
          reject(new Error('No authentication token found'));
          return;
        }
        
        // Call our check-auth endpoint
        const response = await axios.get('/jobs/check-auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Auth check response:', response.data);
        
        if (response.data?.status === 'success' && response.data?.data?.user) {
          const userData = response.data.data.user;
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Authentication refreshed successfully');
          resolve();
        } else {
          console.error('Invalid response from auth refresh:', response.data);
          logout();
          reject(new Error('Failed to refresh authentication'));
        }
      } catch (error) {
        console.error('Error refreshing authentication:', error);
        logout();
        reject(error);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, refreshAuth, checkForToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 