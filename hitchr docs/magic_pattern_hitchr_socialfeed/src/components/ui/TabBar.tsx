import React from 'react';
import { Home, Compass, Map, User } from 'lucide-react';
import { motion } from 'framer-motion';
export type TabId = 'feed' | 'communities' | 'map' | 'profile';
interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}
export function TabBar({
  activeTab,
  onTabChange
}: TabBarProps) {
  const tabs = [{
    id: 'feed',
    icon: Home,
    label: 'Home'
  }, {
    id: 'communities',
    icon: Compass,
    label: 'Communities'
  }, {
    id: 'map',
    icon: Map,
    label: 'Map'
  }, {
    id: 'profile',
    icon: User,
    label: 'Profile'
  }] as const;
  return <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-8 z-40 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      {tabs.map(tab => {
      const isActive = activeTab === tab.id;
      const Icon = tab.icon;
      return <button key={tab.id} onClick={() => onTabChange(tab.id)} className="relative flex flex-col items-center justify-center w-16 h-12">
            {isActive && <motion.div layoutId="activeTab" className="absolute -top-3 w-12 h-1 bg-coral-500 rounded-b-full" transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }} />}
            <Icon className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-coral-500' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-coral-500' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>;
    })}
    </div>;
}