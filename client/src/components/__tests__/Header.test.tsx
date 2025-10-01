import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../Layout';
import { AuthProvider } from '../../context/AuthContext';

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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Layout Header', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders logo', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('CampusSwap')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('Головна')).toBeInTheDocument();
    expect(screen.getByText('Оголошення')).toBeInTheDocument();
  });

  test('renders login button when not authenticated', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('Увійти')).toBeInTheDocument();
  });

  test('renders register button when not authenticated', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('Реєстрація')).toBeInTheDocument();
  });

  test('renders create listing button', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByText('Створити оголошення')).toBeInTheDocument();
  });

  test('navigates to home when logo is clicked', () => {
    renderWithProviders(<Layout />);
    const logo = screen.getByText('CampusSwap');
    fireEvent.click(logo);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('renders mobile menu toggle button', () => {
    renderWithProviders(<Layout />);
    // The mobile menu button should be present
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('navigates to register when register button is clicked', () => {
    renderWithProviders(<Layout />);
    const registerButton = screen.getByText('Реєстрація');
    fireEvent.click(registerButton.closest('a')!);
    expect(window.location.pathname).toBe('/register');
  });

  test('navigates to create listing when button is clicked', () => {
    renderWithProviders(<Layout />);
    const createButton = screen.getByText('Створити оголошення');
    fireEvent.click(createButton.closest('a')!);
    expect(window.location.pathname).toBe('/listings/create');
  });
});