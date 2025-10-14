import { RouteResult, LatLng } from '../lib/types';

// Simple mock route generation for Athens
export function generateSimpleRoutes(origin: LatLng, destination: LatLng): RouteResult[] {
  const routes: RouteResult[] = [];
  
  // Generate 3 different route options
  for (let i = 0; i < 3; i++) {
    const routeId = `route_${i + 1}`;
    const safetyScore = Math.random() * 40 + 60; // 60-100 safety score
    const duration = Math.random() * 20 + 10; // 10-30 minutes
    
    // Create a simple straight-line route with some variation
    const coords: LatLng[] = [];
    const steps = 10;
    
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const lat = origin.latitude + (destination.latitude - origin.latitude) * t;
      const lng = origin.longitude + (destination.longitude - origin.longitude) * t;
      
      // Add some variation to make it look like a real route
      const variation = (Math.sin(t * Math.PI) * 0.001) * (i + 1);
      coords.push({
        latitude: lat + variation,
        longitude: lng + variation * 0.5
      });
    }
    
    routes.push({
      id: routeId,
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
        totalIncidents: Math.floor(Math.random() * 5),
        riskLevel: safetyScore < 80 ? 'medium' : 'low'
      }
    });
  }
  
  return routes;
}





