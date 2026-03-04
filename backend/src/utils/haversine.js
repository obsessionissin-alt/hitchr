const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_METERS * c;
};

const isWithinRadius = (lat1, lon1, lat2, lon2, radiusMeters) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusMeters;
};

/**
 * Calculate initial bearing (forward azimuth) from point A to B in degrees
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const λ1 = toRadians(lon1);
  const λ2 = toRadians(lon2);
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  const bearing = (toDegrees(θ) + 360) % 360;
  return bearing;
};

/**
 * Project a point from a start location using bearing and distance
 */
const projectPoint = (lat, lon, bearingDeg, distanceMeters) => {
  const δ = distanceMeters / EARTH_RADIUS_METERS; // angular distance
  const θ = toRadians(bearingDeg);
  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ);
  const cosθ = Math.cos(θ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return {
    lat: toDegrees(φ2),
    lon: ((toDegrees(λ2) + 540) % 360) - 180, // normalize to [-180, 180]
  };
};

module.exports = {
  calculateDistance,
  isWithinRadius,
  calculateBearing,
  projectPoint,
};
