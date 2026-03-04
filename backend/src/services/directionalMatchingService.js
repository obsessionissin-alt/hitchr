const {
  calculateDistance,
  calculateBearing,
  projectPoint,
} = require('../utils/haversine');

// Default tuning parameters
const DEFAULTS = {
  sampleInterval: 150, // meters
  overlapDistanceThreshold: 180, // meters to consider two sampled points overlapping (increased for leniency)
  minimumOverlap: 200, // meters (further reduced for more matches)
  bearingTolerance: 90, // degrees (more lenient)
  detourLimit: 5000, // meters (allow longer detours)
};

const toPoint = (coord) => ({
  lat: coord.lat ?? coord.latitude,
  lng: coord.lng ?? coord.longitude,
});

const buildStraightRoute = (start, end) => {
  const a = toPoint(start);
  const b = toPoint(end);
  return [a, b];
};

const interpolatePoint = (start, end, fraction) => {
  const lat = start.lat + (end.lat - start.lat) * fraction;
  const lng = start.lng + (end.lng - start.lng) * fraction;
  return { lat, lng };
};

const sampleRoute = (coords, interval = DEFAULTS.sampleInterval) => {
  if (!coords || coords.length < 2) return coords || [];
  const samples = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const start = toPoint(coords[i]);
    const end = toPoint(coords[i + 1]);
    const segmentDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);

    if (samples.length === 0) {
      samples.push(start);
    }

    if (segmentDistance === 0) continue;

    const steps = Math.max(1, Math.floor(segmentDistance / interval));
    for (let s = 1; s <= steps; s++) {
      const fraction = Math.min(1, (s * interval) / segmentDistance);
      samples.push(interpolatePoint(start, end, fraction));
    }
  }

  // Ensure last point is the final destination
  const last = toPoint(coords[coords.length - 1]);
  if (
    samples.length === 0 ||
    samples[samples.length - 1].lat !== last.lat ||
    samples[samples.length - 1].lng !== last.lng
  ) {
    samples.push(last);
  }

  return samples;
};

const nearestDistance = (point, candidates) => {
  let min = Infinity;
  for (const candidate of candidates) {
    const d = calculateDistance(point.lat, point.lng, candidate.lat, candidate.lng);
    if (d < min) min = d;
  }
  return min;
};

const computeOverlapMeters = (riderRoute, pilotRoute, opts = {}) => {
  const {
    sampleInterval = DEFAULTS.sampleInterval,
    overlapDistanceThreshold = DEFAULTS.overlapDistanceThreshold,
  } = opts;

  const riderSamples = sampleRoute(riderRoute, sampleInterval);
  const pilotSamples = sampleRoute(pilotRoute, sampleInterval);

  if (riderSamples.length === 0 || pilotSamples.length === 0) {
    return 0;
  }

  let overlap = 0;
  for (let i = 0; i < riderSamples.length; i++) {
    const riderPoint = riderSamples[i];
    const nearest = nearestDistance(riderPoint, pilotSamples);
    if (nearest <= overlapDistanceThreshold) {
      // Approximate overlap contribution by sample interval
      overlap += sampleInterval;
    }
  }

  return overlap;
};

const computeBearingForRoute = (route, fallbackHeading = null) => {
  if (route && route.length >= 2) {
    const a = toPoint(route[0]);
    const b = toPoint(route[1]);
    if (a.lat !== b.lat || a.lng !== b.lng) {
      return calculateBearing(a.lat, a.lng, b.lat, b.lng);
    }
  }
  return fallbackHeading;
};

const computeDetourMeters = (pilotRoute, riderOrigin) => {
  const samples = sampleRoute(pilotRoute, DEFAULTS.sampleInterval);
  if (!samples.length) return Infinity;
  return nearestDistance(toPoint(riderOrigin), samples);
};

const scoreMatch = ({ overlapMeters, bearingDiff, detourMeters }) => {
  // Bearing alignment score between 0 and 1
  const bearingAlignment = Math.max(0, 1 - bearingDiff / DEFAULTS.bearingTolerance);
  const overlapScore = overlapMeters; // meters
  const bearingScore = bearingAlignment * 400; // weight for direction
  const detourPenalty = Math.min(detourMeters, 5000) * 0.2; // cap penalty
  const score = overlapScore * 0.6 + bearingScore - detourPenalty;
  return score;
};

