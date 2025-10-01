import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ListingCard from '../ListingCard';
import { Listing, ListingCategory, ListingStatus } from '../../types';
import { SavedItemsProvider } from '../../context/SavedItemsContext';

// Mock the useSavedItems hook
const mockUseSavedItems = {
  isSaved: jest.fn(),
  toggleSaved: jest.fn(),
  savedItems: [],
  loadSavedItems: jest.fn(),
};

jest.mock('../../context/SavedItemsContext', () => ({
  useSavedItems: () => mockUseSavedItems,
  SavedItemsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, format, options) => '25 вересня'),
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
      <SavedItemsProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </SavedItemsProvider>
    </QueryClientProvider>
  );
};

const mockListing: Listing = {
  id: '1',
  title: 'Test Listing',
  description: 'Test description',
  price: 100,
  currency: 'UAH',
  category: ListingCategory.Textbooks,
  status: ListingStatus.Active,
  condition: 'New',
  isbn: '1234567890',
  courseCode: 'CS101',
  author: 'Test Author',
  publicationYear: 2023,
  location: 'Kyiv',
  isNegotiable: true,
  viewsCount: 10,
  userId: 'user1',
  sellerName: 'Test Seller',
  imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  createdAt: new Date('2023-09-25'),
  updatedAt: new Date('2023-09-25'),
};

describe('ListingCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSavedItems.isSaved.mockReturnValue(false);
    mockUseSavedItems.toggleSaved.mockResolvedValue(undefined);
  });

  describe('Basic Rendering', () => {
    test('renders listing card with all required information', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      expect(screen.getByText('Test Listing')).toBeInTheDocument();
      expect(screen.getByText('100 ₴')).toBeInTheDocument();
      expect(screen.getByText('Торг можливий')).toBeInTheDocument();
      expect(screen.getByText('Kyiv')).toBeInTheDocument();
      expect(screen.getByText('25 вересня')).toBeInTheDocument();
    });

    test('renders category label correctly', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      expect(screen.getByText('Підручники')).toBeInTheDocument();
    });

    test('renders image with correct src and alt', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const image = screen.getByAltText('Test Listing');
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    test('renders fallback image when no images provided', () => {
      const listingWithoutImages = { ...mockListing, imageUrls: [] };
      renderWithProviders(<ListingCard listing={listingWithoutImages} />);
      
      const image = screen.getByAltText('Test Listing');
      expect(image).toHaveAttribute('src', 'https://via.placeholder.com/400x300?text=No+Image');
    });
  });

  describe('Price Display', () => {
    test('formats price correctly with Ukrainian locale', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      expect(screen.getByText('100 ₴')).toBeInTheDocument();
    });

    test('displays 0 when price is not provided', () => {
      const listingWithoutPrice = { ...mockListing, price: undefined };
      renderWithProviders(<ListingCard listing={listingWithoutPrice} />);
      
      expect(screen.getByText('0 ₴')).toBeInTheDocument();
    });

    test('formats large numbers correctly', () => {
      const listingWithLargePrice = { ...mockListing, price: 1234567 };
      renderWithProviders(<ListingCard listing={listingWithLargePrice} />);
      
      expect(screen.getByText('1,234,567 ₴')).toBeInTheDocument();
    });
  });

  describe('Save/Unsave Functionality', () => {
    test('renders unsaved heart icon when item is not saved', () => {
      mockUseSavedItems.isSaved.mockReturnValue(false);
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const heartButton = screen.getByTitle('Додати до збережених');
      expect(heartButton).toBeInTheDocument();
    });

    test('renders saved heart icon when item is saved', () => {
      mockUseSavedItems.isSaved.mockReturnValue(true);
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const heartButton = screen.getByTitle('Видалити з збережених');
      expect(heartButton).toBeInTheDocument();
    });

    test('calls toggleSaved when heart button is clicked', async () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const heartButton = screen.getByTitle('Додати до збережених');
      fireEvent.click(heartButton);
      
      await waitFor(() => {
        expect(mockUseSavedItems.toggleSaved).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Navigation', () => {
    test('renders as a link to listing details page', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/listings/1');
    });
  });

  describe('Accessibility', () => {
    test('has proper alt text for image', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const image = screen.getByAltText('Test Listing');
      expect(image).toBeInTheDocument();
    });

    test('has proper title attribute for heart button', () => {
      renderWithProviders(<ListingCard listing={mockListing} />);
      
      const heartButton = screen.getByTitle('Додати до збережених');
      expect(heartButton).toBeInTheDocument();
    });
  });
});