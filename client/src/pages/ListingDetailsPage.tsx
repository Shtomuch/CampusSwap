import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HeartIcon, ChatBubbleLeftIcon, MapPinIcon, CalendarIcon, EyeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import { Listing } from '../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);

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
    // Create order logic
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
            <img
              src={listing.imageUrls?.[selectedImage] || 'https://via.placeholder.com/600x400?text=No+Image'}
              alt={listing.title}
              className="w-full h-96 object-cover rounded-lg"
            />
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              {isSaved ? (
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
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
            {user?.id !== listing.userId && (
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
            )}
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
    </div>
  );
}