// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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
import LoginPage from '../LoginPage';
import { AuthProvider } from '../../context/AuthContext';

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

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders login form with all required fields', () => {
      renderWithProviders(<LoginPage />);
      
      expect(screen.getByText('Вхід до акаунту')).toBeInTheDocument();
      expect(screen.getByLabelText('Email адреса')).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /увійти/i })).toBeInTheDocument();
    });

    test('renders link to register page', () => {
      renderWithProviders(<LoginPage />);
      
      const registerLink = screen.getByText('створіть новий акаунт');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });

    test('renders form with proper structure', () => {
      renderWithProviders(<LoginPage />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation error for empty email', async () => {
      renderWithProviders(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email обов\'язковий')).toBeInTheDocument();
      });
    });

    test('shows validation error for empty password', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Пароль обов\'язковий')).toBeInTheDocument();
      });
    });

    test('shows validation error for invalid email format', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Введіть коректний email')).toBeInTheDocument();
      });
    });

    test('shows validation error for short password', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Пароль повинен містити мінімум 6 символів')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls login function with correct data when form is submitted', async () => {
      mockUseAuth.login.mockResolvedValue(undefined);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });

    test('navigates to home page after successful login', async () => {
      mockUseAuth.login.mockResolvedValue(undefined);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('shows error message when login fails', async () => {
      mockUseAuth.login.mockRejectedValue(new Error('Invalid credentials'));
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    test('shows user-friendly error message for network error', async () => {
      mockUseAuth.login.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Проблема з мережею. Перевірте підключення до інтернету.')).toBeInTheDocument();
      });
    });

    test('shows user-friendly error message for 401 error', async () => {
      const error = new Error('Unauthorized');
      (error as any).response = { status: 401 };
      mockUseAuth.login.mockRejectedValue(error);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Невірний email або пароль. Спробуйте ще раз.')).toBeInTheDocument();
      });
    });

    test('shows user-friendly error message for 400 error', async () => {
      const error = new Error('Bad Request');
      (error as any).response = { status: 400 };
      mockUseAuth.login.mockRejectedValue(error);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Некоректні дані. Перевірте формат email і спробуйте ще раз.')).toBeInTheDocument();
      });
    });

    test('shows user-friendly error message for 500 error', async () => {
      const error = new Error('Internal Server Error');
      (error as any).response = { status: 500 };
      mockUseAuth.login.mockRejectedValue(error);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Проблема з сервером. Спробуйте пізніше.')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    test('disables submit button while submitting', async () => {
      mockUseAuth.login.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('clears error message when form is resubmitted', async () => {
      mockUseAuth.login
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);
      
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      const passwordInput = screen.getByLabelText('Пароль');
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      
      // First submission - error
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second submission - success
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      const passwordInput = screen.getByLabelText('Пароль');
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    test('has proper form structure', () => {
      renderWithProviders(<LoginPage />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      renderWithProviders(<LoginPage />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Вхід до акаунту');
    });

    test('has proper button labels', () => {
      renderWithProviders(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<LoginPage />);
      
      expect(screen.getByText('Вхід до акаунту')).toBeInTheDocument();
    });

    test('renders correctly on desktop devices', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderWithProviders(<LoginPage />);
      
      expect(screen.getByText('Вхід до акаунту')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles very long email addresses', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      const longEmail = 'a'.repeat(100) + '@test.com';
      fireEvent.change(emailInput, { target: { value: longEmail } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith(longEmail, 'password123');
      });
    });

    test('handles special characters in password', async () => {
      renderWithProviders(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      
      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'p@ssw0rd!@#$%^&*()' } });
      
      const submitButton = screen.getByRole('button', { name: /увійти/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUseAuth.login).toHaveBeenCalledWith('test@test.com', 'p@ssw0rd!@#$%^&*()');
      });
    });
  });
});
