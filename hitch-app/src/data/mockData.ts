// src/data/mockData.ts
// Mock data for testing non-nearby features (badges, achievements, user profile)
// 
// NOTE: Mock pilots and riders for the map are now handled by:
// - Backend: /backend/src/data/mockUsers.json
// - Frontend: /src/data/nearbyUsersMock.ts
// - Hook: useNearbyUsers() with withMocks=true
//
// Do NOT add mock pilots/riders to this file - use the unified pipeline instead.

export const mockBadges = [
  { id: '1', icon: '🏆', name: 'Top Pilot', description: 'Top 10 in region' },
  { id: '2', icon: '🌟', name: '5-Star Pro', description: '100+ 5-star rides' },
  { id: '3', icon: '🛡️', name: 'Safe Driver', description: 'Zero incidents' },
  { id: '4', icon: '🗺️', name: 'Plate Collector', description: '28 unique plates' },
  { id: '5', icon: '🔥', name: '5-Day Streak', description: 'Ride every day' },
  { id: '6', icon: '🎖️', name: 'Trusted Rider', description: '4.5+ rating' },
  { id: '7', icon: '🌟', name: 'Explorer', description: 'Rode in 5+ cities' },
];

export const mockAchievements = [
  {
    id: '1',
    icon: '🏆',
    title: 'Century Club',
    description: 'Complete 100 rides',
    progress: 87,
    total: 100,
    unlocked: false,
  },
  {
    id: '2',
    icon: '🗺️',
    title: 'Plate Hunter',
    description: '12 unique plates collected',
    progress: 12,
    total: 12,
    unlocked: true,
  },
  {
    id: '3',
    icon: '🔥',
    title: '5-Day Streak',
    description: 'Ride every day this week',
    progress: 5,
    total: 5,
    unlocked: true,
  },
];

export const mockPlates = [
  { code: 'KA-01', city: 'Bangalore', unlocked: true },
  { code: 'MH-12', city: 'Mumbai', unlocked: true },
  { code: 'TN-07', city: 'Chennai', unlocked: true },
  { code: 'DL-03', city: 'Delhi', unlocked: true },
  { code: 'GJ-05', city: 'Gujarat', unlocked: false },
  { code: 'RJ-14', city: 'Rajasthan', unlocked: false },
];

export const mockReviews = [
  {
    id: '1',
    name: 'Anjali M.',
    rating: 5,
    comment: 'Very safe driver, great conversation!',
    date: '2 days ago',
  },
  {
    id: '2',
    name: 'Rahul P.',
    rating: 5,
    comment: 'Smooth ride, highly recommend!',
    date: '1 week ago',
  },
  {
    id: '3',
    name: 'Sneha K.',
    rating: 4,
    comment: 'Good experience overall.',
    date: '2 weeks ago',
  },
];

export const mockCurrentUser = {
  id: 'user123',
  name: 'Alice Sharma',
  phone: '+911234567890',
  avatar: 'A',
  role: 'rider',
  rating: 4.8,
  totalRides: 87,
  totalKm: 645,
  tokens: 120,
  badges: ['Explorer', 'Trusted Rider'],
  achievements: mockAchievements,
  collectedPlates: mockPlates,
  memberSince: 'Feb 2024',
};

export const mockRideHistory = [
  {
    id: 'ride1',
    date: '2 hours ago',
    destination: 'MG Road',
    distance: 8.5,
    duration: 24,
    tokens: 15,
    pilot: 'Rohit Kumar',
    rating: 5,
  },
  {
    id: 'ride2',
    date: 'Yesterday',
    destination: 'Koramangala',
    distance: 5.2,
    duration: 18,
    tokens: 10,
    pilot: 'Priya Sharma',
    rating: 4,
  },
];

// ============================================================
// DEPRECATED: Mock pilots/riders
// These are kept for backward compatibility with legacy components
// but should NOT be used for new features.
// Use useNearbyUsers() hook instead!
// ============================================================

/**
 * @deprecated Use useNearbyUsers() hook instead
 * This is kept only for backward compatibility with RideContext
 */
export const mockPilots = [
  {
    id: 'mock-pilot-1',
    name: 'Rohit Kumar',
    phone: '+919876543210',
    avatar: 'R',
    rating: 4.9,
    totalRides: 342,
    totalKm: 2100,
    tokens: 580,
    latitude: 30.3165,
    longitude: 78.0322,
    distance: 800,
    vehicle: {
      type: 'Sedan',
      model: 'Honda City',
      plate: 'UK-07-AB-1234',
    },
    badges: ['Top Pilot', '5-Star Pro', 'Safe Driver', 'Plate Collector'],
    verified: true,
  },
  {
    id: 'mock-pilot-2',
    name: 'Priya Sharma',
    phone: '+919876543211',
    avatar: 'P',
    rating: 4.8,
    totalRides: 256,
    totalKm: 1500,
    tokens: 420,
    latitude: 30.3265,
    longitude: 78.0422,
    distance: 1200,
    vehicle: {
      type: 'Hatchback',
      model: 'Maruti Swift',
      plate: 'UK-07-CD-5678',
    },
    badges: ['5-Star Pro', 'Safe Driver'],
    verified: true,
  },
];
