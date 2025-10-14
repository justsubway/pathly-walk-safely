import { LatLng } from '../lib/types';

// Mock crime data for Athens - in a real app, this would come from a database or API
const ATHENS_CRIME_DATA = [
  {
    id: 'crime_1',
    type: 'theft',
    location: { latitude: 37.9755, longitude: 23.7348 },
    severity: 'low',
    timestamp: '2024-01-15T20:30:00Z',
    description: 'Petty theft reported'
  },
  {
    id: 'crime_2',
    type: 'assault',
    location: { latitude: 37.9838, longitude: 23.7275 },
    severity: 'medium',
    timestamp: '2024-01-14T22:15:00Z',
    description: 'Minor altercation'
  },
  {
    id: 'crime_3',
    type: 'theft',
    location: { latitude: 37.9755, longitude: 23.7348 },
    severity: 'low',
    timestamp: '2024-01-13T18:45:00Z',
    description: 'Pickpocketing incident'
  },
  {
    id: 'crime_4',
    type: 'vandalism',
    location: { latitude: 37.9838, longitude: 23.7275 },
    severity: 'low',
    timestamp: '2024-01-12T23:20:00Z',
    description: 'Property damage'
  },
  {
    id: 'crime_5',
    type: 'theft',
    location: { latitude: 37.9755, longitude: 23.7348 },
    severity: 'medium',
    timestamp: '2024-01-11T21:10:00Z',
    description: 'Bag snatching'
  }
];

// Athens high-risk areas (simplified)
const HIGH_RISK_AREAS = [
  { center: { latitude: 37.9755, longitude: 23.7348 }, radius: 0.005 }, // Syntagma area
  { center: { latitude: 37.9838, longitude: 23.7275 }, radius: 0.003 }, // Omonia area
];

export interface CrimeIncident {
  id: string;
  type: string;
  location: LatLng;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  description: string;
}

export class CrimeDataService {
  private crimeData: CrimeIncident[] = [];
  private isLoaded = false;

  async loadCrimeData(): Promise<boolean> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.crimeData = ATHENS_CRIME_DATA;
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Error loading crime data:', error);
      return false;
    }
  }

  getLocationSafetyScore(location: LatLng, hour: number): number {
    if (!this.isLoaded) {
      return 75; // Default safe score if no data
    }

    // Simplified and faster calculation
    let safetyScore = 85; // Start with good baseline

    // Quick time-based adjustment (most important factor)
    if (hour >= 22 || hour <= 5) {
      safetyScore -= 15; // Night time
    } else if (hour >= 18 && hour <= 21) {
      safetyScore -= 8; // Evening
    } else if (hour >= 6 && hour <= 9) {
      safetyScore += 5; // Morning rush - safer
    }

    // Quick high-risk area check (simplified)
    const isInHighRiskArea = HIGH_RISK_AREAS.some(area => {
      const latDiff = Math.abs(location.latitude - area.center.latitude);
      const lngDiff = Math.abs(location.longitude - area.center.longitude);
      return latDiff < area.radius && lngDiff < area.radius;
    });
    
    if (isInHighRiskArea) {
      safetyScore -= 10;
    }

    // Only check for very recent crimes (last 3 days) for performance
    const recentCrimes = this.crimeData.filter(crime => {
      const crimeDate = new Date(crime.timestamp);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return crimeDate > threeDaysAgo;
    });

    // Quick nearby crime check (simplified distance calculation)
    const nearbyCrimes = recentCrimes.filter(crime => {
      const latDiff = Math.abs(location.latitude - crime.location.latitude);
      const lngDiff = Math.abs(location.longitude - crime.location.longitude);
      return latDiff < 0.01 && lngDiff < 0.01; // ~1km radius
    });

    // Simple penalty based on crime count
    safetyScore -= nearbyCrimes.length * 3;

    return Math.max(20, Math.min(100, Math.round(safetyScore)));
  }

  getNearbyCrimes(location: LatLng, radiusKm: number): CrimeIncident[] {
    return this.crimeData.filter(crime => 
      this.calculateDistance(location, crime.location) <= radiusKm
    );
  }

  getCrimeStatsForArea(center: LatLng, radiusKm: number): {
    totalIncidents: number;
    recentIncidents: number;
    severityBreakdown: { low: number; medium: number; high: number };
  } {
    const nearbyCrimes = this.getNearbyCrimes(center, radiusKm);
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7); // Last 7 days

    const recentIncidents = nearbyCrimes.filter(crime => 
      new Date(crime.timestamp) > recentDate
    );

    const severityBreakdown = nearbyCrimes.reduce((acc, crime) => {
      acc[crime.severity]++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    return {
      totalIncidents: nearbyCrimes.length,
      recentIncidents: recentIncidents.length,
      severityBreakdown
    };
  }

  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);
    const lat1 = this.toRad(point1.latitude);
    const lat2 = this.toRad(point2.latitude);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private getTimeMultiplier(timestamp: string, currentHour: number): number {
    const crimeTime = new Date(timestamp).getHours();
    const timeDiff = Math.abs(crimeTime - currentHour);
    
    // If crime happened at similar time, it's more relevant
    if (timeDiff <= 2) return 1.5;
    if (timeDiff <= 6) return 1.0;
    return 0.5;
  }
}

export const crimeDataService = new CrimeDataService();