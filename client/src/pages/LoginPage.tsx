import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      console.log('🚀 Login form submitted with:', { email: data.email });
      await login(data.email, data.password);
      console.log('✅ Login successful, navigating to home page');
      navigate('/');
    } catch (err: any) {
      console.error('❌ Login form error:', err);
      const msg = err.userMessage || err.message || err.response?.data?.message;
      setError(msg || 'Помилка входу. Перевірте дані.');
      // Не очищаємо форму при помилці, щоб користувач не втратив введені дані
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вхід до акаунту
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Або{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              створіть новий акаунт
            </Link>
          </p>
          
          {/* Інформаційний блок з тестовими даними */}
          <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  🧪 Тестові дані для входу
                </h3>
                <div className="mt-1 text-xs text-blue-700">
                  <p><strong>Email:</strong> <code className="bg-blue-100 px-1 rounded">test@test.com</code></p>
                  <p><strong>Пароль:</strong> <code className="bg-blue-100 px-1 rounded">testpassword123</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} role="form">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email адреса
              </label>
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
                aria-label="Email адреса"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email адреса"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                {...register('password', {
                  required: 'Пароль обов\'язковий',
                  minLength: {
                    value: 6,
                    message: 'Пароль повинен містити мінімум 6 символів',
                  },
                })}
                id="password"
                type="password"
                autoComplete="current-password"
                aria-label="Пароль"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Запам'ятати мене
              </label>
            </div>

            <div className="text-sm">
              <button type="button" className="font-medium text-primary-600 hover:text-primary-500" onClick={() => navigate('/reset-password')}>
                Забули пароль?
              </button>
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
                  Вхід до системи...
                </div>
              ) : (
                'Увійти'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">або</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Продовжити як гість
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Не маєте акаунту?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Зареєструватися
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}