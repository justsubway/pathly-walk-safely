import { LatLng, RouteResult, Segment } from '../lib/types';
import { API_CONFIG, API_LIMITS } from './api-config';
import { ATHENS_BOUNDS, isWithinAthensBounds } from './api-config';
import { calculateDistance } from './routes';
interface GoogleDirectionsResponse {
  routes: GoogleRoute[];
  status: string;
}
interface GoogleRoute {
  legs: GoogleLeg[];
  overview_polyline: {
    points: string;
  };
  summary: string;
  waypoint_order?: number[];
}
interface GoogleLeg {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  steps: GoogleStep[];
  start_location: GoogleLatLng;
  end_location: GoogleLatLng;
}
interface GoogleStep {
  distance: GoogleDistance;
  duration: GoogleDuration;
  end_location: GoogleLatLng;
  start_location: GoogleLatLng;
  polyline: {
    points: string;
  };
  travel_mode: string;
  html_instructions: string;
}
interface GoogleLatLng {
  lat: number;
  lng: number;
}
interface GoogleDistance {
  text: string;
  value: number;
}
interface GoogleDuration {
  text: string;
  value: number;
}
const routeCache = new Map<string, { data: RouteResult[]; timestamp: number }>();
let lastRequestTime = 0;
const requestQueue: (() => Promise<void>)[] = [];
async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const minInterval = 60000 / API_LIMITS.GOOGLE_REQUESTS_PER_MINUTE;
      if (timeSinceLastRequest < minInterval) {
        await new Promise(r => setTimeout(r, minInterval - timeSinceLastRequest));
      }
      lastRequestTime = Date.now();
      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    requestQueue.push(executeRequest);
    if (requestQueue.length === 1) {
      executeRequest();
    }
  });
}
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;
    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}
export async function getWalkingDirections(
  origin: LatLng,
  destination: LatLng,
  alternatives: boolean = true
): Promise<RouteResult[]> {
  if (!isWithinAthensBounds(origin.latitude, origin.longitude) || 
      !isWithinAthensBounds(destination.latitude, destination.longitude)) {
    throw new Error('Coordinates must be within Athens area bounds');
  }
  const cacheKey = `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < API_LIMITS.CACHE_DURATION_MS) {
    return cached.data;
  }
  if (!API_CONFIG.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: 'walking',
    alternatives: alternatives.toString(),
    key: API_CONFIG.GOOGLE_MAPS_API_KEY,
  });
  const url = `${API_CONFIG.GOOGLE_MAPS_BASE_URL}/directions/json?${params}`;
  try {
    const response = await rateLimitedRequest(async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Maps API error: ${res.status}`);
      }
      return res.json();
    });
    const data: GoogleDirectionsResponse = response;
    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`);
    }
    const routes = data.routes.map((route, index) => convertGoogleRouteToRouteResult(route, index));
    routeCache.set(cacheKey, {
      data: routes,
      timestamp: Date.now(),
    });
    return routes;
  } catch (error) {
    console.error('Error fetching walking directions:', error);
    throw error;
  }
}
function convertGoogleRouteToRouteResult(googleRoute: GoogleRoute, index: number): RouteResult {
  const routeId = `google-route-${index}`;
  const coords = decodePolyline(googleRoute.overview_polyline.points);
  let totalDistanceM = 0;
  let totalDurationS = 0;
  googleRoute.legs.forEach(leg => {
    totalDistanceM += leg.distance.value;
    totalDurationS += leg.duration.value;
  });
  const segments = createSegmentsFromGoogleRoute(googleRoute, routeId);
  return {
    id: routeId,
    name: googleRoute.summary || `Route ${index + 1}`,
    coords,
    segments,
    distanceKm: Math.round((totalDistanceM / 1000) * 100) / 100,
    etaMin: Math.round(totalDurationS / 60),
    safetyScore: 0, // Will be calculated separately with real crime data
  };
}
function createSegmentsFromGoogleRoute(googleRoute: GoogleRoute, routeId: string): Segment[] {
  const segments: Segment[] = [];
  let segmentIndex = 0;
  googleRoute.legs.forEach(leg => {
    leg.steps.forEach(step => {
      const stepCoords = decodePolyline(step.polyline.points);
      segments.push({
        id: `${routeId}-seg-${segmentIndex}`,
        coords: stepCoords,
        baseIncidentRisk: 0, // Will be calculated from crime data
        lengthM: step.distance.value,
        gridCellId: generateGridId(
          (step.start_location.lat + step.end_location.lat) / 2,
          (step.start_location.lng + step.end_location.lng) / 2
        ),
      });
      segmentIndex++;
    });
  });
  return segments;
}
function generateGridId(lat: number, lng: number): string {
  const gridSize = 0.001; // ~100m resolution
  const gridLat = Math.floor(lat / gridSize);
  const gridLng = Math.floor(lng / gridSize);
  return `${gridLat}_${gridLng}`;
}
export async function geocodeAddress(address: string): Promise<LatLng[]> {
  if (!API_CONFIG.GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }
  const params = new URLSearchParams({
    address: `${address}, Miami, Florida`,
    bounds: `${MIAMI_BOUNDS.south},${MIAMI_BOUNDS.west}|${MIAMI_BOUNDS.north},${MIAMI_BOUNDS.east}`,
    key: API_CONFIG.GOOGLE_MAPS_API_KEY,
  });
  const url = `${API_CONFIG.GOOGLE_MAPS_BASE_URL}/geocode/json?${params}`;
  try {
    const response = await rateLimitedRequest(async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Geocoding API error: ${res.status}`);
      }
      return res.json();
    });
    if (response.status !== 'OK' || !response.results.length) {
      throw new Error('Address not found or outside Miami area');
    }
    return response.results.map((result: any) => ({
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    }));
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}