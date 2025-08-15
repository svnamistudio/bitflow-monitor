import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { userService } from '../services/airtable';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user session on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      login(storedUserId).catch(() => {
        localStorage.removeItem('userId');
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (userId: string) => {
    setIsLoading(true);
    try {
      const userData = await userService.getUser(userId);
      if (userData) {
        setUser(userData);
        localStorage.setItem('userId', userId);
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.recordId) throw new Error('No user logged in');
    
    try {
      const updatedUser = await userService.updateUser(user.recordId, updates);
      setUser({ ...user, ...updatedUser });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};