import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ResetPasswordForm {
  email: string;
}

export default function ResetPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordForm>();

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Тут буде API запит для відновлення паролю
      // Поки що симулюємо успішний запит
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Password reset request for:', data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Сталася помилка при відправці запиту');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Лист надіслано!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ми надіслали інструкції для відновлення паролю на адресу{' '}
              <span className="font-medium text-primary-600">
                {getValues('email')}
              </span>
            </p>
            <p className="mt-4 text-center text-sm text-gray-500">
              Не бачите листа? Перевірте папку "Спам" або спробуйте ще раз через кілька хвилин.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Надіслати ще раз
            </button>
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Повернутися до входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Повернутися до входу
          </Link>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
              <EnvelopeIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Відновлення паролю
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Введіть вашу email адресу і ми надішлемо вам інструкції для відновлення паролю
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Помилка</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email адреса
            </label>
            <div className="mt-1">
              <input
                {...register('email', {
                  required: 'Email обов\'язковий',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Введіть коректний email',
                  },
                })}
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Введіть ваш email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Надсилаємо...
                </div>
              ) : (
                'Надіслати інструкції'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Пам'ятаєте пароль?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Увійти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
