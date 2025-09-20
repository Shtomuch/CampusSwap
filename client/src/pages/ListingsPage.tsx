import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { Listing, ListingCategory } from '../types';
import ListingCard from '../components/ListingCard';

const categoryOptions = [
  { value: '', label: 'Всі категорії' },
  { value: '0', label: 'Підручники' },
  { value: '1', label: 'Навчальні матеріали' },
  { value: '2', label: 'Електроніка' },
  { value: '3', label: 'Меблі' },
  { value: '4', label: 'Одяг' },
  { value: '5', label: 'Аксесуари' },
  { value: '6', label: 'Транспорт' },
  { value: '7', label: 'Інше' },
];

const sortOptions = [
  { value: 'newest', label: 'Найновіші' },
  { value: 'price_asc', label: 'Ціна: за зростанням' },
  { value: 'price_desc', label: 'Ціна: за спаданням' },
];

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  });

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ['listings', searchTerm, category, sort, priceRange],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.searchTerm = searchTerm;
      if (category) params.category = category;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      const response = await api.get('/listings', { params });
      let data = response.data;

      // Client-side sorting
      if (sort === 'price_asc') {
        data = [...data].sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        data = [...data].sort((a, b) => b.price - a.price);
      }

      return data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    setSearchParams(params);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Всі оголошення</h1>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Пошук оголошень..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Пошук
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Мін. ціна"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Макс. ціна"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <span>₴</span>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
              <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <>
          <p className="text-gray-600 mb-4">
            Знайдено {listings.length} оголошень
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Оголошень не знайдено</p>
        </div>
      )}
    </div>
  );
}