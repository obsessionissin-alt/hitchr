import React from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Map, Award, Settings } from 'lucide-react';
export function Profile() {
  return <div className="pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white pb-6 pt-12 px-6 rounded-b-[32px] shadow-soft">
        <div className="flex justify-between items-start mb-6">
          <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" alt="User" size="xl" badge="trust" />
          <button className="p-2 bg-gray-100 rounded-full text-gray-600">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">David Kim</h1>
        <p className="text-gray-500 mb-4">
          Explorer & Photographer. Always looking for the scenic route.
        </p>

        <div className="flex gap-2 mb-6">
          <Badge type="trust" text="High Trust" />
          <Badge type="verified" text="Identity Verified" />
          <Badge type="achievement" text="Top Contributor" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">142</div>
            <div className="text-xs text-gray-500">Journeys</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">2.4k</div>
            <div className="text-xs text-gray-500">Km Shared</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <div className="text-xl font-bold text-gray-900">12</div>
            <div className="text-xs text-gray-500">Communities</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 px-2">Recent History</h2>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-trust-blue">
            <Map className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Cross-City Commute</h3>
            <p className="text-xs text-gray-500">Yesterday • 12km</p>
          </div>
          <div className="text-sm font-medium text-coral-500">+24 pts</div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Community Helper</h3>
            <p className="text-xs text-gray-500">Earned "Guide" Badge</p>
          </div>
        </Card>
      </div>
    </div>;
}