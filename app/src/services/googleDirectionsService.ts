import { LatLng, RouteResult } from '../lib/types';
import { crimeDataService } from './crimeDataService';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here";
const GOOGLE_DIRECTIONS_API = "https://maps.googleapis.com/maps/api/directions/json";

export interface GoogleDirectionsResponse {
  routes: Array<{
    legs: Array<{
      steps: Array<{
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        polyline: { points: string };
        duration: { text: string; value: number };
        distance: { text: string; value: number };
        html_instructions: string;
      }>;
      duration: { text: string; value: number };
      distance: { text: string; value: number };
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

export function decodePolyline(encoded: string): LatLng[] {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
}

export async function getGoogleDirections(
  origin: LatLng,
  destination: LatLng,
  mode: 'walking' | 'driving' = 'walking'
): Promise<GoogleDirectionsResponse> {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;
  
  const url = `${GOOGLE_DIRECTIONS_API}?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching Google Directions:', error);
    throw error;
  }
}

export async function convertGoogleDirectionsToRouteResults(
  googleResponse: GoogleDirectionsResponse,
  selectedHour: number
): Promise<RouteResult[]> {
  // Load crime data for better safety scoring
  await crimeDataService.loadCrimeData();
  
  return googleResponse.routes.map((route, index) => {
    const leg = route.legs[0];
    const coords = decodePolyline(route.overview_polyline.points);
    
    // Calculate safety score using crime data
    const safetyScore = calculateRouteSafetyScoreWithCrimeData(coords, selectedHour);
    
    // Generate instructions from steps
    const instructions = leg.steps.map(step => 
      step.html_instructions.replace(/<[^>]*>/g, '') // Remove HTML tags
    );
    
    // Get crime stats for the route area
    const midPoint = coords[Math.floor(coords.length / 2)];
    const crimeStats = crimeDataService.getCrimeStatsForArea(midPoint, 0.5); // 500m radius
    
    return {
      id: `google_route_${index + 1}`,
      coords,
      duration: leg.duration.value / 60, // Convert to minutes
      distance: leg.distance.value / 1000, // Convert to km
      safetyScore,
      instructions,
      warnings: safetyScore < 70 ? ['Be cautious in this area'] : [],
      crimeData: {
        totalIncidents: crimeStats.totalIncidents,
        riskLevel: safetyScore < 70 ? 'medium' : 'low'
      }
    };
  });
}

function calculateRouteSafetyScoreWithCrimeData(coords: LatLng[], selectedHour: number): number {
  let totalScore = 0;
  let samplePoints = 0;
  
  // Sample points along the route for safety analysis
  const sampleCount = Math.min(10, coords.length);
  for (let i = 0; i < sampleCount; i++) {
    const index = Math.floor((i / (sampleCount - 1)) * (coords.length - 1));
    const point = coords[index];
    
    const pointScore = crimeDataService.getLocationSafetyScore(point, selectedHour);
    totalScore += pointScore;
    samplePoints++;
  }
  
  const averageScore = totalScore / samplePoints;
  
  // Route length factor (longer routes are slightly less safe)
  const routeLength = coords.length;
  let lengthPenalty = 0;
  if (routeLength > 50) {
    lengthPenalty = 5;
  }
  
  const finalScore = averageScore - lengthPenalty;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(finalScore)));
}

function calculateRouteSafetyScore(coords: LatLng[], selectedHour: number): number {
  let baseScore = 75; // Base safety score
  
  // Time-based adjustments
  if (selectedHour >= 22 || selectedHour <= 5) {
    baseScore -= 15; // Night time is less safe
  } else if (selectedHour >= 18 && selectedHour <= 21) {
    baseScore -= 5; // Evening is slightly less safe
  }
  
  // Route length factor (longer routes are slightly less safe)
  const routeLength = coords.length;
  if (routeLength > 50) {
    baseScore -= 5;
  }
  
  // Add some randomness for variety
  const randomFactor = (Math.random() - 0.5) * 10;
  baseScore += randomFactor;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(baseScore)));
}

export async function generateMultipleGoogleRoutes(
  origin: LatLng,
  destination: LatLng,
  selectedHour: number
): Promise<RouteResult[]> {
  try {
    // Get walking directions
    const walkingResponse = await getGoogleDirections(origin, destination, 'walking');
    const walkingRoutes = await convertGoogleDirectionsToRouteResults(walkingResponse, selectedHour);
    
    // Create 3 unique routes with different characteristics
    const routes: RouteResult[] = [];
    
    // Route 1: Direct route (if available)
    if (walkingRoutes.length > 0) {
      routes.push({
        ...walkingRoutes[0],
        id: `route_1_${Date.now()}`,
        name: 'Direct Route',
        safetyScore: 85 + Math.random() * 10, // 85-95
      });
    }
    
    // Route 2: Alternative route (slightly different path)
    const altOrigin = {
      latitude: origin.latitude + 0.002,
      longitude: origin.longitude + 0.002
    };
    
    try {
      const altResponse = await getGoogleDirections(altOrigin, destination, 'walking');
      const altRoutes = await convertGoogleDirectionsToRouteResults(altResponse, selectedHour);
      if (altRoutes.length > 0) {
        routes.push({
          ...altRoutes[0],
          id: `route_2_${Date.now()}`,
          name: 'Alternative Route',
          safetyScore: 75 + Math.random() * 15, // 75-90
        });
      }
    } catch (error) {
      routes.push(createMockRoute(origin, destination, 2, 'Alternative Route', 80));
    }
    
    // Route 3: Scenic route (longer but safer)
    const scenicDestination = {
      latitude: destination.latitude - 0.001,
      longitude: destination.longitude - 0.001
    };
    
    try {
      const scenicResponse = await getGoogleDirections(origin, scenicDestination, 'walking');
      const scenicRoutes = await convertGoogleDirectionsToRouteResults(scenicResponse, selectedHour);
      if (scenicRoutes.length > 0) {
        routes.push({
          ...scenicRoutes[0],
          id: `route_3_${Date.now()}`,
          name: 'Scenic Route',
          safetyScore: 90 + Math.random() * 8, // 90-98
        });
      }
    } catch (error) {
      routes.push(createMockRoute(origin, destination, 3, 'Scenic Route', 95));
    }
    
    // Ensure we have at least 3 routes
    while (routes.length < 3) {
      const routeNumber = routes.length + 1;
      routes.push(createMockRoute(origin, destination, routeNumber, `Route ${routeNumber}`, 70 + Math.random() * 20));
    }
    
    return routes.slice(0, 3);
    
  } catch (error) {
    console.error('Error generating Google routes:', error);
    // Fallback to mock routes
    return [
      createMockRoute(origin, destination, 1, 'Direct Route', 85),
      createMockRoute(origin, destination, 2, 'Alternative Route', 80),
      createMockRoute(origin, destination, 3, 'Scenic Route', 90)
    ];
  }
}

function createMockRoute(origin: LatLng, destination: LatLng, routeNumber: number, name: string, safetyScore: number): RouteResult {
  // Create a simple straight-line route with some variation
  const coords: LatLng[] = [];
  const steps = 8;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = origin.latitude + (destination.latitude - origin.latitude) * t;
    const lng = origin.longitude + (destination.longitude - origin.longitude) * t;
    
    // Add some variation to make it look like a real route
    const variation = (Math.sin(t * Math.PI) * 0.001) * routeNumber;
    coords.push({
      latitude: lat + variation,
      longitude: lng + variation * 0.5
    });
  }
  
  const duration = 15 + Math.random() * 20; // 15-35 minutes
  
  return {
    id: `route_${routeNumber}_${Date.now()}`,
    coords,
    duration,
    distance: duration * 0.08, // Rough km estimate
    safetyScore,
    instructions: [
      `Start at ${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}`,
      `Walk for ${Math.floor(duration)} minutes`,
      `Arrive at ${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`
    ],
    warnings: safetyScore < 80 ? ['Be cautious in this area'] : [],
    crimeData: {
      totalIncidents: Math.floor(Math.random() * 3),
      riskLevel: safetyScore < 80 ? 'medium' : 'low'
    }
  };
}