/**
 * Build a pilot route using destination if present, else infer using heading
 */
const buildPilotRoute = (pilot) => {
  const origin = {
    lat: pilot.latitude,
    lng: pilot.longitude,
  };

  if (pilot.destination_lat && pilot.destination_lng) {
    return buildStraightRoute(origin, {
      lat: pilot.destination_lat,
      lng: pilot.destination_lng,
    });
  }

  if (pilot.heading !== null && pilot.heading !== undefined) {
    // Project 1.2km along heading to derive forward vector
    const projected = projectPoint(origin.lat, origin.lng, pilot.heading, 1200);
    return buildStraightRoute(origin, {
      lat: projected.lat,
      lng: projected.lon,
    });
  }

  return [];
};

/**
 * Main matching function
 * @param {Object} params
 * @param {{lat:number,lng:number}} params.riderOrigin
 * @param {{lat:number,lng:number}} params.riderDestination
 * @param {Array<{lat:number,lng:number}>} [params.riderRoute] optional precomputed rider route
 * @param {Array<Object>} params.pilots pilot records with lat/lng/heading/destination fields
 * @returns Array of matched pilots with match metrics
 */
const matchPilots = ({ riderOrigin, riderDestination, riderRoute, pilots }) => {
  const riderRouteToUse =
    riderRoute && riderRoute.length >= 2
      ? riderRoute.map(toPoint)
      : buildStraightRoute(riderOrigin, riderDestination);

  const riderBearing = computeBearingForRoute(riderRouteToUse);

  const matches = [];

  for (const pilot of pilots) {
    const pilotRoute = buildPilotRoute(pilot);
    if (!pilotRoute || pilotRoute.length < 2) {
      console.log(`⚠️ Pilot ${pilot.name || pilot.id}: No route (destination: ${pilot.destination_lat ? 'yes' : 'no'}, heading: ${pilot.heading || 'none'})`);
      continue;
    }

    const overlapMeters = computeOverlapMeters(riderRouteToUse, pilotRoute);
    const pilotBearing = computeBearingForRoute(pilotRoute, pilot.heading || null);
    const bearingDiff =
      pilotBearing !== null && riderBearing !== null
        ? Math.min(
            Math.abs(pilotBearing - riderBearing),
            360 - Math.abs(pilotBearing - riderBearing)
          )
        : DEFAULTS.bearingTolerance;

    const detourMeters = computeDetourMeters(pilotRoute, riderOrigin);
    const score = scoreMatch({ overlapMeters, bearingDiff, detourMeters });

    const matched =
      overlapMeters >= DEFAULTS.minimumOverlap &&
      bearingDiff <= DEFAULTS.bearingTolerance &&
      detourMeters <= DEFAULTS.detourLimit;

    if (!matched) {
      console.log(`❌ Pilot ${pilot.name || pilot.id} rejected: overlap=${Math.round(overlapMeters)}m (min ${DEFAULTS.minimumOverlap}m), bearing=${Math.round(bearingDiff)}° (max ${DEFAULTS.bearingTolerance}°), detour=${Math.round(detourMeters)}m (max ${DEFAULTS.detourLimit}m)`);
    }

    if (matched) {
      matches.push({
        ...pilot,
        matchScore: Math.round(score),
        metrics: {
          overlapMeters: Math.round(overlapMeters),
          bearingDiff: Math.round(bearingDiff),
          detourMeters: Math.round(detourMeters),
        },
      });
      console.log(`✅ Pilot ${pilot.name || pilot.id} matched: overlap=${Math.round(overlapMeters)}m, bearing=${Math.round(bearingDiff)}°, detour=${Math.round(detourMeters)}m, score=${Math.round(score)}`);
    }
  }

  // Sort strongest matches first
  matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return matches;
};

module.exports = {
  matchPilots,
  buildStraightRoute,
  sampleRoute,
  DEFAULTS,
};

