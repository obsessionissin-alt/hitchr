import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';
const COMMUNITIES = [{
  id: '1',
  name: 'Tech Hikers',
  members: 1240,
  active: 45,
  image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500',
  type: 'Interest'
}, {
  id: '2',
  name: 'University Loop',
  members: 3500,
  active: 120,
  image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500',
  type: 'Location',
  verified: true
}];
const TRIPS = [{
  id: '1',
  destination: 'Spiti Valley Expedition',
  dates: 'Aug 12 - 20',
  organizer: 'Sarah K.',
  interested: 8,
  image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500'
}, {
  id: '2',
  destination: 'Weekend Surf Camp',
  dates: 'This Saturday',
  organizer: 'Mike R.',
  interested: 15,
  image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500'
}];
export function CommunitiesHub() {
  return <div className="pb-24 min-h-screen bg-gray-50">
      <div className="px-6 pt-12 pb-6 bg-white">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Communities</h1>
        <p className="text-gray-500">Find your people, plan your movement.</p>
      </div>

      <div className="p-4 space-y-8">
        {/* Your Communities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Your Communities
            </h2>
            <button className="text-coral-500 text-sm font-medium">
              See all
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {COMMUNITIES.map(comm => <Card key={comm.id} padding="none" className="min-w-[240px] relative group">
                <div className="h-32 w-full relative">
                  <img src={comm.image} alt={comm.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="font-bold text-lg leading-tight">
                      {comm.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs opacity-90">
                      <MapPin className="w-3 h-3" />
                      <span>{comm.type}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    <strong className="text-gray-900">{comm.active}</strong>{' '}
                    active today
                  </div>
                  {comm.verified && <Badge type="verified" size="sm" />}
                </div>
              </Card>)}
          </div>
        </section>

        {/* Upcoming Trips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Trips</h2>
            <button className="text-coral-500 text-sm font-medium">
              Explore
            </button>
          </div>
          <div className="space-y-3">
            {TRIPS.map(trip => <Card key={trip.id} className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={trip.image} alt={trip.destination} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">
                    {trip.destination}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{trip.dates}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {trip.interested} interested • by {trip.organizer}
                    </span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-coral-50 hover:text-coral-500 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Card>)}
          </div>
        </section>
      </div>
    </div>;
}