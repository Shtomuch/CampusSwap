import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PhotoIcon, XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
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

interface ValidationError {
  field: string;
  message: string;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListingForm>();

  const category = watch('category');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Валідація файлів
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      // Перевірка типу файлу
      if (!file.type.startsWith('image/')) {
        errors.push(`Файл "${file.name}" не є зображенням`);
        return;
      }
      
      // Перевірка розміру файлу (5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`Файл "${file.name}" занадто великий (максимум 5MB)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Показати помилки валідації
    if (errors.length > 0) {
      setGeneralError(errors.join('; '));
      return;
    }
    
    const newImages = [...images, ...validFiles].slice(0, 10);
    setImages(newImages);

    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    
    // Очистити попередні помилки
    setGeneralError('');
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (data: ListingForm) => {
    // Очистити попередні помилки
    setValidationErrors([]);
    setGeneralError('');
    setShowSuccess(false);

    try {
      console.log('🚀 [CreateListing] Початок створення оголошення');
      console.log('📋 [CreateListing] Дані форми:', data);
      console.log('🖼️ [CreateListing] Кількість зображень:', images.length);
      
      setIsSubmitting(true);

      // Upload images first
      const imageUrls: string[] = [];
      if (images.length > 0) {
        console.log('📤 [CreateListing] Початок завантаження зображень...');
        setUploadProgress({ current: 0, total: images.length });
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`📤 [CreateListing] Завантаження зображення ${i + 1}/${images.length}:`, image.name, `(${Math.round(image.size / 1024)}KB)`);
          
          try {
            const formData = new FormData();
            formData.append('file', image);
            const response = await api.post('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            imageUrls.push(response.data.url);
            console.log(`✅ [CreateListing] Зображення ${i + 1} завантажено:`, response.data.url);
            
            setUploadProgress({ current: i + 1, total: images.length });
          } catch (uploadError: any) {
            console.error(`❌ [CreateListing] Помилка завантаження зображення ${i + 1}:`, uploadError);
            
            if (uploadError.response?.status === 400) {
              const errorMessage = uploadError.response.data?.message || 'Помилка завантаження зображення';
              setGeneralError(`Помилка завантаження зображення "${image.name}": ${errorMessage}`);
            } else {
              setGeneralError(`Не вдалося завантажити зображення "${image.name}". Спробуйте ще раз.`);
            }
            
            setUploadProgress(null);
            setIsSubmitting(false);
            return;
          }
        }
        
        setUploadProgress(null);
      } else {
        console.log('⚠️ [CreateListing] Попередження: немає зображень для завантаження');
        setGeneralError('Необхідно додати хоча б одне зображення');
        setIsSubmitting(false);
        return;
      }

      // Prepare listing data - очистити та валідувати дані
      const listingData: any = {
        title: data.title?.trim() || '',
        description: data.description?.trim() || '',
        price: data.price ? Number(data.price) : 0,
        category: data.category ? Number(data.category) : 0,
        condition: data.condition?.trim() || '',
        location: data.location?.trim() || '',
        isNegotiable: Boolean(data.isNegotiable),
        imageUrls,
        // Додаткові поля тільки якщо вони заповнені
        ...(data.isbn?.trim() && { isbn: data.isbn.trim() }),
        ...(data.author?.trim() && { author: data.author.trim() }),
        ...(data.courseCode?.trim() && { courseCode: data.courseCode.trim() }),
        ...(data.publicationYear && { publicationYear: Number(data.publicationYear) }),
      };

      // Видалити пусті поля
      Object.keys(listingData).forEach(key => {
        const typedKey = key as keyof typeof listingData;
        if (listingData[typedKey] === '' || listingData[typedKey] === null || listingData[typedKey] === undefined) {
          delete (listingData as any)[key];
        }
      });

      console.log('📝 [CreateListing] Дані для створення оголошення:', listingData);

      // Create listing
      const response = await api.post('/listings', listingData);
      console.log('✅ [CreateListing] Оголошення успішно створено:', response.data);

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error: any) {
      console.error('❌ [CreateListing] Помилка при створенні оголошення:', error);
      
      
      if (error.response) {
        console.error('📊 [CreateListing] Статус відповіді:', error.response.status);
        console.error('📊 [CreateListing] Дані відповіді:', error.response.data);
        console.error('📊 [CreateListing] Заголовки відповіді:', error.response.headers);
        
        const apiError: ApiError = error.response.data;
        
        if (error.response.status === 400 && apiError.errors) {
          // Обробка помилок валідації
          const errors: ValidationError[] = [];
          
          Object.entries(apiError.errors).forEach(([field, messages]) => {
            messages.forEach(message => {
              errors.push({ field, message });
              console.error(`🔍 [CreateListing] Помилка валідації для поля "${field}":`, message);
            });
          });
          
          setValidationErrors(errors);
          console.log('📋 [CreateListing] Встановлено помилки валідації:', errors);
        } else {
          // Загальна помилка
          const errorMessage = apiError.message || 'Не вдалося створити оголошення';
          setGeneralError(errorMessage);
          console.error('⚠️ [CreateListing] Загальна помилка:', errorMessage);
        }
      } else if (error.request) {
        console.error('🌐 [CreateListing] Помилка мережі:', error.request);
        setGeneralError('Помилка мережі. Перевірте підключення до інтернету.');
      } else {
        console.error('⚙️ [CreateListing] Неочікувана помилка:', error.message);
        setGeneralError('Сталася неочікувана помилка. Спробуйте ще раз.');
      }
    } finally {
      setIsSubmitting(false);
      console.log('🏁 [CreateListing] Завершено обробку форми');
    }
  };

  // Функція для отримання української назви поля
  const getFieldDisplayName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      'title': 'Назва',
      'description': 'Опис',
      'price': 'Ціна',
      'category': 'Категорія',
      'condition': 'Стан',
      'location': 'Місце зустрічі',
      'isbn': 'ISBN',
      'author': 'Автор',
      'courseCode': 'Код курсу',
      'publicationYear': 'Рік видання',
      'imageUrls': 'Зображення'
    };
    return fieldNames[field] || field;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Створити оголошення</h1>

      {/* Повідомлення про успіх */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Оголошення успішно створено!</h3>
            <p className="text-sm text-green-700 mt-1">Ви будете перенаправлені на сторінку профілю...</p>
          </div>
        </div>
      )}

      {/* Прогрес завантаження зображень */}
      {uploadProgress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">Завантаження зображень</h3>
              <p className="text-sm text-blue-700 mt-1">
                {uploadProgress.current} з {uploadProgress.total} зображень завантажено
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Загальна помилка */}
      {generalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Помилка</h3>
              <p className="text-sm text-red-700 mt-1">{generalError}</p>
            </div>
            <button
              type="button"
              onClick={() => setGeneralError('')}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Помилки валідації */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Помилки валідації</h3>
              <p className="text-sm text-red-700 mt-1 mb-3">
                Будь ласка, виправте наступні помилки:
              </p>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    <span className="font-medium">{getFieldDisplayName(error.field)}:</span> {error.message}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="ml-3 text-red-400 hover:text-red-600"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

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
            {...register('title', { 
              required: 'Назва обов\'язкова',
              minLength: { value: 3, message: 'Назва має бути не менше 3 символів' },
              maxLength: { value: 200, message: 'Назва не може перевищувати 200 символів' }
            })}
            id="title"
            type="text"
            maxLength={200}
            placeholder="Введіть назву оголошення"
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
            id="category"
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
            {...register('description', { 
              required: 'Опис обов\'язковий',
              minLength: { value: 10, message: 'Опис має бути не менше 10 символів' },
              maxLength: { value: 2000, message: 'Опис не може перевищувати 2000 символів' }
            })}
            id="description"
            rows={4}
            maxLength={2000}
            placeholder="Опишіть детально ваш товар..."
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
                  {...register('isbn', {
                    maxLength: { value: 20, message: 'ISBN не може перевищувати 20 символів' },
                    pattern: { 
                      value: /^[\d\-X]*$/, 
                      message: 'ISBN може містити тільки цифри, дефіси та X' 
                    }
                  })}
                  id="isbn"
                  type="text"
                  maxLength={20}
                  placeholder="978-0-123456-78-9"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.isbn && (
                  <p className="mt-1 text-sm text-red-600">{errors.isbn.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  Автор
                </label>
                <input
                  {...register('author', {
                    maxLength: { value: 100, message: 'Ім\'я автора не може перевищувати 100 символів' }
                  })}
                  id="author"
                  type="text"
                  maxLength={100}
                  placeholder="Іван Петренко"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.author && (
                  <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                  Код курсу
                </label>
                <input
                  {...register('courseCode', {
                    maxLength: { value: 20, message: 'Код курсу не може перевищувати 20 символів' }
                  })}
                  id="courseCode"
                  type="text"
                  maxLength={20}
                  placeholder="CS101"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.courseCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.courseCode.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700">
                  Рік видання
                </label>
                <input
                  {...register('publicationYear', {
                    min: { value: 1900, message: 'Рік має бути не менше 1900' },
                    max: { value: new Date().getFullYear(), message: `Рік має бути не більше ${new Date().getFullYear()}` }
                  })}
                  id="publicationYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="2023"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.publicationYear && (
                  <p className="mt-1 text-sm text-red-600">{errors.publicationYear.message}</p>
                )}
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
            id="condition"
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
                min: { value: 1, message: 'Ціна має бути більше 0' },
                max: { value: 999999, message: 'Ціна занадто велика' }
              })}
              id="price"
              type="number"
              min="1"
              max="999999"
              step="1"
              placeholder="100"
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
              {...register('location', { 
                required: 'Місце обов\'язкове',
                minLength: { value: 3, message: 'Місце має бути не менше 3 символів' },
                maxLength: { value: 200, message: 'Місце не може перевищувати 200 символів' }
              })}
              id="location"
              type="text"
              maxLength={200}
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
            id="isNegotiable"
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
            disabled={isSubmitting || images.length === 0}
            className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {uploadProgress ? `Завантаження... ${uploadProgress.current}/${uploadProgress.total}` : 'Створення...'}
              </div>
            ) : (
              'Створити оголошення'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  );
}