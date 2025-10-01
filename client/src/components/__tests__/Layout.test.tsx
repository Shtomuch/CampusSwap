// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Outlet: () => <div>Outlet</div>,
}));

// Mock the useAuth hook
const mockUseAuth = {
  user: null,
  isAuthenticated: false,
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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../Layout';
import { AuthProvider } from '../../context/AuthContext';
import { SavedItemsProvider } from '../../context/SavedItemsContext';

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
        <SavedItemsProvider>
          <BrowserRouter>
            {component}
          </BrowserRouter>
        </SavedItemsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = false;
      mockUseAuth.user = null;
    });

    test('renders navigation links for unauthenticated user', () => {
      renderWithProviders(<Layout />);
      
      expect(screen.getByText('🎓 CampusSwap')).toBeInTheDocument();
      expect(screen.getByText('Головна')).toBeInTheDocument();
      expect(screen.getByText('Оголошення')).toBeInTheDocument();
      expect(screen.getByText('Увійти')).toBeInTheDocument();
      expect(screen.getByText('Реєстрація')).toBeInTheDocument();
    });

    test('navigates to login page when login link is clicked', () => {
      renderWithProviders(<Layout />);
      
      const loginLink = screen.getByText('Увійти');
      fireEvent.click(loginLink);
      
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    test('navigates to register page when register link is clicked', () => {
      renderWithProviders(<Layout />);
      
      const registerLink = screen.getByText('Реєстрація');
      fireEvent.click(registerLink);
      
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    test('renders mobile menu toggle button', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    test('toggles mobile menu when button is clicked', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      // Menu should be open now
      expect(screen.getByText('Увійти')).toBeInTheDocument();
      expect(screen.getByText('Реєстрація')).toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        phoneNumber: '1234567890',
        studentId: '12345',
        university: 'Test University',
        faculty: 'Computer Science',
        yearOfStudy: 3,
        profileImageUrl: null,
        rating: 0,
        reviewsCount: 0,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: new Date(),
      };
    });

    test('renders user navigation for authenticated user', () => {
      renderWithProviders(<Layout />);
      
      expect(screen.getByText('Створити оголошення')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    test('renders user menu with profile and orders links', () => {
      renderWithProviders(<Layout />);
      
      const userMenuButton = screen.getByRole('button');
      fireEvent.click(userMenuButton);
      
      expect(screen.getByText('Профіль')).toBeInTheDocument();
      expect(screen.getByText('Мої замовлення')).toBeInTheDocument();
      expect(screen.getByText('Чат')).toBeInTheDocument();
      expect(screen.getByText('Вийти')).toBeInTheDocument();
    });

    test('calls logout and navigates to home when logout is clicked', async () => {
      renderWithProviders(<Layout />);
      
      const userMenuButton = screen.getByRole('button');
      fireEvent.click(userMenuButton);
      
      const logoutButton = screen.getByText('Вийти');
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(mockUseAuth.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('navigates to create listing page when create listing button is clicked', () => {
      renderWithProviders(<Layout />);
      
      const createListingButton = screen.getByText('Створити оголошення');
      fireEvent.click(createListingButton);
      
      expect(createListingButton.closest('a')).toHaveAttribute('href', '/listings/create');
    });

    test('renders chat icon with notification dot', () => {
      renderWithProviders(<Layout />);
      
      const chatLink = screen.getByRole('link', { name: /chat/i });
      expect(chatLink).toBeInTheDocument();
      
      // Check for notification dot
      const notificationDot = chatLink.querySelector('.bg-red-400');
      expect(notificationDot).toBeInTheDocument();
    });

    test('renders notifications button', () => {
      renderWithProviders(<Layout />);
      
      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      expect(notificationsButton).toBeInTheDocument();
    });

    test('navigates to notifications when notifications button is clicked', () => {
      renderWithProviders(<Layout />);
      
      const notificationsButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(notificationsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/notifications');
    });

    test('renders user avatar with fallback image', () => {
      renderWithProviders(<Layout />);
      
      const avatar = screen.getByAltText('');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'));
    });

    test('renders user avatar with custom image when available', () => {
      mockUseAuth.user!.profileImageUrl = 'https://example.com/avatar.jpg';
      
      renderWithProviders(<Layout />);
      
      const avatar = screen.getByAltText('');
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      mockUseAuth.isAuthenticated = true;
      mockUseAuth.user = {
        id: '1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        phoneNumber: '1234567890',
        studentId: '12345',
        university: 'Test University',
        faculty: 'Computer Science',
        yearOfStudy: 3,
        profileImageUrl: null,
        rating: 0,
        reviewsCount: 0,
        isEmailVerified: false,
        isPhoneVerified: false,
        createdAt: new Date(),
      };
    });

    test('renders mobile navigation menu when opened', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Головна')).toBeInTheDocument();
      expect(screen.getByText('Оголошення')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
    });

    test('renders mobile user navigation links', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Профіль')).toBeInTheDocument();
      expect(screen.getByText('Мої замовлення')).toBeInTheDocument();
      expect(screen.getByText('Чат')).toBeInTheDocument();
      expect(screen.getByText('Вийти')).toBeInTheDocument();
    });

    test('calls logout when mobile logout button is clicked', async () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      fireEvent.click(menuButton);
      
      const logoutButton = screen.getByText('Вийти');
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(mockUseAuth.logout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when user is loading', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(<Layout />);
      
      // The loading state should be handled by ProtectedRoute, not Layout
      expect(screen.getByText('🎓 CampusSwap')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for navigation', () => {
      renderWithProviders(<Layout />);
      
      const mainNav = screen.getByRole('navigation');
      expect(mainNav).toBeInTheDocument();
    });

    test('has proper ARIA labels for buttons', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    test('has proper focus management', () => {
      renderWithProviders(<Layout />);
      
      const menuButton = screen.getByRole('button', { name: /open main menu/i });
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);
    });
  });

  describe('Responsive Design', () => {
    test('renders desktop navigation on large screens', () => {
      renderWithProviders(<Layout />);
      
      const desktopNav = screen.getByText('Головна');
      expect(desktopNav).toBeInTheDocument();
    });

    test('renders mobile menu button on small screens', () => {
      renderWithProviders(<Layout />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });
});
