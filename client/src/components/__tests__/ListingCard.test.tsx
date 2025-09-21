import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ListingCard from '../ListingCard';
import { Listing } from '../../types';

const mockListing: Listing = {
  id: '1',
  title: 'Test Book',
  description: 'Test description',
  price: 100,
  condition: 'Good',
  category: 0,
  imageUrls: ['test.jpg'],
  sellerId: 'seller1',
  sellerName: 'Test Seller',
  location: 'Campus',
  isNegotiable: true,
  viewCount: 10,
  createdAt: '2024-01-01',
  status: 0
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ListingCard', () => {
  test('renders listing title', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  test('renders listing price', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('₴100')).toBeInTheDocument();
  });

  test('renders listing condition', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  test('renders negotiable badge when isNegotiable is true', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Торг')).toBeInTheDocument();
  });

  test('does not render negotiable badge when isNegotiable is false', () => {
    const nonNegotiableListing = { ...mockListing, isNegotiable: false };
    renderWithRouter(<ListingCard listing={nonNegotiableListing} />);
    expect(screen.queryByText('Торг')).not.toBeInTheDocument();
  });

  test('renders listing image', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('test.jpg');
  });

  test('renders placeholder image when no images provided', () => {
    const listingWithoutImage = { ...mockListing, imageUrls: [] };
    renderWithRouter(<ListingCard listing={listingWithoutImage} />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.src).toContain('placeholder');
  });

  test('renders view count', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  test('renders seller name', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Test Seller')).toBeInTheDocument();
  });

  test('renders location', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    expect(screen.getByText('Campus')).toBeInTheDocument();
  });
});