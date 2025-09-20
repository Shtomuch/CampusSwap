import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Listing } from '../types';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

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
  const [isSaved, setIsSaved] = React.useState(false);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

  return (
    <Link to={`/listings/${listing.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative">
          <img
            src={listing.imageUrls?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={listing.title}
            className="w-full h-48 object-cover"
          />
          <button
            onClick={toggleSave}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            {isSaved ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
          <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded">
            {categoryLabels[listing.category]}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
            {listing.title}
          </h3>
          <div className="mt-2">
            <p className="text-2xl font-bold text-primary-600">
              {listing.price.toLocaleString('uk-UA')} ₴
            </p>
            {listing.isNegotiable && (
              <span className="text-sm text-gray-500">Торг можливий</span>
            )}
          </div>
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{listing.location}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            {format(new Date(listing.createdAt), 'dd MMMM', { locale: uk })}
          </div>
        </div>
      </div>
    </Link>
  );
}