import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  studentId: string;
  university: string;
  faculty: string;
  yearOfStudy: number;
}

const universities = [
  'КНУ імені Тараса Шевченка',
  'КПІ імені Ігоря Сікорського',
  'НаУКМА',
  'НМУ імені О.О. Богомольця',
  'НАУ',
  'КНЕУ',
  'Інший',
];

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      const { confirmPassword, ...registerData } = data;
      await registerUser({
        ...registerData,
        yearOfStudy: Number(registerData.yearOfStudy),
      });
      navigate('/');
    } catch (err: any) {
      const msg = err.userMessage || err.response?.data?.message;
      setError(msg || 'Помилка реєстрації. Спробуйте ще раз.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Реєстрація нового акаунту
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Або{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              увійдіть в існуючий
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} role="form">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Ім'я
              </label>
              <input
                {...register('firstName', { required: 'Ім\'я обов\'язкове' })}
                id="firstName"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Прізвище
              </label>
              <input
                {...register('lastName', { required: 'Прізвище обов\'язкове' })}
                id="lastName"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              {...register('email', {
                required: 'Email обов\'язковий',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Невірний формат email',
                },
              })}
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Номер телефону
            </label>
            <input
              {...register('phoneNumber', { required: 'Номер телефону обов\'язковий' })}
              id="phoneNumber"
              type="tel"
              placeholder="+380501234567"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                {...register('password', {
                  required: 'Пароль обов\'язковий',
                  minLength: {
                    value: 8,
                    message: 'Мінімум 8 символів',
                  },
                })}
                id="password"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Підтвердіть пароль
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Підтвердіть пароль',
                  validate: value => value === password || 'Паролі не співпадають',
                })}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
              Студентський квиток
            </label>
            <input
              {...register('studentId', { required: 'Номер студентського обов\'язковий' })}
              id="studentId"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.studentId && (
              <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-700">
              Університет
            </label>
            <select
              {...register('university', { required: 'Виберіть університет' })}
              id="university"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Виберіть університет</option>
              {universities.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
            {errors.university && (
              <p className="mt-1 text-sm text-red-600">{errors.university.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                Факультет
              </label>
              <input
                {...register('faculty', { required: 'Факультет обов\'язковий' })}
                id="faculty"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.faculty && (
                <p className="mt-1 text-sm text-red-600">{errors.faculty.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700">
                Курс
              </label>
              <select
                {...register('yearOfStudy', { required: 'Виберіть курс' })}
                id="yearOfStudy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Виберіть курс</option>
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    {year} курс
                  </option>
                ))}
              </select>
              {errors.yearOfStudy && (
                <p className="mt-1 text-sm text-red-600">{errors.yearOfStudy.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Реєстрація...' : 'Зареєструватися'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}