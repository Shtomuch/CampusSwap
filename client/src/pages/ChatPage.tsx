import React from 'react';

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-200px)]">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Чати</h2>
          {/* Chat list */}
          <div className="space-y-2">
            <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center">
                <img
                  src="https://ui-avatars.com/api/?name=John+Doe"
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-500">Останнє повідомлення...</p>
                </div>
                <span className="text-xs text-gray-400">10:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500">
            Виберіть чат для початку спілкування
          </div>
        </div>
      </div>
    </div>
  );
}