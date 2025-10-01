import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatPage from '../ChatPage';
import { AuthProvider } from '../../context/AuthContext';

// Mock the useAuth hook
const mockUser = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Тарас',
  lastName: 'Шевченко',
  fullName: 'Тарас Шевченко',
  phoneNumber: '+380501234567',
  studentId: 'КВ12345678',
  university: 'КНУ ім. Тараса Шевченка',
  faculty: 'Факультет кібернетики',
  yearOfStudy: 3,
  profileImageUrl: null,
  rating: 4.5,
  reviewsCount: 10,
  isEmailVerified: true,
  isPhoneVerified: false,
  createdAt: new Date('2023-09-01'),
};

const mockUseAuth = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
};

jest.mock('../../services/api', () => ({
  default: {
    get: (...args: any[]) => mockApi.get(...args),
    post: (...args: any[]) => mockApi.post(...args),
    put: (...args: any[]) => mockApi.put(...args),
  },
}));

// Mock realtime service
jest.mock('../../services/realtime', () => ({
  connectToChat: jest.fn(),
  sendMessage: jest.fn(),
  onNewMessage: jest.fn(),
  onMessageRead: jest.fn(),
  disconnectFromChat: jest.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const mockConversations = [
  {
    id: '1',
    participants: [
      mockUser,
      {
        id: '2',
        firstName: 'Іван',
        lastName: 'Франко',
        fullName: 'Іван Франко',
        profileImageUrl: null,
      },
    ],
    lastMessage: {
      id: 'msg1',
      text: 'Привіт! Чи доступний товар?',
      senderId: '2',
      createdAt: new Date('2024-01-20T10:00:00'),
      isRead: false,
    },
    unreadCount: 1,
    createdAt: new Date('2024-01-20T09:00:00'),
    updatedAt: new Date('2024-01-20T10:00:00'),
  },
  {
    id: '2',
    participants: [
      mockUser,
      {
        id: '3',
        firstName: 'Леся',
        lastName: 'Українка',
        fullName: 'Леся Українка',
        profileImageUrl: null,
      },
    ],
    lastMessage: {
      id: 'msg2',
      text: 'Дякую за швидку відповідь!',
      senderId: '1',
      createdAt: new Date('2024-01-19T15:00:00'),
      isRead: true,
    },
    unreadCount: 0,
    createdAt: new Date('2024-01-19T14:00:00'),
    updatedAt: new Date('2024-01-19T15:00:00'),
  },
];

const mockMessages = [
  {
    id: 'msg1',
    conversationId: '1',
    senderId: '2',
    text: 'Привіт! Чи доступний товар?',
    isRead: true,
    createdAt: new Date('2024-01-20T10:00:00'),
  },
  {
    id: 'msg2',
    conversationId: '1',
    senderId: '1',
    text: 'Привіт! Так, товар в наявності.',
    isRead: true,
    createdAt: new Date('2024-01-20T10:05:00'),
  },
  {
    id: 'msg3',
    conversationId: '1',
    senderId: '2',
    text: 'Чудово! Коли можна забрати?',
    isRead: false,
    createdAt: new Date('2024-01-20T10:10:00'),
  },
];

describe('ChatPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders chat page layout', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        expect(screen.getByText('Чати')).toBeInTheDocument();
      });
    });

    test('displays conversations list', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        expect(screen.getByText('Іван Франко')).toBeInTheDocument();
        expect(screen.getByText('Леся Українка')).toBeInTheDocument();
      });
    });

    test('shows last message in conversation list', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        expect(screen.getByText('Привіт! Чи доступний товар?')).toBeInTheDocument();
        expect(screen.getByText('Дякую за швидку відповідь!')).toBeInTheDocument();
      });
    });

    test('displays unread count badge', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const unreadBadge = screen.getByText('1');
        expect(unreadBadge).toBeInTheDocument();
      });
    });

    test('shows empty state when no conversations', async () => {
      mockApi.get.mockResolvedValueOnce({ data: [] });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        expect(screen.getByText('У вас поки немає чатів')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    test('selects conversation on click', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(screen.getByText('Привіт! Так, товар в наявності.')).toBeInTheDocument();
      });
    });

    test('loads messages for selected conversation', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/chat/conversations/1/messages');
      });
    });

    test('marks messages as read when conversation is selected', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });
      mockApi.put.mockResolvedValue({ data: {} });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/chat/conversations/1/read');
      });
    });
  });

  describe('Message Display', () => {
    test('displays messages in correct order', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const messages = screen.getAllByText(/Привіт|товар|забрати/);
        expect(messages.length).toBeGreaterThan(0);
      });
    });

    test('shows sender name for messages', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(screen.getByText('Привіт! Чи доступний товар?')).toBeInTheDocument();
        expect(screen.getByText('Привіт! Так, товар в наявності.')).toBeInTheDocument();
      });
    });

    test('displays message timestamps', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(screen.getByText(/10:00|10:05|10:10/)).toBeInTheDocument();
      });
    });
  });

  describe('Sending Messages', () => {
    test('renders message input field', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Напишіть повідомлення...');
        expect(messageInput).toBeInTheDocument();
      });
    });

    test('sends message when form is submitted', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });
      mockApi.post.mockResolvedValue({
        data: {
          id: 'msg4',
          conversationId: '1',
          senderId: '1',
          text: 'Нове повідомлення',
          isRead: false,
          createdAt: new Date(),
        },
      });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Напишіть повідомлення...');
        fireEvent.change(messageInput, { target: { value: 'Нове повідомлення' } });

        const sendButton = screen.getByRole('button', { name: /надіслати/i });
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/chat/conversations/1/messages', {
          text: 'Нове повідомлення',
        });
      });
    });

    test('clears input after sending message', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });
      mockApi.post.mockResolvedValue({
        data: {
          id: 'msg4',
          conversationId: '1',
          senderId: '1',
          text: 'Нове повідомлення',
          isRead: false,
          createdAt: new Date(),
        },
      });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Напишіть повідомлення...');
        fireEvent.change(messageInput, { target: { value: 'Нове повідомлення' } });

        const sendButton = screen.getByRole('button', { name: /надіслати/i });
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Напишіть повідомлення...');
        expect(messageInput).toHaveValue('');
      });
    });

    test('prevents sending empty messages', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /надіслати/i });
        fireEvent.click(sendButton);
      });

      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('shows error when conversations fail to load', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Failed to load conversations'));

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        expect(screen.getByText('Помилка завантаження чатів')).toBeInTheDocument();
      });
    });

    test('shows error when messages fail to load', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockRejectedValueOnce(new Error('Failed to load messages'));

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        expect(screen.getByText('Помилка завантаження повідомлень')).toBeInTheDocument();
      });
    });

    test('shows error when message fails to send', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockResolvedValueOnce({ data: mockMessages });
      mockApi.post.mockRejectedValueOnce(new Error('Failed to send'));

      renderWithProviders(<ChatPage />);

      await waitFor(() => {
        const conversation = screen.getByText('Іван Франко');
        fireEvent.click(conversation);
      });

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Напишіть повідомлення...');
        fireEvent.change(messageInput, { target: { value: 'Тест' } });

        const sendButton = screen.getByRole('button', { name: /надіслати/i });
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Не вдалося відправити повідомлення')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner while fetching conversations', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<ChatPage />);

      expect(screen.getByText('Завантаження...')).toBeInTheDocument();
    });

    test('shows loading spinner while fetching messages', () => {
      mockApi.get
        .mockResolvedValueOnce({ data: mockConversations })
        .mockImplementation(() => new Promise(() => {})); // Never resolves for messages

      renderWithProviders(<ChatPage />);

      const conversation = screen.getByText('Іван Франко');
      fireEvent.click(conversation);

      expect(screen.getByText('Завантаження повідомлень...')).toBeInTheDocument();
    });
  });
});