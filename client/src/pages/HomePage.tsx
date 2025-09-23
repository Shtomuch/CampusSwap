import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, BookOpenIcon, ComputerDesktopIcon, HomeIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { Listing, ListingCategory } from '../types';
import ListingCard from '../components/ListingCard';

const categories = [
  { id: ListingCategory.Textbooks, name: 'Підручники', icon: BookOpenIcon, color: 'bg-blue-500' },
  { id: ListingCategory.Electronics, name: 'Електроніка', icon: ComputerDesktopIcon, color: 'bg-purple-500' },
  { id: ListingCategory.Furniture, name: 'Меблі', icon: HomeIcon, color: 'bg-green-500' },
  { id: ListingCategory.Other, name: 'Інше', icon: ShoppingBagIcon, color: 'bg-gray-500' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ['listings', 'recent'],
    queryFn: async () => {
      const response = await api.get('/listings', {
        params: { pageSize: 8 },
      });
      return response.data;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg mb-8">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              CampusSwap 🎓
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-primary-100">
              Студентський маркетплейс для купівлі та продажу підручників і речей
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 text-lg placeholder-gray-500 bg-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Пошук підручників, електроніки, меблів..."
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
              </div>
              <button
                onClick={() => navigate(`/listings?search=${encodeURIComponent(searchTerm)}`)}
                className="absolute inset-y-0 right-0 px-6 text-white bg-primary-800 hover:bg-primary-900 rounded-r-lg"
              >
                Пошук
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Категорії</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/listings?category=${category.id}`}
              className="relative rounded-lg p-6 bg-white hover:shadow-lg transition-shadow group"
            >
              <div>
                <span className={`${category.color} rounded-lg inline-flex p-3 text-white`}>
                  <category.icon className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Listings */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Останні оголошення</h2>
          <Link
            to="/listings"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Всі оголошення →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
                <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Чому CampusSwap?
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                💰
              </span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Економія грошей</h3>
            <p className="mt-2 text-gray-600">
              Купуйте вживані підручники та речі за доступними цінами
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                🎓
              </span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Студентська спільнота</h3>
            <p className="mt-2 text-gray-600">
              Торгуйте з перевіреними студентами вашого університету
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                ♻️
              </span>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Екологічність</h3>
            <p className="mt-2 text-gray-600">
              Дайте друге життя речам замість викидання
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}