import Constants from 'expo-constants';
export const API_CONFIG = {
  GOOGLE_MAPS_API_KEY: (Constants as any).expoConfig?.extra?.googleMapsApiKey || '',
  GOOGLE_MAPS_BASE_URL: 'https://maps.googleapis.com/maps/api',
  ATHENS_OPEN_DATA: 'https://data.gov.gr/api',
};
export const API_LIMITS = {
  GOOGLE_REQUESTS_PER_MINUTE: 60,
  CACHE_DURATION_MS: 5 * 60 * 1000, 
  MAX_WAYPOINTS_PER_REQUEST: 23, 
};
export const ATHENS_BOUNDS = {
  north: 38.1,
  south: 37.85,
  east: 23.95,
  west: 23.55,
};
export function isWithinAthensBounds(lat: number, lng: number): boolean {
  return (
    lat >= ATHENS_BOUNDS.south &&
    lat <= ATHENS_BOUNDS.north &&
    lng >= ATHENS_BOUNDS.west &&
    lng <= ATHENS_BOUNDS.east
  );
}