import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Navigation } from 'lucide-react';
interface FloatingActionButtonProps {
  onClick: () => void;
}
export function FloatingActionButton({
  onClick
}: FloatingActionButtonProps) {
  return <motion.button onClick={onClick} className="fixed bottom-28 right-6 z-30 w-16 h-16 bg-gradient-to-br from-coral-500 to-coral-600 rounded-full shadow-float flex items-center justify-center text-white" whileHover={{
    scale: 1.05
  }} whileTap={{
    scale: 0.95
  }} initial={{
    scale: 0,
    opacity: 0
  }} animate={{
    scale: 1,
    opacity: 1
  }} transition={{
    type: 'spring',
    stiffness: 260,
    damping: 20
  }}>
      {/* Pulsing ring effect */}
      <motion.div className="absolute inset-0 rounded-full bg-coral-500" animate={{
      scale: [1, 1.3, 1],
      opacity: [0.5, 0, 0.5]
    }} transition={{
      duration: 2,
      repeat: Infinity
    }} />

      <div className="relative">
        <Navigation className="w-7 h-7" fill="currentColor" />
        <Plus className="w-4 h-4 absolute -top-1 -right-1 bg-white text-coral-500 rounded-full" strokeWidth={3} />
      </div>
    </motion.button>;
}