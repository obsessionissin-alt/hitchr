import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children
}: BottomSheetProps) {
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />

          {/* Sheet */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300
      }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <div className="p-6 pb-10">
              {title && <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>}
              {children}
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}