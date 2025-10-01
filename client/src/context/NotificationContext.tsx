import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { UnreadCounts, Notification } from '../types';
import { getNotificationsConnection } from '../services/realtime';

interface NotificationContextType {
  unreadChatCount: number;
  unreadNotificationCount: number;
  setUnreadChatCount: (count: number) => void;
  setUnreadNotificationCount: (count: number) => void;
  markChatAsRead: () => void;
  markNotificationsAsRead: () => void;
  refreshUnreadCounts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Завантажуємо реальні дані з API
  const { data: unreadCounts, refetch: refreshCounts } = useQuery<UnreadCounts>({
    queryKey: ['unread-counts'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-counts');
      return response.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Оновлюємо кожні 30 секунд
    retry: false,
  });

  // Оновлюємо локальний стан при отриманні даних з API
  useEffect(() => {
    if (unreadCounts) {
      setUnreadChatCount(unreadCounts.unreadChatCount);
      setUnreadNotificationCount(unreadCounts.unreadNotificationCount);
    }
  }, [unreadCounts]);

  // Скидаємо лічильники при виході користувача
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadChatCount(0);
      setUnreadNotificationCount(0);
    }
  }, [isAuthenticated]);

  // Підключаємося до SignalR для real-time оновлень
  useEffect(() => {
    if (!isAuthenticated) return;

    let connection: any = null;

    const setupConnection = async () => {
      try {
        connection = await getNotificationsConnection();
        
        // Слухаємо нові повідомлення
        connection.on('ReceiveNotification', (notification: Notification) => {
          console.log('🔔 Received notification:', notification);
          
          // Оновлюємо кеш повідомлень
          queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
            if (!old) return [notification];
            return [notification, ...old];
          });
          
          // Оновлюємо лічильники
          refreshCounts();
        });

        // Слухаємо оновлення лічильників
        connection.on('UpdateUnreadCounts', (counts: UnreadCounts) => {
          console.log('📊 Received unread counts update:', counts);
          setUnreadChatCount(counts.unreadChatCount);
          setUnreadNotificationCount(counts.unreadNotificationCount);
        });

        console.log('🔔 Notification connection established');
      } catch (error) {
        console.error('❌ Failed to setup notification connection:', error);
      }
    };

    setupConnection();

    return () => {
      if (connection) {
        connection.off('ReceiveNotification');
        connection.off('UpdateUnreadCounts');
      }
    };
  }, [isAuthenticated, queryClient, refreshCounts]);

  const markChatAsRead = async () => {
    setUnreadChatCount(0);
    // Тут можна додати API виклик для позначення чатів як прочитаних
    await refreshCounts();
  };

  const markNotificationsAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadNotificationCount(0);
      await refreshCounts();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const refreshUnreadCounts = () => {
    refreshCounts();
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadChatCount,
        unreadNotificationCount,
        setUnreadChatCount,
        setUnreadNotificationCount,
        markChatAsRead,
        markNotificationsAsRead,
        refreshUnreadCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
