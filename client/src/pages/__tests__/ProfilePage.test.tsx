import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '../ProfilePage';
import { AuthProvider } from '../../context/AuthContext';

// Mock the useAuth hook
const mockUser = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Тарас',
  lastName: 'Шевченко',
  fullName: 'Тарас Шевченко',
  phoneNumber: '+380501234567',
  studentId: 'КВ12345678',
  university: 'КНУ ім. Тараса Шевченка',
  faculty: 'Факультет кібернетики',
  yearOfStudy: 3,
  profileImageUrl: null,
  rating: 4.5,
  reviewsCount: 10,
  isEmailVerified: true,
  isPhoneVerified: false,
  createdAt: new Date('2023-09-01'),
};

const mockUseAuth = {
  user: mockUser,
  isAuthenticated: true,
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

// Mock SavedItemsContext
jest.mock('../../context/SavedItemsContext', () => ({
  useSavedItems: () => ({
    savedItems: ['1', '2', '3'],
    isSaved: jest.fn().mockReturnValue(false),
    toggleSaved: jest.fn(),
    loadSavedItems: jest.fn(),
  }),
  SavedItemsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the API
const mockApi = {
  get: jest.fn(),
  put: jest.fn(),
};

jest.mock('../../services/api', () => ({
  default: {
    get: (...args: any[]) => mockApi.get(...args),
    put: (...args: any[]) => mockApi.put(...args),
  },
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
      <AuthProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const mockListings = [
  {
    id: '1',
    title: 'Підручник з математики',
    description: 'Відмінний стан',
    price: 250,
    category: 0,
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
    category: 2,
    location: 'Львів',
    isNegotiable: false,
    imageUrls: ['https://example.com/image2.jpg'],
    createdAt: new Date('2024-01-14'),
  },
];

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders user profile information', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('Тарас Шевченко')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
      expect(screen.getByText('КНУ ім. Тараса Шевченка')).toBeInTheDocument();
      expect(screen.getByText('3 курс')).toBeInTheDocument();
    });

    test('renders profile image or placeholder', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const profileImage = screen.getByAltText('Тарас Шевченко');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://ui-avatars.com/api/?name=Тарас+Шевченко');
    });

    test('renders rating and reviews count', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('4.5 (10 відгуків)')).toBeInTheDocument();
    });

    test('renders edit profile button', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('Редагувати профіль')).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    test('renders all tabs', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      expect(screen.getByRole('tab', { name: 'Мої оголошення' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Збережені' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Налаштування' })).toBeInTheDocument();
    });

    test('switches between tabs', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<ProfilePage />);

      const savedTab = screen.getByRole('tab', { name: 'Збережені' });
      fireEvent.click(savedTab);

      await waitFor(() => {
        expect(screen.getByText('Збережені оголошення')).toBeInTheDocument();
      });

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText('Особиста інформація')).toBeInTheDocument();
      });
    });
  });

  describe('My Listings Tab', () => {
    test('displays user listings', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });

      renderWithProviders(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Підручник з математики')).toBeInTheDocument();
        expect(screen.getByText('Ноутбук Dell')).toBeInTheDocument();
      });
    });

    test('shows loading state while fetching listings', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<ProfilePage />);

      expect(screen.getByText('Завантаження...')).toBeInTheDocument();
    });

    test('shows message when no listings found', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('У вас поки немає оголошень')).toBeInTheDocument();
      });
    });
  });

  describe('Saved Listings Tab', () => {
    test('displays saved listings', async () => {
      mockApi.get
        .mockResolvedValueOnce({ data: [] }) // My listings
        .mockResolvedValueOnce({ data: mockListings }); // Saved listings

      renderWithProviders(<ProfilePage />);

      const savedTab = screen.getByRole('tab', { name: 'Збережені' });
      fireEvent.click(savedTab);

      await waitFor(() => {
        expect(screen.getByText('Збережені оголошення')).toBeInTheDocument();
        expect(screen.getByText('Підручник з математики')).toBeInTheDocument();
      });
    });

    test('shows message when no saved items', async () => {
      mockApi.get.mockResolvedValue({ data: [] });

      jest.spyOn(require('../../context/SavedItemsContext'), 'useSavedItems').mockReturnValue({
        savedItems: [],
        isSaved: jest.fn().mockReturnValue(false),
        toggleSaved: jest.fn(),
        loadSavedItems: jest.fn(),
      });

      renderWithProviders(<ProfilePage />);

      const savedTab = screen.getByRole('tab', { name: 'Збережені' });
      fireEvent.click(savedTab);

      await waitFor(() => {
        expect(screen.getByText('У вас немає збережених оголошень')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Profile Functionality', () => {
    test('enters edit mode when edit button is clicked', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      expect(screen.getByText('Скасувати')).toBeInTheDocument();
      expect(screen.getByText('Зберегти зміни')).toBeInTheDocument();
    });

    test('populates form fields with current user data in edit mode', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      const firstNameInput = screen.getByLabelText("Ім'я");
      const lastNameInput = screen.getByLabelText('Прізвище');
      const phoneInput = screen.getByLabelText('Телефон');

      expect(firstNameInput).toHaveValue('Тарас');
      expect(lastNameInput).toHaveValue('Шевченко');
      expect(phoneInput).toHaveValue('+380501234567');
    });

    test('updates profile when save button is clicked', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      mockApi.put.mockResolvedValue({ data: { ...mockUser, firstName: 'Іван' } });

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      const firstNameInput = screen.getByLabelText("Ім'я");
      fireEvent.change(firstNameInput, { target: { value: 'Іван' } });

      const saveButton = screen.getByText('Зберегти зміни');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/users/me', {
          firstName: 'Іван',
          lastName: 'Шевченко',
          phoneNumber: '+380501234567',
        });
      });
    });

    test('cancels edit mode when cancel button is clicked', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      expect(screen.getByText('Скасувати')).toBeInTheDocument();

      const cancelButton = screen.getByText('Скасувати');
      fireEvent.click(cancelButton);

      expect(screen.getByText('Редагувати профіль')).toBeInTheDocument();
    });

    test('shows success message after successful profile update', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      mockApi.put.mockResolvedValue({ data: mockUser });

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('Зберегти зміни');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUseAuth.refreshUser).toHaveBeenCalled();
      });
    });

    test('shows error message when profile update fails', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      mockApi.put.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('Зберегти зміни');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalled();
      });
    });
  });

  describe('Settings Tab', () => {
    test('displays user information in settings', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      expect(screen.getByText('Особиста інформація')).toBeInTheDocument();
      expect(screen.getByLabelText("Ім'я")).toBeInTheDocument();
      expect(screen.getByLabelText('Прізвище')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
    });

    test('disables non-editable fields', () => {
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('handles API errors when fetching listings', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Помилка завантаження оголошень')).toBeInTheDocument();
      });
    });

    test('handles profile update errors gracefully', async () => {
      mockApi.get.mockResolvedValue({ data: [] });
      mockApi.put.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ProfilePage />);

      const settingsTab = screen.getByRole('tab', { name: 'Налаштування' });
      fireEvent.click(settingsTab);

      const editButton = screen.getByText('Редагувати профіль');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('Зберегти зміни');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalled();
      });
    });
  });
});