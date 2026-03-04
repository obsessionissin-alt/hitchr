import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MapPin, Users } from 'lucide-react';
interface Destination {
  id: string;
  name: string;
  count: number;
  color: string;
  trend: 'up' | 'steady';
  distance: string;
}
const DESTINATIONS: Destination[] = [{
  id: '1',
  name: 'North Ridge',
  count: 12,
  color: '#FF6B6B',
  trend: 'up',
  distance: '8km'
}, {
  id: '2',
  name: 'Beach',
  count: 8,
  color: '#4A90E2',
  trend: 'steady',
  distance: '15km'
}, {
  id: '3',
  name: 'Downtown',
  count: 15,
  color: '#52C41A',
  trend: 'up',
  distance: '3km'
}, {
  id: '4',
  name: 'Campus Loop',
  count: 6,
  color: '#FFA940',
  trend: 'steady',
  distance: '5km'
}, {
  id: '5',
  name: 'Mountain Trail',
  count: 4,
  color: '#9C27B0',
  trend: 'up',
  distance: '22km'
}];
interface MovementRibbonProps {
  onDestinationClick: (id: string) => void;
}
export function MovementRibbon({
  onDestinationClick
}: MovementRibbonProps) {
  return <div className="w-full bg-white border-b border-gray-100 py-4">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">
          Where People Are Going
        </h3>
        <span className="text-xs text-gray-500">Right now</span>
      </div>

      <div className="overflow-x-auto no-scrollbar pl-4">
        <div className="flex gap-3 pb-2">
          {DESTINATIONS.map((dest, index) => <motion.button key={dest.id} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: index * 0.05
        }} onClick={() => onDestinationClick(dest.id)} className="relative flex-shrink-0 w-32 h-28 rounded-2xl overflow-hidden shadow-soft hover:shadow-float transition-shadow" style={{
          backgroundColor: `${dest.color}15`
        }}>
              {/* Direction Indicator */}
              <div className="absolute top-2 right-2">
                <motion.div animate={{
              y: [0, -3, 0]
            }} transition={{
              duration: 1.5,
              repeat: Infinity
            }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{
              backgroundColor: dest.color
            }}>
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" style={{
                color: dest.color
              }} />
                  <span className="text-xs font-medium text-gray-600">
                    {dest.distance}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">
                  {dest.name}
                </h4>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {dest.count} going
                  </span>
                </div>
              </div>

              {/* Animated Route Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <motion.path d="M10,90 Q40,20 120,40" stroke={dest.color} strokeWidth="2" fill="none" strokeDasharray="4 2" initial={{
              pathLength: 0,
              opacity: 0
            }} animate={{
              pathLength: 1,
              opacity: 0.4
            }} transition={{
              duration: 1,
              delay: index * 0.1
            }} />
              </svg>
            </motion.button>)}
        </div>
      </div>
    </div>;
}