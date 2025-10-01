// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the API
const mockApi = {
  get: jest.fn(),
};

jest.mock('../../services/api', () => ({
  default: {
    get: (...args: any[]) => mockApi.get(...args),
  },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '../HomePage';
import { ListingCategory } from '../../types';

// Mock SavedItemsContext
jest.mock('../../context/SavedItemsContext', () => ({
  useSavedItems: () => ({
    isSaved: jest.fn().mockReturnValue(false),
    toggleSaved: jest.fn(),
    savedItems: [],
    loadSavedItems: jest.fn(),
  }),
  SavedItemsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockListings = [
  {
    id: '1',
    title: 'Підручник з математики',
    description: 'Відмінний стан',
    price: 250,
    category: ListingCategory.Textbooks,
    location: 'Київ',
    isNegotiable: true,
    imageUrls: ['https://example.com/image1.jpg'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Ноутбук Dell',
    description: 'Для навчання',
    price: 15000,
    category: ListingCategory.Electronics,
    location: 'Львів',
    isNegotiable: false,
    imageUrls: ['https://example.com/image2.jpg'],
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    title: 'Стіл письмовий',
    description: 'Дерев\'яний',
    price: 1500,
    category: ListingCategory.Furniture,
    location: 'Харків',
    isNegotiable: true,
    imageUrls: [],
    createdAt: new Date('2024-01-13'),
  },
];

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders hero section with title and description', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      expect(screen.getByText('CampusSwap 🎓')).toBeInTheDocument();
      expect(screen.getByText('Студентський маркетплейс для купівлі та продажу підручників і речей')).toBeInTheDocument();
    });

    test('renders search bar', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const searchInput = screen.getByPlaceholderText('Пошук підручників, електроніки, меблів...');
      expect(searchInput).toBeInTheDocument();
    });

    test('renders all categories', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Категорії')).toBeInTheDocument();
      expect(screen.getByText('Підручники')).toBeInTheDocument();
      expect(screen.getByText('Електроніка')).toBeInTheDocument();
      expect(screen.getByText('Меблі')).toBeInTheDocument();
      expect(screen.getByText('Інше')).toBeInTheDocument();
    });

    test('renders features section', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Чому CampusSwap?')).toBeInTheDocument();
      expect(screen.getByText('Економія грошей')).toBeInTheDocument();
      expect(screen.getByText('Студентська спільнота')).toBeInTheDocument();
      expect(screen.getByText('Екологічність')).toBeInTheDocument();
    });
  });

  describe('Listings Display', () => {
    test('displays recent listings', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Останні оголошення')).toBeInTheDocument();
        expect(screen.getByText('Підручник з математики')).toBeInTheDocument();
        expect(screen.getByText('Ноутбук Dell')).toBeInTheDocument();
        expect(screen.getByText('Стіл письмовий')).toBeInTheDocument();
      });
    });

    test('shows loading skeleton while fetching listings', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<HomePage />);

      const skeletons = screen.getAllByTestId((content, element) => {
        return element?.className?.includes('animate-pulse') || false;
      });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('handles empty listings', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Останні оголошення')).toBeInTheDocument();
      });
    });

    test('displays link to all listings', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        const allListingsLink = screen.getByText('Всі оголошення →');
        expect(allListingsLink).toBeInTheDocument();
        expect(allListingsLink.closest('a')).toHaveAttribute('href', '/listings');
      });
    });
  });

  describe('Search Functionality', () => {
    test('updates search term on input', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const searchInput = screen.getByPlaceholderText('Пошук підручників, електроніки, меблів...');
      fireEvent.change(searchInput, { target: { value: 'математика' } });

      expect(searchInput).toHaveValue('математика');
    });

    test('navigates to listings page with search query on search button click', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const searchInput = screen.getByPlaceholderText('Пошук підручників, електроніки, меблів...');
      fireEvent.change(searchInput, { target: { value: 'ноутбук' } });

      const searchButton = screen.getByText('Пошук');
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledWith('/listings?search=' + encodeURIComponent('ноутбук'));
    });

    test('handles empty search query', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const searchButton = screen.getByText('Пошук');
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledWith('/listings?search=');
    });

    test('handles special characters in search query', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const searchInput = screen.getByPlaceholderText('Пошук підручників, електроніки, меблів...');
      fireEvent.change(searchInput, { target: { value: 'C++ & Java' } });

      const searchButton = screen.getByText('Пошук');
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledWith('/listings?search=' + encodeURIComponent('C++ & Java'));
    });
  });

  describe('Category Navigation', () => {
    test('navigates to listings page with category filter when category is clicked', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const textbooksCategory = screen.getByText('Підручники').closest('a');
      expect(textbooksCategory).toHaveAttribute('href', `/listings?category=${ListingCategory.Textbooks}`);
    });

    test('all category links have correct href attributes', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<HomePage />);

      const electronicsLink = screen.getByText('Електроніка').closest('a');
      expect(electronicsLink).toHaveAttribute('href', `/listings?category=${ListingCategory.Electronics}`);

      const furnitureLink = screen.getByText('Меблі').closest('a');
      expect(furnitureLink).toHaveAttribute('href', `/listings?category=${ListingCategory.Furniture}`);

      const otherLink = screen.getByText('Інше').closest('a');
      expect(otherLink).toHaveAttribute('href', `/listings?category=${ListingCategory.Other}`);
    });
  });

  describe('API Integration', () => {
    test('fetches listings with correct parameters', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/listings', {
          params: { pageSize: 8 },
        });
      });
    });

    test('handles API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Останні оголошення')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<HomePage />);

      expect(screen.getByText('CampusSwap 🎓')).toBeInTheDocument();
    });

    test('renders correctly on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      });

      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<HomePage />);

      expect(screen.getByText('CampusSwap 🎓')).toBeInTheDocument();
    });
  });
});