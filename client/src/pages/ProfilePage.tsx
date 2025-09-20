import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Tab } from '@headlessui/react';
import { UserCircleIcon, ClipboardDocumentListIcon, HeartIcon, CogIcon } from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfilePage() {
  const { user } = useAuth();

  const tabs = [
    { name: 'Мої оголошення', icon: ClipboardDocumentListIcon },
    { name: 'Збережені', icon: HeartIcon },
    { name: 'Налаштування', icon: CogIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-6">
          <img
            className="h-24 w-24 rounded-full"
            src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&size=96`}
            alt=""
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>{user?.university}</span>
              <span>•</span>
              <span>{user?.faculty}</span>
              <span>•</span>
              <span>{user?.yearOfStudy} курс</span>
            </div>
            <div className="mt-2">
              <span className="text-yellow-400">★★★★★</span>
              <span className="ml-2 text-sm text-gray-600">{user?.rating} ({user?.reviewsCount} відгуків)</span>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Редагувати профіль
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
                )
              }
            >
              <div className="flex items-center justify-center">
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center py-12 text-gray-500">
                У вас поки немає оголошень
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="text-center py-12 text-gray-500">
              У вас поки немає збережених оголошень
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Налаштування профілю</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ім'я</label>
                    <input
                      type="text"
                      defaultValue={user?.firstName}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Прізвище</label>
                    <input
                      type="text"
                      defaultValue={user?.lastName}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Телефон</label>
                  <input
                    type="tel"
                    defaultValue={user?.phoneNumber}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Зберегти зміни
                </button>
              </form>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}