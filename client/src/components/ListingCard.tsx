import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Listing } from '../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useSavedItems } from '../context/SavedItemsContext';
import { useAuth } from '../context/AuthContext';

interface ListingCardProps {
  listing: Listing;
}

const categoryLabels: Record<number, string> = {
  0: 'Підручники',
  1: 'Навчальні матеріали',
  2: 'Електроніка',
  3: 'Меблі',
  4: 'Одяг',
  5: 'Аксесуари',
  6: 'Транспорт',
  7: 'Інше',
};

export default function ListingCard({ listing }: ListingCardProps) {
  const { isSaved, toggleSaved } = useSavedItems();
  const { isAuthenticated } = useAuth();

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('💖 Клік по сердечку для товару:', listing.id);
    await toggleSaved(listing.id);
  };

  return (
    <Link to={`/listings/${listing.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative">
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            {listing.imageUrls?.[0] ? (
              <img
                src={listing.imageUrls[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
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
                <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Немає зображення</span>
              </div>
            )}
          </div>
          {isAuthenticated && (
            <button
              onClick={handleToggleSave}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              title={isSaved(listing.id) ? 'Видалити з збережених' : 'Додати до збережених'}
            >
              {isSaved(listing.id) ? (
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
            {categoryLabels[listing.category] || 'Інше'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
            {listing.title || 'Без назви'}
          </h3>
          <div className="mt-2">
            <p className="text-2xl font-bold text-primary-600">
              {listing.price ? listing.price.toLocaleString('uk-UA') : '0'} ₴
            </p>
            {listing.isNegotiable && (
              <span className="text-sm text-gray-500">Торг можливий</span>
            )}
          </div>
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{listing.location || 'Місце не вказано'}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {listing.createdAt ? format(new Date(listing.createdAt), 'dd MMMM', { locale: uk }) : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}