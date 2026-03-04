import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, AlertTriangle } from 'lucide-react';
export function SafetyCheckIn() {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return <AnimatePresence>
      <motion.div initial={{
      y: 100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} exit={{
      y: 100,
      opacity: 0
    }} className="fixed bottom-24 left-4 right-4 z-40">
        <div className="bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-float border border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-trust-blue" />
            </div>
            <div>
              <p className="text-sm font-medium">Quick check-in</p>
              <p className="text-xs text-gray-400">Everything going okay?</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsVisible(false)} className="px-3 py-2 bg-gray-800 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" />
              I'm OK
            </button>
            <button className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Help
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>;
}