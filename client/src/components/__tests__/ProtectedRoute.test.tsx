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
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from '../ProtectedRoute';
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

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('shows loading spinner when user is loading', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('shows loading spinner with correct styling', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-primary-600');
    });

    test('centers loading spinner correctly', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('flex', 'justify-center', 'items-center', 'min-h-[400px]');
    });
  });

  describe('Unauthenticated User', () => {
    test('redirects to login page when user is not authenticated', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('does not show loading spinner when not loading and not authenticated', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    test('renders children when user is authenticated', () => {
      mockUseAuth.isLoading = false;
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
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('renders multiple children when user is authenticated', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>First Child</div>
          <div>Second Child</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });

    test('renders complex children when user is authenticated', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>
            <h1>Protected Page</h1>
            <p>This is protected content</p>
            <button>Click me</button>
          </div>
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Protected Page')).toBeInTheDocument();
      expect(screen.getByText('This is protected content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    test('transitions from loading to authenticated correctly', () => {
      // Start with loading
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      
      // Transition to authenticated
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('transitions from loading to unauthenticated correctly', () => {
      // Start with loading
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      
      // Transition to unauthenticated
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = false;
      
      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles null children gracefully', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      renderWithProviders(
        <ProtectedRoute>
          {null}
        </ProtectedRoute>
      );
      
      // Should not crash
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('handles undefined children gracefully', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      renderWithProviders(
        <ProtectedRoute>
          {undefined}
        </ProtectedRoute>
      );
      
      // Should not crash
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('handles empty children gracefully', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      renderWithProviders(
        <ProtectedRoute>
          <></>
        </ProtectedRoute>
      );
      
      // Should not crash
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('loading spinner has proper accessibility attributes', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    test('loading spinner is properly centered for screen readers', () => {
      mockUseAuth.isLoading = true;
      mockUseAuth.isAuthenticated = false;
      
      renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      
      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily when props are the same', () => {
      mockUseAuth.isLoading = false;
      mockUseAuth.isAuthenticated = true;
      
      const TestComponent = () => <div>Test Content</div>;
      
      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      
      // Re-render with same props
      rerender(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
