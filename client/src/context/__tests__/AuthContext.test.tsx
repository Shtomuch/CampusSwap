import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('../../services/api', () => mockApi);

// Mock the realtime service
jest.mock('../../services/realtime', () => ({
  stopAllConnections: jest.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, refreshUser } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => register({
        email: 'test@test.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890',
        studentId: '12345',
        university: 'Test University',
        faculty: 'Computer Science',
        yearOfStudy: 3,
      })}>Register</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => refreshUser()}>Refresh</button>
    </div>
  );
};

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

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.get.mockClear();
    mockApi.post.mockClear();
  });

  describe('Initial State', () => {
    test('starts with no user and not authenticated', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
    });

    test('loads user from localStorage on mount', async () => {
      localStorage.setItem('accessToken', 'test-token');
      mockApi.get.mockResolvedValueOnce({
        data: {
          Id: '1',
          Email: 'test@test.com',
          FirstName: 'Test',
          LastName: 'User',
          FullName: 'Test User',
          PhoneNumber: '1234567890',
          StudentId: '12345',
          University: 'Test University',
          Faculty: 'Computer Science',
          YearOfStudy: 3,
          ProfileImageUrl: null,
          Rating: 0,
          ReviewsCount: 0,
          IsEmailVerified: false,
          IsPhoneVerified: false,
          CreatedAt: '2023-09-25T00:00:00Z',
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    test('handles API error when loading user', async () => {
      localStorage.setItem('accessToken', 'test-token');
      mockApi.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    test('handles 401 error when loading user', async () => {
      localStorage.setItem('accessToken', 'test-token');
      mockApi.get.mockRejectedValueOnce({
        response: { status: 401 },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('Login Functionality', () => {
    test('successfully logs in user', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          accessToken: 'test-token',
          refreshToken: 'refresh-token',
          user: {
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
          },
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(localStorage.getItem('accessToken')).toBe('test-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    });

    test('handles login error', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Login failed'));

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });

    test('handles incomplete login response', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          accessToken: 'test-token',
          // Missing refreshToken and user
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Register Functionality', () => {
    test('successfully registers user', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          accessToken: 'test-token',
          refreshToken: 'refresh-token',
          user: {
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
          },
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const registerButton = screen.getByText('Register');
      await act(async () => {
        fireEvent.click(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(localStorage.getItem('accessToken')).toBe('test-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    });

    test('handles register error', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Registration failed'));

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const registerButton = screen.getByText('Register');
      await act(async () => {
        fireEvent.click(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Logout Functionality', () => {
    test('successfully logs out user', async () => {
      // First login
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      
      mockApi.get.mockResolvedValueOnce({
        data: {
          Id: '1',
          Email: 'test@test.com',
          FirstName: 'Test',
          LastName: 'User',
          FullName: 'Test User',
          PhoneNumber: '1234567890',
          StudentId: '12345',
          University: 'Test University',
          Faculty: 'Computer Science',
          YearOfStudy: 3,
          ProfileImageUrl: null,
          Rating: 0,
          ReviewsCount: 0,
          IsEmailVerified: false,
          IsPhoneVerified: false,
          CreatedAt: '2023-09-25T00:00:00Z',
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Then logout
      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Refresh User Functionality', () => {
    test('successfully refreshes user data', async () => {
      localStorage.setItem('accessToken', 'test-token');
      
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            Id: '1',
            Email: 'test@test.com',
            FirstName: 'Test',
            LastName: 'User',
            FullName: 'Test User',
            PhoneNumber: '1234567890',
            StudentId: '12345',
            University: 'Test University',
            Faculty: 'Computer Science',
            YearOfStudy: 3,
            ProfileImageUrl: null,
            Rating: 0,
            ReviewsCount: 0,
            IsEmailVerified: false,
            IsPhoneVerified: false,
            CreatedAt: '2023-09-25T00:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          data: {
            Id: '1',
            Email: 'test@test.com',
            FirstName: 'Updated',
            LastName: 'User',
            FullName: 'Updated User',
            PhoneNumber: '1234567890',
            StudentId: '12345',
            University: 'Test University',
            Faculty: 'Computer Science',
            YearOfStudy: 3,
            ProfileImageUrl: null,
            Rating: 0,
            ReviewsCount: 0,
            IsEmailVerified: false,
            IsPhoneVerified: false,
            CreatedAt: '2023-09-25T00:00:00Z',
          },
        });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('Test User');

      const refreshButton = screen.getByText('Refresh');
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Updated User');
      });
    });

    test('handles refresh error', async () => {
      localStorage.setItem('accessToken', 'test-token');
      
      mockApi.get
        .mockResolvedValueOnce({
          data: {
            Id: '1',
            Email: 'test@test.com',
            FirstName: 'Test',
            LastName: 'User',
            FullName: 'Test User',
            PhoneNumber: '1234567890',
            StudentId: '12345',
            University: 'Test University',
            Faculty: 'Computer Science',
            YearOfStudy: 3,
            ProfileImageUrl: null,
            Rating: 0,
            ReviewsCount: 0,
            IsEmailVerified: false,
            IsPhoneVerified: false,
            CreatedAt: '2023-09-25T00:00:00Z',
          },
        })
        .mockRejectedValueOnce({
          response: { status: 401 },
        });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const refreshButton = screen.getByText('Refresh');
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('Data Mapping', () => {
    test('correctly maps PascalCase to camelCase for user data', async () => {
      localStorage.setItem('accessToken', 'test-token');
      
      mockApi.get.mockResolvedValueOnce({
        data: {
          Id: '1',
          Email: 'test@test.com',
          FirstName: 'Test',
          LastName: 'User',
          FullName: 'Test User',
          PhoneNumber: '1234567890',
          StudentId: '12345',
          University: 'Test University',
          Faculty: 'Computer Science',
          YearOfStudy: 3,
          ProfileImageUrl: null,
          Rating: 0,
          ReviewsCount: 0,
          IsEmailVerified: false,
          IsPhoneVerified: false,
          CreatedAt: '2023-09-25T00:00:00Z',
        },
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const userData = JSON.parse(screen.getByTestId('user').textContent || '{}');
      expect(userData.id).toBe('1');
      expect(userData.email).toBe('test@test.com');
      expect(userData.firstName).toBe('Test');
      expect(userData.lastName).toBe('User');
      expect(userData.fullName).toBe('Test User');
      expect(userData.phoneNumber).toBe('1234567890');
      expect(userData.studentId).toBe('12345');
      expect(userData.university).toBe('Test University');
      expect(userData.faculty).toBe('Computer Science');
      expect(userData.yearOfStudy).toBe(3);
      expect(userData.profileImageUrl).toBeNull();
      expect(userData.rating).toBe(0);
      expect(userData.reviewsCount).toBe(0);
      expect(userData.isEmailVerified).toBe(false);
      expect(userData.isPhoneVerified).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });

    test('handles API errors with user-friendly messages', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: { status: 400 },
        message: 'Invalid credentials',
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        fireEvent.click(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });
    });
  });
});
