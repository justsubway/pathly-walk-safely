import { LatLng, RouteResult } from '../lib/types';
const API_ENDPOINTS = [
  'http://localhost:5002',        // Web browser access
  'http://127.0.0.1:5002',       // Local loopback
  'http://10.0.0.154:5002',      // Current WiFi IP for mobile
  'http://10.108.121.139:5002'   // Backup network IP
];
const API_BASE_URL = API_ENDPOINTS[0]; // Primary endpoint
const API_TIMEOUT = 5000; // 5 second timeout (faster for demo)
interface APIRoute {
  id: string;
  name: string;
  coords: LatLng[];
  distanceKm: number;
  etaMin: number;
  safetyScore: number;
  strategy: string;
}
interface GenerateRoutesResponse {
  status: string;
  routes: APIRoute[];
  total_routes: number;
  crime_data_available: boolean;
  selected_hour: number;
}
interface SafetyResponse {
  status: string;
  safety_score: number;
  nearby_crimes_count: number;
  hour: number;
  coordinates: LatLng;
}
class PathlyAPIService {
  private baseURL: string;
  private timeout: number;
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }
  async checkHealth(): Promise<boolean> {
    for (let i = 0; i < API_ENDPOINTS.length; i++) {
      const endpoint = API_ENDPOINTS[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout per endpoint
        const response = await fetch(`${endpoint}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          this.baseURL = endpoint;
          return true;
        }
      } catch (error) {
      }
    }
    return false;
  }
  async generateRoutes(
    origin: LatLng,
    destination: LatLng,
    selectedHour: number = 12
  ): Promise<GenerateRoutesResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const response = await fetch(`${this.baseURL}/generate-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startLat: origin.latitude,
          startLng: origin.longitude,
          endLat: destination.latitude,
          endLng: destination.longitude,
          timeHour: selectedHour,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Convert the new API response format to our expected format
      const convertedResponse: GenerateRoutesResponse = {
        status: data.success ? 'success' : 'error',
        routes: data.routes || [],
        total_routes: data.total_generated || 0,
        crime_data_available: true,
        selected_hour: selectedHour,
      };
      
      return convertedResponse;
    } catch (error) {
      console.error('❌ Flask API route generation failed:', error);
      return null;
    }
  }
  async calculateSafetyScore(
    latitude: number,
    longitude: number,
    hour: number = 12
  ): Promise<SafetyResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const response = await fetch(`${this.baseURL}/api/ai-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: latitude,
          longitude: longitude,
          hour: hour,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Convert the new API response format to our expected format
      const convertedResponse: SafetyResponse = {
        status: data.success ? 'success' : 'error',
        safety_score: 100 - data.riskPercentage, // Convert risk to safety score
        nearby_crimes_count: 0, // Not provided by new API
        hour: hour,
        coordinates: { latitude, longitude },
      };
      
      return convertedResponse;
    } catch (error) {
      console.error('❌ Flask API safety calculation failed:', error);
      return null;
    }
  }
  convertAPIRoutesToRouteResults(apiRoutes: APIRoute[]): RouteResult[] {
    return apiRoutes.map(route => ({
      id: route.id,
      name: route.name,
      coords: route.coords,
      segments: [], // Not used in current UI
      distanceKm: route.distanceKm,
      etaMin: route.etaMin,
      safetyScore: route.safetyScore,
    }));
  }
  async testAPIWorkflow(): Promise<boolean> {
    try {
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        return false;
      }
      const testOrigin: LatLng = { latitude: 37.9755, longitude: 23.7348 }; // Syntagma Square, Athens
      const testDestination: LatLng = { latitude: 37.9760, longitude: 23.7280 }; // Monastiraki, Athens
      const routesResponse = await this.generateRoutes(testOrigin, testDestination, 14);
      if (!routesResponse || routesResponse.routes.length === 0) {
        return false;
      }
      const safetyResponse = await this.calculateSafetyScore(
        testOrigin.latitude,
        testDestination.longitude,
        14
      );
      if (!safetyResponse) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ API workflow test failed:', error);
      return false;
    }
  }
}
export const apiService = new PathlyAPIService();
export type { GenerateRoutesResponse, SafetyResponse, APIRoute };