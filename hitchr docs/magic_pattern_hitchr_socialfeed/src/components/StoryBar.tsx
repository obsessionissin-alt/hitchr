import React from 'react';
import { Avatar } from './ui/Avatar';
import { Plus } from 'lucide-react';
interface Story {
  id: string;
  name: string;
  avatar: string;
  isLive?: boolean;
  hasUnseen?: boolean;
}
const MOCK_STORIES: Story[] = [{
  id: '1',
  name: 'Sarah',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  isLive: true
}, {
  id: '2',
  name: 'Hikers',
  avatar: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=150',
  hasUnseen: true
}, {
  id: '3',
  name: 'Alex',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
  hasUnseen: true
}, {
  id: '4',
  name: 'Goa Trip',
  avatar: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150'
}, {
  id: '5',
  name: 'Elena',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
}];
interface StoryBarProps {
  onStoryClick: (id: string) => void;
}
export function StoryBar({
  onStoryClick
}: StoryBarProps) {
  return <div className="w-full overflow-x-auto no-scrollbar py-4 pl-4">
      <div className="flex gap-4">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 min-w-[64px]">
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-gray-500">Add</span>
        </div>

        {MOCK_STORIES.map(story => <button key={story.id} onClick={() => onStoryClick(story.id)} className="flex flex-col items-center gap-1 min-w-[64px] focus:outline-none">
            <div className={`
              p-[2px] rounded-full
              ${story.isLive ? 'bg-gradient-to-tr from-coral-500 to-orange-400 animate-pulse-slow' : story.hasUnseen ? 'bg-gradient-to-tr from-trust-blue to-cyan-400' : 'bg-gray-200'}
            `}>
              <div className="border-2 border-white rounded-full">
                <Avatar src={story.avatar} alt={story.name} size="lg" className="w-[60px] h-[60px]" // Custom override for story size
            />
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate w-full text-center">
              {story.name}
            </span>
            {story.isLive && <span className="absolute mt-12 bg-coral-500 text-white text-[9px] font-bold px-1.5 rounded-sm border border-white">
                LIVE
              </span>}
          </button>)}
      </div>
    </div>;
}