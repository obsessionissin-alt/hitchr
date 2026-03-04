import React, { useState, memo } from 'react';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Navigation, Calendar, Camera, MapPin, Users, Clock, Image as ImageIcon, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
type JourneyType = 'live' | 'planned' | 'memory' | null;
interface JourneyComposerProps {
  isOpen: boolean;
  onClose: () => void;
}
export function JourneyComposer({
  isOpen,
  onClose
}: JourneyComposerProps) {
  const [step, setStep] = useState<'type' | 'compose'>('type');
  const [journeyType, setJourneyType] = useState<JourneyType>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const handleTypeSelect = (type: JourneyType) => {
    setJourneyType(type);
    setStep('compose');
  };
  const handleBack = () => {
    if (step === 'compose') {
      setStep('type');
      setJourneyType(null);
    }
  };
  const handleMediaSelect = () => {
    // Simulate media selection
    setSelectedMedia(['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400']);
  };
  const handlePost = () => {
    console.log('Posting journey:', {
      journeyType,
      origin,
      destination,
      caption,
      selectedMedia
    });
    onClose();
    // Reset state
    setStep('type');
    setJourneyType(null);
    setOrigin('');
    setDestination('');
    setCaption('');
    setSelectedMedia([]);
  };
  return <BottomSheet isOpen={isOpen} onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === 'type' ? <motion.div key="type" initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: 20
      }}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Share Your Journey
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              What kind of journey do you want to share?
            </p>

            <div className="space-y-3">
              <Card variant="outlined" padding="md" onClick={() => handleTypeSelect('live')} className="cursor-pointer hover:border-coral-500 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-coral-50 rounded-xl flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-coral-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">I'm Moving Now</h3>
                    <p className="text-xs text-gray-500">
                      Share your live journey as it happens
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="outlined" padding="md" onClick={() => handleTypeSelect('planned')} className="cursor-pointer hover:border-trust-blue transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-trust-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Planning a Trip</h3>
                    <p className="text-xs text-gray-500">
                      Coordinate with others for future travel
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="outlined" padding="md" onClick={() => handleTypeSelect('memory')} className="cursor-pointer hover:border-trust-green transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-trust-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Share a Memory</h3>
                    <p className="text-xs text-gray-500">
                      Post about a past journey
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div> : <motion.div key="compose" initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: -20
      }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                ←
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {journeyType === 'live' && 'Live Journey'}
                  {journeyType === 'planned' && 'Plan Your Trip'}
                  {journeyType === 'memory' && 'Journey Memory'}
                </h2>
                <p className="text-xs text-gray-500">
                  {journeyType === 'live' && "Share where you're heading right now"}
                  {journeyType === 'planned' && 'Let others know your travel plans'}
                  {journeyType === 'memory' && 'Share moments from your past journey'}
                </p>
              </div>
            </div>

            {/* Route Selection - PRIMARY */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Your Route <span className="text-coral-500">*</span>
              </label>

              <div className="relative">
                {/* Origin */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-coral-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-coral-500 rounded-full" />
                  </div>
                  <input type="text" placeholder="Starting from..." value={origin} onChange={e => setOrigin(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-coral-500 focus:outline-none text-sm" />
                </div>

                {/* Connecting line */}
                <div className="absolute left-4 top-11 bottom-11 w-0.5 bg-gray-200" />

                {/* Destination */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-trust-blue" />
                  </div>
                  <input type="text" placeholder="Going to..." value={destination} onChange={e => setDestination(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-trust-blue focus:outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Media Upload - SECONDARY */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Capture Moments
              </label>

              {selectedMedia.length > 0 ? <div className="grid grid-cols-3 gap-2 mb-3">
                  {selectedMedia.map((media, index) => <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={media} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => setSelectedMedia(selectedMedia.filter((_, i) => i !== index))} className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full text-white text-xs">
                        ×
                      </button>
                    </div>)}
                  <button onClick={handleMediaSelect} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-coral-500 hover:text-coral-500 transition-colors">
                    <Plus className="w-6 h-6" />
                  </button>
                </div> : <button onClick={handleMediaSelect} className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-coral-500 hover:text-coral-500 transition-colors">
                  <div className="flex gap-2 mb-2">
                    <ImageIcon className="w-5 h-5" />
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">
                    Add photos or videos
                  </span>
                </button>}
            </div>

            {/* Caption */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Tell Your Story
              </label>
              <textarea placeholder="What makes this journey special?" value={caption} onChange={e => setCaption(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-coral-500 focus:outline-none text-sm resize-none" />
            </div>

            {/* Journey Details */}
            {journeyType === 'planned' && <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Trip Details
                </label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-coral-500 focus:outline-none text-sm" />
                  <button className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              </div>}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePost} disabled={!origin || !destination} className="flex-1">
                {journeyType === 'live' && 'Start Sharing'}
                {journeyType === 'planned' && 'Post Trip'}
                {journeyType === 'memory' && 'Share Memory'}
              </Button>
            </div>
          </motion.div>}
      </AnimatePresence>
    </BottomSheet>;
}