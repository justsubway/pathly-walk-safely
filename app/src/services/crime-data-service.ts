import { CrimeIncident } from '../lib/types';
import { API_CONFIG, MIAMI_BOUNDS } from './api-config';
interface MiamiCrimeResponse {
  type: string;
  case_number: string;
  case_date: string;
  case_location: string;
  incident_type: string;
  incident_category: string;
  latitude?: string;
  longitude?: string;
  x_coordinate?: string;
  y_coordinate?: string;
}
const crimeDataCache = new Map<string, { data: CrimeIncident[]; timestamp: number }>();
const CRIME_CACHE_DURATION = 30 * 60 * 1000; 
const CRIME_RISK_MAPPING: Record<string, number> = {
  'ROBBERY': 0.9,
  'ASSAULT': 0.8,
  'BURGLARY': 0.7,
  'THEFT': 0.6,
  'VEHICLE THEFT': 0.7,
  'VANDALISM': 0.4,
  'DRUG OFFENSE': 0.5,
  'DOMESTIC VIOLENCE': 0.8,
  'WEAPON OFFENSE': 0.9,
  'FRAUD': 0.3,
  'TRESPASSING': 0.4,
  'DISORDERLY CONDUCT': 0.3,
  'DEFAULT': 0.5,
};
export async function fetchMiamiCrimeData(
  days: number = 30
): Promise<CrimeIncident[]> {
  const cacheKey = `crime-data-${days}`;
  const cached = crimeDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CRIME_CACHE_DURATION) {
    return cached.data;
  }
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const params = new URLSearchParams({
      '$where': `case_date between '${startDateStr}' and '${endDateStr}' AND latitude IS NOT NULL AND longitude IS NOT NULL`,
      '$limit': '10000',
      '$order': 'case_date DESC',
    });
    const url = `${API_CONFIG.MIAMI_CRIME_API}/6kup-aecr.json?${params}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Miami Crime API error: ${response.status}`);
    }
    const rawData: MiamiCrimeResponse[] = await response.json();
    const crimeIncidents: CrimeIncident[] = rawData
      .filter(item => {
        const lat = parseFloat(item.latitude || '0');
        const lng = parseFloat(item.longitude || '0');
        return lat !== 0 && lng !== 0 &&
               lat >= MIAMI_BOUNDS.south && lat <= MIAMI_BOUNDS.north &&
               lng >= MIAMI_BOUNDS.west && lng <= MIAMI_BOUNDS.east;
      })
      .map((item, index) => {
        const lat = parseFloat(item.latitude!);
        const lng = parseFloat(item.longitude!);
        const timestamp = new Date(item.case_date).getTime();
        const date = new Date(timestamp);
        const dayOfWeek = date.getDay(); 
        const hourOfDay = date.getHours();
        const hourOfWeek = dayOfWeek * 24 + hourOfDay;
        const gridSize = 0.001; 
        const gridLat = Math.floor(lat / gridSize);
        const gridLng = Math.floor(lng / gridSize);
        const gridId = `${gridLat}_${gridLng}`;
        return {
          id: item.case_number || `crime-${index}`,
          lat,
          lon: lng,
          timestamp,
          category: item.incident_category || item.incident_type || 'UNKNOWN',
          hourOfWeek,
          gridId,
        };
      });
    crimeDataCache.set(cacheKey, {
      data: crimeIncidents,
      timestamp: Date.now(),
    });
    return crimeIncidents;
  } catch (error) {
    console.error('Error fetching Miami crime data:', error);
    console.warn('Falling back to mock crime data');
    return generateFallbackCrimeData();
  }
}
export function calculateCrimeRisk(
  lat: number,
  lng: number,
  hourOfWeek: number,
  crimeData: CrimeIncident[],
  radiusKm: number = 0.5
): number {
  if (!crimeData.length) return 0.3;
  const relevantCrimes = crimeData.filter(crime => {
    const distance = calculateHaversineDistance(lat, lng, crime.lat, crime.lon);
    if (distance > radiusKm) return false;
    const crimeHour = crime.hourOfWeek % 24;
    const targetHour = hourOfWeek % 24;
    const hourDiff = Math.abs(crimeHour - targetHour);
    const hourMatch = hourDiff <= 2 || hourDiff >= 22; 
    return hourMatch;
  });
  if (relevantCrimes.length === 0) return 0.1; 
  let totalRisk = 0;
  let totalWeight = 0;
  relevantCrimes.forEach(crime => {
    const distance = calculateHaversineDistance(lat, lng, crime.lat, crime.lon);
    const distanceWeight = Math.max(0.1, 1 - (distance / radiusKm));
    const daysSince = (Date.now() - crime.timestamp) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0.1, 1 - (daysSince / 30)); 
    const crimeRisk = CRIME_RISK_MAPPING[crime.category.toUpperCase()] || CRIME_RISK_MAPPING.DEFAULT;
    const weight = distanceWeight * timeWeight;
    totalRisk += crimeRisk * weight;
    totalWeight += weight;
  });
  const averageRisk = totalWeight > 0 ? totalRisk / totalWeight : 0.3;
  const crimeCount = relevantCrimes.length;
  const densityMultiplier = Math.min(2.0, 1 + (crimeCount / 10)); 
  return Math.min(1.0, averageRisk * densityMultiplier);
}
function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function generateFallbackCrimeData(): CrimeIncident[] {
  const mockCrimes: CrimeIncident[] = [];
  const crimeTypes = Object.keys(CRIME_RISK_MAPPING).filter(key => key !== 'DEFAULT');
  for (let i = 0; i < 100; i++) {
    const lat = MIAMI_BOUNDS.south + Math.random() * (MIAMI_BOUNDS.north - MIAMI_BOUNDS.south);
    const lng = MIAMI_BOUNDS.west + Math.random() * (MIAMI_BOUNDS.east - MIAMI_BOUNDS.west);
    const timestamp = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; 
    const date = new Date(timestamp);
    const hourOfWeek = date.getDay() * 24 + date.getHours();
    const gridSize = 0.001;
    const gridLat = Math.floor(lat / gridSize);
    const gridLng = Math.floor(lng / gridSize);
    const gridId = `${gridLat}_${gridLng}`;
    mockCrimes.push({
      id: `mock-crime-${i}`,
      lat,
      lon: lng,
      timestamp,
      category: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
      hourOfWeek,
      gridId,
    });
  }
  return mockCrimes;
}
export async function getCrimeHeatmapData(hourOfWeek: number): Promise<Array<{latitude: number, longitude: number, weight: number}>> {
  const crimeData = await fetchMiamiCrimeData();
  const gridCells = new Map<string, CrimeIncident[]>();
  crimeData.forEach(crime => {
    if (!gridCells.has(crime.gridId)) {
      gridCells.set(crime.gridId, []);
    }
    gridCells.get(crime.gridId)!.push(crime);
  });
  const heatmapData: Array<{latitude: number, longitude: number, weight: number}> = [];
  gridCells.forEach((crimes, gridId) => {
    if (crimes.length === 0) return;
    const avgLat = crimes.reduce((sum, crime) => sum + crime.lat, 0) / crimes.length;
    const avgLng = crimes.reduce((sum, crime) => sum + crime.lon, 0) / crimes.length;
    const risk = calculateCrimeRisk(avgLat, avgLng, hourOfWeek, crimeData);
    if (risk > 0.2) { 
      heatmapData.push({
        latitude: avgLat,
        longitude: avgLng,
        weight: risk,
      });
    }
  });
  return heatmapData;
}