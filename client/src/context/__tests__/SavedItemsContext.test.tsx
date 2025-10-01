import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SavedItemsProvider, useSavedItems } from '../SavedItemsContext';

// Mock the API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../services/api', () => mockApi);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestComponent = () => {
  const { savedItems, isSaved, toggleSaved, loadSavedItems } = useSavedItems();
  
  return (
    <div>
      <div data-testid="savedItems">{JSON.stringify(savedItems)}</div>
      <div data-testid="isSaved1">{isSaved('1').toString()}</div>
      <div data-testid="isSaved2">{isSaved('2').toString()}</div>
      <button onClick={() => toggleSaved('1')}>Toggle 1</button>
      <button onClick={() => toggleSaved('2')}>Toggle 2</button>
      <button onClick={() => loadSavedItems()}>Load Items</button>
    </div>
  );
};

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

describe('SavedItemsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.get.mockClear();
    mockApi.post.mockClear();
    mockApi.delete.mockClear();
  });

  describe('Initial State', () => {
    test('starts with empty saved items', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('savedItems')).toHaveTextContent('[]');
      expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('false');
    });

    test('loads saved items from localStorage on mount', async () => {
      localStorage.setItem('savedItems', JSON.stringify(['1', '2']));
      
      mockApi.get.mockResolvedValueOnce({
        data: ['1', '2'],
      });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('savedItems')).toHaveTextContent('["1","2"]');
      });

      expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('true');
    });

    test('handles API error when loading saved items', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('savedItems')).toHaveTextContent('[]');
      });

      expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('false');
    });
  });

  describe('Toggle Saved Functionality', () => {
    test('adds item to saved when not saved', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      });

      expect(mockApi.post).toHaveBeenCalledWith('/saved-listings', {
        listingId: '1',
      });
    });

    test('removes item from saved when already saved', async () => {
      // First add the item
      localStorage.setItem('savedItems', JSON.stringify(['1']));
      
      mockApi.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
      });

      expect(mockApi.delete).toHaveBeenCalledWith('/saved-listings/1');
    });

    test('handles API error when adding item', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
      });
    });

    test('handles API error when removing item', async () => {
      localStorage.setItem('savedItems', JSON.stringify(['1']));
      
      mockApi.delete.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      });
    });

    test('falls back to localStorage when API fails', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      });

      expect(localStorage.getItem('savedItems')).toBe('["1"]');
    });
  });

  describe('Load Saved Items Functionality', () => {
    test('loads saved items from API', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: ['1', '2', '3'],
      });

      renderWithProviders(<TestComponent />);

      const loadButton = screen.getByText('Load Items');
      await act(async () => {
        fireEvent.click(loadButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('savedItems')).toHaveTextContent('["1","2","3"]');
      });

      expect(mockApi.get).toHaveBeenCalledWith('/saved-listings');
    });

    test('handles empty response from API', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: [],
      });

      renderWithProviders(<TestComponent />);

      const loadButton = screen.getByText('Load Items');
      await act(async () => {
        fireEvent.click(loadButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('savedItems')).toHaveTextContent('[]');
      });
    });

    test('handles API error when loading', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithProviders(<TestComponent />);

      const loadButton = screen.getByText('Load Items');
      await act(async () => {
        fireEvent.click(loadButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('savedItems')).toHaveTextContent('[]');
      });
    });
  });

  describe('Is Saved Functionality', () => {
    test('returns true for saved items', () => {
      localStorage.setItem('savedItems', JSON.stringify(['1', '2']));
      
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('true');
    });

    test('returns false for unsaved items', () => {
      localStorage.setItem('savedItems', JSON.stringify(['1']));
      
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('false');
    });

    test('returns false for empty saved items', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
      expect(screen.getByTestId('isSaved2')).toHaveTextContent('false');
    });
  });

  describe('LocalStorage Integration', () => {
    test('updates localStorage when items are added', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(localStorage.getItem('savedItems')).toBe('["1"]');
      });
    });

    test('updates localStorage when items are removed', async () => {
      localStorage.setItem('savedItems', JSON.stringify(['1', '2']));
      
      mockApi.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(localStorage.getItem('savedItems')).toBe('["2"]');
      });
    });

    test('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem('savedItems', 'invalid json');
      
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('savedItems')).toHaveTextContent('[]');
      expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
    });
  });

  describe('Multiple Items Management', () => {
    test('handles multiple items correctly', async () => {
      mockApi.post
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      renderWithProviders(<TestComponent />);

      const toggle1Button = screen.getByText('Toggle 1');
      const toggle2Button = screen.getByText('Toggle 2');

      await act(async () => {
        fireEvent.click(toggle1Button);
      });

      await act(async () => {
        fireEvent.click(toggle2Button);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
        expect(screen.getByTestId('isSaved2')).toHaveTextContent('true');
      });

      expect(localStorage.getItem('savedItems')).toBe('["1","2"]');
    });

    test('handles removing multiple items correctly', async () => {
      localStorage.setItem('savedItems', JSON.stringify(['1', '2', '3']));
      
      mockApi.delete
        .mockResolvedValueOnce({ data: { success: true } })
        .mockResolvedValueOnce({ data: { success: true } });

      renderWithProviders(<TestComponent />);

      const toggle1Button = screen.getByText('Toggle 1');
      const toggle2Button = screen.getByText('Toggle 2');

      await act(async () => {
        fireEvent.click(toggle1Button);
      });

      await act(async () => {
        fireEvent.click(toggle2Button);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('false');
        expect(screen.getByTestId('isSaved2')).toHaveTextContent('false');
      });

      expect(localStorage.getItem('savedItems')).toBe('["3"]');
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      });
    });

    test('handles API timeout gracefully', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('timeout'));

      renderWithProviders(<TestComponent />);

      const toggleButton = screen.getByText('Toggle 1');
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('isSaved1')).toHaveTextContent('true');
      });
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const TestComponentWithCallback = () => {
        const { isSaved } = useSavedItems();
        const [renderCount, setRenderCount] = React.useState(0);
        
        React.useEffect(() => {
          setRenderCount(prev => prev + 1);
        });
        
        return (
          <div>
            <div data-testid="renderCount">{renderCount}</div>
            <div data-testid="isSaved1">{isSaved('1').toString()}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponentWithCallback />);
      
      expect(screen.getByTestId('renderCount')).toHaveTextContent('1');
    });
  });
});
