import { LatLng } from '../lib/types';
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key_here';
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';
export interface EnhancedRoute {
  id: string;
  coordinates: LatLng[];
  distance_km: number;
  duration_minutes: number;
  route_type: string;
  strategy: string;
  summary: string;
  status: 'success' | 'error';
  error_message?: string;
}
export interface MultipleRoutesResult {
  routes: EnhancedRoute[];
  total_routes: number;
  successful_routes: number;
  failed_routes: number;
  status: 'success' | 'partial' | 'error';
  generation_strategies: string[];
}
export async function generateMultipleRoutes(
  origin: LatLng,
  destination: LatLng,
  targetRouteCount: number = 3
): Promise<MultipleRoutesResult> {
  console.log(`🚶‍♂️ Generating ${targetRouteCount} diverse routes (always including fastest)...`);
  const startTime = Date.now();
  const routes: EnhancedRoute[] = [];
  const strategies: string[] = [];
  console.log('⚡ Priority: Getting fastest routes...');
  const directRoutes = await generateDirectRoutes(origin, destination);
  routes.push(...directRoutes.routes);
  strategies.push(...directRoutes.strategies);
  if (routes.length < targetRouteCount) {
    console.log('🎯 Strategy 2: Waypoint-based routes...');
    const waypointRoutes = await generateWaypointRoutes(origin, destination, targetRouteCount - routes.length);
    routes.push(...waypointRoutes.routes);
    strategies.push(...waypointRoutes.strategies);
  }
  if (routes.length < targetRouteCount) {
    console.log('⏰ Strategy 3: Time-based variations...');
    const timeRoutes = await generateTimeBasedRoutes(origin, destination, targetRouteCount - routes.length);
    routes.push(...timeRoutes.routes);
    strategies.push(...timeRoutes.strategies);
  }
  if (routes.length < targetRouteCount) {
    console.log('🧭 Strategy 4: Directional bias routes...');
    const directionalRoutes = await generateDirectionalRoutes(origin, destination, targetRouteCount - routes.length);
    routes.push(...directionalRoutes.routes);
    strategies.push(...directionalRoutes.strategies);
  }
  console.log('🔍 Filtering out similar routes...');
  const diverseRoutes = filterSimilarRoutes(routes.filter(r => r.status === 'success'));
  const endTime = Date.now();
  const successfulRoutes = diverseRoutes.length;
  const failedRoutes = routes.length - routes.filter(r => r.status === 'success').length;
  console.log(`✅ Generated ${successfulRoutes} diverse routes in ${(endTime - startTime) / 1000}s`);
  console.log(`🗂️ Filtered out ${routes.filter(r => r.status === 'success').length - diverseRoutes.length} similar routes`);
  if (failedRoutes > 0) {
    console.log(`⚠️ ${failedRoutes} routes failed to generate`);
  }
  return {
    routes: diverseRoutes.slice(0, targetRouteCount), // Limit to target count
    total_routes: diverseRoutes.length,
    successful_routes: successfulRoutes,
    failed_routes: failedRoutes,
    status: successfulRoutes >= 1 ? (successfulRoutes >= Math.max(1, targetRouteCount * 0.6) ? 'success' : 'partial') : 'error',
    generation_strategies: [...new Set(strategies)] // Remove duplicates
  };
}
async function generateDirectRoutes(origin: LatLng, destination: LatLng): Promise<{routes: EnhancedRoute[], strategies: string[]}> {
  const routes: EnhancedRoute[] = [];
  const strategies: string[] = [];
  try {
    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      mode: 'walking',
      alternatives: 'true', // Get alternative routes from Google
      key: GOOGLE_MAPS_API_KEY
    });
    const response = await fetch(`${DIRECTIONS_URL}?${params}`);
    const data = await response.json();
    if (data.status === 'OK' && data.routes) {
      for (let i = 0; i < Math.min(data.routes.length, 3); i++) { // Max 3 direct routes
        const route = data.routes[i];
        const leg = route.legs[0];
        if (!route.overview_polyline || !route.overview_polyline.points || !leg) {
          console.warn(`⚠️ Invalid route data from Google API:`, route);
          continue;
        }
        try {
          const coordinates = decodePolyline(route.overview_polyline.points);
          if (!coordinates || coordinates.length === 0) {
            console.warn(`⚠️ Failed to decode coordinates for route ${i + 1}`);
            continue;
          }
          const enhancedRoute: EnhancedRoute = {
            id: `direct_${i + 1}`,
            coordinates: coordinates,
            distance_km: parseFloat((leg.distance.value / 1000).toFixed(2)),
            duration_minutes: Math.round(leg.duration.value / 60),
            route_type: i === 0 ? 'fastest' : 'alternative',
            strategy: 'google_alternatives',
            summary: route.summary || 'Direct route',
            status: 'success'
          };
          routes.push(enhancedRoute);
          strategies.push('google_alternatives');
        } catch (decodeError) {
          console.error(`❌ Error decoding route ${i + 1}:`, decodeError);
        }
      }
    }
  } catch (error) {
    console.error('Error generating direct routes:', error);
  }
  return { routes, strategies };
}
async function generateWaypointRoutes(origin: LatLng, destination: LatLng, maxRoutes: number): Promise<{routes: EnhancedRoute[], strategies: string[]}> {
  const routes: EnhancedRoute[] = [];
  const strategies: string[] = [];
  const waypoints = generateStrategicWaypoints(origin, destination, maxRoutes);
  for (let i = 0; i < Math.min(waypoints.length, maxRoutes); i++) {
    try {
      const waypoint = waypoints[i];
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        waypoints: `${waypoint.latitude},${waypoint.longitude}`,
        mode: 'walking',
        key: GOOGLE_MAPS_API_KEY
      });
      const response = await fetch(`${DIRECTIONS_URL}?${params}`);
      const data = await response.json();
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        for (const leg of route.legs) {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        }
        const enhancedRoute: EnhancedRoute = {
          id: `waypoint_${i + 1}`,
          coordinates: decodePolyline(route.overview_polyline.points),
          distance_km: parseFloat((totalDistance / 1000).toFixed(2)),
          duration_minutes: Math.round(totalDuration / 60),
          route_type: 'waypoint_detour',
          strategy: 'strategic_waypoints',
          summary: 'Via waypoint route',
          status: 'success'
        };
        routes.push(enhancedRoute);
        strategies.push('strategic_waypoints');
      }
    } catch (error) {
      console.error(`Error generating waypoint route ${i + 1}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return { routes, strategies };
}
async function generateTimeBasedRoutes(origin: LatLng, destination: LatLng, maxRoutes: number): Promise<{routes: EnhancedRoute[], strategies: string[]}> {
  const routes: EnhancedRoute[] = [];
  const strategies: string[] = [];
  const timeOffsets = [0, 4 * 3600, 8 * 3600, 12 * 3600]; // 0h, 4h, 8h, 12h from now
  for (let i = 0; i < Math.min(timeOffsets.length, maxRoutes); i++) {
    try {
      const departureTime = Math.floor(Date.now() / 1000) + timeOffsets[i];
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: 'walking',
        departure_time: departureTime.toString(),
        alternatives: 'true',
        key: GOOGLE_MAPS_API_KEY
      });
      const response = await fetch(`${DIRECTIONS_URL}?${params}`);
      const data = await response.json();
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        const enhancedRoute: EnhancedRoute = {
          id: `time_${i + 1}`,
          coordinates: decodePolyline(route.overview_polyline.points),
          distance_km: parseFloat((leg.distance.value / 1000).toFixed(2)),
          duration_minutes: Math.round(leg.duration.value / 60),
          route_type: 'time_optimized',
          strategy: 'time_variations',
          summary: 'Time-based route',
          status: 'success'
        };
        routes.push(enhancedRoute);
        strategies.push('time_variations');
      }
    } catch (error) {
      console.error(`Error generating time-based route ${i + 1}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return { routes, strategies };
}
async function generateDirectionalRoutes(origin: LatLng, destination: LatLng, maxRoutes: number): Promise<{routes: EnhancedRoute[], strategies: string[]}> {
  const routes: EnhancedRoute[] = [];
  const strategies: string[] = [];
  const routeDistance = Math.sqrt(
    Math.pow(destination.latitude - origin.latitude, 2) + 
    Math.pow(destination.longitude - origin.longitude, 2)
  );
  const baseOffset = Math.max(0.004, Math.min(0.012, routeDistance * 2));
  const directions = [
    { name: 'north', lat: baseOffset * 1.2, lon: 0 },
    { name: 'south', lat: -baseOffset * 1.2, lon: 0 },
    { name: 'east', lat: 0, lon: baseOffset * 1.2 },
    { name: 'west', lat: 0, lon: -baseOffset * 1.2 },
    { name: 'northeast', lat: baseOffset * 0.8, lon: baseOffset * 0.8 },
    { name: 'northwest', lat: baseOffset * 0.8, lon: -baseOffset * 0.8 },
    { name: 'southeast', lat: -baseOffset * 0.8, lon: baseOffset * 0.8 },
    { name: 'southwest', lat: -baseOffset * 0.8, lon: -baseOffset * 0.8 },
    { name: 'far_north', lat: baseOffset * 1.8, lon: 0 },
    { name: 'far_south', lat: -baseOffset * 1.8, lon: 0 }
  ];
  const midpoint = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2
  };
  for (let i = 0; i < Math.min(directions.length, maxRoutes); i++) {
    try {
      const direction = directions[i];
      const biasWaypoint = {
        latitude: midpoint.latitude + direction.lat,
        longitude: midpoint.longitude + direction.lon
      };
      const params = new URLSearchParams({
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        waypoints: `${biasWaypoint.latitude},${biasWaypoint.longitude}`,
        mode: 'walking',
        key: GOOGLE_MAPS_API_KEY
      });
      const response = await fetch(`${DIRECTIONS_URL}?${params}`);
      const data = await response.json();
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        for (const leg of route.legs) {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        }
        const enhancedRoute: EnhancedRoute = {
          id: `directional_${direction.name}`,
          coordinates: decodePolyline(route.overview_polyline.points),
          distance_km: parseFloat((totalDistance / 1000).toFixed(2)),
          duration_minutes: Math.round(totalDuration / 60),
          route_type: 'directional_bias',
          strategy: 'directional_preference',
          summary: `${direction.name}-biased route`,
          status: 'success'
        };
        routes.push(enhancedRoute);
        strategies.push('directional_preference');
      }
    } catch (error) {
      console.error(`Error generating directional route ${i + 1}:`, error);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return { routes, strategies };
}
function filterSimilarRoutes(routes: EnhancedRoute[]): EnhancedRoute[] {
  if (routes.length <= 3) return routes; // Return all routes if 3 or fewer
  const sortedRoutes = [...routes].sort((a, b) => a.duration_minutes - b.duration_minutes);
  const diverseRoutes: EnhancedRoute[] = [];
  diverseRoutes.push(sortedRoutes[0]);
  if (sortedRoutes.length > 1) {
    diverseRoutes.push(sortedRoutes[1]);
  }
  for (let i = 2; i < sortedRoutes.length; i++) {
    const candidate = sortedRoutes[i];
      let isDiverse = true;
      for (const existingRoute of diverseRoutes) {
        const similarity = calculateRouteSimilarity(candidate, existingRoute);
        const lengthDiff = Math.abs(candidate.distance_km - existingRoute.distance_km) / Math.max(candidate.distance_km, existingRoute.distance_km);
        if (similarity > 0.6 && lengthDiff < 0.3) { // Routes are too similar in path AND length
          isDiverse = false;
          break;
        }
      }    if (isDiverse) {
      diverseRoutes.push(candidate);
    }
  }
  console.log(`🎯 Kept ${diverseRoutes.length} diverse routes from ${routes.length} total routes`);
  return diverseRoutes;
}
function calculateRouteSimilarity(route1: EnhancedRoute, route2: EnhancedRoute): number {
  const coords1 = route1.coordinates;
  const coords2 = route2.coordinates;
  if (!coords1.length || !coords2.length) return 0;
  const sampleSize = Math.min(10, Math.min(coords1.length, coords2.length));
  const step1 = Math.floor(coords1.length / sampleSize);
  const step2 = Math.floor(coords2.length / sampleSize);
  let overlapCount = 0;
  const overlapThreshold = 0.002; // ~200m tolerance
  for (let i = 0; i < coords1.length; i += step1) {
    const point1 = coords1[i];
    for (let j = 0; j < coords2.length; j += step2) {
      const point2 = coords2[j];
      const distance = Math.sqrt(
        Math.pow(point1.latitude - point2.latitude, 2) + 
        Math.pow(point1.longitude - point2.longitude, 2)
      );
      if (distance < overlapThreshold) {
        overlapCount++;
        break; // Found a match for this point, move to next
      }
    }
  }
  return overlapCount / sampleSize;
}
function generateStrategicWaypoints(origin: LatLng, destination: LatLng, count: number): LatLng[] {
  const waypoints: LatLng[] = [];
  const latDiff = destination.latitude - origin.latitude;
  const lonDiff = destination.longitude - origin.longitude;
  const routeDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  const perpLat = -lonDiff;
  const perpLon = latDiff;
  const perpDistance = Math.sqrt(perpLat * perpLat + perpLon * perpLon);
  const perpLatNorm = perpLat / perpDistance;
  const perpLonNorm = perpLon / perpDistance;
  const waypointRouteDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  const baseOffset = Math.max(0.004, Math.min(0.018, waypointRouteDistance * 2.5)); // Adaptive offset
  const wayPointConfigs = [
    { alongRoute: 0.2, lateralOffset: -baseOffset * 0.8, name: 'early_left' },
    { alongRoute: 0.2, lateralOffset: baseOffset * 0.8, name: 'early_right' },
    { alongRoute: 0.4, lateralOffset: -baseOffset * 1.2, name: 'mid_far_left' },
    { alongRoute: 0.4, lateralOffset: baseOffset * 1.2, name: 'mid_far_right' },
    { alongRoute: 0.6, lateralOffset: -baseOffset * 1.0, name: 'mid_left' },
    { alongRoute: 0.6, lateralOffset: baseOffset * 1.0, name: 'mid_right' },
    { alongRoute: 0.8, lateralOffset: -baseOffset * 0.7, name: 'late_left' },
    { alongRoute: 0.8, lateralOffset: baseOffset * 0.7, name: 'late_right' },
    { alongRoute: 0.35, lateralOffset: -baseOffset * 1.6, name: 'extreme_left' },
    { alongRoute: 0.65, lateralOffset: baseOffset * 1.6, name: 'extreme_right' },
    { alongRoute: 0.25, lateralOffset: baseOffset * 0.9, name: 'zigzag_1' },
    { alongRoute: 0.5, lateralOffset: -baseOffset * 0.9, name: 'zigzag_2' },
    { alongRoute: 0.75, lateralOffset: baseOffset * 0.6, name: 'zigzag_3' },
    { alongRoute: 0.33, lateralOffset: -baseOffset * 0.5, name: 'multi_1' },
    { alongRoute: 0.67, lateralOffset: baseOffset * 0.5, name: 'multi_2' }
  ];
  for (let i = 0; i < Math.min(count, wayPointConfigs.length); i++) {
    const config = wayPointConfigs[i];
    const alongLat = origin.latitude + (latDiff * config.alongRoute);
    const alongLon = origin.longitude + (lonDiff * config.alongRoute);
    const waypointLat = alongLat + (perpLatNorm * config.lateralOffset);
    const waypointLon = alongLon + (perpLonNorm * config.lateralOffset);
    waypoints.push({
      latitude: waypointLat,
      longitude: waypointLon
    });
  }
  return waypoints;
}
export async function testMultipleRouteGeneration(): Promise<void> {
  console.log('\n🧪 Testing Multiple Route Generation System...');
  const origin: LatLng = { latitude: 25.7617, longitude: -80.1918 }; // Downtown Miami
  const destination: LatLng = { latitude: 25.8010, longitude: -80.1993 }; // Wynwood
  const result = await generateMultipleRoutes(origin, destination, 10);
  console.log('\n📊 Route Generation Results:');
  console.log(`   Total Routes: ${result.total_routes}`);
  console.log(`   Successful: ${result.successful_routes}`);
  console.log(`   Failed: ${result.failed_routes}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Strategies Used: ${result.generation_strategies.join(', ')}`);
  console.log('\n🛣️ Route Details:');
  result.routes.forEach((route, index) => {
    if (route.status === 'success') {
      console.log(`   ${index + 1}. ${route.summary}`);
      console.log(`      Type: ${route.route_type} | Strategy: ${route.strategy}`);
      console.log(`      Distance: ${route.distance_km}km | Duration: ${route.duration_minutes}min`);
    }
  });
}
function decodePolyline(encoded: string): LatLng[] {
  const coordinates: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;
    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  return coordinates;
}