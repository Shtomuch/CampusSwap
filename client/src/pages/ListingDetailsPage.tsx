import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon, ChatBubbleLeftIcon, MapPinIcon, CalendarIcon, EyeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import { Listing } from '../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useSavedItems } from '../context/SavedItemsContext';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isSaved, toggleSaved } = useSavedItems();
  const { showSuccess, showError } = useToast();
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}`);
      return response.data;
    },
  });

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/chat?userId=${listing?.userId}`);
  };

  const handleOrder = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowOrderModal(true);
  };

  const confirmOrder = async () => {
    try {
      console.log('🛒 Creating order for listing:', listing?.id);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // 18:00 завтра
      
      const orderData = {
        listingId: listing?.id,
        meetingLocation: listing?.location || 'Узгоджується',
        meetingTime: tomorrow.toISOString(),
        notes: `Запит з оголошення ${listing?.title}`,
      };
      console.log('📝 Order data:', orderData);
      
      const response = await api.post('/orders', orderData);
      console.log('✅ Order created successfully:', response.data);
      
      // Показуємо успішне повідомлення
      showSuccess('Замовлення створено!', 'Замовлення успішно створено! Ви будете перенаправлені на сторінку замовлень.');
      setShowOrderModal(false);
      
      // Перенаправляємо через 2 секунди
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Не вдалося створити замовлення';
      
      // Показуємо детальну помилку
      showError('Помилка створення замовлення', errorMessage);
      setShowOrderModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Оголошення не знайдено</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative">
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              {listing.imageUrls?.[selectedImage] ? (
                <img
                  src={listing.imageUrls[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500"><span>Немає зображення</span></div>';
                    }
                  }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <svg className="w-24 h-24 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Немає зображення</span>
                </div>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={() => toggleSaved(listing.id)}
                className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                title={isSaved(listing.id) ? 'Видалити з збережених' : 'Додати до збережених'}
              >
                {isSaved(listing.id) ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
            )}
          </div>
          {listing.imageUrls && listing.imageUrls.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {listing.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${listing.title} ${index + 1}`}
                  className={`w-full h-20 object-cover rounded cursor-pointer ${
                    selectedImage === index ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>

          <div className="mt-4">
            <p className="text-4xl font-bold text-primary-600">
              {listing.price.toLocaleString('uk-UA')} ₴
            </p>
            {listing.isNegotiable && (
              <span className="text-sm text-gray-500">Торг можливий</span>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <span>Опубліковано {format(new Date(listing.createdAt), 'dd MMMM yyyy', { locale: uk })}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <EyeIcon className="h-5 w-5 mr-2" />
              <span>{listing.viewsCount} переглядів</span>
            </div>
          </div>

          {/* Seller Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900">Продавець</p>
            <p className="text-lg">{listing.sellerName}</p>
            {user?.id !== listing.userId ? (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleContact}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                  Написати продавцю
                </button>
                <button
                  onClick={handleOrder}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Замовити
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleContact}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                  Написати продавцю
                </button>
                <button
                  onClick={handleOrder}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Замовити
                </button>
              </div>
            ) : null}
          </div>

          {/* Additional Info */}
          <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Опис</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {listing.isbn && (
            <div className="mt-4">
              <span className="font-semibold">ISBN:</span> {listing.isbn}
            </div>
          )}
          {listing.author && (
            <div className="mt-2">
              <span className="font-semibold">Автор:</span> {listing.author}
            </div>
          )}
          {listing.courseCode && (
            <div className="mt-2">
              <span className="font-semibold">Курс:</span> {listing.courseCode}
            </div>
          )}
          {listing.condition && (
            <div className="mt-2">
              <span className="font-semibold">Стан:</span> {listing.condition}
            </div>
          )}
        </div>
      </div>

      {/* Similar Listings */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Схожі оголошення</h2>
        {/* Add similar listings component here */}
      </div>

      {/* Order Confirmation Modal */}
      <ConfirmModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onConfirm={confirmOrder}
        title="Підтвердити замовлення"
        message={`Ви впевнені, що хочете замовити "${listing?.title}"? Замовлення буде створено з наступними деталями:

• Місце зустрічі: ${listing?.location || 'Узгоджується'}
• Час зустрічі: Завтра о 18:00
• Ціна: ${listing?.price} ${listing?.currency}

Після підтвердження ви будете перенаправлені на сторінку замовлень.`}
        confirmText="Підтвердити замовлення"
        cancelText="Скасувати"
        variant="info"
      />

    </div>
  );
}