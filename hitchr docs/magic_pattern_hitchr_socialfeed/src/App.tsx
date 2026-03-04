import React, { useState } from 'react';
import { TabBar, TabId } from './components/ui/TabBar';
import { FeedHome } from './pages/FeedHome';
import { CommunitiesHub } from './pages/CommunitiesHub';
import { Profile } from './pages/Profile';
import { SafetyCheckIn } from './components/SafetyCheckIn';
export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const renderScreen = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedHome />;
      case 'communities':
        return <CommunitiesHub />;
      case 'profile':
        return <Profile />;
      case 'map':
        return <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-400">
            Map View Placeholder
          </div>;
      default:
        return <FeedHome />;
    }
  };
  return <div className="max-w-md mx-auto bg-white min-h-screen relative shadow-2xl overflow-hidden">
      {renderScreen()}

      {/* Global Safety Check-in (Simulated trigger for demo) */}
      {activeTab === 'feed' && <SafetyCheckIn />}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>;
}