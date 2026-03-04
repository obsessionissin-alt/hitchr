import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Navigation } from 'lucide-react';
interface ActiveMovement {
  id: string;
  destination: string;
  count: number;
  color: string;
  position: {
    x: number;
    y: number;
  };
}
const ACTIVE_MOVEMENTS: ActiveMovement[] = [{
  id: '1',
  destination: 'North Ridge',
  count: 12,
  color: '#FF6B6B',
  position: {
    x: 65,
    y: 25
  }
}, {
  id: '2',
  destination: 'Beach',
  count: 8,
  color: '#4A90E2',
  position: {
    x: 30,
    y: 60
  }
}, {
  id: '3',
  destination: 'Downtown',
  count: 15,
  color: '#52C41A',
  position: {
    x: 50,
    y: 50
  }
}, {
  id: '4',
  destination: 'Campus',
  count: 6,
  color: '#FFA940',
  position: {
    x: 75,
    y: 70
  }
}];
export function LiveMapPreview() {
  const [isExpanded, setIsExpanded] = useState(false);
  return <motion.div initial={false} animate={{
    height: isExpanded ? 320 : 140
  }} className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 overflow-hidden">
      {/* Map Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="text-trust-blue">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Active Movements */}
      <div className="relative h-full">
        {ACTIVE_MOVEMENTS.map((movement, index) => <motion.div key={movement.id} initial={{
        scale: 0,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        delay: index * 0.1,
        type: 'spring'
      }} className="absolute" style={{
        left: `${movement.position.x}%`,
        top: `${movement.position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}>
            {/* Pulsing Ring */}
            <motion.div animate={{
          scale: [1, 1.5, 1],
          opacity: [0.6, 0, 0.6]
        }} transition={{
          duration: 2,
          repeat: Infinity
        }} className="absolute inset-0 rounded-full" style={{
          backgroundColor: movement.color
        }} />

            {/* Movement Dot */}
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{
          backgroundColor: movement.color
        }}>
              {movement.count}
            </div>

            {/* Destination Label (only when expanded) */}
            <AnimatePresence>
              {isExpanded && <motion.div initial={{
            opacity: 0,
            y: -5
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -5
          }} className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-soft text-xs font-medium text-gray-700">
                  {movement.destination}
                </motion.div>}
            </AnimatePresence>
          </motion.div>)}

        {/* Current Location Indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-3 h-3 bg-gray-900 rounded-full border-2 border-white shadow-lg" />
          <motion.div animate={{
          scale: [1, 1.3, 1]
        }} transition={{
          duration: 1.5,
          repeat: Infinity
        }} className="absolute inset-0 bg-gray-900 rounded-full opacity-20" />
        </div>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Live Movement</h3>
          <p className="text-xs text-gray-600">
            {ACTIVE_MOVEMENTS.reduce((sum, m) => sum + m.count, 0)} people
            moving now
          </p>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft text-gray-700 hover:bg-white transition-colors">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {/* Expand Hint */}
      {!isExpanded && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-gray-500">
          <Navigation className="w-3 h-3" />
          <span>Tap to explore map</span>
        </div>}
    </motion.div>;
}