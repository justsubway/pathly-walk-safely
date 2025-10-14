import { LatLng } from '../lib/types';

export interface CrimeReport {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: LatLng;
  timestamp: string;
  description: string;
  source: string;
  status: 'open' | 'closed' | 'investigating';
}

export interface CrimeStatistics {
  totalIncidents: number;
  recentIncidents: number;
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  typeBreakdown: {
    theft: number;
    assault: number;
    vandalism: number;
    robbery: number;
    other: number;
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export class RealCrimeDataService {
  private baseUrl = 'https://api.crimedata.com'; // Replace with actual API
  private apiKey = 'YOUR_CRIME_DATA_API_KEY'; // Replace with actual API key
  private cache = new Map<string, any>();
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  async loadCrimeDataForArea(center: LatLng, radiusKm: number = 2): Promise<CrimeReport[]> {
    const cacheKey = `crime_${center.latitude}_${center.longitude}_${radiusKm}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // For now, return mock data. In production, replace with real API call:
      const mockData = this.generateMockCrimeData(center, radiusKm);
      
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      
      return mockData;
    } catch (error) {
      console.error('Error loading crime data:', error);
      return this.generateMockCrimeData(center, radiusKm);
    }
  }

  async getCrimeStatistics(center: LatLng, radiusKm: number = 1): Promise<CrimeStatistics> {
    const reports = await this.loadCrimeDataForArea(center, radiusKm);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentReports = reports.filter(report => 
      new Date(report.timestamp) > oneWeekAgo
    );

    const severityBreakdown = reports.reduce((acc, report) => {
      acc[report.severity]++;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    const typeBreakdown = reports.reduce((acc, report) => {
      const type = report.type.toLowerCase();
      if (type.includes('theft') || type.includes('pickpocket')) acc.theft++;
      else if (type.includes('assault') || type.includes('battery')) acc.assault++;
      else if (type.includes('vandalism') || type.includes('damage')) acc.vandalism++;
      else if (type.includes('robbery') || type.includes('mugging')) acc.robbery++;
      else acc.other++;
      return acc;
    }, { theft: 0, assault: 0, vandalism: 0, robbery: 0, other: 0 });

    const timeDistribution = reports.reduce((acc, report) => {
      const hour = new Date(report.timestamp).getHours();
      if (hour >= 6 && hour < 12) acc.morning++;
      else if (hour >= 12 && hour < 18) acc.afternoon++;
      else if (hour >= 18 && hour < 22) acc.evening++;
      else acc.night++;
      return acc;
    }, { morning: 0, afternoon: 0, evening: 0, night: 0 });

    return {
      totalIncidents: reports.length,
      recentIncidents: recentReports.length,
      severityBreakdown,
      typeBreakdown,
      timeDistribution
    };
  }

  async getLocationSafetyScore(location: LatLng, hour: number): Promise<number> {
    const reports = await this.loadCrimeDataForArea(location, 0.5); // 500m radius
    let score = 100; // Start with perfect score

    for (const report of reports) {
      const distance = this.calculateDistance(location, report.location);
      const severityMultiplier = report.severity === 'high' ? 3 : report.severity === 'medium' ? 2 : 1;
      const timeRelevance = this.getTimeRelevance(report.timestamp, hour);
      const distanceFactor = Math.max(0, 1 - (distance / 0.5)); // 500m max influence
      
      score -= severityMultiplier * timeRelevance * distanceFactor * 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateMockCrimeData(center: LatLng, radiusKm: number): CrimeReport[] {
    const reports: CrimeReport[] = [];
    const incidentCount = Math.floor(Math.random() * 15) + 5; // 5-20 incidents
    
    const crimeTypes = [
      'Theft', 'Pickpocketing', 'Assault', 'Vandalism', 'Robbery', 
      'Burglary', 'Drug-related', 'Public Disorder'
    ];
    
    const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const sources = ['Police Report', 'Citizen Report', 'Security Camera', 'Witness Account'];
    const statuses: ('open' | 'closed' | 'investigating')[] = ['open', 'closed', 'investigating'];

    for (let i = 0; i < incidentCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radiusKm;
      const latOffset = (distance / 111) * Math.cos(angle); // Rough km to lat conversion
      const lngOffset = (distance / (111 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(angle);
      
      const incidentDate = new Date();
      incidentDate.setDate(incidentDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      incidentDate.setHours(Math.floor(Math.random() * 24));
      incidentDate.setMinutes(Math.floor(Math.random() * 60));

      reports.push({
        id: `crime_${Date.now()}_${i}`,
        type: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        location: {
          latitude: center.latitude + latOffset,
          longitude: center.longitude + lngOffset
        },
        timestamp: incidentDate.toISOString(),
        description: this.generateCrimeDescription(),
        source: sources[Math.floor(Math.random() * sources.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }

    return reports;
  }

  private generateCrimeDescription(): string {
    const descriptions = [
      'Suspicious activity reported',
      'Property damage observed',
      'Theft incident occurred',
      'Altercation between individuals',
      'Vandalism to public property',
      'Robbery attempt reported',
      'Drug activity suspected',
      'Public disturbance reported'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
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

  private getTimeRelevance(timestamp: string, currentHour: number): number {
    const incidentHour = new Date(timestamp).getHours();
    const timeDiff = Math.abs(incidentHour - currentHour);
    
    // More relevant if incident happened at similar time
    if (timeDiff <= 2) return 1.0;
    if (timeDiff <= 6) return 0.7;
    return 0.3;
  }

  // Method to integrate with real crime data APIs
  private async fetchRealCrimeData(center: LatLng, radiusKm: number): Promise<CrimeReport[]> {
    // Example integration with real APIs:
    // - FBI Crime Data API
    // - Local police department APIs
    // - OpenStreetMap crime data
    // - Commercial crime data providers
    
    const url = `${this.baseUrl}/incidents?lat=${center.latitude}&lng=${center.longitude}&radius=${radiusKm}&key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      return data.incidents.map((incident: any) => ({
        id: incident.id,
        type: incident.type,
        severity: this.mapSeverity(incident.severity),
        location: {
          latitude: incident.latitude,
          longitude: incident.longitude
        },
        timestamp: incident.timestamp,
        description: incident.description,
        source: incident.source || 'Police Database',
        status: incident.status || 'open'
      }));
    } catch (error) {
      console.error('Real crime data fetch failed:', error);
      throw error;
    }
  }

  private mapSeverity(apiSeverity: string): 'low' | 'medium' | 'high' {
    const severityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
      'minor': 'low',
      'moderate': 'medium',
      'major': 'high',
      '1': 'low',
      '2': 'medium',
      '3': 'high'
    };
    
    return severityMap[apiSeverity.toLowerCase()] || 'medium';
  }
}

export const realCrimeDataService = new RealCrimeDataService();





