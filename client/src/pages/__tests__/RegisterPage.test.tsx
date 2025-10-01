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
import RegisterPage from '../RegisterPage';
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

describe('RegisterPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders registration form with all required fields', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByText('Реєстрація нового акаунту')).toBeInTheDocument();
      expect(screen.getByLabelText('Ім\'я')).toBeInTheDocument();
      expect(screen.getByLabelText('Прізвище')).toBeInTheDocument();
      expect(screen.getByLabelText('Email адреса')).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Підтвердіть пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Номер телефону')).toBeInTheDocument();
      expect(screen.getByLabelText('Студентський квиток')).toBeInTheDocument();
      expect(screen.getByLabelText('Університет')).toBeInTheDocument();
      expect(screen.getByLabelText('Факультет')).toBeInTheDocument();
      expect(screen.getByLabelText('Курс')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /зареєструватися/i })).toBeInTheDocument();
    });

    test('renders link to login page', () => {
      renderWithProviders(<RegisterPage />);

      const loginLink = screen.getByText('увійдіть');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    test('renders form with proper structure', () => {
      renderWithProviders(<RegisterPage />);

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows validation errors for empty required fields', async () => {
      renderWithProviders(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ім\'я обов\'язкове')).toBeInTheDocument();
        expect(screen.getByText('Прізвище обов\'язкове')).toBeInTheDocument();
        expect(screen.getByText('Email обов\'язковий')).toBeInTheDocument();
        expect(screen.getByText('Пароль обов\'язковий')).toBeInTheDocument();
      });
    });

    test('shows validation error for invalid email format', async () => {
      renderWithProviders(<RegisterPage />);

      const emailInput = screen.getByLabelText('Email адреса');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введіть коректний email')).toBeInTheDocument();
      });
    });

    test('shows validation error for short password', async () => {
      renderWithProviders(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Пароль повинен містити мінімум 6 символів')).toBeInTheDocument();
      });
    });

    test('shows validation error when passwords do not match', async () => {
      renderWithProviders(<RegisterPage />);

      const passwordInput = screen.getByLabelText('Пароль');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const confirmPasswordInput = screen.getByLabelText('Підтвердіть пароль');
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Паролі не співпадають')).toBeInTheDocument();
      });
    });

    test('shows validation error for invalid phone number', async () => {
      renderWithProviders(<RegisterPage />);

      const phoneInput = screen.getByLabelText('Номер телефону');
      fireEvent.change(phoneInput, { target: { value: '123' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введіть коректний номер телефону')).toBeInTheDocument();
      });
    });

    test('shows validation error for invalid year of study', async () => {
      renderWithProviders(<RegisterPage />);

      const yearInput = screen.getByLabelText('Курс');
      fireEvent.change(yearInput, { target: { value: '0' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Курс повинен бути від 1 до 6')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls register function with correct data when form is submitted', async () => {
      mockUseAuth.register.mockResolvedValue(undefined);

      renderWithProviders(<RegisterPage />);

      // Fill in all required fields
      fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
      fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
      fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ ім. Тараса Шевченка' } });
      fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'Факультет кібернетики' } });
      fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUseAuth.register).toHaveBeenCalledWith({
          firstName: 'Тарас',
          lastName: 'Шевченко',
          email: 'taras@test.com',
          password: 'password123',
          phoneNumber: '+380501234567',
          studentId: 'КВ12345678',
          university: 'КНУ ім. Тараса Шевченка',
          faculty: 'Факультет кібернетики',
          yearOfStudy: 3,
        });
      });
    });

    test('navigates to home page after successful registration', async () => {
      mockUseAuth.register.mockResolvedValue(undefined);

      renderWithProviders(<RegisterPage />);

      // Fill in minimal required fields
      fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
      fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
      fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ' } });
      fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'ФК' } });
      fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('shows error message when registration fails', async () => {
      mockUseAuth.register.mockRejectedValue(new Error('Registration failed'));

      renderWithProviders(<RegisterPage />);

      // Fill in all fields
      fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
      fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
      fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ' } });
      fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'ФК' } });
      fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument();
      });
    });

    test('shows user-friendly error message for duplicate email', async () => {
      const error = new Error('Email already exists');
      (error as any).response = { status: 409 };
      mockUseAuth.register.mockRejectedValue(error);

      renderWithProviders(<RegisterPage />);

      // Fill in all fields
      fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
      fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
      fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ' } });
      fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'ФК' } });
      fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Користувач з таким email вже існує. Спробуйте інший email.')).toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    test('disables submit button while submitting', async () => {
      mockUseAuth.register.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<RegisterPage />);

      // Fill in all fields
      fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
      fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
      fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
      fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
      fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
      fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ' } });
      fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'ФК' } });
      fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });

      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('clears error message when form is resubmitted', async () => {
      mockUseAuth.register
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);

      renderWithProviders(<RegisterPage />);

      // Fill in all fields
      const fillForm = () => {
        fireEvent.change(screen.getByLabelText('Ім\'я'), { target: { value: 'Тарас' } });
        fireEvent.change(screen.getByLabelText('Прізвище'), { target: { value: 'Шевченко' } });
        fireEvent.change(screen.getByLabelText('Email адреса'), { target: { value: 'taras@test.com' } });
        fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Підтвердіть пароль'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Номер телефону'), { target: { value: '+380501234567' } });
        fireEvent.change(screen.getByLabelText('Студентський квиток'), { target: { value: 'КВ12345678' } });
        fireEvent.change(screen.getByLabelText('Університет'), { target: { value: 'КНУ' } });
        fireEvent.change(screen.getByLabelText('Факультет'), { target: { value: 'ФК' } });
        fireEvent.change(screen.getByLabelText('Курс'), { target: { value: '3' } });
      };

      fillForm();
      const submitButton = screen.getByRole('button', { name: /зареєструватися/i });

      // First submission - error
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
      renderWithProviders(<RegisterPage />);

      expect(screen.getByLabelText('Ім\'я')).toBeInTheDocument();
      expect(screen.getByLabelText('Прізвище')).toBeInTheDocument();
      expect(screen.getByLabelText('Email адреса')).toBeInTheDocument();
      expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
      expect(screen.getByLabelText('Підтвердіть пароль')).toBeInTheDocument();
    });

    test('has proper heading structure', () => {
      renderWithProviders(<RegisterPage />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Реєстрація нового акаунту');
    });
  });
});