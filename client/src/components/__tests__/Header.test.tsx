import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from '../Header';
import { AuthContext } from '../../contexts/AuthContext';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement, authValue: any = null) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {component}
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders logo', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    expect(screen.getByText('CampusSwap')).toBeInTheDocument();
  });

  test('renders search input', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    expect(screen.getByPlaceholderText(/Пошук/i)).toBeInTheDocument();
  });

  test('renders login button when not authenticated', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    expect(screen.getByText('Увійти')).toBeInTheDocument();
  });

  test('renders user menu when authenticated', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@test.com' };
    renderWithProviders(<Header />, { user: mockUser, login: jest.fn(), logout: jest.fn() });
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('renders create listing button', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    expect(screen.getByText('Створити оголошення')).toBeInTheDocument();
  });

  test('navigates to home when logo is clicked', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    const logo = screen.getByText('CampusSwap');
    fireEvent.click(logo);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('shows dropdown menu when user button is clicked', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@test.com' };
    renderWithProviders(<Header />, { user: mockUser, login: jest.fn(), logout: jest.fn() });

    const userButton = screen.getByText('Test User');
    fireEvent.click(userButton);

    expect(screen.getByText('Мій профіль')).toBeInTheDocument();
    expect(screen.getByText('Мої оголошення')).toBeInTheDocument();
    expect(screen.getByText('Вийти')).toBeInTheDocument();
  });

  test('calls logout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    const mockUser = { id: '1', name: 'Test User', email: 'test@test.com' };
    renderWithProviders(<Header />, { user: mockUser, login: jest.fn(), logout: mockLogout });

    const userButton = screen.getByText('Test User');
    fireEvent.click(userButton);

    const logoutButton = screen.getByText('Вийти');
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  test('navigates to create listing when button is clicked', () => {
    renderWithProviders(<Header />, { user: null, login: jest.fn(), logout: jest.fn() });
    const createButton = screen.getByText('Створити оголошення');
    fireEvent.click(createButton.closest('a')!);
    expect(window.location.pathname).toBe('/create');
  });
});