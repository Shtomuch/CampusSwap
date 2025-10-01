import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSavedItems } from '../context/SavedItemsContext';
import { Tab } from '@headlessui/react';
import { UserCircleIcon, ClipboardDocumentListIcon, HeartIcon, CogIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { savedItems } = useSavedItems();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Логування user data
  React.useEffect(() => {
    console.log('👤 ProfilePage user data:', user);
  }, [user]);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
  });

  // Оновлюємо formData при зміні user
  React.useEffect(() => {
    if (user) {
      console.log('🔄 Updating formData with user data:', {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        university: user.university,
        faculty: user.faculty,
        yearOfStudy: user.yearOfStudy
      });
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  // Завантаження збережених оголошень
  const { data: savedListings, isLoading: savedLoading } = useQuery<Listing[]>({
    queryKey: ['savedListings'],
    queryFn: async () => {
      console.log('🔄 Завантаження збережених оголошень...');
      const response = await api.get('/saved-listings');
      console.log('✅ Збережені оголошення завантажені:', response.data);
      
      // Якщо є збережені ID, завантажуємо повні дані оголошень
      if (response.data && response.data.length > 0) {
        const listings = await Promise.all(
          response.data.map(async (listingId: string) => {
            try {
              const listingResponse = await api.get(`/listings/${listingId}`);
              return listingResponse.data;
            } catch (error) {
              console.error(`❌ Помилка завантаження оголошення ${listingId}:`, error);
              return null;
            }
          })
        );
        return listings.filter(Boolean);
      }
      
      return [];
    },
    enabled: savedItems.length > 0, // Завантажуємо тільки якщо є збережені ID
  });

  // Завантаження моїх оголошень
  const { data: myListings, isLoading: myListingsLoading } = useQuery<Listing[]>({
    queryKey: ['myListings'],
    queryFn: async () => {
      console.log('🔄 Завантаження моїх оголошень...');
      const response = await api.get('/listings/my');
      console.log('✅ Мої оголошення завантажені:', response.data);
      return response.data;
    },
  });

  // Мутація для оновлення профілю
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔄 Оновлення профілю...', data);
      const response = await api.put('/users/profile', data);
      console.log('✅ Профіль оновлено:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ Профіль успішно оновлено');
      setIsEditing(false);
      refreshUser(); // Оновлюємо дані користувача в контексті
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      console.error('❌ Помилка оновлення профілю:', error);
      alert(`Помилка оновлення профілю: ${error?.response?.data?.message || error.message}`);
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Збереження профілю...', formData);
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
    });
  };

  const tabs = [
    { name: 'Мої оголошення', icon: ClipboardDocumentListIcon },
    { name: 'Збережені', icon: HeartIcon },
    { name: 'Налаштування', icon: CogIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={user.profileImageUrl}
                alt=""
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}</div>`;
                  }
                }}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>{user?.university}</span>
              <span>•</span>
              <span>{user?.faculty}</span>
              <span>•</span>
              <span>{user?.yearOfStudy} курс</span>
            </div>
            <div className="mt-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="ml-2 text-sm text-gray-600">{user?.rating} ({user?.reviewsCount} відгуків)</span>
            </div>
          </div>
          <button 
            onClick={handleEditClick}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {isEditing ? 'Скасувати' : 'Редагувати профіль'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
                )
              }
            >
              <div className="flex items-center justify-center">
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myListingsLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Завантаження ваших оголошень...</p>
                </div>
              ) : myListings && myListings.length > 0 ? (
                myListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Немає оголошень</h3>
                  <p className="mt-1 text-sm text-gray-500">Почніть з створення вашого першого оголошення.</p>
                </div>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Завантаження збережених оголошень...</p>
                </div>
              ) : savedListings && savedListings.length > 0 ? (
                savedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Немає збережених оголошень</h3>
                  <p className="mt-1 text-sm text-gray-500">Додайте товари до збережених, натиснувши на сердечко.</p>
                </div>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Налаштування профілю</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ім'я</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Прізвище</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Телефон</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    disabled={!isEditing}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {updateProfileMutation.isPending ? 'Збереження...' : 'Зберегти зміни'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Скасувати
                    </button>
                  </div>
                )}
              </form>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}