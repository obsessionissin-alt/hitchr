import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Avatar } from './Avatar';
interface HeaderProps {
  onSearch?: () => void;
  onNotifications?: () => void;
}
export function Header({
  onSearch,
  onNotifications
}: HeaderProps) {
  return <header className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">
          Hitchr
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onSearch} className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-600 hover:text-coral-500 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button onClick={onNotifications} className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-600 hover:text-coral-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-coral-500 rounded-full border border-white" />
        </button>
      </div>
    </header>;
}