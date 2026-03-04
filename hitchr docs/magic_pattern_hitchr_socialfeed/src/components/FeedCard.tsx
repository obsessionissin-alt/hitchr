import React from 'react';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { MapPin, Clock, Heart, MessageCircle, Share2, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
export type FeedItemType = 'journey' | 'pre-trip' | 'route' | 'live';
interface FeedItem {
  id: string;
  type: FeedItemType;
  user: {
    name: string;
    avatar: string;
    badge?: 'trust' | 'verified';
  };
  content: {
    text: string;
    image?: string;
    route?: {
      from: string;
      to: string;
    };
    stats?: {
      distance?: string;
      time?: string;
    };
    participants?: number;
  };
  timestamp: string;
}
interface FeedCardProps {
  item: FeedItem;
  onHit: () => void;
  index?: number;
}
export function FeedCard({
  item,
  onHit,
  index = 0
}: FeedCardProps) {
  // Staggered heights for visual interest
  const isCompact = index % 3 === 1;
  if (item.type === 'live') {
    return <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: index * 0.05
    }}>
        <Card className="mb-4 border-l-4 border-l-coral-500 relative overflow-visible">
          {/* Route Line Across Card */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <motion.path d="M0,100 Q150,20 300,80" stroke={`url(#gradient-${item.id})`} strokeWidth="3" fill="none" initial={{
            pathLength: 0
          }} animate={{
            pathLength: 1
          }} transition={{
            duration: 1.5,
            ease: 'easeInOut'
          }} />
          </svg>

          {/* Origin Point with Avatar */}
          <div className="absolute left-4 bottom-4 z-10">
            <div className="relative">
              <Avatar src={item.user.avatar} alt={item.user.name} size="sm" badge={item.user.badge} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-coral-500 rounded-full border-2 border-white flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 pt-3 pb-16">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Badge type="live" text="Moving now" size="sm" className="mb-2" />
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {item.content.route?.to}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  from {item.content.route?.from}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-coral-500">
                  {item.content.participants}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                  people
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <Button variant="tertiary" size="sm" onClick={onHit} className="flex-1">
                <Zap className="w-4 h-4 mr-1.5" fill="currentColor" />
                Hit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Join
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>;
  }
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    delay: index * 0.05
  }}>
      <Card className={`mb-4 relative overflow-hidden ${isCompact ? 'pb-4' : ''}`}>
        {/* Route Visualization */}
        {item.content.route && <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <path d="M10,90 Q50,10 90,50" stroke="currentColor" strokeWidth="4" fill="none" className="text-trust-blue" />
              <circle cx="10" cy="90" r="4" fill="currentColor" className="text-coral-500" />
              <circle cx="90" cy="50" r="4" fill="currentColor" className="text-trust-blue" />
            </svg>
          </div>}

        {/* Journey Points with Avatars */}
        <div className="flex items-center gap-3 mb-3 relative z-10">
          <Avatar src={item.user.avatar} alt={item.user.name} size="md" badge={item.user.badge} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">
              {item.user.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{item.timestamp}</span>
              {item.content.stats?.distance && <>
                  <span>•</span>
                  <MapPin className="w-3 h-3" />
                  <span>{item.content.stats.distance}</span>
                </>}
            </div>
          </div>
        </div>

        {!isCompact && <>
            <p className="text-gray-800 text-sm mb-3 leading-relaxed relative z-10">
              {item.content.text}
            </p>

            {item.content.image && <div className="rounded-xl overflow-hidden mb-3 h-48 w-full relative z-10">
                <img src={item.content.image} alt="Journey" className="w-full h-full object-cover" />
              </div>}
          </>}

        {item.content.route && <div className="bg-gradient-to-r from-coral-50 to-blue-50 p-3 rounded-xl relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-coral-500 rounded-full" />
                <span className="text-sm font-medium text-gray-900">
                  {item.content.route.from}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {item.content.route.to}
                </span>
                <div className="w-2 h-2 bg-trust-blue rounded-full" />
              </div>
            </div>
            {item.content.stats?.time && <div className="text-xs text-gray-500 mt-1 text-center">
                {item.content.stats.time}
              </div>}
          </div>}

        {/* Integrated Actions */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50 relative z-10">
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-coral-500 transition-colors text-sm">
            <Heart className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-trust-blue transition-colors text-sm">
            <MessageCircle className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <Button variant="tertiary" size="sm" onClick={onHit} className="!h-8 !px-3">
            <Zap className="w-3.5 h-3.5 mr-1" fill="currentColor" />
            Hit
          </Button>
        </div>
      </Card>
    </motion.div>;
}