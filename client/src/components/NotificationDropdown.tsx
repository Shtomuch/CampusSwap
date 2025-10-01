import React, { useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, ClockIcon, ShoppingBagIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../types';
import api from '../services/api';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'order':
      return <ShoppingBagIcon className="h-5 w-5 text-green-500" />;
    case 'message':
      return <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500" />;
    case 'system':
      return <BellIcon className="h-5 w-5 text-gray-500" />;
    default:
      return <BellIcon className="h-5 w-5 text-gray-500" />;
  }
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadNotificationCount, markNotificationsAsRead, refreshUnreadCounts } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Завантажуємо повідомлення з API
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications?pageSize=20');
      return response.data;
    },
    enabled: isOpen, // Завантажуємо тільки коли дропдаун відкритий
  });

  const unreadCount = unreadNotificationCount;

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Оновлюємо локальний стан
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      // Оновлюємо лічильники
      refreshUnreadCounts();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markNotificationsAsRead();
      // Оновлюємо локальний стан
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        old?.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsOpen(false);
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="p-2 text-gray-400 hover:text-gray-500 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          static
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <div className="px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Повідомлення</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Позначити всі як прочитані
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2">Завантаження...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Немає повідомлень
              </div>
            ) : (
              notifications.map((notification) => (
                <Menu.Item key={notification.id}>
                  {({ active }) => (
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={classNames(
                        active ? 'bg-gray-50' : '',
                        !notification.isRead ? 'bg-blue-50' : '',
                        'w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={classNames(
                              'text-sm font-medium',
                              !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                            )}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(notification.createdAt, 'dd.MM.yyyy HH:mm', { locale: uk })}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700"
              >
                Переглянути всі повідомлення
              </button>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
