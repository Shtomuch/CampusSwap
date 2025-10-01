import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface SavedItemsContextType {
  savedItems: string[];
  isSaved: (listingId: string) => boolean;
  toggleSaved: (listingId: string) => Promise<void>;
  isLoading: boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Завантаження збережених товарів при ініціалізації
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedItems();
    } else {
      setSavedItems([]);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedItems = async () => {
    try {
      console.log('🔄 Завантаження збережених товарів...');
      setIsLoading(true);
      
      const response = await api.get('/saved-listings');
      console.log('✅ Збережені товари завантажені:', response.data);
      
      // API повертає масив ID, а не об'єктів
      const items = Array.isArray(response.data) ? response.data : [];
      setSavedItems(items);
    } catch (error: any) {
      console.error('❌ Помилка завантаження збережених товарів:', error);
      // Якщо endpoint не існує, використовуємо localStorage як fallback
      const localSaved = localStorage.getItem('savedItems');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setSavedItems(parsed);
          console.log('📱 Використано локальне збереження:', parsed);
        } catch (e) {
          console.error('❌ Помилка парсингу локального збереження:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSaved = (listingId: string): boolean => {
    return savedItems.includes(listingId);
  };

  const toggleSaved = async (listingId: string): Promise<void> => {
    if (!isAuthenticated) {
      console.log('🚫 Користувач не авторизований, не можна зберігати товари');
      return;
    }

    try {
      console.log('💖 Перемикання збереження для товару:', listingId);
      const isCurrentlySaved = isSaved(listingId);

      if (isCurrentlySaved) {
        // Видаляємо з збережених
        await api.delete(`/saved-listings/${listingId}`);
        console.log('🗑️ Товар видалено з збережених');
      } else {
        // Додаємо до збережених
        await api.post('/saved-listings', { listingId });
        console.log('➕ Товар додано до збережених');
      }

      // Оновлюємо локальний стан
      setSavedItems(prev => {
        const newItems = isCurrentlySaved 
          ? prev.filter(id => id !== listingId)
          : [...prev, listingId];
        
        // Зберігаємо в localStorage як backup
        localStorage.setItem('savedItems', JSON.stringify(newItems));
        console.log('💾 Оновлено локальне збереження:', newItems);
        
        return newItems;
      });

    } catch (error: any) {
      console.error('❌ Помилка при збереженні товару:', error);
      
      // Fallback до localStorage
      const localSaved = JSON.parse(localStorage.getItem('savedItems') || '[]');
      const isCurrentlySaved = localSaved.includes(listingId);
      
      if (isCurrentlySaved) {
        const newItems = localSaved.filter((id: string) => id !== listingId);
        localStorage.setItem('savedItems', JSON.stringify(newItems));
        setSavedItems(newItems);
        console.log('📱 Використано localStorage для видалення');
      } else {
        const newItems = [...localSaved, listingId];
        localStorage.setItem('savedItems', JSON.stringify(newItems));
        setSavedItems(newItems);
        console.log('📱 Використано localStorage для додавання');
      }
      
      // Показуємо користувачу повідомлення
      const message = isCurrentlySaved 
        ? 'Товар видалено з збережених (збережено локально)'
        : 'Товар додано до збережених (збережено локально)';
      
      // Можна додати toast notification тут
      console.log('ℹ️', message);
    }
  };

  const value: SavedItemsContextType = {
    savedItems,
    isSaved,
    toggleSaved,
    isLoading,
  };

  return (
    <SavedItemsContext.Provider value={value}>
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems(): SavedItemsContextType {
  const context = useContext(SavedItemsContext);
  if (context === undefined) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  return context;
}
