import React, { useState, Children } from 'react';
import { Header } from '../components/ui/Header';
import { LiveMapPreview } from '../components/LiveMapPreview';
import { MovementRibbon } from '../components/MovementRibbon';
import { FeedCard, FeedItemType } from '../components/FeedCard';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { JourneyComposer } from '../components/JourneyComposer';
import { MessageSquare, Users, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
const FEED_ITEMS = [{
  id: '1',
  type: 'live' as FeedItemType,
  user: {
    name: 'Campus Hikers',
    avatar: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=150',
    badge: 'verified' as const
  },
  content: {
    text: 'Heading to North Ridge for sunset.',
    route: {
      from: 'Campus Gate',
      to: 'North Ridge'
    },
    participants: 12
  },
  timestamp: 'Now'
}, {
  id: '2',
  type: 'journey' as FeedItemType,
  user: {
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    badge: 'trust' as const
  },
  content: {
    text: 'The morning mist in Spiti Valley is something else entirely. No signal for 3 days was the best part.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    route: {
      from: 'Kaza',
      to: 'Langza'
    },
    stats: {
      distance: '14km',
      time: '4h 20m'
    }
  },
  timestamp: '2h ago'
}, {
  id: '3',
  type: 'pre-trip' as FeedItemType,
  user: {
    name: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150'
  },
  content: {
    text: 'Planning a weekend ride to the coast next month. Looking for 2-3 more people who enjoy slow travel and photography stops.',
    route: {
      from: 'City Center',
      to: 'Pacific Coast'
    },
    stats: {
      distance: '180km'
    }
  },
  timestamp: '5h ago'
}, {
  id: '4',
  type: 'journey' as FeedItemType,
  user: {
    name: 'Maya Patel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    badge: 'trust' as const
  },
  content: {
    text: 'Quick morning loop before work. Best way to start the day.',
    route: {
      from: 'Home',
      to: 'Office'
    },
    stats: {
      distance: '8km',
      time: '25m'
    }
  },
  timestamp: '8h ago'
}];
export function FeedHome() {
  const [isHitModalOpen, setIsHitModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    avatar: string;
  } | null>(null);
  const handleHit = (user: {
    name: string;
    avatar: string;
  }) => {
    setSelectedUser(user);
    setIsHitModalOpen(true);
  };
  const handleDestinationClick = (id: string) => {
    console.log('Filter by destination:', id);
  };
  return <div className="pb-24 min-h-screen bg-gray-50">
      <Header />

      {/* Live Map Preview - Collapsible */}
      <LiveMapPreview />

      {/* Movement Ribbon - Destination-focused */}
      <MovementRibbon onDestinationClick={handleDestinationClick} />

      {/* Journey Feed - Staggered Cards */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900">Recent Journeys</h2>
          <button className="text-sm font-medium text-coral-500">Filter</button>
        </div>

        <motion.div initial="hidden" animate="visible" variants={{
        visible: {
          transition: {
            staggerChildren: 0.05
          }
        }
      }}>
          {FEED_ITEMS.map((item, index) => <FeedCard key={item.id} item={item} onHit={() => handleHit(item.user)} index={index} />)}
        </motion.div>
      </div>

      {/* Floating Action Button - Journey Creation */}
      <FloatingActionButton onClick={() => setIsComposerOpen(true)} />

      {/* Journey Composer Modal */}
      <JourneyComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />

      {/* Hit Connection Modal */}
      <BottomSheet isOpen={isHitModalOpen} onClose={() => setIsHitModalOpen(false)} title={`Connect with ${selectedUser?.name.split(' ')[0]}?`}>
        <div className="flex flex-col items-center mb-8">
          <Avatar src={selectedUser?.avatar || ''} alt={selectedUser?.name || ''} size="xl" className="mb-4" />
          <p className="text-center text-gray-600 px-8">
            Hitchr is about meaningful connections. How would you like to
            interact?
          </p>
        </div>

        <div className="space-y-3">
          <Button fullWidth variant="primary" className="justify-start pl-4" onClick={() => setIsHitModalOpen(false)}>
            <MessageSquare className="w-5 h-5 mr-3" />
            Send a message
          </Button>
          <Button fullWidth variant="secondary" className="justify-start pl-4" onClick={() => setIsHitModalOpen(false)}>
            <Users className="w-5 h-5 mr-3" />
            Travel together next time
          </Button>
          <Button fullWidth variant="ghost" className="justify-start pl-4" onClick={() => setIsHitModalOpen(false)}>
            <Zap className="w-5 h-5 mr-3" />
            Just appreciate this journey
          </Button>
        </div>
      </BottomSheet>
    </div>;
}