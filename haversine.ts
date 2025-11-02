import { Location } from '../types';

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateDistance = (
  point1: Location,
  point2: Location
): number => {
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

export const isWithinRadius = (
  point1: Location,
  point2: Location,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(point1, point2);
  return distance <= radiusMeters;
};