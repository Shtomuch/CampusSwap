import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { ListingCategory } from '../types';

interface ListingForm {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: string;
  isbn?: string;
  courseCode?: string;
  author?: string;
  publicationYear?: number;
  location: string;
  isNegotiable: boolean;
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListingForm>();

  const category = watch('category');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);

    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (data: ListingForm) => {
    try {
      setIsSubmitting(true);

      // Upload images first
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls.push(response.data.url);
      }

      // Create listing
      await api.post('/listings', {
        ...data,
        imageUrls,
        price: Number(data.price),
        category: Number(data.category),
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error creating listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Створити оголошення</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фото (до 10 штук)
          </label>
          <div className="grid grid-cols-5 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt="" className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {images.length < 10 && (
              <label className="flex items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Назва *
          </label>
          <input
            {...register('title', { required: 'Назва обов\'язкова' })}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Категорія *
          </label>
          <select
            {...register('category', { required: 'Виберіть категорію' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Виберіть категорію</option>
            <option value="0">Підручники</option>
            <option value="1">Навчальні матеріали</option>
            <option value="2">Електроніка</option>
            <option value="3">Меблі</option>
            <option value="4">Одяг</option>
            <option value="5">Аксесуари</option>
            <option value="6">Транспорт</option>
            <option value="7">Інше</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Опис *
          </label>
          <textarea
            {...register('description', { required: 'Опис обов\'язковий' })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Additional fields for textbooks */}
        {Number(category) === ListingCategory.Textbooks && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
                  ISBN
                </label>
                <input
                  {...register('isbn')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  Автор
                </label>
                <input
                  {...register('author')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                  Код курсу
                </label>
                <input
                  {...register('courseCode')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700">
                  Рік видання
                </label>
                <input
                  {...register('publicationYear')}
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Condition */}
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
            Стан *
          </label>
          <select
            {...register('condition', { required: 'Виберіть стан' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Виберіть стан</option>
            <option value="Новий">Новий</option>
            <option value="Як новий">Як новий</option>
            <option value="Добрий">Добрий</option>
            <option value="Задовільний">Задовільний</option>
          </select>
          {errors.condition && (
            <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
          )}
        </div>

        {/* Price and Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Ціна (₴) *
            </label>
            <input
              {...register('price', {
                required: 'Ціна обов\'язкова',
                min: { value: 1, message: 'Ціна має бути більше 0' }
              })}
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Місце зустрічі *
            </label>
            <input
              {...register('location', { required: 'Місце обов\'язкове' })}
              type="text"
              placeholder="Наприклад: Метро КПІ"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* Negotiable */}
        <div className="flex items-center">
          <input
            {...register('isNegotiable')}
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isNegotiable" className="ml-2 block text-sm text-gray-900">
            Торг можливий
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Створення...' : 'Створити оголошення'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}