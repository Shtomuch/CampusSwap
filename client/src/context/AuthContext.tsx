import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import api from '../services/api';
import { stopAllConnections } from '../services/realtime';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  studentId: string;
  university: string;
  faculty: string;
  yearOfStudy: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      console.log('🔄 Loading user, token exists:', !!token);
      if (token) {
        try {
          const response = await api.get('/users/me');
          console.log('✅ User loaded successfully:', response.data);

          const userData = response.data;

          setUser(userData);
        } catch (error: any) {
          console.error('❌ Failed to load user:', error);
          // Тільки очищаємо токени якщо це 401 (unauthorized)
          if (error.response?.status === 401) {
            console.log('🚫 Token expired or invalid, clearing tokens');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } else {
            console.log('⚠️ Other error loading user, keeping tokens');
          }
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔄 Attempting login with:', { email });
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      console.log('✅ Login response received:', response.data);

      const { accessToken, refreshToken, user: userData } = response.data;
      console.log('🔑 Extracted tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        user: userData ? `${userData.firstName} ${userData.lastName}` : 'null'
      });

      if (!accessToken || !refreshToken || !userData) {
        const error = new Error('Отримано неповні дані від сервера. Спробуйте ще раз.');
        console.error('❌ Missing data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!userData });
        throw error;
      }

      const user = userData;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      console.log('🎉 Login successful! User set:', user.firstName, user.lastName);
    } catch (error: any) {
      console.error('💥 Login error:', error);

      // Покращуємо повідомлення про помилки
      let userMessage = 'Сталася невідома помилка. Спробуйте ще раз.';

      if (error.response?.status === 401) {
        userMessage = 'Неправильний email або пароль. Перевірте дані і спробуйте ще раз.';
      } else if (error.response?.status === 400) {
        userMessage = 'Некоректні дані. Перевірте формат email і спробуйте ще раз.';
      } else if (error.response?.status >= 500) {
        userMessage = 'Проблема з сервером. Спробуйте пізніше.';
      } else if (error.message) {
        userMessage = error.message;
      }

      // Створюємо новий об'єкт помилки з користувацьким повідомленням
      const userFriendlyError = new Error(userMessage) as Error & { userMessage: string };
      userFriendlyError.userMessage = userMessage;
      throw userFriendlyError;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      console.log('🔄 Attempting registration with:', { email: data.email, firstName: data.firstName, lastName: data.lastName });
      const response = await api.post<AuthResponse>('/auth/register', data);
      console.log('✅ Registration response received:', response.data);
      
      const { accessToken, refreshToken, user: userData } = response.data;
      console.log('🔑 Extracted tokens and user:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        user: userData ? `${userData.firstName} ${userData.lastName}` : 'null'
      });

      if (!accessToken || !refreshToken || !userData) {
        const error = new Error('Отримано неповні дані від сервера. Спробуйте ще раз.');
        console.error('❌ Missing data:', { accessToken: !!accessToken, refreshToken: !!refreshToken, user: !!userData });
        throw error;
      }

      const user = userData;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      console.log('🎉 Registration successful! User set:', user.firstName, user.lastName);
    } catch (error: any) {
      console.error('💥 Registration error:', error);

      // Покращуємо повідомлення про помилки
      let userMessage = 'Сталася невідома помилка. Спробуйте ще раз.';

      if (error.response?.status === 400) {
        userMessage = 'Некоректні дані. Перевірте формат даних і спробуйте ще раз.';
      } else if (error.response?.status >= 500) {
        userMessage = 'Проблема з сервером. Спробуйте пізніше.';
      } else if (error.message) {
        userMessage = error.message;
      }

      // Створюємо новий об'єкт помилки з користувацьким повідомленням
      const userFriendlyError = new Error(userMessage) as Error & { userMessage: string };
      userFriendlyError.userMessage = userMessage;
      throw userFriendlyError;
    }
  };

  const logout = async () => {
    try {
      await stopAllConnections();
    } catch (error) {
      console.error('Error stopping SignalR connections:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    try {
      const response = await api.get('/users/me');
      console.log('✅ User data refreshed:', response.data);

      const userData = response.data;

      setUser(userData);
    } catch (error: any) {
      console.error('❌ Failed to refresh user data:', error);
      if (error.response?.status === 401) {
        console.log('🚫 Token expired, clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};